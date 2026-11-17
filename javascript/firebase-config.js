// Importar los módulos usando las URLs del CDN para el navegador
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAznwzymUkT4m1C8QXl3yztl75QP8paR7g",
  authDomain: "amijuegos-be148.firebaseapp.com",
  projectId: "amijuegos-be148",
  storageBucket: "amijuegos-be148.firebasestorage.app",
  messagingSenderId: "72465931277",
  appId: "1:72465931277:web:e8ebeb73074895989f8944"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar los servicios para usarlos en script.js
export const auth = getAuth(app);
export const db = getFirestore(app);