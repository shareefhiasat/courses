import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyD9taKFsiHD16IqiOq8g22LKOkiH1Ak-7k",
  authDomain: "main-one-32026.firebaseapp.com",
  databaseURL: "https://main-one-32026-default-rtdb.firebaseio.com",
  projectId: "main-one-32026",
  storageBucket: "main-one-32026.appspot.com",
  messagingSenderId: "1070031616844",
  appId: "1:1070031616844:web:f8c4e4b2a8b8c8b8c8b8c8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
// Use initializeFirestore to improve reliability on some networks/environments
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});
export const functions = getFunctions(app, 'us-central1');
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

// Connect to emulators in local development (OPTIONAL)
// Set USE_EMULATOR=true in environment to enable
// By default, uses production Firebase even in localhost (no CORS issues!)
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const USE_EMULATOR = import.meta.env.VITE_USE_EMULATOR === 'true';

if (isLocalhost && USE_EMULATOR) {
  // Only connect if explicitly enabled
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('✅ Connected to Functions Emulator');
  } catch (e) {
    console.log('⚠️ Functions Emulator connection failed:', e.message);
  }
  
  // Uncomment these if you want to use other emulators locally:
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectStorageEmulator(storage, 'localhost', 9199);
  // connectDatabaseEmulator(rtdb, 'localhost', 9000);
} else if (isLocalhost) {
  console.log('🌐 Using production Firebase (no emulator)');
}

export default app;
