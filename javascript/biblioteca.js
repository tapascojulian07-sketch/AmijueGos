// Importa las instancias de autenticación y base de datos desde la configuración modular de Firebase
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Escucha los cambios en el estado de autenticación del usuario actual
onAuthStateChanged(auth, async (user) => {
    // Busca el contenedor principal oculto para asegurarte de mostrarlo al verificar el estado
    const ocultoDiv = document.getElementById("oculto");
    if (ocultoDiv) ocultoDiv.style.display = "block";

    // Selecciona el contenedor HTML donde se listarán los juegos de la biblioteca
    const contenedorLista = document.getElementById("lista-biblioteca-juegos");
    if (!contenedorLista) return;

    // Si no hay ningún usuario autenticado, muestra un mensaje indicando que debe iniciar sesión
    if (!user) {
        contenedorLista.innerHTML = "<p>Inicia sesión para consultar tu biblioteca.</p>";
        return;
    }

    // Muestra un mensaje de carga mientras se obtienen los datos desde Firestore
    contenedorLista.innerHTML = "<p style='text-align: center; padding: 20px;'>Cargando tu biblioteca...</p>";

    try {
        // Obtiene la referencia al documento del usuario actual dentro de la colección "usuarios" usando su UID
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        // Verifica si el documento del usuario existe en la base de datos
        if (docSnap.exists()) {
            const datos = docSnap.data();
            // Extrae el arreglo de la biblioteca de juegos del usuario, o un arreglo vacío si no existe
            const juegos = datos.biblioteca || [];

            // Si el arreglo está vacío, informa al usuario que aún no ha adquirido juegos
            if (juegos.length === 0) {
                contenedorLista.innerHTML = "<p style='text-align: center;'>Aún no has comprado ningún juego.</p>";
                return;
            }

            // Recorre cada juego adquirido para construir la estructura HTML de la lista
            let htmlJuegos = "";
            juegos.forEach((j) => {
                htmlJuegos += `
                    <li class="juego">
                        <img src="${j.imagen}" alt="${j.nombre}" class="img-juego">
                        <h2>${j.nombre}</h2>
                        <p>${j.descripcion}</p>
                    </li>
                `;
            });

            // Inserta el contenido generado con los juegos en el contenedor de la interfaz
            contenedorLista.innerHTML = htmlJuegos;
        }
    } catch (error) {
        // Captura y registra cualquier error ocurrido durante la consulta a Firestore
        console.error("Error al obtener la biblioteca:", error);
        contenedorLista.innerHTML = "<p>Error al cargar la biblioteca.</p>";
    }
});