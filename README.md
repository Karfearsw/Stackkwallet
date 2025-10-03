# 🚀 Stackk Wallet

A modern, secure, and user-friendly Solana wallet built with React, TypeScript, and Vite. Available as both a web application and browser extension.

## ✨ Features

### 🔐 Security First
- **Hardware Wallet Support**: Full Ledger Live integration for maximum security
- **Mnemonic Backup**: Secure seed phrase generation with backup functionality
- **Client-Side Security**: Private keys never leave your device
- **Network Safety**: Built-in protection against malicious networks

### 💰 Wallet Management
- **Multi-Network Support**: Solana Mainnet and Devnet
- **SOL & SPL Tokens**: Full support for native SOL and custom SPL tokens
- **Token Creation**: Create your own SPL tokens with custom metadata
- **Balance Tracking**: Real-time balance updates and transaction history
- **Token Transfers**: Send SOL and SPL tokens with ease

### 🔗 External Integrations
- **Thirdweb Integration**: Connect to external wallets and dApps
- **Ledger Live**: Hardware wallet support for enhanced security
- **Web3 Compatible**: Standard Solana wallet adapter integration

### 🎨 User Experience
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Cross-Platform**: Available as web app and browser extension
- **Network Switching**: Easy switching between Mainnet and Devnet
- **Copy to Clipboard**: Quick copying of addresses and transaction IDs
- **Error Handling**: Comprehensive error messages and user guidance

## 🏗️ Project Structure

```
Stackk_Wallet/
├── apps/
│   ├── web/                 # Web application
│   │   ├── src/
│   │   │   ├── App.tsx      # Main application component
│   │   │   ├── App.css      # Styling
│   │   │   └── main.tsx     # Entry point
│   │   ├── public/          # Static assets
│   │   └── package.json     # Web app dependencies
│   └── extension/           # Browser extension
│       ├── src/
│       │   ├── App.tsx      # Extension main component
│       │   └── main.tsx     # Extension entry point
│       ├── background.js    # Service worker
│       ├── manifest.json    # Extension manifest
│       └── package.json     # Extension dependencies
├── packages/
│   └── core/               # Shared utilities
│       ├── src/
│       │   ├── crypto.ts   # Cryptographic functions
│       │   └── keys.ts     # Key management
│       └── package.json    # Core package dependencies
├── .trae/
│   └── documents/          # Technical documentation
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Modern web browser with WebUSB support (for Ledger)

### Web Application

1. **Clone the repository**
   ```bash
   git clone https://github.com/Karfearsw/Stackkwallet.git
   cd Stackkwallet
   ```

2. **Install dependencies**
   ```bash
   # Using npm
   npm install
   
   # Using pnpm (recommended)
   pnpm install
   ```

3. **Start the web application**
   ```bash
   cd apps/web
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Browser Extension

1. **Build the extension**
   ```bash
   cd apps/extension
   npm run build
   ```

2. **Load in browser**
   - **Chrome/Edge**: Go to `chrome://extensions/`, enable Developer mode, click "Load unpacked", select `apps/extension/dist`
   - **Firefox**: Go to `about:debugging`, click "This Firefox", click "Load Temporary Add-on", select `apps/extension/dist/manifest.json`

## 🔧 Development

### Environment Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Set up environment variables**
   Create `.env` files in both `apps/web/` and `apps/extension/`:
   ```env
   VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
   ```

3. **Start development servers**
   ```bash
   # Web app
   cd apps/web && npm run dev
   
   # Extension
   cd apps/extension && npm run dev
   ```

### Building for Production

```bash
# Build web app
cd apps/web && npm run build

# Build extension
cd apps/extension && npm run build
```

## 🔐 Security Features

### Hardware Wallet Integration
- **Ledger Support**: Full integration with Ledger hardware wallets
- **Secure Signing**: All transactions signed on the hardware device
- **Device Detection**: Automatic detection of connected Ledger devices
- **Multi-Model Support**: Compatible with all Ledger models

### Mnemonic Security
- **BIP39 Standard**: Industry-standard mnemonic generation
- **Secure Display**: Protected mnemonic viewing with warnings
- **Backup Verification**: Confirmation required before proceeding
- **No Storage**: Mnemonics are never stored permanently

### Network Security
- **RPC Validation**: Verified Solana RPC endpoints
- **Network Warnings**: Clear indicators for testnet vs mainnet
- **Transaction Confirmation**: Multiple confirmation steps for transfers

## 🌐 Supported Networks

- **Solana Mainnet**: Production network for real transactions
- **Solana Devnet**: Development network for testing
- **Ethereum** (Coming Soon): Ethereum mainnet and testnets

## 📱 Browser Compatibility

### Web Application
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Browser Extension
- Chrome/Chromium 88+
- Firefox 88+
- Edge 88+

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [https://stackk-wallet.vercel.app](https://stackk-wallet.vercel.app)
- **GitHub**: [https://github.com/Karfearsw/Stackkwallet](https://github.com/Karfearsw/Stackkwallet)
- **Documentation**: [Technical Docs](.trae/documents/)

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Karfearsw/Stackkwallet/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

## 🙏 Acknowledgments

- **Solana Foundation** for the robust blockchain infrastructure
- **Thirdweb** for wallet connection utilities
- **Ledger** for hardware wallet integration
- **Vite** for the fast development experience
- **React** and **TypeScript** for the solid foundation

---

**⚠️ Security Notice**: This wallet handles cryptocurrency. Always verify transactions carefully and keep your seed phrase secure. Never share your private keys or seed phrase with anyone.

**🚧 Development Status**: This project is actively maintained and developed. Features may be added or modified based on user feedback and security requirements.