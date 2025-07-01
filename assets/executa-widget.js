// Executa AI WordPress Plugin - Enhanced with Live Styling
console.log('EXECUTA AI: Enhanced WordPress plugin loading...');

(function() {
    var initialized = false;
    var maxRetries = 20;
    var retryCount = 0;
    var styleUpdateInterval = null;
    
    function init() {
        console.log('EXECUTA AI: Init attempt', retryCount + 1);
        
        if (initialized) {
            console.log('EXECUTA AI: Already initialized');
            return;
        }
        
        if (document.readyState === 'loading') {
            console.log('EXECUTA AI: DOM still loading, waiting...');
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        var container = document.getElementById('executa-ai-chat-widget');
        if (!container) {
            console.log('EXECUTA AI: Container not found');
            if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(init, 500);
            }
            return;
        }
        
        var config = window.EXECUTA_AI_CONFIG;
        if (!config) {
            console.log('EXECUTA AI: Config not found');
            if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(init, 500);
            }
            return;
        }
        
        if (!config.enabled) {
            console.log('EXECUTA AI: Widget disabled in settings');
            return;
        }
        
        console.log('EXECUTA AI: Creating enhanced widget with live styling');
        createEnhancedWidget(container, config);
        initialized = true;
        
        // Set up live style updates (check every 30 seconds)
        if (config.fetchLiveSettings) {
            setupLiveStyleUpdates(config.assistantId);
        }
    }
    
    function createEnhancedWidget(container, config) {
        console.log('EXECUTA AI: Building enhanced widget with config:', config);
        
        // Clear any existing content
        container.innerHTML = '<div style="position: fixed; bottom: 20px; right: 20px; background: #3B82F6; color: white; padding: 10px; border-radius: 5px; z-index: 99999; font-family: Arial; font-size: 12px;">EXECUTA AI Loading...</div>';
        
        // Fetch live settings
        console.log('EXECUTA AI: Fetching live embed styles...');
        fetchLiveSettings(config.assistantId)
            .then(function(liveStyles) {
                console.log('EXECUTA AI: Got live styles:', liveStyles);
                var mergedConfig = mergeConfigs(config, liveStyles);
                buildEnhancedWidget(container, mergedConfig);
            })
            .catch(function(error) {
                console.log('EXECUTA AI: Failed to fetch live styles, using defaults:', error);
                // Show user-friendly message if this is a connection issue
                if (error.message && error.message.includes('Failed to fetch')) {
                    console.log('EXECUTA AI: Connection issue - check API URL in WordPress admin');
                }
                // Fallback to default config with all properties
                var defaultConfig = {
                    bubbleColor: '#3B82F6',
                    buttonShape: 'rounded',
                    position: 'bottom-right',
                    chatBackgroundColor: '#FFFFFF',
                    userMessageBubbleColor: '#3B82F6',
                    assistantMessageBubbleColor: '#F3F4F6',
                    assistantFontStyle: 'sans',
                    messageBubbleRadius: 12,
                    showAssistantAvatar: true,
                    assistantAvatarUrl: null,
                    showChatHeader: true,
                    chatHeaderTitle: 'AI Assistant',
                    welcomeMessage: 'Hello! How can I help you today?'
                };
                var mergedConfig = mergeConfigs(config, defaultConfig);
                buildEnhancedWidget(container, mergedConfig);
            });
    }
    
    function fetchLiveSettings(assistantId) {
        var apiUrl = window.EXECUTA_AI_CONFIG.apiUrl || 'https://app.executa.ai';
        return fetch(apiUrl + '/api/models/' + assistantId + '/embed-styles')
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Failed to fetch settings: ' + response.status);
                }
                return response.json();
            });
    }
    
    function mergeConfigs(baseConfig, liveStyles) {
        var merged = {};
        
        // Copy base config
        for (var key in baseConfig) {
            merged[key] = baseConfig[key];
        }
        
        // Override with live styles if available
        if (liveStyles) {
            merged.bubbleColor = liveStyles.bubbleColor || baseConfig.bubbleColor || '#3B82F6';
            merged.buttonShape = liveStyles.buttonShape || baseConfig.buttonShape || 'rounded';
            merged.position = liveStyles.position || baseConfig.position || 'bottom-right';
            merged.chatBackgroundColor = liveStyles.chatBackgroundColor || baseConfig.chatBackgroundColor || '#FFFFFF';
            merged.userMessageBubbleColor = liveStyles.userBubbleColor || baseConfig.userMessageBubbleColor || '#3B82F6';
            merged.assistantMessageBubbleColor = liveStyles.assistantBubbleColor || baseConfig.assistantMessageBubbleColor || '#F3F4F6';
            merged.assistantFontStyle = liveStyles.assistantFontStyle || baseConfig.assistantFontStyle || 'sans';
            merged.messageBubbleRadius = liveStyles.messageBubbleRadius || baseConfig.messageBubbleRadius || 12;
            merged.showAssistantAvatar = liveStyles.showAssistantAvatar !== undefined ? liveStyles.showAssistantAvatar : (baseConfig.showAssistantAvatar !== false);
            merged.assistantAvatarUrl = liveStyles.assistantAvatarUrl || baseConfig.assistantAvatarUrl;
            merged.showChatHeader = liveStyles.showChatHeader !== undefined ? liveStyles.showChatHeader : (baseConfig.showChatHeader !== false);
            merged.chatHeaderTitle = liveStyles.chatTitle || baseConfig.chatHeaderTitle || 'AI Assistant';
            merged.welcomeMessage = liveStyles.welcomeMessage || baseConfig.welcomeMessage || 'Hello! How can I help you today?';
        }
        
        return merged;
    }
    
    function getPositionStyles(position) {
        switch (position) {
            case 'bottom-left':
                return {
                    bubble: 'bottom: 20px !important; left: 20px !important; right: auto !important;',
                    chat: 'bottom: 90px !important; left: 20px !important; right: auto !important;'
                };
            case 'bottom-right':
            default:
                return {
                    bubble: 'bottom: 20px !important; right: 20px !important; left: auto !important;',
                    chat: 'bottom: 90px !important; right: 20px !important; left: auto !important;'
                };
        }
    }
    
    function getShapeStyles(shape) {
        switch (shape) {
            case 'square':
                return 'border-radius: 8px !important;';
            case 'pill':
                return 'border-radius: 30px !important;';
            case 'rounded':
            default:
                return 'border-radius: 50% !important;';
        }
    }
    
    function getFontFamily(fontStyle) {
        switch (fontStyle) {
            case 'serif':
                return 'Georgia, "Times New Roman", serif !important;';
            case 'monospace':
                return '"Courier New", Courier, monospace !important;';
            case 'sans':
            default:
                return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;';
        }
    }
    
    function buildEnhancedWidget(container, config) {
        console.log('EXECUTA AI: Building enhanced widget with full styling:', config);
        
        // Extract all styling properties
        var bubbleColor = config.bubbleColor || '#3B82F6';
        var buttonShape = config.buttonShape || 'rounded';
        var position = config.position || 'bottom-right';
        var chatBackgroundColor = config.chatBackgroundColor || '#FFFFFF';
        var userMessageBubbleColor = config.userMessageBubbleColor || '#3B82F6';
        var assistantMessageBubbleColor = config.assistantMessageBubbleColor || '#F3F4F6';
        var assistantFontStyle = config.assistantFontStyle || 'sans';
        var messageBubbleRadius = config.messageBubbleRadius || 12;
        var showAssistantAvatar = config.showAssistantAvatar !== false;
        var assistantAvatarUrl = config.assistantAvatarUrl;
        var showChatHeader = config.showChatHeader !== false;
        var chatHeaderTitle = config.chatHeaderTitle || 'AI Assistant';
        var welcomeMessage = config.welcomeMessage || 'Hello! How can I help you today?';
        
        // Get computed styles
        var positionStyles = getPositionStyles(position);
        var shapeStyles = getShapeStyles(buttonShape);
        var fontFamily = getFontFamily(assistantFontStyle);
        
        // Clear container
        container.innerHTML = '';
        
        // Create chat bubble with enhanced styling
        var bubble = document.createElement('div');
        bubble.id = 'executa-chat-bubble';
        // Use Font Awesome icon with fallback - SECURE VERSION
        var icon = document.createElement('i');
        icon.className = 'fas fa-comments';
        icon.style.fontSize = '24px';
        bubble.appendChild(icon);
        
        // Fallback for when Font Awesome doesn't load
        setTimeout(function() {
            if (icon.offsetWidth === 0) {
                bubble.removeChild(icon);
                var emoji = document.createTextNode('💬');
                bubble.appendChild(emoji);
            }
        }, 100);
        bubble.style.cssText = 'position: fixed !important; ' + 
            positionStyles.bubble + 
            ' width: 60px !important; height: 60px !important; background: ' + bubbleColor + ' !important; color: white !important; ' + 
            shapeStyles + 
            ' display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; font-size: 24px !important; z-index: 99999 !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important; font-family: Arial, sans-serif !important; transition: all 0.3s ease !important;';
        
        // Enhanced hover effect
        bubble.addEventListener('mouseenter', function() {
            bubble.style.transform = 'scale(1.05) !important';
        });
        bubble.addEventListener('mouseleave', function() {
            bubble.style.transform = 'scale(1) !important';
        });
        
        // Create enhanced chat interface
        var chatBox = document.createElement('div');
        chatBox.id = 'executa-chat-interface';
        chatBox.style.cssText = 'position: fixed !important; ' + 
            positionStyles.chat + 
            ' width: 350px !important; height: 450px !important; background: ' + chatBackgroundColor + ' !important; border-radius: 12px !important; box-shadow: 0 8px 30px rgba(0,0,0,0.3) !important; z-index: 99998 !important; display: none !important; flex-direction: column !important; ' + fontFamily;
        
        // Enhanced header with conditional display - SECURE VERSION
        var header = null;
        if (showChatHeader) {
            header = document.createElement('div');
            header.style.cssText = 'background: linear-gradient(135deg, ' + bubbleColor + ' 0%, ' + userMessageBubbleColor + ' 100%) !important; color: white !important; padding: 16px !important; border-radius: 12px 12px 0 0 !important; font-weight: 600 !important; display: flex !important; justify-content: space-between !important; align-items: center !important; font-size: 16px !important;';
            
            // Securely create header content
            var titleSpan = document.createElement('span');
            titleSpan.textContent = chatHeaderTitle; // Safe text assignment
            header.appendChild(titleSpan);
            
            var closeSpan = document.createElement('span');
            closeSpan.id = 'close-chat';
            closeSpan.textContent = '×';
            closeSpan.style.cssText = 'cursor: pointer; font-size: 20px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,0.2); transition: background 0.2s ease;';
            header.appendChild(closeSpan);
        }
        
        // Enhanced messages area
        var messages = document.createElement('div');
        messages.id = 'chat-messages';
        messages.style.cssText = 'flex: 1 !important; padding: 16px !important; overflow-y: auto !important; background: ' + chatBackgroundColor + ' !important;';
        
        // Welcome message with avatar support
        if (welcomeMessage) {
            var welcomeDiv = document.createElement('div');
            welcomeDiv.style.cssText = 'display: flex !important; align-items: flex-start !important; margin-bottom: 16px !important; gap: 8px !important;';
            
            // Avatar if enabled - SECURE VERSION
            if (showAssistantAvatar) {
                var avatar = document.createElement('div');
                avatar.style.cssText = 'width: 32px !important; height: 32px !important; border-radius: 50% !important; background: ' + bubbleColor + ' !important; display: flex !important; align-items: center !important; justify-content: center !important; color: white !important; font-size: 16px !important; flex-shrink: 0 !important;';
                
                if (assistantAvatarUrl && /^https?:\/\//.test(assistantAvatarUrl)) {
                    // Validate URL and create image securely
                    var img = document.createElement('img');
                    img.src = assistantAvatarUrl;
                    img.alt = 'Assistant';
                    img.style.cssText = 'width: 100%; height: 100%; border-radius: 50%; object-fit: cover;';
                    img.onerror = function() { 
                        avatar.removeChild(img);
                        var emoji = document.createTextNode('🤖');
                        avatar.appendChild(emoji);
                    };
                    avatar.appendChild(img);
                } else {
                    var robotIcon = document.createElement('i');
                    robotIcon.className = 'fas fa-robot';
                    robotIcon.style.fontSize = '16px';
                    avatar.appendChild(robotIcon);
                    
                    // Fallback for when Font Awesome doesn't load
                    setTimeout(function() {
                        if (robotIcon.offsetWidth === 0) {
                            avatar.removeChild(robotIcon);
                            var emoji = document.createTextNode('🤖');
                            avatar.appendChild(emoji);
                        }
                    }, 100);
                }
                welcomeDiv.appendChild(avatar);
            }
            
            var welcomeText = document.createElement('div');
            welcomeText.style.cssText = 'background: ' + assistantMessageBubbleColor + ' !important; padding: 12px !important; border-radius: ' + messageBubbleRadius + 'px !important; color: #333 !important; font-size: 14px !important; line-height: 1.4 !important; max-width: 80% !important;';
            welcomeText.textContent = welcomeMessage;
            welcomeDiv.appendChild(welcomeText);
            
            messages.appendChild(welcomeDiv);
        }
        
        // Enhanced input area
        var inputArea = document.createElement('div');
        inputArea.style.cssText = 'padding: 16px !important; border-top: 1px solid #e5e7eb !important; display: flex !important; gap: 8px !important; background: ' + chatBackgroundColor + ' !important; border-radius: 0 0 12px 12px !important;';
        
        var input = document.createElement('input');
        input.id = 'chat-input';
        input.type = 'text';
        input.placeholder = 'Type your message...';
        input.style.cssText = 'flex: 1 !important; padding: 12px !important; border: 2px solid #e5e7eb !important; border-radius: 24px !important; outline: none !important; font-size: 14px !important; ' + fontFamily + ' transition: border-color 0.2s ease !important;';
        
        // Enhanced input focus
        input.addEventListener('focus', function() {
            input.style.borderColor = bubbleColor + ' !important';
        });
        input.addEventListener('blur', function() {
            input.style.borderColor = '#e5e7eb !important';
        });
        
        var sendBtn = document.createElement('button');
        sendBtn.id = 'chat-send';
        
        // Securely create send button icon
        var sendIcon = document.createElement('i');
        sendIcon.className = 'fas fa-paper-plane';
        sendIcon.style.fontSize = '16px';
        sendBtn.appendChild(sendIcon);
        
        // Fallback for when Font Awesome doesn't load
        setTimeout(function() {
            if (sendIcon.offsetWidth === 0) {
                sendBtn.removeChild(sendIcon);
                var arrow = document.createTextNode('→');
                sendBtn.appendChild(arrow);
            }
        }, 100);
        sendBtn.style.cssText = 'background: ' + userMessageBubbleColor + ' !important; color: white !important; border: none !important; width: 44px !important; height: 44px !important; border-radius: 50% !important; cursor: pointer !important; font-size: 18px !important; font-weight: bold !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.2s ease !important;';
        
        // Enhanced send button hover
        sendBtn.addEventListener('mouseenter', function() {
            sendBtn.style.opacity = '0.9 !important';
            sendBtn.style.transform = 'scale(1.05) !important';
        });
        sendBtn.addEventListener('mouseleave', function() {
            sendBtn.style.opacity = '1 !important';
            sendBtn.style.transform = 'scale(1) !important';
        });
        
        // Assemble everything
        inputArea.appendChild(input);
        inputArea.appendChild(sendBtn);
        
        if (header) {
            chatBox.appendChild(header);
        }
        chatBox.appendChild(messages);
        chatBox.appendChild(inputArea);
        
        container.appendChild(bubble);
        container.appendChild(chatBox);
        
        console.log('EXECUTA AI: Enhanced widget assembled with live styling');
        
        // Enhanced event listeners
        bubble.addEventListener('click', function() {
            console.log('EXECUTA AI: Bubble clicked');
            var isVisible = chatBox.style.display === 'flex';
            chatBox.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) {
                input.focus();
            }
        });
        
        if (header) {
            document.getElementById('close-chat').addEventListener('click', function() {
                console.log('EXECUTA AI: Close clicked');
                chatBox.style.display = 'none';
            });
        }
        
        sendBtn.addEventListener('click', function() {
            sendEnhancedMessage(input, messages, config);
        });
        
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendEnhancedMessage(input, messages, config);
            }
        });
        
        // Store current widget reference for live updates
        window.EXECUTA_CURRENT_WIDGET = {
            container: container,
            config: config
        };
        
        console.log('EXECUTA AI: Enhanced widget ready with live styling!');
    }
    
    function setupLiveStyleUpdates(assistantId) {
        console.log('EXECUTA AI: Setting up live style updates...');
        
        // Check for style updates every 30 seconds
        styleUpdateInterval = setInterval(function() {
            if (!window.EXECUTA_CURRENT_WIDGET) return;
            
            fetchLiveSettings(assistantId)
                .then(function(newStyles) {
                    var currentConfig = window.EXECUTA_CURRENT_WIDGET.config;
                    var newConfig = mergeConfigs(currentConfig, newStyles);
                    
                    // Check if styles have changed
                    var hasChanged = JSON.stringify(currentConfig) !== JSON.stringify(newConfig);
                    if (hasChanged) {
                        console.log('EXECUTA AI: Live styles updated, rebuilding widget...');
                        buildEnhancedWidget(window.EXECUTA_CURRENT_WIDGET.container, newConfig);
                    }
                })
                .catch(function(error) {
                    console.log('EXECUTA AI: Failed to check for style updates:', error);
                });
        }, 30000); // 30 seconds
    }
    
    function sendEnhancedMessage(input, messages, config) {
        var message = input.value.trim();
        if (!message) return;
        
        console.log('EXECUTA AI: Sending enhanced message:', message);
        
        // Extract styling for messages
        var userBubbleColor = config.userMessageBubbleColor || '#3B82F6';
        var assistantBubbleColor = config.assistantMessageBubbleColor || '#F3F4F6';
        var messageBubbleRadius = config.messageBubbleRadius || 12;
        var showAssistantAvatar = config.showAssistantAvatar !== false;
        var bubbleColor = config.bubbleColor || '#3B82F6';
        var assistantAvatarUrl = config.assistantAvatarUrl;
        
        // Add enhanced user message
        var userMsgDiv = document.createElement('div');
        userMsgDiv.style.cssText = 'display: flex !important; justify-content: flex-end !important; margin-bottom: 16px !important;';
        
        var userMsg = document.createElement('div');
        userMsg.style.cssText = 'background: ' + userBubbleColor + ' !important; color: white !important; padding: 12px 16px !important; border-radius: ' + messageBubbleRadius + 'px !important; max-width: 70% !important; font-size: 14px !important; line-height: 1.4 !important; word-wrap: break-word !important;';
        userMsg.textContent = message;
        userMsgDiv.appendChild(userMsg);
        messages.appendChild(userMsgDiv);
        
        input.value = '';
        messages.scrollTop = messages.scrollHeight;
        
        // Add enhanced typing indicator
        var typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.style.cssText = 'display: flex !important; align-items: flex-start !important; margin-bottom: 16px !important; gap: 8px !important;';
        
        // Avatar for typing indicator - SECURE VERSION
        if (showAssistantAvatar) {
            var typingAvatar = document.createElement('div');
            typingAvatar.style.cssText = 'width: 32px !important; height: 32px !important; border-radius: 50% !important; background: ' + bubbleColor + ' !important; display: flex !important; align-items: center !important; justify-content: center !important; color: white !important; font-size: 16px !important; flex-shrink: 0 !important;';
            
            if (assistantAvatarUrl && /^https?:\/\//.test(assistantAvatarUrl)) {
                // Securely create image
                var img = document.createElement('img');
                img.src = assistantAvatarUrl;
                img.alt = 'Assistant';
                img.style.cssText = 'width: 100%; height: 100%; border-radius: 50%; object-fit: cover;';
                img.onerror = function() {
                    typingAvatar.removeChild(img);
                    var emoji = document.createTextNode('🤖');
                    typingAvatar.appendChild(emoji);
                };
                typingAvatar.appendChild(img);
            } else {
                var robotIcon = document.createElement('i');
                robotIcon.className = 'fas fa-robot';
                robotIcon.style.fontSize = '16px';
                typingAvatar.appendChild(robotIcon);
                
                setTimeout(function() {
                    if (robotIcon.offsetWidth === 0) {
                        typingAvatar.removeChild(robotIcon);
                        var emoji = document.createTextNode('🤖');
                        typingAvatar.appendChild(emoji);
                    }
                }, 100);
            }
            typingDiv.appendChild(typingAvatar);
        }
        
        var typingText = document.createElement('div');
        typingText.style.cssText = 'background: ' + assistantBubbleColor + ' !important; color: #666 !important; padding: 12px 16px !important; border-radius: ' + messageBubbleRadius + 'px !important; font-size: 14px !important; font-style: italic !important; max-width: 70% !important;';
        
        // Securely create typing dots animation
        var dot1 = document.createElement('span');
        dot1.textContent = '●';
        dot1.style.cssText = 'animation: pulse 1.5s infinite;';
        
        var dot2 = document.createElement('span');
        dot2.textContent = '●';
        dot2.style.cssText = 'animation: pulse 1.5s infinite 0.2s;';
        
        var dot3 = document.createElement('span');
        dot3.textContent = '●';
        dot3.style.cssText = 'animation: pulse 1.5s infinite 0.4s;';
        
        typingText.appendChild(dot1);
        typingText.appendChild(document.createTextNode(' '));
        typingText.appendChild(dot2);
        typingText.appendChild(document.createTextNode(' '));
        typingText.appendChild(dot3);
        
        typingDiv.appendChild(typingText);
        
        messages.appendChild(typingDiv);
        messages.scrollTop = messages.scrollHeight;
        
        // Enhanced API call
        var apiUrl = config.apiUrl || 'https://app.executa.ai';
        fetch(apiUrl + '/api/chat/' + config.assistantId, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        })
        .then(function(response) {
            console.log('EXECUTA AI: Enhanced API response status:', response.status);
            return response.json();
        })
        .then(function(data) {
            console.log('EXECUTA AI: Enhanced API response data:', data);
            
            // Remove typing indicator
            var typingEl = document.getElementById('typing-indicator');
            if (typingEl) {
                typingEl.remove();
            }
            
            // Add enhanced AI response
            var aiMsgDiv = document.createElement('div');
            aiMsgDiv.style.cssText = 'display: flex !important; align-items: flex-start !important; margin-bottom: 16px !important; gap: 8px !important;';
            
            // Avatar for AI response - SECURE VERSION
            if (showAssistantAvatar) {
                var aiAvatar = document.createElement('div');
                aiAvatar.style.cssText = 'width: 32px !important; height: 32px !important; border-radius: 50% !important; background: ' + bubbleColor + ' !important; display: flex !important; align-items: center !important; justify-content: center !important; color: white !important; font-size: 16px !important; flex-shrink: 0 !important;';
                
                if (assistantAvatarUrl && /^https?:\/\//.test(assistantAvatarUrl)) {
                    // Securely create image
                    var img = document.createElement('img');
                    img.src = assistantAvatarUrl;
                    img.alt = 'Assistant';
                    img.style.cssText = 'width: 100%; height: 100%; border-radius: 50%; object-fit: cover;';
                    img.onerror = function() {
                        aiAvatar.removeChild(img);
                        var emoji = document.createTextNode('🤖');
                        aiAvatar.appendChild(emoji);
                    };
                    aiAvatar.appendChild(img);
                } else {
                    var robotIcon = document.createElement('i');
                    robotIcon.className = 'fas fa-robot';
                    robotIcon.style.fontSize = '16px';
                    aiAvatar.appendChild(robotIcon);
                    
                    setTimeout(function() {
                        if (robotIcon.offsetWidth === 0) {
                            aiAvatar.removeChild(robotIcon);
                            var emoji = document.createTextNode('🤖');
                            aiAvatar.appendChild(emoji);
                        }
                    }, 100);
                }
                aiMsgDiv.appendChild(aiAvatar);
            }
            
            var aiMsg = document.createElement('div');
            aiMsg.style.cssText = 'background: ' + assistantBubbleColor + ' !important; padding: 12px 16px !important; border-radius: ' + messageBubbleRadius + 'px !important; color: #333 !important; font-size: 14px !important; line-height: 1.4 !important; max-width: 70% !important; word-wrap: break-word !important;';
            aiMsg.textContent = data.response || 'Sorry, I encountered an error.';
            aiMsgDiv.appendChild(aiMsg);
            
            messages.appendChild(aiMsgDiv);
            messages.scrollTop = messages.scrollHeight;
        })
        .catch(function(error) {
            console.error('EXECUTA AI: Enhanced API error:', error);
            
            // Show specific error messages for different connection issues
            if (error.message && error.message.includes('Failed to fetch')) {
                console.error('EXECUTA AI: Cannot connect to API. Check API URL in WordPress admin settings.');
            }
            
            // Remove typing indicator
            var typingEl = document.getElementById('typing-indicator');
            if (typingEl) {
                typingEl.remove();
            }
            
            // Add enhanced error message
            var errorMsgDiv = document.createElement('div');
            errorMsgDiv.style.cssText = 'display: flex !important; align-items: flex-start !important; margin-bottom: 16px !important; gap: 8px !important;';
            
            if (showAssistantAvatar) {
                var errorAvatar = document.createElement('div');
                errorAvatar.style.cssText = 'width: 32px !important; height: 32px !important; border-radius: 50% !important; background: ' + bubbleColor + ' !important; display: flex !important; align-items: center !important; justify-content: center !important; color: white !important; font-size: 16px !important; flex-shrink: 0 !important;';
                
                if (assistantAvatarUrl && /^https?:\/\//.test(assistantAvatarUrl)) {
                    // Securely create image
                    var img = document.createElement('img');
                    img.src = assistantAvatarUrl;
                    img.alt = 'Assistant';
                    img.style.cssText = 'width: 100%; height: 100%; border-radius: 50%; object-fit: cover;';
                    img.onerror = function() {
                        errorAvatar.removeChild(img);
                        var emoji = document.createTextNode('🤖');
                        errorAvatar.appendChild(emoji);
                    };
                    errorAvatar.appendChild(img);
                } else {
                    var robotIcon = document.createElement('i');
                    robotIcon.className = 'fas fa-robot';
                    robotIcon.style.fontSize = '16px';
                    errorAvatar.appendChild(robotIcon);
                    
                    setTimeout(function() {
                        if (robotIcon.offsetWidth === 0) {
                            errorAvatar.removeChild(robotIcon);
                            var emoji = document.createTextNode('🤖');
                            errorAvatar.appendChild(emoji);
                        }
                    }, 100);
                }
                errorMsgDiv.appendChild(errorAvatar);
            }
            
            var errorMsg = document.createElement('div');
            errorMsg.style.cssText = 'background: ' + assistantBubbleColor + ' !important; padding: 12px 16px !important; border-radius: ' + messageBubbleRadius + 'px !important; color: #333 !important; font-size: 14px !important; line-height: 1.4 !important; max-width: 70% !important;';
            
            // Provide helpful error message based on error type
            if (error.message && error.message.includes('Failed to fetch')) {
                errorMsg.textContent = 'Connection error. Please check the API URL in WordPress admin settings.';
            } else {
                errorMsg.textContent = 'Sorry, I am having trouble connecting right now. Please try again.';
            }
            
            errorMsgDiv.appendChild(errorMsg);
            
            messages.appendChild(errorMsgDiv);
            messages.scrollTop = messages.scrollHeight;
        });
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        if (styleUpdateInterval) {
            clearInterval(styleUpdateInterval);
        }
    });
    
    // Start enhanced initialization
    init();
    
})();

console.log('EXECUTA AI: Enhanced WordPress plugin with live styling loaded');