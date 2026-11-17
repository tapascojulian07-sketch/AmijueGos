// Importa los objetos de autenticación y base de datos desde la configuración modular de Firebase
import { auth, db } from "../javascript/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs, addDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Escucha los cambios de estado de autenticación del usuario actual en Firebase Auth
onAuthStateChanged(auth, async (user) => {
    const ocultoDiv = document.getElementById("oculto");
    // Si no hay ningún usuario autenticado, muestra una alerta y redirige al index
    if (!user) {
        alert("Debes iniciar sesión.");
        window.location.href = '../html/index.html';
        return;
    }

    try {
        // Busca el documento del usuario en la colección "usuarios" usando su UID
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        // Verifica si el documento existe y si el rol registrado es el de administrador
        if (docSnap.exists() && docSnap.data().rol === "admin") {
            if (ocultoDiv) ocultoDiv.style.display = "block";
            cargarJuegosAdmin();
        } else {
            // Si no es administrador, bloquea el acceso, avisa y redirige
            alert("Acceso denegado. No eres administrador.");
            window.location.href = '../html/index.html';
        }
    } catch (error) {
        console.error("Error verificando permisos:", error);
        window.location.href = '../html/index.html';
    }
});

// Define de forma global la función para cargar y listar los juegos en el panel de administración
window.cargarJuegosAdmin = async function() {
    const contenedor = document.getElementById("admin-lista-juegos");
    if (!contenedor) return;

    contenedor.innerHTML = "<p>Cargando juegos...</p>";

    try {
        // Obtiene todos los documentos de la colección "juegos" desde Firestore
        const querySnapshot = await getDocs(collection(db, "juegos"));
        let html = "";

        // Recorre cada documento de juego para construir dinámicamente los elementos de la lista
        querySnapshot.forEach((docSnap) => {
            const j = docSnap.data();
            const id = docSnap.id;

            html += `
                <li class="juego" style="margin-bottom: 15px; padding: 10px; border: 1px solid #ccc;">
                    <img src="${j.imagen}" alt="${j.nombre}" class="img-juego" style="max-width: 80px;">
                    <h3>${j.nombre}</h3>
                    <p>${j.descripcion}</p>
                    <p><b>Precio:</b> $${j.precio} COP ${j.oferta ? '(EN OFERTA)' : ''}</p>
                    <button onclick="prepararEdicion('${id}', '${j.nombre}', '${j.descripcion}', '${j.precio}', '${j.imagen}', ${j.oferta})">Editar</button>
                </li>
            `;
        });

        contenedor.innerHTML = html || "<p>No hay juegos registrados todavía.</p>";
    } catch (error) {
        console.error("Error cargando juegos:", error);
    }
};

// Define de forma global la función para guardar (crear o actualizar) un juego desde el panel de admin
window.guardarJuegoAdmin = async function() {
    // Captura los valores de los campos del formulario de administración
    const id = document.getElementById("admin-juego-id").value;
    const nombre = document.getElementById("admin-nombre").value.trim();
    const descripcion = document.getElementById("admin-descripcion").value.trim();
    const precio = document.getElementById("admin-precio").value.trim();
    const imagen = document.getElementById("admin-imagen").value.trim();
    const oferta = document.getElementById("admin-oferta").checked;

    // Validación básica para asegurar que los campos obligatorios no estén vacíos
    if (!nombre || !descripcion || !imagen) {
        alert("Por favor completa los campos principales.");
        return;
    }

    const juegoData = { nombre, descripcion, precio, imagen, oferta };

    try {
        if (id) {
            // Actualiza el documento de un juego existente dentro de la colección 'juegos'
            await updateDoc(doc(db, "juegos", id), juegoData);
            alert("¡Juego actualizado con éxito!");
        } else {
            // Crea un documento NUEVO en la colección independiente 'juegos'
            await addDoc(collection(db, "juegos"), juegoData);
            alert("¡Juego agregado con éxito a la colección 'juegos'!");
        }

        // Limpia los campos del formulario tras la operación exitosa
        document.getElementById("admin-juego-id").value = "";
        document.getElementById("admin-nombre").value = "";
        document.getElementById("admin-descripcion").value = "";
        document.getElementById("admin-precio").value = "";
        document.getElementById("admin-imagen").value = "";
        document.getElementById("admin-oferta").checked = false;
        document.getElementById("form-titulo").textContent = "Agregar Nuevo Juego";

        // Recarga la lista de juegos para reflejar los cambios
        cargarJuegosAdmin();
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Hubo un error al guardar el juego.");
    }
};

// Define de forma global la función para cargar los datos de un juego específico en el formulario para su edición
window.prepararEdicion = function(id, nombre, descripcion, precio, imagen, oferta) {
    document.getElementById("admin-juego-id").value = id;
    document.getElementById("admin-nombre").value = nombre;
    document.getElementById("admin-descripcion").value = descripcion;
    document.getElementById("admin-precio").value = precio;
    document.getElementById("admin-imagen").value = imagen;
    document.getElementById("admin-oferta").checked = oferta;
    document.getElementById("form-titulo").textContent = "Editar Juego: " + nombre;
    // Realiza un desplazamiento suave hacia la parte superior de la página para ver el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
};