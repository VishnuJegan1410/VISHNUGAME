import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import { getGamerAdvice } from '../services/geminiService';

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Yo! VISHNU AI here. Need help picking a game or booking a rig?' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const reply = await getGamerAdvice(userMsg);
    
    setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    setLoading(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-neon-purple text-white rounded-full shadow-[0_0_15px_#bc13fe] hover:scale-110 transition-transform duration-300"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-neon-dark/95 backdrop-blur-md border border-neon-purple/30 rounded-xl shadow-2xl flex flex-col h-[500px]">
          {/* Header */}
          <div className="p-4 border-b border-neon-purple/20 bg-neon-purple/10 rounded-t-xl flex items-center gap-3">
            <Bot className="text-neon-cyan" />
            <div>
              <h3 className="font-display font-bold text-white tracking-wider">VISHNU AI</h3>
              <p className="text-xs text-neon-cyan">Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.role === 'user' 
                    ? 'bg-neon-purple text-white rounded-tr-none' 
                    : 'bg-slate-800 text-gray-200 border border-neon-cyan/30 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-lg border border-neon-cyan/30 flex gap-1">
                  <span className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-neon-purple/20 bg-slate-900/50 rounded-b-xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about games..."
                className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan"
              />
              <button 
                onClick={handleSend}
                disabled={loading}
                className="p-2 bg-neon-cyan text-black rounded-lg hover:bg-white transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;