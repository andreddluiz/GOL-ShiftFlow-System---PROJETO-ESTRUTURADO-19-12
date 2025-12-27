
import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Clock, MapPin, Shield, Info, AlertCircle, TrendingUp, Box, Truck, AlertOctagon, Calendar, Layers, Palette, Settings, AlertTriangle, CheckCircle2, Target } from 'lucide-react';
import { 
  Base, User, Category, Task, Control, Shift, PermissionLevel, MeasureType,
  DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem, CustomControlType, ManagedItem, ConditionConfig, PopupConfig 
} from './types';

// MUI Imports
import { 
  LocalizationProvider 
} from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { 
  Box as MuiBox, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Typography as MuiTypography
} from '@mui/material';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/pt-br';

// Fix: Extend dayjs with customParseFormat plugin for string parsing
dayjs.extend(customParseFormat);
dayjs.locale('pt-br');

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  initialData?: any;
}

/**
 * Componente de Confirmação Customizado
 */
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

/**
 * Utilitários de Tempo
 */
export const hhmmssToMinutes = (hms: string): number => {
  if (!hms || hms === '00:00:00' || hms === '__:__:__') return 0;
  const cleanHms = hms.replace(/_/g, '0');
  const parts = cleanHms.split(':').map(v => parseInt(v) || 0);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  return (h * 60) + m + (s / 60);
};

export const minutesToHhmmss = (totalMinutes: number): string => {
  if (isNaN(totalMinutes) || totalMinutes <= 0) return '00:00:00';
  const totalSeconds = Math.round(totalMinutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

/**
 * TimeInput
 */
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
    if (val.length > 6) val = val.slice(0, 6);
    
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
    if (displayValue && displayValue.length < 8 && displayValue !== "") {
      const parts = displayValue.split(':');
      const h = (parts[0] || '0').padStart(2, '0');
      const m = (parts[1] || '0').padStart(2, '0');
      const s = (parts[2] || '0').padStart(2, '0');
      const full = `${h}:${m}:${s}`;
      setDisplayValue(full);
      onChange(full);
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
}> = ({ label, value, onChange, onBlur, onKeyDown, placeholder = "DD/MM/AAAA", disabled = false }) => {
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

/**
 * Modal para Itens de Controle
 */
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

export const BaseModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title, initialData }) => {
  const [formData, setFormData] = useState<Partial<Base>>({ 
    nome: '', 
    sigla: '', 
    status: 'Ativa', 
    turnos: [],
    metaVerde: 80,
    metaAmarelo: 50,
    metaVermelho: 30
  });

  useEffect(() => { 
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ nome: '', sigla: '', status: 'Ativa', turnos: [], metaVerde: 80, metaAmarelo: 50, metaVermelho: 30 });
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl p-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
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
                <span className="text-sm font-black uppercase tracking-widest">Metas de Performance (%)</span>
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

/**
 * UserModal Atualizado (Solicitação 56.0)
 * Inclui campo Base, opções de Jornada e opção de Status (ATIVO/INATIVO).
 */
export const UserModal: React.FC<ModalProps & { availableBases?: Base[] }> = ({ isOpen, onClose, onSave, title, initialData, availableBases = [] }) => {
  const [formData, setFormData] = useState<any>({ 
    nome: '', 
    email: '', 
    status: 'Ativo', 
    bases: [], 
    permissao: PermissionLevel.OPERACAO,
    jornadaPadrao: 6,
    tipoJornada: 'predefinida'
  });

  useEffect(() => { 
    if (initialData) {
      console.debug(`[UserModal] Carregando dados iniciais:`, initialData);
      const isPredefined = [6, 7.2, 8].includes(Number(initialData.jornadaPadrao));
      setFormData({
        ...initialData,
        tipoJornada: isPredefined ? 'predefinida' : 'customizada',
        status: initialData.status || 'Ativo'
      });
    } else {
      setFormData({ 
        nome: '', email: '', status: 'Ativo', bases: [], 
        permissao: PermissionLevel.OPERACAO, jornadaPadrao: 6, tipoJornada: 'predefinida' 
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (campo: string, valor: any) => {
    console.debug(`[UserModal] Campo alterado: ${campo} = ${valor}`);
    if (campo === 'tipoJornada') {
      setFormData({
        ...formData,
        tipoJornada: valor,
        jornadaPadrao: valor === 'predefinida' ? 6 : formData.jornadaPadrao
      });
    } else if (campo === 'selectedBase') {
      // Mapeia a base única selecionada para o array de bases do objeto User
      setFormData({ ...formData, bases: valor ? [valor] : [] });
    } else {
      setFormData({ ...formData, [campo]: valor });
    }
  };

  const handleLocalSave = () => {
    console.debug(`[UserModal] Tentando salvar usuário:`, formData);
    
    if (!formData.nome?.trim()) { alert('Nome é obrigatório'); return; }
    if (!formData.email?.trim()) { alert('Email é obrigatório'); return; }
    if (formData.bases.length === 0) { alert('Base é obrigatória'); return; }
    if (!formData.jornadaPadrao) { alert('Jornada é obrigatória'); return; }
    if (!formData.status) { alert('Status é obrigatório'); return; }

    onSave({
      ...formData, 
      id: formData.id || Math.random().toString(36).substr(2, 9),
      jornadaPadrao: Number(String(formData.jornadaPadrao).replace(',', '.'))
    });
  };

  const selectedBaseId = formData.bases?.[0] || '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95 flex flex-col gap-6 max-h-[95vh] overflow-y-auto">
        <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{title}</h3>
        
        <MuiBox sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Nome Completo"
            placeholder="Nome e Sobrenome"
            value={formData.nome}
            onChange={(e) => handleFieldChange('nome', e.target.value)}
            fullWidth
            required
            variant="outlined"
            slotProps={{ input: { sx: { borderRadius: '1rem' } } }}
          />

          <TextField
            label="Email Corporativo"
            type="email"
            placeholder="usuario@gol.com.br"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            fullWidth
            required
            variant="outlined"
            slotProps={{ input: { sx: { borderRadius: '1rem' } } }}
          />

          <FormControl fullWidth required>
            <InputLabel>Base Operacional</InputLabel>
            <Select
              value={selectedBaseId}
              onChange={(e) => handleFieldChange('selectedBase', e.target.value)}
              label="Base Operacional"
              sx={{ borderRadius: '1rem' }}
            >
              <MenuItem value=""><em>Selecione uma base</em></MenuItem>
              {availableBases.map((base) => (
                <MenuItem key={base.id} value={base.id}>{base.sigla} - {base.nome}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Nível de Permissão</InputLabel>
            <Select
              value={formData.permissao}
              onChange={(e) => handleFieldChange('permissao', e.target.value)}
              label="Nível de Permissão"
              sx={{ borderRadius: '1rem' }}
            >
              <MenuItem value={PermissionLevel.OPERACAO}>Operação</MenuItem>
              <MenuItem value={PermissionLevel.LIDER}>Líder</MenuItem>
              <MenuItem value={PermissionLevel.GESTOR}>Gestor</MenuItem>
              <MenuItem value={PermissionLevel.ADMIN}>Administrador</MenuItem>
            </Select>
          </FormControl>

          <MuiBox sx={{ bgcolor: '#f9fafb', p: 3, borderRadius: '1.5rem', border: '1px solid #f3f4f6' }}>
            <MuiTypography sx={{ fontSize: '10px', fontWeight: 900, color: '#9ca3af', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Configuração de Jornada
            </MuiTypography>
            
            <div className="space-y-4">
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Jornada</InputLabel>
                <Select
                  value={formData.tipoJornada}
                  onChange={(e) => handleFieldChange('tipoJornada', e.target.value)}
                  label="Tipo de Jornada"
                  sx={{ borderRadius: '0.75rem', bgcolor: 'white' }}
                >
                  <MenuItem value="predefinida">Predefinida</MenuItem>
                  <MenuItem value="customizada">Customizada</MenuItem>
                </Select>
              </FormControl>

              {formData.tipoJornada === 'predefinida' ? (
                <FormControl fullWidth size="small">
                  <InputLabel>Jornada</InputLabel>
                  <Select
                    value={formData.jornadaPadrao}
                    onChange={(e) => handleFieldChange('jornadaPadrao', e.target.value)}
                    label="Jornada"
                    sx={{ borderRadius: '0.75rem', bgcolor: 'white' }}
                  >
                    <MenuItem value={6}>06:00:00</MenuItem>
                    <MenuItem value={7.2}>07:12:00</MenuItem>
                    <MenuItem value={8}>08:00:00</MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  label="Jornada (Horas decimais)"
                  placeholder="Ex: 9.5 ou 10"
                  type="text"
                  value={formData.jornadaPadrao}
                  onChange={(e) => handleFieldChange('jornadaPadrao', e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  required
                  slotProps={{ input: { sx: { borderRadius: '0.75rem', bgcolor: 'white' } } }}
                />
              )}
            </div>
          </MuiBox>

          <FormControl fullWidth required>
            <InputLabel>Status do Usuário</InputLabel>
            <Select
              value={formData.status}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              label="Status do Usuário"
              sx={{ borderRadius: '1rem' }}
            >
              <MenuItem value="Ativo">
                <MuiBox sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <MuiBox sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4caf50' }} />
                  <MuiTypography sx={{ fontWeight: 800, fontSize: '0.8rem' }}>ATIVO</MuiTypography>
                </MuiBox>
              </MenuItem>
              <MenuItem value="Inativo">
                <MuiBox sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <MuiBox sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#9e9e9e' }} />
                  <MuiTypography sx={{ fontWeight: 800, fontSize: '0.8rem' }}>INATIVO</MuiTypography>
                </MuiBox>
              </MenuItem>
            </Select>
          </FormControl>
        </MuiBox>

        <div className="flex space-x-2 mt-4">
          <button onClick={onClose} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-gray-200 transition-all">Cancelar</button>
          <button onClick={handleLocalSave} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all">Salvar Usuário</button>
        </div>
      </div>
    </div>
  );
};

export const CustomControlTypeModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title }) => {
  const [nome, setNome] = useState('');
  const [campos, setCampos] = useState<string[]>(['']);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95">
        <h3 className="text-xl font-bold mb-4 flex items-center space-x-2"><Layers className="text-orange-600" /> <span>{title}</span></h3>
        <div className="space-y-4">
          <input className="w-full p-3 border rounded-xl font-bold" placeholder="Nome do Controle" value={nome} onChange={e => setNome(e.target.value)} />
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Campos do Controle</label>
            {campos.map((campo, idx) => (
              <div key={idx} className="flex space-x-2">
                <input className="flex-1 p-2 border rounded-xl text-sm" placeholder={`Campo ${idx+1}`} value={campo} onChange={e => {
                  const newCampos = [...campos];
                  newCampos[idx] = e.target.value;
                  setCampos(newCampos);
                }} />
                {campos.length > 1 && <button onClick={() => setCampos(campos.filter((_, i) => i !== idx))} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>}
              </div>
            ))}
            <button onClick={() => setCampos([...campos, ''])} className="text-[10px] font-black text-orange-600 uppercase">+ Adicionar Campo</button>
          </div>
        </div>
        <div className="flex space-x-2 mt-6">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-500">Cancelar</button>
          <button onClick={() => onSave({ id: Math.random().toString(36).substr(2, 9), nome, campos: campos.filter(c => c.trim()), dataCriacao: new Date().toISOString() })} className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg">Salvar Tipo</button>
        </div>
      </div>
    </div>
  );
};

export const ControlItemSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void; item: any; onSave: (updatedItem: any) => void }> = ({ isOpen, onClose, item, onSave }) => {
  const [activeLevel, setActiveLevel] = useState<'verde' | 'amarelo' | 'vermelho'>('verde');
  const [cores, setCores] = useState<any>(item?.cores || {
    verde: { condicao: 'Valor', operador: '>', valor: 0, habilitado: true },
    amarelo: { condicao: 'Valor', operador: '=', valor: 0, habilitado: true },
    vermelho: { condicao: 'Valor', operador: '<', valor: 0, habilitado: true }
  });
  const [popups, setPopups] = useState<any>(item?.popups || {
    verde: { titulo: 'Tudo OK', mensagem: 'Item dentro dos parâmetros.', habilitado: true },
    amarelo: { titulo: 'Atenção', mensagem: 'Item requer atenção imediata.', habilitado: true },
    vermelho: { titulo: 'Crítico!', mensagem: 'Item em estado de alerta crítico!', habilitado: true }
  });

  useEffect(() => {
    if (item) {
      if (item.cores) setCores(item.cores);
      if (item.popups) setPopups(item.popups);
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const renderConfigSection = (level: 'verde' | 'amarelo' | 'vermelho', colorClass: string) => (
    <div className={`space-y-5 animate-in fade-in slide-in-from-right-2 duration-200`}>
       <div className={`p-4 rounded-2xl border-l-4 ${colorClass} bg-gray-50 flex justify-between items-center shadow-sm`}>
          <div className="flex items-center space-x-3">
             <Palette className="w-5 h-5 text-gray-400" /> 
             <span className="font-black text-[10px] uppercase tracking-widest text-gray-600">Status do Nível {level.toUpperCase()}</span>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 cursor-pointer bg-white px-2.5 py-1 rounded-lg shadow-sm border border-gray-100">
               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{cores[level].habilitado ? 'Cor Ativa' : 'Cor Off'}</span>
               <div onClick={() => setCores({...cores, [level]: {...cores[level], habilitado: !cores[level].habilitado}})} className={`w-8 h-4 rounded-full transition-all relative ${cores[level].habilitado ? 'bg-green-500' : 'bg-gray-300'}`}>
                 <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${cores[level].habilitado ? 'right-0.5' : 'left-0.5'}`} />
               </div>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer bg-white px-2.5 py-1 rounded-lg shadow-sm border border-gray-100">
               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{popups[level].habilitado ? 'Pop-up ON' : 'Pop-up OFF'}</span>
               <div onClick={() => setPopups({...popups, [level]: {...popups[level], habilitado: !popups[level].habilitado}})} className={`w-8 h-4 rounded-full transition-all relative ${popups[level].habilitado ? 'bg-orange-600' : 'bg-gray-300'}`}>
                 <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${popups[level].habilitado ? 'right-0.5' : 'left-0.5'}`} />
               </div>
            </label>
          </div>
       </div>
       <div className={`bg-gray-50 p-6 rounded-2xl border border-gray-100 grid grid-cols-12 gap-4 transition-opacity ${!cores[level].habilitado && 'opacity-40 pointer-events-none'}`}>
          <div className="col-span-12 mb-2"><h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center space-x-2"><Settings className="w-3 h-3" /> <span>Condição Lógica</span></h4></div>
          <div className="col-span-5">
             <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Operador</label>
             <select className="w-full p-3 border border-gray-200 rounded-xl text-xs font-bold bg-white outline-none focus:border-orange-500" value={cores[level].operador} onChange={e => setCores({...cores, [level]: {...cores[level], operador: e.target.value}})}>
                <option value=">">Maior que (&gt;)</option>
                <option value="<">Menor que (&lt;)</option>
                <option value="=">Igual a (=)</option>
                <option value="!=">Diferente de (≠)</option>
                <option value=">=">Maior ou igual (&gt;=)</option>
                <option value="<=">Menor ou igual (&lt;=)</option>
                <option value="entre">Entre (X e Y)</option>
             </select>
          </div>
          <div className={cores[level].operador === 'entre' ? 'col-span-3' : 'col-span-7'}>
             <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">{cores[level].operador === 'entre' ? 'Valor Mín.' : 'Valor de Referência'}</label>
             <input type="number" className="w-full p-3 border border-gray-200 rounded-xl text-xs font-bold bg-white outline-none focus:border-orange-500" placeholder="0" value={cores[level].valor} onChange={e => setCores({...cores, [level]: {...cores[level], valor: e.target.value}})} />
          </div>
          {cores[level].operador === 'entre' && (
            <div className="col-span-4 animate-in slide-in-from-left-2">
               <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Valor Máx.</label>
               <input type="number" className="w-full p-3 border border-gray-200 rounded-xl text-xs font-bold bg-white outline-none focus:border-orange-500" placeholder="0" value={cores[level].valorMax || ''} onChange={e => setCores({...cores, [level]: {...cores[level], valorMax: e.target.value}})} />
            </div>
          )}
       </div>
       <div className={`space-y-3 bg-white p-6 rounded-2xl border border-gray-100 transition-opacity ${!popups[level].habilitado && 'opacity-40 pointer-events-none'}`}>
          <div className="flex items-center space-x-2 text-orange-600 mb-2">
             <AlertTriangle className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">Configuração do Pop-up</span>
          </div>
          <div className="space-y-1">
             <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Título do Alerta</label>
             <input className="w-full p-3 text-xs font-bold border border-gray-100 rounded-xl outline-none focus:border-orange-500" placeholder="Ex: Atenção Crítica!" value={popups[level].titulo} onChange={e => setPopups({...popups, [level]: {...popups[level], titulo: e.target.value}})} />
          </div>
          <div className="space-y-1">
             <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Mensagem de Texto (X = Valor Atual)</label>
             <textarea className="w-full p-3 text-[11px] font-medium border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-orange-100 resize-none" rows={3} placeholder="Ex: O item está com X dias de atraso." value={popups[level].mensagem} onChange={e => setPopups({...popups, [level]: {...popups[level], mensagem: e.target.value}})} />
          </div>
       </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-hidden">
        <div className="p-8 pb-4 flex justify-between items-center border-b border-gray-50 bg-white z-10">
          <div>
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center space-x-3">
              <Settings className="text-orange-600 w-5 h-5" />
              <span>Regras Customizadas</span>
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              {item.partNumber || item.nomeLocation || item.nomeTransito || 'Configuração Técnica'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-300 hover:text-red-500 transition-colors bg-gray-50 rounded-xl"><X className="w-6 h-6" /></button>
        </div>
        <div className="px-8 pt-4 flex space-x-2 bg-white">
           <TabSelector label="Verde" active={activeLevel === 'verde'} onClick={() => setActiveLevel('verde'} colorClass="bg-green-500" activeText="text-green-600" activeBg="bg-green-50" />
           <TabSelector label="Amarelo" active={activeLevel === 'amarelo'} onClick={() => setActiveLevel('amarelo'} colorClass="bg-yellow-500" activeText="text-yellow-600" activeBg="bg-yellow-50" />
           <TabSelector label="Vermelho" active={activeLevel === 'vermelho'} onClick={() => setActiveLevel('vermelho'} colorClass="bg-red-500" activeText="text-red-600" activeBg="bg-red-50" />
        </div>
        <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-6 scrollbar-hide">
           {activeLevel === 'verde' && renderConfigSection('verde', 'border-green-500')}
           {activeLevel === 'amarelo' && renderConfigSection('amarelo', 'border-yellow-500')}
           {activeLevel === 'vermelho' && renderConfigSection('vermelho', 'border-red-500')}
        </div>
        <div className="p-6 px-8 flex space-x-3 border-t border-gray-50 bg-gray-50/50">
           <button onClick={onClose} className="flex-1 py-4 font-black text-gray-400 uppercase text-[10px] tracking-widest hover:text-gray-600 transition-colors bg-white border border-gray-200 rounded-2xl">Cancelar</button>
           <button onClick={() => onSave({ ...item, cores, popups })} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all hover:scale-[1.02] active:scale-95">Salvar Configurações</button>
        </div>
      </div>
    </div>
  );
};

const TabSelector: React.FC<{label: string, active: boolean, onClick: () => void, colorClass: string, activeText: string, activeBg: string}> = ({ label, active, onClick, colorClass, activeText, activeBg }) => (
  <button onClick={onClick} className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center space-x-2 border transition-all ${active ? `${activeBg} border-transparent shadow-sm` : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
    <div className={`w-2 h-2 rounded-full ${active ? colorClass : 'bg-gray-300'}`} />
    <span className={`text-[10px] font-black uppercase tracking-widest ${active ? activeText : ''}`}>{label}</span>
  </button>
);

export const CategoryModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title, initialData }) => {
  const [formData, setFormData] = useState<Partial<Category>>({ nome: '', exibicao: 'lista', status: 'Ativa', ordem: 1 });
  
  useEffect(() => { 
    if (initialData) {
      setFormData({ ...initialData, exibicao: initialData.exibicao || 'lista' });
    } else {
      setFormData({ nome: '', exibicao: 'lista', status: 'Ativa', ordem: 1 });
    }
  }, [initialData, isOpen]);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <div className="space-y-4">
          <MuiBox sx={{ mb: 2 }}>
            <Input label="Nome da Categoria" value={formData.nome} onChange={v => setFormData({...formData, nome: v})} />
          </MuiBox>
          
          <MuiBox sx={{ mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Formato de Exibição</InputLabel>
              <Select
                value={formData.exibicao}
                onChange={(e) => setFormData({ ...formData, exibicao: e.target.value as any })}
                label="Formato de Exibição"
                sx={{ borderRadius: '1rem' }}
              >
                <MenuItem value="lista">Sempre Visível (Lista)</MenuItem>
                <MenuItem value="suspensa">Lista Suspensa (Dropdown)</MenuItem>
              </Select>
            </FormControl>
          </MuiBox>

          <MuiBox sx={{ mb: 2 }}>
            <Input type="number" label="Ordem de Exibição" value={formData.ordem} onChange={v => setFormData({...formData, ordem: parseInt(v) || 1})} />
          </MuiBox>
        </div>
        <div className="flex space-x-2 mt-6">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-500">Cancelar</button>
          <button onClick={() => onSave({...formData, id: formData.id || Math.random().toString(36).substr(2, 9)})} className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg">Salvar</button>
        </div>
      </div>
    </div>
  );
};

export const TaskModal: React.FC<ModalProps & { categories?: Category[] }> = ({ isOpen, onClose, onSave, title, initialData, categories }) => {
  const [formData, setFormData] = useState<Partial<Task>>({ nome: '', status: 'Ativa', tipoMedida: MeasureType.QTD, fatorMultiplicador: 0, categoriaId: '' });
  const [timeValue, setTimeValue] = useState('');
  useEffect(() => { 
    if (initialData) {
      setFormData(initialData);
      setTimeValue(initialData.fatorMultiplicador > 0 ? minutesToHhmmss(initialData.fatorMultiplicador) : '');
    } else {
      setFormData({ nome: '', status: 'Ativa', tipoMedida: MeasureType.QTD, fatorMultiplicador: 0, categoriaId: '' });
      setTimeValue('');
    }
  }, [initialData, isOpen]);
  if (!isOpen) return null;
  const handleLocalSave = () => {
    const finalFator = formData.tipoMedida === MeasureType.TEMPO ? 0 : hhmmssToMinutes(timeValue);
    onSave({...formData, fatorMultiplicador: finalFator, id: formData.id || Math.random().toString(36).substr(2, 9)});
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <div className="space-y-4">
          <input className="w-full p-3 border rounded-xl font-bold" placeholder="Nome da Tarefa" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
          <select className="w-full p-3 border rounded-xl font-bold text-sm" value={formData.categoriaId} onChange={e => setFormData({...formData, categoriaId: e.target.value})}>
            <option value="">Selecione uma Categoria...</option>
            {categories?.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Medida</label>
              <select className="w-full p-3 border rounded-xl font-bold text-sm" value={formData.tipoMedida} onChange={e => setFormData({...formData, tipoMedida: e.target.value as MeasureType})}>
                <option value={MeasureType.QTD}>QTD</option>
                <option value={MeasureType.TEMPO}>TEMPO</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Fator (HH:MM:SS)</label>
              <TimeInput value={timeValue} onChange={setTimeValue} className={`w-full p-3 border rounded-xl text-orange-600 ${formData.tipoMedida === MeasureType.TEMPO ? 'bg-gray-100 opacity-50' : ''}`} disabled={formData.tipoMedida === MeasureType.TEMPO} />
            </div>
          </div>
          {formData.tipoMedida === MeasureType.TEMPO && (
            <p className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">* O tempo será preenchido diretamente na passagem de serviço.</p>
          )}
        </div>
        <div className="flex space-x-2 mt-6">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-500">Cancelar</button>
          <button onClick={handleLocalSave} className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg">Salvar</button>
        </div>
      </div>
    </div>
  );
};
