import React from 'react';
import { TEXT_SIZE_IDS } from '@config/textSize.config.js';

export default {
  title: 'Design System/Type Scale',
  parameters: { layout: 'padded' },
};

const SAMPLE = 'The quick brown fox jumps over the lazy dog.';

function TypeScalePanel({ textSize }) {
  return (
    <div data-text-size={textSize} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid var(--border)' }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: 'var(--font-size-lg)' }}>Text size: {textSize}</h3>
      <p style={{ fontSize: 'var(--font-size-xs)', margin: '0.25rem 0' }}>xs — {SAMPLE}</p>
      <p style={{ fontSize: 'var(--font-size-sm)', margin: '0.25rem 0' }}>sm — {SAMPLE}</p>
      <p style={{ fontSize: 'var(--font-size-md)', margin: '0.25rem 0' }}>md — {SAMPLE}</p>
      <p style={{ fontSize: 'var(--font-size-lg)', margin: '0.25rem 0' }}>lg — {SAMPLE}</p>
      <p style={{ fontSize: 'var(--font-size-2xl)', margin: '0.25rem 0' }}>2xl — {SAMPLE}</p>
    </div>
  );
}

export const AllTiers = () => (
  <div>
    {TEXT_SIZE_IDS.map((id) => (
      <TypeScalePanel key={id} textSize={id} />
    ))}
  </div>
);
