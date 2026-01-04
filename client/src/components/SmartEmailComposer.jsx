import { useState, useEffect } from 'react';
import { getUsers, getClasses, getEnrollments } from '../firebase/firestore';
import { useLang } from '../contexts/LangContext';
import Modal from './Modal';
import { useToast } from './ToastProvider';
import { Input, Textarea, Button } from './ui';

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
      size="fullscreen"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
        
        {/* Compact Header Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {/* Quick Class Selection */}
          <div style={{ background: '#f8f9fa', padding: '0.75rem', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#800020', marginBottom: '0.5rem' }}>📚 Quick Select by Class</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {classes.map(cls => {
                const enrollmentCount = enrollments.filter(e => e.classId === (cls.docId || cls.id)).length;
                return (
                  <button
                    key={cls.docId || cls.id}
                    onClick={() => handleSelectClass(cls.docId || cls.id)}
                    style={{
                      padding: '6px 10px',
                      background: 'white',
                      border: '1px solid #800020',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
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
          <div style={{ background: '#f8f9fa', padding: '0.75rem', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#800020', marginBottom: '0.5rem' }}>🔍 Filter Recipients</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                style={{ flex: 1 }}
              />
              <Button
                onClick={handleSelectAll}
                variant="primary"
                size="sm"
              >
                ✓ Select All ({filteredUsers.length})
              </Button>
            </div>
          </div>
        </div>

        {/* Selected Recipients - Compact */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#800020' }}>
            📬 Recipients ({emailData.to.length})
          </div>
          <div style={{ 
            minHeight: '50px',
            maxHeight: '100px',
            overflowY: 'auto',
            padding: '6px',
            border: '1px dashed #ddd',
            borderRadius: '4px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            background: '#fafafa'
          }}>
            {emailData.to.length === 0 ? (
              <span style={{ color: '#999', fontSize: '0.8rem' }}>No recipients selected</span>
            ) : (
              emailData.to.map(email => (
                <div
                  key={email}
                  style={{
                    background: '#fff0f3',
                    color: '#800020',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
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
                      padding: '0',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      lineHeight: 1
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Subject - Compact */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>📝 Subject</div>
          <Input
            type="text"
            value={emailData.subject}
            onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Enter email subject..."
            fullWidth
          />
        </div>

        {/* HTML Body - Full Height */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>✉️ Email Content (HTML)</div>
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              size="sm"
            >
              {showPreview ? '📝 Edit' : '👁️ Preview'}
            </Button>
          </div>
          
          {!showPreview ? (
            <Textarea
              value={emailData.htmlBody}
              onChange={(e) => setEmailData(prev => ({ ...prev, htmlBody: e.target.value }))}
              placeholder="Paste your HTML here... You can use variables: %DISPLAY_NAME%, %EMAIL%, %APP_NAME%"
              style={{ flex: 1, minHeight: 0, fontFamily: 'monospace', fontSize: '0.85rem' }}
              fullWidth
            />
          ) : (
            <div
              style={{
                flex: 1,
                minHeight: 0,
                padding: '16px',
                borderRadius: '4px',
                border: '1px solid #800020',
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
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
            💡 Variables: <code>%DISPLAY_NAME%</code>, <code>%EMAIL%</code>, <code>%APP_NAME%</code>
          </div>
        </div>

        {/* Actions - Fixed Footer */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '0.75rem', flexShrink: 0 }}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={loading || emailData.to.length === 0}
            size="sm"
          >
            {loading ? '📤 Sending...' : `📧 Send to ${emailData.to.length}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SmartEmailComposer;
