// CSS generation utilities

import { backgroundPatterns, animationOptions, chatSizes } from '@/constants/embedConstants';

export const generateCSSFromStyle = (embedStyle: any): string => {
  const bgPattern = backgroundPatterns.find(p => p.id === embedStyle.backgroundPattern);
  const animation = animationOptions.find(a => a.id === embedStyle.animation);
  const chatSize = chatSizes.find(s => s.id === embedStyle.chatSize);

  const css = `/* Generated CSS from your embed styling settings */

/* Chat Widget Container */
.executa-chat-widget {
  background-color: ${embedStyle.chatBackgroundColor};
  font-family: ${getFontFamily(embedStyle.googleFont)};
  border-radius: ${embedStyle.borderRadius}px;
  opacity: ${embedStyle.opacity / 100};
  ${embedStyle.glassEffect ? 'backdrop-filter: blur(10px);' : ''}
  ${bgPattern?.css ? `background-image: ${bgPattern.css};` : ''}
  ${bgPattern?.backgroundSize ? `background-size: ${bgPattern.backgroundSize};` : ''}
  ${animation?.css || ''}
  max-width: ${chatSize?.width || '350px'};
  height: ${chatSize?.height || '450px'};
}

/* Chat Header */
.executa-chat-header {
  background: ${embedStyle.chatHeaderGradient};
  border-radius: ${embedStyle.borderRadius}px ${embedStyle.borderRadius}px 0 0;
}

/* Chat Button/Bubble */
.executa-chat-bubble {
  background-color: ${embedStyle.bubbleColor};
  ${getButtonShapeCSS(embedStyle.buttonShape)}
  ${animation?.css || ''}
}

.executa-chat-bubble:hover {
  transform: scale(1.05);
  ${animation?.css || ''}
}

/* Message Bubbles */
.executa-message-user {
  background-color: ${embedStyle.userMessageBubbleColor};
  border-radius: ${embedStyle.borderRadius || embedStyle.messageBubbleRadius}px;
  color: white;
}

.executa-message-assistant {
  background-color: ${embedStyle.assistantMessageBubbleColor};
  border-radius: ${embedStyle.borderRadius || embedStyle.messageBubbleRadius}px;
  color: #374151;
}

/* Assistant Avatar */
.executa-avatar {
  background-color: ${embedStyle.bubbleColor};
  border-radius: 50%;
}

/* Chat Input */
.executa-chat-input input {
  border-radius: ${Math.max(embedStyle.borderRadius - 4, 4)}px;
}

.executa-chat-input button {
  background-color: ${embedStyle.userMessageBubbleColor};
  border-radius: ${Math.max(embedStyle.borderRadius - 4, 4)}px;
}

/* Animation Classes */
${embedStyle.animation === 'bounce' ? `
.executa-chat-widget {
  animation: bounceIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}
` : ''}

${embedStyle.animation === 'slide' ? `
.executa-chat-widget {
  animation: slideIn 0.4s ease-in-out;
}

@keyframes slideIn {
  0% { transform: translateY(100%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
` : ''}

${embedStyle.animation === 'fade' ? `
.executa-chat-widget {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
` : ''}

/* Glass Effect */
${embedStyle.glassEffect ? `
.executa-chat-widget {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.executa-message-assistant {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
}
` : ''}`;

  return css;
};

const getFontFamily = (fontId: string): string => {
  const fontMap: Record<string, string> = {
    'inter': '"Inter", sans-serif',
    'roboto': '"Roboto", sans-serif',
    'open-sans': '"Open Sans", sans-serif',
    'poppins': '"Poppins", sans-serif',
    'lato': '"Lato", sans-serif',
    'montserrat': '"Montserrat", sans-serif',
    'nunito': '"Nunito", sans-serif',
    'source-sans': '"Source Sans Pro", sans-serif'
  };
  return fontMap[fontId] || '"Inter", sans-serif';
};

const getButtonShapeCSS = (shape: string): string => {
  switch (shape) {
    case 'square':
      return 'border-radius: 8px;';
    case 'circle':
      return 'border-radius: 50%;';
    case 'rounded':
    default:
      return 'border-radius: 16px;';
  }
}; 