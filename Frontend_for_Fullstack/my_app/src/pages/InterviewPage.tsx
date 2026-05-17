import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { ChatMessage } from '../components/ChatMessage';
import { useAuth } from '../context/AuthContext';
import { Seo } from '../components/Seo';

export const InterviewPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { logout, userRole } = useAuth();
  const [input, setInput] = useState('');
  
  const { messages, status, disconnect, sendMessage } = useWebSocket(sessionId);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  useEffect(() => {
    if (isAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAutoScroll]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const statusConfig = {
    'Connecting': { color: 'bg-yellow-400', icon: '⏳', text: 'Connecting...' },
    'Connected': { color: 'bg-green-400', icon: '✓', text: 'Connected' },
    'Disconnected': { color: 'bg-red-400', icon: '✗', text: 'Disconnected' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Disconnected'];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Seo
        title={`Interview Session ${sessionId}`}
        description="Private Interview Pro practice session."
        canonicalPath={`/interview/${sessionId}`}
        noIndex
      />
      
      {/* HEADER */}
      <header className="bg-white border-b-2 border-indigo-200 px-4 md:px-6 py-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center space-x-4 flex-1">
          <button 
            onClick={() => {
              disconnect();      
              navigate('/profile');
            }}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition p-2 rounded-lg text-2xl"
          >
            ←
          </button>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800">
              Interview Session #{sessionId}
            </h3>
            <div className="flex items-center mt-1 space-x-2">
              <span className={`h-3 w-3 rounded-full ${config.color} animate-pulse`}></span>
              <span className="text-xs text-gray-600 font-medium">
                {config.icon} {config.text}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className={`px-3 py-2 rounded-lg transition text-sm font-semibold ${
              isAutoScroll
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
            title="Toggle auto-scroll"
          >
            {isAutoScroll ? '📌' : '📖'}
          </button>
          <button
            onClick={() => {
              disconnect();
              navigate('/profile');
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition font-semibold text-sm"
          >
            Exit
          </button>
        </div>
      </header>

      {/* CHAT AREA (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gradient-to-br from-gray-50 to-white">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <p className="text-gray-400 text-lg mb-2">👋 Interview Started</p>
              <p className="text-gray-500 text-sm">Waiting for first question...</p>
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} />
        ))}
        
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* INPUT AREA (Fixed bottom) */}
      <div className="bg-white border-t-2 border-indigo-200 p-4 md:p-6 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={status === 'Connected' ? "Type your answer..." : "Connecting..."}
              disabled={status !== 'Connected'}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:text-gray-500"
            />
            <button
              onClick={handleSend}
              disabled={status !== 'Connected' || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition transform hover:scale-105 disabled:transform-none"
              title="Send message (Enter)"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Press Enter to send • Role: {userRole || 'Unknown'}</p>
        </div>
      </div>
    </div>
  );
};
