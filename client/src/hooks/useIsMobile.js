import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

export default useIsMobile;
