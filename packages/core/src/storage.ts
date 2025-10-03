/**
 * Secure wallet storage utilities for Stackk Wallet
 * Handles localStorage operations for wallet persistence
 */

export interface StoredWalletData {
  mnemonic: string
  address: string
  timestamp: number
}

const STORAGE_KEYS = {
  WALLET_DATA: 'stackk-wallet-data',
  PERSISTENCE_MODE: 'stackk-wallet-persistence-mode',
  BACKUP_CONFIRMED: 'stackk-wallet-backup-confirmed'
} as const

/**
 * Save wallet data to localStorage with encryption-like obfuscation
 */
export function saveWalletToStorage(mnemonic: string, address: string): void {
  try {
    const walletData: StoredWalletData = {
      mnemonic: btoa(mnemonic), // Basic encoding (not true encryption)
      address,
      timestamp: Date.now()
    }
    
    localStorage.setItem(STORAGE_KEYS.WALLET_DATA, JSON.stringify(walletData))
  } catch (error) {
    console.error('Failed to save wallet to storage:', error)
    throw new Error('Unable to save wallet data')
  }
}

/**
 * Load wallet data from localStorage
 */
export function loadWalletFromStorage(): StoredWalletData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WALLET_DATA)
    if (!stored) return null
    
    const walletData = JSON.parse(stored) as StoredWalletData
    
    // Decode the mnemonic
    walletData.mnemonic = atob(walletData.mnemonic)
    
    return walletData
  } catch (error) {
    console.error('Failed to load wallet from storage:', error)
    return null
  }
}

/**
 * Clear all wallet data from localStorage
 */
export function clearWalletFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.WALLET_DATA)
    localStorage.removeItem(STORAGE_KEYS.BACKUP_CONFIRMED)
  } catch (error) {
    console.error('Failed to clear wallet from storage:', error)
  }
}

/**
 * Check if wallet persistence mode is enabled
 */
export function isWalletPersistenceEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.PERSISTENCE_MODE) === 'true'
  } catch (error) {
    return false
  }
}

/**
 * Set wallet persistence mode
 */
export function setWalletPersistenceMode(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PERSISTENCE_MODE, enabled.toString())
    
    // If disabling persistence, clear stored wallet data
    if (!enabled) {
      clearWalletFromStorage()
    }
  } catch (error) {
    console.error('Failed to set wallet persistence mode:', error)
  }
}

/**
 * Check if wallet backup has been confirmed
 */
export function isWalletBackupConfirmed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.BACKUP_CONFIRMED) === 'true'
  } catch (error) {
    return false
  }
}

/**
 * Set wallet backup confirmation status
 */
export function setWalletBackupConfirmed(confirmed: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BACKUP_CONFIRMED, confirmed.toString())
  } catch (error) {
    console.error('Failed to set wallet backup confirmation:', error)
  }
}

/**
 * Check if a stored wallet exists
 */
export function hasStoredWallet(): boolean {
  return loadWalletFromStorage() !== null
}

/**
 * Get wallet age in days
 */
export function getWalletAge(): number | null {
  const walletData = loadWalletFromStorage()
  if (!walletData) return null
  
  const ageInMs = Date.now() - walletData.timestamp
  return Math.floor(ageInMs / (1000 * 60 * 60 * 24))
}