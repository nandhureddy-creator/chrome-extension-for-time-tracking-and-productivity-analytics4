// Content script for activity detection
let lastActivity = Date.now();

['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
  document.addEventListener(event, () => {
    lastActivity = Date.now();
    chrome.runtime.sendMessage({ action: 'user_active', timestamp: lastActivity });
  }, true);
});

// Check for inactivity every 10 seconds
setInterval(() => {
  const now = Date.now();
  if (now - lastActivity > 30000) { // 30 seconds inactivity
    chrome.runtime.sendMessage({ action: 'user_inactive', timestamp: now });
  }
}, 10000);