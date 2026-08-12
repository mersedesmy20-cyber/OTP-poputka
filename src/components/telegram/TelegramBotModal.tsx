import React, { useState } from 'react';
import { X, Send, Bot, CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  showButton?: boolean;
}

export const TelegramBotModal: React.FC<Props> = ({ isOpen, onClose, userName }) => {
  if (!isOpen) return null;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: `👋 Вітаємо у корпоративному боті «Їдемо Разом (ОТП Банк)»!\n\nЯ допоможу вам організувати спільні поїздки з колегами до ГО Жилянська 43 та назад у ваші райони (Троєщина, Оболонь, Позняки, Ірпінь тощо).\n\nНатисніть кнопку нижче, щоб відкрити повний застосунок!`,
      time: '09:45',
      showButton: true,
    }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: 'um_' + Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');

    // Generate Bot Reply
    setTimeout(() => {
      let botReplyText = '';
      let hasButton = false;

      if (text.startsWith('/start') || text.includes('почати')) {
        botReplyText = `Ваш Telegram-акаунт успішно прив'язано до профілю ${userName} (ОТП Банк).\nТепер ви отримуватимете нагадування та сповіщення про нові поїздки з вашого району!`;
        hasButton = true;
      } else if (text.startsWith('/find') || text.includes('знайти')) {
        botReplyText = `🔎 Знайдено 4 активні поїздки з районів Троєщина, Позняки, Ірпінь та Оболонь до ГО Жилянська 43!`;
        hasButton = true;
      } else if (text.startsWith('/create') || text.includes('творити')) {
        botReplyText = `🚗 Оберіть ваш напрямок та виберіть графік («Через день» або «Робочі дні») у нашому Telegram Mini App:`;
        hasButton = true;
      } else {
        botReplyText = `Отримано команду: "${text}". Натисніть кнопку нижче для швидкого запуску Їдемо Разом.`;
        hasButton = true;
      }

      setMessages(prev => [
        ...prev,
        {
          id: 'bm_' + Date.now(),
          sender: 'bot',
          text: botReplyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          showButton: hasButton,
        }
      ]);
    }, 600);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ padding: 0, overflow: 'hidden', background: '#0e1621' }} onClick={(e) => e.stopPropagation()}>
        {/* Telegram Header */}
        <div style={{ background: '#17212b', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #0088cc, #00b4d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Bot size={22} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                @otp_ride_bot <CheckCircle size={14} color="#0088cc" />
              </div>
              <div style={{ fontSize: '12px', color: '#6c7883' }}>Офіційний Бот OTP Carpool</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6c7883', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Chat History */}
        <div style={{ height: '360px', overflowY: 'auto', padding: '16px', background: '#0e1621', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map(m => (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: '16px',
                  fontSize: '13.5px',
                  lineHeight: '1.45',
                  whiteSpace: 'pre-line',
                  background: m.sender === 'user' ? '#2b5278' : '#182533',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {m.text}
                {m.showButton && (
                  <button
                    onClick={onClose}
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      padding: '10px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0088cc, #00b4d8)',
                      color: 'white',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(0, 136, 204, 0.4)'
                    }}
                  >
                    🚀 Відкрити Їдемо Разом (Mini App)
                  </button>
                )}
              </div>
              <span style={{ fontSize: '10px', color: '#6c7883', marginTop: '3px', padding: '0 4px' }}>{m.time}</span>
            </div>
          ))}
        </div>

        {/* Quick Commands bar */}
        <div style={{ padding: '8px 12px', background: '#17212b', display: 'flex', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
          <button onClick={() => handleSend('/start')} style={{ background: '#242f3d', border: 'none', color: '#0088cc', padding: '6px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            /start
          </button>
          <button onClick={() => handleSend('/find')} style={{ background: '#242f3d', border: 'none', color: '#0088cc', padding: '6px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            /find_trips
          </button>
          <button onClick={() => handleSend('/create')} style={{ background: '#242f3d', border: 'none', color: '#0088cc', padding: '6px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            /create_trip
          </button>
        </div>

        {/* Input Bar */}
        <div style={{ padding: '12px', background: '#17212b', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Напишіть повідомлення боту..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{ flex: 1, background: '#0e1621', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 14px', borderRadius: '20px', outline: 'none', fontSize: '14px' }}
          />
          <button
            onClick={() => handleSend()}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0088cc', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
