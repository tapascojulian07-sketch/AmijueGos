import { auth, db } from "./firebase-config.js";
import { 
    onAuthStateChanged, 
    updatePassword, 
    updateProfile, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    // Referencias a los elementos del DOM
    const usernameInput = document.getElementById("username-input");
    const passwordInput = document.getElementById("cambio-contraseña");
    const themeSelect = document.getElementById("theme-select");
    const fontSizeSelect = document.getElementById("font-size-select");
    
    const saveAccountBtn = document.getElementById("save-account-button");
    const saveApparenceBtn = document.getElementById("save-button");
    const btnCerrar = document.getElementById("btn-cerrar-sesion");

    let currentUser = null;

    // 1. Verificar el estado de la sesión y cargar datos actuales
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            // Si tiene un nombre guardado en Firebase Auth, lo mostramos en el input
            if (user.displayName) {
                usernameInput.value = user.displayName;
            }

            // Cargar preferencias guardadas en Firestore si existen
            try {
                const userDocRef = doc(db, "usuarios", user.uid);
                const userSnapshot = await getDoc(userDocRef);
                if (userSnapshot.exists()) {
                    const data = userSnapshot.data();
                    if (data.tema) themeSelect.value = data.tema;
                    if (data.fontSize) fontSizeSelect.value = data.fontSize;
                }
            } catch (e) {
                console.error("Error cargando preferencias de Firestore:", e);
            }
        } else {
            // Si no hay sesión, redirigir al index
            window.location.href = "../index.html";
        }
    });

    // 2. Guardar cambios de cuenta (Nombre de usuario y Contraseña)
    if (saveAccountBtn) {
        saveAccountBtn.addEventListener("click", async () => {
            if (!currentUser) return;

            try {
                const nuevoNombre = usernameInput.value.trim();
                const nuevaClave = passwordInput.value.trim();

                // Actualizar nombre de usuario si cambió
                if (nuevoNombre && nuevoNombre !== currentUser.displayName) {
                    await updateProfile(currentUser, { displayName: nuevoNombre });
                    
                    // Opcional: Actualizar también en Firestore si guardas una colección "usuarios"
                    const userDocRef = doc(db, "usuarios", currentUser.uid);
                    await setDoc(userDocRef, { nombre: nuevoNombre }, { merge: true });
                }

                // Actualizar contraseña si el usuario escribió una nueva
                if (nuevaClave) {
                    if (nuevaClave.length < 6) {
                        alert("La contraseña debe tener al menos 6 caracteres.");
                        return;
                    }
                    await updatePassword(currentUser, nuevaClave);
                }

                alert("¡Datos de la cuenta actualizados correctamente en Firebase!");
                passwordInput.value = ""; // Limpiar campo de contraseña por seguridad
            } catch (error) {
                alert("Error al actualizar la cuenta (es posible que debas volver a iniciar sesión si la sesión es muy antigua): " + error.message);
            }
        });
    }

    // 3. Guardar cambios de apariencia (Tema y Fuente)
    if (saveApparenceBtn) {
        saveApparenceBtn.addEventListener("click", async () => {
            if (!currentUser) return;

            const temaSeleccionado = themeSelect.value;
            const fuenteSeleccionada = fontSizeSelect.value;

            try {
                // Guardar preferencias en Firestore
                const userDocRef = doc(db, "usuarios", currentUser.uid);
                await setDoc(userDocRef, { 
                    tema: temaSeleccionado, 
                    fontSize: fuenteSeleccionada 
                }, { merge: true });

                // Aplicar cambios visuales de inmediato en la página de opciones
                aplicarEstilos(temaSeleccionado, fuenteSeleccionada);

                alert("¡Ajustes de apariencia guardados!");
            } catch (error) {
                alert("Error al guardar preferencias: " + error.message);
            }
        });
    }

    // Función auxiliar para aplicar estilos visuales en tiempo real
    function aplicarEstilos(tema, fontSize) {
        // Ejemplo básico de aplicación de clases o atributos al body
        if (tema === "dark") {
            document.body.style.backgroundColor = "#121212";
            document.body.style.color = "#ffffff";
        } else {
            document.body.style.backgroundColor = "#f4f4f4";
            document.body.style.color = "#333333";
        }

        if (fontSize === "small") {
            document.body.style.fontSize = "14px";
        } else if (fontSize === "large") {
            document.body.style.fontSize = "18px";
        } else {
            document.body.style.fontSize = "16px";
        }
    }

    // 4. Cerrar Sesión
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
