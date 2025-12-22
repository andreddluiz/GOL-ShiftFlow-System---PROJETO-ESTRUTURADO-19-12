
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  CheckCircle, Trash2, Info, Users, Clock, AlertTriangle, ClipboardList,
  X, TrendingUp, Timer, MapPin, Box, Truck, FlaskConical, AlertOctagon, Plane, Settings
} from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { 
  MeasureType, OutraAtividade, Control, 
  LocationRow, TransitRow, ShelfLifeRow, CriticalRow, AlertConfig, ManagedItem 
} from '../types';
import { DatePickerField, TimeInput, hhmmssToMinutes, minutesToHhmmss } from '../modals';

const parseDate = (str: string): Date | null => {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0]);
  const m = parseInt(parts[1]) - 1;
  const y = parseInt(parts[2]);
  const date = new Date(y, m, d);
  return isNaN(date.getTime()) ? null : date;
};

const getDaysDiff = (dateStr: string): number => {
  const date = parseDate(dateStr);
  if (!date) return 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  date.setHours(0,0,0,0);
  return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
};

const getDaysRemaining = (dateStr: string): number => {
  const date = parseDate(dateStr);
  if (!date) return 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  date.setHours(0,0,0,0);
  return Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const ShiftHandoverPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const { 
    getControlesCombinados, getDefaultLocations, getDefaultTransits, getDefaultCriticals, getDefaultShelfLifes,
    customControlTypes, getCustomControlItems,
    bases, users, tasks: allTasks, categories: allCats, controls: allControls, initialized, refreshData 
  } = useStore();
  
  const currentBase = useMemo(() => bases.find(b => b.id === baseId), [bases, baseId]);
  const baseUsers = useMemo(() => users.filter(u => u.bases.includes(baseId || '') && u.status === 'Ativo'), [users, baseId]);
  
  useEffect(() => {
    refreshData(false);
  }, [baseId]);

  const opCategories = useMemo(() => {
    return allCats.filter(c => c.tipo === 'operacional' && c.status === 'Ativa' && (!c.baseId || c.baseId === baseId)).sort((a,b) => a.ordem - b.ordem);
  }, [allCats, baseId]);

  const opTasks = useMemo(() => {
    return allTasks.filter(t => t.status === 'Ativa' && (!t.baseId || t.baseId === baseId));
  }, [allTasks, baseId]);

  const activeControls = useMemo(() => getControlesCombinados(baseId || ''), [getControlesCombinados, baseId, allControls]);

  const [status, setStatus] = useState<'Rascunho' | 'Finalizado'>('Rascunho');
  const [dataOperacional, setDataOperacional] = useState(new Date().toLocaleDateString('pt-BR'));
  const [turnoAtivo, setTurnoAtivo] = useState('');
  const [colaboradoresIds, setColaboradoresIds] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [tarefasValores, setTarefasValores] = useState<Record<string, string>>({}); 
  const [outrasAtividades, setOutrasAtividades] = useState<OutraAtividade[]>([]);
  const [obs, setObs] = useState('');

  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [transit, setTransit] = useState<TransitRow[]>([]);
  const [shelfLife, setShelfLife] = useState<ShelfLifeRow[]>([]);
  const [critical, setCritical] = useState<CriticalRow[]>([]);
  const [customData, setCustomData] = useState<Record<string, any[]>>({});

  const [activeAlert, setActiveAlert] = useState<{titulo: string, mensagem: string, color: string} | null>(null);

  useEffect(() => {
    if (baseId && initialized) {
      console.debug("[DEBUG ShiftHandover] Restaurando itens para painéis (ativo: true)...");
      setLocations(getDefaultLocations(baseId).map(i => ({ id: i.id, nomeLocation: i.nomeLocation, quantidade: 0, dataMaisAntigo: '', isPadrao: true, config: i })));
      setTransit(getDefaultTransits(baseId).map(i => ({ id: i.id, nomeTransito: i.nomeTransito, diasPadrao: i.diasPadrao, quantidade: 0, dataSaida: '', isPadrao: true, config: i })));
      setCritical(getDefaultCriticals(baseId).map(i => ({ id: i.id, partNumber: i.partNumber, lote: '', saldoSistema: 0, saldoFisico: 0, isPadrao: true, config: i })));
      setShelfLife(getDefaultShelfLifes(baseId).map(i => ({ id: i.id, partNumber: i.partNumber, lote: i.lote, dataVencimento: i.dataVencimento, config: i })));
      
      const custObj: Record<string, any[]> = {};
      customControlTypes.forEach(t => {
        custObj[t.id] = getCustomControlItems(baseId, t.id).map(i => ({ id: i.id, valores: {...i.valores}, isPadrao: true, config: i }));
      });
      setCustomData(custObj);
    }
  }, [baseId, initialized]);

  const evaluateAlert = (item: any, value: any, controlType: string) => {
    const config = item.config || activeControls.find(c => c.tipo === controlType);
    if (!config) return;

    // Se o item tem configuração personalizada (Solicitação 3 e 4)
    if (config.cores && config.popups) {
      const check = (lvl: 'vermelho' | 'amarelo' | 'verde') => {
         const { operador, valor } = config.cores[lvl];
         const ref = Number(valor);
         const val = Number(value);
         if (operador === '>') return val > ref;
         if (operador === '<') return val < ref;
         if (operador === '=') return val === ref;
         if (operador === '>=') return val >= ref;
         if (operador === '<=') return val <= ref;
         return false;
      };

      if (check('vermelho')) {
        setActiveAlert({ titulo: config.popups.vermelho.titulo, mensagem: config.popups.vermelho.mensagem, color: 'bg-red-600' });
      } else if (check('amarelo')) {
        setActiveAlert({ titulo: config.popups.amarelo.titulo, mensagem: config.popups.amarelo.mensagem, color: 'bg-yellow-600' });
      } else if (check('verde')) {
        // Opcional mostrar verde
      }
    } else {
       // Fallback para config global legada
       const alertCfg = config.alertaConfig;
       if (!alertCfg) return;
       const val = Number(value);
       if (val > alertCfg.vermelho && alertCfg.permitirPopupVermelho) {
         setActiveAlert({ titulo: 'ALERTA CRÍTICO', mensagem: alertCfg.mensagemVermelho, color: 'bg-red-600' });
       }
    }
  };

  const updateRow = (list: any[], setList: Function, id: string, field: string, value: any) => {
    setList(list.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleBlur = (item: any, controlType: string, value: any) => {
     let calcVal = Number(value);
     if (['dataMaisAntigo', 'dataSaida'].includes(controlType)) calcVal = getDaysDiff(String(value));
     if (controlType === 'shelf_life') calcVal = getDaysRemaining(String(value));
     evaluateAlert(item, calcVal, controlType);
  };

  const isViewOnly = status === 'Finalizado';

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32 animate-in fade-in relative">
      {activeAlert && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${activeAlert.color} text-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full animate-in zoom-in-95`}>
            <div className="flex justify-between items-start mb-4">
               <AlertTriangle className="w-12 h-12" />
               <button onClick={() => setActiveAlert(null)} className="p-1 hover:bg-black/10 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <h4 className="text-2xl font-black uppercase tracking-tight mb-2">{activeAlert.titulo}</h4>
            <p className="font-bold opacity-90 leading-relaxed">{activeAlert.mensagem}</p>
            <button onClick={() => setActiveAlert(null)} className="mt-8 w-full bg-white text-gray-800 py-3 rounded-xl font-black uppercase text-xs">Entendido</button>
          </div>
        </div>
      )}

      {/* HEADER DA BASE */}
      <header className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center justify-between">
         <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner">
               <Plane className="w-8 h-8" />
            </div>
            <div>
               <h2 className="text-3xl font-black text-gray-800 tracking-tighter">Passagem de Turno</h2>
               <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{currentBase?.nome} - {dataOperacional}</p>
            </div>
         </div>
      </header>

      {/* PAINÉIS DE CONTROLE */}
      <section className="grid grid-cols-1 gap-12">
        {/* LOCATIONS */}
        <PanelContainer title="Locations" icon={<Box className="w-4 h-4 text-orange-500" />} onAdd={() => setLocations([...locations, { id: Date.now().toString(), nomeLocation: '', quantidade: 0, dataMaisAntigo: '' }])} isViewOnly={isViewOnly}>
          <table className="w-full text-left">
            <thead><tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-4">Location</th><th className="px-8 py-4">Quant.</th><th className="px-8 py-4">Dias</th></tr></thead>
            <tbody>
              {locations.map(row => (
                <tr key={row.id}>
                  <td className="px-8 py-3 font-bold"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full" value={row.nomeLocation} onChange={e => updateRow(locations, setLocations, row.id, 'nomeLocation', e.target.value)} /></td>
                  <td className="px-8 py-3"><input type="number" disabled={isViewOnly} className="w-16 bg-gray-50 p-2 rounded-lg font-bold" value={row.quantidade} onChange={e => updateRow(locations, setLocations, row.id, 'quantidade', e.target.value)} /></td>
                  <td className="px-8 py-3">
                    <DatePickerField value={row.dataMaisAntigo} onChange={v => updateRow(locations, setLocations, row.id, 'dataMaisAntigo', v)} onBlur={() => handleBlur(row, 'locations', row.dataMaisAntigo)} onKeyDown={e => e.key === 'Enter' && handleBlur(row, 'locations', row.dataMaisAntigo)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PanelContainer>

        {/* TRÂNSITO */}
        <PanelContainer title="Trânsito" icon={<Truck className="w-4 h-4 text-orange-500" />} onAdd={() => setTransit([...transit, { id: Date.now().toString(), nomeTransito: '', diasPadrao: 0, quantidade: 0, dataSaida: '' }])} isViewOnly={isViewOnly}>
          <table className="w-full text-left">
            <thead><tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-4">Tipo</th><th className="px-8 py-4">Quant.</th><th className="px-8 py-4">Dias</th></tr></thead>
            <tbody>
              {transit.map(row => (
                <tr key={row.id}>
                  <td className="px-8 py-3 font-bold"><input disabled={isViewOnly || row.isPadrao} className="bg-transparent w-full" value={row.nomeTransito} onChange={e => updateRow(transit, setTransit, row.id, 'nomeTransito', e.target.value)} /></td>
                  <td className="px-8 py-3"><input type="number" disabled={isViewOnly} className="w-16 bg-gray-50 p-2 rounded-lg font-bold" value={row.quantidade} onChange={e => updateRow(transit, setTransit, row.id, 'quantidade', e.target.value)} /></td>
                  <td className="px-8 py-3">
                    <DatePickerField value={row.dataSaida} onChange={v => updateRow(transit, setTransit, row.id, 'dataSaida', v)} onBlur={() => handleBlur(row, 'transito', row.dataSaida)} onKeyDown={e => e.key === 'Enter' && handleBlur(row, 'transito', row.dataSaida)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PanelContainer>

        {/* CUSTOM PANELS */}
        {customControlTypes.map(type => (
          <PanelContainer key={type.id} title={type.nome} icon={<Settings className="w-4 h-4 text-orange-500" />} isViewOnly={isViewOnly} onAdd={() => {
             const newRow = { id: Date.now().toString(), valores: {}, isPadrao: false };
             setCustomData({...customData, [type.id]: [...(customData[type.id] || []), newRow]});
          }}>
            <table className="w-full text-left">
              <thead><tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">{type.campos.map(c => <th key={c} className="px-8 py-4">{c}</th>)}</tr></thead>
              <tbody>
                {(customData[type.id] || []).map(row => (
                  <tr key={row.id}>
                    {type.campos.map(c => (
                      <td key={c} className="px-8 py-3">
                        <input disabled={isViewOnly} className="bg-gray-50 p-2 rounded-lg font-bold w-full" value={row.valores[c] || ''} onChange={e => {
                          const newList = customData[type.id].map(r => r.id === row.id ? {...r, valores: {...r.valores, [c]: e.target.value}} : r);
                          setCustomData({...customData, [type.id]: newList});
                        }} onBlur={() => handleBlur(row, type.id, row.valores[c])} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </PanelContainer>
        ))}
      </section>

      {/* FINALIZAR */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        {!isViewOnly && (
          <button onClick={() => setStatus('Finalizado')} className="gol-orange text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
            Finalizar Turno
          </button>
        )}
      </div>
    </div>
  );
};

const PanelContainer: React.FC<{title: string, icon: any, children: any, onAdd: any, isViewOnly: boolean}> = ({ title, icon, children, onAdd, isViewOnly }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center px-2">
      <h3 className="font-black text-gray-800 uppercase tracking-widest flex items-center space-x-2 text-sm">{icon} <span>{title}</span></h3>
      {!isViewOnly && <button onClick={onAdd} className="text-[10px] font-black text-orange-600 bg-orange-50 px-4 py-2 rounded-full uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all">+ Adicionar</button>}
    </div>
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">{children}</div>
  </div>
);

export default ShiftHandoverPage;
