import React from 'react';
// Bridge TypeScript entry to the JSX App implementation without circular alias
import JsxApp from './App.jsx';

export default function App() {
  return <JsxApp />;
}
