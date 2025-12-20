
import React, { useMemo } from 'react';
import { Calendar, Save, FileCheck, ClipboardCheck } from 'lucide-react';
import { useStore } from '../hooks/useStore';

const MonthlyCollectionPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const { categories, tasks, bases } = useStore();

  const monthlyCategories = useMemo(() => 
    categories.filter(c => c.tipo === 'mensal' && c.status === 'Ativa').sort((a,b) => a.ordem - b.ordem),
    [categories]
  );

  const monthlyTasks = useMemo(() => 
    tasks.filter(t => t.status === 'Ativa'),
    [tasks]
  );

  const currentBase = useMemo(() => bases.find(b => b.id === baseId), [bases, baseId]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-white p-8 rounded-3xl shadow-sm text-center border border-gray-100">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-10 h-10 text-orange-500" />
        </div>
        <h2 className="text-3xl font-black text-gray-800">Coleta Mensal</h2>
        <p className="text-gray-400 font-medium max-w-md mx-auto mb-4">
          Indicadores consolidados de fechamento de mês para a base <span className="text-orange-600 font-bold">{currentBase?.sigla || '...'}</span>.
        </p>

        <div className="space-y-8 text-left mt-10">
          {monthlyCategories.map(cat => (
            <div key={cat.id} className="space-y-4">
              <h3 className="text-xs font-black text-gray-300 uppercase tracking-[0.2em] border-b pb-2">{cat.nome}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {monthlyTasks.filter(t => t.categoriaId === cat.id).map(task => (
                  <MonthlyTaskItem key={task.id} label={task.nome} />
                ))}
              </div>
            </div>
          ))}

          {monthlyCategories.length === 0 && (
            <div className="py-20 text-center text-gray-300 flex flex-col items-center">
              <ClipboardCheck className="w-12 h-12 mb-2 opacity-20" />
              <p>Nenhum indicador mensal configurado.</p>
            </div>
          )}
        </div>

        <div className="mt-16 flex justify-center space-x-4">
           <button className="px-8 py-4 border-2 border-gray-100 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all">
             Salvar Rascunho
           </button>
           <button className="px-8 py-4 gol-orange text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-600 shadow-xl shadow-orange-100 transition-all">
             Finalizar Mês
           </button>
        </div>
      </div>
    </div>
  );
};

const MonthlyTaskItem: React.FC<{label: string}> = ({label}) => (
  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-white hover:shadow-lg hover:shadow-gray-100 transition-all group">
    <span className="font-bold text-gray-600 text-sm group-hover:text-gray-800">{label}</span>
    <input type="checkbox" className="w-6 h-6 rounded-lg border-2 border-gray-200 text-orange-500 focus:ring-orange-500 accent-orange-500" />
  </div>
);

export default MonthlyCollectionPage;
