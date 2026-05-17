import { useEffect, useRef, useState, useCallback } from 'react';
import { ChatMessage } from '../types';

export const useWebSocket = (sessionId: string | undefined) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<'Connecting' | 'Connected' | 'Disconnected'>('Connecting');

  const wsRef = useRef<WebSocket | null>(null);
  const closedRef = useRef(false); 

  const disconnect = useCallback(() => {
    if (wsRef.current && !closedRef.current) {
      closedRef.current = true;

      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;

      wsRef.current.close();
      wsRef.current = null;

      setStatus('Disconnected');
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    closedRef.current = false;
    setStatus('Connecting');

    const configuredUrl = import.meta.env.VITE_WS_URL;
    const fallbackProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsBaseUrl = configuredUrl || `${fallbackProtocol}//${window.location.host}`;
    const ws = new WebSocket(`${wsBaseUrl}/ws/v1/interview/${sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!closedRef.current) {
        setStatus('Connected');
      }
    };

    ws.onmessage = (event) => {
      if (closedRef.current) return;

      try {
        const data = JSON.parse(event.data);
        const text = data.text || data.content || JSON.stringify(data);
        setMessages(prev => [...prev, { sender: 'ai', text, timestamp: Date.now() }]);
      } catch {
        setMessages(prev => [...prev, { sender: 'ai', text: event.data, timestamp: Date.now() }]);
      }
    };

    ws.onclose = () => {
      if (!closedRef.current) {
        setStatus('Disconnected');
      }
    };

    ws.onerror = () => {
      if (!closedRef.current) {
        setStatus('Disconnected');
      }
    };

    return () => {
      disconnect(); 
    };
  }, [sessionId, disconnect]);

  const sendMessage = (text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content: text }));
      setMessages(prev => [...prev, { sender: 'user', text, timestamp: Date.now() }]);
    }
  };

  return { messages, status, sendMessage, disconnect };
};
