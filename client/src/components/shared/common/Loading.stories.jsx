import React from 'react';
import Loading from './Loading';

export default {
  title: 'Shared/Common/Loading',
  component: Loading,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    message: {
      control: 'text',
      defaultValue: 'Loading...',
    },
    fullscreen: {
      control: 'boolean',
      defaultValue: false,
    },
    size: {
      control: { type: 'range', min: 16, max: 64, step: 8 },
      defaultValue: 48,
    }
  },
};

export const Default = {
  args: {
    message: 'Loading...',
    fullscreen: false,
    size: 48,
  },
};

export const Fullscreen = {
  args: {
    message: 'Loading data...',
    fullscreen: true,
    size: 64,
  },
};

export const Small = {
  args: {
    message: 'Loading...',
    fullscreen: false,
    size: 24,
  },
};

export const CustomMessage = {
  args: {
    message: 'Please wait while we process your request...',
    fullscreen: false,
    size: 40,
  },
};
