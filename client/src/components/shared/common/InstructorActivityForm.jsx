import React, { useState, useEffect } from 'react';
import { Select, Textarea, Button, Input, Card, CardBody } from '../../ui';
import { MessageSquare, Bed, Users, Smartphone, AlertTriangle, Clock, XCircle, HelpCircle, UserCheck, UserX, UserMinus, AlertCircle, Info } from 'lucide-react';
import { useToast } from '../../ui/Toast';
import { useLang } from '../../../contexts/LangContext';
import { BEHAVIOR_TYPES, getBehaviorLabel } from '../../../constants/behaviorTypes';
import { PARTICIPATION_TYPES, getParticipationLabel } from '../../../constants/participationTypes';
import { PENALTY_TYPES, getPenaltyLabel } from '../../../constants/penaltyTypes';
import { getUserStatus, getUserStatusSummary, USER_STATUS, getStatusIconProps } from '../../../utils/userStatus';

const InstructorActivityForm = ({
  activityType = 'behavior', // 'behavior', 'participation', 'penalty'
  initialData = {},
  classes = [],
  students = [],
  enrollments = [],
  onSubmit,
  onCancel,
  isEditing = false,
  t = (key) => key,
  lang = 'en'
}) => {
  const toast = useToast();
  const { t: langT } = useLang();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    classId: '',
    studentId: '',
    subjectId: '',
    type: '',
    description: '',
    comment: '',
    points: 0,
    ...initialData
  });

  // Get the appropriate type constants and label function
  const getTypeConstants = () => {
    switch (activityType) {
      case 'behavior':
        return { TYPES: BEHAVIOR_TYPES, getLabel: getBehaviorLabel };
      case 'participation':
        return { TYPES: PARTICIPATION_TYPES, getLabel: getParticipationLabel };
      case 'penalty':
        return { TYPES: PENALTY_TYPES, getLabel: getPenaltyLabel };
      default:
        return { TYPES: [], getLabel: () => '' };
    }
  };

  const { TYPES, getLabel } = getTypeConstants();

  // Filter classes based on selected class
  const filteredClasses = classes.filter(c => {
    if (activityType === 'penalty') {
      // For penalties, only show classes where the user is instructor
      return c.instructorId === (formData.instructorId || '');
    }
    return true;
  });

  // Filter students based on class enrollment
  const filteredStudents = students.filter(u => {
    const userEnrollments = enrollments.filter(e => e.userId === (u.docId || u.id));
    const enrollmentCount = userEnrollments.length;
    const status = getUserStatus(u, userEnrollments);
    const isDisabled = status === USER_STATUS.DELETED;
    
    return !isDisabled && (activityType !== 'penalty' || c.instructorId === (formData.instructorId || ''));
  });

  // Get icon for behavior/participation/penalty types
  const getTypeIcon = (iconName) => {
    const iconMap = {
      'MessageSquare': <MessageSquare size={16} color="#374151" />,
      'Bed': <Bed size={16} color="#374151" />,
      'Users': <Users size={16} color="#374151" />,
      'Smartphone': <Smartphone size={16} color="#374151" />,
      'AlertTriangle': <AlertTriangle size={16} color="#374151" />,
      'Clock': <Clock size={16} color="#374151" />,
      'XCircle': <XCircle size={16} color="#374151" />,
      'HelpCircle': <HelpCircle size={16} color="#374151" />,
      'UserCheck': <UserCheck size={16} color="#374151" />,
      'UserX': <UserX size={16} color="#374151" />,
      'UserMinus': <UserMinus size={16} color="#374151" />,
      'AlertCircle': <AlertTriangle size={16} color="#374151" />,
      'Info': <Info size={16} color="#374151" />
    };
    return iconMap[iconName] || <AlertTriangle size={16} color="#374151" />;
  };

  // Handle class selection
  const handleClassChange = (classId) => {
    const selectedClass = classes.find(c => (c.id || c.docId) === classId);
    setFormData(prev => ({
      ...prev,
      classId,
      studentId: '',
      subjectId: selectedClass?.subjectId || '',
      points: activityType === 'penalty' ? (initialData.points || 0) : prev.points
    }));
  };

  // Handle student selection
  const handleStudentChange = (studentId) => {
    setFormData(prev => ({ ...prev, studentId }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSubmit({
        ...formData,
        points: parseInt(formData.points) || 0,
        comment: formData.comment.trim()
      });
      
      toast.success(t(`${activityType}_recorded`) || 'Activity recorded successfully');
      onCancel(); // Close form after successful submission
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error(t('error_saving_activity') || 'Error saving activity');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ marginBottom: '1rem' }}>
      <CardBody>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>
            {isEditing ? t('edit') : 'Add'} {activityType}
          </h3>
          {isEditing && (
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {/* Class Selection */}
            <div>
              <Select
                searchable
                value={formData.classId}
                onChange={(e) => handleClassChange(e.target.value)}
                options={[
                  { value: '', label: t('select_class') || 'Select Class' },
                  ...filteredClasses.map(c => ({
                    value: c.id || c.docId,
                    label: `${c.name || c.code || c.id}${c.term ? ` (${c.term}${c.year ? ` ${c.year}` : ''}${c.semester ? ` ${c.semester}` : ''})` : ''}`
                  }))
                ]}
                placeholder={t('select_class')}
                required
                disabled={saving}
              />
            </div>

            {/* Student Selection */}
            <div>
              <Select
                searchable
                value={formData.studentId}
                onChange={(e) => handleStudentChange(e.target.value)}
                options={[
                  { value: '', label: t('select_student') || 'Select Student' },
                  ...filteredStudents.map(u => {
                    const userEnrollments = enrollments.filter(e => e.userId === (u.docId || u.id));
                    const enrollmentCount = userEnrollments.length;
                    const status = getUserStatus(u, userEnrollments);
                    const statusSummary = getUserStatusSummary(u, userEnrollments);
                    const iconProps = getStatusIconProps(status);
                    
                    const isDisabled = status === USER_STATUS.DELETED;
                    const statusLabel = statusSummary?.label || status;
                    
                    return {
                      value: u.docId || u.id,
                      displayLabel: u.displayName || u.realName || u.email || 'Unknown',
                      label: (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 8,
                          opacity: isDisabled ? 0.7 : 1
                        }}>
                          {getStatusIconProps(status).icon}
                          <span style={{ 
                            textDecoration: isDisabled ? 'line-through' : 'none',
                            flex: 1
                          }}>
                            {u.displayName || u.realName || u.email || 'Unknown'}
                          </span>
                          <span style={{ 
                            fontSize: '0.8em',
                            color: '#9CA3AF',
                            marginLeft: 'auto'
                          }}>
                            {statusLabel}
                            {enrollmentCount > 0 && ` • ${enrollmentCount} ${t('enrollments') || 'enrollments'}`}
                          </span>
                        </div>
                      ),
                      disabled: isDisabled
                    };
                  })
                ]}
                placeholder={t('select_student')}
                required
                disabled={!formData.classId || saving}
              />
            </div>

            {/* Type Selection */}
            <div>
              <Select
                searchable
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: '', label: `Select ${activityType} Type` },
                  ...TYPES.map(type => ({
                    value: type.id,
                    label: getLabel(type.id, lang),
                    icon: getTypeIcon(type.icon)
                  }))
                ]}
                placeholder={t(`select_${activityType}_type`)}
                required
                disabled={saving}
              />
            </div>

            {/* Description */}
            <div>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('description_required_activity')}
                rows={3}
                required
                disabled={saving}
              />
            </div>

            {/* Comment */}
            <div>
              <Textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Comment (optional)"
                rows={2}
                disabled={saving}
              />
            </div>

            {/* Points (for penalties) */}
            {activityType === 'penalty' && (
              <div>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  placeholder="Points"
                  disabled={saving}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button 
              type="submit" 
              variant="primary" 
              loading={saving}
              disabled={!formData.classId || !formData.studentId || !formData.type || !formData.description}
            >
              {isEditing ? 'Update' : 'Save'}
            </Button>
            {isEditing && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={saving}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardBody>
    </Card>
  );
};

export default InstructorActivityForm;
