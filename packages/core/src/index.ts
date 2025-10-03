export { generateMnemonic, mnemonicToSeedBytes, deriveSolanaKeypair } from './keys.js'
export type { KeypairInfo } from './keys.js'

// Storage utilities
export {
  saveWalletToStorage,
  loadWalletFromStorage,
  clearWalletFromStorage,
  isWalletPersistenceEnabled,
  setWalletPersistenceMode,
  isWalletBackupConfirmed,
  setWalletBackupConfirmed,
  hasStoredWallet,
  getWalletAge
} from './storage.js'
export type { StoredWalletData } from './storage.js'