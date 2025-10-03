// Background script for Stackk Wallet Extension
// This service worker handles extension lifecycle and persistent connections

// Extension installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Stackk Wallet Extension installed/updated:', details.reason);
  
  // Initialize default settings
  chrome.storage.local.set({
    network: 'mainnet-beta',
    autoConnect: false,
    theme: 'dark'
  });
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Stackk Wallet Extension started');
});

// Message handling between popup and background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.type) {
    case 'GET_NETWORK_STATUS':
      // Handle network status requests
      sendResponse({ status: 'connected', network: 'mainnet-beta' });
      break;
      
    case 'STORE_WALLET_DATA':
      // Securely store wallet data
      chrome.storage.local.set(request.data, () => {
        sendResponse({ success: true });
      });
      return true; // Keep message channel open for async response
      
    case 'GET_WALLET_DATA':
      // Retrieve wallet data
      chrome.storage.local.get(request.keys, (result) => {
        sendResponse(result);
      });
      return true; // Keep message channel open for async response
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

// Handle tab updates for dApp connections
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is a dApp that might need wallet connection
    const url = new URL(tab.url);
    if (url.protocol === 'https:' && !url.hostname.includes('chrome-extension')) {
      console.log('Tab updated:', url.hostname);
    }
  }
});

// Keep service worker alive
let keepAliveInterval;

function keepAlive() {
  keepAliveInterval = setInterval(() => {
    chrome.runtime.getPlatformInfo(() => {
      // This keeps the service worker active
    });
  }, 20000); // Every 20 seconds
}

// Start keep alive
keepAlive();

// Clean up on suspend
chrome.runtime.onSuspend.addListener(() => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
});