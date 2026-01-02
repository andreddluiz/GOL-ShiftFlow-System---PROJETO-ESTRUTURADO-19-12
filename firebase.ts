
/**
 * firebase.ts
 * Configuração e inicialização centralizada do Firebase para o sistema GOL ShiftFlow.
 * Gerencia Autenticação, Banco de Dados Firestore e Persistência Offline.
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Configuração oficial obtida do Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBRPRWG8c2UxofMonRgYQQEQgCH_wtWBNI",
  authDomain: "gsiftflow.firebaseapp.com",
  projectId: "gsiftflow",
  storageBucket: "gsiftflow.firebasestorage.app",
  messagingSenderId: "750336729358",
  appId: "1:750336729358:web:2be454d2c580a833f2375f",
  measurementId: "G-5ST69V09Y5"
};

// 1. Inicializa o Core da Aplicação Firebase
const app = initializeApp(firebaseConfig);

// 2. Inicializa o serviço de Autenticação (Authentication)
export const auth = getAuth(app);

// 3. Inicializa o serviço de Banco de Dados (Firestore)
export const db = getFirestore(app);

/**
 * 4. Configuração de Persistência Offline
 * Permite que o sistema continue operando e salvando dados mesmo sem conexão com a internet.
 * Os dados são sincronizados automaticamente assim que o dispositivo volta a ficar online.
 */
enableIndexedDbPersistence(db)
  .then(() => {
    console.log('✅ Firebase Cloud: Persistência offline ativada com sucesso');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Ocorre quando múltiplas abas do sistema estão abertas ao mesmo tempo
      console.warn('⚠️ Firebase Warning: Múltiplas abas abertas detectadas. A persistência offline funcionará apenas na primeira aba.');
    } else if (err.code === 'unimplemented') {
      // Ocorre em navegadores muito antigos ou modo de navegação privada extrema
      console.warn('⚠️ Firebase Warning: O navegador atual não suporta persistência de dados local.');
    } else {
      console.error('❌ Firebase Error: Erro desconhecido ao ativar persistência offline:', err);
    }
  });

// Logs de monitoramento do ambiente
console.log('🚀 GOL ShiftFlow: Firebase Core Inicializado');
console.log(`📊 Conectado ao Projeto: ${firebaseConfig.projectId}`);

// Exportação padrão do app inicializado
export { app };
