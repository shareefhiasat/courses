import React, { useRef, useMemo } from 'react';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
} from '@mui/x-data-grid';
import { Box } from '@mui/material';

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
  ...rest
}) => {
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
    return (columns || []).map((col) => {
      const wrapped = { ...col };
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

  // Compose a toolbar to guarantee Export presence across versions
  const Toolbar = () => (
    <GridToolbarContainer sx={{ 
      p: 1.5, 
      gap: 1, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      flexWrap: 'wrap'
    }}>
      <GridToolbarQuickFilter 
        quickFilterParser={(value) => value.split(/\s+/).filter(Boolean)} 
        debounceMs={300}
        sx={{ minWidth: 200 }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <GridToolbarColumnsButton sx={{ fontSize: '0.875rem' }} />
        <GridToolbarFilterButton sx={{ fontSize: '0.875rem' }} />
        <GridToolbarDensitySelector sx={{ fontSize: '0.875rem' }} />
        <GridToolbarExport 
          csvOptions={{ 
            fileName: exportFileName,
            delimiter: ',',
            utf8WithBom: true
          }}
          printOptions={{ disableToolbarButton: true }}
          sx={{ 
            fontSize: '0.875rem',
            color: '#10b981',
            fontWeight: 600,
            '&:hover': {
              background: 'rgba(16, 185, 129, 0.1)'
            }
          }}
        />
      </Box>
    </GridToolbarContainer>
  );
  const mergedSlots = { toolbar: Toolbar, ...(rest?.slots || {}) };
  const mergedComponents = { Toolbar, ...(rest?.components || {}) };

  const handleExternalExport = () => {
    if (!safeRows || safeRows.length === 0) return;

    const visibleColumns = safeColumns.filter(col => !col.hide && col.field && col.headerName);
    if (!visibleColumns.length) return;

    const header = visibleColumns.map(col => col.headerName);
    const rowsCsv = safeRows.map((row) => {
      const values = visibleColumns.map(col => {
        const raw = row[col.field];
        const value = raw == null ? '' : String(raw);
        return '"' + value.replace(/"/g, '""') + '"';
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
      width: '100%', 
      '& .MuiDataGrid-root': { border: 'none' }, 
      '& .MuiDataGrid-toolbarContainer': { 
        position: 'sticky', 
        top: 0, 
        zIndex: 10,
        background: 'white',
        borderBottom: '1px solid #e5e7eb'
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
              background:'white',
              color:'#059669',
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
        // MUI v6 API
        slots={mergedSlots}
        // MUI v5 API (fallback)
        components={mergedComponents}
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
  );
};

export default AdvancedDataGrid;
