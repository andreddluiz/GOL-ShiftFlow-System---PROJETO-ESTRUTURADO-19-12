
import React, { useState, useMemo } from 'react';
import { 
  Save, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Info, 
  Users, 
  Clock, 
  AlertTriangle, 
  ClipboardList,
  Calendar,
  X,
  TrendingUp,
  Timer,
  AlertCircle,
  MapPin
} from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { MeasureType, User, OutraAtividade } from '../types';

/**
 * Utilitários de conversão de tempo
 */
const timeToMinutes = (hms: string): number => {
  if (!hms.includes(':')) return parseInt(hms) || 0;
  const parts = hms.split(':').map(v => parseInt(v) || 0);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return (h * 60) + m + (s / 60);
  } else if (parts.length === 2) {
    const [h, m] = parts;
    return (h * 60) + m;
  }
  return 0;
};

const minutesToHHMMSS = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor(totalMinutes % 60);
  const s = Math.floor((totalMinutes * 60) % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const ShiftHandoverPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const { 
    getOpCategoriesCombinadas, 
    getOpTasksCombinadas, 
    bases, 
    users, 
    controls,
    refreshData 
  } = useStore();
  
  // Dados fundamentais
  const opCategories = useMemo(() => getOpCategoriesCombinadas(baseId), [getOpCategoriesCombinadas, baseId]);
  const opTasks = useMemo(() => getOpTasksCombinadas(baseId), [getOpTasksCombinadas, baseId]);
  const currentBase = useMemo(() => bases.find(b => b.id === baseId), [bases, baseId]);
  const baseUsers = useMemo(() => users.filter(u => u.bases.includes(baseId || '') && u.status === 'Ativo'), [users, baseId]);

  // Estado do formulário
  const [status, setStatus] = useState<'Rascunho' | 'Finalizado'>('Rascunho');
  const [dataOperacional] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTurno, setSelectedTurno] = useState<string>('');
  const [colaboradoresIds, setColaboradoresIds] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [tarefasValores, setTarefasValores] = useState<Record<string, string>>({}); 
  const [outrasAtividades, setOutrasAtividades] = useState<OutraAtividade[]>([]);
  const [controlesValores, setControlesValores] = useState<Record<string, number>>({});
  const [obs, setObs] = useState('');

  // Cálculo de Disponibilidade
  const horasDisponiveis = useMemo(() => {
    return colaboradoresIds.reduce((acc, userId) => {
      if (!userId) return acc;
      const user = baseUsers.find(u => u.id === userId);
      return acc + (user?.jornadaPadrao || 0);
    }, 0);
  }, [colaboradoresIds, baseUsers]);

  // Cálculo de Produção
  const horasProduzidas = useMemo(() => {
    let totalMinutos = 0;

    // Tarefas Operacionais
    Object.entries(tarefasValores).forEach(([taskId, val]) => {
      const task = opTasks.find(t => t.id === taskId);
      if (!task) return;

      if (task.tipoMedida === MeasureType.QTD) {
        const qtd = parseInt(val) || 0;
        totalMinutos += qtd * task.fatorMultiplicador;
      } else {
        totalMinutos += timeToMinutes(val);
      }
    });

    // Outras Atividades
    outrasAtividades.forEach(atv => {
      totalMinutos += atv.tempo;
    });

    return totalMinutos / 60;
  }, [tarefasValores, opTasks, outrasAtividades]);

  // Performance
  const performance = useMemo(() => {
    if (horasDisponiveis === 0) return 0;
    return (horasProduzidas / horasDisponiveis) * 100;
  }, [horasDisponiveis, horasProduzidas]);

  const getCorPerformance = (p: number) => {
    // Busca metas da base ou usa default
    const verde = currentBase?.metaVerde || 70;
    const amarelo = currentBase?.metaAmarelo || 40;

    if (p < amarelo) return '#F44336'; // Vermelho
    if (p < verde) return '#FFC107'; // Amarelo
    if (p <= 100) return '#4CAF50'; // Verde
    return '#2196F3'; // Azul (Excedeu 100%)
  };

  // Handlers
  const handleColaboradorChange = (index: number, userId: string) => {
    if (userId !== "" && colaboradoresIds.includes(userId)) {
      alert("Este colaborador já foi selecionado para este turno!");
      return;
    }
    const newIds = [...colaboradoresIds];
    newIds[index] = userId === "" ? null : userId;
    setColaboradoresIds(newIds);
  };

  const addOutraAtividade = () => {
    setOutrasAtividades([...outrasAtividades, { id: Date.now().toString(), descricao: '', tempo: 0 }]);
  };

  const updateOutraAtividade = (id: string, field: 'descricao' | 'tempo', value: any) => {
    setOutrasAtividades(outrasAtividades.map(atv => 
      atv.id === id ? { ...atv, [field]: value } : atv
    ));
  };

  const removeOutraAtividade = (id: string) => {
    setOutrasAtividades(outrasAtividades.filter(atv => atv.id !== id));
  };

  const handleFinalize = () => {
    if (horasDisponiveis === 0) {
      alert('Por favor, selecione pelo menos um colaborador para calcular a disponibilidade.');
      return;
    }
    
    // Validar obrigatórios
    const missingTask = opTasks.find(t => t.obrigatoriedade && !tarefasValores[t.id]);
    if (missingTask) {
      alert(`A tarefa "${missingTask.nome}" é obrigatória.`);
      return;
    }

    if (confirm('Deseja finalizar a passagem de serviço? Os dados não poderão ser editados.')) {
      setStatus('Finalizado');
      alert('Passagem de serviço finalizada com sucesso! Dados consolidados.');
    }
  };

  const isViewOnly = status === 'Finalizado';

  if (opCategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-400">
        <ClipboardList className="w-16 h-16 mb-4 opacity-20" />
        <p className="font-medium">Nenhuma tarefa configurada para esta base.</p>
        <p className="text-sm">Contate o administrador no menu Gerenciamento.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
      
      {/* 1. HEADER DE PRODUTIVIDADE */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-orange-100/50 border border-orange-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
           <TrendingUp className="w-40 h-40 text-orange-600" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 relative z-10">
          <KPICard 
            label="Disponível (Horas)" 
            value={`${horasDisponiveis.toFixed(1)}h`} 
            icon={<Clock className="text-blue-500" />}
            subtext="Capacidade Total Escalada"
          />
          <KPICard 
            label="Produzido (Horas)" 
            value={minutesToHHMMSS(horasProduzidas * 60)} 
            icon={<Timer className="text-orange-500" />}
            subtext="Esforço em Atividades"
          />
          <KPICard 
            label="Performance do Turno" 
            value={`${performance.toFixed(1)}%`} 
            icon={<TrendingUp style={{ color: getCorPerformance(performance) }} />}
            color={getCorPerformance(performance)}
            subtext="Eficiência Operacional"
          />
        </div>

        {/* Barra de Performance */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span>Produtividade Crítica</span>
            <span>Meta Ativa (Base: {currentBase?.sigla})</span>
          </div>
          <div className="h-6 w-full bg-gray-100 rounded-full p-1 shadow-inner flex items-center">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out shadow-lg"
              style={{ 
                width: `${Math.min(performance, 100)}%`, 
                backgroundColor: getCorPerformance(performance)
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-gray-400 px-1">
            <span className="text-red-500">Crítico ({currentBase?.metaAmarelo || 40}%)</span>
            <span className="text-yellow-600">Atenção</span>
            <span className="text-green-600">Meta ({currentBase?.metaVerde || 70}%)</span>
            <span className="text-blue-600 font-black">Superação</span>
          </div>
        </div>
      </div>

      {/* 2. DADOS DO TURNO */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <InfoItem label="Data Operacional" value={dataOperacional} icon={<Calendar className="w-4 h-4" />} />
        <InfoItem 
          label="Base Operacional" 
          value={`${currentBase?.sigla} - ${currentBase?.nome}`} 
          icon={<MapPin className="w-4 h-4" />} 
        />
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Turno Ativo</label>
          <select 
            disabled={isViewOnly}
            value={selectedTurno}
            onChange={(e) => setSelectedTurno(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-200"
          >
            <option value="">Selecione o Turno...</option>
            {currentBase?.turnos.map(t => (
              <option key={t.id} value={t.id}>Turno {t.numero} ({t.horaInicio} - {t.horaFim})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. COLABORADORES */}
      <section className="space-y-4">
        <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm px-2">
          <Users className="w-4 h-4 text-orange-500" />
          <span>Equipe do Turno (Máx 6)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {colaboradoresIds.map((id, index) => {
            const selectedUser = baseUsers.find(u => u.id === id);
            return (
              <div key={index} className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-orange-200 transition-all flex items-center space-x-3 group">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <select 
                    disabled={isViewOnly}
                    value={id || ""} 
                    onChange={(e) => handleColaboradorChange(index, e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-800 outline-none"
                  >
                    <option value="">Adicionar Colaborador...</option>
                    {baseUsers.map(u => (
                      <option key={u.id} value={u.id} disabled={colaboradoresIds.includes(u.id) && u.id !== id}>
                        {u.nome}
                      </option>
                    ))}
                  </select>
                  {selectedUser && (
                    <p className="text-[10px] font-black text-orange-600 uppercase">Jornada: {selectedUser.jornadaPadrao}h</p>
                  )}
                </div>
                {id && !isViewOnly && (
                  <button onClick={() => handleColaboradorChange(index, "")} className="text-gray-300 hover:text-red-500 p-1">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. CONTROLES IMPORTANTES */}
      <section className="space-y-4">
         <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm px-2">
          <AlertCircle className="w-4 h-4 text-orange-500" />
          <span>Controles de Qualidade & TAT</span>
        </h3>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
           <table className="w-full text-left text-sm">
             <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
               <tr>
                 <th className="px-6 py-4">Controle</th>
                 <th className="px-6 py-4">Descrição</th>
                 <th className="px-6 py-4 w-32">Valor / Dias</th>
                 <th className="px-6 py-4 w-20 text-center">Alerta</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {controls.filter(c => c.status === 'Ativo').map(control => {
                 const valor = controlesValores[control.id] || 0;
                 let cor = '#4CAF50'; 
                 if (valor > control.alertaConfig.amarelo) cor = '#F44336';
                 else if (valor > control.alertaConfig.verde) cor = '#FFC107';

                 return (
                   <tr key={control.id}>
                     <td className="px-6 py-4 font-bold text-gray-700">{control.nome}</td>
                     <td className="px-6 py-4 text-gray-400 text-xs italic">{control.descricao}</td>
                     <td className="px-6 py-4">
                       <input 
                        disabled={isViewOnly}
                        type="number" 
                        value={valor || ''}
                        onChange={(e) => setControlesValores({...controlesValores, [control.id]: parseInt(e.target.value) || 0})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-lg p-2 font-black text-center focus:ring-1 focus:ring-orange-200 outline-none"
                        placeholder="0"
                       />
                     </td>
                     <td className="px-6 py-4 text-center">
                        <div className="w-4 h-4 rounded-full mx-auto shadow-sm" style={{ backgroundColor: cor }}></div>
                     </td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
        </div>
      </section>

      {/* 5. TAREFAS EXECUTADAS */}
      <section className="space-y-6">
        <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm px-2">
          <ClipboardList className="w-4 h-4 text-orange-500" />
          <span>Detalhamento de Atividades</span>
        </h3>
        <div className="space-y-12">
          {opCategories.map(cat => (
            <div key={cat.id} className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-orange-100 pb-2">
                <h4 className="font-black text-gray-800 uppercase tracking-tighter flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                  <span>{cat.nome}</span>
                </h4>
                <span className="text-[10px] font-black text-gray-300 uppercase">Ordem {cat.ordem}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opTasks.filter(t => t.categoriaId === cat.id).map(task => (
                  <div key={task.id} className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-orange-200 transition-all flex items-center justify-between group">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-gray-700 text-sm">{task.nome}</p>
                        {task.obrigatoriedade && <span className="text-[8px] px-1.5 py-0.5 bg-red-50 text-red-500 border border-red-100 rounded-full font-black uppercase">Obrigatória</span>}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {task.tipoMedida === MeasureType.QTD 
                          ? `Fator: ${task.fatorMultiplicador} min/unid` 
                          : 'Lançamento de Tempo Real'}
                      </p>
                    </div>
                    
                    <div className="w-32">
                      <p className="text-[9px] font-black text-gray-300 uppercase mb-1 text-center">
                        {task.tipoMedida === MeasureType.QTD ? 'Quantidade' : 'Tempo (HH:MM:SS)'}
                      </p>
                      <input 
                        disabled={isViewOnly}
                        type="text"
                        placeholder={task.tipoMedida === MeasureType.QTD ? "0" : "00:00:00"}
                        value={tarefasValores[task.id] || ''}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (task.tipoMedida === MeasureType.TEMPO) {
                            val = val.replace(/\D/g, '').slice(0, 6);
                            if (val.length > 4) val = val.replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3');
                            else if (val.length > 2) val = val.replace(/(\d{2})(\d{2})/, '$1:$2');
                          }
                          setTarefasValores({...tarefasValores, [task.id]: val});
                        }}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center font-black text-orange-600 focus:border-orange-500 outline-none transition-all" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. OUTRAS ATIVIDADES */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm">
            <Plus className="w-4 h-4 text-orange-500" />
            <span>Atividades Extras & Não Rotineiras</span>
          </h3>
          {!isViewOnly && (
            <button 
              onClick={addOutraAtividade}
              className="text-xs font-black text-orange-600 hover:text-orange-700 uppercase tracking-widest flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" /> <span>Adicionar</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          {outrasAtividades.map(atv => (
            <div key={atv.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center space-x-4 animate-in slide-in-from-left-2">
               <input 
                disabled={isViewOnly}
                placeholder="Descrição da atividade..."
                value={atv.descricao}
                onChange={(e) => updateOutraAtividade(atv.id, 'descricao', e.target.value)}
                className="flex-1 bg-transparent border-none font-bold text-sm text-gray-700 outline-none"
               />
               <div className="w-32 flex items-center space-x-2">
                  <span className="text-[10px] font-black text-gray-300 uppercase">Minutos:</span>
                  <input 
                    disabled={isViewOnly}
                    type="number"
                    value={atv.tempo || ''}
                    onChange={(e) => updateOutraAtividade(atv.id, 'tempo', parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-50 border-none rounded-lg p-2 font-black text-orange-600 text-center text-sm"
                  />
               </div>
               {!isViewOnly && (
                 <button onClick={() => removeOutraAtividade(atv.id)} className="text-gray-300 hover:text-red-500">
                   <Trash2 className="w-4 h-4" />
                 </button>
               )}
            </div>
          ))}
          {outrasAtividades.length === 0 && (
             <div className="py-8 text-center text-gray-300 text-xs italic bg-white/50 border-2 border-dashed border-gray-100 rounded-3xl">
                Nenhuma atividade extra registrada.
             </div>
          )}
        </div>
      </section>

      {/* 7. INFORMAÇÕES IMPORTANTES */}
      <section className="space-y-4">
        <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm px-2">
          <Info className="w-4 h-4 text-orange-500" />
          <span>Relatório de Ocorrências</span>
        </h3>
        <textarea 
          disabled={isViewOnly}
          rows={6}
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder="Descreva problemas com equipamentos, falta de insumos, atrasos críticos ou qualquer observação relevante para o próximo turno..."
          className="w-full bg-white p-6 rounded-3xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm font-medium text-gray-700"
        />
      </section>

      {/* 8. BOTÕES DE AÇÃO */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-4 z-40">
        {!isViewOnly ? (
          <>
            <button className="bg-white text-gray-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-gray-50 transition-all border border-gray-100 flex items-center space-x-3">
              <Save className="w-5 h-5" />
              <span>Salvar Rascunho</span>
            </button>
            <button 
              onClick={handleFinalize}
              className="gol-orange text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-orange-200 hover:scale-105 active:scale-95 transition-all flex items-center space-x-3"
            >
              <CheckCircle className="w-6 h-6" />
              <span>Finalizar Turno</span>
            </button>
          </>
        ) : (
          <div className="bg-green-500 text-white px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-2xl flex items-center space-x-3 animate-in zoom-in-95">
            <CheckCircle className="w-6 h-6" />
            <span>Passagem Finalizada</span>
          </div>
        )}
      </div>

    </div>
  );
};

const KPICard: React.FC<{label: string, value: string, icon: React.ReactNode, subtext: string, color?: string}> = ({label, value, icon, subtext, color}) => (
  <div className="p-4 bg-gray-50/50 rounded-2xl flex items-center space-x-4 border border-white">
    <div className="p-3 bg-white rounded-xl shadow-sm">{icon}</div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-2xl font-black text-gray-800" style={{ color }}>{value}</h3>
      <p className="text-[9px] font-bold text-gray-400 uppercase">{subtext}</p>
    </div>
  </div>
);

const InfoItem: React.FC<{label: string, value: string, icon: React.ReactNode}> = ({label, value, icon}) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{label}</label>
    <div className="flex items-center space-x-2 text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-xl">
      <div className="text-orange-500">{icon}</div>
      <span>{value}</span>
    </div>
  </div>
);

export default ShiftHandoverPage;
