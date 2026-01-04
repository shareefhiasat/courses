import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useToast } from './ToastProvider';
import { useLang } from '../contexts/LangContext';
import InfoTooltip from './ui/InfoTooltip/InfoTooltip';

const UserDeletionModal = ({ 
  open, 
  onClose, 
  user, 
  onConfirmDelete,
  enrollments = [],
  submissions = [],
  activities = [],
  classes = []
}) => {
  const toast = useToast();
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [archiveUser, setArchiveUser] = useState(false);
  const [relatedData, setRelatedData] = useState({
    enrollments: [],
    submissions: [],
    messages: 0,
    activities: []
  });

  useEffect(() => {
    if (open && user) {
      calculateRelatedData();
    }
  }, [open, user]);

  const calculateRelatedData = async () => {
    if (!user) return;

    // Get user's enrollments
    const userEnrollments = enrollments.filter(e => e.userId === user.docId || e.userId === user.id);
    
    // Get user's submissions
    const userSubmissions = submissions.filter(s => s.userId === user.docId || s.userId === user.id);
    
    // Get activities user has completed
    const userActivities = activities.filter(a => 
      userSubmissions.some(s => s.activityId === a.docId || s.activityId === a.id)
    );

    // Estimate messages (we'd need to query Firestore for exact count)
    // For now, we'll show a placeholder
    const estimatedMessages = 0;

    setRelatedData({
      enrollments: userEnrollments,
      submissions: userSubmissions,
      messages: estimatedMessages,
      activities: userActivities
    });
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirmDelete(user, relatedData, archiveUser);
      onClose();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast?.showError('Failed to delete user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const hasRelatedData = 
    relatedData.enrollments.length > 0 ||
    relatedData.submissions.length > 0 ||
    relatedData.messages > 0;

  const getClassName = (classId) => {
    const cls = classes.find(c => (c.docId || c.id) === classId);
    return cls ? cls.name : 'Unknown Class';
  };

  const getActivityTitle = (activityId) => {
    const activity = activities.find(a => (a.docId || a.id) === activityId);
    return activity ? (activity.title_en || activity.title || 'Untitled') : 'Unknown Activity';
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`🗑️ Delete User: ${user.displayName || user.email}`}
      size="large"
    >
      <div style={{ padding: '1rem' }}>
        {/* Warning Banner */}
        <div style={{
          background: hasRelatedData ? '#fff3cd' : '#f8d7da',
          border: `2px solid ${hasRelatedData ? '#ffc107' : '#dc3545'}`,
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{hasRelatedData ? '⚠️' : '🚨'}</span>
            <strong style={{ fontSize: '1.1rem' }}>
              {hasRelatedData ? 'Warning: User Has Related Data' : 'Confirm Permanent Deletion'}
            </strong>
          </div>
          <p style={{ margin: 0, color: '#666' }}>
            {hasRelatedData 
              ? 'This user has related records that will also be deleted. Review the summary below.'
              : 'This action cannot be undone. All user data will be permanently deleted.'}
          </p>
        </div>

        {/* User Info */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ margin: '0 0 0.75rem 0', color: '#800020' }}>👤 User Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem' }}>
            <strong>Email:</strong>
            <span>{user.email}</span>
            
            <strong>Display Name:</strong>
            <span>{user.displayName || '—'}</span>
            
            <strong>Real Name:</strong>
            <span>{user.realName || '—'}</span>
            
            <strong>Role:</strong>
            <span style={{
              background: user.role === 'admin' ? '#800020' : '#28a745',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontWeight: 600
            }}>
              {user.role || 'student'}
            </span>
            
            <strong>Student Number:</strong>
            <span>{user.studentNumber || '—'}</span>
          </div>
        </div>

        {/* Related Data Summary */}
        <div style={{
          background: 'white',
          border: '2px solid #dee2e6',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#800020' }}>📊 Related Data Summary</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {/* Enrollments */}
            <div style={{
              background: relatedData.enrollments.length > 0 ? '#fff3cd' : '#d4edda',
              padding: '0.75rem',
              borderRadius: '6px',
              border: `2px solid ${relatedData.enrollments.length > 0 ? '#ffc107' : '#28a745'}`
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#800020' }}>
                {relatedData.enrollments.length}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>🎓 Enrollments</div>
            </div>

            {/* Submissions */}
            <div style={{
              background: relatedData.submissions.length > 0 ? '#fff3cd' : '#d4edda',
              padding: '0.75rem',
              borderRadius: '6px',
              border: `2px solid ${relatedData.submissions.length > 0 ? '#ffc107' : '#28a745'}`
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#800020' }}>
                {relatedData.submissions.length}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: '#666' }}>
                <span>📝 {t('submissions')}</span>
                <InfoTooltip contentKey="submissions.tooltip" />
              </div>
            </div>

            {/* Activities */}
            <div style={{
              background: relatedData.activities.length > 0 ? '#fff3cd' : '#d4edda',
              padding: '0.75rem',
              borderRadius: '6px',
              border: `2px solid ${relatedData.activities.length > 0 ? '#ffc107' : '#28a745'}`
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#800020' }}>
                {relatedData.activities.length}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>📚 Activities Completed</div>
            </div>

            {/* Messages */}
            <div style={{
              background: '#d4edda',
              padding: '0.75rem',
              borderRadius: '6px',
              border: '2px solid #28a745'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#800020' }}>
                {relatedData.messages}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>💬 Chat Messages</div>
            </div>
          </div>

          {/* Detailed Lists */}
          {relatedData.enrollments.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>📋 Enrolled Classes:</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#666' }}>
                {relatedData.enrollments.map((enrollment, idx) => (
                  <li key={idx}>{getClassName(enrollment.classId)}</li>
                ))}
              </ul>
            </div>
          )}

          {relatedData.submissions.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>📝 Submitted Activities:</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#666', maxHeight: '150px', overflowY: 'auto' }}>
                {relatedData.submissions.map((submission, idx) => (
                  <li key={idx}>
                    {getActivityTitle(submission.activityId)} 
                    {submission.status && ` (${submission.status})`}
                    {submission.score != null && ` - Score: ${submission.score}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Archive Option */}
        <div style={{
          background: '#e7f3ff',
          border: '2px solid #0066cc',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={archiveUser}
              onChange={(e) => setArchiveUser(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 600, color: '#004085' }}>
              📦 Archive user instead of deleting (user will be disabled and hidden, but data preserved)
            </span>
          </label>
        </div>

        {/* Confirmation Checkbox */}
        <div style={{
          background: '#f8d7da',
          border: '2px solid #dc3545',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              id="confirmDelete"
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 600, color: '#721c24' }}>
              I understand this will {archiveUser ? 'archive' : 'permanently delete'} the user{!archiveUser && hasRelatedData ? ' and all related data' : ''}
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: loading ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const checkbox = document.getElementById('confirmDelete');
              if (!checkbox?.checked) {
                toast?.showError('Please confirm by checking the box');
                return;
              }
              handleDelete();
            }}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #dc3545, #bd2130)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            {loading ? (archiveUser ? 'Archiving...' : 'Deleting...') : (archiveUser ? '📦 Archive User' : '🗑️ Delete User & All Data')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UserDeletionModal;
