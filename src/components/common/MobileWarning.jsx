import React, { useState, useEffect } from 'react';
import { showMobileWarning, getMobileInfo } from '../../utils/mobileUtils';
import './MobileWarning.css';

const MobileWarning = () => {
  const [warning, setWarning] = useState({ show: false });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkWarning = () => {
      const warningInfo = showMobileWarning();
      setWarning(warningInfo);
    };

    checkWarning();
    window.addEventListener('resize', checkWarning);
    window.addEventListener('orientationchange', checkWarning);

    return () => {
      window.removeEventListener('resize', checkWarning);
      window.removeEventListener('orientationchange', checkWarning);
    };
  }, []);

  if (!warning.show || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
  };

  const getIcon = () => {
    switch (warning.type) {
      case 'https':
        return '🔒';
      case 'screen':
        return '📱';
      default:
        return '⚠️';
    }
  };

  const getActionButton = () => {
    if (warning.type === 'https') {
      return (
        <button 
          onClick={() => window.location.href = window.location.href.replace('http:', 'https:')}
          className="warning-action-btn"
        >
          Switch to HTTPS
        </button>
      );
    }
    return null;
  };

  return (
    <div className="mobile-warning">
      <div className="warning-content">
        <div className="warning-icon">{getIcon()}</div>
        <div className="warning-text">
          <h4>Mobile Compatibility Notice</h4>
          <p>{warning.message}</p>
        </div>
        <div className="warning-actions">
          {getActionButton()}
          <button onClick={handleDismiss} className="warning-dismiss-btn">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileWarning;