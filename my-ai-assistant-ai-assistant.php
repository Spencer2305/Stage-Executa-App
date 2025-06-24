<?php
/**
 * Plugin Name: My AI Assistant AI Assistant
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
    
    private $assistant_id = 'cmc9mgudg0004c94gre2xjfxy';
    private $assistant_name = 'My AI Assistant';
    
    public function __construct() {
        // Add hooks with error handling
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_footer', array($this, 'render_widget'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'settings_init'));
        
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
        
        $plugin_url = plugins_url('', __FILE__);
        
        // Enqueue Font Awesome for icons
        wp_enqueue_style(
            'font-awesome',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
            array(),
            '6.0.0'
        );
        
        wp_enqueue_script(
            'executa-ai-widget',
            $plugin_url . '/assets/executa-widget.js',
            array(),
            '1.0.2',
            true
        );
        
        wp_enqueue_style(
            'executa-ai-widget',
            $plugin_url . '/assets/executa-widget.css',
            array('font-awesome'),
            '1.0.2'
        );
        
        // Get API URL from settings
        $api_url = get_option('executa_api_url', 'https://app.executa.ai');
        $api_url = esc_url($api_url);
        
        // Pass configuration to JavaScript
        $config = array(
            'assistantId' => $this->assistant_id,
            'assistantName' => $this->assistant_name,
            'enabled' => (bool) get_option('executa_ai_enabled', true),
            'apiUrl' => $api_url,
            'fetchLiveSettings' => true,
            'version' => '1.0.2'
        );
        
        wp_localize_script('executa-ai-widget', 'EXECUTA_AI_CONFIG', $config);
    }
    
    public function render_widget() {
        if (!get_option('executa_ai_enabled', true)) {
            return;
        }
        
        echo '<div id="executa-ai-chat-widget"></div>';
    }
    
    public function add_admin_menu() {
        add_options_page(
            $this->assistant_name . ' AI Settings',
            $this->assistant_name . ' AI',
            'manage_options',
            'executa-ai-settings',
            array($this, 'settings_page')
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
            array($this, 'enabled_field_render'),
            'executa_ai_settings',
            'executa_ai_section'
        );
        
        add_settings_field(
            'executa_api_url',
            'API URL',
            array($this, 'api_url_field_render'),
            'executa_ai_settings',
            'executa_ai_section'
        );
    }
    
    public function enabled_field_render() {
        $enabled = get_option('executa_ai_enabled', true);
        $checked = $enabled ? 'checked="checked"' : '';
        echo '<input type="checkbox" name="executa_ai_enabled" value="1" ' . $checked . ' />';
        echo '<p class="description">Check to enable the AI chat widget on your website.</p>';
    }
    
    public function api_url_field_render() {
        $api_url = get_option('executa_api_url', 'https://app.executa.ai');
        $api_url = esc_url($api_url);
        echo '<input type="url" name="executa_api_url" value="' . esc_attr($api_url) . '" class="regular-text" placeholder="https://app.executa.ai" />';
        echo '<p class="description">The API URL for your Executa.ai instance. Examples:<br/>';
        echo '• <strong>Development:</strong> http://localhost:3000<br/>';
        echo '• <strong>Cloudflare Tunnel:</strong> https://your-tunnel.trycloudflare.com<br/>';
        echo '• <strong>Production:</strong> https://app.executa.ai</p>';
    }
    
    public function settings_page() {
        $assistant_name = esc_html($this->assistant_name);
        $assistant_id = esc_html($this->assistant_id);
        ?>
        <div class="wrap">
            <h1><?php echo $assistant_name; ?> AI Settings</h1>
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
                <p><strong>Assistant Name:</strong> <?php echo $assistant_name; ?></p>
                <p><strong>Assistant ID:</strong> <?php echo $assistant_id; ?></p>
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
?>