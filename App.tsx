
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Settings, ClipboardCheck, BarChart3, MessageSquare, 
  CalendarDays, LogOut, Plane, ChevronRight, Menu, X, MapPin, Moon, Sun, UserCog, ShieldCheck
} from 'lucide-react';
import { Base, UsuarioAutenticado } from './types';
import { useStore } from './hooks/useStore';
import { authService } from './services/authService';
import { accessControlService } from './services/accessControlService';
import { dataAccessControlService } from './services/dataAccessControlService';

// Pages
import DashboardPage from './pages/DashboardPage';
import ManagementPage from './pages/ManagementPage';
import ShiftHandoverPage from './pages/ShiftHandoverPage';
import MonthlyCollectionPage from './pages/MonthlyCollectionPage';
import ReportsPage from './pages/ReportsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { RotaProtegida } from './components/RotaProtegida';

const App: React.FC = () => {
  const { bases, loading, initialized, refreshData } = useStore();
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [selectedBase, setSelectedBase] = useState<Base | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBaseModalOpen, setIsBaseModalOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('gol_shiftflow_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('gol_shiftflow_theme', theme);
  }, [theme]);

  useEffect(() => {
    const user = authService.obterUsuarioAutenticado();
    if (user) {
      setUsuario(user);
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!initialized) refreshData(true);
  }, [initialized, refreshData]);

  useEffect(() => {
    if (initialized && usuario && !selectedBase && bases.length > 0) {
      const basesDisponiveis = dataAccessControlService.obterBasesAcessiveis(usuario, bases);
      if (basesDisponiveis.length === 1) {
        setSelectedBase(basesDisponiveis[0]);
      } else if (basesDisponiveis.length > 1) {
        setIsBaseModalOpen(true);
      }
    }
  }, [initialized, usuario, selectedBase, bases]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const handleLoginSuccess = (user: UsuarioAutenticado) => setUsuario(user);
  const handleLogout = () => { authService.fazerLogout(); setUsuario(null); setSelectedBase(null); };

  if (!authChecked) return null;

  if (loading && !initialized) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Plane className="w-12 h-12 text-orange-500 animate-bounce mb-4" />
        <p className="text-gray-500 dark:text-slate-400 font-bold animate-pulse">Sincronizando dados operacionais...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!usuario ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {usuario ? (
          <Route path="/*" element={
            <div className="flex h-screen bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-slate-100 overflow-hidden transition-colors duration-300">
              <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-orange-600 dark:bg-slate-800 text-white flex flex-col transition-all duration-300 ease-in-out z-30`}>
                <div className="p-4 flex items-center justify-between border-b border-white/10">
                  <div className={`flex items-center space-x-2 ${!isSidebarOpen && 'justify-center w-full'}`}>
                    <Plane className="w-8 h-8" />
                    {isSidebarOpen && <span className="text-xl font-bold tracking-tighter">ShiftFlow</span>}
                  </div>
                  {isSidebarOpen && <button onClick={toggleSidebar} className="p-1 hover:bg-white/10 rounded transition-colors"><Menu className="w-5 h-5" /></button>}
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                  <ul className="space-y-2 px-2">
                    <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Indicadores" active={isSidebarOpen} />
                    <NavItem to="/shift-handover" icon={<ClipboardCheck />} label="Passagem de Serviço" active={isSidebarOpen} />
                    <NavItem to="/monthly-collection" icon={<CalendarDays />} label="Coleta Mensal" active={isSidebarOpen} />
                    <NavItem to="/reports" icon={<BarChart3 />} label="Relatórios" active={isSidebarOpen} />
                    <NavItem to="/announcements" icon={<MessageSquare />} label="Comunicados" active={isSidebarOpen} />
                    <NavItem to="/management" icon={<Settings />} label="Gerenciamento" active={isSidebarOpen} />
                  </ul>
                </nav>

                <div className="p-4 border-t border-white/10 bg-black/10">
                  {isSidebarOpen && (
                    <div className="mb-4">
                      <button onClick={() => setIsBaseModalOpen(true)} className="w-full flex items-center justify-between bg-white dark:bg-slate-700 text-orange-600 dark:text-slate-100 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-orange-50 dark:hover:bg-slate-600 transition-colors">
                        <div className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>Base: {selectedBase?.sigla || 'Selecionar'}</span></div>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className={`flex items-center ${isSidebarOpen ? 'space-x-3' : 'justify-center'}`}>
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 text-orange-600 dark:text-slate-100 flex items-center justify-center font-bold">{usuario.nome.charAt(0)}</div>
                    {isSidebarOpen && <div className="flex-1 overflow-hidden"><p className="text-sm font-semibold truncate">{usuario.nome}</p><p className="text-[10px] text-orange-100 dark:text-slate-400 truncate uppercase font-bold">{usuario.perfil}</p></div>}
                  </div>
                </div>
              </aside>

              <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-100 dark:bg-slate-900 transition-colors duration-300">
                <header className="bg-white dark:bg-slate-800 shadow-sm h-16 flex items-center px-6 justify-between shrink-0 border-b dark:border-slate-700 transition-colors duration-300">
                  <div className="flex items-center space-x-4">
                    {!isSidebarOpen && <button onClick={toggleSidebar} className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"><Menu className="w-5 h-5" /></button>}
                    <h1 className="text-xl font-semibold text-gray-800 dark:text-slate-100">{selectedBase ? `GOL ShiftFlow - ${selectedBase.nome} (${selectedBase.sigla})` : 'Selecione uma Base'}</h1>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors">{theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}</button>
                    <button onClick={handleLogout} className="text-gray-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors"><LogOut className="w-5 h-5" /></button>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<RotaProtegida><DashboardPage baseId={selectedBase?.id} /></RotaProtegida>} />
                    <Route path="/shift-handover" element={<RotaProtegida><ShiftHandoverPage baseId={selectedBase?.id} /></RotaProtegida>} />
                    <Route path="/monthly-collection" element={<RotaProtegida><MonthlyCollectionPage baseId={selectedBase?.id} /></RotaProtegida>} />
                    <Route path="/reports" element={<RotaProtegida><ReportsPage baseId={selectedBase?.id} /></RotaProtegida>} />
                    <Route path="/announcements" element={<RotaProtegida><AnnouncementsPage baseId={selectedBase?.id} /></RotaProtegida>} />
                    <Route path="/management" element={<RotaProtegida><ManagementPage /></RotaProtegida>} />
                  </Routes>
                </div>
              </main>

              {isBaseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border dark:border-slate-700">
                    <div className="bg-orange-600 p-6 text-white flex justify-between items-center"><h2 className="text-2xl font-bold">Bem-vindo!</h2>{selectedBase && <button onClick={() => setIsBaseModalOpen(false)} className="hover:bg-orange-700 p-1 rounded"><X className="w-6 h-6" /></button>}</div>
                    <div className="p-8 text-center">
                      <p className="text-gray-600 dark:text-slate-300 mb-6 text-lg">Selecione a base operacional:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {dataAccessControlService.obterBasesAcessiveis(usuario, bases).map(base => (
                          <button 
                            key={base.id} 
                            onClick={() => { setSelectedBase(base); setIsBaseModalOpen(false); }} 
                            className={`p-6 border-2 rounded-xl transition-all group ${selectedBase?.id === base.id ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/20' : 'border-gray-200 dark:border-slate-700 hover:border-orange-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                          >
                            <MapPin className={`w-8 h-8 mx-auto mb-2 ${selectedBase?.id === base.id ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-400'}`} />
                            <span className="block font-bold text-lg text-gray-800 dark:text-slate-100">{base.sigla}</span>
                            <span className="block text-sm text-gray-500 dark:text-slate-400">{base.nome}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          } />
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
};

interface NavItemProps { to: string; icon: React.ReactNode; label: string; active: boolean; }
const NavItem: React.FC<NavItemProps> = ({ to, icon, label, active }) => {
  const location = useLocation();
  const isCurrent = location.pathname === to;
  return (<li><Link to={to} className={`flex items-center p-3 rounded-lg transition-all ${isCurrent ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-lg' : 'text-orange-50 dark:text-slate-300 hover:bg-orange-500 dark:hover:bg-slate-700/50'}`}><span className={`${isCurrent ? 'text-orange-600 dark:text-orange-400' : ''}`}>{icon}</span>{active && <span className="ml-3 font-medium">{label}</span>}</Link></li>);
};

export default App;
