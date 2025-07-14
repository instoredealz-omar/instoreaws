import { useEffect } from 'react';

/**
 * Custom hook for non-blocking modals that allow background interaction
 * Does not prevent scrolling or interaction with background content
 */
export function useNonBlockingModal(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      // Only add a data attribute to indicate modal is open
      // but don't lock scrolling or interaction
      document.body.setAttribute('data-non-blocking-modal-open', 'true');
      
      return () => {
        document.body.removeAttribute('data-non-blocking-modal-open');
      };
    }
  }, [isOpen]);
}

/**
 * Utility function to manually manage non-blocking modal state
 * Useful for non-hook scenarios
 */
export const nonBlockingModalState = {
  open: () => {
    document.body.setAttribute('data-non-blocking-modal-open', 'true');
  },
  
  close: () => {
    document.body.removeAttribute('data-non-blocking-modal-open');
  }
};