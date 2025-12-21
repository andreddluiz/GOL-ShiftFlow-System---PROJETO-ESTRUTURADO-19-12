
import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Clock, MapPin, Shield, Info, AlertCircle, TrendingUp, Box, Truck, AlertOctagon, Calendar } from 'lucide-react';
import { 
  Base, User, Category, Task, Control, Shift, PermissionLevel, MeasureType,
  DefaultLocationItem, DefaultTransitItem, DefaultCriticalItem 
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
 * Componente TimeInput com máscara HH:MM:SS e suporte a campo em branco
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

    // Se estiver vazio, permite ficar vazio
    if (val === "") {
      setDisplayValue("");
      onChange("");
      return;
    }

    // Preenche com zeros à esquerda apenas se necessário para manter o formato mas visualmente amigável
    const finalVal = formatted.padStart(val.length <= 2 ? val.length : (val.length <= 4 ? val.length + 1 : val.length + 2), '0');
    setDisplayValue(finalVal);
    
    // Só dispara o onChange com o valor final completo se tiver 6 dígitos, ou envia o parcial
    if (val.length === 6) {
       onChange(finalVal);
    } else {
       onChange(finalVal); // Deixa o componente pai lidar com a conversão parcial
    }
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
  placeholder?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, onBlur, placeholder = "DD/MM/AAAA", disabled = false }) => {
  const dateValue = value && dayjs(value, 'DD/MM/YYYY').isValid() 
    ? dayjs(value, 'DD/MM/YYYY') 
    : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <div className="space-y-1 relative w-full">
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
              onBlur: onBlur,
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
  useEffect(() => { if (initialData) setFormData(initialData); }, [initialData]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <div className="space-y-4">
          <input className="w-full p-3 border rounded-xl font-bold" placeholder="Nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
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
  const [formData, setFormData] = useState<Partial<User>>({ nome: '', email: '', status: 'Ativo' });
  useEffect(() => { if (initialData) setFormData(initialData); }, [initialData]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <div className="space-y-4">
          <input className="w-full p-3 border rounded-xl font-bold" placeholder="Nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
          <input className="w-full p-3 border rounded-xl" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input className="w-full p-3 border rounded-xl" type="number" placeholder="Jornada Padrão (h)" value={formData.jornadaPadrao} onChange={e => setFormData({...formData, jornadaPadrao: parseInt(e.target.value) || 0})} />
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
  const [formData, setFormData] = useState<Partial<Task>>({ 
    nome: '', 
    status: 'Ativa', 
    tipoMedida: MeasureType.QTD, 
    fatorMultiplicador: 0, 
    categoriaId: '' 
  });
  
  // Estado local para exibir tempo formatado no modal
  const [timeValue, setTimeValue] = useState('');
  
  useEffect(() => { 
    if (initialData) {
      const fator = Number(initialData.fatorMultiplicador) || 0;
      setFormData({
        ...formData,
        ...initialData,
        fatorMultiplicador: fator
      });
      // Mesmo para QTD, agora carregamos o fator como HH:MM:SS
      setTimeValue(fator > 0 ? minutesToHhmmss(fator) : '');
    } else {
      setFormData({
        nome: '', 
        status: 'Ativa', 
        tipoMedida: MeasureType.QTD, 
        fatorMultiplicador: 0, 
        categoriaId: '' 
      });
      setTimeValue('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleLocalSave = () => {
    if (!formData.nome || !formData.categoriaId) {
      alert("Por favor, preencha o nome e selecione uma categoria.");
      return;
    }

    // Converte HH:MM:SS para minutos decimais antes de salvar (válido para ambos os tipos agora)
    const finalFator = hhmmssToMinutes(timeValue);
    console.debug(`[DEBUG TaskModal] Convertendo entrada "${timeValue}" para ${finalFator} minutos`);

    const cleanData = {
      ...formData,
      fatorMultiplicador: finalFator,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      status: formData.status || 'Ativa'
    };

    onSave(cleanData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <div className="space-y-4">
          <input className="w-full p-3 border rounded-xl font-bold" placeholder="Nome da Tarefa" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
          
          <select 
            className="w-full p-3 border rounded-xl font-bold text-sm" 
            value={formData.categoriaId} 
            onChange={e => setFormData({...formData, categoriaId: e.target.value})}
          >
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
              <label className="text-[10px] font-black text-gray-400 uppercase">
                {formData.tipoMedida === MeasureType.QTD ? 'Fator (HH:MM:SS)' : 'Tempo (HH:MM:SS)'}
              </label>
              <TimeInput 
                value={timeValue} 
                onChange={setTimeValue} 
                className="w-full p-3 border rounded-xl text-orange-600"
                placeholder="00:00:00"
              />
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

export const CategoryModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title, initialData }) => {
  const [formData, setFormData] = useState<Partial<Category>>({ nome: '', status: 'Ativa', ordem: 1 });
  useEffect(() => { if (initialData) setFormData(initialData); }, [initialData]);
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

export const ControlModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title, initialData }) => {
  const [formData, setFormData] = useState<Partial<Control>>({
    nome: '', 
    status: 'Ativo', 
    alertaConfig: { 
      verde: 0, amarelo: 0, vermelho: 0, 
      permitirPopupVerde: false, permitirPopupAmarelo: false, permitirPopupVermelho: false, 
      mensagemVerde: '', mensagemAmarelo: '', mensagemVermelho: '' 
    }
  });

  useEffect(() => { 
    if (initialData) setFormData(initialData); 
  }, [initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-8 animate-in zoom-in-95 my-10">
        <h3 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <Shield className="text-orange-600" />
          <span>{title}</span>
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Nome do Controle</label>
            <input className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" placeholder="Ex: Locations Diárias" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
          </div>

          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
             <h4 className="font-black text-xs uppercase text-gray-400 tracking-widest">Configuração de Alertas e Popups</h4>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end p-4 bg-white rounded-2xl border-l-4 border-green-500 shadow-sm">
                <div>
                   <label className="text-[10px] font-black text-green-600 uppercase block mb-1">Popup no Verde (OK)</label>
                   <input className="w-full p-2 border rounded-lg text-sm" placeholder="Mensagem do Alerta..." value={formData.alertaConfig?.mensagemVerde} onChange={e => setFormData({...formData, alertaConfig: {...formData.alertaConfig!, mensagemVerde: e.target.value}})} />
                </div>
                <div className="flex items-center space-x-2 pb-2">
                   <input type="checkbox" className="w-5 h-5 accent-green-500" checked={formData.alertaConfig?.permitirPopupVerde} onChange={e => setFormData({...formData, alertaConfig: {...formData.alertaConfig!, permitirPopupVerde: e.target.checked}})} />
                   <span className="text-xs font-bold text-gray-500">Ativar Popup</span>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end p-4 bg-white rounded-2xl border-l-4 border-red-500 shadow-sm">
                <div>
                   <label className="text-[10px] font-black text-red-600 uppercase block mb-1">Popup no Vermelho (ALERTA)</label>
                   <input className="w-full p-2 border rounded-lg text-sm" placeholder="Mensagem Crítica..." value={formData.alertaConfig?.mensagemVermelho} onChange={e => setFormData({...formData, alertaConfig: {...formData.alertaConfig!, mensagemVermelho: e.target.value}})} />
                </div>
                <div className="flex items-center space-x-2 pb-2">
                   <input type="checkbox" className="w-5 h-5 accent-red-500" checked={formData.alertaConfig?.permitirPopupVermelho} onChange={e => setFormData({...formData, alertaConfig: {...formData.alertaConfig!, permitirPopupVermelho: e.target.checked}})} />
                   <span className="text-xs font-bold text-gray-500">Ativar Popup</span>
                </div>
             </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <button onClick={onClose} className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold text-gray-500">Cancelar</button>
          <button onClick={() => onSave({...formData, id: formData.id || Math.random().toString(36).substr(2, 9)})} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-xl shadow-orange-100">Salvar Configurações</button>
        </div>
      </div>
    </div>
  );
};

export const DefaultLocationModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title, initialData }) => {
  const [formData, setFormData] = useState<Partial<DefaultLocationItem>>({
    nomeLocation: '',
    status: 'ativo'
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
        <div className="p-6 border-b flex justify-between items-center bg-gray-800 text-white rounded-t-3xl">
          <h3 className="text-xl font-bold flex items-center space-x-2"><Box className="w-5 h-5" /> <span>{title}</span></h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nome da Location</label>
            <input value={formData.nomeLocation} onChange={e => setFormData({...formData, nomeLocation: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 outline-none focus:border-orange-500 transition-all" placeholder="Ex: GOL-01" />
          </div>
        </div>
        <div className="p-8 border-t flex space-x-3">
          <button onClick={onClose} className="flex-1 py-4 font-bold text-gray-400">Cancelar</button>
          <button onClick={() => onSave({...formData, id: formData.id || Math.random().toString(36).substr(2, 9)})} className="flex-1 py-4 font-bold bg-orange-600 text-white rounded-2xl shadow-xl">Salvar Item</button>
        </div>
      </div>
    </div>
  );
};

export const DefaultTransitModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title, initialData }) => {
  const [formData, setFormData] = useState<Partial<DefaultTransitItem>>({
    nomeTransito: '',
    diasPadrao: 0,
    status: 'ativo'
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
        <div className="p-6 border-b flex justify-between items-center bg-gray-800 text-white rounded-t-3xl">
          <h3 className="text-xl font-bold flex items-center space-x-2"><Truck className="w-5 h-5" /> <span>{title}</span></h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nome/Tipo de Trânsito</label>
            <input value={formData.nomeTransito} onChange={e => setFormData({...formData, nomeTransito: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 outline-none focus:border-orange-500" placeholder="Ex: TERRESTRE" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Dias Padrão de TAT</label>
            <input type="number" value={formData.diasPadrao} onChange={e => setFormData({...formData, diasPadrao: parseInt(e.target.value) || 0})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
          </div>
        </div>
        <div className="p-8 border-t flex space-x-3">
          <button onClick={onClose} className="flex-1 py-4 font-bold text-gray-400">Cancelar</button>
          <button onClick={() => onSave({...formData, id: formData.id || Math.random().toString(36).substr(2, 9)})} className="flex-1 py-4 font-bold bg-orange-600 text-white rounded-2xl shadow-xl">Salvar Item</button>
        </div>
      </div>
    </div>
  );
};

export const DefaultCriticalModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title, initialData }) => {
  const [formData, setFormData] = useState<Partial<DefaultCriticalItem>>({
    partNumber: '',
    status: 'ativo'
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
        <div className="p-6 border-b flex justify-between items-center bg-gray-800 text-white rounded-t-3xl">
          <h3 className="text-xl font-bold flex items-center space-x-2"><AlertOctagon className="w-5 h-5" /> <span>{title}</span></h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Part Number (P/N)</label>
            <input value={formData.partNumber} onChange={e => setFormData({...formData, partNumber: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 outline-none focus:border-orange-500 transition-all" placeholder="Ex: SKU-12345" />
          </div>
        </div>
        <div className="p-8 border-t flex space-x-3">
          <button onClick={onClose} className="flex-1 py-4 font-bold text-gray-400">Cancelar</button>
          <button onClick={() => onSave({...formData, id: formData.id || Math.random().toString(36).substr(2, 9)})} className="flex-1 py-4 font-bold bg-orange-600 text-white rounded-2xl shadow-xl">Salvar Item</button>
        </div>
      </div>
    </div>
  );
};
