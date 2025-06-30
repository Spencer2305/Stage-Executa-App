'use client';

import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Send } from "lucide-react";
import { avatarIcons, backgroundPatterns, animationOptions, chatSizes } from '@/constants/embedConstants';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

interface ChatPreviewComponentProps {
  embedStyle: any;
  isFullscreen?: boolean;
}

export default function ChatPreviewComponent({ embedStyle, isFullscreen = false }: ChatPreviewComponentProps) {
  // Check if accessibility theme is selected for special handling
  const isLargeTextTheme = embedStyle.selectedTheme === 'large-text';
  const isHighContrastTheme = embedStyle.selectedTheme === 'high-contrast';
  
  // Apply custom CSS to the component
  useEffect(() => {
    const cssToApply = embedStyle.fullCSS || embedStyle.customCSS;
    const styleId = 'executa-custom-css-preview';
    
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
  
  const previewStyles = {
    backgroundColor: embedStyle.chatBackgroundColor,
    // Apply Google Font
    fontFamily: embedStyle.googleFont === 'inter' ? '"Inter", sans-serif' :
      embedStyle.googleFont === 'roboto' ? '"Roboto", sans-serif' :
      embedStyle.googleFont === 'open-sans' ? '"Open Sans", sans-serif' :
      embedStyle.googleFont === 'poppins' ? '"Poppins", sans-serif' :
      embedStyle.googleFont === 'lato' ? '"Lato", sans-serif' :
      embedStyle.googleFont === 'montserrat' ? '"Montserrat", sans-serif' :
      embedStyle.googleFont === 'nunito' ? '"Nunito", sans-serif' :
      embedStyle.googleFont === 'source-sans' ? '"Source Sans Pro", sans-serif' :
      '"Inter", sans-serif',
    // Apply chat window size - larger for fullscreen and accessibility
    maxWidth: isFullscreen ? '500px' : (isLargeTextTheme ? '400px' : (chatSizes.find(size => size.id === embedStyle.chatSize)?.width || '350px')),
    height: isFullscreen ? '600px' : (isLargeTextTheme ? '500px' : (chatSizes.find(size => size.id === embedStyle.chatSize)?.height || '450px')),
    // Apply border radius
    borderRadius: `${embedStyle.borderRadius}px`,
    // Apply opacity
    opacity: embedStyle.opacity / 100,
    // Apply glass effect
    backdropFilter: embedStyle.glassEffect ? 'blur(10px)' : 'none',
    // Apply background pattern
    backgroundImage: backgroundPatterns.find(pattern => pattern.id === embedStyle.backgroundPattern)?.css || '',
    backgroundSize: backgroundPatterns.find(pattern => pattern.id === embedStyle.backgroundPattern)?.backgroundSize || 'auto',
    // Apply animation transitions
    transition: animationOptions.find(anim => anim.id === embedStyle.animation)?.css || '',
    // Accessibility enhancements
    ...(isHighContrastTheme && {
      border: '2px solid #000000',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
    })
  };

  return (
    <div 
      className={`${isFullscreen ? 'mx-auto' : 'w-full mx-auto'} shadow-lg border overflow-hidden chat-preview-container executa-chat-widget`}
      style={previewStyles}
    >
      {/* Chat Header */}
      {embedStyle.showChatHeader && (
        <div 
          className="p-4 text-white flex items-center executa-chat-header"
          style={{ 
            background: embedStyle.chatHeaderGradient || `linear-gradient(90deg, ${embedStyle.bubbleColor} 0%, ${embedStyle.userMessageBubbleColor} 100%)`,
            borderRadius: `${embedStyle.borderRadius}px ${embedStyle.borderRadius}px 0 0`
          }}
        >
          <h3 className={`${isFullscreen ? 'text-lg' : (isLargeTextTheme ? 'text-lg' : 'text-base')} font-medium`}>{embedStyle.chatHeaderTitle}</h3>
        </div>
      )}

      {/* Chat Messages */}
      <div className={`p-4 space-y-3 ${isFullscreen ? 'min-h-[450px] max-h-[450px]' : 'min-h-[300px] max-h-[300px]'} overflow-y-auto executa-chat-messages`}>
        {/* Welcome Message */}
        {embedStyle.welcomeMessage && (
          <div className="flex items-start space-x-2">
            {embedStyle.showAssistantAvatar && (
              <div 
                className={`${isFullscreen || isLargeTextTheme ? 'w-10 h-10' : 'w-8 h-8'} rounded-full flex-shrink-0 flex items-center justify-center executa-avatar`}
                style={{ backgroundColor: embedStyle.bubbleColor }}
              >
                <FontAwesomeIcon 
                  icon={avatarIcons.find(icon => icon.id === embedStyle.assistantAvatarIcon)?.icon || faRobot}
                  className={`${isFullscreen || isLargeTextTheme ? 'w-5 h-5' : 'w-4 h-4'} text-white`}
                />
              </div>
            )}
            <div 
              className={`max-w-[80%] px-3 py-2 ${isFullscreen || isLargeTextTheme ? 'text-base' : 'text-sm'} text-gray-800 executa-message-assistant`}
              style={{ 
                backgroundColor: embedStyle.assistantMessageBubbleColor,
                borderRadius: `${embedStyle.borderRadius || embedStyle.messageBubbleRadius}px`
              }}
            >
              {embedStyle.welcomeMessage}
            </div>
          </div>
        )}

        {/* Sample User Message */}
        <div className="flex justify-end">
          <div 
            className={`max-w-[80%] px-3 py-2 ${isFullscreen || isLargeTextTheme ? 'text-base' : 'text-sm'} text-white executa-message-user`}
            style={{ 
              backgroundColor: embedStyle.userMessageBubbleColor,
              borderRadius: `${embedStyle.borderRadius || embedStyle.messageBubbleRadius}px`
            }}
          >
            Hello! How can you help me?
          </div>
        </div>

        {/* Sample Assistant Response */}
        <div className="flex items-start space-x-2">
          {embedStyle.showAssistantAvatar && (
            <div 
              className={`${isFullscreen || isLargeTextTheme ? 'w-10 h-10' : 'w-8 h-8'} rounded-full flex-shrink-0 flex items-center justify-center executa-avatar`}
              style={{ backgroundColor: embedStyle.bubbleColor }}
            >
              <FontAwesomeIcon 
                icon={avatarIcons.find(icon => icon.id === embedStyle.assistantAvatarIcon)?.icon || faRobot}
                className={`${isFullscreen || isLargeTextTheme ? 'w-5 h-5' : 'w-4 h-4'} text-white`}
              />
            </div>
          )}
          <div 
            className={`max-w-[80%] px-3 py-2 ${isFullscreen || isLargeTextTheme ? 'text-base' : 'text-sm'} text-gray-800 executa-message-assistant`}
            style={{ 
              backgroundColor: embedStyle.assistantMessageBubbleColor,
              borderRadius: `${embedStyle.borderRadius || embedStyle.messageBubbleRadius}px`
            }}
          >
            I'm here to help! Feel free to ask me anything about our services.
          </div>
        </div>

        {/* Another sample exchange */}
        <div className="flex justify-end">
          <div 
            className={`max-w-[80%] px-3 py-2 ${isFullscreen || isLargeTextTheme ? 'text-base' : 'text-sm'} text-white executa-message-user`}
            style={{ 
              backgroundColor: embedStyle.userMessageBubbleColor,
              borderRadius: `${embedStyle.borderRadius || embedStyle.messageBubbleRadius}px`
            }}
          >
            What are your business hours?
          </div>
        </div>

        <div className="flex items-start space-x-2">
          {embedStyle.showAssistantAvatar && (
            <div 
              className={`${isFullscreen || isLargeTextTheme ? 'w-10 h-10' : 'w-8 h-8'} rounded-full flex-shrink-0 flex items-center justify-center executa-avatar`}
              style={{ backgroundColor: embedStyle.bubbleColor }}
            >
              <FontAwesomeIcon 
                icon={avatarIcons.find(icon => icon.id === embedStyle.assistantAvatarIcon)?.icon || faRobot}
                className={`${isFullscreen || isLargeTextTheme ? 'w-5 h-5' : 'w-4 h-4'} text-white`}
              />
            </div>
          )}
          <div 
            className={`max-w-[80%] px-3 py-2 ${isFullscreen || isLargeTextTheme ? 'text-base' : 'text-sm'} text-gray-800 executa-message-assistant`}
            style={{ 
              backgroundColor: embedStyle.assistantMessageBubbleColor,
              borderRadius: `${embedStyle.borderRadius || embedStyle.messageBubbleRadius}px`
            }}
          >
            We're open Monday to Friday, 9 AM to 6 PM EST. Feel free to reach out anytime!
          </div>
        </div>
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-gray-200 executa-chat-input">
        <div className="flex items-center space-x-2">
          <input 
            type="text" 
            placeholder="Type your message..."
            className={`flex-1 px-3 py-2 ${isFullscreen || isLargeTextTheme ? 'text-base' : 'text-sm'} border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500`}
            value="Type your message..."
            readOnly
          />
          <button 
            className="p-2 rounded-lg"
            style={{ backgroundColor: embedStyle.userMessageBubbleColor }}
          >
            <Send className={`${isFullscreen || isLargeTextTheme ? 'h-5 w-5' : 'h-4 w-4'} text-white`} />
          </button>
        </div>
      </div>
    </div>
  );
} 