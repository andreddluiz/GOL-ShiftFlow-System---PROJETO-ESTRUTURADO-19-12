
import React, { useMemo } from 'react';
import { Download, Filter, Search, FileText, BarChart3, MapPin } from 'lucide-react';
import { useStore } from '../hooks/useStore';

const ReportsPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const { bases, categories, tasks } = useStore();
  
  const currentBase = useMemo(() => bases.find(b => b.id === baseId), [bases, baseId]);
  
  const reports = [
    { id: 1, data: '15/10/2023', turno: 1, base: 'POA', responsavel: 'Carlos Silva', performance: '92%', status: 'Finalizada' },
    { id: 2, data: '15/10/2023', turno: 2, base: 'POA', responsavel: 'Ana Pereira', performance: '88%', status: 'Finalizada' },
    { id: 3, data: '14/10/2023', turno: 1, base: 'POA', responsavel: 'Carlos Silva', performance: '95%', status: 'Finalizada' },
    { id: 4, data: '14/10/2023', turno: 2, base: 'POA', responsavel: 'Ana Pereira', performance: '82%', status: 'Finalizada' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800">Relatórios Consolidados</h2>
              <p className="text-xs font-bold text-gray-400 flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>Base Ativa: {currentBase?.nome || 'Todas as bases'}</span>
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="flex items-center space-x-2 px-5 py-3 bg-gray-50 text-gray-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors">
              <Download className="w-4 h-4" />
              <span>Exportar XLS</span>
            </button>
            <button className="flex items-center space-x-2 px-5 py-3 gol-orange text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-orange-100">
              <Filter className="w-4 h-4" />
              <span>Filtros Avançados</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-50">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-6 py-5">Data</th>
                <th className="px-6 py-5">Turno</th>
                <th className="px-6 py-5">Responsável</th>
                <th className="px-6 py-5">Performance</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reports.map((report) => (
                <tr key={report.id} className="group hover:bg-orange-50/20 transition-all">
                  <td className="px-6 py-5 font-bold text-gray-700">{report.data}</td>
                  <td className="px-6 py-5">
                    <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-xs font-black">
                      T{report.turno}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-gray-600 font-medium">{report.responsavel}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-gray-800">{report.performance}</span>
                      <div className="w-12 bg-gray-100 h-1 rounded-full hidden md:block">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: report.performance }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-tighter border border-green-100">
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-gray-300 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all">
                      <FileText className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
