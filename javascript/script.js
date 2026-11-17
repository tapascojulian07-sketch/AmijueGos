// Importa las funciones de autenticación desde el SDK de Firebase Authentication
import { auth, db } from "./firebase-config.js";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// Importa las funciones de manipulación de documentos y colecciones desde Firebase Firestore
import { 
    doc, 
    setDoc, 
    getDoc,
    updateDoc,
    arrayUnion 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. CONTROL DE VISTAS (LOGIN / REGISTRO)
// Oculta el contenedor de inicio de sesión y muestra el formulario para registrar una cuenta nueva
window.mostrarFormularioRegistro = function() {
    document.getElementById("contenedor").style.display = "none";
    document.getElementById("contenedor-registro").style.display = "block";
};

// Oculta el formulario de registro y vuelve a mostrar el contenedor principal de inicio de sesión
window.mostrarFormularioLogin = function() {
    document.getElementById("contenedor-registro").style.display = "none";
    document.getElementById("contenedor").style.display = "block";
};

// 2. DETECTOR DE ESTADO DE SESIÓN
// Escucha continuamente los cambios en la sesión activa del usuario mediante Firebase Auth
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Si hay una sesión activa, oculta los formularios de autenticación y muestra la interfaz principal
        document.getElementById("contenedor").style.display = "none";
        document.getElementById("contenedor-registro").style.display = "none";
        document.getElementById("oculto").style.display = "block";

        try {
            // Consulta los datos del perfil del usuario en Firestore utilizando su UID único
            const docRef = doc(db, "usuarios", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const datos = docSnap.data();
                const tema = datos.temaPreferido || "dark";
                document.body.className = "";
                document.body.classList.add(`theme-${tema}`);

                // --- VERIFICAR SI ES ADMIN DESDE FIRESTORE ---
                const btnAdmin = document.getElementById("btn-admin");
                if (datos.rol === "admin" && btnAdmin) {
                    btnAdmin.style.display = "inline-block"; // Muestra el botón si su rol es admin
                } else if (btnAdmin) {
                    btnAdmin.style.display = "none"; // Lo oculta si es usuario normal
                }
            }
        } catch (e) {
            console.error("Error cargando perfil:", e);
        }

        // Carga el catálogo principal de la tienda una vez validada la sesión
        mostrarTiendaPrincipal();
    } else {
        // Si no hay sesión, muestra el formulario de inicio de sesión y oculta las demás vistas
        document.getElementById("contenedor").style.display = "block";
        document.getElementById("contenedor-registro").style.display = "none";
        document.getElementById("oculto").style.display = "none";
    }
});

// 3. REGISTRO Y LOGIN
// Registra un nuevo usuario con correo y contraseña en Firebase Auth y crea su documento asociado en Firestore
window.registrarUsuario = async function() {
    const nombre = document.getElementById("reg-nombre").value.trim();
    const correo = document.getElementById("reg-correo").value.trim();
    const clave = document.getElementById("reg-clave").value;
    const tema = document.getElementById("reg-tema").value;

    if (!nombre || !correo || !clave) {
        alert("Por favor completa todos los campos.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, correo, clave);
        const user = userCredential.user;

        // Inicializa el documento del usuario en la colección "usuarios" con su respectiva información y biblioteca vacía
        await setDoc(doc(db, "usuarios", user.uid), {
            nombre: nombre,
            correo: correo,
            temaPreferido: tema,
            biblioteca: []
        });

        alert("¡Cuenta creada con éxito!");
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            alert("Este correo ya está registrado.");
        } else {
            alert("Error al registrarse: " + error.message);
        }
    }
};

// Autentica a un usuario existente empleando su correo y contraseña
window.login = async function() {
    const correo = document.getElementById("nombre").value.trim();
    const clave = document.getElementById("clave").value;

    if (!correo || !clave) {
        alert("Por favor ingresa tu correo y contraseña.");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, correo, clave);
    } catch (error) {
        alert("Correo o contraseña incorrectos.");
    }
};

// Cierra la sesión activa del usuario y recarga la página para restablecer el estado inicial
window.cerrarSesion = async function() {
    await signOut(auth);
    location.reload();
};

// 4. TIENDA Y DETALLES DINÁMICOS
window.mostrarTiendaPrincipal = async function() {
    const contenedor = document.getElementById("contenido");
    if (!contenedor) return;

    contenedor.innerHTML = "<p style='text-align: center; color: white;'>Cargando juegos...</p>";

    try {
        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const querySnapshot = await getDocs(collection(db, "juegos"));
        let htmlJuegos = "";

        // Recorre los documentos obtenidos de la colección de juegos para maquetar la vista principal de la tienda
        querySnapshot.forEach((docSnap) => {
            const j = docSnap.data();
            const nom = (j.nombre || "").replace(/'/g, "\\'");
            const desc = (j.descripcion || "").replace(/'/g, "\\'");
            const img = (j.imagen || "").replace(/'/g, "\\'");
            const precio = (j.precio || "0").toString().replace(/'/g, "\\'"); // Capturamos el precio real

            htmlJuegos += `
                <li class="juego">
                    <img src="${j.imagen}" alt="${j.nombre}" class="img-juego">
                    <h2>${j.nombre}</h2>
                    <p>${j.descripcion}</p>
                    <p><b>$${j.precio} COP</b> ${j.oferta ? '<span style="color: #5cb85c;">(OFERTA)</span>' : ''}</p>
                    <button onclick="verDetallesJuego('${nom}', '${desc}', '${img}', '${precio}')">Ver Detalles</button>
                </li>
            `;
        });

        contenedor.innerHTML = `<ul class="lista-juegos">${htmlJuegos || "<p style='text-align: center; color: white;'>No hay juegos disponibles.</p>"}</ul>`;
    } catch (error) {
        console.error("Error cargando la tienda:", error);
        contenedor.innerHTML = "<p style='text-align: center; color: white;'>Error al cargar los juegos.</p>";
    }
};

// Oculta la vista principal del catálogo y despliega los detalles específicos de un juego seleccionado
window.verDetallesJuego = function(nombre, descripcion, imagen, precio) {
    const contenedorTienda = document.getElementById("contenido");
    const contenedorDetalles = document.getElementById("detalles-juego");

    if (contenedorTienda) contenedorTienda.style.display = "none";
    if (contenedorDetalles) contenedorDetalles.style.display = "block";

    // Rellenar datos solo si los elementos existen en el HTML
    const elNombre = document.getElementById("detalle-nombre");
    const elDesc = document.getElementById("detalle-descripcion");
    const elImg = document.getElementById("detalle-imagen");
    const elPrecio = document.getElementById("detalle-precio");

    if (elNombre) elNombre.textContent = nombre;
    if (elDesc) elDesc.textContent = descripcion;
    if (elImg) elImg.src = imagen;
    if (elPrecio) elPrecio.textContent = `Precio: $${precio} COP`;
};

// Procesa una compra genérica agregando el juego directamente al arreglo de la biblioteca del usuario
window.procesarCompra = async function(nombre, descripcion, imagen) {
    const user = auth.currentUser;
    if (!user) {
        alert("Debes iniciar sesión para realizar la compra.");
        return;
    }

    const juegoObjeto = {
        nombre: nombre,
        descripcion: descripcion,
        imagen: imagen,
        fechaCompra: new Date().toISOString()
    };

    try {
        const userRef = doc(db, "usuarios", user.uid);
        await updateDoc(userRef, {
            biblioteca: arrayUnion(juegoObjeto)
        });

        alert(`¡Gracias por adquirir ${nombre}! Se ha añadido a tu biblioteca.`);
        window.location.href = 'biblioteca.html'; 
    } catch (error) {
        console.error("Error al procesar la compra:", error);
        alert("Ocurrió un error al guardar la compra en tu cuenta.");
    }
};

// Controlador de eventos para modificar el tema visual en tiempo real desde el formulario de registro o preferencias
document.addEventListener("DOMContentLoaded", () => {
    const selectTema = document.getElementById("reg-tema");
    if (selectTema) {
        selectTema.addEventListener("change", (e) => {
            const temaSeleccionado = e.target.value;
            document.body.className = ""; 
            document.body.classList.add(`theme-${temaSeleccionado}`);
        });
    }
});

// 5. PROCESAR COMPRA Y AÑADIR A BIBLIOTECA
// Procesa la compra del juego actual desde la vista de detalles y lo inserta en la biblioteca del usuario en Firestore
window.comprarJuegoActual = async function(nombre, descripcion, imagen, precio) {
    const user = auth.currentUser;
    if (!user) {
        alert("Debes iniciar sesión para comprar juegos.");
        return;
    }

    try {
        const userRef = doc(db, "usuarios", user.uid);
        await updateDoc(userRef, {
            biblioteca: arrayUnion({
                nombre: nombre,
                descripcion: descripcion,
                imagen: imagen,
                precio: precio,
                fechaCompra: new Date().toISOString()
            })
        });

        alert(`¡Has comprado "${nombre}" con éxito! Ya se añadió a tu biblioteca.`);
        
        // Regresar a la vista de la tienda
        const contenedorDetalles = document.getElementById("detalles-juego");
        const contenedorTienda = document.getElementById("contenido");
        if (contenedorDetalles) contenedorDetalles.style.display = "none";
        if (contenedorTienda) contenedorTienda.style.display = "block";
        
        mostrarTiendaPrincipal();
    } catch (error) {
        console.error("Error al procesar la compra:", error);
        alert("Hubo un error al guardar el juego en tu biblioteca.");
    }
};
document.addEventListener("DOMContentLoaded", () => {
    const temaGuardado = localStorage.getItem("amijuegos_tema");
    const fuenteGuardada = localStorage.getItem("amijuegos_fuente");

    if (temaGuardado === "light") document.body.classList.add("tema-claro");
    if (fuenteGuardada === "small") document.body.classList.add("fuente-pequena");
    if (fuenteGuardada === "large") document.body.classList.add("fuente-grande");
});
