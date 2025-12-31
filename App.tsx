
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  ClipboardCheck, 
  BarChart3, 
  MessageSquare, 
  CalendarDays, 
  LogOut,
  Plane,
  ChevronRight,
  Menu,
  X,
  MapPin,
  Moon,
  Sun
} from 'lucide-react';
import { Base, PermissionLevel } from './types';
import { useStore } from './hooks/useStore';

// Pages
import DashboardPage from './pages/DashboardPage';
import ManagementPage from './pages/ManagementPage';
import ShiftHandoverPage from './pages/ShiftHandoverPage';
import MonthlyCollectionPage from './pages/MonthlyCollectionPage';
import ReportsPage from './pages/ReportsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';

const App: React.FC = () => {
  const { bases, loading, initialized, refreshData } = useStore();
  const [selectedBase, setSelectedBase] = useState<Base | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBaseModalOpen, setIsBaseModalOpen] = useState(false);
  
  // DARK MODE STATE
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('gol_shiftflow_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('gol_shiftflow_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!initialized) {
      refreshData(true);
    }
  }, [initialized, refreshData]);

  useEffect(() => {
    if (initialized && !selectedBase && bases.length > 0) {
      setIsBaseModalOpen(true);
    }
  }, [initialized, selectedBase, bases]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

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
      <div className="flex h-screen bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-slate-100 overflow-hidden transition-colors duration-300">
        {/* Sidebar */}
        <aside 
          className={`${
            isSidebarOpen ? 'w-64' : 'w-20'
          } bg-orange-600 dark:bg-slate-800 text-white flex flex-col transition-all duration-300 ease-in-out z-30`}
        >
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            <div className={`flex items-center space-x-2 ${!isSidebarOpen && 'justify-center w-full'}`}>
              <Plane className="w-8 h-8" />
              {isSidebarOpen && <span className="text-xl font-bold tracking-tighter">ShiftFlow</span>}
            </div>
            {isSidebarOpen && (
              <button onClick={toggleSidebar} className="p-1 hover:bg-white/10 rounded transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            )}
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
                <button 
                  onClick={() => setIsBaseModalOpen(true)}
                  className="w-full flex items-center justify-between bg-white dark:bg-slate-700 text-orange-600 dark:text-slate-100 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-orange-50 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>Base: {selectedBase?.sigla || 'Selecionar'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className={`flex items-center ${isSidebarOpen ? 'space-x-3' : 'justify-center'}`}>
              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 text-orange-600 dark:text-slate-100 flex items-center justify-center font-bold">
                U
              </div>
              {isSidebarOpen && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold truncate">Usuário GOL</p>
                  <p className="text-xs text-orange-100 dark:text-slate-400 truncate">Administrador</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-100 dark:bg-slate-900 transition-colors duration-300">
          <header className="bg-white dark:bg-slate-800 shadow-sm h-16 flex items-center px-6 justify-between shrink-0 border-b dark:border-slate-700 transition-colors duration-300">
            <div className="flex items-center space-x-4">
              {!isSidebarOpen && (
                <button onClick={toggleSidebar} className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors">
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-800 dark:text-slate-100">
                {selectedBase ? `GOL ShiftFlow - ${selectedBase.nome} (${selectedBase.sigla})` : 'Selecione uma Base'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* THEME TOGGLE BUTTON */}
              <button 
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <button className="text-gray-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage baseId={selectedBase?.id} />} />
              <Route path="/shift-handover" element={<ShiftHandoverPage baseId={selectedBase?.id} />} />
              <Route path="/monthly-collection" element={<MonthlyCollectionPage baseId={selectedBase?.id} />} />
              <Route path="/reports" element={<ReportsPage baseId={selectedBase?.id} />} />
              <Route path="/announcements" element={<AnnouncementsPage baseId={selectedBase?.id} />} />
              <Route path="/management" element={<ManagementPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>

        {/* Base Selection Modal */}
        {isBaseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all border dark:border-slate-700">
              <div className="bg-orange-600 p-6 text-white flex justify-between items-center">
                <h2 className="text-2xl font-bold">Bem-vindo!</h2>
                {selectedBase && (
                  <button onClick={() => setIsBaseModalOpen(false)} className="hover:bg-orange-700 p-1 rounded">
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>
              <div className="p-8 text-center">
                <p className="text-gray-600 dark:text-slate-300 mb-6 text-lg">Selecione a base operacional:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {bases.map(base => (
                    <button
                      key={base.id}
                      onClick={() => {
                        setSelectedBase(base);
                        setIsBaseModalOpen(false);
                      }}
                      className={`p-6 border-2 rounded-xl transition-all group ${
                        selectedBase?.id === base.id 
                        ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/20' 
                        : 'border-gray-200 dark:border-slate-700 hover:border-orange-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }`}
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
    </Router>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, active }) => {
  const location = useLocation();
  const isCurrent = location.pathname === to;

  return (
    <li>
      <Link
        to={to}
        className={`flex items-center p-3 rounded-lg transition-all ${
          isCurrent 
          ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-lg' 
          : 'text-orange-50 dark:text-slate-300 hover:bg-orange-500 dark:hover:bg-slate-700/50'
        }`}
      >
        <span className={`${isCurrent ? 'text-orange-600 dark:text-orange-400' : ''}`}>{icon}</span>
        {active && <span className="ml-3 font-medium">{label}</span>}
      </Link>
    </li>
  );
};

export default App;
