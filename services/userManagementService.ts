
import { 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  getAuth,
  signOut
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  query, 
  serverTimestamp
} from 'firebase/firestore';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { auth, db } from '../firebase';

// Configuração idêntica à principal para a instância secundária
const firebaseConfig = {
  apiKey: "AIzaSyBRPRWG8c2UxofMonRgYQQEQgCH_wtWBNI",
  authDomain: "gsiftflow.firebaseapp.com",
  projectId: "gsiftflow",
  storageBucket: "gsiftflow.firebasestorage.app",
  messagingSenderId: "750336729358",
  appId: "1:750336729358:web:2be454d2c580a833f2375f",
};

// Inicializa app secundário para gerenciar usuários sem afetar a sessão do Admin logado
const secondaryApp = getApps().find(app => app.name === 'UserCreator') 
  || initializeApp(firebaseConfig, 'UserCreator');
const secondaryAuth = getAuth(secondaryApp);

export interface UserProfileV2 {
  uid: string;
  email: string;
  name: string;
  bases: string[];
  permissionLevel: string;
  jornada: string;
  tipoJornada: string;
  active: boolean;
  createdAt?: any;
  createdBy?: string;
  updatedAt?: any;
  updatedBy?: string;
}

/**
 * Cria usuário no Auth e Perfil no Firestore
 */
export const createUserInFirebase = async (userData: Omit<UserProfileV2, 'uid'>, adminEmail: string) => {
  try {
    console.log(`[UserManagement] Solicitando criação para: ${userData.email}`);
    
    // 1. Gerar senha temporária
    const tempPassword = 'Gol' + Math.floor(1000 + Math.random() * 9000) + '!';
    
    // 2. Criar no Auth usando a instância secundária (evita deslogar o admin)
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, tempPassword);
    const uid = userCredential.user.uid;

    // 3. Salvar no Firestore
    const userRef = doc(db, 'users_v2', uid);
    await setDoc(userRef, {
      ...userData,
      uid,
      createdAt: serverTimestamp(),
      createdBy: adminEmail,
      updatedAt: serverTimestamp(),
    });

    // 4. Limpar sessão da instância secundária
    await signOut(secondaryAuth);

    console.log(`✅ [UserManagement] Sucesso: ${uid}`);
    return { success: true, uid, tempPassword };
  } catch (error: any) {
    console.error('❌ [UserManagement] Erro:', error);
    let errorMsg = error.message;
    if (error.code === 'auth/email-already-in-use') errorMsg = 'Este e-mail já está em uso no sistema.';
    return { success: false, error: errorMsg };
  }
};

/**
 * Lista todos os usuários reais do Firestore com fallbacks de segurança
 */
export const listAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users_v2'));
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        uid: doc.id,
        bases: Array.isArray(data.bases) ? data.bases : [],
        name: data.name || 'Sem Nome',
        active: data.active !== false,
        permissionLevel: data.permissionLevel || 'OPERACIONAL',
        jornada: data.jornada || '6'
      } as UserProfileV2;
    });
    return { success: true, users };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Atualiza perfil existente
 */
export const updateUserInFirebase = async (uid: string, updates: Partial<UserProfileV2>, adminEmail: string) => {
  try {
    const userRef = doc(db, 'users_v2', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: adminEmail
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Soft Delete / Toggle Status
 */
export const toggleUserStatus = async (uid: string, currentStatus: boolean, adminEmail: string) => {
  try {
    const userRef = doc(db, 'users_v2', uid);
    await updateDoc(userRef, {
      active: !currentStatus,
      updatedAt: serverTimestamp(),
      updatedBy: adminEmail
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Recuperação de Senha
 */
export const resetUserPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
