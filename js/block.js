/**
 * WordPress dependencies
 */
const { __ } = wp.i18n;
const { registerBlockType } = wp.blocks;
const { InspectorControls } = wp.blockEditor;
const { PanelBody, TextControl, RangeControl, ToggleControl, SelectControl } = wp.components;
const { useState, useEffect } = wp.element;

/**
 * Register Countdown Timer Block
 */
registerBlockType('wc-countdown-timer/countdown', {
    title: __('WC Countdown Timer', 'wc-countdown-timer'),
    description: __('Add a WooCommerce countdown timer to your content.', 'wc-countdown-timer'),
    icon: 'clock',
    category: 'woocommerce',
    keywords: [__('countdown', 'wc-countdown-timer'), __('timer', 'wc-countdown-timer'), __('woocommerce', 'wc-countdown-timer')],
    attributes: {
        id: {
            type: 'string',
            default: ''
        },
        text: {
            type: 'string',
            default: wcCountdownAdmin.defaultSettings.text
        },
        hours: {
            type: 'number',
            default: wcCountdownAdmin.defaultSettings.hours
        },
        date: {
            type: 'string',
            default: ''
        },
        time: {
            type: 'string',
            default: '00:00:00'
        },
        timezone: {
            type: 'string',
            default: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        bg_color: {
            type: 'string',
            default: wcCountdownAdmin.defaultSettings.bg_color
        },
        text_color: {
            type: 'string',
            default: wcCountdownAdmin.defaultSettings.text_color
        },
        label_color: {
            type: 'string',
            default: wcCountdownAdmin.defaultSettings.label_color
        },
        expired_text: {
            type: 'string',
            default: wcCountdownAdmin.defaultSettings.expired_text
        },
        compact: {
            type: 'boolean',
            default: false
        },
        expiry_action: {
            type: 'string',
            default: 'show_text'
        },
        redirect_url: {
            type: 'string',
            default: ''
        }
    },

    edit: ({ attributes, setAttributes }) => {
        const {
            id,
            text,
            hours,
            date,
            time,
            timezone,
            bg_color,
            text_color,
            label_color,
            expired_text,
            compact,
            expiry_action,
            redirect_url
        } = attributes;

        // Generate a random ID if none exists
        useEffect(() => {
            if (!id) {
                setAttributes({ id: 'wc-timer-' + Math.random().toString(36).substr(2, 9) });
            }
        }, []);

        return (
            <div className="wc-countdown-timer-block">
                <InspectorControls>
                    <PanelBody title={__('Timer Settings', 'wc-countdown-timer')}>
                        <TextControl
                            label={__('Pre-text', 'wc-countdown-timer')}
                            value={text}
                            onChange={(value) => setAttributes({ text: value })}
                        />
                        
                        <RangeControl
                            label={__('Duration (hours)', 'wc-countdown-timer')}
                            value={hours}
                            onChange={(value) => setAttributes({ hours: value })}
                            min={1}
                            max={720}
                        />
                        
                        <TextControl
                            label={__('End Date (YYYY-MM-DD)', 'wc-countdown-timer')}
                            value={date}
                            onChange={(value) => setAttributes({ date: value })}
                            help={__('Leave empty to use duration', 'wc-countdown-timer')}
                        />
                        
                        {date && (
                            <>
                                <TextControl
                                    label={__('End Time (HH:MM:SS)', 'wc-countdown-timer')}
                                    value={time}
                                    onChange={(value) => setAttributes({ time: value })}
                                />
                                
                                <TextControl
                                    label={__('Timezone', 'wc-countdown-timer')}
                                    value={timezone}
                                    onChange={(value) => setAttributes({ timezone: value })}
                                    help={__('e.g. America/New_York', 'wc-countdown-timer')}
                                />
                            </>
                        )}
                        
                        <TextControl
                            label={__('Background Color', 'wc-countdown-timer')}
                            value={bg_color}
                            onChange={(value) => setAttributes({ bg_color: value })}
                        />
                        
                        <TextControl
                            label={__('Text Color', 'wc-countdown-timer')}
                            value={text_color}
                            onChange={(value) => setAttributes({ text_color: value })}
                        />
                        
                        <TextControl
                            label={__('Label Color', 'wc-countdown-timer')}
                            value={label_color}
                            onChange={(value) => setAttributes({ label_color: value })}
                        />
                        
                        <TextControl
                            label={__('Expired Text', 'wc-countdown-timer')}
                            value={expired_text}
                            onChange={(value) => setAttributes({ expired_text: value })}
                        />
                        
                        <ToggleControl
                            label={__('Compact Mode', 'wc-countdown-timer')}
                            checked={compact}
                            onChange={(value) => setAttributes({ compact: value })}
                        />
                        
                        <SelectControl
                            label={__('When Expired', 'wc-countdown-timer')}
                            value={expiry_action}
                            options={[
                                { label: __('Show expired text', 'wc-countdown-timer'), value: 'show_text' },
                                { label: __('Hide timer', 'wc-countdown-timer'), value: 'hide' },
                                { label: __('Redirect to URL', 'wc-countdown-timer'), value: 'redirect' }
                            ]}
                            onChange={(value) => setAttributes({ expiry_action: value })}
                        />
                        
                        {expiry_action === 'redirect' && (
                            <TextControl
                                label={__('Redirect URL', 'wc-countdown-timer')}
                                value={redirect_url}
                                onChange={(value) => setAttributes({ redirect_url: value })}
                                type="url"
                            />
                        )}
                    </PanelBody>
                </InspectorControls>
                
                <div className="wc-countdown-timer-preview">
                    <div className="wc-countdown-timer-desktop">
                        <div className="text-center timer">
                            <span className="pretext">{text}</span>
                            <div className="countdown">
                                <div className="time">
                                    <div className="unit text-uppercase">days</div>
                                    <span className="number">00</span>
                                </div>
                                <div className="time">
                                    <div className="unit text-uppercase">hours</div>
                                    <span className="number">00</span>
                                </div>
                                <div className="time">
                                    <div className="unit text-uppercase">minutes</div>
                                    <span className="number">00</span>
                                </div>
                                <div className="time">
                                    <div className="unit text-uppercase">seconds</div>
                                    <span className="number">00</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="wc-countdown-timer-mobile">
                        <div className="text-center mobile-ui">
                            <span className="pretext1">{text}</span>
                            <div className="mobileUI countdown pt-0 pb-2">
                                <span className="number1">00 day : 00 hrs : 00 min : 00 sec</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    },

    save: () => {
        // Save handled by shortcode on frontend
        return null;
    }
});