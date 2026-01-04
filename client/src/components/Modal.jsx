import React from 'react';
import './Modal.css';

export default function Modal({ open, title, children, onClose, actions, size = 'default' }) {
  if (!open) return null;
  const sizeClass = size === 'fullscreen' ? 'modal-fullscreen' : size === 'large' ? 'modal-large' : '';
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal-card ${sizeClass}`} onClick={(e) => e.stopPropagation()}>
        {title && <div className="modal-header">{title}</div>}
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}
