// js/admin.js
document.addEventListener('DOMContentLoaded', function() {
    // Timer reset functionality
    const resetButton = document.getElementById('wc-reset-all-timers');
    if (resetButton) {
        resetButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!confirm(wcCountdownAdmin.resetConfirm)) {
                return;
            }
            
            const feedback = document.getElementById('wc-reset-feedback');
            feedback.textContent = wcCountdownAdmin.resetting;
            
            wp.ajax.post('wc_reset_countdown', {
                nonce: wcCountdownAdmin.nonce
            }).then(function() {
                feedback.textContent = wcCountdownAdmin.resetSuccess;
                setTimeout(() => feedback.textContent = '', 3000);
            }).catch(function() {
                feedback.textContent = wcCountdownAdmin.resetError;
            });
        });
    }
    
    // Shortcode Generator React Component
    if (document.getElementById('wc-countdown-shortcode-generator')) {
        const { useState } = wp.element;
        const { TextControl, RangeControl, ColorPicker, PanelBody, PanelRow } = wp.components;
        
        // In js/admin.js - update the ShortcodeGenerator component
const ShortcodeGenerator = () => {
    const [settings, setSettings] = useState({
        ...wcCountdownAdmin.defaultSettings,
        time: '00:00:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        expiry_action: 'show_text',
        redirect_url: ''
    });
            const [shortcode, setShortcode] = useState('');
            
             

const updateSetting = (key, value) => {
    const newSettings = {...settings, [key]: value};
    
    // Clear redirect URL if not using redirect action
    if (key === 'expiry_action' && value !== 'redirect') {
        newSettings.redirect_url = '';
    }
    
    setSettings(newSettings);
    generateShortcode(newSettings);
};

  // Clear redirect URL if not using redirect action
        if (key === 'expiry_action' && value !== 'redirect') {
            newSettings.redirect_url = '';
        }

  

  
            const generateShortcode = (currentSettings) => {
                let attrs = [];
                
                // Only include non-default values
                if (currentSettings.text !== wcCountdownAdmin.defaultSettings.text) {
                    attrs.push(`text="${currentSettings.text}"`);
                }
                
                if (currentSettings.hours !== wcCountdownAdmin.defaultSettings.hours) {
                    attrs.push(`hours="${currentSettings.hours}"`);
                }
                
                if (currentSettings.bg_color !== wcCountdownAdmin.defaultSettings.bg_color) {
                    attrs.push(`bg_color="${currentSettings.bg_color}"`);
                }
                
                if (currentSettings.text_color !== wcCountdownAdmin.defaultSettings.text_color) {
                    attrs.push(`text_color="${currentSettings.text_color}"`);
                }
                
                if (currentSettings.label_color !== wcCountdownAdmin.defaultSettings.label_color) {
                    attrs.push(`label_color="${currentSettings.label_color}"`);
                }
                
                if (currentSettings.expired_text !== wcCountdownAdmin.defaultSettings.expired_text) {
                    attrs.push(`expired_text="${currentSettings.expired_text}"`);
                }
                
                const shortcode = `[wc_countdown_timer ${attrs.join(' ')}]`;
                setShortcode(shortcode);
                
                // Update preview
                const preview = document.querySelector('.shortcode-preview');
                if (preview) {
                    preview.textContent = shortcode;
                }
              setSettings(newSettings);
        generateShortcode(newSettings);
    };
            
            return (
                <PanelBody title={__('Timer Settings', 'wc-countdown-timer')} initialOpen={true}>
                    <PanelRow>
                        <TextControl
                            label={__('Pre-text', 'wc-countdown-timer')}
                            value={settings.text}
                            onChange={(value) => updateSetting('text', value)}
                        />
                    </PanelRow>
                    <PanelRow>
                        <RangeControl
                            label={__('Duration (hours)', 'wc-countdown-timer')}
                            value={settings.hours}
                            onChange={(value) => updateSetting('hours', value)}
                            min={1}
                            max={720}
                        />
                    </PanelRow>
                    <PanelRow>
                        <ColorPicker
                            color={settings.bg_color}
                            onChangeComplete={(value) => updateSetting('bg_color', value.hex)}
                            label={__('Background Color', 'wc-countdown-timer')}
                        />
                    </PanelRow>
                    <PanelRow>
                        <ColorPicker
                            color={settings.text_color}
                            onChangeComplete={(value) => updateSetting('text_color', value.hex)}
                            label={__('Text Color', 'wc-countdown-timer')}
                        />
                    </PanelRow>
                    <PanelRow>
                        <ColorPicker
                            color={settings.label_color}
                            onChangeComplete={(value) => updateSetting('label_color', value.hex)}
                            label={__('Label Color', 'wc-countdown-timer')}
                        />
                    </PanelRow>
                    <PanelRow>
                        <TextControl
                            label={__('Expired Text', 'wc-countdown-timer')}
                            value={settings.expired_text}
                            onChange={(value) => updateSetting('expired_text', value)}
                        />
                    </PanelRow>

 <PanelRow>
                <TextControl
                    label={__('End Time (HH:MM:SS)', 'wc-countdown-timer')}
                    value={settings.time}
                    onChange={(value) => updateSetting('time', value)}
                    help={__('Only used with date field', 'wc-countdown-timer')}
                />
            </PanelRow>
            
            <PanelRow>
                <TextControl
                    label={__('Timezone', 'wc-countdown-timer')}
                    value={settings.timezone}
                    onChange={(value) => updateSetting('timezone', value)}
                    help={__('e.g. America/New_York', 'wc-countdown-timer')}
                />
            </PanelRow>
            
            <PanelRow>
                <SelectControl
                    label={__('When Expired', 'wc-countdown-timer')}
                    value={settings.expiry_action}
                    options={[
                        { label: __('Show expired text', 'wc-countdown-timer'), value: 'show_text' },
                        { label: __('Hide timer', 'wc-countdown-timer'), value: 'hide' },
                        { label: __('Redirect to URL', 'wc-countdown-timer'), value: 'redirect' }
                    ]}
                    onChange={(value) => updateSetting('expiry_action', value)}
                />
            </PanelRow>
            
            {settings.expiry_action === 'redirect' && (
                <PanelRow>
                    <TextControl
                        label={__('Redirect URL', 'wc-countdown-timer')}
                        value={settings.redirect_url}
                        onChange={(value) => updateSetting('redirect_url', value)}
                        type="url"
                    />
                </PanelRow>
            )}
        </PanelBody>
    );
};

        wp.element.render(
            <ShortcodeGenerator />,
            document.getElementById('wc-countdown-shortcode-generator')
        );
        
        // Generate initial shortcode
        const preview = document.querySelector('.shortcode-preview');
        if (preview) {
            preview.textContent = `[wc_countdown_timer]`;
        }
    }
});