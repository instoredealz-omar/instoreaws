import { useEffect } from 'react';

/**
 * Custom hook to lock body scroll when modal is open
 * Prevents background content interaction when modal is displayed
 */
export function useModalLock(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.setAttribute('data-modal-open', 'true');
      
      // Add overflow hidden to prevent any scrolling
      document.documentElement.style.overflow = 'hidden';
      
      return () => {
        // Restore body scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.removeAttribute('data-modal-open');
        
        // Restore page overflow
        document.documentElement.style.overflow = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
}

/**
 * Utility function to manually lock/unlock body scroll
 * Useful for non-hook scenarios
 */
export const modalScrollLock = {
  lock: () => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.setAttribute('data-modal-open', 'true');
    document.documentElement.style.overflow = 'hidden';
    return scrollY;
  },
  
  unlock: (scrollY: number = 0) => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.removeAttribute('data-modal-open');
    document.documentElement.style.overflow = '';
    window.scrollTo(0, scrollY);
  }
};