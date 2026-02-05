// Centralized Types Index
// This file exports all TypeScript types for easy importing across the project

// Re-export all types from the main types file
export * from './index.ts';

// Additional type exports for convenience
export {
  // Common React types
  ReactNode,
  CSSProperties,
  ChangeEvent,
  FormEvent,
  MouseEvent,
  KeyboardEvent,
  FocusEvent,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef
} from 'react';

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Default export containing all types
export default {
  // Re-export everything from index.ts
  ...require('./index.ts'),
  
  // Additional exports
  ReactNode,
  CSSProperties,
  ChangeEvent,
  FormEvent,
  MouseEvent,
  KeyboardEvent,
  FocusEvent,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  Optional,
  RequiredFields,
  DeepPartial
};
