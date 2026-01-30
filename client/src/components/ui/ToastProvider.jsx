import React, { createContext, useContext, useState, useCallback } from 'react';
import './ToastProvider.css';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

let idSeq = 0;

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, { type = 'info', duration = 2500 } = {}) => {
    const id = ++idSeq;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration) {
      setTimeout(() => remove(id), duration);
    }
    return id;
  }, [remove]);

  const value = {
    showSuccess: (msg, opts) => show(msg, { type: 'success', ...(opts || {}) }),
    showError: (msg, opts) => show(msg, { type: 'error', ...(opts || {}) }),
    showInfo: (msg, opts) => show(msg, { type: 'info', ...(opts || {}) }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => remove(t.id)}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
