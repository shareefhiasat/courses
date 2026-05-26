/**
 * useKeyboardShortcuts Hook
 * Registers keyboard shortcuts for Smart Drive
 */

import { useEffect } from 'react';

export function useKeyboardShortcuts(handlers) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + F - Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && handlers.onSearch) {
        e.preventDefault();
        handlers.onSearch();
      }

      // Ctrl/Cmd + U - Upload
      if ((e.ctrlKey || e.metaKey) && e.key === 'u' && handlers.onUpload) {
        e.preventDefault();
        handlers.onUpload();
      }

      // Ctrl/Cmd + N - New folder
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && handlers.onNewFolder) {
        e.preventDefault();
        handlers.onNewFolder();
      }

      // Delete - Move to trash
      if (e.key === 'Delete' && handlers.onDelete) {
        e.preventDefault();
        handlers.onDelete();
      }

      // Escape - Clear selection / close modals
      if (e.key === 'Escape' && handlers.onEscape) {
        e.preventDefault();
        handlers.onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers]);
}

export default useKeyboardShortcuts;
