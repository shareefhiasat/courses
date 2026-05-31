/**
 * Generic CSV Export Utility
 * 
 * Reusable function to export data to CSV format
 */

import Papa from 'papaparse';

/**
 * Export data to CSV
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions with field and headerName
 * @param {String} filename - Name of the file to download
 * @returns {Object} - Success status
 */
export function exportToCSV(data, columns, filename = 'export.csv') {
  if (!data || data.length === 0) {
    return { success: false, error: 'No data to export' };
  }

  // Extract headers from column definitions
  const headers = columns.map(col => col.headerName || col.field);
  
  // Extract data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.field];
      
      // Use custom formatter if available (from renderCell or formatter)
      if (col.renderCell && typeof col.renderCell === 'function') {
        const params = { row, value };
        const formatted = col.renderCell(params);
        // Extract text content if it returns a React element
        if (typeof formatted === 'string') {
          return formatted;
        }
        // If it's an object or element, try to get text
        if (formatted && typeof formatted === 'object') {
          return String(formatted.props?.children || formatted);
        }
        return String(formatted || '');
      }
      
      if (col.formatter && typeof col.formatter === 'function') {
        return String(col.formatter(value, row));
      }
      
      // Handle different value types
      if (value === null || value === undefined) {
        return '';
      }
      
      if (typeof value === 'object') {
        // Handle nested objects (like creator, updater)
        if (col.field === 'creator' || col.field === 'updater') {
          return value.displayName || value.firstName || value.lastName || '';
        }
        return JSON.stringify(value);
      }
      
      return String(value);
    });
  });

  // Combine headers and rows
  const csvData = [headers, ...rows];
  
  // Generate CSV
  const csv = Papa.unparse(csvData);
  
  // Download file
  downloadFile(csv, filename, 'text/csv');
  
  return { success: true };
}

/**
 * Download file helper
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
