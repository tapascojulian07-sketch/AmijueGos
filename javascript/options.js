import { auth, db } from "./firebase-config.js";
import { 
    onAuthStateChanged, 
    updatePassword, 
    updateProfile, 
    EmailAuthProvider,
    reauthenticateWithCredential,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Función reutilizable para aplicar las clases CSS al body
function aplicarPreferenciasVisuales(tema, fuente) {
    // Limpiar clases anteriores
    document.body.classList.remove("tema-claro", "fuente-pequena", "fuente-mediana", "fuente-grande");

    // Aplicar tema
    if (tema === "light") {
        document.body.classList.add("tema-claro");
    }

    // Aplicar tamaño de fuente
    if (fuente === "small") {
        document.body.classList.add("fuente-pequena");
    } else if (fuente === "large") {
        document.body.classList.add("fuente-grande");
    } else {
        document.body.classList.add("fuente-mediana");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const usernameInput = document.getElementById("username-input");
    const passwordInput = document.getElementById("cambio-contraseña");
    const themeSelect = document.getElementById("theme-select");
    const fontSizeSelect = document.getElementById("font-size-select");
    
    const saveAccountBtn = document.getElementById("save-account-button");
    const saveApparenceBtn = document.getElementById("save-button");
    const btnCerrar = document.getElementById("btn-cerrar-sesion");

    let currentUser = null;

    // Cargar preferencias locales de inmediato si existen
    const temaLocal = localStorage.getItem("amijuegos_tema") || "dark";
    const fuenteLocal = localStorage.getItem("amijuegos_fuente") || "medium";
    aplicarPreferenciasVisuales(temaLocal, fuenteLocal);

    // 1. Verificar sesión y sincronizar datos desde Firebase
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            if (user.displayName) {
                usernameInput.value = user.displayName;
            }

            try {
                const userDocRef = doc(db, "usuarios", user.uid);
                const userSnapshot = await getDoc(userDocRef);
                if (userSnapshot.exists()) {
                    const data = userSnapshot.data();
                    const temaDB = data.tema || "dark";
                    const fuenteDB = data.fontSize || "medium";

                    themeSelect.value = temaDB;
                    fontSizeSelect.value = fuenteDB;

                    // Aplicar y actualizar respaldo local
                    aplicarPreferenciasVisuales(temaDB, fuenteDB);
                    localStorage.setItem("amijuegos_tema", temaDB);
                    localStorage.setItem("amijuegos_fuente", fuenteDB);
                }
            } catch (error) {
                console.error("Error cargando preferencias:", error);
            }
        } else {
            window.location.href = "../index.html";
        }
    });

    // 2. Guardar cambios de cuenta (con soporte para cuentas antiguas)
    if (saveAccountBtn) {
        saveAccountBtn.addEventListener("click", async () => {
            if (!currentUser) return;

            const nuevoNombre = usernameInput.value.trim();
            const nuevaClave = passwordInput.value.trim();

            try {
                if (nuevoNombre && nuevoNombre !== currentUser.displayName) {
                    await updateProfile(currentUser, { displayName: nuevoNombre });
                    await setDoc(doc(db, "usuarios", currentUser.uid), { nombre: nuevoNombre }, { merge: true });
                }

                if (nuevaClave) {
                    if (nuevaClave.length < 6) {
                        alert("La contraseña debe tener al menos 6 caracteres.");
                        return;
                    }
                    await updatePassword(currentUser, nuevaClave);
                }

                alert("¡Datos de la cuenta actualizados correctamente!");
                passwordInput.value = "";

            } catch (error) {
                if (error.code === "auth/requires-recent-login") {
                    const claveActual = prompt("Por seguridad, ingresa tu contraseña actual para confirmar los cambios:");
                    if (claveActual) {
                        try {
                            const credential = EmailAuthProvider.credential(currentUser.email, claveActual);
                            await reauthenticateWithCredential(currentUser, credential);
                            if (nuevaClave) {
                                await updatePassword(currentUser, nuevaClave);
                            }
                            alert("¡Contraseña actualizada correctamente tras verificar tu identidad!");
                            passwordInput.value = "";
                        } catch (reauthError) {
                            alert("Contraseña actual incorrecta. No se realizaron los cambios.");
                        }
                    }
                } else {
                    alert("Error al actualizar: " + error.message);
                }
            }
        });
    }

    // 3. Guardar y aplicar cambios de apariencia
    if (saveApparenceBtn) {
        saveApparenceBtn.addEventListener("click", async () => {
            if (!currentUser) return;

            const temaSeleccionado = themeSelect.value;
            const fuenteSeleccionada = fontSizeSelect.value;

            try {
                // Guardar en Firestore
                await setDoc(doc(db, "usuarios", currentUser.uid), { 
                    tema: temaSeleccionado, 
                    fontSize: fuenteSeleccionada 
                }, { merge: true });

                // Guardar localmente y aplicar al instante
                localStorage.setItem("amijuegos_tema", temaSeleccionado);
                localStorage.setItem("amijuegos_fuente", fuenteSeleccionada);
                aplicarPreferenciasVisuales(temaSeleccionado, fuenteSeleccionada);

                alert("¡Ajustes de apariencia guardados y aplicados!");
            } catch (error) {
                alert("Error al guardar preferencias: " + error.message);
            }
        });
    }

    // 4. Cerrar sesión
    if (btnCerrar) {
        btnCerrar.addEventListener("click", async () => {
            try {
                await signOut(auth);
                alert("Sesión cerrada correctamente.");
                window.location.href = "../index.html";
            } catch (error) {
                alert("Error al cerrar sesión: " + error.message);
            }
        });
    }
});
