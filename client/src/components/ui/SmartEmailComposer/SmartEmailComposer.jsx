import React from 'react';
import { Modal, Button, Input, Textarea, Select, Card, CardBody } from '@ui';

const SmartEmailComposer = ({ open, onClose, onSend }) => {
  const [to, setTo] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [htmlBody, setHtmlBody] = React.useState('');
  const [type, setType] = React.useState('general');
  const [loading, setLoading] = React.useState(false);

  const handleSend = async () => {
    if (!to || !subject || !htmlBody) return;
    
    setLoading(true);
    try {
      await onSend({ to, subject, htmlBody, type });
      setTo('');
      setSubject('');
      setHtmlBody('');
      setType('general');
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Compose Email">
      <div style={{ padding: '1rem', minWidth: '500px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>To:</label>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Type:</label>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[
              { value: 'general', label: 'General' },
              { value: 'announcement', label: 'Announcement' },
              { value: 'notification', label: 'Notification' }
            ]}
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Subject:</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
          />
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Message:</label>
          <Textarea
            value={htmlBody}
            onChange={(e) => setHtmlBody(e.target.value)}
            placeholder="Email message content..."
            rows={6}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSend} loading={loading}>
            Send Email
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SmartEmailComposer;
