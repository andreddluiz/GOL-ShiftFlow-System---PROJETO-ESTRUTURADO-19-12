
import React, { useState } from 'react';
import { Send, Heart, MessageCircle, MoreHorizontal, User } from 'lucide-react';

const AnnouncementsPage: React.FC<{baseId?: string}> = ({ baseId }) => {
  const [messages, setMessages] = useState([
    { id: 1, user: 'Coordenação Regional', text: 'Lembrete: Novo protocolo de etiquetagem entra em vigor na segunda-feira.', time: '2h atrás', likes: 5, comments: 2 },
    { id: 2, user: 'Gestão POA', text: 'Parabéns ao Turno 1 pela performance de 98% ontem! Ótimo trabalho.', time: '5h atrás', likes: 12, comments: 1 },
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
           <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
             <User className="text-orange-600" />
           </div>
           <input 
            type="text" 
            placeholder="Compartilhe um comunicado ou aviso com a base..."
            className="flex-1 bg-gray-50 border-none rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-orange-200"
           />
           <button className="p-3 gol-orange text-white rounded-full hover:bg-orange-600 shadow-md">
             <Send className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                  {msg.user.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{msg.user}</h4>
                  <p className="text-xs text-gray-400">{msg.time}</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-700 mb-6 leading-relaxed">
              {msg.text}
            </p>
            <div className="flex items-center space-x-6 border-t border-gray-50 pt-4">
              <button className="flex items-center space-x-2 text-gray-500 hover:text-orange-600 transition-colors">
                <Heart className="w-5 h-5" />
                <span className="text-sm font-medium">{msg.likes}</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-500 hover:text-orange-600 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{msg.comments}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
