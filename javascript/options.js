import { auth } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const btnCerrar = document.getElementById("btn-cerrar-sesion");

    if (btnCerrar) {
        btnCerrar.addEventListener("click", async () => {
            try {
                // Cierra la sesión activa en Firebase sin eliminar datos
                await signOut(auth);
                alert("Sesión cerrada correctamente.");
                // Redirige al menú principal (login)
                window.location.href = "../index.html";
            } catch (error) {
                alert("Error al cerrar sesión: " + error.message);
            }
        });
    }
});
