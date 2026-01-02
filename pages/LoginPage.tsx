
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plane, Mail, Lock, LogIn, AlertCircle, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`[Login] Iniciando autenticação para: ${email}`);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("[Login] Autenticação básica OK. Aguardando sincronização de perfil...");
      
      // O redirecionamento ocorre após o onAuthStateChanged no hook useAuth detectar o usuário
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error("[Login Error]", err.code);
      
      let msg = "Erro ao acessar o sistema.";
      if (err.code === 'auth/invalid-credential') msg = "E-mail ou senha incorretos.";
      if (err.code === 'auth/user-not-found') msg = "Colaborador não cadastrado.";
      if (err.code === 'auth/wrong-password') msg = "Senha inválida.";
      if (err.code === 'auth/too-many-requests') msg = "Acesso bloqueado temporariamente por múltiplas tentativas.";
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FF5A00] p-4 md:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden p-8 md:p-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#FF5A00] rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-orange-200 mb-6 rotate-3">
            <Plane size={44} />
          </div>
          <h1 className="text-4xl font-black text-gray-800 tracking-tighter">ShiftFlow</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Operações GOL Linhas Aéreas</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-2xl flex items-center space-x-3 text-red-800 animate-in slide-in-from-top-2">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-xs font-bold uppercase leading-tight">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">E-mail Corporativo</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nome.sobrenome@gol.com.br"
                className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] font-bold text-sm outline-none focus:bg-white focus:border-[#FF5A00] transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Senha de Acesso</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input 
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[1.5rem] font-bold text-sm outline-none focus:bg-white focus:border-[#FF5A00] transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#FF5A00] text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.25em] shadow-2xl shadow-orange-100 hover:bg-[#e65100] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-4 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? <Loader2 className="animate-spin" size={22} /> : <LogIn size={22} />}
            <span>{loading ? 'Validando...' : 'Entrar no Sistema'}</span>
          </button>
        </form>

        <div className="mt-12 text-center border-t border-gray-100 pt-8">
          <p className="text-[9px] font-bold text-gray-300 uppercase leading-relaxed tracking-tighter">
            Sistema de Uso Restrito e Monitorado<br/>
            Suporte: ti.operacoes@gol.com.br
          </p>
        </div>
      </div>
    </div>
  );
};
