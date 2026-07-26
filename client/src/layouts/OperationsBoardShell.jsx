import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Legacy route — operations board now lives as a tab on /welcome.
 */
export default function OperationsBoardShell() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.set('tab', 'operations');
  // Don't auto-expand - let the user control expansion
  if (!params.get('lane')) params.set('lane', 'status');
  if (!params.get('view')) params.set('view', 'kanban');

  return <Navigate to={`/welcome?${params.toString()}`} replace />;
}
