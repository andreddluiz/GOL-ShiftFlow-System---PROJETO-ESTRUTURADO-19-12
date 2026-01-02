
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Plane, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Tela de transição com identidade GOL
  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="relative">
          <Plane className="w-12 h-12 text-[#FF5A00] animate-bounce" />
          <Loader2 className="w-16 h-16 text-orange-200 animate-spin absolute -top-2 -left-2" />
        </div>
        <p className="mt-6 text-[#FF5A00] font-black uppercase tracking-widest text-[10px] animate-pulse">
          Validando Credenciais GOL...
        </p>
      </div>
    );
  }

  // Redirecionamento se não estiver logado
  if (!user) {
    console.warn("[ProtectedRoute] Acesso negado. Redirecionando para Login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
