// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions } from "firebase/functions";
// import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check"; // COMENTADO TEMPORALMENTE

// --- Configuración de Firebase ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// --- Validación de la Configuración ---
const requiredKeys = ['apiKey', 'authDomain', 'projectId'];
for (const key of requiredKeys) {
  if (!firebaseConfig[key]) {
    throw new Error(
      `Error de configuración de Firebase: La variable de entorno VITE_FIREBASE_${key.toUpperCase()} no está definida en tu archivo .env.local. Por favor, asegúrate de que el archivo existe y que has reiniciado el servidor de desarrollo.`
    );
  }
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// ⚠️ APP CHECK DESACTIVADO TEMPORALMENTE PARA DIAGNÓSTICO
// export const appCheck = initializeAppCheck(app, {
 //  provider: new ReCaptchaV3Provider('6Lf_hv4rAAAAANfBXaCwUZKj9oRjb0l2drJcInhP'),
  // isTokenAutoRefreshEnabled: true
// });
console.warn('⚠️ APP CHECK DESACTIVADO - SOLO PARA DIAGNÓSTICO');

// Inicializar Analytics (opcional)
let analytics = null;
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  analytics = getAnalytics(app);
}

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

// --- Conexión a Emuladores (solo en desarrollo) ---
const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';
if (import.meta.env.DEV && useEmulators) {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, "localhost", 9199);
  console.log('🔧 Conectado a Firebase Emulators');
}

export { analytics };
export default app;