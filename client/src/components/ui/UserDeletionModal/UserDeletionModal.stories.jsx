import React, { useState } from 'react';
import UserDeletionModal from './UserDeletionModal';
import Button from '../Button';


import { info, error, warn, debug } from '@services/utils/logger.js';export default {
  title: 'UI/Modal/UserDeletionModal',
  component: UserDeletionModal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Modal for confirming user account deletion. Shows user information and handles the deletion process.'
      }
    }
  }
};

// Delete User with Display Name
export const DeleteUserWithDisplayName = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user] = useState({
    displayName: 'John Doe',
    email: 'john.doe@example.com'
  });

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Delete User (with Display Name)
      </Button>
      <UserDeletionModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        user={user}
      />
    </>
  );
};

// Delete User with Email Only
export const DeleteUserWithEmailOnly = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user] = useState({
    email: 'jane.smith@example.com'
  });

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Delete User (email only)
      </Button>
      <UserDeletionModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        user={user}
      />
    </>
  );
};

// Loading State
export const LoadingState = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user] = useState({
    displayName: 'Test User',
    email: 'test@example.com'
  });

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Delete User (with loading)
      </Button>
      <UserDeletionModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        user={user}
      />
    </>
  );
};

// Multiple Users
export const MultipleUsers = () => {
  const [modalUser, setModalUser] = useState(null);

  const users = [
    { displayName: 'John Doe', email: 'john.doe@example.com' },
    { displayName: 'Jane Smith', email: 'jane.smith@example.com' },
    { displayName: 'Mike Johnson', email: 'mike.j@example.com' },
    { email: 'anonymous.user@example.com' }
  ];

  return (
    <>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {users.map((user, index) => (
          <Button
            key={index}
            variant="danger"
            onClick={() => setModalUser(user)}
          >
            Delete {user.displayName || user.email}
          </Button>
        ))}
      </div>

      {modalUser && (
        <UserDeletionModal
          open={!!modalUser}
          onClose={() => setModalUser(null)}
          user={modalUser}
        />
      )}
    </>
  );
};

// No User Data
export const NoUserData = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Delete User (no data)
      </Button>
      <UserDeletionModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        user={null}
      />
    </>
  );
};
