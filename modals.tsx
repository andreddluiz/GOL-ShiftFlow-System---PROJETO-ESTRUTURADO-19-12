
import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Clock, MapPin, Shield, Info, AlertCircle, TrendingUp, Box, Truck, AlertOctagon, Calendar, Layers, Palette, Settings, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { 
  Base, User, Category, Task, Control, Shift, PermissionLevel, MeasureType,
  DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem, CustomControlType, ManagedItem, ConditionConfig, PopupConfig 
} from './types';

// MUI Imports
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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
 * Componente de Confirmação Customizado (Substitui window.confirm bloqueado)
 */
export const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
}> = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", type = 'warning' }) => {
  if (!isOpen) return null;

  const colors = {
    danger: 'bg-red-600 text-white',
    warning: 'bg-orange-600 text-white',
    info: 'bg-blue-600 text-white'
  };

  const icons = {
    danger: <AlertOctagon className="w-12 h-12 mb-4" />,
    warning: <AlertTriangle className="w-12 h-12 mb-4" />,
    info: <Info className="w-12 h-12 mb-4" />
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`p-8 flex flex-col items-center text-center ${colors[type]}`}>
          {icons[type]}
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">{title}</h3>
          <p className="text-sm font-bold opacity-90 leading-relaxed">{message}</p>
        </div>
        <div className="p-6 flex space-x-3 bg-gray-50">
          <button 
            onClick={onClose} 
            className="flex-1 py-4 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all"
          >
            {cancelLabel}
          </button>
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
 * Utilitários de Conversão de Tempo
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
  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor(totalMinutes % 60);
  const s = Math.round((totalMinutes * 60) % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

/**
 * Componente TimeInput com máscara HH:MM:SS
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
      className={`font-black text-center outline-none ${className}`}
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
 * Modal para Cadastrar/Editar Itens de Controle (Standard & Custom)
 */
export const ControlItemModal: React.FC<ModalProps & { activeTab: string, customControlTypes: CustomControlType[] }> = ({ isOpen, onClose, onSave, title, initialData, activeTab, customControlTypes }) => {
  const [formData, setFormData] = useState<any>({});
  
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Setup de valores iniciais por tipo
      const base = { id: Math.random().toString(36).substr(2, 9), status: 'ativo', visivel: true };
      if (activeTab === 'shelf') setFormData({ ...base, partNumber: '', lote: '', dataVencimento: '' });
      else if (activeTab === 'loc') setFormData({ ...base, nomeLocation: '' });
      else if (activeTab === 'trans') setFormData({ ...base, nomeTransito: '', diasPadrao: 0 });
      else if (activeTab === 'crit') setFormData({ ...base, partNumber: '' });
      else {
        // Custom
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

const Input: React.FC<{ label: string, value: any, onChange: (val: string) => void, type?: string }> = ({ label, value, onChange, type = "text" }) => (
  <div className="space-y-1">
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
  const [formData, setFormData] = useState<Partial<Base>>({ nome: '', sigla: '', status: 'Ativa' });
  useEffect(() => { if (initialData) setFormData(initialData); }, [initialData, isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <div className="space-y-4">
          <input className="w-full p-3 border rounded-xl font-bold" placeholder="Nome da Base" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
          <input className="w-full p-3 border rounded-xl font-black uppercase" placeholder="Sigla" value={formData.sigla} onChange={e => setFormData({...formData, sigla: e.target.value})} />
        </div>
        <div className="flex space-x-2 mt-6">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-500">Cancelar</button>
          <button onClick={() => onSave({...formData, id: formData.id || Math.random().toString(36).substr(2, 9)})} className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg">Salvar</button>
        </div>
      </div>
    </div>
  );
};

export const UserModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title, initialData }) => {
  const [formData, setFormData] = useState<Partial<User>>({ nome: '', email: '', status: 'Ativo', bases: [] });
  useEffect(() => { if (initialData) setFormData(initialData); }, [initialData, isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <div className="space-y-4">
          <input className="w-full p-3 border rounded-xl font-bold" placeholder="Nome Completo" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
          <input className="w-full p-3 border rounded-xl" placeholder="E-mail Corporativo" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input className="w-full p-3 border rounded-xl" type="number" placeholder="Horas de Trabalho (Jornada)" value={formData.jornadaPadrao} onChange={e => setFormData({...formData, jornadaPadrao: parseInt(e.target.value) || 0})} />
        </div>
        <div className="flex space-x-2 mt-6">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-500">Cancelar</button>
          <button onClick={() => onSave({...formData, id: formData.id || Math.random().toString(36).substr(2, 9)})} className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg">Salvar</button>
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

  const renderConfigSection = (level: 'verde' | 'amarelo' | 'vermelho', color: string) => (
    <div className={`p-5 rounded-3xl border-l-8 ${color} bg-gray-50 space-y-4 shadow-sm relative overflow-hidden`}>
       <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-3">
             <Palette className="w-5 h-5" /> 
             <span className="font-black text-xs uppercase tracking-widest">Nível {level.toUpperCase()}</span>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl shadow-sm border border-gray-100">
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{cores[level].habilitado ? 'Cor Ativa' : 'Cor Inativa'}</span>
               <div 
                 onClick={() => setCores({...cores, [level]: {...cores[level], habilitado: !cores[level].habilitado}})}
                 className={`w-10 h-5 rounded-full transition-all relative ${cores[level].habilitado ? 'bg-green-600' : 'bg-gray-300'}`}
               >
                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${cores[level].habilitado ? 'right-1' : 'left-1'}`} />
               </div>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl shadow-sm border border-gray-100">
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{popups[level].habilitado ? 'Pop-up Ativo' : 'Pop-up Inativo'}</span>
               <div 
                 onClick={() => setPopups({...popups, [level]: {...popups[level], habilitado: !popups[level].habilitado}})}
                 className={`w-10 h-5 rounded-full transition-all relative ${popups[level].habilitado ? 'bg-orange-600' : 'bg-gray-300'}`}
               >
                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${popups[level].habilitado ? 'right-1' : 'left-1'}`} />
               </div>
            </label>
          </div>
       </div>
       
       <div className={`grid grid-cols-12 gap-3 transition-opacity ${!cores[level].habilitado && 'opacity-40 pointer-events-none'}`}>
          <div className="col-span-4">
             <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Operador</label>
             <select className="w-full p-3 border rounded-xl text-xs font-bold bg-white" value={cores[level].operador} onChange={e => setCores({...cores, [level]: {...cores[level], operador: e.target.value}})}>
                <option value=">">Maior que (&gt;)</option>
                <option value="<">Menor que (&lt;)</option>
                <option value="=">Igual a (=)</option>
                <option value="!=">Diferente de (≠)</option>
                <option value=">=">Maior ou igual (&gt;=)</option>
                <option value="<=">Menor ou igual (&lt;=)</option>
                <option value="entre">Entre (X e Y)</option>
             </select>
          </div>
          <div className={cores[level].operador === 'entre' ? 'col-span-4' : 'col-span-8'}>
             <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">{cores[level].operador === 'entre' ? 'Mínimo' : 'Valor'}</label>
             <input type="number" className="w-full p-3 border rounded-xl text-xs font-bold bg-white" placeholder="0" value={cores[level].valor} onChange={e => setCores({...cores, [level]: {...cores[level], valor: e.target.value}})} />
          </div>
          {cores[level].operador === 'entre' && (
            <div className="col-span-4 animate-in slide-in-from-left-2">
               <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Máximo</label>
               <input type="number" className="w-full p-3 border rounded-xl text-xs font-bold bg-white" placeholder="0" value={cores[level].valorMax || ''} onChange={e => setCores({...cores, [level]: {...cores[level], valorMax: e.target.value}})} />
            </div>
          )}
       </div>

       <div className={`space-y-2 bg-white p-4 rounded-2xl border border-gray-100 transition-opacity ${!popups[level].habilitado && 'opacity-40 pointer-events-none'}`}>
          <div className="flex items-center space-x-2 text-orange-600 mb-2">
             <AlertTriangle className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">Conteúdo do Alerta</span>
          </div>
          <input className="w-full p-2 text-xs font-bold border-b border-gray-100 outline-none focus:border-orange-500 rounded" placeholder="Título do Pop-up" value={popups[level].titulo} onChange={e => setPopups({...popups, [level]: {...popups[level], titulo: e.target.value}})} />
          <textarea className="w-full p-2 text-[10px] border-none outline-none focus:ring-1 focus:ring-orange-100 rounded resize-none" rows={2} placeholder="Mensagem do Pop-up (Use 'X' para o valor dinâmico)" value={popups[level].mensagem} onChange={e => setPopups({...popups, [level]: {...popups[level], mensagem: e.target.value}})} />
       </div>
    </div>
  );

  const handleSaveInternal = () => {
    onSave({ ...item, cores, popups });
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-8 animate-in slide-in-from-bottom-10 my-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center space-x-3">
            <Settings className="text-orange-600" />
            <span>Regras Personalizadas: {item.partNumber || item.nomeLocation || item.nomeTransito}</span>
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="space-y-6">
           {renderConfigSection('verde', 'border-green-500 text-green-600')}
           {renderConfigSection('amarelo', 'border-yellow-500 text-yellow-600')}
           {renderConfigSection('vermelho', 'border-red-500 text-red-600')}
        </div>

        <div className="flex space-x-3 mt-8 pt-4 border-t border-gray-100">
           <button onClick={onClose} className="flex-1 py-4 font-black text-gray-400 uppercase text-xs hover:text-gray-600 transition-colors">Cancelar</button>
           <button onClick={handleSaveInternal} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all hover:scale-105 active:scale-95">Salvar Configurações</button>
        </div>
      </div>
    </div>
  );
};

export const CategoryModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title, initialData }) => {
  const [formData, setFormData] = useState<Partial<Category>>({ nome: '', status: 'Ativa', ordem: 1 });
  useEffect(() => { if (initialData) setFormData(initialData); }, [initialData, isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <div className="space-y-4">
          <input className="w-full p-3 border rounded-xl font-bold uppercase" placeholder="Nome da Categoria" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
          <input type="number" className="w-full p-3 border rounded-xl font-bold" placeholder="Ordem" value={formData.ordem} onChange={e => setFormData({...formData, ordem: parseInt(e.target.value) || 1})} />
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
    const finalFator = hhmmssToMinutes(timeValue);
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
              <TimeInput value={timeValue} onChange={setTimeValue} className="w-full p-3 border rounded-xl text-orange-600" />
            </div>
          </div>
        </div>
        <div className="flex space-x-2 mt-6">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-500">Cancelar</button>
          <button onClick={handleLocalSave} className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg">Salvar</button>
        </div>
      </div>
    </div>
  );
};
