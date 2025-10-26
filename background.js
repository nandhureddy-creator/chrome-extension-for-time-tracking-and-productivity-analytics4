// background.js - updated to handle messages from popup & content scripts,
// maintain session timers, and notify popup when active site changes.

let isTracking = false;
let isActive = true; // whether user is active (content.js inactivity detection)
let currentWebsite = '';
let sessionData = {}; // { "domain.com": { time: seconds, category: 'productive' } }
let timerInterval = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['sessionData', 'isTracking'], (res) => {
    sessionData = res.sessionData || {};
    isTracking = !!res.isTracking;
    if (isTracking) startTicker();
  });
});

// Listen for messages from popup.js or content.js
// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'start_tracking') {
    isTracking = true;
    console.log('✅ Tracking started');
  } 
  else if (message.action === 'pause_tracking') {
    isTracking = false;
    console.log('⏸️ Tracking paused');
  }
  sendResponse({ status: 'ok' });
});


// Tab activation / navigation handling — update current website when user switches tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) updateCurrentWebsite(tab.url);
  } catch (e) {
    // ignore
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active && tab.url) {
    updateCurrentWebsite(tab.url);
  }
});

function updateCurrentWebsite(urlOrDomain) {
  let domain = '';
  try {
    // Accept full URL or domain string
    if (urlOrDomain.startsWith('http') || urlOrDomain.includes('://')) {
      domain = new URL(urlOrDomain).hostname.replace(/^www\./, '');
    } else {
      domain = urlOrDomain.replace(/^www\./, '');
    }
  } catch (e) {
    domain = 'unknown';
  }

  if (!domain) domain = 'unknown';

  if (!sessionData[domain]) {
    sessionData[domain] = { time: 0, category: categorizeWebsite(domain) };
  }

  currentWebsite = domain;
  // persist current website and session data
  chrome.storage.local.set({ currentWebsite: domain, sessionData });

  // Notify popup(s) that website changed
  notifyPopupWebsiteChanged(domain);
}

function categorizeWebsite(domain) {
  const productive = ['github.com', 'stackoverflow.com', 'docs.google.com'];
  const unproductive = ['youtube.com', 'facebook.com', 'twitter.com'];
  
  if (productive.some(site => domain.includes(site))) return 'productive';
  if (unproductive.some(site => domain.includes(site))) return 'unproductive';
  return 'neutral';
}

// Start per-second ticker to add time to the active domain
function startTicker() {
  if (timerInterval) return; // already running
  timerInterval = setInterval(() => {
    if (!isTracking || !isActive || !currentWebsite) return;

    if (!sessionData[currentWebsite]) {
      sessionData[currentWebsite] = { time: 0, category: categorizeWebsite(currentWebsite) };
    }

    sessionData[currentWebsite].time = (sessionData[currentWebsite].time || 0) + 1;

    // Save periodically (you can throttle this if needed)
    chrome.storage.local.set({ sessionData });

    // Optionally notify popup every few seconds for realtime UI
    // Keep small to avoid spamming; we send each 5 seconds
    if (sessionData[currentWebsite].time % 5 === 0) {
      notifyPopupWebsiteChanged(currentWebsite);
    }
  }, 1000);
}

function stopTicker() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function notifyPopupWebsiteChanged(domain) {
  // Send a message that popup.js is already listening for
  chrome.runtime.sendMessage({ action: 'website_changed', website: domain }, (resp) => {
    // silent
  });
}

function notifyPopupSessionData() {
  chrome.runtime.sendMessage({ action: 'session_data_updated', sessionData }, () => {});
}
