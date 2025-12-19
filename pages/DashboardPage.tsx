
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, Users, Clock, CheckCircle } from 'lucide-react';

const DashboardPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const mockData = [
    { name: 'Seg', produzida: 45, disponivel: 60 },
    { name: 'Ter', produzida: 52, disponivel: 60 },
    { name: 'Qua', produzida: 58, disponivel: 60 },
    { name: 'Qui', produzida: 48, disponivel: 60 },
    { name: 'Sex', produzida: 55, disponivel: 60 },
    { name: 'Sab', produzida: 40, disponivel: 48 },
    { name: 'Dom', produzida: 35, disponivel: 48 },
  ];

  const pieData = [
    { name: 'Recebimento', value: 400 },
    { name: 'Despacho', value: 300 },
    { name: 'Armazenagem', value: 300 },
  ];

  const COLORS = ['#FF5A00', '#FF8E4D', '#FFC299'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Horas Disponíveis" value="446h" icon={<Clock className="text-blue-600" />} change="+12%" />
        <KpiCard title="Horas Produzidas" value="382h" icon={<TrendingUp className="text-orange-600" />} change="+8%" />
        <KpiCard title="Performance" value="85.6%" icon={<CheckCircle className="text-green-600" />} change="+2.4%" />
        <KpiCard title="Colaboradores" value="24" icon={<Users className="text-purple-600" />} change="0%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Produção Semanal vs Disponibilidade</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="produzida" fill="#FF5A00" name="Prod. (h)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="disponivel" fill="#e5e7eb" name="Disp. (h)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribuição por Categoria</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{title: string, value: string, icon: React.ReactNode, change: string}> = ({title, value, icon, change}) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      <span className={`text-xs font-semibold ${change.startsWith('+') ? 'text-green-500' : 'text-gray-400'}`}>
        {change} desde o mês anterior
      </span>
    </div>
    <div className="p-3 bg-gray-50 rounded-xl">{icon}</div>
  </div>
);

export default DashboardPage;
