
import React from 'react';
import { 
  ClipboardCheck, 
  Layers, 
  Map, 
  Database, 
  Zap, 
  CheckCircle2, 
  TrendingUp,
  Target,
  Rocket
} from 'lucide-react';

const DiagnosticPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="bg-white p-8 rounded-2xl shadow-sm border-l-4 border-orange-500">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Planejamento Estratégico GOL ShiftFlow</h1>
        <p className="text-gray-500 max-w-3xl">
          Análise de arquitetura e roadmap para a migração do sistema de coleta de dados operacionais (Excel para Web).
        </p>
      </header>

      {/* 1. Diagnóstico */}
      <section className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-2 mb-6">
          <Target className="w-6 h-6 text-orange-600" />
          <h2 className="text-2xl font-bold text-gray-800">1. Diagnóstico e Análise</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-orange-700">Oportunidades</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5 shrink-0" />
                <span className="text-gray-600">Eliminação de erros de fórmula e inconsistências manuais do Excel.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5 shrink-0" />
                <span className="text-gray-600">Consolidação em tempo real de múltiplas bases (POA, GRU, etc).</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5 shrink-0" />
                <span className="text-gray-600">Auditoria completa de quem preencheu o quê e quando.</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-red-700">Desafios Técnicos</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Zap className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 shrink-0" />
                <span className="text-gray-600">Sincronização offline: Garantir que dados não sejam perdidos se o Wi-Fi oscilar.</span>
              </li>
              <li className="flex items-start">
                <Zap className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 shrink-0" />
                <span className="text-gray-600">Performance: Agregação de dados históricos de todas as bases para dashboards.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 2. Arquitetura */}
      <section className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-2 mb-6">
          <Layers className="w-6 h-6 text-orange-600" />
          <h2 className="text-2xl font-bold text-gray-800">2. Arquitetura de Dados (Firestore)</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <ArchCard 
            title="Bases & Config"
            icon={<Map className="text-blue-500" />}
            desc="Coleções globais de bases, categorias e tarefas para consistência universal."
          />
          <ArchCard 
            title="Operational Data"
            icon={<Database className="text-green-500" />}
            desc="Coleções particionadas por baseId para performance e isolamento de dados."
          />
          <ArchCard 
            title="Analytics Cloud"
            icon={<TrendingUp className="text-purple-500" />}
            desc="Agregadores periódicos para KPIs consolidados, evitando leituras excessivas."
          />
        </div>
      </section>

      {/* 3. Roadmap */}
      <section className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-2 mb-6">
          <Rocket className="w-6 h-6 text-orange-600" />
          <h2 className="text-2xl font-bold text-gray-800">3. Roadmap de Desenvolvimento</h2>
        </div>
        <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 pb-4">
          <RoadmapStep 
            phase="1" 
            title="Fundação e Auth" 
            desc="Setup do Firebase, login por base e estrutura de navegação." 
            status="Em andamento"
          />
          <RoadmapStep 
            phase="2" 
            title="Gerenciamento Dinâmico" 
            desc="Cadastro de tarefas, categorias e usuários por base." 
            status="Pendente"
          />
          <RoadmapStep 
            phase="3" 
            title="Módulo Coleta Diária" 
            desc="Passagem de serviço com formulários auto-calculados e validação." 
            status="Pendente"
          />
          <RoadmapStep 
            phase="4" 
            title="Relatórios e BI" 
            desc="Dashboards com Recharts e exportação em massa (CSV/Excel)." 
            status="Pendente"
          />
          <RoadmapStep 
            phase="5" 
            title="Mural e Notificações" 
            desc="Comunicados dinâmicos e alertas de tarefas críticas." 
            status="Pendente"
          />
        </div>
      </section>

      {/* 4. Próximos Passos */}
      <section className="bg-orange-50 border border-orange-100 p-8 rounded-2xl">
        <h2 className="text-2xl font-bold text-orange-800 mb-4">Próximos Passos Imediatos</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-500">
            <span className="text-xs font-bold text-orange-600 uppercase">Passo 1</span>
            <p className="font-semibold">Setup do Firestore Schema</p>
            <p className="text-sm text-gray-500">Criar as coleções mockadas em `constants.ts` para testar fluxos.</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-gray-300">
            <span className="text-xs font-bold text-gray-400 uppercase">Passo 2</span>
            <p className="font-semibold">Implementar Formulário de Passagem</p>
            <p className="text-sm text-gray-500">Focar na lógica de auto-soma de horas disponíveis e produzidas.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

const ArchCard: React.FC<{title: string, icon: React.ReactNode, desc: string}> = ({title, icon, desc}) => (
  <div className="border border-gray-100 p-5 rounded-xl hover:shadow-md transition-shadow">
    <div className="mb-3">{icon}</div>
    <h4 className="font-bold text-gray-800 mb-1">{title}</h4>
    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
  </div>
);

const RoadmapStep: React.FC<{phase: string, title: string, desc: string, status: string}> = ({phase, title, desc, status}) => (
  <div className="relative pl-8">
    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-orange-500 border-2 border-white"></div>
    <div className="flex items-center space-x-2 mb-1">
      <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-600">FASE {phase}</span>
      <span className={`text-xs font-medium px-2 py-0.5 rounded ${status === 'Em andamento' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
        {status}
      </span>
    </div>
    <h4 className="font-bold text-gray-800">{title}</h4>
    <p className="text-sm text-gray-500">{desc}</p>
  </div>
);

export default DiagnosticPage;
