import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';

interface Props {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<Props> = ({ message }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1">
          AI
        </div>
      )}
      <div className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-3 shadow-sm ${
        isUser 
          ? 'bg-blue-600 text-white rounded-br-none' 
          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
      }`}>
        <p className="text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap">
          {message.text}
        </p>
      </div>
      {isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold ml-2 mt-1">
          You
        </div>
      )}
    </div>
  );
};