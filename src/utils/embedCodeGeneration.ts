// Embed code generation utilities

import { generateCSSFromStyle } from './cssGeneration';

export const generateStyledEmbedCode = (embedStyle: any, assistant: any) => {
  const assistantId = assistant?.id || 'your-assistant-id';
  // Use fullCSS if available (from CSS editor), otherwise generate + custom
  const fullCSS = embedStyle.fullCSS || 
    `${generateCSSFromStyle(embedStyle)}${embedStyle.customCSS ? '\n\n/* Custom CSS */\n' + embedStyle.customCSS : ''}`;
  
  return `<!-- Executa AI Chat Widget -->
<style>
${fullCSS}
</style>
<div id="executa-chat-widget"></div>
<script>
  (function() {
    // Widget configuration
    const config = {
      assistantId: '${assistantId}',
      apiUrl: '${process.env.NODE_ENV === 'production' ? 'https://app.executa.ai' : 'http://localhost:3000'}',
      // Basic configuration
      position: '${embedStyle.position}',
      chatHeaderTitle: '${embedStyle.chatHeaderTitle || assistant?.name || 'AI Assistant'}',
      welcomeMessage: '${embedStyle.welcomeMessage || assistant?.welcomeMessage || ''}',
      showChatHeader: ${embedStyle.showChatHeader},
      showAssistantAvatar: ${embedStyle.showAssistantAvatar},
      assistantAvatarIcon: '${embedStyle.assistantAvatarIcon}'
    };

    // Load the widget script
    const script = document.createElement('script');
    script.src = config.apiUrl + '/widget.js';
    script.async = true;
    script.onload = function() {
      if (window.ExecutaChat) {
        window.ExecutaChat.init(config);
      }
    };
    document.head.appendChild(script);

    // Load custom fonts if specified
    ${embedStyle.googleFont && embedStyle.googleFont !== 'inter' ? `
    const fontMap = {
      'roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
      'open-sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap',
      'poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
      'lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
      'montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap',
      'nunito': 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap',
      'source-sans': 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap'
    };
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontMap['${embedStyle.googleFont}'];
    document.head.appendChild(link);` : ''}
  })();
</script>`;
};

export const generateRawEmbedCode = (assistant: any) => {
  const assistantId = assistant?.id || 'your-assistant-id';
  
  return `<!-- Executa AI Chat Widget (Raw) -->
<div id="executa-chat-widget"></div>
<script>
  (function() {
    const config = {
      assistantId: '${assistantId}',
      apiUrl: '${process.env.NODE_ENV === 'production' ? 'https://app.executa.ai' : 'http://localhost:3000'}'
    };

    const script = document.createElement('script');
    script.src = config.apiUrl + '/widget.js';
    script.async = true;
    script.onload = function() {
      if (window.ExecutaChat) {
        window.ExecutaChat.init(config);
      }
    };
    document.head.appendChild(script);
  })();
</script>`;
}; 