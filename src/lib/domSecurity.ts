/**
 * Secure DOM Manipulation Utility
 * Prevents XSS vulnerabilities by providing safe alternatives to innerHTML
 */

// HTML entity encoder
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Safe URL validator
export function isSafeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Only allow http, https, and data URLs for images
    const allowedProtocols = ['http:', 'https:', 'data:'];
    return allowedProtocols.includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

// Safe image URL validator specifically for avatars
export function isSafeImageUrl(url: string): boolean {
  if (!isSafeUrl(url)) return false;
  
  try {
    const parsedUrl = new URL(url);
    // Additional checks for image URLs
    if (parsedUrl.protocol === 'data:') {
      // Ensure data URL is for images only
      return parsedUrl.href.startsWith('data:image/');
    }
    return true;
  } catch {
    return false;
  }
}

// Create safe text content (alternative to innerHTML for text)
export function setSafeTextContent(element: HTMLElement, text: string): void {
  element.textContent = text;
}

// Create safe HTML structure without user-controlled content
export function createSafeElement(tagName: string, attributes: Record<string, string> = {}): HTMLElement {
  const element = document.createElement(tagName);
  
  // Safely set attributes (avoid dangerous ones)
  const dangerousAttributes = ['onclick', 'onload', 'onerror', 'href', 'src'];
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (!dangerousAttributes.includes(key.toLowerCase())) {
      element.setAttribute(key, value);
    }
  });
  
  return element;
}

// Safe image creation with validation
export function createSafeImage(src: string, alt: string = '', styles?: string): HTMLImageElement | null {
  if (!isSafeImageUrl(src)) {
    console.warn('🚫 Unsafe image URL blocked:', src);
    return null;
  }
  
  const img = document.createElement('img');
  img.src = src;
  img.alt = escapeHtml(alt);
  
  if (styles) {
    img.style.cssText = styles;
  }
  
  // Add error handler to prevent broken images from causing issues
  img.onerror = function() {
    console.warn('🚫 Image failed to load:', src);
    img.style.display = 'none';
  };
  
  return img;
}

// Safe Font Awesome icon creation
export function createSafeFontAwesomeIcon(iconClass: string, styles?: string): HTMLElement {
  const icon = document.createElement('i');
  
  // Validate that it's actually a Font Awesome class
  const validFAPattern = /^fa[s|r|l|b]?\s+fa-[a-z0-9-]+$/;
  if (validFAPattern.test(iconClass)) {
    icon.className = iconClass;
  } else {
    console.warn('🚫 Invalid Font Awesome class blocked:', iconClass);
    icon.className = 'fas fa-question'; // Safe fallback
  }
  
  if (styles) {
    icon.style.cssText = styles;
  }
  
  return icon;
}

// Safe span creation with text content
export function createSafeSpan(text: string, styles?: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.textContent = text; // Safe text assignment
  
  if (styles) {
    span.style.cssText = styles;
  }
  
  return span;
}

// Create safe button with text content
export function createSafeButton(text: string, id?: string, styles?: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  
  if (id) {
    button.id = id;
  }
  
  if (styles) {
    button.style.cssText = styles;
  }
  
  return button;
}

// Widget-specific safe element creators
export const WidgetSecurity = {
  // Safe chat header creation
  createChatHeader(title: string, bubbleColor: string, userMessageBubbleColor: string): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = `background: linear-gradient(135deg, ${bubbleColor} 0%, ${userMessageBubbleColor} 100%) !important; color: white !important; padding: 16px !important; border-radius: 12px 12px 0 0 !important; font-weight: 600 !important; display: flex !important; justify-content: space-between !important; align-items: center !important; font-size: 16px !important;`;
    
    // Safely add title text
    const titleSpan = createSafeSpan(title);
    header.appendChild(titleSpan);
    
    // Safely add close button
    const closeBtn = createSafeSpan('×', 'cursor: pointer; font-size: 20px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,0.2); transition: background 0.2s ease;');
    closeBtn.id = 'close-chat';
    header.appendChild(closeBtn);
    
    return header;
  },

  // Safe avatar creation with fallback
  createAvatar(avatarUrl: string | null, bubbleColor: string): HTMLElement {
    const avatar = document.createElement('div');
    avatar.style.cssText = `width: 32px !important; height: 32px !important; border-radius: 50% !important; background: ${bubbleColor} !important; display: flex !important; align-items: center !important; justify-content: center !important; color: white !important; font-size: 16px !important; flex-shrink: 0 !important;`;
    
    if (avatarUrl && isSafeImageUrl(avatarUrl)) {
      const img = createSafeImage(avatarUrl, 'Assistant', 'width: 100%; height: 100%; border-radius: 50%; object-fit: cover;');
      if (img) {
        avatar.appendChild(img);
        return avatar;
      }
    }
    
    // Fallback to robot icon or emoji
    const icon = createSafeFontAwesomeIcon('fas fa-robot', 'font-size: 16px;');
    avatar.appendChild(icon);
    
    // Check if Font Awesome loaded, fallback to emoji
    setTimeout(() => {
      if (icon.offsetWidth === 0) {
        avatar.removeChild(icon);
        const emoji = createSafeSpan('🤖');
        avatar.appendChild(emoji);
      }
    }, 100);
    
    return avatar;
  },

  // Safe bubble creation
  createChatBubble(bubbleColor: string): HTMLElement {
    const bubble = document.createElement('div');
    bubble.id = 'executa-chat-bubble';
    
    // Create Font Awesome icon safely
    const icon = createSafeFontAwesomeIcon('fas fa-comments', 'font-size: 24px;');
    bubble.appendChild(icon);
    
    // Fallback if Font Awesome doesn't load
    setTimeout(() => {
      if (icon.offsetWidth === 0) {
        bubble.removeChild(icon);
        const emoji = createSafeSpan('Chat');
        bubble.appendChild(emoji);
      }
    }, 100);
    
    return bubble;
  },

  // Safe send button creation
  createSendButton(userMessageBubbleColor: string): HTMLButtonElement {
    const sendBtn = document.createElement('button');
    sendBtn.id = 'chat-send';
    sendBtn.style.cssText = `background: ${userMessageBubbleColor} !important; color: white !important; border: none !important; width: 44px !important; height: 44px !important; border-radius: 50% !important; cursor: pointer !important; font-size: 18px !important; font-weight: bold !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.2s ease !important;`;
    
    // Create Font Awesome icon safely
    const icon = createSafeFontAwesomeIcon('fas fa-paper-plane', 'font-size: 16px;');
    sendBtn.appendChild(icon);
    
    // Fallback if Font Awesome doesn't load
    setTimeout(() => {
      if (icon.offsetWidth === 0) {
        sendBtn.removeChild(icon);
        const arrow = createSafeSpan('→');
        sendBtn.appendChild(arrow);
      }
    }, 100);
    
    return sendBtn;
  }
}; 