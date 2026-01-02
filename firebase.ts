
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração fornecida pelo usuário
const firebaseConfig = {
  apiKey: "AIzaSyARKAlgm0NNU2tEw3QZb-r2WWV2w7AiPH8",
  authDomain: "g-shiftflow.firebaseapp.com",
  projectId: "g-shiftflow",
  storageBucket: "g-shiftflow.firebasestorage.app",
  messagingSenderId: "343273018072",
  appId: "1:343273018072:web:4b097fdea288a3228bbdad",
  measurementId: "G-L1LQ8SYT6S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
