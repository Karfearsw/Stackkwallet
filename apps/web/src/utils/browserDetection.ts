export type BrowserType = 'chrome' | 'firefox' | 'edge' | 'safari' | 'opera' | 'unknown'

export interface BrowserInfo {
  type: BrowserType
  name: string
  supportsExtensions: boolean
  installInstructions: string[]
}

export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent.toLowerCase()
  
  // Chrome (must be checked before Safari since Chrome includes Safari in UA)
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    return {
      type: 'chrome',
      name: 'Google Chrome',
      supportsExtensions: true,
      installInstructions: [
        'Download the Stackk Wallet extension package',
        'Open Chrome and go to chrome://extensions/',
        'Enable "Developer mode" in the top right corner',
        'Click "Load unpacked" and select the extracted extension folder',
        'The Stackk Wallet extension will appear in your extensions list'
      ]
    }
  }
  
  // Edge
  if (userAgent.includes('edg')) {
    return {
      type: 'edge',
      name: 'Microsoft Edge',
      supportsExtensions: true,
      installInstructions: [
        'Download the Stackk Wallet extension package',
        'Open Edge and go to edge://extensions/',
        'Enable "Developer mode" in the left sidebar',
        'Click "Load unpacked" and select the extracted extension folder',
        'The Stackk Wallet extension will appear in your extensions list'
      ]
    }
  }
  
  // Firefox
  if (userAgent.includes('firefox')) {
    return {
      type: 'firefox',
      name: 'Mozilla Firefox',
      supportsExtensions: true,
      installInstructions: [
        'Download the Stackk Wallet extension package',
        'Open Firefox and go to about:debugging',
        'Click "This Firefox" in the left sidebar',
        'Click "Load Temporary Add-on"',
        'Select the manifest.json file from the extracted extension folder',
        'The extension will be loaded temporarily (until Firefox restart)'
      ]
    }
  }
  
  // Safari
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return {
      type: 'safari',
      name: 'Safari',
      supportsExtensions: false,
      installInstructions: [
        'Safari extensions require different packaging',
        'Please use Chrome, Firefox, or Edge for the best experience',
        'Or visit our GitHub repository for more installation options'
      ]
    }
  }
  
  // Opera
  if (userAgent.includes('opera') || userAgent.includes('opr')) {
    return {
      type: 'opera',
      name: 'Opera',
      supportsExtensions: true,
      installInstructions: [
        'Download the Stackk Wallet extension package',
        'Open Opera and go to opera://extensions/',
        'Enable "Developer mode" in the top right corner',
        'Click "Load unpacked" and select the extracted extension folder',
        'The Stackk Wallet extension will appear in your extensions list'
      ]
    }
  }
  
  return {
    type: 'unknown',
    name: 'Unknown Browser',
    supportsExtensions: false,
    installInstructions: [
      'Your browser may not support extensions',
      'Please use Chrome, Firefox, Edge, or Opera for the best experience',
      'Visit our GitHub repository for more installation options'
    ]
  }
}

export function getBrowserIcon(browserType: BrowserType): string {
  switch (browserType) {
    case 'chrome':
      return '🌐'
    case 'firefox':
      return '🦊'
    case 'edge':
      return '🔷'
    case 'safari':
      return '🧭'
    case 'opera':
      return '🎭'
    default:
      return '🌍'
  }
}