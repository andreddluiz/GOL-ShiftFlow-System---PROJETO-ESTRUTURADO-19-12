
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Settings, ClipboardCheck, BarChart3, MessageSquare, 
  CalendarDays, LogOut, Plane, ChevronRight, Menu, MapPin, Moon, Sun, X
} from 'lucide-react';
import { useStore } from './hooks/useStore';
import { useAuth } from './hooks/useAuth';

// Páginas
import DashboardPage from './pages/DashboardPage';
import ManagementPage from './pages/ManagementPage';
import ShiftHandoverPage from './pages/ShiftHandoverPage';
import MonthlyCollectionPage from './pages/MonthlyCollectionPage';
import ReportsPage from './pages/ReportsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';

const App: React.FC = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { bases, initialized, refreshData } = useStore();
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBaseModalOpen, setIsBaseModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as any) || 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Carrega dados iniciais após login
  useEffect(() => {
    if (user && !initialized) refreshData();
  }, [user, initialized, refreshData]);

  // Gerenciamento automático de base selecionada
  useEffect(() => {
    if (user && !selectedBaseId && user.bases.length > 0) {
      if (user.bases.length === 1) setSelectedBaseId(user.bases[0]);
      else setIsBaseModalOpen(true);
    }
  }, [user, selectedBaseId]);

  if (authLoading) return null; // O ProtectedRoute já lida com o loading visual

  const currentBase = bases.find(b => b.id === selectedBaseId);

  return (
    <Router>
      <Routes>
        {/* Rota de Acesso */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas Protegidas do Sistema */}
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="flex h-screen bg-gray-100 dark:bg-slate-900 transition-colors duration-300">
              {/* Menu Lateral GOL */}
              <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-[#FF5A00] dark:bg-slate-800 text-white flex flex-col transition-all duration-500 z-40 shadow-2xl`}>
                <div className="p-6 flex items-center justify-between border-b border-white/10">
                  <div className={`flex items-center space-x-3 ${!isSidebarOpen && 'justify-center w-full'}`}>
                    <div className="bg-white p-2 rounded-xl text-[#FF5A00] shadow-lg"><Plane size={24} /></div>
                    {isSidebarOpen && <span className="text-2xl font-black tracking-tighter">ShiftFlow</span>}
                  </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-8 scrollbar-hide px-4">
                  <ul className="space-y-3">
                    <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Painel de Controle" open={isSidebarOpen} />
                    <NavItem to="/shift-handover" icon={<ClipboardCheck />} label="Passagem de Turno" open={isSidebarOpen} />
                    <NavItem to="/monthly-collection" icon={<CalendarDays />} label="Dados Mensais" open={isSidebarOpen} />
                    <NavItem to="/reports" icon={<BarChart3 />} label="Histórico & BI" open={isSidebarOpen} />
                    <NavItem to="/announcements" icon={<MessageSquare />} label="Mural de Avisos" open={isSidebarOpen} />
                    {user?.permissionLevel === 'ADMINISTRADOR' && (
                      <NavItem to="/management" icon={<Settings />} label="Configurações" open={isSidebarOpen} />
                    )}
                  </ul>
                </nav>

                <div className="p-6 bg-black/10 border-t border-white/10">
                  {isSidebarOpen && (
                    <button 
                      onClick={() => setIsBaseModalOpen(true)}
                      className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 p-3 rounded-2xl mb-6 transition-all border border-white/5"
                    >
                      <div className="flex items-center space-x-3"><MapPin size={16}/><span className="text-xs font-black uppercase tracking-widest">{currentBase?.sigla || 'Base...'}</span></div>
                      <ChevronRight size={14}/>
                    </button>
                  )}
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#FF5A00] font-black text-xl shadow-xl">
                      {user?.name.charAt(0)}
                    </div>
                    {isSidebarOpen && (
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black truncate">{user?.name}</p>
                        <p className="text-[8px] font-black text-orange-200 uppercase opacity-70 tracking-widest">{user?.permissionLevel}</p>
                      </div>
                    )}
                    <button onClick={logout} className="p-2 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-colors"><LogOut size={18}/></button>
                  </div>
                </div>
              </aside>

              {/* Área de Trabalho */}
              <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-20 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex items-center justify-between px-8 shrink-0 shadow-sm z-30">
                  <div className="flex items-center space-x-6">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 bg-gray-50 dark:bg-slate-700 rounded-xl text-gray-400 hover:text-[#FF5A00] transition-all"><Menu size={20}/></button>
                    <div className="h-8 w-px bg-gray-100 dark:bg-slate-700" />
                    <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-[0.15em]">
                      {currentBase ? `Unidade Operacional: ${currentBase.nome}` : 'Aguardando Seleção...'}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    className="p-3 text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-2xl transition-all"
                  >
                    {theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
                  </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage baseId={selectedBaseId || undefined} />} />
                    <Route path="/shift-handover" element={<ShiftHandoverPage baseId={selectedBaseId || undefined} />} />
                    <Route path="/monthly-collection" element={<MonthlyCollectionPage baseId={selectedBaseId || undefined} />} />
                    <Route path="/reports" element={<ReportsPage baseId={selectedBaseId || undefined} />} />
                    <Route path="/announcements" element={<AnnouncementsPage baseId={selectedBaseId || undefined} />} />
                    <Route path="/management" element={<ManagementPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </div>
              </main>

              {/* Seleção de Base (Multi-Base) */}
              {isBaseModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
                  <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="bg-[#FF5A00] p-10 text-white relative">
                      <h3 className="text-3xl font-black tracking-tighter">Onde você está hoje?</h3>
                      <p className="text-xs font-bold opacity-80 uppercase tracking-widest mt-2">Selecione sua base de atuação</p>
                      <button onClick={() => setIsBaseModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
                    </div>
                    <div className="p-10 grid grid-cols-2 gap-4">
                      {bases.filter(b => user?.bases.includes(b.id)).map(base => (
                        <button 
                          key={base.id} 
                          onClick={() => { setSelectedBaseId(base.id); setIsBaseModalOpen(false); }}
                          className={`flex flex-col items-center p-8 rounded-[2rem] border-4 transition-all group ${selectedBaseId === base.id ? 'border-[#FF5A00] bg-orange-50 dark:bg-slate-700' : 'border-gray-50 dark:border-slate-700 hover:border-orange-100 dark:hover:border-slate-600'}`}
                        >
                          <MapPin className={`w-12 h-12 mb-4 ${selectedBaseId === base.id ? 'text-[#FF5A00]' : 'text-gray-200 dark:text-slate-600 group-hover:text-orange-300'}`} />
                          <span className="font-black text-xl text-gray-800 dark:text-white">{base.sigla}</span>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase mt-1">{base.nome}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

const NavItem: React.FC<{ to: string, icon: React.ReactNode, label: string, open: boolean }> = ({ to, icon, label, open }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <li>
      <Link 
        to={to} 
        className={`flex items-center p-4 rounded-2xl transition-all duration-300 group ${
          isActive 
            ? 'bg-white text-[#FF5A00] shadow-xl shadow-black/10' 
            : 'text-orange-50 hover:bg-white/10'
        }`}
      >
        <span className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>{icon}</span>
        {open && <span className="ml-4 font-black text-[11px] uppercase tracking-widest">{label}</span>}
      </Link>
    </li>
  );
};

export default App;
