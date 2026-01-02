
import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Clock, MapPin, Shield, Info, AlertCircle, TrendingUp, Box as BoxIcon, Truck, AlertOctagon, Calendar, Layers, Palette, Settings, AlertTriangle, CheckCircle2, Target, Lock } from 'lucide-react';
import { 
  Base, User, Category, Task, Control, Shift, PermissionLevel, MeasureType,
  DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem, CustomControlType, ManagedItem, ConditionConfig, PopupConfig, NivelAcessoCustomizado
} from './types';

import { 
  LocalizationProvider 
} from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { 
  Box, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Typography,
  Grid,
  OutlinedInput,
  Chip
} from '@mui/material';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/pt-br';

dayjs.extend(customParseFormat);
dayjs.locale('pt-br');

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  initialData?: any;
}

export const CustomLabel: React.FC<{
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number | string;
  exibir?: boolean;
  formato?: 'horas' | 'numero' | 'percentual';
}> = (props) => {
  const { x = 0, y = 0, width = 0, value = 0, exibir = false, formato = 'numero' } = props;
  if (!exibir || value === undefined || value === null) return null;

  const numValue = Number(value);
  if (isNaN(numValue)) return null;

  let textoFormatado = '';
  switch (formato) {
    case 'horas':
      const totalSeconds = Math.round(numValue * 3600);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      textoFormatado = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      break;
    case 'percentual':
      textoFormatado = `${numValue.toFixed(1)}%`;
      break;
    case 'numero':
    default:
      textoFormatado = numValue.toFixed(1);
      break;
  }

  return (
    <text
      x={x + width / 2}
      y={y - 8}
      fill="currentColor"
      textAnchor="middle"
      fontSize={10}
      fontWeight="900"
      className="fill-gray-700 dark:fill-gray-300"
    >
      {textoFormatado}
    </text>
  );
};

export const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
}> = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Confirmar", cancelLabel, type = 'warning' }) => {
  
  useEffect(() => {
    const handleModalKeys = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
        onClose();
      }
    };
    window.addEventListener('keydown', handleModalKeys);
    return () => window.removeEventListener('keydown', handleModalKeys);
  }, [isOpen, onConfirm, onClose]);

  if (!isOpen) return null;

  const colors = {
    danger: 'bg-red-600 text-white',
    warning: 'bg-orange-600 text-white',
    info: 'bg-blue-600 text-white',
    success: 'bg-green-600 text-white'
  };

  const icons = {
    danger: <AlertOctagon className="w-12 h-12 mb-4" />,
    warning: <AlertTriangle className="w-12 h-12 mb-4" />,
    info: <Info className="w-12 h-12 mb-4" />,
    success: <CheckCircle2 className="w-12 h-12 mb-4" />
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`p-8 flex flex-col items-center text-center ${colors[type]}`}>
          {icons[type]}
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">{title}</h3>
          <p className="text-sm font-bold opacity-90 leading-relaxed">{message}</p>
        </div>
        <div className="p-6 flex space-x-3 bg-gray-50">
          {cancelLabel && (
            <button 
              onClick={onClose} 
              className="flex-1 py-4 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all"
            >
              {cancelLabel}
            </button>
          )}
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all hover:scale-105 ${colors[type]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const hhmmssToMinutes = (hms: string): number => {
  if (!hms || hms === '00:00:00' || hms === '__:__:__') return 0;
  const cleanHms = hms.replace(/_/g, '0');
  const partes = cleanHms.split(':').map(v => parseInt(v) || 0);
  
  if (partes.length === 3) {
    return (partes[0] * 60) + partes[1] + (partes[2] / 60);
  } else if (partes.length === 2) {
    return (partes[0] * 60) + partes[1];
  }
  return partes[0] * 60;
};

export const minutesToHhmmss = (totalMinutes: number): string => {
  if (isNaN(totalMinutes) || totalMinutes <= 0) return '00:00:00';
  const totalSeconds = Math.round(totalMinutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const hStr = h < 10 ? `0${h}` : h.toString();
  return `${hStr}:${pad(m)}:${pad(s)}`;
};

export const TimeInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}> = ({ value, onChange, onBlur, onKeyDown, disabled, className, placeholder = "__:__:__" }) => {
  const [displayValue, setDisplayValue] = useState(value || "");

  useEffect(() => {
    setDisplayValue(value || "");
  }, [value]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);
    
    let formatted = val;
    if (val.length >= 5) {
      formatted = `${val.slice(0, val.length - 4)}:${val.slice(val.length - 4, val.length - 2)}:${val.slice(val.length - 2)}`;
    } else if (val.length >= 3) {
      formatted = `${val.slice(0, val.length - 2)}:${val.slice(val.length - 2)}`;
    }

    if (val === "") {
      setDisplayValue("");
      onChange("");
      return;
    }

    const finalVal = formatted.padStart(val.length <= 2 ? val.length : (val.length <= 4 ? val.length + 1 : val.length + 2), '0');
    setDisplayValue(finalVal);
    onChange(finalVal);
  };

  const handleBlurInternal = () => {
    if (displayValue && displayValue !== "") {
      const parts = displayValue.split(':');
      if (parts.length < 3) {
        const h = (parts[0] || '0').padStart(2, '0');
        const m = (parts[1] || '0').padStart(2, '0');
        const s = (parts[2] || '0').padStart(2, '0');
        const full = `${h}:${m}:${s}`;
        setDisplayValue(full);
        onChange(full);
      }
    }
    if (onBlur) onBlur();
  };

  return (
    <input
      type="text"
      disabled={disabled}
      value={displayValue}
      onBlur={handleBlurInternal}
      onKeyDown={onKeyDown}
      onChange={handleInput}
      placeholder={placeholder}
      className={`font-black text-center outline-none ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    />
  );
};

export const DatePickerField: React.FC<{
  label?: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, onBlur, onKeyDown, placeholder = "DD/MM/YYYY", disabled = false }) => {
  const dateValue = value && dayjs(value as string, 'DD/MM/YYYY').isValid() 
    ? dayjs(value as string, 'DD/MM/YYYY') 
    : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <div className="space-y-1 relative w-full">
        {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{label}</label>}
        <DatePicker
          value={dateValue}
          disabled={disabled}
          format="DD/MM/YYYY"
          onAccept={(newValue: any) => {
            if (newValue && dayjs(newValue).isValid()) {
              const formattedDate = dayjs(newValue).format('DD/MM/YYYY');
              onChange(formattedDate);
              if (onBlur) setTimeout(onBlur, 200);
            }
          }}
          onChange={(newValue: any) => {
            if (newValue && dayjs(newValue).isValid()) {
              const formattedDate = dayjs(newValue).format('DD/MM/YYYY');
              onChange(formattedDate);
            }
          }}
          slotProps={{
            textField: {
              fullWidth: true,
              variant: 'outlined',
              placeholder: placeholder,
              size: 'small',
              onBlur: onBlur,
              onKeyDown: onKeyDown,
              sx: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: '0.75rem',
                  backgroundColor: '#f9fafb',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  '& fieldset': { borderColor: '#f3f4f6' },
                  '&:hover fieldset': { borderColor: '#fdba74' },
                  '&.Mui-focused fieldset': { borderColor: '#FF5A00' },
                }
              }
            }
          }}
        />
      </div>
    </LocalizationProvider>
  );
};

const Input: React.FC<{ label: string, value: any, onChange: (val: string) => void, type?: string, className?: string }> = ({ label, value, onChange, type = "text", className = "" }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <input 
      type={type}
      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-orange-100 transition-all text-sm"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

export const ControlItemModal: React.FC<ModalProps & { activeTab: string, customControlTypes: CustomControlType[] }> = ({ isOpen, onClose, onSave, title, initialData, activeTab, customControlTypes }) => {
  const [formData, setFormData] = useState<any>({});
  
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const base = { id: Math.random().toString(36).substr(2, 9), status: 'ativo', visivel: true };
      if (activeTab === 'shelf') setFormData({ ...base, partNumber: '', lote: '', dataVencimento: '' });
      else if (activeTab === 'loc') setFormData({ ...base, nomeLocation: '' });
      else if (activeTab === 'trans') setFormData({ ...base, nomeTransito: '', diasPadrao: 0 });
      else if (activeTab === 'crit') setFormData({ ...base, partNumber: '' });
      else {
        const type = customControlTypes.find(t => t.id === activeTab);
        const valores: any = {};
        type?.campos.forEach(c => valores[c] = '');
        setFormData({ ...base, tipoId: activeTab, valores });
      }
    }
  }, [initialData, isOpen, activeTab, customControlTypes]);

  if (!isOpen) return null;

  const currentCustomType = customControlTypes.find(t => t.id === activeTab);

  const handleCustomFieldChange = (campo: string, valor: any) => {
    setFormData({
      ...formData,
      valores: {
        ...(formData.valores || {}),
        [campo]: valor
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95">
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-6">{title}</h3>
        
        <div className="space-y-4">
          {activeTab === 'shelf' && (
            <>
              <Input label="Part Number" value={formData.partNumber} onChange={v => setFormData({...formData, partNumber: v})} />
              <Input label="Lote" value={formData.lote} onChange={v => setFormData({...formData, lote: v})} />
              <DatePickerField label="Data de Vencimento" value={formData.dataVencimento} onChange={v => setFormData({...formData, dataVencimento: v})} />
            </>
          )}
          {activeTab === 'loc' && (
            <Input label="Nome da Location" value={formData.nomeLocation} onChange={v => setFormData({...formData, nomeLocation: v.toUpperCase()})} />
          )}
          {activeTab === 'trans' && (
            <>
              <Input label="Nome do Trânsito" value={formData.nomeTransito} onChange={v => setFormData({...formData, nomeTransito: v.toUpperCase()})} />
              <Input label="TAT Padrão (Dias)" type="number" value={formData.diasPadrao} onChange={v => setFormData({...formData, diasPadrao: parseInt(v) || 0})} />
            </>
          )}
          {activeTab === 'crit' && (
            <Input label="Part Number" value={formData.partNumber} onChange={v => setFormData({...formData, partNumber: v})} />
          )}
          {currentCustomType && (
            currentCustomType.campos.map(campo => (
              <Input key={campo} label={campo} value={formData.valores?.[campo] || ''} onChange={v => handleCustomFieldChange(campo, v)} />
            ))
          )}
        </div>

        <div className="flex space-x-2 mt-8">
          <button onClick={onClose} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-gray-200 transition-all">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all">Salvar Item</button>
        </div>
      </div>
    </div>
  );
};

export const BaseModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title, initialData }) => {
  const [formData, setFormData] = useState<Partial<Base>>({ 
    nome: '', 
    sigla: '', 
    status: 'Ativa', 
    turnos: [],
    metaVerde: 80,
    metaAmarelo: 50,
    metaVermelho: 30,
    metaHorasDisponiveisAno: {}
  });

  useEffect(() => { 
    if (initialData) {
      setFormData({
        ...initialData,
        metaHorasDisponiveisAno: initialData.metaHorasDisponiveisAno || {}
      });
    } else {
      const defaultMetas: Record<string, number> = {};
      ['01','02','03','04','05','06','07','08','09','10','11','12'].forEach(m => defaultMetas[m] = 160);
      setFormData({ nome: '', sigla: '', status: 'Ativa', turnos: [], metaVerde: 80, metaAmarelo: 50, metaVermelho: 30, metaHorasDisponiveisAno: defaultMetas });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddShift = () => {
    const nextNumber = (formData.turnos?.length || 0) + 1;
    const newShift: Shift = {
      id: Math.random().toString(36).substr(2, 9),
      numero: nextNumber,
      horaInicio: '',
      horaFim: ''
    };
    setFormData({ ...formData, turnos: [...(formData.turnos || []), newShift] });
  };

  const handleRemoveShift = (id: string) => {
    setFormData({ ...formData, turnos: formData.turnos?.filter(t => t.id !== id) });
  };

  const handleUpdateShift = (id: string, field: keyof Shift, value: any) => {
    setFormData({
      ...formData,
      turnos: formData.turnos?.map(t => t.id === id ? { ...t, [field]: value } : t)
    });
  };

  const handleUpdateMeta = (mes: string, value: number) => {
    setFormData({
      ...formData,
      metaHorasDisponiveisAno: {
        ...(formData.metaHorasDisponiveisAno || {}),
        [mes]: value
      }
    });
  };

  const meses = [
    { mes: '01', nome: 'Jan' }, { mes: '02', nome: 'Fev' }, { mes: '03', nome: 'Mar' },
    { mes: '04', nome: 'Abr' }, { mes: '05', nome: 'Mai' }, { mes: '06', nome: 'Jun' },
    { mes: '07', nome: 'Jul' }, { mes: '08', nome: 'Ago' }, { mes: '09', nome: 'Set' },
    { mes: '10', nome: 'Out' }, { mes: '11', nome: 'Nov' }, { mes: '12', nome: 'Dez' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-8 animate-in zoom-in-95 max-h-[95vh] overflow-y-auto scrollbar-hide">
        <div className="flex justify-between items-center mb-8">
           <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{title}</h3>
           <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nome da Base" value={formData.nome} onChange={v => setFormData({...formData, nome: v})} />
            <Input label="Sigla" value={formData.sigla} onChange={v => setFormData({...formData, sigla: v.toUpperCase()})} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-orange-600">
                <Target className="w-5 h-5" />
                <span className="text-sm font-black uppercase tracking-widest">Meta de Horas Disponíveis por Mês</span>
            </div>
            <Grid container spacing={1.5} className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
              {meses.map(({ mes, nome }) => (
                <Grid size={{ xs: 4, sm: 3, md: 2 }} key={mes}>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block text-center">{nome}</label>
                    <input 
                      type="number" 
                      className="w-full p-2 bg-white border border-gray-100 rounded-xl font-black text-xs text-center outline-none focus:ring-2 focus:ring-orange-100" 
                      value={formData.metaHorasDisponiveisAno?.[mes] || 160} 
                      onChange={e => handleUpdateMeta(mes, parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                </Grid>
              ))}
            </Grid>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-orange-600">
                <Palette className="w-5 h-5" />
                <span className="text-sm font-black uppercase tracking-widest">Metas Visuais de Performance (%)</span>
            </div>
            <div className="grid grid-cols-3 gap-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-green-600 uppercase tracking-widest block">Verde (Min %)</label>
                  <input type="number" className="w-full p-3 bg-white border border-gray-100 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-green-100" value={formData.metaVerde} onChange={e => setFormData({...formData, metaVerde: parseInt(e.target.value) || 0})} />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-yellow-600 uppercase tracking-widest block">Amarelo (Min %)</label>
                  <input type="number" className="w-full p-3 bg-white border border-gray-100 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-yellow-100" value={formData.metaAmarelo} onChange={e => setFormData({...formData, metaAmarelo: parseInt(e.target.value) || 0})} />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-red-600 uppercase tracking-widest block">Vermelho (Max %)</label>
                  <input type="number" className="w-full p-3 bg-white border border-gray-100 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-red-100" value={formData.metaVermelho} onChange={e => setFormData({...formData, metaVermelho: parseInt(e.target.value) || 0})} />
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <div className="flex items-center space-x-2 text-orange-600">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-black uppercase tracking-widest">Gerenciamento de Turnos</span>
               </div>
               <button 
                onClick={handleAddShift}
                className="text-[10px] font-black text-orange-600 bg-orange-50 px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-sm"
               >
                 + Adicionar Turno
               </button>
            </div>

            <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 space-y-4">
               {formData.turnos && formData.turnos.length > 0 ? (
                 formData.turnos.map((turno, idx) => (
                   <div key={turno.id} className="grid grid-cols-12 gap-3 items-end bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-left-2">
                      <div className="col-span-2">
                         <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nº Turno</label>
                         <input 
                          type="number" 
                          className="w-full p-2.5 bg-gray-50 border border-transparent rounded-lg font-black text-center text-sm outline-none focus:bg-white focus:border-orange-200 transition-all"
                          value={turno.numero}
                          onChange={e => handleUpdateShift(turno.id, 'numero', parseInt(e.target.value) || 0)}
                         />
                      </div>
                      <div className="col-span-4">
                         <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Hora Início</label>
                         <input 
                          type="text" 
                          placeholder="00:00"
                          className="w-full p-2.5 bg-gray-50 border border-transparent rounded-lg font-black text-center text-sm outline-none focus:bg-white focus:border-orange-200 transition-all"
                          value={turno.horaInicio}
                          onChange={e => handleUpdateShift(turno.id, 'horaInicio', e.target.value)}
                         />
                      </div>
                      <div className="col-span-4">
                         <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Hora Fim</label>
                         <input 
                          type="text" 
                          placeholder="00:00"
                          className="w-full p-2.5 bg-gray-50 border border-transparent rounded-lg font-black text-center text-sm outline-none focus:bg-white focus:border-orange-200 transition-all"
                          value={turno.horaFim}
                          onChange={e => handleUpdateShift(turno.id, 'horaFim', e.target.value)}
                         />
                      </div>
                      <div className="col-span-2 pb-1">
                         <button 
                          onClick={() => handleRemoveShift(turno.id)}
                          className="w-full p-2.5 text-gray-300 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="py-8 text-center text-gray-300">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhum turno cadastrado</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-10">
          <button onClick={onClose} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs tracking-widest text-gray-400 hover:bg-gray-200 transition-all">Cancelar</button>
          <button onClick={() => onSave({...formData, id: formData.id || Math.random().toString(36).substr(2, 9)})} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all hover:scale-105 active:scale-95">Salvar Base</button>
        </div>
      </div>
    </div>
  );
};

export const UserModal: React.FC<ModalProps & { availableBases: Base[], availableLevels: NivelAcessoCustomizado[] }> = ({ isOpen, onClose, onSave, title, initialData, availableBases, availableLevels }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    permissao: 'OPERACIONAL',
    bases: [] as string[],
    jornadaPadrao: 6,
    status: 'Ativo'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Garantia de que bases seja sempre um array para evitar crash no map/includes
        bases: Array.isArray(initialData.bases) ? initialData.bases : []
      });
    } else {
      setFormData({ nome: '', email: '', permissao: 'OPERACIONAL', bases: [], jornadaPadrao: 6, status: 'Ativo' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95">
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-6">{title}</h3>
        <div className="space-y-4">
          <Input label="Nome Completo" value={formData.nome} onChange={v => setFormData({...formData, nome: v})} />
          <Input label="E-mail Corporativo" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nível de Acesso</label>
              <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" value={formData.permissao} onChange={e => setFormData({...formData, permissao: e.target.value})}>
                {availableLevels.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
            <Input label="Jornada (Horas)" type="number" value={formData.jornadaPadrao} onChange={v => setFormData({...formData, jornadaPadrao: parseInt(v) || 0})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidades Associadas</label>
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              {availableBases.map(base => (
                <label key={base.id} className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={(formData.bases || []).includes(base.id)} 
                    onChange={e => {
                      const currentBases = Array.isArray(formData.bases) ? formData.bases : [];
                      const newBases = e.target.checked 
                        ? [...currentBases, base.id]
                        : currentBases.filter(id => id !== base.id);
                      setFormData({...formData, bases: newBases});
                    }}
                  />
                  <span className="text-xs font-bold text-gray-600">{base.sigla}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex space-x-3 mt-8">
          <button onClick={onClose} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-gray-200 transition-all">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all">Salvar</button>
        </div>
      </div>
    </div>
  );
};

export const TaskModal: React.FC<ModalProps & { categories: Category[] }> = ({ isOpen, onClose, onSave, title, initialData, categories }) => {
  const [formData, setFormData] = useState({
    nome: '',
    categoriaId: '',
    tipoMedida: MeasureType.QTD,
    fatorMultiplicador: 1,
    obrigatoriedade: false,
    status: 'Ativa'
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
    else setFormData({ nome: '', categoriaId: categories[0]?.id || '', tipoMedida: MeasureType.QTD, fatorMultiplicador: 1, obrigatoriedade: false, status: 'Ativa' });
  }, [initialData, isOpen, categories]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95">
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-6">{title}</h3>
        <div className="space-y-4">
          <Input label="Nome da Tarefa" value={formData.nome} onChange={v => setFormData({...formData, nome: v})} />
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoria</label>
            <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" value={formData.categoriaId} onChange={e => setFormData({...formData, categoriaId: e.target.value})}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Medida</label>
              <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" value={formData.tipoMedida} onChange={e => setFormData({...formData, tipoMedida: e.target.value as MeasureType})}>
                <option value={MeasureType.QTD}>Quantidade</option>
                <option value={MeasureType.TEMPO}>Tempo (HH:MM:SS)</option>
              </select>
            </div>
            {formData.tipoMedida === MeasureType.QTD && (
              <Input label="Fator (Minutos por Unidade)" type="number" value={formData.fatorMultiplicador} onChange={v => setFormData({...formData, fatorMultiplicador: parseFloat(v) || 0})} />
            )}
          </div>
        </div>
        <div className="flex space-x-3 mt-8">
          <button onClick={onClose} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-gray-200 transition-all">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all">Salvar</button>
        </div>
      </div>
    </div>
  );
};

export const CategoryModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title, initialData }) => {
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'operacional',
    exibicao: 'lista',
    ordem: 1,
    status: 'Ativa'
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
    else setFormData({ nome: '', tipo: 'operacional', exibicao: 'lista', ordem: 1, status: 'Ativa' });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95">
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-6">{title}</h3>
        <div className="space-y-4">
          <Input label="Nome da Categoria" value={formData.nome} onChange={v => setFormData({...formData, nome: v.toUpperCase()})} />
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exibição</label>
                <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" value={formData.exibicao} onChange={e => setFormData({...formData, exibicao: e.target.value as any})}>
                  <option value="lista">Lista Aberta</option>
                  <option value="suspensa">Lista Suspensa</option>
                </select>
             </div>
             <Input label="Ordem" type="number" value={formData.ordem} onChange={v => setFormData({...formData, ordem: parseInt(v) || 0})} />
          </div>
        </div>
        <div className="flex space-x-3 mt-8">
          <button onClick={onClose} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-gray-200 transition-all">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all">Salvar</button>
        </div>
      </div>
    </div>
  );
};

export const CustomControlTypeModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title }) => {
  const [formData, setFormData] = useState({ nome: '', campos: [''] });

  if (!isOpen) return null;

  const handleAddField = () => setFormData({ ...formData, campos: [...formData.campos, ''] });
  const handleRemoveField = (idx: number) => setFormData({ ...formData, campos: formData.campos.filter((_, i) => i !== idx) });
  const handleFieldChange = (idx: number, val: string) => {
    const next = [...formData.campos];
    next[idx] = val;
    setFormData({ ...formData, campos: next });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95">
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-6">{title}</h3>
        <div className="space-y-4">
          <Input label="Nome do Controle" value={formData.nome} onChange={v => setFormData({ ...formData, nome: v })} />
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Campos do Formulário</label>
            {formData.campos.map((campo, idx) => (
              <div key={idx} className="flex gap-2">
                <input 
                  className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold outline-none text-sm"
                  value={campo}
                  onChange={e => handleFieldChange(idx, e.target.value)}
                  placeholder={`Campo ${idx + 1}`}
                />
                <button onClick={() => handleRemoveField(idx)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={16}/></button>
              </div>
            ))}
            <button onClick={handleAddField} className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-orange-600 hover:border-orange-100 transition-all">+ Adicionar Campo</button>
          </div>
        </div>
        <div className="flex space-x-3 mt-8">
          <button onClick={onClose} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-gray-200 transition-all">Cancelar</button>
          <button onClick={() => onSave({ ...formData, id: `custom_${Date.now()}` })} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all">Criar Tipo</button>
        </div>
      </div>
    </div>
  );
};

export const ControlItemSettingsModal: React.FC<{ isOpen: boolean, onClose: () => void, item: any, onSave: (data: any) => void }> = ({ isOpen, onClose, item, onSave }) => {
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        cores: item.cores || {
          verde: { condicao: 'Valor', operador: '<=', valor: 0, habilitado: true },
          amarelo: { condicao: 'Valor', operador: 'entre', valor: 0, valorMax: 0, habilitado: true },
          vermelho: { condicao: 'Valor', operador: '>', valor: 0, habilitado: true }
        },
        popups: item.popups || {
          verde: { titulo: 'OK', mensagem: '', habilitado: false },
          amarelo: { titulo: 'Atenção', mensagem: '', habilitado: true },
          vermelho: { titulo: 'Crítico', mensagem: '', habilitado: true }
        }
      });
    }
  }, [item, isOpen]);

  if (!isOpen || !formData) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl p-10 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex justify-between items-center mb-8">
           <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Alertas & Cores: {item.partNumber || item.nomeLocation || item.nomeTransito || item.nome}</h3>
           <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500"><X size={24}/></button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {['verde', 'amarelo', 'vermelho'].map((cor: any) => (
            <div key={cor} className={`p-6 rounded-[2rem] border-2 ${cor === 'verde' ? 'border-green-100 bg-green-50/30' : (cor === 'amarelo' ? 'border-yellow-100 bg-yellow-50/30' : 'border-red-100 bg-red-50/30')}`}>
               <div className="flex items-center gap-2 mb-4">
                  <div className={`w-3 h-3 rounded-full ${cor === 'verde' ? 'bg-green-500' : (cor === 'amarelo' ? 'bg-yellow-500' : 'bg-red-500')}`} />
                  <span className="text-xs font-black uppercase tracking-widest">{cor}</span>
               </div>
               
               <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase">Operador</label>
                    <select 
                      className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold"
                      value={formData.cores[cor].operador}
                      onChange={e => setFormData({...formData, cores: {...formData.cores, [cor]: {...formData.cores[cor], operador: e.target.value}}})}
                    >
                      <option value="=">=</option>
                      <option value="!=">!=</option>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value=">=">&gt;=</option>
                      <option value="<=">&lt;=</option>
                      <option value="entre">Entre</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Valor" value={formData.cores[cor].valor} onChange={v => setFormData({...formData, cores: {...formData.cores, [cor]: {...formData.cores[cor], valor: v}}})} />
                    {formData.cores[cor].operador === 'entre' && (
                      <Input label="Valor Máx" value={formData.cores[cor].valorMax} onChange={v => setFormData({...formData, cores: {...formData.cores, [cor]: {...formData.cores[cor], valorMax: v}}})} />
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.popups[cor].habilitado} onChange={e => setFormData({...formData, popups: {...formData.popups, [cor]: {...formData.popups[cor], habilitado: e.target.checked}}})} />
                      <span className="text-[9px] font-black uppercase text-gray-500">Habilitar Pop-up</span>
                    </label>
                    {formData.popups[cor].habilitado && (
                      <div className="mt-3 space-y-2">
                         <input className="w-full p-2 bg-white border border-gray-100 rounded-lg text-xs font-bold" placeholder="Título" value={formData.popups[cor].titulo} onChange={e => setFormData({...formData, popups: {...formData.popups, [cor]: {...formData.popups[cor], titulo: e.target.value}}})} />
                         <textarea className="w-full p-2 bg-white border border-gray-100 rounded-lg text-xs font-medium h-16 resize-none" placeholder="Mensagem" value={formData.popups[cor].mensagem} onChange={e => setFormData({...formData, popups: {...formData.popups, [cor]: {...formData.popups[cor], mensagem: e.target.value}}})} />
                      </div>
                    )}
                  </div>
               </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-3 mt-10">
          <button onClick={onClose} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs tracking-widest text-gray-400 hover:bg-gray-200 transition-all">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all">Salvar Configuração</button>
        </div>
      </div>
    </div>
  );
};
