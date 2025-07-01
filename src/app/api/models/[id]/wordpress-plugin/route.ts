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
  const assistantName = assistant.name || 'AI Assistant';
  
  // Escape quotes and special characters for PHP strings
  const escapedPluginName = pluginName.replace(/'/g, "\\'").replace(/"/g, '\\"');
  const escapedAssistantName = assistantName.replace(/'/g, "\\'").replace(/"/g, '\\"');
  const escapedAssistantId = assistantId.replace(/'/g, "\\'").replace(/"/g, '\\"');

  return `<?php
/**
 * Plugin Name: ${escapedPluginName}
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
    
    private $assistant_id = '${escapedAssistantId}';
    private $assistant_name = '${escapedAssistantName}';
    
    public function __construct() {
        // Add hooks with error handling
        add_action('wp_enqueue_scripts', array(\$this, 'enqueue_scripts'));
        add_action('wp_footer', array(\$this, 'render_widget'));
        add_action('admin_menu', array(\$this, 'add_admin_menu'));
        add_action('admin_init', array(\$this, 'settings_init'));
        
        // Set default options if they don't exist
        if (get_option('executa_ai_enabled') === false) {
            update_option('executa_ai_enabled', true);
        }
        if (get_option('executa_api_url') === false) {
            update_option('executa_api_url', 'https://app.executa.ai');
        }
    }
    
    public function enqueue_scripts() {
        if (!get_option('executa_ai_enabled', true)) {
            return;
        }
        
        \$plugin_url = plugins_url('', __FILE__);
        
        // Enqueue Font Awesome for icons
        wp_enqueue_style(
            'font-awesome',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
            array(),
            '6.0.0'
        );
        
        wp_enqueue_script(
            'executa-ai-widget',
            \$plugin_url . '/assets/executa-widget.js',
            array(),
            '1.0.2',
            true
        );
        
        wp_enqueue_style(
            'executa-ai-widget',
            \$plugin_url . '/assets/executa-widget.css',
            array('font-awesome'),
            '1.0.2'
        );
        
        // Get API URL from settings
        \$api_url = get_option('executa_api_url', 'https://app.executa.ai');
        \$api_url = esc_url(\$api_url);
        
        // Pass configuration to JavaScript
        \$config = array(
            'assistantId' => \$this->assistant_id,
            'assistantName' => \$this->assistant_name,
            'enabled' => (bool) get_option('executa_ai_enabled', true),
            'apiUrl' => \$api_url,
            'fetchLiveSettings' => true,
            'version' => '1.0.2'
        );
        
        wp_localize_script('executa-ai-widget', 'EXECUTA_AI_CONFIG', \$config);
    }
    
    public function render_widget() {
        if (!get_option('executa_ai_enabled', true)) {
            return;
        }
        
        echo '<div id="executa-ai-chat-widget"></div>';
    }
    
    public function add_admin_menu() {
        add_options_page(
            \$this->assistant_name . ' AI Settings',
            \$this->assistant_name . ' AI',
            'manage_options',
            'executa-ai-settings',
            array(\$this, 'settings_page')
        );
    }
    
    public function settings_init() {
        // Register settings with proper sanitization
        register_setting('executa_ai_settings', 'executa_ai_enabled', array(
            'type' => 'boolean',
            'sanitize_callback' => 'rest_sanitize_boolean',
            'default' => true
        ));
        
        register_setting('executa_ai_settings', 'executa_api_url', array(
            'type' => 'string',
            'sanitize_callback' => 'esc_url_raw',
            'default' => 'https://app.executa.ai'
        ));
        
        add_settings_section(
            'executa_ai_section',
            'Widget Settings',
            null,
            'executa_ai_settings'
        );
        
        add_settings_field(
            'executa_ai_enabled',
            'Enable AI Widget',
            array(\$this, 'enabled_field_render'),
            'executa_ai_settings',
            'executa_ai_section'
        );
        
        add_settings_field(
            'executa_api_url',
            'API URL',
            array(\$this, 'api_url_field_render'),
            'executa_ai_settings',
            'executa_ai_section'
        );
    }
    
    public function enabled_field_render() {
        \$enabled = get_option('executa_ai_enabled', true);
        \$checked = \$enabled ? 'checked="checked"' : '';
        echo '<input type="checkbox" name="executa_ai_enabled" value="1" ' . \$checked . ' />';
        echo '<p class="description">Check to enable the AI chat widget on your website.</p>';
    }
    
    public function api_url_field_render() {
        \$api_url = get_option('executa_api_url', 'https://app.executa.ai');
        \$api_url = esc_url(\$api_url);
        echo '<input type="url" name="executa_api_url" value="' . esc_attr(\$api_url) . '" class="regular-text" placeholder="https://app.executa.ai" />';
        echo '<p class="description">The API URL for your Executa.ai instance. Examples:<br/>';
        echo '• <strong>Development:</strong> http://localhost:3000<br/>';
        echo '• <strong>Cloudflare Tunnel:</strong> https://your-tunnel.trycloudflare.com<br/>';
        echo '• <strong>Production:</strong> https://app.executa.ai</p>';
    }
    
    public function settings_page() {
        \$assistant_name = esc_html(\$this->assistant_name);
        \$assistant_id = esc_html(\$this->assistant_id);
        ?>
        <div class="wrap">
            <h1><?php echo \$assistant_name; ?> AI Settings</h1>
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
                <p><strong>Assistant Name:</strong> <?php echo \$assistant_name; ?></p>
                <p><strong>Assistant ID:</strong> <?php echo \$assistant_id; ?></p>
                <p>To view analytics and modify your AI assistant, visit your <a href="https://app.executa.ai/dashboard" target="_blank">Executa.ai Dashboard</a>.</p>
                
                <h4>Configuration Help</h4>
                <div style="background: #e7f3ff; padding: 15px; border-left: 4px solid #2196F3; margin: 10px 0;">
                    <p><strong>API URL Setup:</strong></p>
                    <ul>
                        <li>• <strong>Development/Local:</strong> http://localhost:3000</li>
                        <li>• <strong>Production:</strong> Your deployed Executa.ai domain</li>
                        <li>• <strong>Default:</strong> https://app.executa.ai (if available)</li>
                    </ul>
                    <p><em>Note: The widget will use default styling if the API URL cannot be reached, but live updates require a working connection.</em></p>
                </div>
                
                <h4>Need Help?</h4>
                <ul>
                    <li>• Check that the widget is enabled above</li>
                    <li>• Verify the API URL is correct and reachable</li>
                    <li>• Clear your browser cache if you don't see changes</li>
                    <li>• Check browser console for connection errors</li>
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
  return `// Executa AI WordPress Plugin - Enhanced with Live Styling & XSS Protection
console.log('EXECUTA AI: Enhanced WordPress plugin loading...');

// Security utility functions to prevent XSS
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function isSafeUrl(url) {
    try {
        var parsedUrl = new URL(url);
        var allowedProtocols = ['http:', 'https:', 'data:'];
        return allowedProtocols.includes(parsedUrl.protocol);
    } catch {
        return false;
    }
}

function isSafeImageUrl(url) {
    if (!isSafeUrl(url)) return false;
    try {
        var parsedUrl = new URL(url);
        if (parsedUrl.protocol === 'data:') {
            return parsedUrl.href.indexOf('data:image/') === 0;
        }
        return true;
    } catch {
        return false;
    }
}

function createSafeElement(tagName, textContent, styles) {
    var element = document.createElement(tagName);
    if (textContent) {
        element.textContent = textContent; // Safe text assignment
    }
    if (styles) {
        element.style.cssText = styles;
    }
    return element;
}

function createSafeImage(src, alt, styles) {
    if (!isSafeImageUrl(src)) {
        console.warn('EXECUTA AI: Unsafe image URL blocked:', src);
        return null;
    }
    var img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    if (styles) {
        img.style.cssText = styles;
    }
    img.onerror = function() {
        console.warn('EXECUTA AI: Image failed to load:', src);
        img.style.display = 'none';
    };
    return img;
}

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
        // Use Font Awesome icon with fallback
        // Securely create Font Awesome icon
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
        
        // Enhanced header with conditional display (XSS protected)
        var header = null;
        if (showChatHeader) {
            header = document.createElement('div');
            header.style.cssText = 'background: linear-gradient(135deg, ' + bubbleColor + ' 0%, ' + userMessageBubbleColor + ' 100%) !important; color: white !important; padding: 16px !important; border-radius: 12px 12px 0 0 !important; font-weight: 600 !important; display: flex !important; justify-content: space-between !important; align-items: center !important; font-size: 16px !important;';
            
            // Safely create title span
            var titleSpan = createSafeElement('span', chatHeaderTitle);
            header.appendChild(titleSpan);
            
            // Safely create close button
            var closeBtn = createSafeElement('span', '×', 'cursor: pointer; font-size: 20px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,0.2); transition: background 0.2s ease;');
            closeBtn.id = 'close-chat';
            header.appendChild(closeBtn);
        }
        
        // Enhanced messages area
        var messages = document.createElement('div');
        messages.id = 'chat-messages';
        messages.style.cssText = 'flex: 1 !important; padding: 16px !important; overflow-y: auto !important; background: ' + chatBackgroundColor + ' !important;';
        
        // Welcome message with avatar support
        if (welcomeMessage) {
            var welcomeDiv = document.createElement('div');
            welcomeDiv.style.cssText = 'display: flex !important; align-items: flex-start !important; margin-bottom: 16px !important; gap: 8px !important;';
            
            // Avatar if enabled (XSS protected)
            if (showAssistantAvatar) {
                var avatar = document.createElement('div');
                avatar.style.cssText = 'width: 32px !important; height: 32px !important; border-radius: 50% !important; background: ' + bubbleColor + ' !important; display: flex !important; align-items: center !important; justify-content: center !important; color: white !important; font-size: 16px !important; flex-shrink: 0 !important;';
                
                if (assistantAvatarUrl) {
                    var avatarImg = createSafeImage(assistantAvatarUrl, 'Assistant', 'width: 100%; height: 100%; border-radius: 50%; object-fit: cover;');
                    if (avatarImg) {
                        avatar.appendChild(avatarImg);
                    } else {
                        // Fallback to robot icon if image is unsafe
                        var robotIcon = createSafeElement('i', '', 'font-size: 16px;');
                        robotIcon.className = 'fas fa-robot';
                        avatar.appendChild(robotIcon);
                        // Fallback to emoji if Font Awesome doesn't load
                        setTimeout(function() {
                            if (robotIcon.offsetWidth === 0) {
                                avatar.removeChild(robotIcon);
                                var robotEmoji = createSafeElement('span', '🤖');
                                avatar.appendChild(robotEmoji);
                            }
                        }, 100);
                    }
                } else {
                    var robotIcon = createSafeElement('i', '', 'font-size: 16px;');
                    robotIcon.className = 'fas fa-robot';
                    avatar.appendChild(robotIcon);
                    // Fallback for when Font Awesome doesn't load
                    setTimeout(function() {
                        if (robotIcon.offsetWidth === 0) {
                            avatar.removeChild(robotIcon);
                            var robotEmoji = createSafeElement('span', '🤖');
                            avatar.appendChild(robotEmoji);
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
        
        // Avatar for typing indicator
        if (showAssistantAvatar) {
            var typingAvatar = document.createElement('div');
            typingAvatar.style.cssText = 'width: 32px !important; height: 32px !important; border-radius: 50% !important; background: ' + bubbleColor + ' !important; display: flex !important; align-items: center !important; justify-content: center !important; color: white !important; font-size: 16px !important; flex-shrink: 0 !important;';
            if (assistantAvatarUrl && /^https?:\\/\\//.test(assistantAvatarUrl)) {
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
            
            // Avatar for AI response
            if (showAssistantAvatar) {
                var aiAvatar = document.createElement('div');
                aiAvatar.style.cssText = 'width: 32px !important; height: 32px !important; border-radius: 50% !important; background: ' + bubbleColor + ' !important; display: flex !important; align-items: center !important; justify-content: center !important; color: white !important; font-size: 16px !important; flex-shrink: 0 !important;';
                if (assistantAvatarUrl && /^https?:\\/\\//.test(assistantAvatarUrl)) {
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
                if (assistantAvatarUrl && /^https?:\\/\\//.test(assistantAvatarUrl)) {
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

console.log('EXECUTA AI: Enhanced WordPress plugin with live styling loaded');`;
}

function generateSimpleCSS(assistant: any): string {
  return `/* Executa AI WordPress Plugin - Enhanced CSS with Live Styling Support */

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

/* Enhanced chat bubble styling with hover effects */
#executa-chat-bubble {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

#executa-chat-bubble:hover {
    transform: scale(1.05) !important;
    box-shadow: 0 8px 25px rgba(0,0,0,0.4) !important;
}

#executa-chat-bubble:active {
    transform: scale(0.95) !important;
}

/* Enhanced chat interface styling */
#executa-chat-interface {
    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* Enhanced scrollbar styling for chat messages */
#chat-messages {
    scrollbar-width: thin !important;
    scrollbar-color: #cbd5e1 #f1f5f9 !important;
}

#chat-messages::-webkit-scrollbar {
    width: 6px !important;
}

#chat-messages::-webkit-scrollbar-track {
    background: #f1f5f9 !important;
    border-radius: 3px !important;
}

#chat-messages::-webkit-scrollbar-thumb {
    background: #cbd5e1 !important;
    border-radius: 3px !important;
}

#chat-messages::-webkit-scrollbar-thumb:hover {
    background: #94a3b8 !important;
}

/* Enhanced input styling with focus states */
#chat-input {
    transition: all 0.2s ease !important;
}

#chat-input:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

/* Enhanced send button styling */
#chat-send {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

#chat-send:hover {
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
}

#chat-send:active {
    transform: scale(0.95) !important;
}

/* Enhanced close button styling */
#close-chat {
    transition: all 0.2s ease !important;
}

#close-chat:hover {
    background: rgba(255, 255, 255, 0.3) !important;
    transform: rotate(90deg) !important;
}

/* Pulse animation for typing indicator */
@keyframes pulse {
    0%, 100% {
        opacity: 0.4;
    }
    50% {
        opacity: 1;
    }
}

/* Message animations */
.message-enter {
    animation: messageSlideIn 0.3s ease-out !important;
}

@keyframes messageSlideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Avatar styling enhancements */
.assistant-avatar {
    transition: all 0.2s ease !important;
}

.assistant-avatar:hover {
    transform: scale(1.1) !important;
}

/* Enhanced mobile responsiveness */
@media (max-width: 480px) {
    #executa-chat-interface {
        width: calc(100vw - 20px) !important;
        height: calc(100vh - 100px) !important;
        max-height: 500px !important;
        bottom: 80px !important;
        right: 10px !important;
        left: 10px !important;
        border-radius: 16px !important;
    }
    
    #executa-chat-bubble {
        bottom: 15px !important;
        right: 15px !important;
        width: 55px !important;
        height: 55px !important;
        font-size: 22px !important;
    }
    
    /* Adjust header on mobile */
    #executa-chat-interface [style*="background: linear-gradient"] {
        padding: 12px 16px !important;
        font-size: 15px !important;
    }
    
    /* Adjust input area on mobile */
    #executa-chat-interface [style*="border-top: 1px solid"] {
        padding: 12px !important;
    }
    
    #chat-input {
        font-size: 16px !important; /* Prevents zoom on iOS */
        padding: 10px 14px !important;
    }
    
    #chat-send {
        width: 40px !important;
        height: 40px !important;
        font-size: 16px !important;
    }
}

/* Tablet responsiveness */
@media (max-width: 768px) and (min-width: 481px) {
    #executa-chat-interface {
        width: 380px !important;
        height: 480px !important;
    }
}

/* Enhanced dark mode support (respects system preferences) */
@media (prefers-color-scheme: dark) {
    #executa-chat-interface {
        box-shadow: 0 8px 30px rgba(0,0,0,0.6) !important;
    }
    
    #chat-messages::-webkit-scrollbar-track {
        background: #374151 !important;
    }
    
    #chat-messages::-webkit-scrollbar-thumb {
        background: #6b7280 !important;
    }
    
    #chat-messages::-webkit-scrollbar-thumb:hover {
        background: #9ca3af !important;
    }
}

/* Enhanced accessibility features */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* Focus styles for keyboard navigation */
#executa-chat-bubble:focus,
#chat-send:focus,
#close-chat:focus {
    outline: 2px solid #3b82f6 !important;
    outline-offset: 2px !important;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    #executa-chat-bubble,
    #chat-send {
        border: 2px solid currentColor !important;
    }
    
    #chat-input {
        border: 3px solid #000 !important;
    }
}

/* Ensure proper layering for any theme conflicts */
#executa-chat-bubble {
    z-index: 999999 !important;
    isolation: isolate !important;
}

#executa-chat-interface {
    z-index: 999998 !important;
    isolation: isolate !important;
}

/* Prevent text selection on UI elements */
#executa-chat-bubble,
#chat-send,
#close-chat {
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
}

/* Enhanced loading state styling */
.executa-loading {
    position: relative !important;
    overflow: hidden !important;
}

.executa-loading::after {
    content: '' !important;
    position: absolute !important;
    top: 0 !important;
    left: -100% !important;
    width: 100% !important;
    height: 100% !important;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent) !important;
    animation: shimmer 1.5s infinite !important;
}

@keyframes shimmer {
    0% {
        left: -100%;
    }
    100% {
        left: 100%;
    }
}

/* Print styles (hide widget when printing) */
@media print {
    #executa-ai-chat-widget {
        display: none !important;
    }
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