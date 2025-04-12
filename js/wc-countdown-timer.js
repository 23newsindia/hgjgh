// js/wc-countdown-timer.js
class WCCountdownTimer {
  constructor() {
    this.timers = new Map();
    this.interval = null;
    this.settings = window.wcCountdownSettings || {};
    this.init();
  }

  init() {
    this.initializeAllTimers();
    this.startGlobalInterval();
    this.setupStorageSync();
    this.setupMutationObserver();
    this.setupVisibilityHandler();
  }

  initializeAllTimers() {
    this.timers.clear();
    document.querySelectorAll('[class*="wc-countdown-timer-"]:not([data-initialized])').forEach(el => {
      this.setupTimer(el);
      el.dataset.initialized = 'true';
    });
  }

  setupTimer(element) {
    const timerId = element.id;
    const isMobile = element.classList.contains('wc-countdown-timer-mobile');
    const isCompact = element.dataset.compact === 'true';
    const expiryAction = element.dataset.expiryAction || 'show_text';
    const redirectUrl = element.dataset.redirectUrl || '';
    
    // Get end time (already converted to UTC timestamp by PHP)
    const endTime = parseInt(element.dataset.endTime) || 0;
    
    if (!endTime) {
      console.error('Invalid end time for timer:', timerId);
      return;
    }

    this.timers.set(timerId, {
      element,
      endTime,
      isMobile,
      isCompact,
      expired: false,
      expiryAction,
      redirectUrl,
      persistent: element.dataset.persistent === '1'
    });

    this.applyStyles(element, isMobile, isCompact);
    this.updateDisplay(element, endTime, isMobile, isCompact);
  }
  
  
  showExpired(element, isMobile, expiryAction, redirectUrl) {
    switch (expiryAction) {
      case 'hide':
        element.style.display = 'none';
        break;
        
      case 'redirect':
        if (redirectUrl && !this.redirected) {
          this.redirected = true;
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1500); // Small delay before redirect
        }
        // Fall through to show text if redirect fails
        
      case 'show_text':
      default:
        const expiredText = element.dataset.expiredText || 'Offer Expired';
        element.innerHTML = `
          <div class="${isMobile ? 'mobile-ui' : 'text-center'}">
            <div class="countdown-expired">${expiredText}</div>
          </div>
        `;
        break;
    }
  }

  applyStyles(element, isMobile, isCompact) {
    if (isMobile) {
      const textColor = element.dataset.textColor || '#ed2d2f';
      const numberEl = element.querySelector('.number1');
      if (numberEl) {
        numberEl.style.color = textColor;
        numberEl.style.fontWeight = '700';
      }
    } else {
      const bgColor = element.dataset.bgColor || '#dedede';
      const textColor = element.dataset.textColor || '#ed2d2f';
      const labelColor = element.dataset.labelColor || '#7b7b72';

      element.querySelectorAll('.number').forEach(el => {
        el.style.backgroundColor = bgColor;
        el.style.color = textColor;
      });

      element.querySelectorAll('.unit').forEach(el => {
        el.style.color = labelColor;
      });

      // Apply compact styles if needed
      if (isCompact) {
        element.querySelector('.countdown').style.flexWrap = 'nowrap';
        element.querySelectorAll('.time').forEach(el => {
          el.style.margin = '0 5px';
          el.style.minWidth = 'auto';
        });
        element.querySelectorAll('.number').forEach(el => {
          el.style.padding = '0 10px';
        });
        element.querySelectorAll('.unit').forEach(el => {
          el.style.fontSize = '16px';
        });
      }
    }
  }
  
  
  
  
  
  

  getPersistentTime(timerId, initialEndTime, persistent) {
    if (!persistent) return initialEndTime;
    
    const storageKey = `wc_timer_${timerId}`;
    const now = Math.floor(Date.now() / 1000);
    
    // Try to get from localStorage first
    let storedTime = localStorage.getItem(storageKey);
    
    // If no stored time or stored time is in the past, use initial time
    if (!storedTime || parseInt(storedTime) <= now) {
      storedTime = initialEndTime;
      localStorage.setItem(storageKey, storedTime);
    }
    
    return parseInt(storedTime);
  }

  applyStyles(element, isMobile) {
    if (isMobile) {
      const textColor = element.dataset.textColor || '#ed2d2f';
      const numberEl = element.querySelector('.number1');
      if (numberEl) {
        numberEl.style.color = textColor;
        numberEl.style.fontWeight = '700';
      }
    } else {
      const bgColor = element.dataset.bgColor || '#dedede';
      const textColor = element.dataset.textColor || '#ed2d2f';
      const labelColor = element.dataset.labelColor || '#7b7b72';

      element.querySelectorAll('.number').forEach(el => {
        el.style.backgroundColor = bgColor;
        el.style.color = textColor;
      });

      element.querySelectorAll('.unit').forEach(el => {
        el.style.color = labelColor;
      });
    }
  }

   // Update the interval check to include expiry action
  startGlobalInterval() {
    if (this.interval) clearInterval(this.interval);
    
    this.interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      
      this.timers.forEach((timer, timerId) => {
        if (timer.expired) return;
        
        if (timer.endTime <= now) {
          this.showExpired(
            timer.element, 
            timer.isMobile, 
            timer.expiryAction,
            timer.redirectUrl
          );
          timer.expired = true;
          if (timer.persistent) {
            localStorage.removeItem(`wc_timer_${timerId}`);
          }
        } else {
          this.updateDisplay(timer.element, timer.endTime, timer.isMobile, timer.isCompact);
        }
      });
    }, 1000);
  }

 updateDisplay(element, endTime, isMobile, isCompact) {
    const now = Math.floor(Date.now() / 1000);
    const distance = endTime - now;
    
    if (distance <= 0) {
      this.showExpired(element, isMobile);
      return;
    }
    
    const days = Math.floor(distance / 86400);
    const hours = Math.floor((distance % 86400) / 3600);
    const minutes = Math.floor((distance % 3600) / 60);
    const seconds = Math.floor(distance % 60);

    if (isMobile) {
      this.updateMobileDisplay(element, days, hours, minutes, seconds);
    } else {
      this.updateDesktopDisplay(element, days, hours, minutes, seconds, isCompact);
    }
  }

  updateDesktopDisplay(element, days, hours, minutes, seconds, isCompact) {
    const timeElements = element.querySelectorAll('.time');
    if (timeElements.length === 4) {
      timeElements[0].querySelector('.number').textContent = days.toString().padStart(2, '0');
      timeElements[1].querySelector('.number').textContent = hours.toString().padStart(2, '0');
      timeElements[2].querySelector('.number').textContent = minutes.toString().padStart(2, '0');
      timeElements[3].querySelector('.number').textContent = seconds.toString().padStart(2, '0');
      
      // Hide days if zero and in compact mode
      if (isCompact && days === 0) {
        timeElements[0].style.display = 'none';
      } else {
        timeElements[0].style.display = '';
      }
    }
  }

  updateMobileDisplay(element, days, hours, minutes, seconds) {
    const numberEl = element.querySelector('.number1');
    if (numberEl) {
      // More concise mobile display
      let displayText;
      if (days > 0) {
        displayText = `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        displayText = `${hours}h ${minutes}m ${seconds}s`;
      } else {
        displayText = `${minutes}m ${seconds}s`;
      }
      
      numberEl.textContent = displayText;
      
      // Add pulse animation when less than 1 hour remains
      if (days === 0 && hours < 1) {
        numberEl.style.animation = 'pulse 1s infinite';
      } else {
        numberEl.style.animation = '';
      }
    }
  }

  showExpired(element, isMobile) {
    const expiredText = element.dataset.expiredText || 'Offer Expired';
    element.innerHTML = `
      <div class="${isMobile ? 'mobile-ui' : 'text-center'}">
        <div class="countdown-expired">${expiredText}</div>
      </div>
    `;
  }

  setupStorageSync() {
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('wc_timer_')) {
        const timerId = event.key.replace('wc_timer_', '');
        const timer = this.timers.get(timerId);
        
        if (timer && !timer.expired) {
          const newEndTime = parseInt(event.newValue);
          if (!isNaN(newEndTime)) {
            timer.endTime = newEndTime;
            this.updateDisplay(timer.element, timer.endTime, timer.isMobile);
          }
        }
      }
    });
  }

  setupMutationObserver() {
    if (typeof MutationObserver === 'undefined') return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          this.initializeAllTimers();
          if (!this.interval) {
            this.startGlobalInterval();
          }
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.timers.forEach(timer => {
          this.updateDisplay(timer.element, timer.endTime, timer.isMobile);
        });
      }
    });
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => new WCCountdownTimer());