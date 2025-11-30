import React from 'react';
import Tabs from './Tabs';
import { Home, User, Settings, Bell } from 'lucide-react';

export default {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

const basicTabs = [
  { label: 'Tab 1', content: <div>Content for Tab 1</div> },
  { label: 'Tab 2', content: <div>Content for Tab 2</div> },
  { label: 'Tab 3', content: <div>Content for Tab 3</div> },
];

export const Basic = {
  args: {
    tabs: basicTabs,
  },
};

const tabsWithIcons = [
  { 
    label: 'Home', 
    icon: <Home size={16} />,
    content: <div><h3>Home</h3><p>Welcome to the home page!</p></div>
  },
  { 
    label: 'Profile', 
    icon: <User size={16} />,
    content: <div><h3>Profile</h3><p>Your profile information.</p></div>
  },
  { 
    label: 'Settings', 
    icon: <Settings size={16} />,
    content: <div><h3>Settings</h3><p>Manage your settings.</p></div>
  },
  { 
    label: 'Notifications', 
    icon: <Bell size={16} />,
    content: <div><h3>Notifications</h3><p>View your notifications.</p></div>
  },
];

export const WithIcons = {
  args: {
    tabs: tabsWithIcons,
  },
};

export const ManyTabs = {
  args: {
    tabs: Array.from({ length: 10 }, (_, i) => ({
      label: `Tab ${i + 1}`,
      content: <div>Content for Tab {i + 1}</div>,
    })),
  },
};
