import { useState, useCallback } from 'react';

/**
 * useEditLayoutGuard
 * Manages edit-layout mode with an auto-save toggle and a save/discard dialog.
 *
 * Usage:
 *   const guard = useEditLayoutGuard(engineRef, { t });
 *   guard.autoSave      // boolean
 *   guard.editLayout    // boolean
 *   guard.showExitDialog // boolean
 *   guard.toggleAutoSave()
 *   guard.handleToggleEditLayout()
 *   guard.handleSaveChanges()
 *   guard.handleDiscardChanges()
 *   guard.handleCancelExit()
 *
 * Pass `autoSave` and `editLayout` to <DashboardEngine>.
 * When autoSave is OFF and the user exits edit mode with unsaved changes,
 * a dialog is shown (guard.showExitDialog === true) — render it in your component.
 */
const useEditLayoutGuard = (engineRef, { t } = {}) => {
  const [autoSave, setAutoSave] = useState(true);
  const [editLayout, setEditLayout] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const toggleAutoSave = useCallback(() => {
    setAutoSave(prev => {
      const next = !prev;
      if (next && engineRef.current?.hasUnsavedChanges) {
        // Switching back to auto-save — commit any pending changes
        engineRef.current?.saveLayout?.();
      }
      return next;
    });
  }, [engineRef]);

  const handleToggleEditLayout = useCallback(() => {
    setEditLayout(prev => {
      const next = !prev;
      // Exiting edit mode
      if (!next && !autoSave) {
        const hasUnsaved = engineRef.current?.hasUnsavedChanges;
        if (hasUnsaved) {
          setShowExitDialog(true);
          // Don't actually exit yet — wait for dialog resolution
          return prev;
        }
      }
      return next;
    });
  }, [autoSave, engineRef]);

  const handleSaveChanges = useCallback(() => {
    engineRef.current?.saveLayout?.();
    setShowExitDialog(false);
    setEditLayout(false);
  }, [engineRef]);

  const handleDiscardChanges = useCallback(() => {
    engineRef.current?.discardLayout?.();
    setShowExitDialog(false);
    setEditLayout(false);
  }, [engineRef]);

  const handleCancelExit = useCallback(() => {
    setShowExitDialog(false);
    // Stay in edit mode
  }, []);

  return {
    autoSave,
    editLayout,
    showExitDialog,
    toggleAutoSave,
    handleToggleEditLayout,
    handleSaveChanges,
    handleDiscardChanges,
    handleCancelExit,
  };
};

export default useEditLayoutGuard;
