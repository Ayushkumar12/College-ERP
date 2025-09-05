// Mobile detection and utilities

export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = () => {
  return /Android/.test(navigator.userAgent);
};

export const isHTTPS = () => {
  return location.protocol === 'https:' || location.hostname === 'localhost';
};

export const checkCameraPermissions = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Camera permission check failed:', error);
    return false;
  }
};

export const getMobileInfo = () => {
  const userAgent = navigator.userAgent;
  const mobile = isMobile();
  const ios = isIOS();
  const android = isAndroid();
  const https = isHTTPS();
  
  return {
    isMobile: mobile,
    isIOS: ios,
    isAndroid: android,
    isHTTPS: https,
    userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1
    }
  };
};

export const showMobileWarning = () => {
  const info = getMobileInfo();
  
  if (info.isMobile && !info.isHTTPS) {
    return {
      show: true,
      message: 'Camera access requires HTTPS. Please use a secure connection.',
      type: 'https'
    };
  }
  
  if (info.isMobile && info.viewport.width < 320) {
    return {
      show: true,
      message: 'Screen size too small. Please rotate your device or use a larger screen.',
      type: 'screen'
    };
  }
  
  return { show: false };
};

// Prevent zoom on iOS when focusing inputs
export const preventIOSZoom = () => {
  if (isIOS()) {
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
    inputs.forEach(input => {
      if (input.style.fontSize !== '16px') {
        input.style.fontSize = '16px';
      }
    });
  }
};

// Add viewport height fix for mobile browsers
export const fixMobileViewport = () => {
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  setViewportHeight();
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 100);
  });
};