import React, { useState, useEffect } from 'react';
import { getUsers } from '../firebase/firestore';
import { useLang } from '../contexts/LangContext';
import { Select } from './ui';
import Modal from './Modal';
import { useToast } from './ToastProvider';
import './EmailComposer.css';

const EmailComposer = ({ open, onClose, onSend }) => {
  const { t, lang } = useLang();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailData, setEmailData] = useState({
    to: [],
    cc: [],
    bcc: [],
    subject: '',
    body: '',
    type: 'custom' // 'custom', 'welcome', 'newsletter'
  });
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [selectorMode, setSelectorMode] = useState('to'); // 'to', 'cc', 'bcc'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getUsers();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast?.showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipient = (email, mode) => {
    setEmailData(prev => ({
      ...prev,
      [mode]: [...prev[mode], email]
    }));
  };

  const handleRemoveRecipient = (email, mode) => {
    setEmailData(prev => ({
      ...prev,
      [mode]: prev[mode].filter(e => e !== email)
    }));
  };

  const handleSelectAll = (mode) => {
    const allEmails = users.map(u => u.email);
    setEmailData(prev => ({
      ...prev,
      [mode]: [...new Set([...prev[mode], ...allEmails])]
    }));
    setShowUserSelector(false);
  };

  const handleSend = async () => {
    // Validation
    if (emailData.to.length === 0 && emailData.cc.length === 0 && emailData.bcc.length === 0) {
      toast?.showError('Please add at least one recipient');
      return;
    }
    if (!emailData.subject.trim()) {
      toast?.showError('Please enter a subject');
      return;
    }
    if (!emailData.body.trim()) {
      toast?.showError('Please enter email body');
      return;
    }

    setLoading(true);
    try {
      await onSend(emailData);
      toast?.showSuccess('Email sent successfully!');
      // Reset form
      setEmailData({
        to: [],
        cc: [],
        bcc: [],
        subject: '',
        body: '',
        type: 'custom'
      });
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast?.showError('Failed to send email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderRecipientChips = (emails, mode) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
      {emails.map(email => (
        <div
          key={email}
          style={{
            background: '#fff0f3',
            color: '#800020',
            padding: '4px 8px',
            borderRadius: '16px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {email}
          <button
            onClick={() => handleRemoveRecipient(email, mode)}
            style={{
              background: 'none',
              border: 'none',
              color: '#800020',
              cursor: 'pointer',
              padding: '0 4px',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lang === 'en' ? '📧 Compose Email' : '📧 إنشاء بريد إلكتروني'}
      size="large"
    >
      <div className="email-composer">
        {/* Email Type Selector */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
            {lang === 'en' ? 'Email Type' : 'نوع البريد'}
          </label>
          <Select
            value={emailData.type}
            onChange={(e) => {
              const type = e.target.value;
              setEmailData(prev => ({
                ...prev,
                type,
                subject: type === 'welcome' ? 'Welcome to CS Learning Hub!' : 
                         type === 'newsletter' ? 'Newsletter - CS Learning Hub' : prev.subject,
                body: type === 'welcome' ? 'Welcome! Your account has been created. Please sign in with your email and set your password.' :
                      type === 'newsletter' ? '' : prev.body
              }));
            }}
            options={[
              { value: 'custom', label: lang === 'en' ? 'Custom Email' : 'بريد مخصص' },
              { value: 'welcome', label: lang === 'en' ? 'Welcome Email' : 'بريد ترحيبي' },
              { value: 'newsletter', label: lang === 'en' ? 'Newsletter' : 'نشرة إخبارية' }
            ]}
            fullWidth
          />
        </div>

        {/* Recipients */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
            {lang === 'en' ? 'To' : 'إلى'}
          </label>
          <button
            onClick={() => { setSelectorMode('to'); setShowUserSelector(true); }}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #800020, #600018)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            + {lang === 'en' ? 'Add Recipients' : 'إضافة مستلمين'}
          </button>
          {renderRecipientChips(emailData.to, 'to')}
        </div>

        {/* CC */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
            CC
          </label>
          <button
            onClick={() => { setSelectorMode('cc'); setShowUserSelector(true); }}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #800020, #600018)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            + {lang === 'en' ? 'Add CC' : 'إضافة نسخة'}
          </button>
          {renderRecipientChips(emailData.cc, 'cc')}
        </div>

        {/* BCC */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
            BCC
          </label>
          <button
            onClick={() => { setSelectorMode('bcc'); setShowUserSelector(true); }}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #800020, #600018)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            + {lang === 'en' ? 'Add BCC' : 'إضافة نسخة مخفية'}
          </button>
          {renderRecipientChips(emailData.bcc, 'bcc')}
        </div>

        {/* Subject */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
            {lang === 'en' ? 'Subject' : 'الموضوع'}
          </label>
          <input
            type="text"
            value={emailData.subject}
            onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
            placeholder={lang === 'en' ? 'Enter subject' : 'أدخل الموضوع'}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #ddd'
            }}
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
            {lang === 'en' ? 'Message' : 'الرسالة'}
          </label>
          <textarea
            value={emailData.body}
            onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
            placeholder={lang === 'en' ? 'Enter your message' : 'أدخل رسالتك'}
            rows="8"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {lang === 'en' ? 'Cancel' : 'إلغاء'}
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #800020, #600018)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? (lang === 'en' ? 'Sending...' : 'جاري الإرسال...') : (lang === 'en' ? 'Send Email' : 'إرسال')}
          </button>
        </div>
      </div>

      {/* User Selector Modal */}
      {showUserSelector && (
        <Modal
          open={showUserSelector}
          onClose={() => setShowUserSelector(false)}
          title={lang === 'en' ? 'Select Recipients' : 'اختر المستلمين'}
        >
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'en' ? 'Search users...' : 'بحث عن مستخدمين...'}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '1rem',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            />
            <button
              onClick={() => handleSelectAll(selectorMode)}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #800020, #600018)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              {lang === 'en' ? 'Select All' : 'تحديد الكل'}
            </button>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600' }}>{user.email}</div>
                    {user.displayName && (
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>{user.displayName}</div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      handleAddRecipient(user.email, selectorMode);
                      setShowUserSelector(false);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: 'linear-gradient(135deg, #800020, #600018)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'en' ? 'Add' : 'إضافة'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};

export default EmailComposer;
