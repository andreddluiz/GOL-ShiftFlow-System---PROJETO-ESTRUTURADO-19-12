
import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Clock, MapPin, Shield, Info, AlertCircle, TrendingUp, Box, Truck, AlertOctagon, Calendar, Layers, Palette, Settings } from 'lucide-react';
import { 
  Base, User, Category, Task, Control, Shift, PermissionLevel, MeasureType,
  DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem, CustomControlType, ManagedItem, ConditionConfig, PopupConfig 
} from './types';

// MUI Imports
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  initialData?: any;
}

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
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}> = ({ value, onChange, disabled, className, placeholder = "__:__:__" }) => {
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

  const handleBlur = () => {
    if (displayValue && displayValue.length < 8 && displayValue !== "") {
      const parts = displayValue.split(':');
      const h = (parts[0] || '0').padStart(2, '0');
      const m = (parts[1] || '0').padStart(2, '0');
      const s = (parts[2] || '0').padStart(2, '0');
      const full = `${h}:${m}:${s}`;
      setDisplayValue(full);
      onChange(full);
    }
  };

  return (
    <input
      type="text"
      disabled={disabled}
      value={displayValue}
      onBlur={handleBlur}
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
  const dateValue = value && dayjs(value, 'DD/MM/YYYY').isValid() 
    ? dayjs(value, 'DD/MM/YYYY') 
    : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <div className="space-y-1 relative w-full" onBlur={onBlur} onKeyDown={onKeyDown}>
        {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{label}</label>}
        <DatePicker
          value={dateValue}
          disabled={disabled}
          format="DD/MM/YYYY"
          onChange={(newValue) => {
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
    verde: { condicao: 'Valor', operador: '>', valor: 0 },
    amarelo: { condicao: 'Valor', operador: '=', valor: 0 },
    vermelho: { condicao: 'Valor', operador: '<', valor: 0 }
  });
  
  const [popups, setPopups] = useState<any>(item?.popups || {
    verde: { titulo: 'Tudo OK', mensagem: 'Item dentro dos parâmetros.' },
    amarelo: { titulo: 'Atenção', mensagem: 'Item requer atenção imediata.' },
    vermelho: { titulo: 'Crítico!', mensagem: 'Item em estado de alerta crítico!' }
  });

  useEffect(() => {
    if (item) {
      if (item.cores) setCores(item.cores);
      if (item.popups) setPopups(item.popups);
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const renderConfigSection = (level: 'verde' | 'amarelo' | 'vermelho', color: string) => (
    <div className={`p-4 rounded-2xl border-l-4 ${color} bg-gray-50 space-y-4 shadow-sm`}>
       <div className="flex justify-between items-center">
          <h4 className="font-black text-xs uppercase tracking-widest flex items-center space-x-2">
            <Palette className="w-4 h-4" /> <span>Nível {level.toUpperCase()}</span>
          </h4>
       </div>
       
       <div className="grid grid-cols-3 gap-2">
          <select className="p-2 border rounded-lg text-[10px] font-bold" value={cores[level].operador} onChange={e => setCores({...cores, [level]: {...cores[level], operador: e.target.value}})}>
             <option value=">">&gt;</option>
             <option value="<">&lt;</option>
             <option value="=">=</option>
             <option value=">=">&gt;=</option>
             <option value="<=">&lt;=</option>
          </select>
          <input type="number" className="p-2 border rounded-lg text-xs" placeholder="Valor" value={cores[level].valor} onChange={e => setCores({...cores, [level]: {...cores[level], valor: e.target.value}})} />
          <span className="flex items-center text-[8px] font-black text-gray-400 uppercase">da condição</span>
       </div>

       <div className="space-y-2 bg-white p-3 rounded-xl border border-gray-100">
          <input className="w-full p-2 text-xs font-bold border-none outline-none focus:ring-1 focus:ring-orange-100 rounded" placeholder="Título do Pop-up" value={popups[level].titulo} onChange={e => setPopups({...popups, [level]: {...popups[level], titulo: e.target.value}})} />
          <textarea className="w-full p-2 text-[10px] border-none outline-none focus:ring-1 focus:ring-orange-100 rounded resize-none" rows={2} placeholder="Mensagem do Pop-up" value={popups[level].mensagem} onChange={e => setPopups({...popups, [level]: {...popups[level], mensagem: e.target.value}})} />
       </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-8 animate-in slide-in-from-bottom-10 my-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center space-x-3">
            <Settings className="text-orange-600" />
            <span>Regras Personalizadas: {item.partNumber || item.nomeLocation || item.nomeTransito}</span>
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
        </div>

        <div className="space-y-6">
           {renderConfigSection('verde', 'border-green-500 text-green-600')}
           {renderConfigSection('amarelo', 'border-yellow-500 text-yellow-600')}
           {renderConfigSection('vermelho', 'border-red-500 text-red-600')}
        </div>

        <div className="flex space-x-3 mt-8">
           <button onClick={onClose} className="flex-1 py-4 font-black text-gray-400 uppercase text-xs">Cancelar</button>
           <button onClick={() => onSave({ ...item, cores, popups })} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Salvar Regras</button>
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
