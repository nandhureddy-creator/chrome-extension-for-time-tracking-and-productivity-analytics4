// Productivity Tracker Extension JavaScript

class ProductivityTracker {
    constructor() {
        this.isTracking = false;
        this.currentTimer = 0;
        this.currentWebsite = 'No active site';
        this.sessionData = new Map();
        this.websiteCategories = new Map([
            ['github.com', 'productive'],
            ['stackoverflow.com', 'productive'],
            ['docs.google.com', 'productive'],
            ['youtube.com', 'unproductive'],
            ['facebook.com', 'unproductive'],
            ['twitter.com', 'unproductive']
        ]);
        this.dailyData = {
            productive: 0,
            unproductive: 0,
            neutral: 0
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startTimer();
        this.loadDemoData();
        this.loadFromStorage();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Tracking controls
        const startBtn = document.getElementById('start-tracking');
        const pauseBtn = document.getElementById('pause-tracking');
        const resetBtn = document.getElementById('reset-tracking');

        if (startBtn) startBtn.addEventListener('click', () => this.startTracking());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pauseTracking());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetTracking());

        // Settings save
        const saveBtn = document.querySelector('#settings .btn-primary');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveSettings());
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
        const targetContent = document.getElementById(tabName);
        
        if (targetTab) targetTab.classList.add('active');
        if (targetContent) targetContent.classList.add('active');
    }

    startTracking() {
        this.isTracking = true;
        this.updateTrackingStatus();
        this.showNotification('Productivity tracking started! 🚀');
        this.simulateWebsiteActivity();
        this.saveToStorage();
        
        // Send message to background script
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({action: 'start_tracking'});
        }
    }

    pauseTracking() {
        this.isTracking = false;
        this.updateTrackingStatus();
        this.showNotification('Tracking paused ⏸️');
        this.saveToStorage();
        
        // Send message to background script
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({action: 'pause_tracking'});
        }
    }

    resetTracking() {
        this.currentTimer = 0;
        this.currentWebsite = 'No active site';
        this.updateTimerDisplay();
        this.updateTrackingStatus();
        this.showNotification('Timer reset! 🔄');
        this.saveToStorage();
    }

    startTimer() {
        setInterval(() => {
            if (this.isTracking) {
                this.currentTimer++;
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const hours = Math.floor(this.currentTimer / 3600);
        const minutes = Math.floor((this.currentTimer % 3600) / 60);
        const seconds = this.currentTimer % 60;
        
        const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timerElement = document.getElementById('timer-display');
        if (timerElement) {
            timerElement.textContent = display;
        }
        
        // Update popup timer if visible
        const popupTimer = document.querySelector('#extension-popup .timer-display');
        if (popupTimer) {
            popupTimer.textContent = display;
        }
    }

    updateTrackingStatus() {
        const statusElement = document.getElementById('tracking-status');
        const websiteElement = document.getElementById('current-website');
        
        if (statusElement) {
            if (this.isTracking) {
                statusElement.textContent = '🔴 Tracking Active';
                statusElement.style.color = '#28a745';
            } else {
                statusElement.textContent = '⏸️ Tracking Paused';
                statusElement.style.color = '#ffc107';
            }
        }
        
        if (websiteElement) {
            websiteElement.textContent = this.currentWebsite;
        }
    }

    simulateWebsiteActivity() {
        const websites = ['github.com', 'stackoverflow.com', 'docs.google.com', 'youtube.com', 'gmail.com'];
        
        setInterval(() => {
            if (this.isTracking) {
                const randomWebsite = websites[Math.floor(Math.random() * websites.length)];
                this.currentWebsite = randomWebsite;
                this.updateTrackingStatus();
                
                // Update session data
                if (!this.sessionData.has(randomWebsite)) {
                    this.sessionData.set(randomWebsite, 0);
                }
                this.sessionData.set(randomWebsite, this.sessionData.get(randomWebsite) + 1);
            }
        }, 15000); // Change website every 15 seconds
    }

    loadDemoData() {
        // Simulate daily productive/unproductive time
        this.dailyData.productive = 6.5 * 3600; // 6.5 hours in seconds
        this.dailyData.unproductive = 2.1 * 3600; // 2.1 hours in seconds
        this.dailyData.neutral = 1.4 * 3600; // 1.4 hours in seconds
        
        this.updateDailyStats();
    }

    updateDailyStats() {
        const productiveHours = Math.floor(this.dailyData.productive / 3600);
        const productiveMinutes = Math.floor((this.dailyData.productive % 3600) / 60);
        const unproductiveHours = Math.floor(this.dailyData.unproductive / 3600);
        const unproductiveMinutes = Math.floor((this.dailyData.unproductive % 3600) / 60);
        
        const productiveElement = document.getElementById('today-productive');
        const unproductiveElement = document.getElementById('today-unproductive');
        
        if (productiveElement) {
            productiveElement.textContent = `${productiveHours}h ${productiveMinutes}m`;
        }
        if (unproductiveElement) {
            unproductiveElement.textContent = `${unproductiveHours}h ${unproductiveMinutes}m`;
        }
    }

    saveSettings() {
        this.showNotification('Settings saved successfully! 💾');
        this.saveToStorage();
    }

    showNotification(message) {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    }

    // Website categorization
    categorizeWebsite(url) {
        const domain = this.extractDomain(url);
        return this.websiteCategories.get(domain) || 'neutral';
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url.replace('www.', '');
        }
    }

    // Export data functionality
    exportData() {
        const data = {
            sessionData: Object.fromEntries(this.sessionData),
            dailyData: this.dailyData,
            websiteCategories: Object.fromEntries(this.websiteCategories),
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `productivity-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Data exported successfully! 📁');
    }

    // Generate productivity score
    calculateProductivityScore() {
        const total = this.dailyData.productive + this.dailyData.unproductive + this.dailyData.neutral;
        if (total === 0) return 0;
        
        const score = (this.dailyData.productive / total) * 100;
        return Math.round(score);
    }

    // Update analytics in real-time
    updateAnalytics() {
        const score = this.calculateProductivityScore();
        const scoreElement = document.querySelector('.stat-card .stat-value');
        if (scoreElement) {
            scoreElement.textContent = `${score}%`;
        }
    }

    // Chrome storage integration
    saveToStorage() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({
                'isTracking': this.isTracking,
                'currentTimer': this.currentTimer,
                'currentWebsite': this.currentWebsite,
                'dailyData': this.dailyData,
                'sessionData': Object.fromEntries(this.sessionData)
            });
        }
    }

    loadFromStorage() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get([
                'isTracking',
                'currentTimer', 
                'currentWebsite',
                'dailyData',
                'sessionData'
            ], (result) => {
                if (result.isTracking !== undefined) {
                    this.isTracking = result.isTracking;
                }
                if (result.currentTimer) {
                    this.currentTimer = result.currentTimer;
                }
                if (result.currentWebsite) {
                    this.currentWebsite = result.currentWebsite;
                }
                if (result.dailyData) {
                    this.dailyData = result.dailyData;
                }
                if (result.sessionData) {
                    this.sessionData = new Map(Object.entries(result.sessionData));
                }
                
                this.updateTimerDisplay();
                this.updateTrackingStatus();
                this.updateDailyStats();
            });
        }
    }
}

// Popup interface functions
function togglePopup() {
    const popup = document.getElementById('extension-popup');
    const overlay = document.getElementById('popup-overlay');
    
    if (popup && overlay) {
        if (popup.classList.contains('show')) {
            popup.classList.remove('show');
            overlay.classList.remove('show');
        } else {
            popup.classList.add('show');
            overlay.classList.add('show');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the tracker globally so background updates can reach it
    window.tracker = new ProductivityTracker();

    // Close popup when clicking overlay
    const overlay = document.getElementById('popup-overlay');
    if (overlay) {
        overlay.addEventListener('click', togglePopup);
    }

    // Add export functionality
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            window.tracker.exportData();
        }
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.altKey) {
            switch(e.key) {
                case '1':
                    window.tracker.switchTab('tracker');
                    break;
                case '2':
                    window.tracker.switchTab('analytics');
                    break;
                case '3':
                    window.tracker.switchTab('reports');
                    break;
                case '4':
                    window.tracker.switchTab('settings');
                    break;
            }
        }
    });

    // Auto-save settings
    const settingsInputs = document.querySelectorAll('#settings input, #settings select');
    settingsInputs.forEach(input => {
        input.addEventListener('change', () => {
            window.tracker.showNotification('Settings auto-saved 💾');
            window.tracker.saveToStorage();
        });
    });

    // Initialize real-time updates
    setInterval(() => {
        window.tracker.updateAnalytics();
        window.tracker.saveToStorage();
    }, 60000);

    console.log('🎯 Productivity Tracker Extension Loaded Successfully!');
});


// Listen for messages from background script
if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'website_changed') {
            // Update current website when tab changes
            const tracker = window.tracker;
            if (tracker) {
                tracker.currentWebsite = request.website;
                tracker.updateTrackingStatus();
            }
        }
        sendResponse({received: true});
    });
}
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the tracker
    window.tracker = new ProductivityTracker();

    // Close popup when clicking overlay
    const overlay = document.getElementById('popup-overlay');
    if (overlay) {
        overlay.addEventListener('click', togglePopup);
    }

    // ... rest of your existing DOMContentLoaded code ...
});
