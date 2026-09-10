import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBO8OsYvdIuabxR2U4YaKtBZwBYsewpcK0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cafeteria-patagonia.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cafeteria-patagonia",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cafeteria-patagonia.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "331542426066",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:331542426066:web:02405728791d014281d80b"
};

let app;
let db = null;
let isFirebaseConfigured = false;

// Verificamos que al menos la API Key y el Project ID estén definidos
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseConfigured = true;
    console.log("🔥 Firebase Firestore inicializado correctamente.");
  } catch (error) {
    console.error("❌ Error al inicializar Firebase:", error);
  }
} else {
  console.warn(
    "⚠️ Firebase no está configurado. Completa las variables de entorno en tu archivo .env local para habilitar la base de datos en tiempo real. La aplicación funcionará en modo local/offline."
  );
}

export { db, isFirebaseConfigured };
