import { useState, useEffect } from 'react'
import { ConnectButton } from "thirdweb/react"
import { createThirdwebClient } from "thirdweb"
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
import { InstallExtensionButton } from './components/InstallExtensionButton'
import GamifiedGuide from './components/GamifiedGuide'
import './App.css'

const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
})

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
  // Token creation states (currently unused but kept for future features)
  // const [tokenSupply, setTokenSupply] = useState<string>('1000000')
  // const [isMinting, setIsMinting] = useState<boolean>(false)
  // const [mintAmount, setMintAmount] = useState<string>('1000')
  const [keypair, setKeypair] = useState<KeypairInfo | null>(null)
  const [initialSupply, setInitialSupply] = useState<string>('1000000')
  const [decimals, setDecimals] = useState<string>('9')
  const [transferStatus, setTransferStatus] = useState<string>('')
  const [createTokenStatus, setCreateTokenStatus] = useState<string>('')
  const [isBackedUp, setIsBackedUp] = useState<boolean>(false)

  const [walletPersistenceEnabled, setWalletPersistenceEnabled] = useState<boolean>(() => {
    return isWalletPersistenceEnabled()
  })
  const [showWalletSettings, setShowWalletSettings] = useState<boolean>(false)
  
  // Gamified guide state
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  const connection = new Connection(NETWORK_ENDPOINTS[network])

  // Gamification functions
  const calculateWalletProgress = () => {
    let progress = 0;
    
    // Base progress for having a wallet
    if (address) progress += 20;
    
    // Progress for having SOL balance
    if (balance > 0) progress += 20;
    
    // Progress for having token balances
    if (tokenBalances.length > 0) progress += 20;
    
    // Progress for backing up mnemonic
    if (isBackedUp) progress += 20;
    
    // Progress for making transactions
    if (transferStatus === 'success') progress += 10;
    
    // Progress for creating tokens
    if (createTokenStatus === 'success') progress += 10;
    
    return Math.min(progress, 100);
  };

  const getProgressEmoji = (progress: number) => {
    if (progress >= 90) return '🚀';
    if (progress >= 70) return '⭐';
    if (progress >= 50) return '🔥';
    if (progress >= 30) return '💎';
    if (progress >= 10) return '🌟';
    return '🎯';
  };

  const getProgressMessage = (progress: number) => {
    if (progress >= 90) return 'Crypto Master! 🏆';
    if (progress >= 70) return 'Almost There! 🎉';
    if (progress >= 50) return 'Getting Good! 💪';
    if (progress >= 30) return 'Making Progress! 🌱';
    if (progress >= 10) return 'Just Started! 🎮';
    return 'Welcome Aboard! 👋';
  };

  const getAchievements = () => {
    const achievements = [];
    
    if (address) achievements.push({ emoji: '🎯', title: 'First Steps', desc: 'Created your wallet' });
    if (balance > 0) achievements.push({ emoji: '💰', title: 'Funded Up', desc: 'Added SOL to wallet' });
    if (tokenBalances.length > 0) achievements.push({ emoji: '🪙', title: 'Token Collector', desc: 'Holds custom tokens' });
    if (isBackedUp) achievements.push({ emoji: '🔐', title: 'Security Pro', desc: 'Backed up seed phrase' });
    if (transferStatus === 'success') achievements.push({ emoji: '📤', title: 'Sender', desc: 'Made first transfer' });
    if (createTokenStatus === 'success') achievements.push({ emoji: '🏭', title: 'Token Creator', desc: 'Created custom token' });
    
    return achievements;
  };

  // Gamified guide functions
  const handleStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  };

  // Auto-complete steps based on user actions
  useEffect(() => {
    if (address && !completedSteps.includes('generate-wallet')) {
      handleStepComplete('generate-wallet');
    }
    if (isBackedUp && !completedSteps.includes('backup-seed')) {
      handleStepComplete('backup-seed');
    }
    if (balance > 0 && !completedSteps.includes('check-balance')) {
      handleStepComplete('check-balance');
    }
    if (tokenBalances.length > 0 && !completedSteps.includes('explore-tokens')) {
      handleStepComplete('explore-tokens');
    }
  }, [address, isBackedUp, balance, tokenBalances, completedSteps]);

  const ProgressRing = ({ progress }: { progress: number }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="progress-ring">
        <svg className="progress-ring-svg" width="100" height="100">
          <circle
            className="progress-ring-circle-bg"
            stroke="rgba(75, 85, 99, 0.3)"
            strokeWidth="6"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          <circle
            className="progress-ring-circle"
            stroke="url(#progressGradient)"
            strokeWidth="6"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>
        <div className="progress-center">
          <span className="progress-emoji">{getProgressEmoji(progress)}</span>
        </div>
      </div>
    );
  };

  useEffect(() => {
    initializeWallet()
  }, [])

  const initializeWallet = async () => {
    if (walletPersistenceEnabled && hasStoredWallet()) {
      try {
        const stored = loadWalletFromStorage()
        if (stored) {
          setMnemonic(stored.mnemonic)
          setAddress(stored.address)
          
          // Derive keypair from stored mnemonic
          const seed = await mnemonicToSeedBytes(stored.mnemonic)
          const derivedKeypair = deriveSolanaKeypair(seed)
          setKeypair(derivedKeypair)
        }
      } catch (error) {
        console.error('Failed to load stored wallet:', error)
        // If loading fails, generate a new wallet
        await generateWallet()
      }
    } else {
      await generateWallet()
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

  const copyMnemonic = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic)
      setMnemonicCopied(true)
      setIsBackedUp(true)
      setTimeout(() => setMnemonicCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy mnemonic:', error)
    }
  }

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
          // Token account doesn't exist or has no balance, skip
          if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
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
        setTransferStatus('success')
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
        setTransferStatus('success')
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
    if (!address || !initialSupply) return

    setIsCreatingToken(true)
    try {
      if (!keypair) {
        throw new Error('Keypair not available')
      }

      const solanaKeypair = Keypair.fromSecretKey(keypair.secretKey)
      // const mintKeypair = Keypair.generate()

      const mint = await createMint(
        connection,
        solanaKeypair, // payer
        solanaKeypair.publicKey, // mint authority
        solanaKeypair.publicKey, // freeze authority
        parseInt(decimals) // decimals
      )

      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        solanaKeypair, // payer
        mint, // mint
        solanaKeypair.publicKey // owner
      )

      await mintTo(
        connection,
        solanaKeypair, // payer
        mint, // mint
        tokenAccount.address, // destination
        solanaKeypair.publicKey, // authority
        parseFloat(initialSupply) * Math.pow(10, parseInt(decimals)) // amount
      )

      setCreatedTokenMint(mint.toString())
      setCreateTokenStatus('success')
      console.log('Token created successfully:', mint.toString())
      
      // Refresh token balances to show the new token
      fetchTokenBalances()
    } catch (error) {
      console.error('Token creation failed:', error)
      alert('Token creation failed: ' + (error as Error).message)
    } finally {
      setIsCreatingToken(false)
    }
  }

  const walletProgress = calculateWalletProgress();
  const achievements = getAchievements();

  return (
    <div className="modern-app-container">
      {/* Floating Background Elements */}
      <div className="floating-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Header with Install Extension Button */}
      <div className="modern-header">
        <InstallExtensionButton />
        <div className="header-content">
          <div className="logo-container">
            <div className="logo-icon">💎</div>
            <h1 className="modern-title">
              <span className="title-gradient">Stackk</span>
              <span className="title-accent">Wallet</span>
            </h1>
          </div>
          <p className="modern-subtitle">
            Your Gateway to the Solana Ecosystem ✨
          </p>
          
          {/* Network Selector with Modern Design */}
          <div className="network-selector-modern">
            <div className="network-label">Network:</div>
            <div className="network-buttons">
              <button
                onClick={() => handleNetworkChange('devnet')}
                className={`network-btn ${network === 'devnet' ? 'active' : ''}`}
              >
                <span className="network-dot devnet"></span>
                Devnet
              </button>
              <button
                onClick={() => handleNetworkChange('mainnet-beta')}
                className={`network-btn ${network === 'mainnet-beta' ? 'active' : ''}`}
              >
                <span className="network-dot mainnet"></span>
                Mainnet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Network Warning Modal */}
      {showNetworkWarning && (
        <div className="modal-overlay">
          <div className="modal-content warning-modal">
            <div className="modal-header">
              <h3>⚠️ Switch to Mainnet?</h3>
            </div>
            <div className="modal-body">
              <p>You're switching from Devnet to Mainnet. This will use real SOL tokens.</p>
              <p><strong>Make sure you understand the risks!</strong></p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setShowNetworkWarning(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={confirmNetworkSwitch}
                className="btn-danger"
              >
                Switch to Mainnet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="main-content-container">
        
        {/* Gamified Guide */}
        <GamifiedGuide 
          onStepComplete={handleStepComplete}
          completedSteps={completedSteps}
        />
        
        {/* Third-Party Wallet Connection */}
          <div className="modern-card third-party-wallet">
            <div className="card-header-modern">
              <div className="card-title-container">
                <div className="card-icon">🔗</div>
                <h2 className="card-title-modern">Connect External Wallet</h2>
              </div>
            </div>
            <div className="wallet-connection-options">
              <div className="connection-description">
                Connect your existing wallet to interact with Solana dApps
              </div>
              <div className="connect-button-container">
                <ConnectButton 
                  client={client}
                  theme="dark"
                  connectButton={{
                    label: "Connect Wallet",
                    style: {
                      background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
                      border: "none",
                      borderRadius: "12px",
                      padding: "12px 24px",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "white",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }
                  }}
                  connectModal={{
                    title: "Connect Your Wallet",
                    titleIcon: "🔗",
                    showThirdwebBranding: false,
                  }}
                />
              </div>
              <div className="supported-wallets">
                <div className="supported-title">Supported Wallets:</div>
                <div className="wallet-icons">
                  <div className="wallet-icon" title="MetaMask">🦊</div>
                  <div className="wallet-icon" title="WalletConnect">🔗</div>
                  <div className="wallet-icon" title="Coinbase Wallet">🔵</div>
                  <div className="wallet-icon" title="Trust Wallet">🛡️</div>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Overview Card */}
        <div className="modern-card wallet-overview">
          <div className="card-header-modern">
            <div className="card-title-container">
              <div className="card-icon">🏦</div>
              <h2 className="card-title-modern">Wallet Overview</h2>
            </div>
            <div className="wallet-settings-toggle">
              <button 
                onClick={() => setShowWalletSettings(!showWalletSettings)}
                className="settings-btn"
                title="Wallet Settings"
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* Wallet Settings Panel */}
          {showWalletSettings && (
            <div className="wallet-settings-panel">
              <div className="setting-item">
                <div className="setting-info">
                  <h4>💾 Wallet Persistence</h4>
                  <p>Keep the same wallet address across browser refreshes</p>
                </div>
                <label className="modern-toggle">
                  <input
                    type="checkbox"
                    checked={walletPersistenceEnabled}
                    onChange={(e) => toggleWalletPersistence(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              {walletPersistenceEnabled && hasStoredWallet() && (
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>🗑️ Clear Stored Wallet</h4>
                    <p>Remove saved wallet and generate a new one</p>
                  </div>
                  <button 
                    onClick={clearStoredWallet}
                    className="btn-danger-small"
                  >
                    Clear Wallet
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Balance Display */}
          <div className="balance-display">
            <div className="balance-main">
              <div className="balance-label">💰 Total Balance</div>
              <div className="balance-value-container">
                <span className="balance-value">{balance.toFixed(4)}</span>
                <span className="balance-currency">SOL</span>
              </div>
              <div className="progress-message">
                {getProgressMessage(walletProgress)}
              </div>
            </div>
            <ProgressRing progress={walletProgress} />
          </div>

          {/* Wallet Address */}
          <div className="wallet-address-container">
            <div className="address-label">Wallet Address</div>
            <div className="address-display">
              <span className="address-text">{address}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(address)}
                className="copy-btn"
                title="Copy Address"
              >
                📋
              </button>
            </div>
          </div>

          {/* Achievements Section */}
          {achievements.length > 0 && (
            <div className="achievements-section">
              <h4 className="achievements-title">🏆 Your Achievements</h4>
              <div className="achievements-grid">
                {achievements.map((achievement, index) => (
                  <div key={index} className="achievement-item">
                    <span className="achievement-emoji">{achievement.emoji}</span>
                    <div className="achievement-content">
                      <div className="achievement-title">{achievement.title}</div>
                      <div className="achievement-desc">{achievement.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Token Balances */}
          {tokenBalances.length > 0 && (
            <div className="token-balances">
              <h3 className="token-balances-title">Token Holdings 🪙</h3>
              <div className="token-list">
                {tokenBalances.map((token) => (
                  <div key={token.mint} className="token-item">
                    <div className="token-info">
                      <div className="token-symbol">{token.symbol}</div>
                      <div className="token-name">{token.name}</div>
                    </div>
                    <div className="token-balance">
                      {token.balance.toFixed(6)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mnemonic Backup Section */}
          <div className="mnemonic-section">
            <div className="mnemonic-header">
              <h3>🔐 Backup Your Wallet</h3>
              <button 
                onClick={() => setShowMnemonic(!showMnemonic)}
                className="btn-secondary-small"
              >
                {showMnemonic ? 'Hide' : 'Show'} Seed Phrase
              </button>
            </div>
            
            {showMnemonic && (
              <div className="mnemonic-display">
                <div className="mnemonic-warning">
                  <div className="warning-icon">⚠️</div>
                  <div className="warning-text">
                    <strong>Keep this safe!</strong> Anyone with this phrase can access your wallet.
                  </div>
                </div>
                
                <div className="mnemonic-words">
                  {mnemonic.split(' ').map((word, index) => (
                    <span key={index} className="mnemonic-word">
                      <span className="word-number">{index + 1}</span>
                      {word}
                    </span>
                  ))}
                </div>
                
                <div className="mnemonic-actions">
                  <button 
                    onClick={copyMnemonic}
                    className={`btn-copy ${mnemonicCopied ? 'copied' : ''}`}
                  >
                    {mnemonicCopied ? '✅ Copied!' : '📋 Copy Phrase'}
                  </button>
                  
                  <label className="backup-checkbox">
                    <input
                      type="checkbox"
                      checked={mnemonicBackedUp}
                      onChange={(e) => {
                        setMnemonicBackedUp(e.target.checked)
                        setIsBackedUp(e.target.checked)
                      }}
                    />
                    <span className="checkmark"></span>
                    I've safely backed up my seed phrase
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Cards Grid */}
        <div className="action-cards-grid">
          
          {/* Transfer Card */}
          <div className="modern-card action-card">
            <div className="card-header-modern">
              <div className="card-title-container">
                <div className="card-icon">💸</div>
                <h2 className="card-title-modern">Send Assets</h2>
              </div>
              <div className="card-status-dot active"></div>
            </div>
            
            <div className="form-modern">
              <div className="form-group-modern">
                <label className="form-label-modern">Asset</label>
                <select 
                  value={selectedToken} 
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="form-select-modern"
                >
                  <option value="SOL">💎 SOL</option>
                  {tokenBalances.map((token) => (
                    <option key={token.mint} value={token.symbol}>
                      🪙 {token.symbol} ({token.balance.toFixed(6)} available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">Recipient Address</label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Enter Solana address..."
                  className="form-input-modern"
                />
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.000001"
                  className="form-input-modern"
                />
              </div>

              <button
                onClick={transferAsset}
                disabled={isTransferring || !recipientAddress || !amount}
                className="btn-primary-modern"
              >
                <span className="btn-icon">🚀</span>
                {isTransferring ? 'Sending...' : `Send ${selectedToken}`}
              </button>
              
              {transferStatus === 'success' && (
                <div className="success-message">
                  <div className="success-icon">🎉</div>
                  <div className="success-content">
                    <h4>Transfer Successful!</h4>
                    <p>Your {selectedToken} has been sent successfully</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Create Token Card */}
          <div className="modern-card action-card">
            <div className="card-header-modern">
              <div className="card-title-container">
                <div className="card-icon">🪙</div>
                <h2 className="card-title-modern">Create Token</h2>
              </div>
              <div className="card-status-dot active"></div>
            </div>
            
            <div className="form-modern">
              <div className="form-group-modern">
                <label className="form-label-modern">Initial Supply</label>
                <input
                  type="number"
                  value={initialSupply}
                  onChange={(e) => setInitialSupply(e.target.value)}
                  placeholder="1000000"
                  className="form-input-modern"
                />
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">Decimals</label>
                <input
                  type="number"
                  value={decimals}
                  onChange={(e) => setDecimals(e.target.value)}
                  placeholder="9"
                  min="0"
                  max="9"
                  className="form-input-modern"
                />
              </div>

              <button
                onClick={createToken}
                disabled={isCreatingToken || !initialSupply || !decimals}
                className="btn-primary-modern create-token"
              >
                <span className="btn-icon">✨</span>
                {isCreatingToken ? 'Creating...' : 'Create Token'}
              </button>

              {createdTokenMint && (
                <div className="success-message">
                  <div className="success-icon">🎉</div>
                  <div className="success-content">
                    <h4>Token Created Successfully!</h4>
                    <p className="token-mint">Mint: {createdTokenMint}</p>
                  </div>
                </div>
              )}
              
              {createTokenStatus === 'success' && (
                <div className="success-message">
                  <div className="success-icon">🏭</div>
                  <div className="success-content">
                    <h4>Achievement Unlocked!</h4>
                    <p>You're now a Token Creator! 🎉</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="quick-actions-section">
          <h2 className="section-title">⚡ Quick Actions</h2>
          <div className="quick-actions-grid">
            <button 
              onClick={generateWallet}
              className="quick-action-btn"
            >
              <span className="action-icon">🔄</span>
              <div className="action-content">
                <div className="action-title">New Wallet</div>
                <div className="action-subtitle">Generate fresh wallet</div>
              </div>
            </button>
            
            <button 
              onClick={() => window.open('https://faucet.solana.com', '_blank')}
              className={`quick-action-btn ${network === 'mainnet-beta' ? 'disabled' : ''}`}
              disabled={network === 'mainnet-beta'}
            >
              <span className="action-icon">🚰</span>
              <div className="action-content">
                <div className="action-title">Get Devnet SOL</div>
                <div className="action-subtitle">Free test tokens</div>
              </div>
            </button>
            
            <button 
              onClick={fetchBalance}
              disabled={!address}
              className="quick-action-btn"
            >
              <span className="action-icon">🔄</span>
              <div className="action-content">
                <div className="action-title">Refresh Balance</div>
                <div className="action-subtitle">Update wallet data</div>
              </div>
            </button>
            
            <button 
              onClick={() => setShowMnemonic(!showMnemonic)}
              disabled={!address}
              className="quick-action-btn"
            >
              <span className="action-icon">🔐</span>
              <div className="action-content">
                <div className="action-title">View Seed Phrase</div>
                <div className="action-subtitle">Backup your wallet</div>
              </div>
            </button>
            
            <button 
              onClick={() => window.open('https://explorer.solana.com', '_blank')}
              className="quick-action-btn"
            >
              <span className="action-icon">🔍</span>
              <div className="action-content">
                <div className="action-title">Explorer</div>
                <div className="action-subtitle">View transactions</div>
              </div>
            </button>
          </div>
        </div>

        {/* Safety Tips */}
        <div className="modern-card safety-tips">
          <div className="card-header-modern">
            <div className="card-title-container">
              <span className="card-icon">🛡️</span>
              <h2 className="card-title-modern">Safety Guidelines</h2>
            </div>
          </div>
          
          <div className="tips-grid">
            <div className="tip-item">
              <span className="tip-icon">🔒</span>
              <span className="tip-text">Never share your seed phrase with anyone</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">💾</span>
              <span className="tip-text">Always backup your wallet securely</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🔍</span>
              <span className="tip-text">Double-check addresses before sending</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🌐</span>
              <span className="tip-text">Only use trusted networks and websites</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">⚡</span>
              <span className="tip-text">Start with small amounts when testing</span>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🎯</span>
              <span className="tip-text">Keep your browser and extensions updated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
