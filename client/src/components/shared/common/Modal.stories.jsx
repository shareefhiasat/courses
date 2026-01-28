import React from 'react';
import Modal from './Modal';
import { Button } from '../ui/Button/Button';

export default {
  title: 'Shared/Common/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    open: {
      control: 'boolean',
      defaultValue: true,
    },
    title: {
      control: 'text',
      defaultValue: 'Modal Title',
    },
    size: {
      control: 'select',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Large', value: 'large' },
        { label: 'Fullscreen', value: 'fullscreen' },
      ],
      defaultValue: 'default',
    },
    actions: {
      control: 'boolean',
      defaultValue: false,
    }
  },
};

export const Default = {
  args: {
    open: true,
    title: 'Modal Title',
    size: 'default',
    actions: false,
    children: (
      <div style={{ padding: '20px' }}>
        <p>This is the modal content.</p>
      </div>
    ),
  },
};

export const WithActions = {
  args: {
    open: true,
    title: 'Confirm Action',
    size: 'large',
    actions: (
      <>
        <Button variant="outline" onClick={() => console.log('Cancelled')}>
          Cancel
        </Button>
        <Button onClick={() => console.log('Confirmed')}>
          Confirm
        </Button>
      </>
    ),
    children: (
      <div style={{ padding: '20px' }}>
        <p>Are you sure you want to perform this action?</p>
      </div>
    ),
  },
};

export const Fullscreen = {
  args: {
    open: true,
    title: 'Fullscreen Modal',
    size: 'fullscreen',
    children: (
      <div style={{ padding: '40px' }}>
        <h2>Fullscreen Modal</h2>
        <p>This modal takes up the full screen.</p>
      </div>
    ),
  },
};

export const WithoutTitle = {
  args: {
    open: true,
    size: 'default',
    children: (
      <div style={{ padding: '20px' }}>
        <p>Modal without title bar.</p>
      </div>
    ),
  },
};
