import React, { useState } from 'react';
import Input from './Input';
import { getThemedIcon } from '@constants/iconTypes';

export default {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Enhanced Input component with theme support and icon integration.'
      }
    }
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
    theme: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Theme mode for the input',
    }
  },
};

// Default
export const Default = {
  args: {
    placeholder: 'Enter text...',
  },
};

// With Label
export const WithLabel = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'you@example.com',
  },
};

// Required Field
export const Required = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    required: true,
  },
};

// With Helper Text
export const WithHelperText = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    helperText: 'Must be at least 8 characters',
  },
};

// With Error
export const WithError = {
  args: {
    label: 'Email',
    type: 'email',
    value: 'invalid-email',
    error: 'Please enter a valid email address',
  },
};

// Sizes
export const AllSizes = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <Input size="small" placeholder="Small input" />
    <Input size="medium" placeholder="Medium input" />
    <Input size="large" placeholder="Large input" />
  </div>
);

// With Prefix Icon
export const WithPrefixIcon = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'you@example.com',
    prefix: getThemedIcon('ui', 'mail', 16, theme),
  },
};

// With Suffix Icon
export const WithSuffixIcon = {
  args: {
    label: 'Search',
    placeholder: 'Search...',
    suffix: getThemedIcon('ui', 'search', 16, theme),
  },
};

// Password with Toggle
export const PasswordToggle = () => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <Input
      label="Password"
      type={showPassword ? 'text' : 'password'}
      placeholder="Enter password"
      prefix={getThemedIcon('ui', 'lock', 16, theme)}
      suffix={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            pointerEvents: 'all',
          }}
        >
          {showPassword ? getThemedIcon('ui', 'eye_off', 16, theme) : getThemedIcon('ui', 'eye', 16, theme)}
        </button>
      }
    />
  );
};

// Disabled
export const Disabled = {
  args: {
    label: 'Disabled Input',
    value: 'Cannot edit this',
    disabled: true,
  },
};

// Full Width
export const FullWidth = {
  args: {
    label: 'Full Width Input',
    placeholder: 'This input takes full width',
    fullWidth: true,
  },
};

// Login Form Example
export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  return (
    <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        prefix={getThemedIcon('ui', 'mail', 16, theme)}
        required
        fullWidth
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
        prefix={getThemedIcon('ui', 'lock', 16, theme)}
        required
        fullWidth
      />
    </div>
  );
};

// Search Bar Example
export const SearchBar = () => {
  const [search, setSearch] = useState('');
  
  return (
    <Input
      placeholder={t('search_activities') || 'Search activities...'}
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      prefix={getThemedIcon('ui', 'search', 16, theme)}
      fullWidth
    />
  );
};

// Form with Validation
export const FormWithValidation = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    age: '',
  });
  const [errors, setErrors] = useState({});
  
  const validate = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'username':
        if (value.length < 3) {
          newErrors.username = 'Username must be at least 3 characters';
        } else {
          delete newErrors.username;
        }
        break;
      case 'email':
        if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Invalid email address';
        } else {
          delete newErrors.email;
        }
        break;
      case 'age':
        if (value < 13) {
          newErrors.age = 'Must be at least 13 years old';
        } else {
          delete newErrors.age;
        }
        break;
    }
    
    setErrors(newErrors);
  };
  
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData({ ...formData, [field]: value });
    validate(field, value);
  };
  
  return (
    <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Input
        label="Username"
        value={formData.username}
        onChange={handleChange('username')}
        error={errors.username}
        prefix={getThemedIcon('ui', 'user', 16, theme)}
        required
        fullWidth
      />
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={handleChange('email')}
        error={errors.email}
        prefix={getThemedIcon('ui', 'mail', 16, theme)}
        required
        fullWidth
      />
      <Input
        label="Age"
        type="number"
        value={formData.age}
        onChange={handleChange('age')}
        error={errors.age}
        helperText="You must be at least 13 years old"
        required
        fullWidth
      />
    </div>
  );
};

// Dark Theme Examples
export const DarkTheme = () => (
  <div style={{ 
    background: '#1f2937', 
    padding: '2rem', 
    borderRadius: '8px',
    display: 'flex', 
    flexDirection: 'column', 
    gap: '1rem' 
  }}>
    <Input 
      theme="dark"
      label="Email" 
      type="email" 
      placeholder="you@example.com"
      prefix={getThemedIcon('ui', 'mail', 16, 'dark')}
    />
    <Input 
      theme="dark"
      label="Password" 
      type="password" 
      placeholder="Enter password"
      prefix={getThemedIcon('ui', 'lock', 16, 'dark')}
    />
    <Input 
      theme="dark"
      label="Search" 
      placeholder="Search..."
      suffix={getThemedIcon('ui', 'search', 16, 'dark')}
    />
  </div>
);
