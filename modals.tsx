
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, MapPin, Shield, Info, AlertCircle, TrendingUp } from 'lucide-react';
import { Base, User, Category, Task, Control, Shift, PermissionLevel, MeasureType } from './types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  initialData?: any;
}

// Utilitários de conversão para o modal
const decimalToHHMMSS = (decimalHours: number): string => {
  const totalSeconds = Math.round(decimalHours * 3600);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
};

const hhmmssToDecimal = (hhmmss: string): number => {
  const parts = hhmmss.split(':').map(Number);
  if (parts.length !== 3) return 0;
  const [h, m, s] = parts;
  return h + (m / 60) + (s / 3600);
};

export const CategoryModal: React.FC<ModalProps & { tipo: 'operacional' | 'mensal' }> = ({ isOpen, onClose, onSave, title, initialData, tipo }) => {
  const [formData, setFormData] = useState<Partial<Category>>({
    nome: '',
    tipo: tipo,
    ordem: 1,
    status: 'Ativa'
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
        <div className="p-6 border-b flex justify-between items-center bg-gray-100 rounded-t-3xl">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase">Nome da Categoria *</label>
            <input 
              value={formData.nome} 
              onChange={e => setFormData({...formData, nome: e.target.value})}
              className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-orange-500" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase">Ordem</label>
              <input 
                type="number"
                value={formData.ordem} 
                onChange={e => setFormData({...formData, ordem: parseInt(e.target.value) || 1})}
                className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase">Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
                className="w-full p-4 bg-gray-50 border rounded-2xl outline-none"
              >
                <option value="Ativa">Ativa</option>
                <option value="Inativa">Inativa</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-8 border-t flex space-x-3">
          <button onClick={onClose} className="flex-1 py-4 font-bold text-gray-400">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-4 font-bold gol-orange text-white rounded-2xl">Salvar Categoria</button>
        </div>
      </div>
    </div>
  );
};

export const BaseModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title, initialData }) => {
  const [formData, setFormData] = useState<Partial<Base>>({
    nome: '',
    sigla: '',
    jornada: '8h',
    numeroTurnos: 3,
    status: 'Ativa',
    turnos: [],
    metaVerde: 70,
    metaAmarelo: 40
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  const handleAddShift = () => {
    const nextNum = (formData.turnos?.length || 0) + 1;
    setFormData({
      ...formData,
      turnos: [...(formData.turnos || []), { id: Date.now().toString(), numero: nextNum, horaInicio: '08:00', horaFim: '16:00' }]
    });
  };

  const removeShift = (id: string) => {
    setFormData({
      ...formData,
      turnos: formData.turnos?.filter(s => s.id !== id)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95">
        <div className="p-6 border-b flex justify-between items-center bg-orange-50 rounded-t-3xl">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase">Nome da Base *</label>
              <input 
                value={formData.nome} 
                onChange={e => setFormData({...formData, nome: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase">Sigla *</label>
              <input 
                value={formData.sigla} 
                onChange={e => setFormData({...formData, sigla: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 outline-none" 
              />
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-6">
            <h4 className="font-black text-xs uppercase text-gray-400 tracking-widest flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" /> <span>Metas de Produtividade (%)</span>
            </h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                 <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <label className="text-xs font-bold text-gray-500">Mínimo para Verde</label>
                 </div>
                 <input 
                  type="number" 
                  value={formData.metaVerde} 
                  onChange={e => setFormData({...formData, metaVerde: parseInt(e.target.value) || 0})}
                  className="w-full p-3 bg-white border rounded-xl font-bold text-center" 
                  placeholder="Ex: 70"
                />
              </div>
              <div className="space-y-2">
                 <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <label className="text-xs font-bold text-gray-500">Mínimo para Amarelo</label>
                 </div>
                 <input 
                  type="number" 
                  value={formData.metaAmarelo} 
                  onChange={e => setFormData({...formData, metaAmarelo: parseInt(e.target.value) || 0})}
                  className="w-full p-3 bg-white border rounded-xl font-bold text-center" 
                  placeholder="Ex: 40"
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 italic">Valores abaixo do Amarelo serão considerados Performance Crítica (Vermelho).</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-t pt-6">
              <h4 className="font-bold text-gray-800">Cadastro de Turnos</h4>
              <button onClick={handleAddShift} className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1">
                <Plus className="w-4 h-4" /> <span>Adicionar Turno</span>
              </button>
            </div>
            <div className="space-y-3">
              {formData.turnos?.map((shift, idx) => (
                <div key={shift.id} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-orange-600 shadow-sm">{idx + 1}</div>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input type="time" value={shift.horaInicio} onChange={e => {
                      const updated = [...(formData.turnos || [])];
                      updated[idx].horaInicio = e.target.value;
                      setFormData({...formData, turnos: updated});
                    }} className="bg-transparent border-none font-bold" />
                    <input type="time" value={shift.horaFim} onChange={e => {
                      const updated = [...(formData.turnos || [])];
                      updated[idx].horaFim = e.target.value;
                      setFormData({...formData, turnos: updated});
                    }} className="bg-transparent border-none font-bold" />
                  </div>
                  <button onClick={() => removeShift(shift.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-8 border-t flex space-x-3">
          <button onClick={onClose} className="flex-1 py-3 font-bold text-gray-500 border rounded-2xl">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-3 font-bold gol-orange text-white rounded-2xl shadow-lg shadow-orange-100">Salvar Base</button>
        </div>
      </div>
    </div>
  );
};

export const UserModal: React.FC<ModalProps & { allBases: Base[] }> = ({ isOpen, onClose, onSave, title, initialData, allBases }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    nome: '',
    email: '',
    loginRE: '',
    permissao: PermissionLevel.OPERACAO,
    status: 'Ativo',
    bases: [],
    jornadaPadrao: 6
  });

  const [jornadaOption, setJornadaOption] = useState<string>('6');
  const [customHHMMSS, setCustomHHMMSS] = useState<string>('00:00:00');
  const standardJornadas = [4, 6, 8, 10, 12];

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      const isStd = standardJornadas.includes(initialData.jornadaPadrao);
      if (isStd) {
        setJornadaOption(String(initialData.jornadaPadrao));
      } else {
        setJornadaOption('outra');
        setCustomHHMMSS(decimalToHHMMSS(initialData.jornadaPadrao));
      }
    } else {
      setJornadaOption('6');
      setFormData(prev => ({ ...prev, jornadaPadrao: 6 }));
    }
  }, [initialData]);

  if (!isOpen) return null;

  const toggleBase = (id: string) => {
    const current = formData.bases || [];
    setFormData({
      ...formData,
      bases: current.includes(id) ? current.filter(b => b !== id) : [...current, id]
    });
  };

  const handleJornadaOptionChange = (val: string) => {
    setJornadaOption(val);
    if (val !== 'outra') {
      setFormData({ ...formData, jornadaPadrao: parseInt(val) });
    } else {
      // Ao mudar para outra, inicializa com o que estiver no customHHMMSS
      setFormData({ ...formData, jornadaPadrao: hhmmssToDecimal(customHHMMSS) });
    }
  };

  const handleHHMMSSChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 6) val = val.slice(0, 6);
    
    // Aplica máscara HH:MM:SS
    let formatted = val;
    if (val.length > 4) {
      formatted = val.replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3');
    } else if (val.length > 2) {
      formatted = val.replace(/(\d{2})(\d{2})/, '$1:$2');
    }
    
    setCustomHHMMSS(formatted);
    
    // Se estiver completo ou pelo menos com horas/minutos, atualiza o decimal
    if (formatted.split(':').length === 3) {
      setFormData({ ...formData, jornadaPadrao: hhmmssToDecimal(formatted) });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl animate-in slide-in-from-bottom-4">
        <div className="p-6 border-b flex justify-between items-center bg-blue-50 rounded-t-3xl text-blue-800">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase">Nome Completo</label>
            <input 
              value={formData.nome} 
              onChange={e => setFormData({...formData, nome: e.target.value})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase">Email Corporativo</label>
              <input 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase">RE / Matrícula</label>
              <input 
                value={formData.loginRE} 
                onChange={e => setFormData({...formData, loginRE: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase">Jornada de Trabalho</label>
              <select 
                value={jornadaOption}
                onChange={e => handleJornadaOptionChange(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold"
              >
                <option value="4">4 Horas</option>
                <option value="6">6 Horas</option>
                <option value="8">8 Horas</option>
                <option value="10">10 Horas</option>
                <option value="12">12 Horas</option>
                <option value="outra">Outra...</option>
              </select>
              
              {jornadaOption === 'outra' && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                   <label className="text-[10px] text-orange-600 font-black uppercase mb-1 block">Carga Horária Nominal (HH:MM:SS)</label>
                   <input 
                    type="text"
                    placeholder="00:00:00"
                    value={customHHMMSS}
                    onChange={handleHHMMSSChange}
                    className="w-full p-3 bg-white border border-orange-200 rounded-xl outline-none font-black text-orange-600 focus:ring-2 focus:ring-orange-100 text-center tracking-widest"
                   />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase">Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase">Nível de Permissão</label>
            <select 
              value={formData.permissao}
              onChange={e => setFormData({...formData, permissao: e.target.value as any})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
            >
              {Object.values(PermissionLevel).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase">Bases com Acesso</label>
            <div className="flex flex-wrap gap-2">
              {allBases.map(base => (
                <button 
                  key={base.id}
                  onClick={() => toggleBase(base.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    formData.bases?.includes(base.id) 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {base.sigla}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-8 border-t flex space-x-3">
          <button onClick={onClose} className="flex-1 py-3 font-bold text-gray-500 border rounded-2xl">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-3 font-bold bg-blue-600 text-white rounded-2xl shadow-lg">Salvar Usuário</button>
        </div>
      </div>
    </div>
  );
};

export const TaskModal: React.FC<ModalProps & { categories: Category[] }> = ({ isOpen, onClose, onSave, title, initialData, categories }) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    nome: '',
    categoriaId: '',
    tipoMedida: MeasureType.QTD,
    fatorMultiplicador: 5,
    obrigatoriedade: true,
    status: 'Ativa'
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.tipoMedida === MeasureType.TEMPO) {
      setFormData(prev => ({ ...prev, fatiorMultiplicador: 1 }));
    }
  }, [formData.tipoMedida]);

  const validateAndSave = () => {
    const newErrors: Record<string, boolean> = {};
    if (!formData.nome?.trim()) newErrors.nome = true;
    if (!formData.categoriaId) newErrors.categoriaId = true;
    if (formData.tipoMedida === MeasureType.QTD && (!formData.fatorMultiplicador || formData.fatorMultiplicador <= 0)) {
      newErrors.fator = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-lg shadow-2xl overflow-hidden">
        <div className="p-6 bg-gray-900 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8 space-y-6">
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm font-bold text-red-600 uppercase tracking-tighter">Preencha todos os campos obrigatórios (*)</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase">Nome da Tarefa *</label>
            <input 
              value={formData.nome} 
              onChange={e => setFormData({...formData, nome: e.target.value})}
              className={`w-full p-4 bg-gray-50 border rounded-2xl focus:ring-2 outline-none transition-all ${
                errors.nome ? 'border-red-500 focus:ring-red-100' : 'border-gray-100 focus:ring-orange-100'
              }`} 
              placeholder="Ex: Recebimento de Carga"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase">Categoria *</label>
            <select 
              value={formData.categoriaId}
              onChange={e => setFormData({...formData, categoriaId: e.target.value})}
              className={`w-full p-4 bg-gray-50 border rounded-2xl outline-none transition-all ${
                errors.categoriaId ? 'border-red-500' : 'border-gray-100'
              }`}
            >
              <option value="">Selecionar Categoria...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase">Tipo de Medida *</label>
              <select 
                value={formData.tipoMedida}
                onChange={e => setFormData({...formData, tipoMedida: e.target.value as any})}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
              >
                <option value={MeasureType.QTD}>Quantidade (Multiplica)</option>
                <option value={MeasureType.TEMPO}>Tempo Direto (Minutos)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase">
                {formData.tipoMedida === MeasureType.TEMPO ? 'Fator (Anulado)' : 'Fator (min/unid) *'}
              </label>
              <input 
                type="number"
                disabled={formData.tipoMedida === MeasureType.TEMPO}
                value={formData.fatorMultiplicador} 
                onChange={e => setFormData({...formData, fatorMultiplicador: parseInt(e.target.value) || 0})}
                className={`w-full p-4 border rounded-2xl outline-none transition-all ${
                  formData.tipoMedida === MeasureType.TEMPO 
                  ? 'bg-gray-100 text-gray-400 border-gray-100' 
                  : (errors.fator ? 'border-red-500 bg-red-50' : 'bg-gray-50 border-gray-100')
                }`} 
                placeholder={formData.tipoMedida === MeasureType.TEMPO ? "Consid. Tempo Direto" : "Ex: 5"}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
            <input 
              type="checkbox" 
              checked={formData.obrigatoriedade}
              onChange={e => setFormData({...formData, obrigatoriedade: e.target.checked})}
              className="w-5 h-5 accent-orange-600 rounded-lg cursor-pointer" 
            />
            <span className="font-bold text-orange-800 text-sm cursor-pointer select-none">Tarefa obrigatória para fechamento.</span>
          </div>
        </div>
        <div className="p-8 border-t flex space-x-3 bg-gray-50/50">
          <button onClick={onClose} className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600">Cancelar</button>
          <button onClick={validateAndSave} className="flex-1 py-4 font-bold gol-orange text-white rounded-2xl shadow-xl shadow-orange-100 hover:scale-[1.02] active:scale-[0.98] transition-all">
            Confirmar Tarefa
          </button>
        </div>
      </div>
    </div>
  );
};

export const ControlModal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title, initialData }) => {
  const [formData, setFormData] = useState<Partial<Control>>({
    nome: '',
    tipo: 'TAT',
    descricao: '',
    unidade: 'horas',
    status: 'Ativo',
    alertaConfig: {
      verde: 0,
      amarelo: 0,
      vermelho: 0,
      permitirPopup: true,
      mensagemPopup: '',
      tipoPopup: 'aviso'
    }
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center bg-gray-900 text-white rounded-t-3xl">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase">Nome do Controle</label>
              <input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase">Tipo</label>
              <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value as any})} className="w-full p-4 bg-gray-50 border rounded-2xl">
                <option value="TAT">TAT</option>
                <option value="Vencimento">Vencimento</option>
                <option value="Crítico">Crítico</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-6">
            <h4 className="font-black text-xs uppercase text-gray-400 tracking-widest flex items-center space-x-2">
              <Shield className="w-4 h-4" /> <span>Configuração de Alertas</span>
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                 <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <label className="text-xs font-bold text-gray-500">Verde até</label>
                 </div>
                 <input 
                  type="number" 
                  value={formData.alertaConfig?.verde} 
                  onChange={e => setFormData({...formData, alertaConfig: {...formData.alertaConfig!, verde: parseInt(e.target.value) || 0}})}
                  className="w-full p-3 bg-white border rounded-xl font-bold text-center" 
                />
              </div>
              <div className="space-y-2">
                 <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <label className="text-xs font-bold text-gray-500">Amarelo até</label>
                 </div>
                 <input 
                  type="number" 
                  value={formData.alertaConfig?.amarelo} 
                  onChange={e => setFormData({...formData, alertaConfig: {...formData.alertaConfig!, amarelo: parseInt(e.target.value) || 0}})}
                  className="w-full p-3 bg-white border rounded-xl font-bold text-center" 
                />
              </div>
              <div className="space-y-2">
                 <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <label className="text-xs font-bold text-gray-500">Vermelho após</label>
                 </div>
                 <div className="w-full p-3 bg-white/50 border rounded-xl font-bold text-center text-red-600">
                    {formData.alertaConfig?.amarelo} +
                 </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <span className="font-bold text-gray-700">Ativar Popup de Notificação</span>
                <input 
                  type="checkbox" 
                  checked={formData.alertaConfig?.permitirPopup}
                  onChange={e => setFormData({...formData, alertaConfig: {...formData.alertaConfig!, permitirPopup: e.target.checked}})}
                  className="w-6 h-6 accent-orange-500"
                />
             </div>
             {formData.alertaConfig?.permitirPopup && (
               <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-xs font-black text-gray-400 uppercase">Mensagem Customizada</label>
                  <textarea 
                    value={formData.alertaConfig?.mensagemPopup}
                    onChange={e => setFormData({...formData, alertaConfig: {...formData.alertaConfig!, mensagemPopup: e.target.value}})}
                    className="w-full p-4 bg-gray-50 border rounded-2xl outline-none"
                    placeholder="Ex: Atenção! O limite crítico de TAT foi atingido."
                  />
               </div>
             )}
          </div>
        </div>
        <div className="p-8 border-t flex space-x-3">
          <button onClick={onClose} className="flex-1 py-4 font-bold text-gray-400">Descartar</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-4 font-bold bg-black text-white rounded-2xl shadow-xl">Salvar Configurações</button>
        </div>
      </div>
    </div>
  );
};
