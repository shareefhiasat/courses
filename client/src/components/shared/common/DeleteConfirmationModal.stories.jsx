import React from 'react';
import { useState } from 'react';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { Button } from '../ui/Button/Button';

export default {
  title: 'Shared/Common/DeleteConfirmationModal',
  component: DeleteConfirmationModal,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      defaultValue: false,
    },
    title: {
      control: 'text',
      defaultValue: 'Delete Item',
    },
    message: {
      control: 'text',
      defaultValue: 'Are you sure you want to delete this item? This action cannot be undone.',
    },
    confirmText: {
      control: 'text',
      defaultValue: 'Delete',
    },
    cancelText: {
      onConfirm: 'text',
      defaultValue: 'Cancel',
    },
    itemType: {
      control: 'text',
      defaultValue: 'item',
    },
  },
};

export const Default = {
  args: {
    isOpen: false,
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    itemType: 'item',
  },
};

export const WithCustomMessage = {
  args: {
    isOpen: true,
    title: 'Delete User Account',
    message: 'Are you sure you want to delete this user account? All associated data will be permanently removed.',
    confirmText: 'Delete Account',
    cancelText: 'Cancel',
    itemType: 'user account',
  },
};

export const StudentDeletion = {
  args: {
    isOpen: true,
    title: 'Delete Student Record',
    message: 'Are you sure you want to delete this student record? This action cannot be undone and will remove all associated data including attendance, grades, and activity logs.',
    confirmText: 'Delete Student',
    cancelText: 'Cancel',
    itemType: 'student record',
  },
};

export const WithCustomActions = {
  args: {
    isOpen: true,
    title: 'Delete Document',
    message: 'Are you sure you want to delete this document? You can choose to archive instead of permanently deleting.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    itemType: 'document',
    onConfirm: () => console.log('Document deleted'),
    onCancel: () => console.log('Deletion cancelled'),
    extraActions: (
      <Button variant="outline" onClick={() => console.log('Archived')}>
        Archive
      </Button>
    ),
  },
};
