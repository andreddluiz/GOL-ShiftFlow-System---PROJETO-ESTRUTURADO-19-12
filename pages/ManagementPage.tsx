
import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  MapPin, 
  Users as UsersIcon, 
  ClipboardList, 
  Settings2,
  Edit2,
  Trash2
} from 'lucide-react';
import { BASES, TASKS, CATEGORIES } from '../constants';

const ManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bases' | 'users' | 'tasks'>('tasks');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          <TabButton 
            active={activeTab === 'tasks'} 
            onClick={() => setActiveTab('tasks')} 
            icon={<ClipboardList className="w-4 h-4" />}
            label="Tarefas & Categorias" 
          />
          <TabButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
            icon={<UsersIcon className="w-4 h-4" />}
            label="Usuários" 
          />
          <TabButton 
            active={activeTab === 'bases'} 
            onClick={() => setActiveTab('bases')} 
            icon={<MapPin className="w-4 h-4" />}
            label="Bases" 
          />
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:gol-border-orange w-64"
              />
            </div>
            <button className="flex items-center space-x-2 gol-orange text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Adicionar {activeTab === 'tasks' ? 'Tarefa' : activeTab === 'users' ? 'Usuário' : 'Base'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            {activeTab === 'tasks' && (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3">Nome da Tarefa</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Medida</th>
                    <th className="px-4 py-3">Fator (min)</th>
                    <th className="px-4 py-3">Obrigatório</th>
                    <th className="px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {TASKS.map(task => (
                    <tr key={task.id} className="hover:bg-gray-50 text-sm">
                      <td className="px-4 py-4 font-medium text-gray-700">{task.nome}</td>
                      <td className="px-4 py-4 text-gray-500">
                        {CATEGORIES.find(c => c.id === task.categoriaId)?.nome}
                      </td>
                      <td className="px-4 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold">{task.tipoMedida}</span></td>
                      <td className="px-4 py-4">{task.fatorMultiplicador}</td>
                      <td className="px-4 py-4">
                        {task.obrigatoriedade ? (
                          <span className="text-orange-500 font-semibold">Sim</span>
                        ) : (
                          <span className="text-gray-400">Não</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-2">
                          <button className="p-1 hover:text-orange-600"><Edit2 className="w-4 h-4" /></button>
                          <button className="p-1 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'bases' && (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3">Sigla</th>
                    <th className="px-4 py-3">Nome da Base</th>
                    <th className="px-4 py-3">Jornada</th>
                    <th className="px-4 py-3">Turnos</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {BASES.map(base => (
                    <tr key={base.id} className="hover:bg-gray-50 text-sm">
                      <td className="px-4 py-4 font-bold text-gray-800">{base.sigla}</td>
                      <td className="px-4 py-4 text-gray-600">{base.nome}</td>
                      <td className="px-4 py-4">{base.jornada}</td>
                      <td className="px-4 py-4">{base.turnos}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-bold">{base.status}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex space-x-2">
                          <button className="p-1 hover:text-orange-600"><Edit2 className="w-4 h-4" /></button>
                          <button className="p-1 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{active: boolean, onClick: () => void, icon: React.ReactNode, label: string}> = ({active, onClick, icon, label}) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-2 px-6 py-4 text-sm font-semibold transition-all border-b-2 ${
      active 
      ? 'gol-border-orange gol-text-orange bg-orange-50/50' 
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default ManagementPage;
