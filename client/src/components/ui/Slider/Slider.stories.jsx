import React, { useState } from 'react';
import Slider from './Slider';


import { info, error, warn, debug } from '@services/utils/logger.js';export default {
  title: 'UI/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A customizable slider component supporting both single value and range modes with full theme support and localization.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: { type: 'select' },
      options: ['single', 'range'],
      description: 'Slider mode: single value or range',
    },
    min: {
      control: { type: 'number' },
      description: 'Minimum value',
    },
    max: {
      control: { type: 'number' },
      description: 'Maximum value',
    },
    step: {
      control: { type: 'number' },
      description: 'Step increment',
    },
    value: {
      control: { type: 'object' },
      description: 'Current value (number for single, array for range)',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disable the slider',
    },
    showValue: {
      control: { type: 'boolean' },
      description: 'Show the current value',
    },
    label: {
      control: { type: 'text' },
      description: 'Label for the slider',
    },
  },
};

export const SingleValue = {
  args: {
    mode: 'single',
    min: 0,
    max: 100,
    step: 1,
    value: 50,
    label: 'Number of Scans',
    showValue: true,
  },
};

export const SingleValueNoValue = {
  args: {
    mode: 'single',
    min: 0,
    max: 50,
    step: 5,
    value: 25,
    label: 'Scan Count',
    showValue: false,
  },
};

export const RangeSlider = {
  args: {
    mode: 'range',
    min: 0,
    max: 100,
    step: 1,
    value: [25, 75],
    label: 'Scan Range',
    showValue: true,
  },
};

export const RangeSliderSmallRange = {
  args: {
    mode: 'range',
    min: 0,
    max: 20,
    step: 1,
    value: [5, 15],
    label: 'Scan Range (0-20)',
    showValue: true,
  },
};

export const Disabled = {
  args: {
    mode: 'single',
    min: 0,
    max: 100,
    step: 1,
    value: 30,
    label: 'Disabled Slider',
    disabled: true,
    showValue: true,
  },
};

export const DisabledRange = {
  args: {
    mode: 'range',
    min: 0,
    max: 100,
    step: 1,
    value: [20, 80],
    label: 'Disabled Range Slider',
    disabled: true,
    showValue: true,
  },
};

export const CustomStep = {
  args: {
    mode: 'single',
    min: 0,
    max: 50,
    step: 5,
    value: 20,
    label: 'Custom Step (5)',
    showValue: true,
  },
};

export const Interactive = () => {
  const [singleValue, setSingleValue] = useState(30);
  const [rangeValue, setRangeValue] = useState([20, 60]);

  return (
    <div style={{ width: '400px', padding: '20px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h3>Single Value Slider</h3>
        <Slider
          mode="single"
          min={0}
          max={100}
          step={1}
          value={singleValue}
          onChange={setSingleValue}
          label="Number of Scans"
          showValue={true}
        />
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Current value: {singleValue}
        </p>
      </div>

      <div>
        <h3>Range Slider</h3>
        <Slider
          mode="range"
          min={0}
          max={100}
          step={1}
          value={rangeValue}
          onChange={setRangeValue}
          label="Scan Range"
          showValue={true}
        />
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Current range: {rangeValue[0]} - {rangeValue[1]}
        </p>
      </div>
    </div>
  );
};

Interactive.parameters = {
  docs: {
    description: {
      story: 'Interactive example showing how to use the Slider component with state management. Try dragging the thumbs in range mode or adjusting the single value slider.',
    },
  },
};

export const ThemeDemo = () => {
  const [value, setValue] = useState([15, 35]);
  const [isDark, setIsDark] = useState(false);

  return (
    <div style={{ 
      width: '400px', 
      padding: '20px',
      background: isDark ? '#1f2937' : '#ffffff',
      borderRadius: '8px',
      transition: 'background-color 0.3s ease'
    }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: isDark ? '#f9fafb' : '#111827', margin: 0 }}>
          Theme Demo
        </h3>
        <button
          onClick={() => setIsDark(!isDark)}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
            background: isDark ? '#374151' : '#f9fafb',
            color: isDark ? '#f9fafb' : '#111827',
            cursor: 'pointer'
          }}
        >
          {isDark ? 'Light' : 'Dark'}
        </button>
      </div>
      
      <Slider
        mode="range"
        min={0}
        max={50}
        step={1}
        value={value}
        onChange={setValue}
        label="Scan Count Range"
        showValue={true}
      />
      
      <p style={{ 
        marginTop: '10px', 
        fontSize: '14px', 
        color: isDark ? '#9ca3af' : '#6b7280' 
      }}>
        Current range: {value[0]} - {value[1]}
      </p>
    </div>
  );
};

ThemeDemo.parameters = {
  docs: {
    description: {
      story: 'Demonstrates how the Slider component adapts to different themes. Toggle between light and dark modes to see the styling changes.',
    },
  },
};
