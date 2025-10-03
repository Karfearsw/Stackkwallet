# Stackk Wallet - Deployment Guide

## Project Overview

Stackk Wallet is a modern web-based cryptocurrency wallet built with:
- **Frontend**: React 19 + TypeScript + Vite
- **Architecture**: Monorepo with workspace structure
- **Blockchain Integration**: Solana (devnet) + Thirdweb (Sepolia)
- **PWA Features**: Service worker, manifest, offline capabilities
- **Build Output**: Static files suitable for CDN deployment

## Prerequisites

### Environment Variables
The application requires the following environment variable:
- `VITE_THIRDWEB_CLIENT_ID`: Your Thirdweb client ID for wallet connectivity

### Build Dependencies
- Node.js 18+ 
- npm workspaces support
- TypeScript compilation

## Deployment Options

### 1. Vercel Deployment (Recommended)

**Why Vercel**: Excellent React/Vite support, automatic deployments, edge functions, built-in analytics.

#### Configuration Files

Create `vercel.json` in project root:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/web/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "apps/web/dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/apps/web/dist/$1"
    },
    {
      "src": "/.*",
      "dest": "/apps/web/dist/index.html"
    }
  ],
  "env": {
    "VITE_THIRDWEB_CLIENT_ID": "@vite-thirdweb-client-id"
  }
}
```

#### Deployment Steps
1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Configure Build Settings**:
   - Build Command: `npm run build -w apps/web`
   - Output Directory: `apps/web/dist`
   - Install Command: `npm install`
3. **Environment Variables**:
   - Add `VITE_THIRDWEB_CLIENT_ID` in Vercel dashboard
4. **Deploy**: Automatic on git push

#### Custom Build Script
Add to root `package.json`:
```json
{
  "scripts": {
    "build:web": "npm run build -w packages/core && npm run build -w apps/web",
    "vercel-build": "npm run build:web"
  }
}
```

### 2. Netlify Deployment

**Why Netlify**: Great for static sites, form handling, serverless functions, branch previews.

#### Configuration Files

Create `netlify.toml` in project root:
```toml
[build]
  base = "."
  command = "npm run build:web"
  publish = "apps/web/dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  VITE_THIRDWEB_CLIENT_ID = "your_production_client_id"

[context.deploy-preview.environment]
  VITE_THIRDWEB_CLIENT_ID = "your_preview_client_id"
```

#### Deployment Steps
1. **Connect Repository**: Link GitHub repo in Netlify dashboard
2. **Build Settings**:
   - Build command: `npm run build:web`
   - Publish directory: `apps/web/dist`
3. **Environment Variables**: Set in Netlify dashboard
4. **Deploy**: Automatic on git push

### 3. GitHub Pages Deployment

**Why GitHub Pages**: Free hosting, simple setup, good for open source projects.

#### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build core package
      run: npm run build -w packages/core
      
    - name: Build web app
      run: npm run build -w apps/web
      env:
        VITE_THIRDWEB_CLIENT_ID: ${{ secrets.VITE_THIRDWEB_CLIENT_ID }}
        
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./apps/web/dist
```

#### Configuration Steps
1. **Enable GitHub Pages**: Repository Settings → Pages → GitHub Actions
2. **Add Secrets**: Repository Settings → Secrets → Actions
   - Add `VITE_THIRDWEB_CLIENT_ID`
3. **Base Path**: Update `vite.config.ts` if using custom domain:
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/your-repo-name/' // Only if using github.io/username/repo-name
})
```

## Environment Variable Setup

### Development Environment
Create `apps/web/.env.local`:
```env
VITE_THIRDWEB_CLIENT_ID=your_development_client_id
```

### Production Environment
**Security Best Practices**:
1. **Never commit** `.env` files to version control
2. **Use different client IDs** for development/staging/production
3. **Rotate keys regularly** and monitor usage
4. **Restrict domains** in Thirdweb dashboard

### Getting Thirdweb Client ID
1. Visit [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Create new project or select existing
3. Copy Client ID from project settings
4. Configure allowed domains for security

## Build Optimization

### Vite Configuration Enhancement
Update `apps/web/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          thirdweb: ['thirdweb'],
          solana: ['@solana/web3.js']
        }
      }
    }
  },
  define: {
    global: 'globalThis',
  }
})
```

### PWA Optimization
The app includes PWA features via:
- `public/manifest.webmanifest`: App metadata
- Service worker registration in `main.tsx`
- Offline-first caching strategy

## Monitoring and Analytics

### Recommended Integrations
1. **Vercel Analytics**: Built-in performance monitoring
2. **Sentry**: Error tracking and performance monitoring
3. **Google Analytics**: User behavior tracking
4. **Web Vitals**: Core performance metrics

### Health Checks
Monitor these endpoints post-deployment:
- `/`: Main application loads
- `/manifest.webmanifest`: PWA manifest accessible
- Solana devnet connectivity: `https://api.devnet.solana.com`
- Thirdweb services: Wallet connection functionality

## Troubleshooting

### Common Issues

**Build Failures**:
- Ensure `@stackk/core` builds before web app
- Check TypeScript compilation errors
- Verify all dependencies are installed

**Runtime Errors**:
- Missing `VITE_THIRDWEB_CLIENT_ID` shows warning banner
- Network connectivity issues with Solana devnet
- Wallet connection failures (check Thirdweb configuration)

**PWA Issues**:
- Service worker registration failures
- Manifest validation errors
- Icon loading problems

### Debug Commands
```bash
# Local build test
npm run build -w packages/core
npm run build -w apps/web
npm run preview -w apps/web

# Check bundle size
npx vite-bundle-analyzer apps/web/dist

# Validate PWA
npx lighthouse http://localhost:4173 --view
```

## Security Considerations

### Client-Side Security
- Environment variables prefixed with `VITE_` are public
- Sensitive operations should use server-side APIs
- Implement Content Security Policy (CSP)
- Use HTTPS in production

### Wallet Security
- Private keys never leave the browser
- Mnemonic generation uses cryptographically secure methods
- Consider implementing password-based encryption for stored data

## Performance Optimization

### Bundle Size Optimization
- Code splitting by route and vendor
- Tree shaking for unused dependencies
- Lazy loading for heavy components

### Runtime Performance
- React 19 concurrent features
- Efficient state management
- Optimized re-renders with proper memoization

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Build process tested locally
- [ ] PWA features validated
- [ ] Wallet connectivity tested
- [ ] Solana integration verified
- [ ] Performance metrics acceptable
- [ ] Security headers configured
- [ ] Error monitoring setup
- [ ] Analytics integrated
- [ ] Domain/SSL configured

## Next Steps

After successful deployment:
1. **Monitor Performance**: Set up alerts for errors and slow responses
2. **User Feedback**: Implement feedback collection mechanisms
3. **Feature Flags**: Consider feature toggle system for gradual rollouts
4. **Backup Strategy**: Regular backups of configuration and data
5. **Scaling Plan**: Prepare for increased traffic and usage

---

*This deployment guide ensures your Stackk Wallet web application is production-ready with proper security, performance, and monitoring in place.*