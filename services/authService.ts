
import { Usuario, UsuarioAutenticado, UsuarioBase } from '../types';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface CredenciaisLogin {
  email: string;
  senha: string;
  nome?: string; // Usado apenas no cadastro
}

class AuthService {
  private chaveUsuarioAutenticado = 'gol_usuario_autenticado';

  /**
   * Realiza login no Firebase e busca o perfil no Firestore
   */
  async fazerLogin(credenciais: CredenciaisLogin): Promise<UsuarioAutenticado | null> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credenciais.email, credenciais.senha);
      const user = userCredential.user;
      
      return await this.obterPerfilEGravarLocal(user);
    } catch (error: any) {
      console.error("Erro no login Firebase:", error.code);
      throw error;
    }
  }

  /**
   * Cria uma nova conta e inicializa o perfil no Firestore
   */
  async criarConta(credenciais: CredenciaisLogin): Promise<UsuarioAutenticado | null> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, credenciais.email, credenciais.senha);
      const user = userCredential.user;

      const agora = new Date().toISOString();
      const novoUsuarioFirestore: Omit<Usuario, 'senha'> = {
        id: user.uid,
        nome: credenciais.nome || 'Novo Usuário',
        email: credenciais.email,
        ativo: true,
        dataCriacao: agora,
        dataAtualizacao: agora,
        basesAssociadas: [] // Inicialmente sem bases, admin deve atribuir
      };

      // Grava perfil no Firestore
      await setDoc(doc(db, 'usuarios', user.uid), novoUsuarioFirestore);

      return await this.obterPerfilEGravarLocal(user);
    } catch (error: any) {
      console.error("Erro ao criar conta:", error.code);
      throw error;
    }
  }

  /**
   * Busca dados do Firestore para completar o objeto de usuário autenticado
   */
  private async obterPerfilEGravarLocal(fbUser: FirebaseUser): Promise<UsuarioAutenticado | null> {
    const docRef = doc(db, 'usuarios', fbUser.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as Usuario;
      
      // Determina o maior perfil para o contexto global
      let perfilMaior = 'OPERACIONAL';
      const hierarquia = { OPERACIONAL: 0, ANALISTA: 1, LÍDER: 2, ADMINISTRADOR: 3 };

      data.basesAssociadas?.forEach(base => {
        const nivel = base.nivelAcesso as keyof typeof hierarquia;
        if (hierarquia[nivel] > hierarquia[perfilMaior as keyof typeof hierarquia]) {
          perfilMaior = base.nivelAcesso;
        }
      });

      // Se for o admin mestre (configurado manualmente no console ou primeira conta)
      if (fbUser.email === 'admin@gol.com') perfilMaior = 'ADMINISTRADOR';

      const usuarioAutenticado: UsuarioAutenticado = {
        id: data.id,
        email: data.email,
        nome: data.nome,
        perfil: perfilMaior,
        basesAssociadas: data.basesAssociadas || [],
        baseAtual: data.basesAssociadas?.[0]?.baseId || '',
      };

      localStorage.setItem(this.chaveUsuarioAutenticado, JSON.stringify(usuarioAutenticado));
      return usuarioAutenticado;
    }
    
    return null;
  }

  /**
   * Observer para mudanças no estado de autenticação (usado no App.tsx)
   */
  observarAutenticacao(callback: (user: UsuarioAutenticado | null) => void) {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const user = await this.obterPerfilEGravarLocal(fbUser);
        callback(user);
      } else {
        localStorage.removeItem(this.chaveUsuarioAutenticado);
        callback(null);
      }
    });
  }

  async fazerLogout(): Promise<void> {
    await signOut(auth);
    localStorage.removeItem(this.chaveUsuarioAutenticado);
  }

  obterUsuarioAutenticado(): UsuarioAutenticado | null {
    try {
      const u = localStorage.getItem(this.chaveUsuarioAutenticado);
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }

  async listarUsuarios(): Promise<Usuario[]> {
    const querySnapshot = await getDocs(collection(db, 'usuarios'));
    return querySnapshot.docs.map(doc => doc.data() as Usuario);
  }

  async atualizarUsuario(u: Usuario): Promise<boolean> {
    try {
      const userRef = doc(db, 'usuarios', u.id);
      await updateDoc(userRef, {
        nome: u.nome,
        basesAssociadas: u.basesAssociadas,
        ativo: u.ativo,
        dataAtualizacao: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error("Erro ao atualizar no Firestore:", error);
      return false;
    }
  }
}

export const authService = new AuthService();
