import React, { useState, useMemo } from 'react';
import './SmartGrid.css';
import Modal from './Modal';
import { useToast } from './ToastProvider';
import { useLang } from '../contexts/LangContext';

const SmartGrid = ({ 
  data = [], 
  columns = [], 
  onEdit, 
  onDelete, 
  onAdd,
  title = "Data Grid",
  searchPlaceholder = "Search...",
  pageSize = 10,
  allowEdit = true,
  allowDelete = true,
  allowAdd = true,
  validateDelete = null, // function to validate before delete
  quickFilters = null, // { active, buttons: [{key, label, filter(item)}] }
  skipDeleteConfirmation = false // skip confirmation modal and call onDelete directly
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [deletingItem, setDeletingItem] = useState(null);
  
  const toast = useToast();
  const { t } = useLang();

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = data;
    
    // Apply quick filters first
    if (quickFilters && quickFilters.active && quickFilters.active !== 'all') {
      const activeFilter = quickFilters.buttons.find(b => b.key === quickFilters.active);
      if (activeFilter && activeFilter.filter) {
        result = result.filter(activeFilter.filter);
      }
    }
    
    // Then apply search
    if (searchTerm) {
      result = result.filter(item => 
        columns.some(col => {
          const value = col.accessor ? item[col.accessor] : item[col.field];
          return String(value || '').toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }
    
    return result;
  }, [data, searchTerm, columns, quickFilters]);

  // Helpers for robust sorting
  const parseForSort = (val) => {
    if (val == null) return { type: 'empty', value: '' };
    // Firestore Timestamp
    if (typeof val === 'object' && val.seconds) {
      return { type: 'date', value: new Date(val.seconds * 1000).getTime() };
    }
    if (val instanceof Date) {
      return { type: 'date', value: val.getTime() };
    }
    if (typeof val === 'number') {
      return { type: 'number', value: val };
    }
    const str = String(val).trim();
    // DD/MM/YYYY
    const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const iso = /^(\d{4})-(\d{2})-(\d{2})/;
    if (ddmmyyyy.test(str)) {
      const [, d, m, y] = str.match(ddmmyyyy);
      const t = new Date(`${y}-${m}-${d}T00:00:00`).getTime();
      return { type: 'date', value: isNaN(t) ? 0 : t };
    }
    if (iso.test(str)) {
      const t = new Date(str).getTime();
      return { type: 'date', value: isNaN(t) ? 0 : t };
    }
    const num = parseFloat(str);
    if (!isNaN(num) && isFinite(num)) {
      return { type: 'number', value: num };
    }
    return { type: 'string', value: str.toLowerCase() };
  };

  // Sort data (dates, numbers, strings)
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aParsed = parseForSort(a[sortField]);
      const bParsed = parseForSort(b[sortField]);
      
      let comp = 0;
      if (aParsed.type === bParsed.type) {
        comp = aParsed.value > bParsed.value ? 1 : (aParsed.value < bParsed.value ? -1 : 0);
      } else {
        // Ensure consistent ordering between types
        const order = { empty: 0, string: 1, number: 2, date: 3 };
        comp = order[aParsed.type] - order[bParsed.type];
      }
      return sortDirection === 'asc' ? comp : -comp;
    });
  }, [filteredData, sortField, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortDirection('asc');
    }
  };

  const canDeleteItem = validateDelete || null;

  const handleDeleteClick = async (item) => {
    if (!onDelete) return;
    
    // If skipDeleteConfirmation is true, call onDelete directly
    if (skipDeleteConfirmation) {
      await onDelete(item);
      return;
    }
    
    // Check if item can be deleted
    if (canDeleteItem) {
      const deleteCheck = await canDeleteItem(item);
      if (!deleteCheck.canDelete) {
        toast?.showError(deleteCheck.message || 'Cannot delete this item');
        return;
      }
      
      // Set additional info for the modal
      setDeleteModal({ 
        open: true, 
        item, 
        message: deleteCheck.message,
        hasChildren: deleteCheck.hasChildren || false
      });
    } else {
      setDeleteModal({ open: true, item });
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.item) return;
    
    setDeletingItem(deleteModal.item.id);
    try {
      await onDelete(deleteModal.item);
      toast?.showSuccess(`${title.slice(0, -1)} deleted successfully`);
    } catch (error) {
      toast?.showError(`Failed to delete ${title.toLowerCase().slice(0, -1)}: ${error.message}`);
    } finally {
      setDeletingItem(null);
      setDeleteModal({ open: false, item: null });
    }
  };

  const exportToCSV = () => {
    // Include all available fields for comprehensive export
    const allFields = new Set();
    sortedData.forEach(item => {
      Object.keys(item).forEach(key => allFields.add(key));
    });
    
    // Combine visible columns with additional fields
    const exportColumns = [
      ...columns,
      ...Array.from(allFields)
        .filter(field => !columns.some(col => col.accessor === field || col.field === field))
        .map(field => ({ header: field, accessor: field }))
    ];
    
    const headers = exportColumns.map(col => col.header).join(',');
    const rows = sortedData.map(item => 
      exportColumns.map(col => {
        let value = col.accessor ? item[col.accessor] : item[col.field];
        
        // Handle rendered values for better export
        if (col.render && value !== undefined && value !== null) {
          try {
            const rendered = col.render(value, item);
            if (typeof rendered === 'string') {
              value = rendered;
            }
          } catch (e) {
            // Keep original value if render fails
          }
        }
        
        // Handle dates
        if (value && typeof value === 'object' && value.seconds) {
          value = new Date(value.seconds * 1000).toLocaleDateString('en-GB');
        }
        
        return `"${String(value || '').replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');
    
    // Add BOM for proper UTF-8 encoding (supports Arabic)
    const csv = '\uFEFF' + `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="smart-grid">
      {/* Quick Filters */}
      {quickFilters && quickFilters.buttons && quickFilters.buttons.length > 0 && (
        <div className="quick-filters" style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          padding: '12px',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}>
          {quickFilters.buttons.map(btn => (
            <button
              key={btn.key}
              type="button"
              onClick={() => quickFilters.onFilterChange(btn.key)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: quickFilters.active === btn.key ? '#667eea' : '#ffffff',
                color: quickFilters.active === btn.key ? '#ffffff' : '#333',
                cursor: 'pointer',
                fontWeight: quickFilters.active === btn.key ? '600' : '500',
                transition: 'all 0.2s ease',
                boxShadow: quickFilters.active === btn.key ? '0 2px 4px rgba(102,126,234,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {btn.label} {btn.count !== undefined && `(${btn.count})`}
            </button>
          ))}
        </div>
      )}
      
      <div className="smart-grid-header">
        <h3>{title}</h3>
        <div className="smart-grid-actions">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={exportToCSV} className="export-btn">
            📊 {t('export_csv')}
          </button>
          {allowAdd && onAdd && (
            <button onClick={onAdd} className="add-btn">
              ➕ Add New
            </button>
          )}
        </div>
      </div>

      <div className="smart-grid-table-container">
        <table className="smart-grid-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th 
                  key={index}
                  onClick={() => handleSort(col.accessor || col.field)}
                  className={`sortable ${sortField === (col.accessor || col.field) ? `sorted-${sortDirection}` : ''}`}
                >
                  {col.header}
                  {sortField === (col.accessor || col.field) && (
                    <span className="sort-indicator">
                      {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
              ))}
              {(allowEdit || allowDelete) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr key={item.docId || item.id || `${title}-${index}`}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex}>
                    {col.render ? 
                      col.render(item[col.accessor || col.field], item) : 
                      String(item[col.accessor || col.field] || '')
                    }
                  </td>
                ))}
                {(allowEdit || allowDelete) && (
                  <td className="actions-cell">
                    {allowEdit && onEdit && (
                      <button 
                        onClick={() => onEdit(item)}
                        className="edit-btn-small"
                      >
                        ✏️ {t('edit')}
                      </button>
                    )}
                    {allowDelete && onDelete && (
                      <button 
                        onClick={() => handleDeleteClick(item)}
                        className="delete-btn-small"
                        disabled={deletingItem === item.id}
                      >
                        {deletingItem === item.id ? '⏳' : '🗑️'} {t('delete')}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="smart-grid-pagination">
          <button 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages} ({sortedData.length} total items)
          </span>
          
          <button 
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}

      {sortedData.length === 0 && (
        <div className="no-data">
          {searchTerm ? `No results found for "${searchTerm}"` : `No ${title.toLowerCase()} available`}
        </div>
      )}
      <Modal
        open={deleteModal.open}
        title="Confirm Delete"
        onClose={() => setDeleteModal({ open: false, item: null })}
        actions={
          <>
            <button onClick={() => setDeleteModal({ open: false, item: null })} className="modal-btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="modal-btn-danger" disabled={deletingItem}>
              {deletingItem ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete this {title.toLowerCase().slice(0, -1)}?</p>
        {deleteModal.message && (
          <p className="delete-warning">{deleteModal.message}</p>
        )}
        <p><strong>This action cannot be undone.</strong></p>
      </Modal>
    </div>
  );
};

export default SmartGrid;
