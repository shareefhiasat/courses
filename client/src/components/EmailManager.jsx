import React, { useState } from 'react';
import './EmailManager.css';
import Modal from './Modal';
import { useToast } from './ToastProvider';
import { useLang } from '../contexts/LangContext';

const EmailManager = ({ 
  emails = [], 
  onEmailsChange, 
  title = "Email List",
  placeholder = "Enter email address...",
  description = "",
  excludeEmails = [],
  excludeMessage = "Email already exists in another list"
}) => {
  const { t } = useLang();
  const [newEmail, setNewEmail] = useState('');
  const [importModal, setImportModal] = useState({ open: false, text: '' });
  const toast = useToast();

  const addEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = newEmail.trim();
    if (email && !emails.includes(email) && !excludeEmails.includes(email)) {
      if (emailRegex.test(email)) {
        onEmailsChange([...emails, email]);
        setNewEmail('');
        toast?.showSuccess('Email added successfully');
      } else {
        toast?.showError('Please enter a valid email address');
      }
    } else if (emails.includes(email)) {
      toast?.showError('Email already exists in the list');
    } else if (excludeEmails.includes(email)) {
      toast?.showError(excludeMessage);
    }
  };

  const removeEmail = (emailToRemove) => {
    onEmailsChange(emails.filter(email => email !== emailToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const importFromText = () => {
    setImportModal({ open: true, text: '' });
  };

  const handleImport = () => {
    const text = importModal.text;
    if (text) {
      const newEmails = text
        .split(/[\n,;]/)
        .map(email => email.trim())
        .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        .filter(email => !emails.includes(email) && !excludeEmails.includes(email));
      
      if (newEmails.length > 0) {
        onEmailsChange([...emails, ...newEmails]);
        toast?.showSuccess(`Added ${newEmails.length} new email(s)`);
      } else {
        toast?.showError('No valid new emails found');
      }
    }
    setImportModal({ open: false, text: '' });
  };

  return (
    <div className="email-manager">
      <div className="email-manager-header">
        <h3>{title}</h3>
        {description && <p className="description">{description}</p>}
      </div>

      <div className="add-email-section">
        <div className="add-email-input">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="email-input"
          />
          <button onClick={addEmail} className="add-btn" disabled={!newEmail.trim()}>
            ➕ {t('add')}
          </button>
        </div>
        <button onClick={importFromText} className="import-btn">
          📋 {t('import_multiple')}
        </button>
      </div>

      <div className="emails-list">
        {emails.length === 0 ? (
          <div className="no-emails">No emails added yet</div>
        ) : (
          <div className="emails-grid">
            {emails.map((email, index) => (
              <div key={index} className="email-tag">
                <span className="email-text">{email}</span>
                <button 
                  onClick={() => removeEmail(email)}
                  className="remove-btn"
                  title="Remove email"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="email-count">
        {t('total')}: {emails.length} {t('email')}{emails.length !== 1 ? 's' : ''}
      </div>

      <Modal
        open={importModal.open}
        title="Import Multiple Emails"
        onClose={() => setImportModal({ open: false, text: '' })}
        actions={
          <>
            <button 
              onClick={() => setImportModal({ open: false, text: '' })}
              className="modal-btn-secondary"
            >
              Cancel
            </button>
            <button 
              onClick={handleImport}
              className="btn-primary"
              disabled={!importModal.text.trim()}
            >
              Import
            </button>
          </>
        }
      >
        <p>Paste multiple emails (one per line or comma-separated):</p>
        <textarea
          value={importModal.text}
          onChange={(e) => setImportModal({ ...importModal, text: e.target.value })}
          placeholder="email1@example.com&#10;email2@example.com&#10;email3@example.com"
          rows={6}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}
        />
      </Modal>
    </div>
  );
};

export default EmailManager;
