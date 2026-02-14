import React, { useState } from 'react';
import DeleteModal from './DeleteModal';
import Button from '../Button';
import { RECORD_TYPES } from '@utils/sharedTypes';

// Mock translation function
const mockT = (key, params = {}) => {
  const translations = {
    'delete_activity_title': 'Delete {type}',
    'delete_activity_msg': 'Are you sure you want to delete this {type} record for {studentName}?',
    'attendance': 'Attendance',
    'participation': 'Participation',
    'behavior': 'Behavior',
    'penalty': 'Penalty',
    'delete': 'Delete',
    'cancel': 'Cancel',
    'this_student': 'this student'
  };
  
  let text = translations[key] || key;
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  return text;
};

export default {
  title: 'UI/Modal/DeleteModal',
  component: DeleteModal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Business logic wrapper for activity deletion confirmations. Handles different activity types and translations.'
      }
    }
  }
};

// Delete Attendance Record
export const DeleteAttendance = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Delete Attendance Record
      </Button>
      <DeleteModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          logger.log('Attendance record deleted');
          setIsOpen(false);
        }}
        deleteType={RECORD_TYPES.ATTENDANCE}
        studentName="John Doe"
        deleteLoading={false}
        t={mockT}
      />
    </>
  );
};

// Delete Participation Record
export const DeleteParticipation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Delete Participation Record
      </Button>
      <DeleteModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          logger.log('Participation record deleted');
          setIsOpen(false);
        }}
        deleteType={RECORD_TYPES.PARTICIPATION}
        studentName="Jane Smith"
        deleteLoading={false}
        t={mockT}
      />
    </>
  );
};

// Delete Behavior Record
export const DeleteBehavior = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Delete Behavior Record
      </Button>
      <DeleteModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          logger.log('Behavior record deleted');
          setIsOpen(false);
        }}
        deleteType={RECORD_TYPES.BEHAVIOR}
        studentName="Mike Johnson"
        deleteLoading={false}
        t={mockT}
      />
    </>
  );
};

// Delete Penalty Record
export const DeletePenalty = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Delete Penalty Record
      </Button>
      <DeleteModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          logger.log('Penalty record deleted');
          setIsOpen(false);
        }}
        deleteType={RECORD_TYPES.PENALTY}
        studentName="Sarah Wilson"
        deleteLoading={false}
        t={mockT}
      />
    </>
  );
};

// Loading State
export const LoadingState = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsOpen(false);
    }, 2000);
  };

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Delete with Loading
      </Button>
      <DeleteModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        deleteType={RECORD_TYPES.ATTENDANCE}
        studentName="Test Student"
        deleteLoading={loading}
        t={mockT}
      />
    </>
  );
};

// All Activity Types
export const AllActivityTypes = () => {
  const [modalType, setModalType] = useState(null);

  const activityTypes = [
    { type: RECORD_TYPES.ATTENDANCE, label: 'Attendance', student: 'John Doe' },
    { type: RECORD_TYPES.PARTICIPATION, label: 'Participation', student: 'Jane Smith' },
    { type: RECORD_TYPES.BEHAVIOR, label: 'Behavior', student: 'Mike Johnson' },
    { type: RECORD_TYPES.PENALTY, label: 'Penalty', student: 'Sarah Wilson' }
  ];

  return (
    <>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {activityTypes.map((activity) => (
          <Button
            key={activity.type}
            variant="danger"
            onClick={() => setModalType(activity)}
          >
            Delete {activity.label}
          </Button>
        ))}
      </div>

      {modalType && (
        <DeleteModal
          isOpen={!!modalType}
          onClose={() => setModalType(null)}
          onConfirm={() => {
            logger.log(`${modalType.label} record deleted for ${modalType.student}`);
            setModalType(null);
          }}
          deleteType={modalType.type}
          studentName={modalType.student}
          deleteLoading={false}
          t={mockT}
        />
      )}
    </>
  );
};

// No Student Name
export const NoStudentName = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Delete Without Student Name
      </Button>
      <DeleteModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          logger.log('Record deleted without specific student');
          setIsOpen(false);
        }}
        deleteType={RECORD_TYPES.ATTENDANCE}
        studentName={null}
        deleteLoading={false}
        t={mockT}
      />
    </>
  );
};

