'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MessageSquare, Send } from "lucide-react";
import { avatarIcons, backgroundPatterns, chatSizes } from '@/constants/embedConstants';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

interface LivePreviewChatWidgetProps {
  embedStyle: any;
  assistant: any;
}

export default function LivePreviewChatWidget({ embedStyle, assistant }: LivePreviewChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      content: embedStyle.welcomeMessage || assistant?.welcomeMessage || "Hello! How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  // Apply custom CSS to the component
  useEffect(() => {
    const cssToApply = embedStyle.fullCSS || embedStyle.customCSS;
    const styleId = 'executa-custom-css-live-preview';
    
    // Clean up any existing style element first
    const existingElement = document.getElementById(styleId);
    if (existingElement) {
      existingElement.remove();
    }
    
    // Only create new style element if we have CSS to apply
    if (cssToApply && cssToApply.trim()) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.type = 'text/css';
      styleElement.textContent = cssToApply;
      document.head.appendChild(styleElement);
    }
    
    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [embedStyle.customCSS, embedStyle.fullCSS]);

  const getScaledChatSize = (sizeId: string) => {
    const size = chatSizes.find(s => s.id === sizeId) || chatSizes.find(s => s.id === 'standard');
    if (!size) return { width: '280px', height: '360px' };
    
    // Convert size values to numbers and scale appropriately for preview
    const width = parseInt(size.width.replace('px', '').replace('vh', ''));
    const height = size.height.includes('vh') ? 
      Math.round(window.innerHeight * 0.35) : // 35% of viewport for 'vh' units
      parseInt(size.height.replace('px', ''));
    
    return {
      width: `${Math.min(width, 380)}px`, // Cap at 380px for preview
      height: `${Math.min(height, 480)}px` // Cap at 480px for preview
    };
  };

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    // Add demo assistant response
    const assistantMessage = {
      type: 'assistant',
      content: getDemoResponse(inputValue),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputValue('');
  };

  const getDemoResponse = (input: string) => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('help') || lowerInput.includes('how')) {
      return "I'm here to help! This is a live preview of how your chat widget will work on your website.";
    }
    if (lowerInput.includes('hours') || lowerInput.includes('time')) {
      return "We're typically available Monday to Friday, 9 AM to 6 PM EST. Feel free to reach out anytime!";
    }
    if (lowerInput.includes('price') || lowerInput.includes('cost')) {
      return "I'd be happy to help you with pricing information. Let me connect you with our team for detailed pricing.";
    }
    return "Thanks for your message! This is a preview of how your AI assistant will respond to visitors on your website.";
  };

  return (
    <div>
      {/* Chat Widget Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`w-16 h-16 flex items-center justify-center border-none cursor-pointer shadow-lg transition-all duration-300 hover:scale-105 relative executa-chat-bubble`}
          style={{
            backgroundColor: embedStyle.bubbleColor,
            borderRadius: embedStyle.buttonShape === 'square' ? '8px' : 
              embedStyle.buttonShape === 'rounded' ? '16px' : '50%'
          }}
        >
          <MessageSquare className="h-7 w-7 text-white" />
          {/* Notification dot */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="bg-white rounded-lg shadow-xl border overflow-hidden executa-chat-widget"
          style={{ 
            width: getScaledChatSize(embedStyle.chatSize).width,
            height: getScaledChatSize(embedStyle.chatSize).height,
            borderRadius: `${embedStyle.borderRadius}px`,
            opacity: embedStyle.opacity / 100,
            backdropFilter: embedStyle.glassEffect ? 'blur(10px)' : 'none',
            backgroundImage: backgroundPatterns.find(pattern => pattern.id === embedStyle.backgroundPattern)?.css || '',
            backgroundSize: backgroundPatterns.find(pattern => pattern.id === embedStyle.backgroundPattern)?.backgroundSize || 'auto',
            fontFamily: embedStyle.googleFont === 'inter' ? '"Inter", sans-serif' :
              embedStyle.googleFont === 'roboto' ? '"Roboto", sans-serif' :
              embedStyle.googleFont === 'open-sans' ? '"Open Sans", sans-serif' :
              embedStyle.googleFont === 'poppins' ? '"Poppins", sans-serif' :
              embedStyle.googleFont === 'lato' ? '"Lato", sans-serif' :
              embedStyle.googleFont === 'montserrat' ? '"Montserrat", sans-serif' :
              embedStyle.googleFont === 'nunito' ? '"Nunito", sans-serif' :
              embedStyle.googleFont === 'source-sans' ? '"Source Sans Pro", sans-serif' :
              '"Inter", sans-serif'
          }}
        >
          {/* Header */}
          {embedStyle.showChatHeader && (
            <div 
              className="p-3 text-white flex items-center justify-between executa-chat-header"
              style={{ 
                background: embedStyle.chatHeaderGradient || `linear-gradient(90deg, ${embedStyle.bubbleColor} 0%, ${embedStyle.userMessageBubbleColor} 100%)`,
                borderRadius: `${embedStyle.borderRadius}px ${embedStyle.borderRadius}px 0 0`
              }}
            >
              <h3 className="text-sm font-medium">{embedStyle.chatHeaderTitle}</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                ×
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 p-3 space-y-2 overflow-y-auto executa-chat-messages" style={{ height: '300px' }}>
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'items-start space-x-2'}`}>
                {message.type === 'assistant' && embedStyle.showAssistantAvatar && (
                  <div 
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center executa-avatar"
                    style={{ backgroundColor: embedStyle.bubbleColor }}
                  >
                    <FontAwesomeIcon 
                      icon={avatarIcons.find(icon => icon.id === embedStyle.assistantAvatarIcon)?.icon || faRobot}
                      className="w-3 h-3 text-white"
                    />
                  </div>
                )}
                <div 
                  className={`max-w-[80%] px-2 py-1 text-xs ${
                    message.type === 'user' ? 'text-white executa-message-user' : 'text-gray-800 executa-message-assistant'
                  }`}
                  style={{ 
                    backgroundColor: message.type === 'user' 
                      ? embedStyle.userMessageBubbleColor 
                      : embedStyle.assistantMessageBubbleColor,
                    borderRadius: `${embedStyle.borderRadius || embedStyle.messageBubbleRadius}px`
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 executa-chat-input">
            <div className="flex items-center space-x-2">
              <input 
                type="text" 
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button 
                onClick={sendMessage}
                className="p-1 rounded-lg"
                style={{ backgroundColor: embedStyle.userMessageBubbleColor }}
              >
                <Send className="h-3 w-3 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 