import React, { useRef, useMemo } from 'react';
import {
  DataGrid,
  GridToolbar,
} from '@mui/x-data-grid';
import { arSD } from '@mui/x-data-grid/locales';
import { Box } from '@mui/material';
import { getColoredIcon, getThemedIcon } from '@constants/iconTypes';
import { useTheme } from '@contexts/ThemeContext';
import Loading from '../Loading';

/**
 * AdvancedDataGrid (MUI DataGrid wrapper)
 * - Sorting, filtering, column visibility, export, quick filter
 * - Row selection, pagination, column reorder/resize
 */
const AdvancedDataGrid = ({
  rows = [],
  columns = [],
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50, 100],
  checkboxSelection = true,
  disableRowSelectionOnClick = true,
  density = 'compact',
  autoHeight = true,
  sx = {},
  exportFileName = 'export',
  showExportButton = false,
  exportLabel = 'Export',
  loadingOverlayMessage,
  fancyVariant = 'dots',
  direction = 'ltr', // 'ltr' or 'rtl'
  lang = 'en', // 'en' or 'ar'
  ...rest
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  // Store rows in a ref so we can access them in valueGetter
  const rowsRef = useRef(rows || []);
  rowsRef.current = rows || [];

  // Ensure rows are valid objects and assign a fallback id when missing
  const safeRows = useMemo(() => {
    return (rows || [])
      .filter(Boolean)
      .map((r, i) => {
        const obj = r && typeof r === 'object' ? r : {};
        if (obj.id == null && obj.docId == null && obj.__rid == null) {
          return { ...obj, __rid: `row_${i}` };
        }
        return obj;
      });
  }, [rows]);

  // Normalize params before passing to user callbacks
  const normalizeParams = (p, field) => {
    // Handle case where MUI passes a primitive value directly (not an object)
    if (!p || typeof p !== 'object') {
      // MUI sometimes calls valueGetter with just the value - return it as-is
      return { row: {}, value: p, field };
    }
    
    // Preserve ALL original properties from MUI DataGrid
    const base = { ...p };
    
    // CRITICAL: If row is empty or missing, try to find it from our rows array
    if (!p.row || (typeof p.row === 'object' && Object.keys(p.row).length === 0)) {
      // Try to find the row by ID from our rows array
      if (p.id) {
        const foundRow = rowsRef.current.find(r => {
          const rowId = r.docId || r.id || r.__rid;
          return rowId === p.id;
        });
        if (foundRow) {
          base.row = foundRow;
          // If value is undefined, get it from the found row
          if (base.value === undefined && base.field && foundRow) {
            base.value = foundRow[base.field];
          }
        } else {
          base.row = {};
        }
      } else {
        base.row = {};
      }
    } else if (p.row && typeof p.row === 'object' && !Array.isArray(p.row)) {
      // Row is valid object - preserve it exactly as-is
      base.row = p.row;
      // If value is undefined, try to get it from row
      if (base.value === undefined && base.field && base.row) {
        base.value = base.row[base.field];
      }
    } else {
      // Invalid row type
      base.row = {};
    }
    
    return base;
  };

  // Safely wrap column callbacks to avoid crashes when params is unexpected
  const safeColumns = useMemo(() => {
    return (columns || []).map((col, index) => {
      const wrapped = { ...col };
      // Ensure each column has a unique key
      if (!wrapped.key) {
        wrapped.key = wrapped.field || `column-${index}`;
      }
      if (typeof col.renderCell === 'function') {
        wrapped.renderCell = (params) => col.renderCell(normalizeParams(params, col.field));
      }
      if (typeof col.valueGetter === 'function') {
        wrapped.valueGetter = (params) => {
          // Handle case where MUI passes primitive value directly
          if (params && typeof params !== 'object') {
            return col.valueGetter({ row: {}, value: params, field: col.field });
          }
          return col.valueGetter(normalizeParams(params, col.field));
        };
      }
      if (typeof col.valueFormatter === 'function') {
        wrapped.valueFormatter = (params) => col.valueFormatter(normalizeParams(params, col.field));
      }
      return wrapped;
    });
  }, [columns]);

  // Arabic locale text for DataGrid
  const arabicLocale = {
    ...arSD,
    // Toolbar
    toolbarColumns: 'الأعمدة',
    toolbarFilters: 'تصفية',
    toolbarDensity: 'الكثافة',
    toolbarExport: 'تصدير',
    toolbarQuickFilterPlaceholder: 'بحث...',
    // Column menu
    columnMenuLabel: 'القائمة',
    columnMenuShowColumns: 'إظهار الأعمدة',
    columnMenuFilter: 'تصفية',
    columnMenuHideColumn: 'إخفاء',
    columnMenuUnsort: 'إلغاء الترتيب',
    columnMenuSortAsc: 'ترتيب تصاعدي',
    columnMenuSortDesc: 'ترتيب تنازلي',
    columnMenuManageColumns: 'إدارة الأعمدة',
    // Filter
    filterOperatorContains: 'يحتوي',
    filterOperatorEquals: 'يساوي',
    filterOperatorStartsWith: 'يبدأ بـ',
    filterOperatorEndsWith: 'ينتهي بـ',
    filterOperatorIsEmpty: 'فارغ',
    filterOperatorIsNotEmpty: 'غير فارغ',
    filterOperatorIsAnyOf: 'أي من',
    // Pagination
    MuiTablePagination: {
      labelRowsPerPage: 'الصفوف في الصفحة:',
      labelDisplayedRows: ({ from, to, count }) => `${from}–${to} من ${count !== -1 ? count : `أكثر من ${to}`}`
    }
  };

  // Export fields (exclude internal/actions columns)
  const exportFields = useMemo(() => 
    safeColumns
      .filter(col => col.field !== 'docId' && col.field !== 'id' && col.field !== '__rid' && col.field !== 'actions')
      .map(col => col.field),
    [safeColumns]
  );

  // v8 GridToolbar includes columns, filters, density, export internally
  const mergedSlots = { 
    toolbar: () => (
      <GridToolbar 
        csvOptions={{ fileName: exportFileName, delimiter: ',', utf8WithBom: true, fields: exportFields }}
        printOptions={{ disableToolbarButton: true }}
      />
    ),
    ...(rest?.slots || {}) 
  };

  const handleExternalExport = () => {
    if (!safeRows || safeRows.length === 0) return;

    // Filter out Firebase ID columns and hidden columns
    const visibleColumns = safeColumns.filter(col => 
      !col.hide && 
      col.field && 
      col.headerName && 
      col.field !== 'docId' && 
      col.field !== 'id' && 
      col.field !== '__rid' &&
      col.field !== 'actions' // Also exclude actions column from export
    );
    if (!visibleColumns.length) return;

    const header = visibleColumns.map(col => col.headerName);
    const rowsCsv = safeRows.map((row) => {
      const values = visibleColumns.map(col => {
        let value;
        
        // Use valueFormatter if available for proper formatting
        if (typeof col.valueFormatter === 'function') {
          try {
            value = col.valueFormatter({ value: row[col.field], row, field: col.field });
          } catch (e) {
            value = row[col.field];
          }
        } else {
          value = row[col.field];
        }
        
        const stringValue = value == null ? '' : String(value);
        return '"' + stringValue.replace(/"/g, '""') + '"';
      });
      return values.join(',');
    });

    const csv = [header.join(','), ...rowsCsv].join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${exportFileName || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%',
      height: 'auto',
      maxHeight: '70vh',
      overflow: 'hidden'
    }}>
      {loadingOverlayMessage && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backdropFilter: 'blur(2px)'
        }}>
          <Loading variant="fancy" fancyVariant={fancyVariant} message={loadingOverlayMessage} />
        </Box>
      )}
      <Box sx={{ 
        width: '100%', 
        height: '100%',
        maxHeight: '70vh',
        overflow: 'hidden',
        direction: direction,
        '& .MuiDataGrid-root': { 
          border: 'none',
          overflow: 'hidden',
          maxHeight: '70vh',
          direction: direction,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          color: isDarkMode ? '#f9fafb' : '#111827'
        }, 
        '& .MuiDataGrid-toolbarContainer': { 
          position: 'sticky', 
          top: 0, 
          zIndex: 10,
          background: isDarkMode ? '#111827' : '#ffffff',
          borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
          color: isDarkMode ? '#f9fafb' : '#111827'
        }, 
        '& .MuiDataGrid-main': {
          overflow: 'hidden',
          maxHeight: 'calc(70vh - 60px)'
        },
        '& .MuiDataGrid-virtualScroller': {
          overflow: 'auto !important',
          maxHeight: 'calc(70vh - 60px)'
        },
        '& .MuiDataGrid-columnHeaders': {
          textAlign: direction === 'rtl' ? 'right' : 'left',
          backgroundColor: isDarkMode ? '#111827' : '#ffffff',
          color: isDarkMode ? '#f9fafb' : '#111827',
          borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb'
        },
        '& .MuiDataGrid-columnHeader': {
          backgroundColor: isDarkMode ? '#111827' : '#ffffff',
          color: isDarkMode ? '#f9fafb' : '#111827',
          borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb'
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          color: isDarkMode ? '#f9fafb' : '#111827',
          fontWeight: 600
        },
        '& .MuiDataGrid-cell': {
          textAlign: direction === 'rtl' ? 'right' : 'left',
          justifyContent: direction === 'rtl' ? 'flex-end' : 'flex-start',
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          color: isDarkMode ? '#f9fafb' : '#111827',
          borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb'
        },
        '& .MuiDataGrid-row': {
          direction: direction,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          '&:hover': {
            backgroundColor: isDarkMode ? '#374151' : '#f9fafb'
          }
        },
        // Ensure actions column is always visible in RTL
        '& .MuiDataGrid-cell[data-field="actions"]': {
          justifyContent: 'flex-start',
          direction: 'ltr'
        },
        '& .MuiDataGrid-columnHeader[data-field="actions"]': {
          direction: 'ltr'
        },
        ...sx 
      }}>
      {showExportButton && (
        <Box sx={{ display:'flex', justifyContent:'flex-end', mb: 0.5 }}>
          <button
            type="button"
            onClick={handleExternalExport}
            style={{
              border:'1px solid #10b981',
              background: isDarkMode ? '#1f2937' : 'white',
              color: isDarkMode ? '#10b981' : '#059669',
              borderRadius:999,
              padding:'4px 10px',
              fontSize:'0.8rem',
              fontWeight:600,
              cursor:'pointer'
            }}
          >
            {exportLabel}
          </button>
        </Box>
      )}
      <DataGrid
        rows={safeRows}
        columns={safeColumns}
        autoHeight={autoHeight}
        pageSizeOptions={pageSizeOptions}
        initialState={{ pagination: { paginationModel: { pageSize } } }}
        checkboxSelection={checkboxSelection}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        density={density}
        // MUI v8 API
        slots={mergedSlots}
        localeText={lang === 'ar' ? arabicLocale : undefined}
        getRowId={(row) => {
          try {
            // Use consumer-provided getRowId if passed through rest
            const userGetRowId = rest?.getRowId;
            const id = typeof userGetRowId === 'function' ? userGetRowId(row) : (row?.docId ?? row?.id ?? row?.__rid);
            return id;
          } catch {
            return row?.__rid;
          }
        }}
        {...rest}
      />
      </Box>
    </Box>
  );
};

export default AdvancedDataGrid;
