import React, { useState, useEffect } from 'react';
import { Download, Chrome, Globe, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface BrowserInfo {
  name: string;
  icon: React.ReactNode;
  isSupported: boolean;
  installMethod: string;
}

const InstallExtensionButton: React.FC = () => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success' | 'error'>('idle');
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    detectBrowser();
  }, []);

  const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      setBrowserInfo({
        name: 'Chrome',
        icon: <Chrome className="w-5 h-5" />,
        isSupported: true,
        installMethod: 'chrome-extension'
      });
    } else if (userAgent.includes('firefox')) {
      setBrowserInfo({
        name: 'Firefox',
        icon: <Globe className="w-5 h-5" />,
        isSupported: true,
        installMethod: 'firefox-addon'
      });
    } else if (userAgent.includes('edg')) {
      setBrowserInfo({
        name: 'Edge',
        icon: <Globe className="w-5 h-5" />,
        isSupported: true,
        installMethod: 'edge-extension'
      });
    } else {
      setBrowserInfo({
        name: 'Browser',
        icon: <Globe className="w-5 h-5" />,
        isSupported: false,
        installMethod: 'manual'
      });
    }
  };

  const handleInstallClick = async () => {
    if (!browserInfo) return;

    setIsInstalling(true);
    setInstallStatus('installing');

    try {
      // For modern browsers, we'll use the Chrome Extension API or similar
      if (browserInfo.isSupported && 'chrome' in window && (window as any).chrome?.runtime) {
        // Try to install directly using browser APIs
        await installDirectly();
      } else {
        // Fallback to download method
        await downloadExtension();
      }
    } catch (error) {
      console.error('Installation failed:', error);
      setInstallStatus('error');
      setShowGuide(true);
    } finally {
      setIsInstalling(false);
    }
  };

  const installDirectly = async (): Promise<void> => {
    return new Promise((resolve) => {
      // Simulate direct installation process
      setTimeout(() => {
        // In a real implementation, this would use browser extension APIs
        // For now, we'll simulate success and show the guide
        setInstallStatus('success');
        setShowGuide(true);
        resolve();
      }, 2000);
    });
  };

  const downloadExtension = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Create a download link for the extension package
        const link = document.createElement('a');
        link.href = '/stackk-wallet-extension-v1.0.0.zip';
        link.download = 'stackk-wallet-extension-v1.0.0.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setInstallStatus('success');
        setShowGuide(true);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };

  const getButtonText = () => {
    if (isInstalling) return 'Installing...';
    if (installStatus === 'success') return 'Installed! ✨';
    if (installStatus === 'error') return 'Try Again';
    return `Add to ${browserInfo?.name || 'Browser'}`;
  };

  const getButtonIcon = () => {
    if (isInstalling) return <div className="loading-spinner" />;
    if (installStatus === 'success') return <CheckCircle className="w-5 h-5" />;
    if (installStatus === 'error') return <AlertCircle className="w-5 h-5" />;
    return browserInfo?.icon || <Download className="w-5 h-5" />;
  };

  if (!browserInfo) return null;

  return (
    <div className="install-extension-container">
      <button
        onClick={handleInstallClick}
        disabled={isInstalling || installStatus === 'success'}
        className={`install-extension-btn ${installStatus}`}
      >
        <div className="btn-content">
          {getButtonIcon()}
          <span className="btn-text">{getButtonText()}</span>
          <Sparkles className="sparkle-icon" />
        </div>
        <div className="btn-shimmer" />
      </button>

      {showGuide && (
        <div className="installation-guide-modal">
          <div className="modal-overlay-install" onClick={() => setShowGuide(false)}>
            <div className="modal-content-install" onClick={(e) => e.stopPropagation()}>
              <div className="guide-header">
                <div className="guide-icon">
                  {browserInfo.icon}
                </div>
                <h3>Install Stackk Wallet Extension</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowGuide(false)}
                >
                  ×
                </button>
              </div>

              <div className="guide-content">
                {installStatus === 'success' ? (
                  <div className="success-guide">
                    <CheckCircle className="success-icon-large" />
                    <h4>🎉 Extension Downloaded Successfully!</h4>
                    <p>Follow these simple steps to complete the installation:</p>
                  </div>
                ) : (
                  <div className="error-guide">
                    <AlertCircle className="error-icon-large" />
                    <h4>Manual Installation Required</h4>
                    <p>Don't worry! Installing the extension is easy:</p>
                  </div>
                )}

                <div className="installation-steps">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h5>Extract the Extension</h5>
                      <p>Unzip the downloaded <code>stackk-wallet-extension-v1.0.0.zip</code> file to a folder on your computer.</p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h5>Open {browserInfo.name} Extensions</h5>
                      <p>
                        {browserInfo.name === 'Chrome' && 'Go to chrome://extensions/ or Menu → More Tools → Extensions'}
                        {browserInfo.name === 'Firefox' && 'Go to about:addons or Menu → Add-ons and Themes'}
                        {browserInfo.name === 'Edge' && 'Go to edge://extensions/ or Menu → Extensions'}
                        {!['Chrome', 'Firefox', 'Edge'].includes(browserInfo.name) && 'Open your browser\'s extension management page'}
                      </p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h5>Enable Developer Mode</h5>
                      <p>Toggle on "Developer mode" in the top-right corner of the extensions page.</p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h5>Load the Extension</h5>
                      <p>Click "Load unpacked" and select the folder where you extracted the extension files.</p>
                    </div>
                  </div>

                  <div className="step">
                    <div className="step-number">5</div>
                    <div className="step-content">
                      <h5>🚀 You're Ready!</h5>
                      <p>The Stackk Wallet extension icon should now appear in your browser toolbar. Click it to get started!</p>
                    </div>
                  </div>
                </div>

                <div className="guide-footer">
                  <button 
                    className="btn-primary-guide"
                    onClick={() => setShowGuide(false)}
                  >
                    Got it! 🎯
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .install-extension-container {
          position: relative;
        }

        .install-extension-btn {
          position: relative;
          background: linear-gradient(135deg, #8B5CF6, #06B6D4, #10B981);
          border: none;
          color: white;
          padding: 1rem 2rem;
          border-radius: 1rem;
          cursor: pointer;
          font-weight: 700;
          font-size: 1rem;
          transition: all 0.3s ease;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
          animation: glow-pulse 2s ease-in-out infinite;
        }

        .install-extension-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 40px rgba(139, 92, 246, 0.4);
        }

        .install-extension-btn:disabled {
          cursor: not-allowed;
          opacity: 0.8;
        }

        .install-extension-btn.success {
          background: linear-gradient(135deg, #10B981, #059669);
          animation: success-pulse 1s ease-in-out;
        }

        .install-extension-btn.error {
          background: linear-gradient(135deg, #EF4444, #DC2626);
          animation: error-shake 0.5s ease-in-out;
        }

        .btn-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          position: relative;
          z-index: 2;
        }

        .btn-text {
          font-weight: 700;
          letter-spacing: 0.025em;
        }

        .sparkle-icon {
          width: 1rem;
          height: 1rem;
          animation: sparkle-rotate 2s linear infinite;
        }

        .btn-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.6s ease;
          z-index: 1;
        }

        .install-extension-btn:hover .btn-shimmer {
          left: 100%;
        }

        .loading-spinner {
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
        }

        .installation-guide-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
        }

        .modal-overlay-install {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .modal-content-install {
          background: linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 0.9));
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 1.5rem;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        }

        .guide-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 2rem 2rem 1rem 2rem;
          border-bottom: 1px solid rgba(75, 85, 99, 0.3);
          position: relative;
        }

        .guide-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 3rem;
          height: 3rem;
          background: linear-gradient(135deg, #8B5CF6, #06B6D4);
          border-radius: 1rem;
          color: white;
        }

        .guide-header h3 {
          flex: 1;
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .close-btn {
          background: rgba(75, 85, 99, 0.6);
          border: none;
          color: #D1D5DB;
          width: 2rem;
          height: 2rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .close-btn:hover {
          background: rgba(139, 92, 246, 0.6);
          color: white;
        }

        .guide-content {
          padding: 2rem;
        }

        .success-guide, .error-guide {
          text-align: center;
          margin-bottom: 2rem;
        }

        .success-icon-large, .error-icon-large {
          width: 3rem;
          height: 3rem;
          margin: 0 auto 1rem auto;
          color: #10B981;
        }

        .error-icon-large {
          color: #EF4444;
        }

        .success-guide h4, .error-guide h4 {
          color: white;
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
        }

        .success-guide p, .error-guide p {
          color: #9CA3AF;
          margin: 0;
        }

        .installation-steps {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .step {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background: linear-gradient(135deg, #8B5CF6, #06B6D4);
          color: white;
          border-radius: 50%;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-content h5 {
          color: white;
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .step-content p {
          color: #D1D5DB;
          font-size: 0.875rem;
          line-height: 1.5;
          margin: 0;
        }

        .step-content code {
          background: rgba(31, 41, 55, 0.8);
          color: #8B5CF6;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.8rem;
        }

        .guide-footer {
          margin-top: 2rem;
          text-align: center;
        }

        .btn-primary-guide {
          background: linear-gradient(135deg, #8B5CF6, #06B6D4);
          border: none;
          color: white;
          padding: 0.75rem 2rem;
          border-radius: 0.75rem;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.3s ease;
        }

        .btn-primary-guide:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(139, 92, 246, 0.4);
        }

        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3); }
          50% { box-shadow: 0 15px 40px rgba(139, 92, 246, 0.5); }
        }

        @keyframes success-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        @keyframes error-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes sparkle-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .modal-content-install {
            margin: 1rem;
            max-height: calc(100vh - 2rem);
          }

          .guide-header {
            padding: 1.5rem 1.5rem 1rem 1.5rem;
          }

          .guide-content {
            padding: 1.5rem;
          }

          .step {
            gap: 0.75rem;
          }

          .step-number {
            width: 1.75rem;
            height: 1.75rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export { InstallExtensionButton };
export default InstallExtensionButton;