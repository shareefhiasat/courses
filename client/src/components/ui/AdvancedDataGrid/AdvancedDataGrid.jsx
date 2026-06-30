import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import {
  DataGrid,
  GridToolbar,
  GRID_CHECKBOX_SELECTION_COL_DEF,
} from '@mui/x-data-grid';
import { arSD, enUS } from '@mui/x-data-grid/locales';
import { Box } from '@mui/material';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import RtlProvider from '@mui/system/RtlProvider';
import { getColoredIcon, getThemedIcon } from '@constants/iconTypes';
import { useTheme } from '@contexts/ThemeContext';
import { useLang } from '@contexts/LangContext';
import { SimpleLoading } from '@ui';


import { info, error, warn, debug } from '@services/utils/logger.js';/**
 * AdvancedDataGrid (MUI DataGrid wrapper)
 * - Sorting, filtering, column visibility, export, quick filter
 * - Row selection, pagination, column reorder/resize
 */
const COLUMN_VIS_STORAGE_PREFIX = 'lms-grid-col-vis-';

const loadColumnVisibility = (gridId) => {
  if (!gridId) return {};
  try {
    const raw = localStorage.getItem(`${COLUMN_VIS_STORAGE_PREFIX}${gridId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const AdvancedDataGrid = ({
  rows = [],
  columns = [],
  pageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  checkboxSelection = true,
  disableRowSelectionOnClick = true,
  density = 'compact',
  autoHeight = true,
  sx = {},
  exportFileName = 'export',
  showExportButton = false,
  exportLabel,
  loadingOverlayMessage,
  direction: directionProp,
  lang: langProp,
  gridId,
  persistColumnVisibility = true,
  ...rest
}) => {
  const { theme } = useTheme();
  const { lang: contextLang, isRTL, t } = useLang();
  const lang = langProp ?? contextLang;
  const direction = directionProp ?? (isRTL ? 'rtl' : 'ltr');
  const resolvedExportLabel = exportLabel ?? t('export');
  const isDarkMode = theme === 'dark';

  const {
    columnVisibilityModel: columnVisibilityModelProp,
    onColumnVisibilityModelChange: onColumnVisibilityModelChangeProp,
    initialState: initialStateProp,
    getRowId: getRowIdProp,
    ...dataGridRest
  } = rest;

  const [columnVisibilityModel, setColumnVisibilityModel] = useState(() => {
    if (columnVisibilityModelProp) return columnVisibilityModelProp;
    return persistColumnVisibility && gridId ? loadColumnVisibility(gridId) : {};
  });

  useEffect(() => {
    if (columnVisibilityModelProp) {
      setColumnVisibilityModel(columnVisibilityModelProp);
    }
  }, [columnVisibilityModelProp]);

  const handleColumnVisibilityChange = useCallback((model) => {
    setColumnVisibilityModel(model);
    onColumnVisibilityModelChangeProp?.(model);
    if (persistColumnVisibility && gridId) {
      try {
        localStorage.setItem(`${COLUMN_VIS_STORAGE_PREFIX}${gridId}`, JSON.stringify(model));
      } catch {
        // ignore quota / private mode
      }
    }
  }, [gridId, onColumnVisibilityModelChangeProp, persistColumnVisibility]);

  const mergedInitialState = useMemo(() => ({
    ...(initialStateProp || {}),
    pagination: {
      paginationModel: {
        pageSize: initialStateProp?.pagination?.paginationModel?.pageSize ?? pageSize,
        page: initialStateProp?.pagination?.paginationModel?.page ?? 0,
      },
    },
  }), [initialStateProp, pageSize]);

  const gridTheme = useMemo(
    () => createTheme({
      direction,
      palette: { mode: isDarkMode ? 'dark' : 'light' },
    }),
    [direction, isDarkMode],
  );
  const checkboxField = GRID_CHECKBOX_SELECTION_COL_DEF.field;
  const isGridRtl = direction === 'rtl';
  const gridDirectionSx = useMemo(() => {
    if (!isGridRtl) return {};
    return {
      '& .MuiDataGrid-columnHeaders': {
        direction: 'rtl',
      },
      '& .MuiDataGrid-columnHeaderRow': {
        direction: 'rtl',
      },
      '& .MuiDataGrid-columnHeader': {
        direction: 'rtl',
      },
      '& .MuiDataGrid-columnHeaderDraggableContainer': {
        direction: 'rtl',
        flexDirection: 'row-reverse',
      },
      '& .MuiDataGrid-columnHeaderTitleContainer': {
        direction: 'rtl',
        flexDirection: 'row-reverse',
        justifyContent: 'flex-start',
      },
      '& .MuiDataGrid-columnHeaderTitleContainerContent': {
        direction: 'rtl',
        justifyContent: 'flex-end',
        width: '100%',
      },
      '& .MuiDataGrid-columnHeaderTitle': {
        direction: 'rtl',
        textAlign: 'right',
        width: '100%',
      },
      '& .MuiDataGrid-cell--textLeft': {
        textAlign: 'right',
        justifyContent: 'flex-end',
      },
      '& .MuiDataGrid-columnHeader--alignLeft': {
        textAlign: 'right',
      },
      '& .MuiDataGrid-columnHeader--alignRight .MuiDataGrid-columnHeaderDraggableContainer, & .MuiDataGrid-columnHeader--alignRight .MuiDataGrid-columnHeaderTitleContainer': {
        flexDirection: 'row-reverse',
      },
    };
  }, [isGridRtl]);
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
      const keepLtr = col.field === 'actions' || col.field === checkboxField || col.type === 'actions';
      if (direction === 'rtl' && !keepLtr) {
        wrapped.align = col.align ?? 'right';
        wrapped.headerAlign = col.headerAlign ?? 'right';
      } else if (direction === 'ltr' && !keepLtr) {
        wrapped.align = col.align ?? 'left';
        wrapped.headerAlign = col.headerAlign ?? 'left';
      }
      if (typeof col.renderCell === 'function') {
        wrapped.renderCell = (params) => col.renderCell(normalizeParams(params, col.field));
      }
      if (typeof col.valueGetter === 'function') {
        wrapped.valueGetter = (params) => {
          // Handle case where MUI passes primitive value directly
          if (params && typeof params !== 'object') {
            // When MUI passes a primitive value, we need to find the row that contains this value
            const foundRow = rowsRef.current.find(r => r[col.field] === params);
            return col.valueGetter({ row: foundRow || {}, value: params, field: col.field });
          }
          return col.valueGetter(normalizeParams(params, col.field));
        };
      }
      if (typeof col.valueFormatter === 'function') {
        wrapped.valueFormatter = (params) => col.valueFormatter(normalizeParams(params, col.field));
      }
      return wrapped;
    });
  }, [columns, direction, checkboxField]);

  const gridLocaleText = useMemo(() => {
    const base = lang === 'ar'
      ? (arSD.components?.MuiDataGrid?.defaultProps?.localeText ?? {})
      : (enUS.components?.MuiDataGrid?.defaultProps?.localeText ?? {});
    return {
      ...base,
      noRowsLabel: lang === 'ar' ? 'لا توجد بيانات' : (t('no_data') || 'No Data'),
    };
  }, [lang, t]);

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
        quickFilterProps={{ debounceMs: 300 }}
      />
    ),
    ...(dataGridRest?.slots || {}) 
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
          <SimpleLoading loading type="spinner" size="lg" />
        </Box>
      )}
      <Box
        dir={direction}
        sx={{
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
          color: isDarkMode ? '#f9fafb !important' : '#111827 !important'
        }, 
        '& .MuiDataGrid-toolbarContainer': { 
          position: 'sticky', 
          top: 0, 
          zIndex: 10,
          background: isDarkMode ? '#111827' : '#ffffff',
          borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
          color: isDarkMode ? '#f9fafb !important' : '#111827 !important'
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
          color: isDarkMode ? '#f9fafb !important' : '#111827 !important',
          borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb'
        },
        '& .MuiDataGrid-columnHeader': {
          backgroundColor: isDarkMode ? '#111827' : '#ffffff',
          color: isDarkMode ? '#f9fafb !important' : '#111827 !important',
          borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb'
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          color: isDarkMode ? '#f9fafb !important' : '#111827 !important',
          fontWeight: 600
        },
        '& .MuiDataGrid-cell': {
          textAlign: direction === 'rtl' ? 'right' : 'left',
          justifyContent: direction === 'rtl' ? 'flex-end' : 'flex-start',
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          color: isDarkMode ? '#f9fafb !important' : '#111827 !important',
          borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb'
        },
        ...(isGridRtl ? gridDirectionSx : {}),
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
        // Checkbox styling to use theme colors instead of default blue
        '& .MuiCheckbox-root': {
          color: isDarkMode ? '#9ca3af' : '#9ca3af',
          '&.Mui-checked': {
            color: isDarkMode ? '#3b82f6' : '#3b82f6'
          },
          '&.MuiCheckbox-indeterminate': {
            color: isDarkMode ? '#3b82f6' : '#3b82f6'
          },
          '&:hover': {
            backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.04)' : 'rgba(59, 130, 246, 0.04)'
          }
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
              fontSize: 'var(--font-size-sm)',
              fontWeight:600,
              cursor:'pointer'
            }}
          >
            {resolvedExportLabel}
          </button>
        </Box>
      )}
      <MuiThemeProvider theme={gridTheme}>
      <RtlProvider value={isGridRtl}>
      <DataGrid
        key={`data-grid-${gridId || 'default'}-${lang}-${direction}`}
        rows={safeRows}
        columns={safeColumns}
        autoHeight={autoHeight}
        pageSizeOptions={pageSizeOptions}
        initialState={mergedInitialState}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={handleColumnVisibilityChange}
        checkboxSelection={checkboxSelection}
        disableRowSelectionOnClick={disableRowSelectionOnClick}
        density={density}
        slots={mergedSlots}
        localeText={gridLocaleText}
        sx={{
          direction,
          ...(isGridRtl ? gridDirectionSx : {}),
        }}
        getRowId={(row) => {
          try {
            const id = typeof getRowIdProp === 'function' ? getRowIdProp(row) : (row?.docId ?? row?.id ?? row?.__rid);
            return id;
          } catch {
            return row?.__rid;
          }
        }}
        {...dataGridRest}
      />
      </RtlProvider>
      </MuiThemeProvider>
      </Box>
    </Box>
  );
};

export default AdvancedDataGrid;
