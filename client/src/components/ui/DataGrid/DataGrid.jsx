import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, Download } from 'lucide-react';
import styles from './DataGrid.module.css';

/**
 * DataGrid Component
 * 
 * Advanced data table with filtering, sorting, column pinning, and export.
 */
const DataGrid = ({
  columns = [],
  data = [],
  onSort,
  onFilter,
  onExport,
  selectable = false,
  onSelectionChange,
  pinnedColumns = [],
  pageSize = 10,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [filters, setFilters] = useState({});
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(row =>
        columns.some(col =>
          String(row[col.key]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        filtered = filtered.filter(row =>
          String(row[key]).toLowerCase().includes(filters[key].toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, sortConfig, filters, searchTerm, columns]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  const totalPages = Math.ceil(processedData.length / pageSize);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    if (onSort) onSort({ key, direction });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
      if (onSelectionChange) onSelectionChange([]);
    } else {
      const allIds = new Set(paginatedData.map((_, index) => index));
      setSelectedRows(allIds);
      if (onSelectionChange) onSelectionChange(Array.from(allIds));
    }
  };

  const handleSelectRow = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
    if (onSelectionChange) onSelectionChange(Array.from(newSelected));
  };

  const handleExport = () => {
    if (onExport) {
      onExport(processedData);
    } else {
      // Default CSV export
      const csv = [
        columns.map(col => col.label).join(','),
        ...processedData.map(row =>
          columns.map(col => row[col.key]).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.csv';
      a.click();
    }
  };

  return (
    <div className={`${styles.dataGrid} ${className}`}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button className={styles.exportButton} onClick={handleExport}>
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {selectable && (
                <th className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${styles.th} ${col.sortable ? styles.sortable : ''} ${
                    pinnedColumns.includes(col.key) ? styles.pinned : ''
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className={styles.thContent}>
                    {col.label}
                    {col.sortable && sortConfig.key === col.key && (
                      <span className={styles.sortIcon}>
                        {sortConfig.direction === 'asc' ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className={styles.loading}>
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className={styles.empty}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} className={styles.tr}>
                  {selectable && (
                    <td className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowIndex)}
                        onChange={() => handleSelectRow(rowIndex)}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`${styles.td} ${
                        pinnedColumns.includes(col.key) ? styles.pinned : ''
                      }`}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.paginationButton}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className={styles.paginationInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className={styles.paginationButton}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DataGrid;
