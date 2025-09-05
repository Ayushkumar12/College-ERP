import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import './QRScanner.css';

const QRScanner = ({ onScan, onError }) => {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeScanner = async () => {
      try {
        // Check if camera is available
        const hasCamera = await QrScanner.hasCamera();
        setHasCamera(hasCamera);

        if (!hasCamera) {
          setError('No camera found on this device');
          return;
        }

        // Initialize QR Scanner
        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            console.log('QR Code detected:', result.data);
            setIsScanning(false);
            onScan(result.data);
          },
          {
            onDecodeError: (error) => {
              // Don't show decode errors as they're normal when no QR code is visible
              console.log('Decode error (normal):', error);
            },
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment', // Use back camera on mobile
            maxScansPerSecond: 5, // Optimize for mobile performance
            calculateScanRegion: (video) => {
              // Custom scan region for better mobile performance
              const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
              const scanRegionSize = Math.round(0.7 * smallestDimension);
              return {
                x: Math.round((video.videoWidth - scanRegionSize) / 2),
                y: Math.round((video.videoHeight - scanRegionSize) / 2),
                width: scanRegionSize,
                height: scanRegionSize,
              };
            },
          }
        );

        qrScannerRef.current = qrScanner;

        // Start scanning
        await qrScanner.start();
        setIsScanning(true);

      } catch (error) {
        console.error('Error initializing QR scanner:', error);
        setError('Failed to initialize camera: ' + error.message);
        if (onError) onError(error);
      }
    };

    initializeScanner();

    // Cleanup
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, [onScan, onError]);

  const handleRetry = () => {
    setError('');
    window.location.reload(); // Simple retry by reloading
  };

  if (error) {
    return (
      <div className="qr-scanner-error">
        <div className="error-icon">📷</div>
        <h3>Camera Error</h3>
        <p>{error}</p>
        <button onClick={handleRetry} className="retry-btn">
          Try Again
        </button>
        <div className="error-help">
          <h4>Troubleshooting:</h4>
          <ul>
            <li>Make sure you've granted camera permissions</li>
            <li>Check if another app is using the camera</li>
            <li>Try refreshing the page</li>
            <li>Ensure you're using HTTPS (required for camera access)</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!hasCamera) {
    return (
      <div className="qr-scanner-error">
        <div className="error-icon">📷</div>
        <h3>No Camera Found</h3>
        <p>This device doesn't have a camera or camera access is not available.</p>
        <div className="manual-input">
          <h4>Manual QR Code Entry</h4>
          <p>If you have the QR code data, you can enter it manually:</p>
          <textarea
            placeholder="Paste QR code data here..."
            rows={4}
            onPaste={(e) => {
              const data = e.clipboardData.getData('text');
              if (data) {
                setTimeout(() => onScan(data), 100);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="qr-scanner-container">
      <div className="scanner-header">
        <h3>Point your camera at the QR code</h3>
        <p>Make sure the QR code is clearly visible and well-lit</p>
      </div>

      <div className="scanner-video-container">
        <video
          ref={videoRef}
          className="scanner-video"
          playsInline
          muted
          autoPlay
          webkit-playsinline="true"
        />
        
        <div className="scanner-overlay">
          <div className="scanner-frame">
            <div className="corner top-left"></div>
            <div className="corner top-right"></div>
            <div className="corner bottom-left"></div>
            <div className="corner bottom-right"></div>
          </div>
        </div>

        {isScanning && (
          <div className="scanning-indicator">
            <div className="scanning-line"></div>
          </div>
        )}
      </div>

      <div className="scanner-status">
        {isScanning ? (
          <div className="status-scanning">
            <div className="status-dot"></div>
            <span>Scanning for QR code...</span>
          </div>
        ) : (
          <div className="status-loading">
            <div className="loading-spinner"></div>
            <span>Initializing camera...</span>
          </div>
        )}
      </div>

      <div className="scanner-tips">
        <h4>Tips for better scanning:</h4>
        <ul>
          <li>Hold your device steady</li>
          <li>Ensure good lighting</li>
          <li>Keep the QR code within the frame</li>
          <li>Move closer or further away if needed</li>
        </ul>
      </div>
    </div>
  );
};

export default QRScanner;