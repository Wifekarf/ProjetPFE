import { useEffect } from 'react';

export function useBeforeUnload(enabled) {
  useEffect(() => {
    if (!enabled) return;
    const warn = e => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [enabled]);
}
