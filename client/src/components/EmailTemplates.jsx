import { useState, useEffect } from 'react';
import EmailTemplateList from './EmailTemplateList';
import EmailTemplateEditor from './EmailTemplateEditor';
import SeedDefaultTemplates from './SeedDefaultTemplates';

const EmailTemplates = () => {
  const [view, setView] = useState('list'); // 'list' or 'editor'
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasTemplates, setHasTemplates] = useState(null); // null = loading, true/false = loaded
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkTemplates();
  }, [refreshKey]);

  const checkTemplates = async () => {
    setChecking(true);
    try {
      const { collection, getDocs, query, limit } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const q = query(collection(db, 'emailTemplates'), limit(1));
      const snapshot = await getDocs(q);
      setHasTemplates(!snapshot.empty);
    } catch (error) {
      console.error('Error checking templates:', error);
      setHasTemplates(false);
    } finally {
      setChecking(false);
    }
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setView('editor');
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setView('editor');
  };

  const handleSave = () => {
    setView('list');
    setEditingTemplate(null);
  };

  const handleCancel = () => {
    setView('list');
    setEditingTemplate(null);
  };

  return (
    <div>
      {view === 'list' ? (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ color: '#666', fontSize: '0.95rem' }}>
              Create and manage email templates with bilingual support (EN + AR). 
              All templates use Qatar timezone (UTC+3) and support dynamic variables.
            </p>
          </div>
          
          {checking ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading templates...</div>
          ) : (
            <>
              {hasTemplates === false && (
                <SeedDefaultTemplates 
                  onComplete={() => setRefreshKey(prev => prev + 1)}
                />
              )}
              
              <EmailTemplateList 
                key={refreshKey}
                onEdit={handleEdit}
                onCreateNew={handleCreateNew}
              />
            </>
          )}
        </div>
      ) : (
        <EmailTemplateEditor
          template={editingTemplate}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default EmailTemplates;
