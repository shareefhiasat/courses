import React, { useState, useEffect } from 'react';
import { Modal, Button } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { normalizeHexColor } from '../utils/color';
import { DEFAULT_ACCENT } from '../utils/color';

const DeleteConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  itemName,
  loading = false,
  warningMessage,
  relatedData = null
}) => {
  const { user } = useAuth();
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);

  useEffect(() => {
    if (!user?.uid) return;
    const loadAccentColor = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const color = normalizeHexColor(data.messageColor, DEFAULT_ACCENT);
          setAccentColor(color);
        }
      } catch (e) {
        console.warn('Error loading accent color:', e);
      }
    };
    loadAccentColor();
  }, [user]);

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title}
      size="medium"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div style={{ padding: '1rem' }}>
        {/* Warning Banner */}
        <div style={{
          background: '#fff3cd',
          border: `2px solid #ffc107`,
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <strong style={{ fontSize: '1.1rem' }}>Warning: This action cannot be undone</strong>
          </div>
          <p style={{ margin: 0, color: '#666' }}>
            {message}
          </p>
          {itemName && (
            <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600, color: '#333' }}>
              Item: <span style={{ color: accentColor }}>{itemName}</span>
            </p>
          )}
        </div>

        {/* Related Data Summary */}
        {relatedData && (
          <div style={{
            background: 'white',
            border: '2px solid #dee2e6',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: accentColor }}>📊 Related Data</h4>
            {Object.entries(relatedData).map(([key, value]) => {
              if (Array.isArray(value)) {
                // Format key to be more readable (e.g., "Activity/Quiz Submissions" instead of "submissions")
                const displayKey = key.split(/(?=[A-Z])/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                return (
                  <div key={key} style={{ marginBottom: '0.5rem' }}>
                    <strong>{displayKey}:</strong> {value.length} item(s)
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        {/* Warning Message */}
        {warningMessage && (
          <div style={{
            background: '#f8d7da',
            border: '2px solid #dc3545',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <p style={{ margin: 0, color: '#721c24' }}>{warningMessage}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              color: '#6c757d',
              border: '2px solid #6c757d',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#6c757d';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#6c757d';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: loading ? '#ccc' : 'transparent',
              color: loading ? '#666' : accentColor,
              border: `2px solid ${loading ? '#ccc' : accentColor}`,
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`;
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.boxShadow = `0 4px 12px ${accentColor}40`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = accentColor;
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;

