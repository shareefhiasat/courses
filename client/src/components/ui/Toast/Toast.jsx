import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import styles from './Toast.module.css';

const ToastContext = createContext();

/**
 * Toast Provider Component
 * Wrap your app with this to enable toast notifications
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    // Primary API
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    info: (message, duration) => addToast(message, 'info', duration),

    // Backwards-compatible helpers used across older pages
    showSuccess: (message, opts) => addToast(message, 'success', opts?.duration),
    showError: (message, opts) => addToast(message, 'error', opts?.duration),
    showInfo: (message, opts) => addToast(message, 'info', opts?.duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast notifications
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

/**
 * Toast Component
 */
const Toast = ({ id, message, type, onClose }) => {
  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  };

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.toastIcon}>{icons[type]}</div>
      <div className={styles.toastMessage}>{message}</div>
      <button
        className={styles.toastClose}
        onClick={onClose}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
