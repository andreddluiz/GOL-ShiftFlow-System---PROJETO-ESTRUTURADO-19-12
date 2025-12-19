
import React from 'react';
import { Calendar, Save, FileCheck } from 'lucide-react';

const MonthlyCollectionPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
        <Calendar className="w-16 h-16 text-orange-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Coleta de Dados Mensais</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          Preencha os indicadores que são consolidados mensalmente para a base operacional selecionada.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
           <MonthlyTaskItem label="Limpeza Geral do Pátio" />
           <MonthlyTaskItem label="Manutenção Preventiva de Equipamentos" />
           <MonthlyTaskItem label="Inventário de Peças Críticas" />
           <MonthlyTaskItem label="Treinamento Mensal de Segurança" />
        </div>

        <div className="mt-12 flex justify-center space-x-4">
           <button className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50">
             Salvar Rascunho
           </button>
           <button className="px-6 py-3 gol-orange text-white rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-200">
             Finalizar Mês
           </button>
        </div>
      </div>
    </div>
  );
};

const MonthlyTaskItem: React.FC<{label: string}> = ({label}) => (
  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
    <span className="font-semibold text-gray-700 text-sm">{label}</span>
    <input type="checkbox" className="w-5 h-5 accent-orange-500" />
  </div>
);

export default MonthlyCollectionPage;
