import { useState, useEffect, useRef } from 'react';
import { useToast } from './ToastProvider';
import ToggleSwitch from './ToggleSwitch';
import { formatDateTime } from '../utils/date';
import { Megaphone, FileText, CheckCircle2, GraduationCap, BookOpen, MessageSquareText, Key, PartyPopper, Mail, Plus, Pencil, Send, Copy, Trash2 } from 'lucide-react';

const EmailTemplateList = ({ onEdit, onCreateNew, highlightId }) => {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState({});
  const [testingEmail, setTestingEmail] = useState(null);
  const templateRefs = useRef({});

  useEffect(() => {
    loadTemplates();
    loadSettings();
  }, []);
  
  useEffect(() => {
    // Scroll to and highlight template if highlightId is provided
    if (highlightId && templateRefs.current[highlightId]) {
      setTimeout(() => {
        templateRefs.current[highlightId]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [highlightId, templates]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const q = query(collection(db, 'emailTemplates'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const templateList = [];
      snapshot.forEach(doc => {
        templateList.push({ id: doc.id, ...doc.data() });
      });
      
      setTemplates(templateList);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast?.showError('Failed to load templates: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      const ref = doc(db, 'config', 'emailSettings');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setSettings(snap.data());
      } else {
        setSettings({});
      }
    } catch (e) {
      console.error('Error loading email settings:', e);
    }
  };

  // Map template types to trigger types (singular → plural)
  const mapTypeToTrigger = (templateType) => {
    const mapping = {
      'announcement': 'announcements',
      'activity': 'activities',
      'activity_complete': 'activityComplete',
      'activity_graded': 'activityGraded',
      'enrollment': 'enrollments',
      'resource': 'resources',
      'chat_digest': 'chatDigest',
      'password_reset': 'passwordReset',
      'welcome_signup': 'welcomeSignup'
    };
    return mapping[templateType] || templateType;
  };

  const saveSetting = async (typeKey, enabled, templateId) => {
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      const ref = doc(db, 'config', 'emailSettings');
      
      // Map template type to trigger type
      const triggerKey = mapTypeToTrigger(typeKey);
      
      const next = {
        ...(settings || {}),
        [triggerKey]: {
          ...(settings?.[triggerKey] || {}),
          enabled: enabled,
          template: templateId
        }
      };
      setSettings(next);
      await setDoc(ref, next, { merge: true });
      toast?.showSuccess('Email notifications ' + (enabled ? 'enabled' : 'disabled'));
    } catch (e) {
      console.error('Error saving setting:', e);
      toast?.showError('Failed to save setting: ' + e.message);
    }
  };

  const generateSampleVariables = (template) => {
    // Smart platform URL detection
    const platformUrl = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? `http://${window.location.hostname}:${window.location.port || 5174}`
      : 'https://main-one-32026.web.app';
    
    const prettyNow = formatDateTime(new Date());
    const base = {
      recipientName: 'John Doe',
      siteName: 'CS Learning Hub',
      platformName: 'CS Learning Hub',
      platformUrl: platformUrl,
      siteUrl: platformUrl,
      currentDate: prettyNow ? prettyNow.split(' ')[0] : ''
    };
    switch (template.type) {
      case 'announcement':
        return { ...base, title: 'New Quiz', content: 'Please attempt the quiz', link: 'https://example.com/ann' };
      case 'activity':
        return { ...base, activityTitle: 'Arrays 101', className: 'Computing 1' };
      case 'activity_graded':
        return { ...base, activityTitle: 'Loops', grade: '9/10' };
      case 'activity_complete':
        return { ...base, activityTitle: 'Sorting', studentName: 'Jane Student' };
      case 'enrollment':
        return { ...base, className: 'Python A', startDate: base.currentDate };
      case 'resource':
        return { ...base, resourceTitle: 'Intro PDF', resourceLink: 'https://example.com/pdf' };
      case 'chat_digest':
        return { ...base, unreadCount: 5, chatLink: base.platformUrl + '/chat' };
      case 'password_reset':
        return { ...base, userEmail: 'user@example.com', resetLink: base.platformUrl + '/reset?token=demo' };
      case 'welcome_signup':
        return { ...base, userEmail: 'user@example.com', displayName: 'John D.' };
      default:
        return base;
    }
  };

  const deleteTemplate = async (templateId, templateName) => {
    if (!window.confirm(`Delete template "${templateName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      await deleteDoc(doc(db, 'emailTemplates', templateId));
      toast?.showSuccess('Template deleted successfully!');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast?.showError('Failed to delete template: ' + error.message);
    }
  };

  const duplicateTemplate = async (template) => {
    try {
      const { collection, addDoc, Timestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const newTemplate = {
        ...template,
        name: `${template.name} (Copy)`,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      delete newTemplate.id;
      
      const docRef = await addDoc(collection(db, 'emailTemplates'), newTemplate);
      toast?.showSuccess('Template duplicated successfully!');
      loadTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast?.showError('Failed to duplicate template: ' + error.message);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type) => {
    const common = { size: 20 };
    const icons = {
      announcement: <Megaphone {...common} title="Announcement" />,
      activity: <FileText {...common} title="Activity" />,
      activity_complete: <CheckCircle2 {...common} title="Completion" />,
      activity_graded: <FileText {...common} title="Grading" />,
      enrollment: <GraduationCap {...common} title="Enrollment" />,
      resource: <BookOpen {...common} title="Resource" />,
      chat_digest: <MessageSquareText {...common} title="Chat Digest" />,
      password_reset: <Key {...common} title="Password Reset" />,
      welcome_signup: <PartyPopper {...common} title="Welcome" />,
      custom: <Mail {...common} title="Email" />
    };
    return icons[type] || <Mail {...common} title="Email" />;
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px 15px',
            border: '1px solid #ddd',
            borderRadius: 8,
            width: 300,
            fontSize: '0.95rem'
          }}
        />
        <button
          onClick={onCreateNew}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #800020, #600018)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.95rem'
          }}
        >
          <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}><Plus size={16} /> Create New Template</span>
        </button>
      </div>

      {filteredTemplates.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          background: '#f8f9fa',
          borderRadius: 12,
          border: '2px dashed #ddd'
        }}>
          <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '1rem' }}>
            {searchTerm ? 'No templates found matching your search.' : 'No email templates yet.'}
          </p>
          {!searchTerm && (
            <button
              onClick={onCreateNew}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #800020, #600018)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Create Your First Template
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              ref={(el) => templateRefs.current[template.id] = el}
              style={{
                background: highlightId === template.id ? '#fff9e6' : 'white',
                border: highlightId === template.id ? '2px solid #ffc107' : '1px solid #e0e0e0',
                borderRadius: 12,
                padding: '1.5rem',
                boxShadow: highlightId === template.id ? '0 8px 24px rgba(255, 193, 7, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ fontSize: '2rem' }}>{getTypeIcon(template.type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>{template.name}</h3>
                      <p style={{ margin: '0.25rem 0 0 0', color: '#999', fontSize: '0.85rem' }}>
                        {template.type?.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems:'center' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginRight:12 }}>
                        <span style={{ color:'#666', fontSize:'0.85rem' }}>Enabled</span>
                        <ToggleSwitch
                          checked={!!settings?.[mapTypeToTrigger(template.type)]?.enabled}
                          onChange={(val) => saveSetting(template.type, val, template.id)}
                        />
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(template);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#16a34a',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Pencil size={14} /> Edit</span>
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setTestingEmail(template.id);
                          try {
                            const { httpsCallable } = await import('firebase/functions');
                            const { functions } = await import('../firebase/config');
                            const sendTest = httpsCallable(functions, 'sendTestEmailTemplate');
                            const vars = generateSampleVariables(template);
                            const res = await sendTest({ templateId: template.id, variables: vars });
                            if (res.data?.success) {
                              toast?.showSuccess('Test email sent to your email');
                            } else {
                              toast?.showError('Failed to send test email');
                            }
                          } catch (err) {
                            console.error(err);
                            toast?.showError('Failed to send test email: ' + err.message);
                          } finally {
                            setTestingEmail(null);
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#f97316',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        {testingEmail === template.id
                          ? 'Sending…'
                          : <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Send size={14} /> Test Email</span>}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateTemplate(template);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Copy size={14} /> Duplicate</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate(template.id, template.name);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Trash2 size={14} /> Delete</span>
                      </button>
                    </div>
                  </div>
                  <p style={{ margin: '0.75rem 0', color: '#555', fontSize: '0.9rem' }}>
                    <strong>Subject:</strong> {template.subject}
                  </p>
                  {template.variables && template.variables.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.85rem' }}>
                        <strong>Variables:</strong>
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {template.variables.slice(0, 8).map(variable => (
                          <span
                            key={variable}
                            style={{
                              padding: '4px 8px',
                              background: '#f0f0f0',
                              borderRadius: 4,
                              fontSize: '0.75rem',
                              color: '#555',
                              fontFamily: 'monospace'
                            }}
                          >
                            {`{{${variable}}}`}
                          </span>
                        ))}
                        {template.variables.length > 8 && (
                          <span style={{ fontSize: '0.75rem', color: '#999' }}>
                            +{template.variables.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <p style={{ margin: '0.75rem 0 0 0', color: '#999', fontSize: '0.8rem' }}>
                    Last updated: {template.updatedAt ? formatDateTime(template.updatedAt) : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailTemplateList;
