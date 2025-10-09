import { useState } from 'react';
import { useToast } from './ToastProvider';
import { defaultTemplates } from '../utils/defaultEmailTemplates';

const SeedDefaultTemplates = ({ onComplete }) => {
  const toast = useToast();
  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const seedTemplates = async () => {
    setSeeding(true);
    setProgress({ current: 0, total: defaultTemplates.length });

    try {
      const { collection, doc, setDoc, Timestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');

      for (let i = 0; i < defaultTemplates.length; i++) {
        const template = defaultTemplates[i];
        setProgress({ current: i + 1, total: defaultTemplates.length });

        const templateData = {
          ...template,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        // Remove the id field before saving (it's used as document ID)
        const { id, ...dataToSave } = templateData;

        await setDoc(doc(db, 'emailTemplates', template.id), dataToSave);
      }

      toast?.showSuccess(`Successfully created ${defaultTemplates.length} default templates!`);
      onComplete?.();
    } catch (error) {
      console.error('Error seeding templates:', error);
      toast?.showError('Failed to create templates: ' + error.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div style={{
      background: '#f0f8ff',
      border: '2px dashed #667eea',
      borderRadius: 12,
      padding: '2rem',
      textAlign: 'center',
      margin: '2rem 0'
    }}>
      <h3 style={{ color: '#667eea', margin: '0 0 1rem 0' }}>📧 Default Email Templates</h3>
      <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Create 7 professional bilingual email templates to get started quickly:
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8 }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📢</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Announcement</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8 }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>New Activity</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8 }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Activity Graded</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8 }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Activity Complete</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8 }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎓</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Enrollment</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8 }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>New Resource</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8 }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Chat Digest</div>
        </div>
      </div>

      {seeding && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ background: '#e0e0e0', borderRadius: 8, height: 8, overflow: 'hidden' }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              height: '100%',
              width: `${(progress.current / progress.total) * 100}%`,
              transition: 'width 0.3s'
            }} />
          </div>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
            Creating template {progress.current} of {progress.total}...
          </p>
        </div>
      )}

      <button
        onClick={seedTemplates}
        disabled={seeding}
        style={{
          padding: '12px 30px',
          background: seeding ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: seeding ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          fontSize: '1rem'
        }}
      >
        {seeding ? 'Creating Templates...' : '✨ Create Default Templates'}
      </button>

      <p style={{ margin: '1rem 0 0 0', color: '#999', fontSize: '0.85rem' }}>
        All templates are bilingual (EN + AR) and use Qatar timezone (UTC+3)
      </p>
    </div>
  );
};

export default SeedDefaultTemplates;
