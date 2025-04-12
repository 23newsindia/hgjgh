<?php
/*
Plugin Name: WooCommerce Advanced Countdown Timer
Description: Add a persistent product countdown timer with shortcode [wc_countdown_timer]
Version: 4.0
Author: Your Name
Text Domain: wc-countdown-timer
*/

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class WC_Advanced_Countdown_Timer {

    const OPTION_PREFIX = 'wc_countdown_end_';

    public function __construct() {
        // Initialize plugin
        add_action('plugins_loaded', array($this, 'init'));
        
        // Register activation/deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }

    public function init() {
        // Register shortcode
        add_shortcode('wc_countdown_timer', array($this, 'render_countdown_timer'));
        
        // Add admin settings
        if (is_admin()) {
            add_action('admin_menu', array($this, 'add_admin_menu'));
            add_action('admin_init', array($this, 'register_settings'));
            add_action('admin_enqueue_scripts', array($this, 'admin_assets'));
        }
        
        // Enqueue frontend assets
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'), 999);
        
        // Add AJAX endpoints
        add_action('wp_ajax_wc_reset_countdown', array($this, 'ajax_reset_timer'));
        add_action('wp_ajax_nopriv_wc_reset_countdown', array($this, 'ajax_no_permission'));
    }

    public function add_admin_menu() {
        add_options_page(
            __('WooCommerce Countdown Timer Settings', 'wc-countdown-timer'),
            __('WC Countdown Timer', 'wc-countdown-timer'),
            'manage_options',
            'wc-countdown-timer',
            array($this, 'render_settings_page')
        );
    }

    public function register_settings() {
        register_setting('wc_countdown_timer_settings', 'wc_countdown_timer_options', array($this, 'sanitize_settings'));
        
        add_settings_section(
            'wc_countdown_timer_main',
            __('General Settings', 'wc-countdown-timer'),
            array($this, 'render_settings_section'),
            'wc-countdown-timer'
        );
        
        add_settings_field(
            'default_text',
            __('Default Pre-text', 'wc-countdown-timer'),
            array($this, 'render_text_field'),
            'wc-countdown-timer',
            'wc_countdown_timer_main',
            array(
                'label_for' => 'default_text',
                'default' => __('Offer Ends In', 'wc-countdown-timer')
            )
        );
        
        add_settings_field(
            'default_duration',
            __('Default Duration (hours)', 'wc-countdown-timer'),
            array($this, 'render_number_field'),
            'wc-countdown-timer',
            'wc_countdown_timer_main',
            array(
                'label_for' => 'default_duration',
                'default' => 24,
                'min' => 1,
                'step' => 1
            )
        );
        
        add_settings_field(
            'persistent_mode',
            __('Timer Persistence', 'wc-countdown-timer'),
            array($this, 'render_checkbox_field'),
            'wc-countdown-timer',
            'wc_countdown_timer_main',
            array(
                'label_for' => 'persistent_mode',
                'label' => __('Enable cross-browser persistent timers', 'wc-countdown-timer'),
                'default' => 1
            )
        );
    }

    public function sanitize_settings($input) {
        $output = array();
        
        if (isset($input['default_text'])) {
            $output['default_text'] = sanitize_text_field($input['default_text']);
        }
        
        if (isset($input['default_duration'])) {
            $output['default_duration'] = absint($input['default_duration']);
            if ($output['default_duration'] < 1) {
                $output['default_duration'] = 24;
            }
        }
        
        $output['persistent_mode'] = isset($input['persistent_mode']) ? 1 : 0;
        
        return $output;
    }

    public function render_settings_section() {
        echo '<p>' . __('Configure the default settings for your countdown timers.', 'wc-countdown-timer') . '</p>';
    }

    public function render_text_field($args) {
        $options = get_option('wc_countdown_timer_options');
        ?>
        <input type="text" id="<?php echo esc_attr($args['label_for']); ?>"
               name="wc_countdown_timer_options[<?php echo esc_attr($args['label_for']); ?>]"
               value="<?php echo isset($options[$args['label_for']]) ? esc_attr($options[$args['label_for']]) : $args['default']; ?>"
               class="regular-text">
        <?php
    }

    public function render_number_field($args) {
        $options = get_option('wc_countdown_timer_options');
        ?>
        <input type="number" id="<?php echo esc_attr($args['label_for']); ?>"
               name="wc_countdown_timer_options[<?php echo esc_attr($args['label_for']); ?>]"
               min="<?php echo isset($args['min']) ? esc_attr($args['min']) : 1; ?>"
               step="<?php echo isset($args['step']) ? esc_attr($args['step']) : 1; ?>"
               value="<?php echo isset($options[$args['label_for']]) ? esc_attr($options[$args['label_for']]) : $args['default']; ?>"
               class="small-text">
        <?php
    }

    public function render_checkbox_field($args) {
        $options = get_option('wc_countdown_timer_options');
        $checked = isset($options[$args['label_for']]) ? (bool) $options[$args['label_for']] : (bool) $args['default'];
        ?>
        <label for="<?php echo esc_attr($args['label_for']); ?>">
            <input type="checkbox" id="<?php echo esc_attr($args['label_for']); ?>"
                   name="wc_countdown_timer_options[<?php echo esc_attr($args['label_for']); ?>]"
                   value="1" <?php checked($checked); ?>>
            <?php echo esc_html($args['label']); ?>
        </label>
        <?php
    }

    public function render_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    
    // Show notice if saved
    if (isset($_GET['settings-updated'])) {
        add_settings_error('wc_countdown_timer_messages', 'wc_countdown_timer_message', 
            __('Settings Saved', 'wc-countdown-timer'), 'updated');
    }
    
    settings_errors('wc_countdown_timer_messages');
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        <form action="options.php" method="post">
            <?php
            settings_fields('wc_countdown_timer_settings');
            do_settings_sections('wc-countdown-timer');
            submit_button(__('Save Settings', 'wc-countdown-timer'));
            ?>
        </form>
        
        <div class="shortcode-generator-section">
            <h2><?php _e('Countdown Timer Shortcode Generator', 'wc-countdown-timer'); ?></h2>
            <div id="wc-countdown-shortcode-generator"></div>
            <div class="shortcode-output" style="margin-top: 20px;">
                <h3><?php _e('Your Shortcode:', 'wc-countdown-timer'); ?></h3>
                <div class="shortcode-preview" style="background: #f5f5f5; padding: 10px; border-radius: 3px; font-family: monospace;"></div>
                <p class="description"><?php _e('Copy and paste this shortcode into any post or page.', 'wc-countdown-timer'); ?></p>
            </div>
        </div>
        
        <div class="timer-reset-section">
            <h2><?php _e('Reset All Timers', 'wc-countdown-timer'); ?></h2>
            <p><?php _e('This will force all active countdown timers to restart from their original duration.', 'wc-countdown-timer'); ?></p>
            <button id="wc-reset-all-timers" class="button button-secondary">
                <?php _e('Reset All Timers', 'wc-countdown-timer'); ?>
            </button>
            <span id="wc-reset-feedback" style="margin-left:10px;"></span>
        </div>
    </div>
    <?php
}
  

    
    public function render_countdown_timer($atts) {
    $options = get_option('wc_countdown_timer_options');
    
    // Parse shortcode attributes with timezone support
    $atts = shortcode_atts(array(
        'id' => '',
        'text' => isset($options['default_text']) ? $options['default_text'] : __('Offer Ends In', 'wc-countdown-timer'),
        'hours' => isset($options['default_duration']) ? $options['default_duration'] : 24,
        'date' => '', // Optional specific end date (YYYY-MM-DD)
        'time' => '00:00:00', // Time component for date
        'timezone' => '', // Optional timezone (e.g., 'America/New_York')
        'bg_color' => '#dedede',
        'text_color' => '#ed2d2f',
        'label_color' => '#7b7b72',
        'expired_text' => __('Offer Expired', 'wc-countdown-timer'),
        'compact' => 'false',
        'expiry_action' => 'show_text', // 'show_text', 'hide', or 'redirect'
        'redirect_url' => '' // URL for redirect action
    ), $atts, 'wc_countdown_timer');
    
    // Generate unique ID if none provided
    $timer_id = !empty($atts['id']) ? sanitize_title($atts['id']) : 'wc-countdown-' . wp_rand();
    
    // Calculate end time with timezone support
    $end_time_key = 'wc_countdown_end_' . $timer_id;
    $end_time = get_transient($end_time_key);
    
    if (false === $end_time) {
        if (!empty($atts['date'])) {
            $date_string = $atts['date'] . ' ' . $atts['time'];
            
            if (!empty($atts['timezone'])) {
                try {
                    $timezone = new DateTimeZone($atts['timezone']);
                    $date = new DateTime($date_string, $timezone);
                    $date->setTimezone(new DateTimeZone('UTC'));
                    $end_time = $date->getTimestamp();
                } catch (Exception $e) {
                    // Fallback to server time if invalid timezone
                    $end_time = strtotime($date_string);
                }
            } else {
                $end_time = strtotime($date_string);
            }
        } else {
            $end_time = time() + ($atts['hours'] * 3600);
        }
        set_transient($end_time_key, $end_time, $atts['hours'] * 3600);
    }
    
    // Prepare data attributes
    $data_attrs = array(
        'data-timer-id' => esc_attr($timer_id),
        'data-end-time' => esc_attr($end_time),
        'data-bg-color' => esc_attr(sanitize_hex_color($atts['bg_color'])),
        'data-text-color' => esc_attr(sanitize_hex_color($atts['text_color'])),
        'data-label-color' => esc_attr(sanitize_hex_color($atts['label_color'])),
        'data-expired-text' => esc_attr($atts['expired_text']),
        'data-persistent' => isset($options['persistent_mode']) ? $options['persistent_mode'] : 1,
        'data-compact' => $atts['compact'] === 'true' ? 'true' : 'false',
        'data-expiry-action' => esc_attr($atts['expiry_action']),
        'data-redirect-url' => esc_url($atts['redirect_url'])
    );
    
    $data_string = '';
    foreach ($data_attrs as $key => $value) {
        $data_string .= ' ' . $key . '="' . $value . '"';
    }
    
    ob_start();
    ?>
    <!-- Desktop Version -->
    <div class="wc-countdown-timer-desktop d-none d-md-block" id="<?php echo esc_attr($timer_id); ?>" <?php echo $data_string; ?>>
        <div class="text-center timer">
            <span class="pretext"><?php echo esc_html($atts['text']); ?></span>
            <div class="countdown">
                <div class="time">
                    <div class="unit text-uppercase"><?php _e('days', 'wc-countdown-timer'); ?></div>
                    <span class="number">00</span>
                </div>
                <div class="time">
                    <div class="unit text-uppercase"><?php _e('hours', 'wc-countdown-timer'); ?></div>
                    <span class="number">00</span>
                </div>
                <div class="time">
                    <div class="unit text-uppercase"><?php _e('minutes', 'wc-countdown-timer'); ?></div>
                    <span class="number">00</span>
                </div>
                <div class="time">
                    <div class="unit text-uppercase"><?php _e('seconds', 'wc-countdown-timer'); ?></div>
                    <span class="number">00</span>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Mobile Version -->
    <div class="wc-countdown-timer-mobile d-md-none" id="<?php echo esc_attr($timer_id); ?>-mobile" <?php echo $data_string; ?>>
        <div class="text-center mobile-ui">
            <span class="pretext1"><?php echo esc_html($atts['text']); ?></span>
            <div class="mobileUI countdown pt-0 pb-2">
                <span class="number1">00 <?php _e('day', 'wc-countdown-timer'); ?> : 00 <?php _e('hrs', 'wc-countdown-timer'); ?> : 00 <?php _e('min', 'wc-countdown-timer'); ?> : 00 <?php _e('sec', 'wc-countdown-timer'); ?></span>
            </div>
        </div>
    </div>
    <?php
    
    return ob_get_clean();
}
    
    private function calculate_end_time($timer_id, $atts) {
        $option_name = self::OPTION_PREFIX . $timer_id;
        $end_time = get_option($option_name, 0);

        // Only set new time if: no existing time, date changed, or manual reset
        if (!$end_time || !empty($atts['date']) || $this->should_reset($timer_id, $atts)) {
            $end_time = !empty($atts['date']) ? strtotime($atts['date']) : time() + ((int)$atts['hours'] * 3600);
            update_option($option_name, $end_time, false);
        }

        return $end_time;
    }
    
    private function should_reset($timer_id, $atts) {
        if (!empty($atts['reset_key']) && isset($_GET['reset_timer_' . $atts['reset_key']])) {
            return current_user_can('manage_options');
        }
        return false;
    }
    
    private function reset_timer($timer_id, $atts) {
        $option_name = self::OPTION_PREFIX . $timer_id;
        $end_time = !empty($atts['date']) ? strtotime($atts['date']) : time() + ((int)$atts['hours'] * 3600);
        update_option($option_name, $end_time, false);
        return $end_time;
    }
  
    public function enqueue_assets() {
        // Only load assets if shortcode is present
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'wc_countdown_timer')) {
            // CSS with high priority (load late)
            wp_enqueue_style(
                'wc-countdown-timer-style',
                plugin_dir_url(__FILE__) . 'css/wc-countdown-timer.css',
                array(),
                '4.0',
                'all'
            );
            
            // Inline CSS as fallback
            $fallback_css = "
            .wc-countdown-timer-mobile .mobile-ui {
                background: #fff !important;
                margin-top: 0.75rem !important;
            }
            .wc-countdown-timer-mobile .pretext1 {
                color: #282d3f !important;
                font-weight: 600 !important;
            }";
            
            wp_add_inline_style('wc-countdown-timer-style', $fallback_css);
            
            // JavaScript in footer with defer
            wp_enqueue_script(
                'wc-countdown-timer-script',
                plugin_dir_url(__FILE__) . 'js/wc-countdown-timer.js',
                array(),
                '4.0',
                array(
                    'in_footer' => true,
                    'strategy' => 'defer'
                )
            );
            
            // Localize script with settings
            $options = get_option('wc_countdown_timer_options');
            wp_localize_script(
                'wc-countdown-timer-script',
                'wcCountdownSettings',
                array(
                    'ajaxurl' => admin_url('admin-ajax.php'),
                    'nonce' => wp_create_nonce('wc_countdown_nonce'),
                    'persistentMode' => isset($options['persistent_mode']) ? $options['persistent_mode'] : 1
                )
            );
        }
    }
    
    public function admin_assets($hook) {
    if ($hook !== 'settings_page_wc-countdown-timer') {
        return;
    }
    
    wp_enqueue_style(
        'wc-countdown-timer-admin-css',
        plugin_dir_url(__FILE__) . 'css/admin.css',
        array(),
        '4.0'
    );
    
    wp_enqueue_script(
        'wc-countdown-timer-admin',
        plugin_dir_url(__FILE__) . 'js/admin.js',
        array('wp-i18n', 'wp-components', 'wp-element'),
        '4.0',
        true
    );
    
    wp_localize_script(
        'wc-countdown-timer-admin',
        'wcCountdownAdmin',
        array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('wc_countdown_admin_nonce'),
            'resetConfirm' => __('Are you sure you want to reset all timers?', 'wc-countdown-timer'),
            'resetting' => __('Resetting...', 'wc-countdown-timer'),
            'resetSuccess' => __('All timers have been reset!', 'wc-countdown-timer'),
            'resetError' => __('Error resetting timers', 'wc-countdown-timer'),
            'defaultSettings' => $this->get_default_shortcode_settings()
        )
    );
      
       
       wp_enqueue_style(
        'wc-countdown-timer-block-css',
        plugin_dir_url(__FILE__) . 'css/block.css',
        array(),
        '4.0'
    );
      
    
    // Register the block editor script
    wp_register_script(
        'wc-countdown-timer-block',
        plugin_dir_url(__FILE__) . 'js/block.js',
        array('wp-blocks', 'wp-element', 'wp-components', 'wp-editor'),
        '4.0',
        true
    );
    
    wp_enqueue_script('wc-countdown-timer-block');
}


private function get_default_shortcode_settings() {
    $options = get_option('wc_countdown_timer_options');
    return array(
        'text' => $options['default_text'] ?? __('Offer Ends In', 'wc-countdown-timer'),
        'hours' => $options['default_duration'] ?? 24,
        'bg_color' => '#dedede',
        'text_color' => '#ed2d2f',
        'label_color' => '#7b7b72',
        'expired_text' => __('Offer Expired', 'wc-countdown-timer')
    );
}
    
    public function ajax_reset_timer() {
        check_ajax_referer('wc_countdown_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Permission denied', 'wc-countdown-timer'));
        }

        global $wpdb;
        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM $wpdb->options WHERE option_name LIKE %s",
                self::OPTION_PREFIX . '%'
            )
        );
        
        wp_send_json_success();
    }
    
    public function ajax_no_permission() {
        wp_send_json_error(__('Permission denied', 'wc-countdown-timer'));
    }

    public function activate() {
        // Setup default options
        add_option('wc_countdown_timer_options', array(
            'default_text' => __('Offer Ends In', 'wc-countdown-timer'),
            'default_duration' => 24,
            'persistent_mode' => '1'
        ));
    }

    public function deactivate() {
        // Clear our options on deactivation if desired
        // delete_option('wc_countdown_timer_options');
    }
}

new WC_Advanced_Countdown_Timer();