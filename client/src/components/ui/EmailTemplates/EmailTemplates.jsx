import { useState, useEffect } from 'react';
import EmailTemplateList from './EmailTemplateList';
import EmailTemplateEditor from './EmailTemplateEditor';
import {SeedDefaultTemplates} from "@ui";
import { Loading } from '@ui';
import { useLang } from '@contexts/LangContext';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@services/other/config';

const EmailTemplates = () => {
  const { t } = useLang();
  const [view, setView] = useState('list'); // 'list' or 'editor'
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasTemplates, setHasTemplates] = useState(null); // null = loading, true/false = loaded
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkTemplates();
  }, [refreshKey]);

  const checkTemplates = async () => {
    setChecking(true);
    try {
      const q = query(collection(db, 'emailTemplates'), limit(1));
      const snapshot = await getDocs(q);
      setHasTemplates(!snapshot.empty);
    } catch (error) {
      logger.error('Error checking templates:', error);
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
        {(checking || hasTemplates === null) && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '200px',
            padding: '2rem'
          }}>
            <Loading variant="overlay" message="Loading templates..." fancyVariant="dots" />
          </div>
        )}
        
        {!checking && hasTemplates !== null && view === 'list' ? (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>
                  Create and manage email templates with bilingual support (EN + AR).
                  All templates use Qatar timezone (UTC+3) and support dynamic variables.
                </p>
              </div>

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
            </div>
        ) : (
            !checking && hasTemplates !== null && <EmailTemplateEditor
                template={editingTemplate}
                onSave={handleSave}
                onCancel={handleCancel}
            />
        )}
      </div>
  );
};

export default EmailTemplates;

