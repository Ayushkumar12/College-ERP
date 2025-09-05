import React, { useState, useEffect } from 'react';
import { getMobileInfo } from '../../utils/mobileUtils';

const MobileDebug = () => {
  const [info, setInfo] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setInfo(getMobileInfo());
  }, []);

  if (!info || !show) {
    return (
      <button 
        onClick={() => setShow(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 9998
        }}
      >
        📱
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9998,
      fontFamily: 'monospace'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <strong>Mobile Debug Info</strong>
        <button 
          onClick={() => setShow(false)}
          style={{
            background: 'transparent',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ×
        </button>
      </div>
      
      <div><strong>Mobile:</strong> {info.isMobile ? 'Yes' : 'No'}</div>
      <div><strong>iOS:</strong> {info.isIOS ? 'Yes' : 'No'}</div>
      <div><strong>Android:</strong> {info.isAndroid ? 'Yes' : 'No'}</div>
      <div><strong>HTTPS:</strong> {info.isHTTPS ? 'Yes' : 'No'}</div>
      <div><strong>Viewport:</strong> {info.viewport.width}x{info.viewport.height}</div>
      <div><strong>DPR:</strong> {info.viewport.devicePixelRatio}</div>
      <div style={{ marginTop: '10px', fontSize: '10px', opacity: 0.7 }}>
        <strong>User Agent:</strong><br />
        {info.userAgent}
      </div>
    </div>
  );
};

export default MobileDebug;