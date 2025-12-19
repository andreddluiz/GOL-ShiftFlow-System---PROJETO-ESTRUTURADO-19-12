
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
  FileText
} from 'lucide-react';
import { BASES } from './constants';
import { Base, PermissionLevel } from './types';

// Pages
import DiagnosticPage from './pages/DiagnosticPage';
import DashboardPage from './pages/DashboardPage';
import ManagementPage from './pages/ManagementPage';
import ShiftHandoverPage from './pages/ShiftHandoverPage';
import MonthlyCollectionPage from './pages/MonthlyCollectionPage';
import ReportsPage from './pages/ReportsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';

const App: React.FC = () => {
  const [selectedBase, setSelectedBase] = useState<Base | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBaseModalOpen, setIsBaseModalOpen] = useState(false);

  // Authentication Mock
  const user = {
    nome: 'Admin GOL',
    email: 'admin@voegol.com.br',
    permissao: PermissionLevel.ADMIN,
    bases: ['poa', 'fln', 'gru', 'gig', 'cwb', 'sdu']
  };

  useEffect(() => {
    if (!selectedBase && user.bases.length > 0) {
      setIsBaseModalOpen(true);
    }
  }, [selectedBase]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <Router>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`${
            isSidebarOpen ? 'w-64' : 'w-20'
          } gol-orange text-white flex flex-col transition-all duration-300 ease-in-out z-30`}
        >
          <div className="p-4 flex items-center justify-between border-b border-orange-400">
            <div className={`flex items-center space-x-2 ${!isSidebarOpen && 'justify-center w-full'}`}>
              <Plane className="w-8 h-8" />
              {isSidebarOpen && <span className="text-xl font-bold tracking-tighter">ShiftFlow</span>}
            </div>
            {isSidebarOpen && (
              <button onClick={toggleSidebar} className="p-1 hover:bg-orange-600 rounded transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-2 px-2">
              <NavItem to="/" icon={<FileText />} label="Diagnóstico" active={isSidebarOpen} />
              <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Indicadores" active={isSidebarOpen} />
              <NavItem to="/shift-handover" icon={<ClipboardCheck />} label="Passagem de Serviço" active={isSidebarOpen} />
              <NavItem to="/monthly-collection" icon={<CalendarDays />} label="Coleta Mensal" active={isSidebarOpen} />
              <NavItem to="/reports" icon={<BarChart3 />} label="Relatórios" active={isSidebarOpen} />
              <NavItem to="/announcements" icon={<MessageSquare />} label="Comunicados" active={isSidebarOpen} />
              <NavItem to="/management" icon={<Settings />} label="Gerenciamento" active={isSidebarOpen} />
            </ul>
          </nav>

          <div className="p-4 border-t border-orange-400 bg-orange-600/50">
            {isSidebarOpen && (
              <div className="mb-4">
                <button 
                  onClick={() => setIsBaseModalOpen(true)}
                  className="w-full flex items-center justify-between bg-white text-orange-600 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-orange-50 transition-colors"
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
              <div className="w-10 h-10 rounded-full bg-white text-orange-600 flex items-center justify-center font-bold">
                {user.nome.charAt(0)}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold truncate">{user.nome}</p>
                  <p className="text-xs text-orange-100 truncate">{user.permissao}</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="bg-white shadow-sm h-16 flex items-center px-6 justify-between shrink-0">
            <div className="flex items-center space-x-4">
              {!isSidebarOpen && (
                <button onClick={toggleSidebar} className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors">
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-800">
                {selectedBase ? `GOL ShiftFlow - ${selectedBase.nome} (${selectedBase.sigla})` : 'Selecione uma Base'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-orange-600 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<DiagnosticPage />} />
              <Route path="/dashboard" element={<DashboardPage baseId={selectedBase?.id} />} />
              <Route path="/shift-handover" element={<ShiftHandoverPage baseId={selectedBase?.id} />} />
              <Route path="/monthly-collection" element={<MonthlyCollectionPage baseId={selectedBase?.id} />} />
              <Route path="/reports" element={<ReportsPage baseId={selectedBase?.id} />} />
              <Route path="/announcements" element={<AnnouncementsPage baseId={selectedBase?.id} />} />
              <Route path="/management" element={<ManagementPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        {/* Base Selection Modal */}
        {isBaseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all">
              <div className="gol-orange p-6 text-white flex justify-between items-center">
                <h2 className="text-2xl font-bold">Bem-vindo, {user.nome.split(' ')[0]}!</h2>
                {!selectedBase && <Plane className="w-6 h-6 animate-pulse" />}
                {selectedBase && (
                  <button onClick={() => setIsBaseModalOpen(false)} className="hover:bg-orange-600 p-1 rounded">
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>
              <div className="p-8 text-center">
                <p className="text-gray-600 mb-6 text-lg">Selecione a base operacional que deseja visualizar hoje:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {BASES.map(base => (
                    <button
                      key={base.id}
                      onClick={() => {
                        setSelectedBase(base);
                        setIsBaseModalOpen(false);
                      }}
                      className={`p-6 border-2 rounded-xl transition-all group ${
                        selectedBase?.id === base.id 
                        ? 'gol-border-orange bg-orange-50' 
                        : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                      }`}
                    >
                      <MapPin className={`w-8 h-8 mx-auto mb-2 ${selectedBase?.id === base.id ? 'gol-text-orange' : 'text-gray-400 group-hover:text-orange-400'}`} />
                      <span className="block font-bold text-lg text-gray-800">{base.sigla}</span>
                      <span className="block text-sm text-gray-500">{base.nome}</span>
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
          ? 'bg-white text-orange-600 shadow-lg' 
          : 'text-orange-50 hover:bg-orange-600'
        }`}
      >
        <span className={`${isCurrent ? 'text-orange-600' : ''}`}>{icon}</span>
        {active && <span className="ml-3 font-medium">{label}</span>}
      </Link>
    </li>
  );
};

export default App;
