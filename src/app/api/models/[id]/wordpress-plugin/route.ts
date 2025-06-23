import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assistantId = params.id;

    // Fetch assistant data
    const assistant = await prisma.assistant.findUnique({
      where: { id: assistantId },
      include: {
        account: true,
      },
    });

    if (!assistant) {
      return NextResponse.json(
        { error: 'Assistant not found' },
        { status: 404 }
      );
    }

    // Create plugin name and slug
    const pluginName = `${assistant.name} AI Assistant`;
    const pluginSlug = assistant.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-ai-assistant';

    // Create ZIP file
    const zip = new JSZip();

    // Add main plugin file
    zip.file(`${pluginSlug}.php`, generateMainPluginFile(assistant, pluginSlug, pluginName));

    // Add JavaScript file
    zip.file(`assets/executa-widget.js`, generateSimpleJavaScript(assistant));

    // Add CSS file
    zip.file(`assets/executa-widget.css`, generateSimpleCSS(assistant));

    // Add README file
    zip.file('readme.txt', generateReadmeFile(assistant, pluginName));

    // Generate ZIP
    const zipContent = await zip.generateAsync({ type: 'arraybuffer' });

    // Return ZIP file
    return new NextResponse(zipContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${pluginSlug}.zip"`,
      },
    });

  } catch (error) {
    console.error('Error generating WordPress plugin:', error);
    return NextResponse.json(
      { error: 'Failed to generate WordPress plugin' },
      { status: 500 }
    );
  }
}

function generateMainPluginFile(assistant: any, pluginSlug: string, pluginName: string): string {
  // Get the actual values with proper fallbacks
  const assistantId = assistant.id || '';
  const bubbleColor = assistant.embedBubbleColor || '#3B82F6';
  const assistantBubbleColor = assistant.embedAssistantBubbleColor || '#F3F4F6';
  const userBubbleColor = assistant.embedUserBubbleColor || '#3B82F6';
  const chatTitle = assistant.embedChatTitle || 'AI Assistant';
  const welcomeMessage = assistant.embedWelcomeMessage || 'Hello! How can I help you today?';
  const assistantName = assistant.name || 'AI Assistant';
  
  // Escape quotes for PHP strings
  const escapedChatTitle = chatTitle.replace(/'/g, "\\'").replace(/"/g, '\\"');
  const escapedWelcomeMessage = welcomeMessage.replace(/'/g, "\\'").replace(/"/g, '\\"');
  const escapedAssistantName = assistantName.replace(/'/g, "\\'").replace(/"/g, '\\"');

  return `<?php
/**
 * Plugin Name: ${pluginName}
 * Description: AI chat widget for your WordPress site. Powered by Executa.ai
 * Version: 1.0.0
 * Author: Executa.ai
 * Author URI: https://executa.ai
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class ExecutaAIWidget {
    
    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_footer', array($this, 'render_widget'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'settings_init'));
    }
    
    public function enqueue_scripts() {
        if (!get_option('executa_ai_enabled', true)) {
            return;
        }
        
        wp_enqueue_script(
            'executa-ai-widget',
            plugin_dir_url(__FILE__) . 'assets/executa-widget.js',
            array(),
            '1.0.0',
            true
        );
        
        wp_enqueue_style(
            'executa-ai-widget',
            plugin_dir_url(__FILE__) . 'assets/executa-widget.css',
            array(),
            '1.0.0'
        );
        
        // Pass configuration to JavaScript - now fetches live settings
        wp_localize_script('executa-ai-widget', 'EXECUTA_AI_CONFIG', array(
            'apiUrl' => 'https://app.executa.ai',
            'assistantId' => '${assistantId}',
            'enabled' => get_option('executa_ai_enabled', true),
            'fetchLiveSettings' => true // Enable live settings fetching
        ));
    }
    
    public function render_widget() {
        if (!get_option('executa_ai_enabled', true)) {
            return;
        }
        
        echo '<div id="executa-ai-chat-widget"></div>';
    }
    
    public function add_admin_menu() {
        add_options_page(
            '${escapedAssistantName} AI Settings',
            '${escapedAssistantName} AI',
            'manage_options',
            'executa-ai-settings',
            array($this, 'settings_page')
        );
    }
    
    public function settings_init() {
        register_setting('executa_ai_settings', 'executa_ai_enabled');
        
        add_settings_section(
            'executa_ai_section',
            'Widget Settings',
            null,
            'executa_ai_settings'
        );
        
        add_settings_field(
            'executa_ai_enabled',
            'Enable AI Widget',
            array($this, 'enabled_field_render'),
            'executa_ai_settings',
            'executa_ai_section'
        );
    }
    
    public function enabled_field_render() {
        $enabled = get_option('executa_ai_enabled', true);
        echo '<input type="checkbox" name="executa_ai_enabled" value="1" ' . checked(1, $enabled, false) . '>';
        echo '<p class="description">Check to enable the AI chat widget on your website.</p>';
    }
    
    public function settings_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html('${escapedAssistantName}'); ?> AI Settings</h1>
            <form action="options.php" method="post">
                <?php
                settings_fields('executa_ai_settings');
                do_settings_sections('executa_ai_settings');
                submit_button();
                ?>
            </form>
            
            <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 5px;">
                <h3>About This Widget</h3>
                <p>This AI assistant is powered by <strong>Executa.ai</strong> and provides 24/7 automated assistance to your website visitors.</p>
                <p><strong>Assistant Name:</strong> <?php echo esc_html('${escapedAssistantName}'); ?></p>
                <p><strong>Assistant ID:</strong> <?php echo esc_html('${assistantId}'); ?></p>
                <p>To view analytics and modify your AI assistant, visit your <a href="https://app.executa.ai/dashboard" target="_blank">Executa.ai Dashboard</a>.</p>
                
                <h4>Need Help?</h4>
                <ul>
                    <li>• Check that the widget is enabled above</li>
                    <li>• Clear your browser cache if you don't see changes</li>
                    <li>• Visit <a href="https://app.executa.ai" target="_blank">Executa.ai</a> for support</li>
                </ul>
            </div>
        </div>
        <?php
    }
}

// Initialize the plugin
new ExecutaAIWidget();
?>`;
}

function generateSimpleJavaScript(assistant: any): string {
  return `// Executa AI WordPress Plugin
console.log('EXECUTA AI: JavaScript loading...');

(function() {
    var initialized = false;
    var maxRetries = 20;
    var retryCount = 0;
    
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
        
        console.log('EXECUTA AI: Creating widget');
        createWidget(container, config);
        initialized = true;
    }
    
    function createWidget(container, config) {
        console.log('EXECUTA AI: Building widget with config:', config);
        
        // Test message first
        container.innerHTML = '<div style="position: fixed; bottom: 20px; right: 20px; background: red; color: white; padding: 10px; border-radius: 5px; z-index: 99999; font-family: Arial; font-size: 12px;">EXECUTA AI LOADING...</div>';
        
        // Fetch live settings if enabled
        if (config.fetchLiveSettings) {
            console.log('EXECUTA AI: Fetching live settings...');
            fetchLiveSettings(config.assistantId)
                .then(function(liveConfig) {
                    console.log('EXECUTA AI: Got live settings:', liveConfig);
                    // Merge live settings with base config
                    var mergedConfig = mergeConfigs(config, liveConfig);
                    buildWidget(container, mergedConfig);
                })
                .catch(function(error) {
                    console.log('EXECUTA AI: Failed to fetch live settings, using defaults:', error);
                    // Fallback to default config
                    var defaultConfig = {
                        bubbleColor: '#3B82F6',
                        assistantBubbleColor: '#F3F4F6',
                        userBubbleColor: '#3B82F6',
                        chatTitle: 'AI Assistant',
                        welcomeMessage: 'Hello! How can I help?'
                    };
                    var mergedConfig = mergeConfigs(config, defaultConfig);
                    buildWidget(container, mergedConfig);
                });
        } else {
            // Use hardcoded config (legacy mode)
            var defaultConfig = {
                bubbleColor: config.bubbleColor || '#3B82F6',
                assistantBubbleColor: config.assistantBubbleColor || '#F3F4F6',
                userBubbleColor: config.userBubbleColor || '#3B82F6',
                chatTitle: config.chatTitle || 'AI Assistant',
                welcomeMessage: config.welcomeMessage || 'Hello! How can I help?'
            };
            setTimeout(function() {
                buildWidget(container, mergeConfigs(config, defaultConfig));
            }, 2000);
        }
    }
    
    function fetchLiveSettings(assistantId) {
        return fetch(window.EXECUTA_AI_CONFIG.apiUrl + '/api/models/' + assistantId + '/embed-styles')
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Failed to fetch settings');
                }
                return response.json();
            });
    }
    
    function mergeConfigs(baseConfig, liveConfig) {
        var merged = {};
        
        // Copy base config
        for (var key in baseConfig) {
            merged[key] = baseConfig[key];
        }
        
        // Override with live config
        if (liveConfig) {
            merged.bubbleColor = liveConfig.bubbleColor || baseConfig.bubbleColor;
            merged.assistantBubbleColor = liveConfig.assistantBubbleColor || baseConfig.assistantBubbleColor;
            merged.userBubbleColor = liveConfig.userBubbleColor || baseConfig.userBubbleColor;
            merged.chatTitle = liveConfig.chatTitle || baseConfig.chatTitle;
            merged.welcomeMessage = liveConfig.welcomeMessage || baseConfig.welcomeMessage;
            merged.position = liveConfig.position || 'bottom-right';
            merged.buttonShape = liveConfig.buttonShape || 'rounded';
        }
        
        return merged;
    }
    
    function getPositionStyles(position) {
        switch (position) {
            case 'bottom-left':
                return {
                    bubble: 'bottom: 20px !important; left: 20px !important;',
                    chat: 'bottom: 90px !important; left: 20px !important;'
                };
            case 'bottom-right':
            default:
                return {
                    bubble: 'bottom: 20px !important; right: 20px !important;',
                    chat: 'bottom: 90px !important; right: 20px !important;'
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
    
    function buildWidget(container, config) {
        console.log('EXECUTA AI: Building main widget with live config:', config);
        
        var bubbleColor = config.bubbleColor || '#3B82F6';
        var assistantBubbleColor = config.assistantBubbleColor || '#F3F4F6';
        var userBubbleColor = config.userBubbleColor || '#3B82F6';
        var chatTitle = config.chatTitle || 'AI Assistant';
        var welcomeMessage = config.welcomeMessage || 'Hello! How can I help?';
        var position = config.position || 'bottom-right';
        var buttonShape = config.buttonShape || 'rounded';
        
        // Determine position styles
        var positionStyles = getPositionStyles(position);
        var shapeStyles = getShapeStyles(buttonShape);
        
        container.innerHTML = '';
        
        // Create bubble
        var bubble = document.createElement('div');
        bubble.id = 'executa-chat-bubble';
        bubble.innerHTML = '💬';
        bubble.style.cssText = 'position: fixed !important; ' + positionStyles.bubble + ' width: 60px !important; height: 60px !important; background: ' + bubbleColor + ' !important; color: white !important; ' + shapeStyles + ' display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; font-size: 24px !important; z-index: 99999 !important; box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important; font-family: Arial, sans-serif !important;';
        
        // Create chat interface
        var chatBox = document.createElement('div');
        chatBox.id = 'executa-chat-interface';
        chatBox.style.cssText = 'position: fixed !important; ' + positionStyles.chat + ' width: 350px !important; height: 400px !important; background: white !important; border-radius: 10px !important; box-shadow: 0 8px 30px rgba(0,0,0,0.3) !important; z-index: 99998 !important; display: none !important; flex-direction: column !important; font-family: Arial, sans-serif !important;';
        
        // Header
        var header = document.createElement('div');
        header.style.cssText = 'background: ' + bubbleColor + ' !important; color: white !important; padding: 15px !important; border-radius: 10px 10px 0 0 !important; font-weight: bold !important; display: flex !important; justify-content: space-between !important; align-items: center !important; font-size: 16px !important;';
        header.innerHTML = chatTitle + '<span id="close-chat" style="cursor: pointer; font-size: 24px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,0.2);">×</span>';
        
        // Messages area
        var messages = document.createElement('div');
        messages.id = 'chat-messages';
        messages.style.cssText = 'flex: 1 !important; padding: 15px !important; overflow-y: auto !important; background: #f9f9f9 !important;';
        
        // Welcome message
        if (welcomeMessage) {
            var welcome = document.createElement('div');
            welcome.style.cssText = 'background: ' + assistantBubbleColor + ' !important; padding: 12px !important; border-radius: 15px !important; margin-bottom: 12px !important; font-size: 14px !important; color: #333 !important; margin-right: 60px !important; line-height: 1.4 !important;';
            welcome.textContent = welcomeMessage;
            messages.appendChild(welcome);
        }
        
        // Input area
        var inputArea = document.createElement('div');
        inputArea.style.cssText = 'padding: 15px !important; border-top: 1px solid #eee !important; display: flex !important; gap: 10px !important; background: white !important; border-radius: 0 0 10px 10px !important;';
        
        var input = document.createElement('input');
        input.id = 'chat-input';
        input.type = 'text';
        input.placeholder = 'Type your message...';
        input.style.cssText = 'flex: 1 !important; padding: 12px !important; border: 1px solid #ddd !important; border-radius: 20px !important; outline: none !important; font-size: 14px !important; font-family: Arial, sans-serif !important;';
        
        var sendBtn = document.createElement('button');
        sendBtn.id = 'chat-send';
        sendBtn.textContent = 'Send';
        sendBtn.style.cssText = 'background: ' + bubbleColor + ' !important; color: white !important; border: none !important; padding: 12px 18px !important; border-radius: 20px !important; cursor: pointer !important; font-size: 14px !important; font-family: Arial, sans-serif !important;';
        
        // Assemble everything
        inputArea.appendChild(input);
        inputArea.appendChild(sendBtn);
        chatBox.appendChild(header);
        chatBox.appendChild(messages);
        chatBox.appendChild(inputArea);
        container.appendChild(bubble);
        container.appendChild(chatBox);
        
        console.log('EXECUTA AI: Widget assembled');
        
        // Add event listeners
        bubble.addEventListener('click', function() {
            console.log('EXECUTA AI: Bubble clicked');
            var isVisible = chatBox.style.display === 'flex';
            chatBox.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) {
                input.focus();
            }
        });
        
        document.getElementById('close-chat').addEventListener('click', function() {
            console.log('EXECUTA AI: Close clicked');
            chatBox.style.display = 'none';
        });
        
        sendBtn.addEventListener('click', function() {
            sendMessage(input, messages, config);
        });
        
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage(input, messages, config);
            }
        });
        
        console.log('EXECUTA AI: Widget ready!');
    }
    
    function sendMessage(input, messages, config) {
        var message = input.value.trim();
        if (!message) return;
        
        console.log('EXECUTA AI: Sending message:', message);
        
        // Add user message
        var userMsg = document.createElement('div');
        userMsg.style.cssText = 'background: ' + (config.userBubbleColor || '#3B82F6') + ' !important; color: white !important; padding: 12px !important; border-radius: 15px !important; margin-bottom: 12px !important; text-align: right !important; margin-left: 60px !important; font-size: 14px !important; line-height: 1.4 !important;';
        userMsg.textContent = message;
        messages.appendChild(userMsg);
        
        input.value = '';
        messages.scrollTop = messages.scrollHeight;
        
        // Add typing indicator
        var typing = document.createElement('div');
        typing.id = 'typing-indicator';
        typing.style.cssText = 'background: ' + (config.assistantBubbleColor || '#F3F4F6') + ' !important; color: #666 !important; padding: 12px !important; border-radius: 15px !important; margin-bottom: 12px !important; font-size: 14px !important; font-style: italic !important; margin-right: 60px !important;';
        typing.textContent = 'AI is typing...';
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;
        
        // API call
        fetch(config.apiUrl + '/api/chat/' + config.assistantId, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        })
        .then(function(response) {
            console.log('EXECUTA AI: API response status:', response.status);
            return response.json();
        })
        .then(function(data) {
            console.log('EXECUTA AI: API response data:', data);
            
            // Remove typing indicator
            var typingEl = document.getElementById('typing-indicator');
            if (typingEl) {
                typingEl.remove();
            }
            
            // Add AI response
            var aiMsg = document.createElement('div');
            aiMsg.style.cssText = 'background: ' + (config.assistantBubbleColor || '#F3F4F6') + ' !important; padding: 12px !important; border-radius: 15px !important; margin-bottom: 12px !important; margin-right: 60px !important; color: #333 !important; font-size: 14px !important; line-height: 1.4 !important;';
            aiMsg.textContent = data.response || 'Sorry, I encountered an error.';
            messages.appendChild(aiMsg);
            messages.scrollTop = messages.scrollHeight;
        })
        .catch(function(error) {
            console.error('EXECUTA AI: API error:', error);
            
            // Remove typing indicator
            var typingEl = document.getElementById('typing-indicator');
            if (typingEl) {
                typingEl.remove();
            }
            
            // Add error message
            var errorMsg = document.createElement('div');
            errorMsg.style.cssText = 'background: ' + (config.assistantBubbleColor || '#F3F4F6') + ' !important; padding: 12px !important; border-radius: 15px !important; margin-bottom: 12px !important; margin-right: 60px !important; color: #333 !important; font-size: 14px !important; line-height: 1.4 !important;';
            errorMsg.textContent = 'Sorry, I am having trouble connecting right now.';
            messages.appendChild(errorMsg);
            messages.scrollTop = messages.scrollHeight;
        });
    }
    
    // Start initialization
    init();
    
})();

console.log('EXECUTA AI: JavaScript file loaded');`;
}

function generateSimpleCSS(assistant: any): string {
  return `/* Executa AI WordPress Plugin - CSS */

/* Reset any theme interference */
#executa-ai-chat-widget,
#executa-ai-chat-widget * {
    box-sizing: border-box !important;
}

/* Ensure widget container doesn't interfere */
#executa-ai-chat-widget {
    position: relative !important;
    z-index: 999999 !important;
    pointer-events: none !important;
}

/* Allow interaction with widget elements */
#executa-ai-chat-widget > * {
    pointer-events: auto !important;
}

/* Chat bubble animations */
#executa-chat-bubble:hover {
    transform: scale(1.05) !important;
    transition: transform 0.2s ease !important;
}

/* Scrollbar styling for chat messages */
#chat-messages::-webkit-scrollbar {
    width: 6px !important;
}

#chat-messages::-webkit-scrollbar-track {
    background: #f1f1f1 !important;
    border-radius: 3px !important;
}

#chat-messages::-webkit-scrollbar-thumb {
    background: #c1c1c1 !important;
    border-radius: 3px !important;
}

#chat-messages::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1 !important;
}

/* Input focus styling */
#chat-input:focus {
    border-color: ${assistant.embedBubbleColor || '#3B82F6'} !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
}

/* Send button hover effect */
#chat-send:hover {
    opacity: 0.9 !important;
    transform: translateY(-1px) !important;
    transition: all 0.2s ease !important;
}

/* Close button hover effect */
#close-chat:hover {
    background: rgba(255, 255, 255, 0.3) !important;
    transition: background 0.2s ease !important;
}

/* Mobile responsiveness */
@media (max-width: 480px) {
    #executa-chat-interface {
        width: calc(100vw - 20px) !important;
        height: 400px !important;
        bottom: 80px !important;
        right: 10px !important;
        left: 10px !important;
    }
    
    #executa-chat-bubble {
        bottom: 15px !important;
        right: 15px !important;
        width: 55px !important;
        height: 55px !important;
        font-size: 22px !important;
    }
}

/* Ensure proper layering */
#executa-chat-bubble {
    z-index: 999999 !important;
}

#executa-chat-interface {
    z-index: 999998 !important;
}`;
}

function generateReadmeFile(assistant: any, pluginName: string): string {
  return `=== ${pluginName} ===
Contributors: executaai
Tags: ai, chatbot, customer-service, artificial-intelligence, chat
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Add ${assistant.name} AI assistant chat widget to your WordPress site. Powered by Executa.ai

== Description ==

This plugin adds the "${assistant.name}" AI assistant to your WordPress website as a chat widget. Your visitors can interact with your AI assistant directly on your site.

**Features:**
* Easy one-click installation
* No coding required
* Mobile responsive design
* Customizable appearance
* 24/7 AI assistance for your visitors
* Analytics and insights via Executa.ai dashboard

**About Executa.ai:**
Executa.ai helps businesses create and deploy AI assistants that can handle customer inquiries, provide support, and engage with website visitors automatically.

== Installation ==

1. Upload the plugin files to the '/wp-content/plugins/' directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress
3. The AI chat widget will automatically appear in the bottom-right corner of your website
4. Customize settings via Settings > ${assistant.name} AI in your WordPress admin

== Frequently Asked Questions ==

= Does this plugin require an Executa.ai account? =

Yes, this plugin connects to your existing AI assistant on Executa.ai. The assistant was created and configured through your Executa.ai dashboard.

= Can I customize the widget appearance? =

The widget appearance is configured through your Executa.ai dashboard. Changes made there will automatically reflect in the WordPress plugin.

= Is the plugin mobile friendly? =

Yes, the chat widget is fully responsive and works great on mobile devices.

= How do I disable the widget? =

Go to Settings > ${assistant.name} AI in your WordPress admin and uncheck "Enable AI Widget".

= Where can I view chat analytics? =

Visit your Executa.ai dashboard at https://app.executa.ai to view detailed analytics and conversation logs.

== Troubleshooting ==

**Widget not appearing:**
1. Make sure the plugin is activated
2. Check that the widget is enabled in Settings > ${assistant.name} AI
3. Clear your browser cache and check again
4. Open browser console (F12) and look for "EXECUTA AI" messages

**Widget appears but doesn't respond:**
1. Check browser console for error messages
2. Verify your internet connection
3. Contact Executa.ai support if the issue persists

**Having other issues:**
1. Deactivate and reactivate the plugin
2. Check for JavaScript errors in browser console
3. Visit https://app.executa.ai for support

== Changelog ==

= 1.0.0 =
* Initial release
* AI chat widget with full customization
* WordPress admin integration
* Mobile responsive design

== Support ==

For support and questions, please visit:
* Executa.ai Dashboard: https://app.executa.ai
* Support: https://executa.ai/support

This plugin is powered by Executa.ai and requires an active Executa.ai account.`;
} 