# Contributing to Stackk Wallet

Thank you for your interest in contributing to Stackk Wallet! We welcome contributions from the community and are excited to see what you'll bring to the project.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18 or higher
- npm or pnpm (pnpm recommended)
- Git
- A modern web browser

### Setting Up Your Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/Stackkwallet.git
   cd Stackkwallet
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   Create `.env` files in `apps/web/` and `apps/extension/`:
   ```env
   VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
   ```

4. **Start development servers**
   ```bash
   # Web application
   cd apps/web && npm run dev
   
   # Browser extension
   cd apps/extension && npm run dev
   ```

## 📋 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear, descriptive title
- Steps to reproduce the bug
- Expected vs actual behavior
- Screenshots or error messages (if applicable)
- Your environment details (OS, browser, Node.js version)

### Suggesting Features

We welcome feature suggestions! Please:
- Check existing issues to avoid duplicates
- Provide a clear description of the feature
- Explain the use case and benefits
- Consider the security implications (this is a wallet!)

### Code Contributions

#### Branch Naming Convention
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Adding or updating tests

#### Development Workflow

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed
   - Ensure all tests pass

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

#### Commit Message Convention

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add Ledger hardware wallet support
fix: resolve token balance display issue
docs: update installation instructions
```

## 🏗️ Project Structure

```
Stackk_Wallet/
├── apps/
│   ├── web/                 # Web application
│   └── extension/           # Browser extension
├── packages/
│   └── core/               # Shared utilities and types
├── .trae/
│   └── documents/          # Technical documentation
└── README.md
```

### Code Organization

- **Components**: Keep components small and focused (< 300 lines)
- **Hooks**: Extract reusable logic into custom hooks
- **Types**: Define TypeScript interfaces in shared locations
- **Utils**: Place utility functions in appropriate modules

## 🔒 Security Guidelines

**⚠️ CRITICAL**: This project handles cryptocurrency and private keys. Security is paramount.

### Security Best Practices

1. **Never log sensitive data**
   - Private keys, mnemonics, or passwords
   - User addresses or transaction details in production

2. **Validate all inputs**
   - Sanitize user inputs
   - Validate network responses
   - Check transaction parameters

3. **Use secure dependencies**
   - Keep dependencies updated
   - Audit new packages before adding
   - Prefer well-established libraries

4. **Follow crypto best practices**
   - Use established cryptographic libraries
   - Never implement custom crypto
   - Validate all cryptographic operations

### Security Review Process

All security-related changes require:
- Thorough code review by maintainers
- Testing on testnet before mainnet
- Documentation of security implications

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific app
cd apps/web && npm test
cd apps/extension && npm test
```

### Writing Tests

- Write unit tests for utility functions
- Add integration tests for wallet operations
- Test error handling and edge cases
- Ensure tests work on both mainnet and devnet

### Manual Testing Checklist

Before submitting a PR, please test:
- [ ] Wallet generation and import
- [ ] Token transfers (SOL and SPL)
- [ ] Network switching
- [ ] Browser extension functionality
- [ ] Hardware wallet integration (if applicable)
- [ ] Error handling and user feedback

## 📝 Documentation

### Code Documentation

- Add JSDoc comments for public functions
- Document complex algorithms or business logic
- Include examples for utility functions
- Keep comments up-to-date with code changes

### User Documentation

- Update README.md for new features
- Add installation instructions for new dependencies
- Document configuration changes
- Include troubleshooting guides

## 🎨 Code Style

### TypeScript Guidelines

- Use strict TypeScript configuration
- Define interfaces for all data structures
- Avoid `any` type - use proper typing
- Use meaningful variable and function names

### React Guidelines

- Use functional components with hooks
- Keep components under 300 lines
- Extract reusable logic into custom hooks
- Use proper prop typing with interfaces

### CSS Guidelines

- Use Tailwind CSS utility classes
- Avoid custom CSS when possible
- Follow responsive design principles
- Maintain consistent spacing and colors

## 🔄 Pull Request Process

### Before Submitting

1. **Ensure your code follows the style guidelines**
2. **Add or update tests as needed**
3. **Update documentation**
4. **Test thoroughly on both networks**
5. **Rebase your branch on the latest main**

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Tested on testnet
- [ ] Tested on mainnet (if applicable)

## Security Considerations
Describe any security implications

## Screenshots (if applicable)
Add screenshots for UI changes
```

### Review Process

1. **Automated checks** must pass (linting, tests, build)
2. **Code review** by at least one maintainer
3. **Security review** for sensitive changes
4. **Testing** on development environment
5. **Approval** and merge by maintainers

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers get started
- Focus on the code, not the person

### Communication

- Use GitHub issues for bug reports and feature requests
- Join discussions in pull requests
- Ask questions in issues or discussions
- Be patient with response times

## 🏆 Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Special mentions for security improvements

## 📞 Getting Help

If you need help:
1. Check existing documentation
2. Search through issues
3. Create a new issue with the "question" label
4. Join community discussions

## 🚀 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

### Release Checklist

- [ ] Update version numbers
- [ ] Update CHANGELOG.md
- [ ] Test on all supported platforms
- [ ] Security audit for major releases
- [ ] Deploy to production
- [ ] Create GitHub release with notes

---

Thank you for contributing to Stackk Wallet! Your efforts help make cryptocurrency more accessible and secure for everyone. 🚀