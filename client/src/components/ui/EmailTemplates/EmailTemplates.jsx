import { useState, useEffect } from 'react';
import EmailTemplateList from './EmailTemplateList';
import {SeedDefaultTemplates, Spinner } from "@ui";
import { useLang } from '@contexts/LangContext';


import { info, error, warn, debug } from '@services/utils/logger.js';

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
      // Mock implementation - replace with GraphQL query
      info('📧 Checking email templates (mock)');
      setHasTemplates(true); // Assume templates exist for now
    } catch (error) {
      error('Error checking templates:', error);
      setHasTemplates(false);
    } finally {
      setChecking(false);
    }
  };

  const handleCreateNew = () => {
    // Editor removed - show message
    info('📝 Email template editor not available');
  };

  const handleEdit = (template) => {
    // Editor removed - show message
    console.log('📝 Email template editor not available');
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
            <Spinner size="md" />
          </div>
        )}
        
        {!checking && hasTemplates !== null && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>
                  {t('emailtemplates_description')}
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
        )}
      </div>
  );
};

export default EmailTemplates;

