import React, { useState, useEffect } from 'react';
import { Select, Textarea, Button, Input, Card, CardBody, Checkbox } from '../../ui';
import { useToast } from '../../ui/Toast';
import { useLang } from '../../../contexts/LangContext';
import { BEHAVIOR_TYPES, getBehaviorLabel } from '../../../constants/behaviorTypes';
import { PARTICIPATION_TYPES, getParticipationLabel } from '../../../constants/participationTypes';
import { PENALTY_TYPES, getPenaltyLabel } from '../../../constants/penaltyTypes';
import { getUserStatus, getUserStatusSummary, USER_STATUS, getStatusIconProps } from '../../../utils/userStatus';
import { MessageSquare, Bed, Users, Smartphone, AlertTriangle, Clock, XCircle, HelpCircle, UserCheck, UserX, UserMinus, AlertCircle, Info } from 'lucide-react';

const GenericForm = ({
  fields = [],
  initialData = {},
  onSubmit,
  onCancel,
  validation = {},
  submitText = 'Save',
  cancelText = 'Cancel',
  loading = false,
  disabled = false,
  compact = false,
  t = (key) => key,
  lang = 'en'
}) => {
  const toast = useToast();
  const { t: langT } = useLang();
  const [formData, setFormData] = useState({ ...initialData });
  const [errors, setErrors] = useState({});

  // Update form data when initialData changes
  useEffect(() => {
    setFormData({ ...initialData });
  }, [initialData]);

  // Validate field
  const validateField = (field, value) => {
    const { key, required = false, minLength, maxLength, pattern } = field;
    
    if (required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label || key} is required`;
    }
    
    if (minLength && value && value.length < minLength) {
      return `${field.label || key} must be at least ${minLength} characters`;
    }
    
    if (maxLength && value && value.length > maxLength) {
      return `${field.label || key} must not exceed ${maxLength} characters`;
    }
    
    if (pattern && value && !pattern.test(value)) {
      return `${field.label || key} format is invalid`;
    }
    
    return null;
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    
    fields.forEach(field => {
      const error = validateField(field, formData[field.key]);
      if (error) {
        newErrors[field.key] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field change
  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    
    // Clear error for this field
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    try {
      await onSubmit(formData);
      toast.success('Form submitted successfully');
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error.message || 'Error submitting form');
    }
  };

  // Render field based on type
  const renderField = (field) => {
    const { key, label, type = 'text', required = false, disabled: fieldDisabled = false, options = [], placeholder, rows = 3, ...props } = field;
    const value = formData[key] || '';
    const error = errors[key];

    switch (type) {
      case 'select':
        return (
          <Select
            searchable
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            options={options}
            placeholder={placeholder || `Select ${label}`}
            required={required}
            disabled={disabled || fieldDisabled}
            error={error}
            {...props}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={placeholder || `Enter ${label}`}
            rows={rows}
            required={required}
            disabled={disabled || fieldDisabled}
            error={error}
            {...props}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={placeholder || `Enter ${label}`}
            required={required}
            disabled={disabled || fieldDisabled}
            error={error}
            {...props}
          />
        );

      case 'checkbox':
        return (
          <Checkbox
            checked={value}
            onChange={(e) => handleFieldChange(key, e.target.checked)}
            label={label}
            disabled={disabled || fieldDisabled}
            error={error}
            {...props}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            required={required}
            disabled={disabled || fieldDisabled}
            error={error}
            {...props}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={placeholder || `Enter ${label}`}
            required={required}
            disabled={disabled || fieldDisabled}
            error={error}
            {...props}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={placeholder || `Enter ${label}`}
            required={required}
            disabled={disabled || fieldDisabled}
            error={error}
            {...props}
          />
        );
    }
  };

  const gridColumns = compact ? 'repeat(auto-fit, minmax(200px, 1fr))' : 'repeat(auto-fit, minmax(250px, 1fr))';

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <CardBody>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>{t('form_title') || 'Form'}</h3>
          {onCancel && (
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: '1rem' }}>
            {fields.map((field) => (
              <div key={field.key} style={field.span ? { gridColumn: `span ${field.span}` } : {}}>
                {field.type !== 'checkbox' && field.label && (
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.25rem', 
                    fontWeight: '500',
                    color: 'var(--text)'
                  }}>
                    {field.label}
                    {field.required && <span style={{ color: 'var(--color-primary, #ef4444)' }}> *</span>}
                  </label>
                )}
                {renderField(field)}
                {errors[field.key] && (
                  <div style={{ 
                    color: 'var(--color-primary, #ef4444)', 
                    fontSize: '0.875rem', 
                    marginTop: '0.25rem' 
                  }}>
                    {errors[field.key]}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button 
              type="submit" 
              variant="primary" 
              loading={loading}
              disabled={disabled}
            >
              {submitText}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={loading}
              >
                {cancelText}
              </Button>
            )}
          </div>
        </form>
      </CardBody>
    </Card>
  );
};

// Predefined field configurations for common use cases
GenericForm.configurations = {
  // Activity form (behavior, participation, penalty)
  activity: (classes, students, type, t, lang) => [
    {
      key: 'classId',
      label: t('class') || 'Class',
      type: 'select',
      required: true,
      options: [
        { value: '', label: t('select_class') || 'Select Class' },
        ...classes.map(c => ({
          value: c.id || c.docId,
          label: `${c.name || c.code || c.id}${c.term ? ` (${c.term}${c.year ? ` ${c.year}` : ''}${c.semester ? ` ${c.semester}` : ''})` : ''}`
        }))
      ]
    },
    {
      key: 'studentId',
      label: t('student') || 'Student',
      type: 'select',
      required: true,
      options: [
        { value: '', label: t('select_student') || 'Select Student' },
        ...students.map(u => {
          const status = getUserStatus(u);
          const statusSummary = getUserStatusSummary(u);
          const iconProps = getStatusIconProps(status);
          
          return {
            value: u.docId || u.id,
            displayLabel: u.displayName || u.realName || u.email || 'Unknown',
            label: (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                opacity: status === USER_STATUS.DELETED ? 0.7 : 1
              }}>
                {getStatusIconProps(status).icon}
                <span style={{ 
                  textDecoration: status === USER_STATUS.DELETED ? 'line-through' : 'none',
                  flex: 1
                }}>
                  {u.displayName || u.realName || u.email || 'Unknown'}
                </span>
                <span style={{ 
                  fontSize: '0.8em',
                  color: '#9CA3AF',
                  marginLeft: 'auto'
                }}>
                  {statusSummary?.label || status}
                </span>
              </div>
            ),
            disabled: status === USER_STATUS.DELETED
          };
        })
      ]
    },
    {
      key: 'type',
      label: t('type') || 'Type',
      type: 'select',
      required: true,
      options: (() => {
        let types = [];
        let getLabel;
        
        switch (type) {
          case 'behavior':
            types = BEHAVIOR_TYPES;
            getLabel = getBehaviorLabel;
            break;
          case 'participation':
            types = PARTICIPATION_TYPES;
            getLabel = getParticipationLabel;
            break;
          case 'penalty':
            types = PENALTY_TYPES;
            getLabel = getPenaltyLabel;
            break;
          default:
            types = [];
            getLabel = () => '';
        }
        
        return [
          { value: '', label: `Select ${type} Type` },
          ...types.map(typeItem => ({
            value: typeItem.id,
            label: getLabel(typeItem.id, lang),
            icon: (() => {
              const iconMap = {
                'MessageSquare': <MessageSquare size={16} color="#374151" />,
                'Bed': <Bed size={16} color="#374151" />,
                'Users': <Users size={16} color="#374151" />,
                'Smartphone': <Smartphone size={16} color="#374151" />,
                'AlertTriangle': <AlertTriangle size={16} color="#374151" />,
                'Clock': <Clock size={16} color="#374151" />,
                'XCircle': <XCircle size={16} color="#374151" />,
                'HelpCircle': <HelpCircle size={16} color="#374151" />
              };
              return iconMap[typeItem.icon] || <AlertTriangle size={16} color="#374151" />;
            })()
          }))
        ];
      })()
    },
    {
      key: 'description',
      label: t('description') || 'Description',
      type: 'textarea',
      required: true,
      rows: 3,
      placeholder: t('description_required_activity') || 'Please provide a description'
    },
    {
      key: 'comment',
      label: t('comment') || 'Comment',
      type: 'textarea',
      rows: 2,
      placeholder: t('comment_optional') || 'Additional comments (optional)'
    }
  ],

  // Basic form configuration
  basic: (t) => [
    {
      key: 'title',
      label: t('title') || 'Title',
      type: 'text',
      required: true,
      placeholder: t('enter_title') || 'Enter title'
    },
    {
      key: 'description',
      label: t('description') || 'Description',
      type: 'textarea',
      required: true,
      rows: 3,
      placeholder: t('enter_description') || 'Enter description'
    }
  ]
};

export default GenericForm;
