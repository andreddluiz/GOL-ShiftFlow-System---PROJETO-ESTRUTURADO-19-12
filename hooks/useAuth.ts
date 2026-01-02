
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UsuarioAutenticado } from '../types';

export interface User {
  uid: string;
  email: string;
  name: string;
  bases: string[];
  active: boolean;
  permissionLevel: 'ADMINISTRADOR' | 'LÍDER' | 'ANALISTA' | 'OPERACIONAL';
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          const userRef = doc(db, 'users_v2', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            
            if (data.active === false) {
              await signOut(auth);
              setUser(null);
              sessionStorage.removeItem('gol_usuario_autenticado');
            } else {
              const profile: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: data.name || 'Colaborador',
                bases: data.bases || [],
                active: true,
                permissionLevel: data.permissionLevel || 'OPERACIONAL'
              };

              // Cria a "Ponte de Compatibilidade" para o authService legado
              const legacyUser: UsuarioAutenticado = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                nome: profile.name,
                perfil: profile.permissionLevel,
                baseAtual: profile.bases[0] || '',
                basesAssociadas: profile.bases.map(bId => ({
                  baseId: bId,
                  nivelAcesso: profile.permissionLevel as any,
                  ativo: true,
                  dataCriacao: new Date().toISOString(),
                  dataAtualizacao: new Date().toISOString()
                }))
              };

              setUser(profile);
              sessionStorage.setItem('gol_usuario_autenticado', JSON.stringify(legacyUser));
            }
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
          sessionStorage.removeItem('gol_usuario_autenticado');
        }
      } catch (error) {
        console.error("[Auth Error]", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    sessionStorage.removeItem('gol_usuario_autenticado');
    window.location.hash = '/login';
  };

  return { user, loading, logout };
};
