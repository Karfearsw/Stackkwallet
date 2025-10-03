import { useState, useEffect } from 'react'
import { 
  generateMnemonic, 
  mnemonicToSeedBytes, 
  deriveSolanaKeypair, 
  type KeypairInfo,
  saveWalletToStorage,
  loadWalletFromStorage,
  clearWalletFromStorage,
  isWalletPersistenceEnabled,
  setWalletPersistenceMode,
  hasStoredWallet
} from '@stackk/core'
import { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction, Keypair } from '@solana/web3.js'
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction, 
  createTransferInstruction,
  getAccount,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount
} from '@solana/spl-token'
import './App.css'

type SolanaNetwork = 'devnet' | 'mainnet-beta'

const NETWORK_ENDPOINTS = {
  'devnet': 'https://api.devnet.solana.com',
  'mainnet-beta': 'https://api.mainnet-beta.solana.com'
}

interface TokenInfo {
  mint: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

const POPULAR_TOKENS: Record<SolanaNetwork, TokenInfo[]> = {
  'mainnet-beta': [
    {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
    },
    {
      mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png'
    },
    {
      mint: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      name: 'Wrapped SOL',
      decimals: 9,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
    },
    {
      mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
      symbol: 'mSOL',
      name: 'Marinade staked SOL',
      decimals: 9,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png'
    }
  ],
  'devnet': [
    {
      mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      symbol: 'USDC',
      name: 'USD Coin (Devnet)',
      decimals: 6
    },
    {
      mint: 'EhYXQP36zMnKXZj2eiZAnUdqNBCBXQKxVaKUJKjqjzuN',
      symbol: 'USDT',
      name: 'Tether USD (Devnet)',
      decimals: 6
    }
  ]
}

interface TokenBalance {
  mint: string
  balance: number
  decimals: number
  symbol: string
  name: string
  logoURI?: string
}

function App() {
  const [mnemonic, setMnemonic] = useState<string>('')
  const [address, setAddress] = useState<string>('')
  const [balance, setBalance] = useState<number>(0)
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [recipientAddress, setRecipientAddress] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [selectedToken, setSelectedToken] = useState<string>('SOL')
  const [isTransferring, setIsTransferring] = useState<boolean>(false)
  const [network, setNetwork] = useState<SolanaNetwork>(() => {
    return (localStorage.getItem('solana-network') as SolanaNetwork) || 'devnet'
  })
  const [showNetworkWarning, setShowNetworkWarning] = useState<boolean>(false)
  const [showMnemonic, setShowMnemonic] = useState<boolean>(false)
  const [mnemonicBackedUp, setMnemonicBackedUp] = useState<boolean>(false)
  const [mnemonicCopied, setMnemonicCopied] = useState<boolean>(false)
  const [isCreatingToken, setIsCreatingToken] = useState<boolean>(false)
  const [createdTokenMint, setCreatedTokenMint] = useState<string>('')
  const [tokenSupply, setTokenSupply] = useState<string>('1000000')
  const [isMinting, setIsMinting] = useState<boolean>(false)
  const [mintAmount, setMintAmount] = useState<string>('1000')
  const [keypair, setKeypair] = useState<KeypairInfo | null>(null)

  const [walletPersistenceEnabled, setWalletPersistenceEnabled] = useState<boolean>(() => {
    return isWalletPersistenceEnabled()
  })
  const [showWalletSettings, setShowWalletSettings] = useState<boolean>(false)

  const connection = new Connection(NETWORK_ENDPOINTS[network])

  useEffect(() => {
    initializeWallet()
  }, [])

  useEffect(() => {
    if (address) {
      fetchBalance()
      fetchTokenBalances()
      const interval = setInterval(() => {
        fetchBalance()
        fetchTokenBalances()
      }, 10000) // Update balance every 10 seconds
      return () => clearInterval(interval)
    }
  }, [address, network]) // Re-fetch balance when network changes

  const handleNetworkChange = (newNetwork: SolanaNetwork) => {
    if (newNetwork === 'mainnet-beta' && network === 'devnet') {
      setShowNetworkWarning(true)
      return
    }
    
    setNetwork(newNetwork)
    localStorage.setItem('solana-network', newNetwork)
    // Reset balance when switching networks
    setBalance(0)
    setTokenBalances([])
  }

  const confirmNetworkSwitch = () => {
    setNetwork('mainnet-beta')
    localStorage.setItem('solana-network', 'mainnet-beta')
    setShowNetworkWarning(false)
    setBalance(0)
    setTokenBalances([])
  }

  const initializeWallet = async () => {
    if (walletPersistenceEnabled && hasStoredWallet()) {
      // Load existing wallet
      const storedWallet = loadWalletFromStorage()
      if (storedWallet) {
        setMnemonic(storedWallet.mnemonic)
        setAddress(storedWallet.address)
        
        // Recreate keypair from stored mnemonic
        const seed = await mnemonicToSeedBytes(storedWallet.mnemonic)
        const restoredKeypair = deriveSolanaKeypair(seed)
        setKeypair(restoredKeypair)
        return
      }
    }
    
    // Generate new wallet
    await generateWallet()
  }

  const generateWallet = async () => {
    const newMnemonic = await generateMnemonic()
    const seed = await mnemonicToSeedBytes(newMnemonic)
    const newKeypair = deriveSolanaKeypair(seed)
    
    setMnemonic(newMnemonic)
    setAddress(newKeypair.publicKey)
    setKeypair(newKeypair)

    // Save to storage if persistence is enabled
    if (walletPersistenceEnabled) {
      saveWalletToStorage(newMnemonic, newKeypair.publicKey)
    }
  }

  const toggleWalletPersistence = (enabled: boolean) => {
    setWalletPersistenceEnabled(enabled)
    setWalletPersistenceMode(enabled)
    
    if (enabled && mnemonic && address) {
      // Save current wallet when enabling persistence
      saveWalletToStorage(mnemonic, address)
    } else if (!enabled) {
      // Clear stored wallet when disabling persistence
      clearWalletFromStorage()
    }
  }

  const clearStoredWallet = async () => {
    clearWalletFromStorage()
    // Generate new wallet
    await generateWallet()
  }

  const fetchBalance = async () => {
    if (!address) return
    
    try {
      const publicKey = new PublicKey(address)
      const balanceInLamports = await connection.getBalance(publicKey)
      setBalance(balanceInLamports / LAMPORTS_PER_SOL)
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const fetchTokenBalances = async () => {
    if (!address) return

    try {
      const publicKey = new PublicKey(address)
      const tokens = POPULAR_TOKENS[network]
      const balances: TokenBalance[] = []

      for (const token of tokens) {
        try {
          const mintPublicKey = new PublicKey(token.mint)
          const associatedTokenAddress = await getAssociatedTokenAddress(
            mintPublicKey,
            publicKey
          )

          const tokenAccount = await getAccount(connection, associatedTokenAddress)
          const balance = Number(tokenAccount.amount) / Math.pow(10, token.decimals)

          if (balance > 0) {
            balances.push({
              mint: token.mint,
              balance,
              decimals: token.decimals,
              symbol: token.symbol,
              name: token.name,
              logoURI: token.logoURI
            })
          }
        } catch (error) {
          if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
            // Token account doesn't exist, which is normal
            continue
          }
          console.error(`Error fetching balance for ${token.symbol}:`, error)
        }
      }

      setTokenBalances(balances)
    } catch (error) {
      console.error('Error fetching token balances:', error)
    }
  }

  const transferAsset = async () => {
    if (!address || !recipientAddress || !amount) return

    setIsTransferring(true)
    try {
      if (!keypair) {
        throw new Error('Keypair not available')
      }

      const fromPublicKey = new PublicKey(address)
      const toPublicKey = new PublicKey(recipientAddress)
      const solanaKeypair = Keypair.fromSecretKey(keypair.secretKey)

      if (selectedToken === 'SOL') {
        // Transfer SOL
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: fromPublicKey,
            toPubkey: toPublicKey,
            lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
          })
        )

        const signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [solanaKeypair]
        )

        console.log('SOL transfer successful:', signature)
      } else {
        // Transfer SPL Token
        const selectedTokenInfo = tokenBalances.find(t => t.symbol === selectedToken)
        if (!selectedTokenInfo) {
          throw new Error('Selected token not found')
        }

        const mintPublicKey = new PublicKey(selectedTokenInfo.mint)
        const fromTokenAccount = await getAssociatedTokenAddress(
          mintPublicKey,
          fromPublicKey
        )
        const toTokenAccount = await getAssociatedTokenAddress(
          mintPublicKey,
          toPublicKey
        )

        const transaction = new Transaction()

        // Check if recipient token account exists
        try {
          await getAccount(connection, toTokenAccount)
        } catch (error) {
          if (error instanceof TokenAccountNotFoundError) {
            // Create associated token account for recipient
            transaction.add(
              createAssociatedTokenAccountInstruction(
                fromPublicKey, // payer
                toTokenAccount, // associated token account
                toPublicKey, // owner
                mintPublicKey // mint
              )
            )
          }
        }

        // Add transfer instruction
        transaction.add(
          createTransferInstruction(
            fromTokenAccount,
            toTokenAccount,
            fromPublicKey,
            parseFloat(amount) * Math.pow(10, selectedTokenInfo.decimals)
          )
        )

        const signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [solanaKeypair]
        )

        console.log('Token transfer successful:', signature)
      }

      // Reset form
      setRecipientAddress('')
      setAmount('')
      
      // Refresh balances
      fetchBalance()
      fetchTokenBalances()
    } catch (error) {
      console.error('Transfer failed:', error)
      alert('Transfer failed: ' + (error as Error).message)
    } finally {
      setIsTransferring(false)
    }
  }

  const createToken = async () => {
    if (!address || !tokenSupply) return

    setIsCreatingToken(true)
    try {
      if (!keypair) {
        throw new Error('Keypair not available')
      }

      const publicKey = new PublicKey(address)
      const solanaKeypair = Keypair.fromSecretKey(keypair.secretKey)

      // Create mint
      const mint = await createMint(
        connection,
        solanaKeypair, // payer
        publicKey, // mint authority
        publicKey, // freeze authority
        9 // decimals
      )

      console.log('Token mint created:', mint.toBase58())
      setCreatedTokenMint(mint.toBase58())

      // Create associated token account and mint tokens
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        solanaKeypair, // payer
        mint, // mint
        publicKey // owner
      )

      await mintTo(
        connection,
        solanaKeypair, // payer
        mint, // mint
        tokenAccount.address, // destination
        publicKey, // authority
        parseInt(tokenSupply) * Math.pow(10, 9) // amount (with decimals)
      )

      console.log('Tokens minted to:', tokenAccount.address.toBase58())
      
      // Refresh balances
      fetchBalance()
      fetchTokenBalances()
    } catch (error) {
      console.error('Token creation failed:', error)
      alert('Token creation failed: ' + (error as Error).message)
    } finally {
      setIsCreatingToken(false)
    }
  }

  const mintMoreTokens = async () => {
    if (!address || !createdTokenMint || !mintAmount) return

    setIsMinting(true)
    try {
      if (!keypair) {
        throw new Error('Keypair not available')
      }

      const publicKey = new PublicKey(address)
      const mint = new PublicKey(createdTokenMint)
      const solanaKeypair = Keypair.fromSecretKey(keypair.secretKey)

      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        solanaKeypair, // payer
        mint, // mint
        publicKey // owner
      )

      await mintTo(
        connection,
        solanaKeypair, // payer
        mint, // mint
        tokenAccount.address, // destination
        publicKey, // authority
        parseInt(mintAmount) * Math.pow(10, 9) // amount (with decimals)
      )

      console.log('Additional tokens minted')
      
      // Refresh balances
      fetchBalance()
      fetchTokenBalances()
      setMintAmount('1000') // Reset mint amount
    } catch (error) {
      console.error('Minting failed:', error)
      alert('Minting failed: ' + (error as Error).message)
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1 className="title">
            <span className="gradient-text">Stackk Wallet</span>
          </h1>
          <p className="subtitle">Your Gateway to Solana DeFi</p>
        </div>

        {/* Network Warning Modal */}
         {showNetworkWarning && (
           <div className="modal-overlay">
             <div className="modal">
               <h3>⚠️ Switch to Mainnet?</h3>
               <p>You're about to switch to Solana Mainnet. This will use real SOL and tokens. Make sure you understand the risks.</p>
               <div className="modal-actions">
                 <button onClick={() => setShowNetworkWarning(false)} className="btn-secondary">
                   Cancel
                 </button>
                 <button onClick={confirmNetworkSwitch} className="btn-primary">
                   Continue to Mainnet
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* Wallet Settings */}
         <div className="asset-card">
           <div className="card-header">
             <h2 className="card-title">
               <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 ⚙️ Wallet Settings
               </span>
             </h2>
             <button
               onClick={() => setShowWalletSettings(!showWalletSettings)}
               style={{
                 background: 'none',
                 border: 'none',
                 color: 'var(--spy-accent)',
                 cursor: 'pointer',
                 fontSize: '1rem'
               }}
             >
               {showWalletSettings ? '▼' : '▶'}
             </button>
           </div>
           
           {showWalletSettings && (
             <div className="asset-info">
               {/* Wallet Persistence Toggle */}
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'space-between',
                 padding: '1rem',
                 background: 'var(--spy-bg-secondary)',
                 borderRadius: '8px',
                 marginBottom: '1rem'
               }}>
                 <div style={{ flex: 1 }}>
                   <h4 style={{ 
                     fontWeight: '600', 
                     color: 'var(--spy-text)', 
                     marginBottom: '0.25rem' 
                   }}>
                     Wallet Persistence
                   </h4>
                   <p style={{ 
                     fontSize: '0.85rem', 
                     color: 'var(--spy-text-secondary)', 
                     margin: 0 
                   }}>
                     {walletPersistenceEnabled 
                       ? "Keep the same wallet across browser refreshes" 
                       : "Generate a new wallet on each refresh"
                     }
                   </p>
                 </div>
                 <label style={{
                   position: 'relative',
                   display: 'inline-flex',
                   alignItems: 'center',
                   cursor: 'pointer',
                   marginLeft: '1rem'
                 }}>
                   <input
                     type="checkbox"
                     checked={walletPersistenceEnabled}
                     onChange={(e) => toggleWalletPersistence(e.target.checked)}
                     style={{ display: 'none' }}
                   />
                   <div style={{
                     width: '44px',
                     height: '24px',
                     background: walletPersistenceEnabled ? 'var(--spy-accent)' : 'var(--spy-muted)',
                     borderRadius: '12px',
                     position: 'relative',
                     transition: 'background-color 0.2s'
                   }}>
                     <div style={{
                       position: 'absolute',
                       top: '2px',
                       left: walletPersistenceEnabled ? '22px' : '2px',
                       width: '20px',
                       height: '20px',
                       background: 'white',
                       borderRadius: '50%',
                       transition: 'left 0.2s'
                     }} />
                   </div>
                 </label>
               </div>

               {/* Wallet Status Indicator */}
               <div style={{
                 padding: '1rem',
                 background: 'var(--spy-bg-secondary)',
                 borderRadius: '8px',
                 marginBottom: '1rem'
               }}>
                 <div style={{
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'space-between'
                 }}>
                   <div>
                     <h4 style={{ 
                       fontWeight: '600', 
                       color: 'var(--spy-text)', 
                       marginBottom: '0.25rem' 
                     }}>
                       Current Mode
                     </h4>
                     <p style={{ 
                       fontSize: '0.85rem', 
                       margin: 0,
                       color: walletPersistenceEnabled ? '#22c55e' : '#f59e0b'
                     }}>
                       {walletPersistenceEnabled ? (
                         <span>🔒 Persistent Wallet</span>
                       ) : (
                         <span>🔄 Fresh Wallet Mode</span>
                       )}
                     </p>
                   </div>
                   {walletPersistenceEnabled && hasStoredWallet() && (
                     <button
                       onClick={clearStoredWallet}
                       style={{
                         padding: '0.5rem 0.75rem',
                         background: '#ef4444',
                         color: 'white',
                         border: 'none',
                         borderRadius: '6px',
                         fontSize: '0.8rem',
                         fontWeight: '600',
                         cursor: 'pointer',
                         transition: 'background-color 0.2s'
                       }}
                       onMouseOver={(e) => (e.target as HTMLElement).style.background = '#dc2626'}
                       onMouseOut={(e) => (e.target as HTMLElement).style.background = '#ef4444'}
                     >
                       Clear Wallet
                     </button>
                   )}
                 </div>
               </div>

               {/* Security Warning */}
               {walletPersistenceEnabled && (
                 <div style={{
                   padding: '1rem',
                   background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                   border: '1px solid rgba(245, 158, 11, 0.2)',
                   borderRadius: '8px'
                 }}>
                   <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                     <span style={{ color: '#f59e0b', marginRight: '0.5rem' }}>⚠️</span>
                     <div>
                       <h4 style={{ 
                         fontWeight: '600', 
                         color: '#f59e0b', 
                         marginBottom: '0.25rem' 
                       }}>
                         Security Notice
                       </h4>
                       <p style={{ 
                         fontSize: '0.85rem', 
                         color: '#fbbf24', 
                         margin: 0,
                         lineHeight: '1.4'
                       }}>
                         Your wallet is stored locally in your browser. Make sure to backup your mnemonic phrase and only use this feature on trusted devices.
                       </p>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           )}
         </div>

        {/* Solana Wallet Asset Card */}
        <div className="asset-card">
          <div className="card-header">
            <h2 className="card-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '24px' }}>◎</span>
                Solana Wallet
              </span>
            </h2>
            <div className="status-indicator"></div>
          </div>
          
          <div className="asset-info">
            <div className="wallet-address">
              <span className="label">Wallet Address:</span>
              <div className="address-container">
                <span className="address">{address}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(address)}
                  className="copy-btn"
                  title="Copy address"
                >
                  📋
                </button>
              </div>
            </div>
            
            <div className="balance-section">
              <div className="balance-item">
                <span className="balance-label">SOL Balance:</span>
                <span className="balance-value">{balance.toFixed(4)} SOL</span>
              </div>
            </div>

            {/* SPL Token Balances */}
            {tokenBalances.length > 0 && (
              <div className="token-balances">
                <h4 className="token-balances-title">SPL Token Balances:</h4>
                {tokenBalances.map((token) => (
                  <div key={token.mint} className="token-balance-item">
                    <div className="token-info">
                      {token.logoURI && (
                        <img 
                          src={token.logoURI} 
                          alt={token.symbol}
                          className="token-logo"
                        />
                      )}
                      <span className="token-symbol">{token.symbol}</span>
                    </div>
                    <span className="token-balance">{token.balance.toFixed(6)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Network Selection */}
            <div className="network-section">
              <span className="label">Network:</span>
              <div className="network-buttons">
                <button
                  onClick={() => handleNetworkChange('devnet')}
                  className={`network-btn ${network === 'devnet' ? 'active' : ''}`}
                >
                  Devnet
                </button>
                <button
                  onClick={() => handleNetworkChange('mainnet-beta')}
                  className={`network-btn ${network === 'mainnet-beta' ? 'active' : ''}`}
                >
                  Mainnet
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mnemonic Backup Section */}
        <div className="asset-card">
          <div className="card-header">
            <h2 className="card-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🔐 Backup Mnemonic Phrase
              </span>
            </h2>
            <div className="status-indicator"></div>
          </div>
          
          <div className="asset-info">
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 107, 107, 0.05) 100%)',
              border: '1px solid rgba(255, 107, 107, 0.2)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#ff6b6b', 
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center'
              }}>
                ⚠️ Security Warning
              </h4>
              <p style={{ 
                margin: 0, 
                color: 'var(--spy-text-secondary)',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}>
                Your mnemonic phrase is the master key to your wallet. Never share it with anyone and store it securely offline.
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <button
                onClick={() => setShowMnemonic(!showMnemonic)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: showMnemonic ? 'var(--spy-muted)' : 'var(--spy-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  marginBottom: '1rem'
                }}
              >
                {showMnemonic ? '🙈 Hide Mnemonic' : '👁️ Show Mnemonic'}
              </button>

              {showMnemonic && (
                <div style={{
                  background: 'var(--spy-surface)',
                  border: '2px solid var(--spy-border)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    background: 'var(--spy-bg-secondary)',
                    padding: '1rem',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    color: 'var(--spy-text)',
                    wordBreak: 'break-all',
                    marginBottom: '1rem'
                  }}>
                    {mnemonic}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(mnemonic)
                        setMnemonicCopied(true)
                        setTimeout(() => setMnemonicCopied(false), 2000)
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem 1rem',
                        background: mnemonicCopied ? '#22c55e' : 'var(--spy-accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {mnemonicCopied ? '✅ Copied!' : '📋 Copy to Clipboard'}
                    </button>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: 'var(--spy-bg-secondary)',
                    borderRadius: '6px'
                  }}>
                    <input
                      type="checkbox"
                      id="backup-confirmation"
                      checked={mnemonicBackedUp}
                      onChange={(e) => setMnemonicBackedUp(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label 
                      htmlFor="backup-confirmation" 
                      style={{ 
                        fontSize: '0.9rem', 
                        color: 'var(--spy-text)', 
                        cursor: 'pointer',
                        lineHeight: '1.4'
                      }}
                    >
                      I have safely backed up my mnemonic phrase and understand that losing it means losing access to my wallet forever.
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <h4 style={{ 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                color: '#22c55e', 
                marginBottom: '0.5rem'
              }}>
                💡 Backup Tips
              </h4>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '1.2rem', 
                color: 'var(--spy-text-secondary)',
                fontSize: '0.85rem',
                lineHeight: '1.4'
              }}>
                <li>Write it down on paper and store in a safe place</li>
                <li>Consider using a hardware wallet for maximum security</li>
                <li>Never store it digitally or take screenshots</li>
                <li>Test your backup by restoring in a test environment</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Asset Transfer Section */}
        <div className="asset-card">
          <div className="card-header">
            <h2 className="card-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💸 Transfer Assets
              </span>
            </h2>
            <div className="status-indicator"></div>
          </div>
          
          <div className="asset-info">
            <div className="form-group">
              <label className="form-label">Select Asset:</label>
              <select 
                value={selectedToken} 
                onChange={(e) => setSelectedToken(e.target.value)}
                className="form-select"
              >
                <option value="SOL">SOL</option>
                {tokenBalances.map((token) => (
                  <option key={token.mint} value={token.symbol}>
                    {token.symbol} ({token.balance.toFixed(6)} available)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Recipient Address:</label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="Enter Solana address..."
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Amount:</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.000001"
                className="form-input"
              />
            </div>

            <button
              onClick={transferAsset}
              disabled={isTransferring || !recipientAddress || !amount}
              className="btn-primary"
            >
              {isTransferring ? 'Transferring...' : `Transfer ${selectedToken}`}
            </button>
          </div>
        </div>

        {/* Token Creation Card */}
        <div className="asset-card">
          <div className="card-header">
            <h2 className="card-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🪙 Create Token
              </span>
            </h2>
            <div className="status-indicator"></div>
          </div>
          
          <div className="asset-info">
            <div className="form-group">
              <label className="form-label">Initial Supply:</label>
              <input
                type="number"
                value={tokenSupply}
                onChange={(e) => setTokenSupply(e.target.value)}
                placeholder="1000000"
                className="form-input"
              />
            </div>

            <button
              onClick={createToken}
              disabled={isCreatingToken || !tokenSupply}
              className="btn-primary"
            >
              {isCreatingToken ? 'Creating Token...' : 'Create Token'}
            </button>

            {createdTokenMint && (
              <div className="created-token-info">
                <h4>Token Created Successfully! 🎉</h4>
                <p><strong>Mint Address:</strong> {createdTokenMint}</p>
                
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Mint Additional Tokens:</label>
                  <input
                    type="number"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    placeholder="1000"
                    className="form-input"
                  />
                </div>

                <button
                  onClick={mintMoreTokens}
                  disabled={isMinting || !mintAmount}
                  className="btn-secondary"
                >
                  {isMinting ? 'Minting...' : 'Mint More Tokens'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Safety Guidelines */}
        <div className="safety-card">
          <h3 className="safety-title">🛡️ Safety Guidelines</h3>
          <ul className="safety-list">
            <li>Always verify recipient addresses before sending</li>
            <li>Start with small test transactions</li>
            <li>Keep your mnemonic phrase secure and private</li>
            <li>Use Devnet for testing, Mainnet for real transactions</li>
            <li>Double-check network selection before transactions</li>
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button 
            onClick={generateWallet}
            className="quick-action-btn"
          >
            🔄 Generate New Wallet
          </button>
          <button 
            onClick={() => window.open('https://faucet.solana.com', '_blank')}
            className="quick-action-btn"
            disabled={network === 'mainnet-beta'}
          >
            🚰 Get Devnet SOL
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
