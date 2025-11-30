import React, { useState } from 'react';
import Select from './Select';

export default {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
};

const countries = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
];

const difficulties = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const activityTypes = [
  { value: 'coding', label: 'Coding' },
  { value: 'theory', label: 'Theory' },
  { value: 'quiz', label: 'Quiz' },
];

// Default
export const Default = {
  args: {
    options: countries,
    placeholder: 'Select a country',
  },
};

// With Label
export const WithLabel = {
  args: {
    label: 'Country',
    options: countries,
    placeholder: 'Select a country',
  },
};

// Required
export const Required = {
  args: {
    label: 'Difficulty Level',
    options: difficulties,
    placeholder: 'Select difficulty',
    required: true,
  },
};

// With Helper Text
export const WithHelperText = {
  args: {
    label: 'Activity Type',
    options: activityTypes,
    placeholder: 'Select type',
    helperText: 'Choose the type of activity',
  },
};

// With Error
export const WithError = {
  args: {
    label: 'Country',
    options: countries,
    value: '',
    error: 'Please select a country',
  },
};

// Sizes
export const AllSizes = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <Select
      size="small"
      options={countries}
      placeholder="Small select"
    />
    <Select
      size="medium"
      options={countries}
      placeholder="Medium select"
    />
    <Select
      size="large"
      options={countries}
      placeholder="Large select"
    />
  </div>
);

// Disabled
export const Disabled = {
  args: {
    label: 'Disabled Select',
    options: countries,
    value: 'us',
    disabled: true,
  },
};

// Full Width
export const FullWidth = {
  args: {
    label: 'Full Width Select',
    options: countries,
    placeholder: 'Select a country',
    fullWidth: true,
  },
};

// Controlled Component
export const Controlled = () => {
  const [value, setValue] = useState('');
  
  return (
    <div style={{ maxWidth: '400px' }}>
      <Select
        label="Select a Country"
        options={countries}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Choose..."
        fullWidth
      />
      <p style={{ marginTop: '1rem', color: '#666' }}>
        Selected: {value || 'None'}
      </p>
    </div>
  );
};

// Filter Form Example
export const FilterForm = () => {
  const [filters, setFilters] = useState({
    type: '',
    difficulty: '',
  });
  
  const handleChange = (field) => (e) => {
    setFilters({ ...filters, [field]: e.target.value });
  };
  
  return (
    <div style={{ maxWidth: '600px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <Select
        label="Activity Type"
        options={activityTypes}
        value={filters.type}
        onChange={handleChange('type')}
        placeholder="All Types"
        fullWidth
      />
      <Select
        label="Difficulty"
        options={difficulties}
        value={filters.difficulty}
        onChange={handleChange('difficulty')}
        placeholder="All Levels"
        fullWidth
      />
    </div>
  );
};

// Form with Validation
export const FormWithValidation = () => {
  const [formData, setFormData] = useState({
    country: '',
    difficulty: '',
    type: '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.country) {
      newErrors.country = 'Country is required';
    }
    if (!formData.difficulty) {
      newErrors.difficulty = 'Difficulty is required';
    }
    if (!formData.type) {
      newErrors.type = 'Activity type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true);
    }
  };
  
  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    // Clear error when user makes a selection
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };
  
  if (submitted) {
    return (
      <div style={{ padding: '2rem', background: '#d4edda', borderRadius: '8px', color: '#155724' }}>
        <h3>Form Submitted Successfully!</h3>
        <pre>{JSON.stringify(formData, null, 2)}</pre>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Select
        label="Country"
        options={countries}
        value={formData.country}
        onChange={handleChange('country')}
        error={errors.country}
        required
        fullWidth
      />
      <Select
        label="Difficulty Level"
        options={difficulties}
        value={formData.difficulty}
        onChange={handleChange('difficulty')}
        error={errors.difficulty}
        helperText="Choose your skill level"
        required
        fullWidth
      />
      <Select
        label="Activity Type"
        options={activityTypes}
        value={formData.type}
        onChange={handleChange('type')}
        error={errors.type}
        required
        fullWidth
      />
      <button
        type="submit"
        style={{
          padding: '0.5rem 1rem',
          background: '#800020',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
        }}
      >
        Submit
      </button>
    </form>
  );
};
