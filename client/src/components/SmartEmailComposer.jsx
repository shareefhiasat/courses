import { useState, useEffect } from 'react';
import { getUsers, getClasses, getEnrollments } from '../firebase/firestore';
import { useLang } from '../contexts/LangContext';
import Modal from './Modal';
import { useToast } from './ToastProvider';

const SmartEmailComposer = ({ open, onClose, onSend }) => {
  const { t, lang } = useLang();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [emailData, setEmailData] = useState({
    to: [],
    subject: '',
    htmlBody: '',
    type: 'newsletter'
  });
  
  const [filters, setFilters] = useState({
    selectedClasses: [],
    selectedRoles: [],
    searchTerm: ''
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, classesRes, enrollmentsRes] = await Promise.all([
        getUsers(),
        getClasses(),
        getEnrollments()
      ]);
      
      if (usersRes.success) setUsers(usersRes.data || []);
      if (classesRes.success) setClasses(classesRes.data || []);
      if (enrollmentsRes.success) setEnrollments(enrollmentsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast?.showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    let filtered = users;

    // Filter by search term
    if (filters.searchTerm) {
      filtered = filtered.filter(u => 
        u.email?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Filter by selected classes
    if (filters.selectedClasses.length > 0) {
      const userIdsInClasses = enrollments
        .filter(e => filters.selectedClasses.includes(e.classId))
        .map(e => e.userId);
      filtered = filtered.filter(u => userIdsInClasses.includes(u.docId || u.id));
    }

    // Filter by roles
    if (filters.selectedRoles.length > 0) {
      if (filters.selectedRoles.includes('student')) {
        // Include users who are students or have no role
        filtered = filtered.filter(u => !u.role || u.role === 'student');
      }
      if (filters.selectedRoles.includes('admin')) {
        filtered = filtered.filter(u => u.role === 'admin');
      }
    }

    return filtered;
  };

  const handleSelectAll = () => {
    const filtered = getFilteredUsers();
    const emails = filtered.map(u => u.email).filter(Boolean);
    setEmailData(prev => ({
      ...prev,
      to: [...new Set([...prev.to, ...emails])]
    }));
    toast?.showSuccess(`Added ${emails.length} recipients`);
  };

  const handleSelectClass = (classId) => {
    const classEnrollments = enrollments.filter(e => e.classId === classId);
    const userIds = classEnrollments.map(e => e.userId);
    const emails = users
      .filter(u => userIds.includes(u.docId || u.id))
      .map(u => u.email)
      .filter(Boolean);
    
    setEmailData(prev => ({
      ...prev,
      to: [...new Set([...prev.to, ...emails])]
    }));
    toast?.showSuccess(`Added ${emails.length} recipients from class`);
  };

  const handleRemoveRecipient = (email) => {
    setEmailData(prev => ({
      ...prev,
      to: prev.to.filter(e => e !== email)
    }));
  };

  const handleSend = async () => {
    if (emailData.to.length === 0) {
      toast?.showError('Please add at least one recipient');
      return;
    }
    if (!emailData.subject.trim()) {
      toast?.showError('Please enter a subject');
      return;
    }
    if (!emailData.htmlBody.trim()) {
      toast?.showError('Please enter email content');
      return;
    }

    setLoading(true);
    try {
      await onSend(emailData);
      toast?.showSuccess(`Email sent to ${emailData.to.length} recipients!`);
      setEmailData({ to: [], subject: '', htmlBody: '', type: 'newsletter' });
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast?.showError('Failed to send email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = getFilteredUsers();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="📧 Smart Email Composer"
      size="large"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Quick Class Selection */}
        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', color: '#800020' }}>📚 Quick Select by Class</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {classes.map(cls => {
              const enrollmentCount = enrollments.filter(e => e.classId === (cls.docId || cls.id)).length;
              return (
                <button
                  key={cls.docId || cls.id}
                  onClick={() => handleSelectClass(cls.docId || cls.id)}
                  style={{
                    padding: '8px 12px',
                    background: 'white',
                    border: '2px solid #800020',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#800020'
                  }}
                >
                  {cls.name} ({enrollmentCount})
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', color: '#800020' }}>🔍 Filter Recipients</h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              style={{
                flex: '1 1 250px',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            />
            <button
              onClick={handleSelectAll}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #800020, #600018)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              ✓ Select All Filtered ({filteredUsers.length})
            </button>
          </div>
        </div>

        {/* Selected Recipients */}
        <div>
          <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block', color: '#800020' }}>
            📬 Recipients ({emailData.to.length})
          </label>
          <div style={{ 
            minHeight: '60px',
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '8px',
            border: '2px dashed #ddd',
            borderRadius: '6px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            {emailData.to.length === 0 ? (
              <span style={{ color: '#999', fontSize: '0.9rem' }}>No recipients selected</span>
            ) : (
              emailData.to.map(email => (
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
                    gap: '4px',
                    border: '1px solid #800020'
                  }}
                >
                  {email}
                  <button
                    onClick={() => handleRemoveRecipient(email)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#800020',
                      cursor: 'pointer',
                      padding: '0 4px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
            📝 Subject
          </label>
          <input
            type="text"
            value={emailData.subject}
            onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Enter email subject..."
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '1rem'
            }}
          />
        </div>

        {/* HTML Body */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 600 }}>
              ✉️ Email Content (HTML)
            </label>
            <button
              onClick={() => setShowPreview(!showPreview)}
              style={{
                padding: '6px 12px',
                background: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              {showPreview ? '📝 Edit' : '👁️ Preview'}
            </button>
          </div>
          
          {!showPreview ? (
            <textarea
              value={emailData.htmlBody}
              onChange={(e) => setEmailData(prev => ({ ...prev, htmlBody: e.target.value }))}
              placeholder="Paste your HTML here... You can use variables: %DISPLAY_NAME%, %EMAIL%, %APP_NAME%"
              rows="12"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                resize: 'vertical'
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '20px',
                borderRadius: '6px',
                border: '2px solid #800020',
                background: 'white',
                overflow: 'auto'
              }}
              dangerouslySetInnerHTML={{ 
                __html: emailData.htmlBody
                  .replace(/%DISPLAY_NAME%/g, 'John Doe')
                  .replace(/%EMAIL%/g, 'user@example.com')
                  .replace(/%APP_NAME%/g, 'QAF Learning Hub')
              }}
            />
          )}
          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
            💡 Available variables: <code>%DISPLAY_NAME%</code>, <code>%EMAIL%</code>, <code>%APP_NAME%</code>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 24px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || emailData.to.length === 0}
            style={{
              padding: '10px 24px',
              background: loading || emailData.to.length === 0 ? '#ccc' : 'linear-gradient(135deg, #800020, #600018)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading || emailData.to.length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            {loading ? '📤 Sending...' : `📧 Send to ${emailData.to.length} Recipients`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SmartEmailComposer;
