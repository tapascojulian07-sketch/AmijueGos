import { auth, db } from "./firebase-config.js";
import { 
    onAuthStateChanged, 
    updatePassword, 
    updateProfile, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM cargado correctamente en options.js");

    const usernameInput = document.getElementById("username-input");
    const passwordInput = document.getElementById("cambio-contraseña");
    const themeSelect = document.getElementById("theme-select");
    const fontSizeSelect = document.getElementById("font-size-select");
    
    const saveAccountBtn = document.getElementById("save-account-button");
    const saveApparenceBtn = document.getElementById("save-button");
    const btnCerrar = document.getElementById("btn-cerrar-sesion");

    let currentUser = null;

    // 1. Verificar estado de sesión
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            console.log("Usuario autenticado detectado:", user.email);
            if (user.displayName) {
                usernameInput.value = user.displayName;
            }
        } else {
            console.log("No hay usuario autenticado. Redirigiendo...");
            window.location.href = "../index.html";
        }
    });

    // 2. Guardar cuenta
    if (saveAccountBtn) {
        saveAccountBtn.addEventListener("click", async () => {
            console.log("Botón 'Guardar cambios' de cuenta presionado");
            if (!currentUser) {
                alert("Error: No hay un usuario activo detectado.");
                return;
            }

            try {
                const nuevoNombre = usernameInput.value.trim();
                const nuevaClave = passwordInput.value.trim();

                if (nuevoNombre) {
                    await updateProfile(currentUser, { displayName: nuevoNombre });
                    console.log("Nombre actualizado en Auth:", nuevoNombre);
                }

                if (nuevaClave) {
                    if (nuevaClave.length < 6) {
                        alert("La contraseña debe tener al menos 6 caracteres.");
                        return;
                    }
                    await updatePassword(currentUser, nuevaClave);
                    console.log("Contraseña actualizada en Auth");
                }

                alert("¡Datos actualizados correctamente!");
                passwordInput.value = "";
            } catch (error) {
                console.error("Error detallado al actualizar:", error);
                alert("Error al actualizar: " + error.message);
            }
        });
    }

    // 3. Guardar apariencia
    if (saveApparenceBtn) {
        saveApparenceBtn.addEventListener("click", async () => {
            console.log("Botón de apariencia presionado");
            if (!currentUser) {
                alert("Error: No hay un usuario activo detectado.");
                return;
            }

            const temaSeleccionado = themeSelect.value;
            const fuenteSeleccionada = fontSizeSelect.value;

            try {
                const userDocRef = doc(db, "usuarios", currentUser.uid);
                await setDoc(userDocRef, { 
                    tema: temaSeleccionado, 
                    fontSize: fuenteSeleccionada 
                }, { merge: true });

                console.log("Apariencia guardada en Firestore");
                alert("¡Ajustes de apariencia guardados!");
            } catch (error) {
                console.error("Error al guardar apariencia:", error);
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
