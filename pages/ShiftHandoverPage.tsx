
import React, { useState } from 'react';
import { Save, CheckCircle, Plus, Trash2, Info, Users, Clock, AlertTriangle } from 'lucide-react';
import { CATEGORIES, TASKS } from '../constants';
import { MeasureType } from '../types';

const ShiftHandoverPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    turno: 1,
    colaboradores: ['', '', '', ''],
    tarefas: {} as Record<string, number>,
    outrasAtividades: [] as {descricao: string, tempo: number}[],
    infoImportantes: '',
    tat: 0,
    itensVencimento: 0,
    itensCriticos: 0
  });

  const totalProduzido = Object.entries(formData.tarefas).reduce((acc, [taskId, valor]) => {
    const task = TASKS.find(t => t.id === taskId);
    return acc + (valor * (task?.fatorMultiplicador || 0));
  }, 0) / 60; // em horas

  const handleTaskChange = (taskId: string, valor: string) => {
    setFormData(prev => ({
      ...prev,
      tarefas: { ...prev.tarefas, [taskId]: parseInt(valor) || 0 }
    }));
  };

  const handleFinalize = () => {
    if (confirm('Deseja finalizar esta passagem de serviço? Os dados não poderão ser editados após a confirmação.')) {
      alert('Passagem de serviço finalizada com sucesso!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Passagem de Serviço Diária</h2>
          <div className="flex space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Save className="w-4 h-4" />
              <span>Salvar Rascunho</span>
            </button>
            <button 
              onClick={handleFinalize}
              className="flex items-center space-x-2 px-4 py-2 gol-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Finalizar Turno</span>
            </button>
          </div>
        </div>

        {/* Header Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-4 bg-orange-50 rounded-xl">
          <div>
            <label className="block text-xs font-bold text-orange-600 uppercase mb-1">Data</label>
            <input 
              type="date" 
              value={formData.data} 
              onChange={e => setFormData({...formData, data: e.target.value})}
              className="w-full bg-white border-none rounded p-2 text-gray-700" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-orange-600 uppercase mb-1">Turno</label>
            <select 
              value={formData.turno}
              onChange={e => setFormData({...formData, turno: parseInt(e.target.value)})}
              className="w-full bg-white border-none rounded p-2 text-gray-700"
            >
              <option value={1}>Turno 1</option>
              <option value={2}>Turno 2</option>
              <option value={3}>Turno 3</option>
              <option value={4}>Turno 4</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
             <div className="text-right flex-1">
                <p className="text-xs text-orange-600 font-bold uppercase">Performance</p>
                <p className="text-xl font-black text-gray-800">{(totalProduzido / 8 * 100).toFixed(1)}%</p>
             </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="space-y-8">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="space-y-4">
              <div className="flex items-center space-x-2 border-b-2 border-orange-100 pb-2">
                <span className="w-8 h-8 rounded-full gol-orange text-white flex items-center justify-center font-bold text-sm">
                  {cat.ordem}
                </span>
                <h3 className="font-bold text-gray-800">{cat.nome}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TASKS.filter(t => t.categoriaId === cat.id).map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-orange-200">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700">{task.nome}</p>
                      <p className="text-xs text-gray-400">Medida: {task.tipoMedida} | {task.fatorMultiplicador} min</p>
                    </div>
                    <div className="w-24">
                      <input 
                        type="number"
                        placeholder="0"
                        onChange={(e) => handleTaskChange(task.id, e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded text-right focus:gol-border-orange outline-none" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Controls Section */}
        <div className="mt-12 space-y-4">
           <h3 className="font-bold text-gray-800 flex items-center space-x-2">
             <AlertTriangle className="w-5 h-5 text-orange-500" />
             <span>Controles Operacionais</span>
           </h3>
           <div className="grid grid-cols-3 gap-4">
              <ControlInput 
                label="TAT Médio" 
                value={formData.tat} 
                onChange={v => setFormData({...formData, tat: v})}
              />
              <ControlInput 
                label="Itens Vencimento" 
                value={formData.itensVencimento} 
                onChange={v => setFormData({...formData, itensVencimento: v})}
              />
              <ControlInput 
                label="Itens Críticos" 
                value={formData.itensCriticos} 
                onChange={v => setFormData({...formData, itensCriticos: v})}
              />
           </div>
        </div>

        {/* Important Info */}
        <div className="mt-8">
           <label className="block text-sm font-bold text-gray-700 mb-2">Informações Importantes / Ocorrências</label>
           <textarea 
            rows={4}
            className="w-full p-4 border border-gray-200 rounded-xl focus:gol-border-orange outline-none"
            placeholder="Relate aqui problemas técnicos, atrasos ou avisos para o próximo turno..."
            value={formData.infoImportantes}
            onChange={e => setFormData({...formData, infoImportantes: e.target.value})}
           ></textarea>
        </div>
      </div>
    </div>
  );
};

const ControlInput: React.FC<{label: string, value: number, onChange: (v: number) => void}> = ({label, value, onChange}) => (
  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
    <p className="text-xs font-bold text-gray-400 uppercase mb-1">{label}</p>
    <input 
      type="number" 
      className="w-full text-lg font-bold text-gray-800 bg-transparent border-none outline-none"
      value={value}
      onChange={e => onChange(parseInt(e.target.value) || 0)}
    />
  </div>
);

export default ShiftHandoverPage;
