import { useState, useEffect } from 'react'
import { ConnectButton } from "thirdweb/react"
import { createThirdwebClient } from "thirdweb"
import { generateMnemonic, mnemonicToSeedBytes, deriveSolanaKeypair } from '@stackk/core'
import { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js'
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
  const [tokenSupply, setTokenSupply] = useState<string>('1000000')
  const [isMinting, setIsMinting] = useState<boolean>(false)
  const [mintAmount, setMintAmount] = useState<string>('1000')

  const connection = new Connection(NETWORK_ENDPOINTS[network])

  useEffect(() => {
    generateWallet()
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

  const generateWallet = async () => {
    const newMnemonic = await generateMnemonic()
    const seed = await mnemonicToSeedBytes(newMnemonic)
    const keypair = deriveSolanaKeypair(seed)
    
    setMnemonic(newMnemonic)
    setAddress(keypair.publicKey)
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

  const createStackkKoin = async () => {
    if (isCreatingToken) return

    setIsCreatingToken(true)
    try {
      const seed = await mnemonicToSeedBytes(mnemonic)
      const payer = deriveSolanaKeypair(seed)

      // Create the mint
      const mint = await createMint(
        connection,
        payer as any,
        payer.publicKey as any, // mint authority
        payer.publicKey as any, // freeze authority
        9 // decimals (9 is standard for most tokens)
      )

      console.log('Stackk Koin (KSW) created with mint address:', mint.toBase58())
      setCreatedTokenMint(mint.toBase58())

      // Create associated token account and mint initial supply
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer as any,
        mint,
        payer.publicKey as any
      )

      // Mint initial supply
      const initialSupply = parseFloat(tokenSupply) * Math.pow(10, 9) // 9 decimals
      await mintTo(
        connection,
        payer as any,
        mint,
        tokenAccount.address,
        payer.publicKey as any,
        initialSupply
      )

      console.log(`Minted ${tokenSupply} KSW tokens to wallet`)

      // Add to token list for current network
      const newToken: TokenInfo = {
        mint: mint.toBase58(),
        symbol: 'KSW',
        name: 'Stackk Koin',
        decimals: 9,
        logoURI: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiM2MzY2RjEiLz4KPHN2ZyB4PSI2IiB5PSI2IiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAyTDEzLjA5IDguMjZMMjAgNEwxNS43NCA5SDE5VjE1SDE1Ljc0TDIwIDIwTDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgMjBMOC4yNiAxNUg1VjlIOC4yNkw0IDRMMTAuOTEgOC4yNkwxMiAyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cjwvc3ZnPgo='
      }

      // Update the popular tokens list to include our custom token
      POPULAR_TOKENS[network] = [...POPULAR_TOKENS[network], newToken]

      // Refresh balances to show the new token
      fetchTokenBalances()
    } catch (error) {
      console.error('Token creation failed:', error)
    } finally {
      setIsCreatingToken(false)
    }
  }

  const mintMoreTokens = async () => {
    if (!createdTokenMint || isMinting) return

    setIsMinting(true)
    try {
      const seed = await mnemonicToSeedBytes(mnemonic)
      const payer = deriveSolanaKeypair(seed)
      const mint = new PublicKey(createdTokenMint)

      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer as any,
        mint,
        payer.publicKey as any
      )

      const mintAmountLamports = parseFloat(mintAmount) * Math.pow(10, 9)
      await mintTo(
        connection,
        payer as any,
        mint,
        tokenAccount.address,
        payer.publicKey as any,
        mintAmountLamports
      )

      console.log(`Minted ${mintAmount} additional KSW tokens`)
      fetchTokenBalances()
    } catch (error) {
      console.error('Minting failed:', error)
    } finally {
      setIsMinting(false)
    }
  }

  const handleTransfer = async () => {
    if (!mnemonic || !recipientAddress || !amount) return

    setIsTransferring(true)
    try {
      const seed = await mnemonicToSeedBytes(mnemonic)
      const keypairInfo = deriveSolanaKeypair(seed)
      
      // Create Keypair from secretKey for transaction signing
      const senderKeypair = {
        publicKey: new PublicKey(keypairInfo.publicKey),
        secretKey: keypairInfo.secretKey
      }
      
      const recipientPublicKey = new PublicKey(recipientAddress)

      if (selectedToken === 'SOL') {
        // Native SOL transfer
        const amountInLamports = parseFloat(amount) * LAMPORTS_PER_SOL

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: senderKeypair.publicKey,
            toPubkey: recipientPublicKey,
            lamports: amountInLamports,
          })
        )

        const signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [senderKeypair as any]
        )

        console.log('SOL Transfer successful:', signature)
      } else {
        // SPL Token transfer
        const selectedTokenInfo = [...POPULAR_TOKENS[network]].find(token => token.symbol === selectedToken)
        if (!selectedTokenInfo) throw new Error('Token not found')

        const mintPublicKey = new PublicKey(selectedTokenInfo.mint)
        const senderTokenAddress = await getAssociatedTokenAddress(mintPublicKey, senderKeypair.publicKey)
        const recipientTokenAddress = await getAssociatedTokenAddress(mintPublicKey, recipientPublicKey)

        const transaction = new Transaction()

        // Check if recipient token account exists, create if not
        try {
          await getAccount(connection, recipientTokenAddress)
        } catch (error) {
          if (error instanceof TokenAccountNotFoundError) {
            transaction.add(
              createAssociatedTokenAccountInstruction(
                senderKeypair.publicKey, // payer
                recipientTokenAddress,
                recipientPublicKey, // owner
                mintPublicKey // mint
              )
            )
          }
        }

        // Add transfer instruction
        const transferAmount = parseFloat(amount) * Math.pow(10, selectedTokenInfo.decimals)
        transaction.add(
          createTransferInstruction(
            senderTokenAddress,
            recipientTokenAddress,
            senderKeypair.publicKey,
            transferAmount
          )
        )

        const signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [senderKeypair as any]
        )

        console.log('Token Transfer successful:', signature)
      }

      setRecipientAddress('')
      setAmount('')
      fetchBalance()
      fetchTokenBalances()
    } catch (error) {
      console.error('Transfer failed:', error)
    } finally {
      setIsTransferring(false)
    }
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>Stackk Wallet</h1>
        <p className="subtitle">Global Asset Tracking &amp; Management System</p>
      </div>

      <div className="dashboard-grid">
        {/* Solana Wallet Asset Card */}
        <div className="asset-card">
          <div className="card-header">
            <h2 className="card-title">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="url(#solanaGradient)"/>
                  <path d="M5.5 17.5L18.5 4.5M5.5 6.5L18.5 19.5M5.5 12L18.5 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="solanaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9945FF"/>
                      <stop offset="100%" stopColor="#14F195"/>
                    </linearGradient>
                  </defs>
                </svg>
                Solana Wallet
              </span>
            </h2>
            <div className="status-indicator"></div>
          </div>
          
          <div className="asset-info">
            <div className="info-row">
              <span className="info-label">Address</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="info-value">{address ? `${address.slice(0, 8)}...${address.slice(-8)}` : 'Generating...'}</span>
                {address && (
                  <button 
                    onClick={() => navigator.clipboard.writeText(address)}
                    style={{ 
                      padding: '0.25rem 0.5rem', 
                      fontSize: '0.8rem', 
                      background: 'var(--spy-accent)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Copy Full Address
                  </button>
                )}
              </div>
            </div>
            
            <div className="info-row">
              <span className="info-label">SOL Balance</span>
              <span className="info-value balance-value">{balance.toFixed(4)} SOL</span>
            </div>
            
            {/* Token Balances */}
            {tokenBalances.length > 0 && (
              <div className="token-balances">
                <h3 style={{ margin: '1rem 0 0.5rem 0', color: 'var(--spy-text-primary)', fontSize: '1rem' }}>SPL Tokens</h3>
                {tokenBalances.map((token) => (
                  <div key={token.mint} className="info-row">
                    <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {token.logoURI && (
                        <img 
                          src={token.logoURI} 
                          alt={token.symbol} 
                          style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      )}
                      {token.symbol}
                    </span>
                    <span className="info-value balance-value">
                      {token.balance.toFixed(token.decimals === 9 ? 4 : 2)} {token.symbol}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="info-row">
              <span className="info-label">Network</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="info-value">{network === 'devnet' ? 'Devnet' : 'Mainnet'}</span>
                <select 
                  value={network} 
                  onChange={(e) => handleNetworkChange(e.target.value as SolanaNetwork)}
                  style={{ 
                    padding: '0.25rem 0.5rem', 
                    fontSize: '0.8rem', 
                    background: 'var(--spy-surface)', 
                    color: 'var(--spy-text)', 
                    border: '1px solid var(--spy-border)', 
                    borderRadius: '4px', 
                    cursor: 'pointer' 
                  }}
                >
                  <option value="devnet">Devnet</option>
                  <option value="mainnet-beta">Mainnet</option>
                </select>
              </div>
            </div>
            
            <div className="info-row">
              <span className="info-label">Status</span>
              <span className="info-value">Active</span>
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

        {/* Thirdweb Connection Card */}
        <div className="connect-section">
          <div className="card-header">
            <h2 className="card-title">External Wallet Connection</h2>
            <div className="status-indicator"></div>
          </div>
          
          {!import.meta.env.VITE_THIRDWEB_CLIENT_ID && (
            <div className="warning-banner">
              <div className="warning-banner-content">
                <strong>Configuration Required:</strong> Please set your Thirdweb Client ID in the environment variables to enable wallet connections.
              </div>
            </div>
          )}
          
          <ConnectButton client={client} />
          
          <p style={{ marginTop: '1rem', color: 'var(--spy-text-secondary)', fontSize: '0.9rem' }}>
            Connect external wallets for multi-chain asset management
          </p>
        </div>

        {/* Token Creation Card */}
        <div className="transfer-section">
          <div className="card-header">
            <h2 className="card-title">Create Stackk Koin (KSW)</h2>
            <div className="status-indicator"></div>
          </div>
          
          <div className="transfer-form">
            {!createdTokenMint ? (
              <>
                <div className="form-group">
                  <label htmlFor="tokenSupply">Initial Supply</label>
                  <input
                    id="tokenSupply"
                    type="number"
                    value={tokenSupply}
                    onChange={(e) => setTokenSupply(e.target.value)}
                    placeholder="1000000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--spy-border)',
                      borderRadius: '8px',
                      background: 'var(--spy-surface)',
                      color: 'var(--spy-text)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <button
                  onClick={createStackkKoin}
                  disabled={isCreatingToken || !tokenSupply}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: isCreatingToken ? 'var(--spy-muted)' : 'var(--spy-accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isCreatingToken ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {isCreatingToken ? 'Creating Token...' : 'Create Stackk Koin (KSW)'}
                </button>
              </>
            ) : (
              <>
                <div style={{ 
                  padding: '1rem', 
                  background: 'var(--spy-success-bg)', 
                  border: '1px solid var(--spy-success)', 
                  borderRadius: '8px', 
                  marginBottom: '1rem' 
                }}>
                  <p style={{ color: 'var(--spy-success)', margin: 0, fontWeight: '600' }}>
                    ✅ Stackk Koin (KSW) Created Successfully!
                  </p>
                  <p style={{ color: 'var(--spy-text-secondary)', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                    Mint: {createdTokenMint.slice(0, 8)}...{createdTokenMint.slice(-8)}
                  </p>
                </div>
                
                <div className="form-group">
                  <label htmlFor="mintAmount">Mint Additional Tokens</label>
                  <input
                    id="mintAmount"
                    type="number"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    placeholder="1000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--spy-border)',
                      borderRadius: '8px',
                      background: 'var(--spy-surface)',
                      color: 'var(--spy-text)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <button
                  onClick={mintMoreTokens}
                  disabled={isMinting || !mintAmount}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: isMinting ? 'var(--spy-muted)' : 'var(--spy-accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isMinting ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {isMinting ? 'Minting...' : 'Mint Additional KSW'}
                </button>
              </>
            )}
          </div>
          
          <p style={{ marginTop: '1rem', color: 'var(--spy-text-secondary)', fontSize: '0.9rem' }}>
            Create your own SPL token on Solana. The token will be automatically added to your wallet.
          </p>
        </div>

        {/* Native Transfer Card */}
        <div className="transfer-section">
          <div className="card-header">
            <h2 className="card-title">Asset Transfer</h2>
            <div className="status-indicator"></div>
          </div>
          
          <div className="transfer-form">
            <div className="form-row">
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--spy-border)',
                  background: 'var(--spy-bg-secondary)',
                  color: 'var(--spy-text-primary)',
                  fontSize: '1rem',
                  marginBottom: '0.5rem'
                }}
              >
                <option value="SOL">SOL (Native)</option>
                {POPULAR_TOKENS[network].map((token) => (
                  <option key={token.mint} value={token.symbol}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-row">
              <input
                type="text"
                placeholder="Recipient Address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
              />
              <input
                type="number"
                placeholder={`Amount (${selectedToken})`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.001"
                min="0"
              />
            </div>
            
            <button
              className="send-button"
              onClick={handleTransfer}
              disabled={!recipientAddress || !amount || isTransferring || (selectedToken === 'SOL' ? balance === 0 : !tokenBalances.find(t => t.symbol === selectedToken))}
            >
              {isTransferring ? (
                <>
                  <span className="loading"></span>
                  Processing Transfer...
                </>
              ) : (
                `Send ${selectedToken}`
              )}
            </button>
          </div>
          
          <p style={{ marginTop: '1rem', color: 'var(--spy-text-secondary)', fontSize: '0.9rem' }}>
            Secure SOL and SPL token transfers on Solana {network === 'devnet' ? 'Devnet' : 'Mainnet'}
          </p>
        </div>
      </div>

      {/* Network Warning Modal */}
      {showNetworkWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--spy-surface)',
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid var(--spy-border)',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>⚠️ Mainnet Warning</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--spy-text)' }}>
              You are about to switch to Solana Mainnet. This network uses real SOL tokens with actual value. 
              Make sure you understand the risks before proceeding.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowNetworkWarning(false)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--spy-border)',
                  color: 'var(--spy-text)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmNetworkSwitch}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Switch to Mainnet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How It Works Guide Section */}
      <div className="guide-section" style={{
        marginTop: '4rem',
        padding: '3rem 2rem',
        background: 'linear-gradient(135deg, var(--spy-surface) 0%, var(--spy-bg-secondary) 100%)',
        borderRadius: '16px',
        border: '1px solid var(--spy-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            background: 'linear-gradient(135deg, var(--spy-accent) 0%, #9333ea 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem'
          }}>
            How Stackk Wallet Works
          </h2>
          <p style={{ 
            fontSize: '1.2rem', 
            color: 'var(--spy-text-secondary)', 
            maxWidth: '600px', 
            margin: '0 auto' 
          }}>
            Your complete guide to multi-chain wallet management and custom token creation
          </p>
        </div>

        {/* Step-by-Step Guide */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem', 
          marginBottom: '3rem' 
        }}>
          {/* Step 1 */}
          <div style={{
            background: 'var(--spy-surface)',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid var(--spy-border)',
            textAlign: 'center',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }} className="guide-step">
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, var(--spy-accent) 0%, #9333ea 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'white'
            }}>
              1
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--spy-text)' }}>
              🔐 Wallet Creation
            </h3>
            <p style={{ color: 'var(--spy-text-secondary)', lineHeight: '1.6' }}>
              Your wallet is automatically generated with a secure mnemonic phrase. Keep your private keys safe and never share them.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{
            background: 'var(--spy-surface)',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid var(--spy-border)',
            textAlign: 'center',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }} className="guide-step">
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, var(--spy-accent) 0%, #9333ea 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'white'
            }}>
              2
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--spy-text)' }}>
              💰 Add Funds
            </h3>
            <p style={{ color: 'var(--spy-text-secondary)', lineHeight: '1.6' }}>
              Copy your wallet address and send SOL or SPL tokens from another wallet or exchange. Start with Devnet for testing.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{
            background: 'var(--spy-surface)',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid var(--spy-border)',
            textAlign: 'center',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }} className="guide-step">
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, var(--spy-accent) 0%, #9333ea 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'white'
            }}>
              3
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--spy-text)' }}>
              🚀 Send & Receive
            </h3>
            <p style={{ color: 'var(--spy-text-secondary)', lineHeight: '1.6' }}>
              Transfer SOL and SPL tokens securely. Select your token, enter recipient address, and confirm the transaction.
            </p>
          </div>

          {/* Step 4 */}
          <div style={{
            background: 'var(--spy-surface)',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid var(--spy-border)',
            textAlign: 'center',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }} className="guide-step">
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, var(--spy-accent) 0%, #9333ea 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'white'
            }}>
              4
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--spy-text)' }}>
              🪙 Create Tokens
            </h3>
            <p style={{ color: 'var(--spy-text-secondary)', lineHeight: '1.6' }}>
              Launch your own Stackk Koin (KSW) token with custom supply. Perfect for projects, communities, or experiments.
            </p>
          </div>
        </div>

        {/* Network Switching Guide */}
        <div style={{
          background: 'var(--spy-surface)',
          padding: '2.5rem',
          borderRadius: '12px',
          border: '1px solid var(--spy-border)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ 
            fontSize: '1.8rem', 
            fontWeight: '600', 
            textAlign: 'center', 
            marginBottom: '2rem',
            color: 'var(--spy-text)'
          }}>
            🌐 Network Switching Guide
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '2rem' 
          }}>
            {/* Solana Networks */}
            <div style={{
              background: 'var(--spy-bg-secondary)',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--spy-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" style={{ marginRight: '0.5rem' }}>
                  <defs>
                    <linearGradient id="solanaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9945FF"/>
                      <stop offset="100%" stopColor="#14F195"/>
                    </linearGradient>
                  </defs>
                  <path fill="url(#solanaGradient)" d="M4.5 7.5L19.5 7.5C20.3284 7.5 21 8.17157 21 9C21 9.82843 20.3284 10.5 19.5 10.5L4.5 10.5C3.67157 10.5 3 9.82843 3 9C3 8.17157 3.67157 7.5 4.5 7.5Z"/>
                  <path fill="url(#solanaGradient)" d="M4.5 13.5L19.5 13.5C20.3284 13.5 21 14.1716 21 15C21 15.8284 20.3284 16.5 19.5 16.5L4.5 16.5C3.67157 16.5 3 15.8284 3 15C3 14.1716 3.67157 13.5 4.5 13.5Z"/>
                </svg>
                <h4 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--spy-text)' }}>Solana Networks</h4>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '0.75rem', 
                  background: 'var(--spy-surface)', 
                  borderRadius: '6px', 
                  marginBottom: '0.5rem' 
                }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    background: '#22c55e', 
                    borderRadius: '50%', 
                    marginRight: '0.75rem' 
                  }}></span>
                  <div>
                    <strong style={{ color: 'var(--spy-text)' }}>Devnet</strong>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--spy-text-secondary)' }}>
                      Safe testing environment with free SOL
                    </p>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '0.75rem', 
                  background: 'var(--spy-surface)', 
                  borderRadius: '6px' 
                }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    background: '#ef4444', 
                    borderRadius: '50%', 
                    marginRight: '0.75rem' 
                  }}></span>
                  <div>
                    <strong style={{ color: 'var(--spy-text)' }}>Mainnet</strong>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--spy-text-secondary)' }}>
                      Live network with real SOL (use with caution)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Future Networks */}
            <div style={{
              background: 'var(--spy-bg-secondary)',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--spy-border)',
              opacity: '0.7'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" style={{ marginRight: '0.5rem' }}>
                  <path fill="#627EEA" d="M12 0L5.5 12.25L12 16.5L18.5 12.25L12 0Z"/>
                  <path fill="#627EEA" d="M12 24L5.5 13.75L12 9.5L18.5 13.75L12 24Z"/>
                </svg>
                <h4 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--spy-text)' }}>Ethereum (Coming Soon)</h4>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '0.75rem', 
                  background: 'var(--spy-surface)', 
                  borderRadius: '6px', 
                  marginBottom: '0.5rem' 
                }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    background: '#94a3b8', 
                    borderRadius: '50%', 
                    marginRight: '0.75rem' 
                  }}></span>
                  <div>
                    <strong style={{ color: 'var(--spy-text)' }}>Sepolia Testnet</strong>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--spy-text-secondary)' }}>
                      Ethereum testing environment
                    </p>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '0.75rem', 
                  background: 'var(--spy-surface)', 
                  borderRadius: '6px' 
                }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    background: '#94a3b8', 
                    borderRadius: '50%', 
                    marginRight: '0.75rem' 
                  }}></span>
                  <div>
                    <strong style={{ color: 'var(--spy-text)' }}>Ethereum Mainnet</strong>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--spy-text-secondary)' }}>
                      Live Ethereum network with real ETH
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Tips */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 107, 107, 0.05) 100%)',
            border: '1px solid rgba(255, 107, 107, 0.2)',
            borderRadius: '8px',
            padding: '1.5rem',
            marginTop: '2rem'
          }}>
            <h4 style={{ 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              color: '#ff6b6b', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              ⚠️ Safety Guidelines
            </h4>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '1.5rem', 
              color: 'var(--spy-text-secondary)',
              lineHeight: '1.6'
            }}>
              <li>Always start with Devnet for testing and learning</li>
              <li>Double-check recipient addresses before sending</li>
              <li>Keep your private keys and mnemonic phrase secure</li>
              <li>Use small amounts when testing on Mainnet</li>
              <li>Understand network fees before making transactions</li>
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            marginBottom: '1.5rem',
            color: 'var(--spy-text)'
          }}>
            Ready to Get Started?
          </h3>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, var(--spy-accent) 0%, #9333ea 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseOver={(e) => {
                const target = e.target as HTMLElement;
                target.style.transform = 'translateY(-2px)';
                target.style.boxShadow = '0 8px 25px rgba(147, 51, 234, 0.3)';
              }}
              onMouseOut={(e) => {
                const target = e.target as HTMLElement;
                target.style.transform = 'translateY(0)';
                target.style.boxShadow = 'none';
              }}
            >
              🚀 Start Using Wallet
            </button>
            <button
              onClick={() => {
                const tokenSection = document.querySelector('.token-creation-section');
                if (tokenSection) {
                  tokenSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: 'var(--spy-accent)',
                border: '2px solid var(--spy-accent)',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                const target = e.target as HTMLElement;
                target.style.background = 'var(--spy-accent)';
                target.style.color = 'white';
                target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                const target = e.target as HTMLElement;
                target.style.background = 'transparent';
                target.style.color = 'var(--spy-accent)';
                target.style.transform = 'translateY(0)';
              }}
            >
              🪙 Create Token
            </button>
          </div>
        </div>
      </div>

      <p className="footer-text">
        Classified Asset Management System - Stackk Wallet v3.0
      </p>
    </div>
  )
}

export default App
