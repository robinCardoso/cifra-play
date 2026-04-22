import { useState, useEffect } from 'react';

/**
 * Hook reativo para detectar se o dispositivo está em modo mobile.
 * Retorna `true` quando largura < 768px (breakpoint `md` do Tailwind).
 */
const useIsMobile = (breakpoint = 1024) => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);

    // API moderna
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
    } else {
      mql.addListener(handler); // Safari < 14
    }

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler);
      } else {
        mql.removeListener(handler);
      }
    };
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;
