// Importa las instancias de autenticación y base de datos desde la configuración modular de Firebase
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Escucha los cambios en el estado de autenticación de Firebase
onAuthStateChanged(auth, async (user) => {
    // Hace visible el contenido principal de la interfaz al verificar el estado
    const ocultoDiv = document.getElementById("oculto");
    if (ocultoDiv) ocultoDiv.style.display = "block";

    // Si hay un usuario autenticado, verifica de forma dinámica si posee rol de administrador para mostrar su botón
    if (user) {
        try {
            const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const docRef = doc(db, "usuarios", user.uid);
            const docSnap = await getDoc(docRef);
            const btnAdmin = document.getElementById("btn-admin");
            if (docSnap.exists() && docSnap.data().rol === "admin" && btnAdmin) {
                btnAdmin.style.display = "inline-block";
            }
        } catch (e) {
            console.error("Error verificando rol:", e);
        }
    }

    // Inicia la carga de las ofertas disponibles en la tienda
    cargarOfertas();
});

// Función asíncrona para consultar y renderizar los juegos que se encuentran en oferta
async function cargarOfertas() {
    const contenedor = document.getElementById("contenido-ofertas");
    if (!contenedor) return;

    contenedor.innerHTML = "<p style='text-align: center; color: white;'>Cargando ofertas...</p>";

    try {
        // Crea una consulta a la colección "juegos" filtrando únicamente aquellos donde el campo "oferta" sea verdadero
        const q = query(collection(db, "juegos"), where("oferta", "==", true));
        const querySnapshot = await getDocs(q);
        let htmlJuegos = "";

        // Recorre los resultados de Firestore y sanitiza las comillas simples para evitar errores al inyectar en funciones inline
        querySnapshot.forEach((docSnap) => {
            const j = docSnap.data();
            const nom = (j.nombre || "").replace(/'/g, "\\'");
            const desc = (j.descripcion || "").replace(/'/g, "\\'");
            const img = (j.imagen || "").replace(/'/g, "\\'");

            htmlJuegos += `
                <li class="juego">
                    <img src="${j.imagen}" alt="${j.nombre}" class="img-juego" onerror="this.src='../imagenes/minecraft.png'">
                    <h2>${j.nombre}</h2>
                    <p>${j.descripcion}</p>
                    <p><b>$${j.precio} USD</b> <span style="color: #5cb85c;">(OFERTA)</span></p>
                    <button onclick="verDetallesJuego('${nom}', '${desc}', '${img}')">Ver Detalles</button>
                </li>
            `;
        });

        // Inserta la lista generada en el contenedor de ofertas o muestra un mensaje alternativo si no hay registros
        contenedor.innerHTML = `<ul class="lista-juegos">${htmlJuegos || "<p style='text-align: center; color: white;'>No hay ofertas disponibles en este momento.</p>"}</ul>`;
    } catch (error) {
        console.error("Error cargando ofertas:", error);
        contenedor.innerHTML = "<p style='text-align: center; color: white;'>Error al cargar las ofertas.</p>";
    }
}

// Define de forma global la función para mostrar la vista detallada de un juego seleccionado
window.verDetallesJuego = function(nombre, descripcion, imagen, precio) {
    const contenedorTienda = document.getElementById("contenido");
    const contenedorDetalles = document.getElementById("detalles-juego");

    // Oculta el contenedor de la tienda y muestra el panel de detalles del juego
    if (contenedorTienda) contenedorTienda.style.display = "none";
    if (contenedorDetalles) contenedorDetalles.style.display = "block";

    // Selecciona los elementos internos de la vista de detalles
    const elNombre = document.getElementById("detalle-nombre");
    const elDesc = document.getElementById("detalle-descripcion");
    const elImg = document.getElementById("detalle-imagen");
    const elPrecio = document.getElementById("detalle-precio");

    // Rellena la información del juego seleccionado solo si los elementos existen en el DOM
    if (elNombre) elNombre.textContent = nombre;
    if (elDesc) elDesc.textContent = descripcion;
    if (elImg) elImg.src = imagen;
    if (elPrecio) elPrecio.textContent = `Precio: $${precio} COP`;
};