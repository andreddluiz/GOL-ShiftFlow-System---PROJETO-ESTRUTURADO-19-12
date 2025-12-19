
import React from 'react';
import { Download, Filter, Search, FileText } from 'lucide-react';

const ReportsPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const reports = [
    { data: '15/10/2023', turno: 1, base: 'POA', responsavel: 'Carlos Silva', performance: '92%', status: 'Finalizada' },
    { data: '15/10/2023', turno: 2, base: 'POA', responsavel: 'Ana Pereira', performance: '88%', status: 'Finalizada' },
    { data: '14/10/2023', turno: 1, base: 'POA', responsavel: 'Carlos Silva', performance: '95%', status: 'Finalizada' },
    { data: '14/10/2023', turno: 2, base: 'POA', responsavel: 'Ana Pereira', performance: '82%', status: 'Finalizada' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Relatórios Consolidados</h2>
          <div className="flex space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Download className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 gol-orange text-white rounded-lg hover:bg-orange-600 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filtrar</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
              <tr>
                <th className="px-4 py-4">Data</th>
                <th className="px-4 py-4">Turno</th>
                <th className="px-4 py-4">Base</th>
                <th className="px-4 py-4">Responsável</th>
                <th className="px-4 py-4">Performance</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((report, idx) => (
                <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-4 py-4 font-medium">{report.data}</td>
                  <td className="px-4 py-4">T{report.turno}</td>
                  <td className="px-4 py-4 font-bold text-orange-600">{report.base}</td>
                  <td className="px-4 py-4 text-gray-600">{report.responsavel}</td>
                  <td className="px-4 py-4 font-bold">{report.performance}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button className="text-gray-400 hover:text-orange-600 transition-colors">
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
