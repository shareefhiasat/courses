/**
 * AllowlistManager - A reusable component for managing allowlists
 * Supports both vanilla JS and can be adapted for React/Storybook
 * Uses Tailwind CSS classes
 */

export class AllowlistManager {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      pageSize: 50,
      showBulkActions: true,
      showImport: true,
      onSave: null,
      ...options
    };
    this.state = {
      data: [],
      filteredData: [],
      selected: new Set(),
      page: 1,
      search: '',
      roleFilter: 'all',
      isLoading: false
    };
  }

  // Main render method
  render() {
    this.container.innerHTML = `
      <div class="space-y-4">
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          ${this.renderStatCard('Total', 'stat-total', 'text-gray-900')}
          ${this.renderStatCard('Students', 'stat-students', 'text-blue-600')}
          ${this.renderStatCard('Admins', 'stat-admins', 'text-green-600')}
          ${this.renderStatCard('Invalid', 'stat-invalid', 'text-red-600')}
        </div>

        <!-- Input Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          ${this.renderQuickAdd()}
          ${this.renderBulkAdd()}
        </div>

        ${this.options.showImport ? this.renderCSVImport() : ''}

        <!-- Controls -->
        ${this.renderControls()}

        <!-- Table -->
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          ${this.renderTable()}
        </div>

        <!-- Pagination -->
        ${this.renderPagination()}

        <!-- Messages -->
        <div id="allowlist-msg" class="text-sm mt-2"></div>
      </div>
    `;

    this.attachEventListeners();
    this.loadData();
  }

  renderStatCard(label, id, colorClass) {
    return `
      <div class="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
        <div class="text-xs text-gray-500">${label}</div>
        <div class="text-2xl font-bold ${colorClass}" id="${id}">0</div>
      </div>
    `;
  }

  renderQuickAdd() {
    return `
      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h3 class="text-sm font-semibold mb-3">Quick Add</h3>
        <div class="space-y-2">
          <input type="email" id="quick-email" placeholder="email@example.com" 
                 class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select id="quick-role" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="allowed">Student</option>
            <option value="admin">Admin</option>
          </select>
          <button id="quick-add-btn" 
                  class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium">
            Add Single
          </button>
        </div>
      </div>
    `;
  }

  renderBulkAdd() {
    return `
      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h3 class="text-sm font-semibold mb-3">Bulk Add</h3>
        <div class="space-y-2">
          <textarea id="bulk-input" rows="4" placeholder="Paste emails (comma or newline separated)"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          <div class="flex gap-2">
            <select id="bulk-role" 
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="allowed">Students</option>
              <option value="admin">Admins</option>
            </select>
            <button id="bulk-add-btn" 
                    class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium">
              Add Multiple
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderCSVImport() {
    return `
      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h3 class="text-sm font-semibold mb-2">CSV Import</h3>
        <div class="flex gap-2 items-center">
          <input type="file" id="csv-file" accept=".csv" 
                 class="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          <button id="import-csv-btn" 
                  class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors font-medium">
            Import
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-1">CSV format: email,role (role: "student" or "admin")</p>
      </div>
    `;
  }

  renderControls() {
    return `
      <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div class="flex flex-wrap gap-2 items-center justify-between">
          <div class="flex flex-wrap gap-2 flex-1">
            <input type="text" id="allowlist-search" placeholder="Search email..." 
                   class="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select id="allowlist-role-filter" 
                    class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Roles</option>
              <option value="allowed">Students</option>
              <option value="admin">Admins</option>
            </select>
            <button id="refresh-allowlist" 
                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium">
              Refresh
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <button id="select-all" 
                    class="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium">
              Select All
            </button>
            <button id="deselect-all" 
                    class="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium">
              Deselect
            </button>
            <button id="delete-selected" 
                    class="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium">
              Delete
            </button>
            <button id="export-csv" 
                    class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium">
              Export
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderTable() {
    return `
      <div class="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <input type="checkbox" id="select-all-table" class="rounded border-gray-300" />
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Role</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Actions</th>
            </tr>
          </thead>
          <tbody id="allowlist-tbody" class="bg-white divide-y divide-gray-200">
            <!-- Populated by JS -->
          </tbody>
        </table>
      </div>
    `;
  }

  renderPagination() {
    return `
      <div class="flex justify-center gap-2 items-center mt-4">
        <button id="allowlist-prev" 
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium">
          Previous
        </button>
        <span id="allowlist-page" class="text-sm text-gray-600">Page 1 of 1</span>
        <button id="allowlist-next" 
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium">
          Next
        </button>
      </div>
    `;
  }

  // Event listeners
  attachEventListeners() {
    // Quick add
    const quickAddBtn = this.container.querySelector('#quick-add-btn');
    if (quickAddBtn) {
      quickAddBtn.addEventListener('click', () => this.handleQuickAdd());
    }

    // Bulk add
    const bulkAddBtn = this.container.querySelector('#bulk-add-btn');
    if (bulkAddBtn) {
      bulkAddBtn.addEventListener('click', () => this.handleBulkAdd());
    }

    // CSV import
    const importBtn = this.container.querySelector('#import-csv-btn');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.handleCSVImport());
    }

    // Refresh
    const refreshBtn = this.container.querySelector('#refresh-allowlist');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadData());
    }

    // Search and filter
    const searchInput = this.container.querySelector('#allowlist-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.search = e.target.value;
        this.state.page = 1;
        this.renderTableBody();
      });
    }

    const roleFilter = this.container.querySelector('#allowlist-role-filter');
    if (roleFilter) {
      roleFilter.addEventListener('change', (e) => {
        this.state.roleFilter = e.target.value;
        this.state.page = 1;
        this.renderTableBody();
      });
    }

    // Bulk actions
    const selectAllBtn = this.container.querySelector('#select-all');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => this.selectAll(true));
    }

    const deselectAllBtn = this.container.querySelector('#deselect-all');
    if (deselectAllBtn) {
      deselectAllBtn.addEventListener('click', () => this.selectAll(false));
    }

    const deleteSelectedBtn = this.container.querySelector('#delete-selected');
    if (deleteSelectedBtn) {
      deleteSelectedBtn.addEventListener('click', () => this.handleDeleteSelected());
    }

    const exportBtn = this.container.querySelector('#export-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExportCSV());
    }

    // Pagination
    const prevBtn = this.container.querySelector('#allowlist-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.changePage(-1));
    }

    const nextBtn = this.container.querySelector('#allowlist-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.changePage(1));
    }

    // Table select all
    const tableSelectAll = this.container.querySelector('#select-all-table');
    if (tableSelectAll) {
      tableSelectAll.addEventListener('change', (e) => {
        this.selectAll(e.target.checked);
      });
    }
  }

  // Data methods
  async loadData() {
    this.setLoading(true);
    try {
      // If options provide data, use it
      if (this.options.data) {
        this.state.data = this.options.data;
      } else if (this.options.loadData) {
        // Use custom load function
        this.state.data = await this.options.loadData();
      } else {
        // Default: try to load from Firebase (for dashboard integration)
        if (this.options.getAllowlistConfig) {
          const config = await this.options.getAllowlistConfig();
          if (config.success && config.data) {
            this.state.data = [
              ...(config.data.allowedEmails || []).map(email => ({ email, role: 'allowed' })),
              ...(config.data.adminEmails || []).map(email => ({ email, role: 'admin' }))
            ];
          }
        }
      }
      
      this.state.page = 1;
      this.state.selected.clear();
      this.updateStats();
      this.renderTableBody();
      this.showMessage('Loaded successfully', 'success');
    } catch (error) {
      this.showMessage('Failed to load data', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  // Validation
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  }

  // Quick add handler
  handleQuickAdd() {
    const emailInput = this.container.querySelector('#quick-email');
    const roleSelect = this.container.querySelector('#quick-role');
    
    if (!emailInput || !roleSelect) return;
    
    const email = emailInput.value.trim();
    const role = roleSelect.value;
    
    if (!this.validateEmail(email)) {
      this.showMessage('Invalid email format', 'error');
      return;
    }
    
    if (this.state.data.some(item => item.email === email)) {
      this.showMessage('Email already exists', 'error');
      return;
    }
    
    this.state.data.push({ email, role });
    emailInput.value = '';
    
    this.updateStats();
    this.renderTableBody();
    this.showMessage('Added successfully', 'success');
  }

  // Bulk add handler
  handleBulkAdd() {
    const input = this.container.querySelector('#bulk-input');
    const roleSelect = this.container.querySelector('#bulk-role');
    
    if (!input || !roleSelect) return;
    
    const rawInput = input.value;
    const role = roleSelect.value;
    
    if (!rawInput.trim()) {
      this.showMessage('Please enter emails', 'error');
      return;
    }
    
    const emails = rawInput.split(/[,\n]/).map(e => e.trim()).filter(e => e);
    const valid = [];
    const invalid = [];
    const duplicates = [];
    
    emails.forEach(email => {
      if (!this.validateEmail(email)) {
        invalid.push(email);
      } else if (this.state.data.some(item => item.email === email)) {
        duplicates.push(email);
      } else {
        valid.push(email);
      }
    });
    
    valid.forEach(email => this.state.data.push({ email, role }));
    input.value = '';
    
    this.updateStats();
    this.renderTableBody();
    
    let msg = `Added ${valid.length} emails`;
    if (invalid.length > 0) msg += `, ${invalid.length} invalid`;
    if (duplicates.length > 0) msg += `, ${duplicates.length} duplicates`;
    this.showMessage(msg, invalid.length > 0 ? 'warning' : 'success');
  }

  // CSV import handler
  handleCSVImport() {
    const fileInput = this.container.querySelector('#csv-file');
    if (!fileInput || !fileInput.files[0]) {
      this.showMessage('Please select a CSV file', 'error');
      return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        let valid = 0, invalid = 0, duplicates = 0;
        const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim());
          if (parts.length < 1) continue;
          
          const email = parts[0];
          const role = parts[1] && parts[1].toLowerCase().includes('admin') ? 'admin' : 'allowed';
          
          if (!this.validateEmail(email)) {
            invalid++;
            continue;
          }
          
          if (this.state.data.some(item => item.email === email)) {
            duplicates++;
            continue;
          }
          
          this.state.data.push({ email, role });
          valid++;
        }
        
        this.updateStats();
        this.renderTableBody();
        
        let msg = `Imported ${valid} emails`;
        if (invalid > 0) msg += `, ${invalid} invalid`;
        if (duplicates > 0) msg += `, ${duplicates} duplicates`;
        this.showMessage(msg, invalid > 0 ? 'warning' : 'success');
        
        fileInput.value = '';
      } catch (error) {
        this.showMessage('Failed to parse CSV file', 'error');
      }
    };
    
    reader.readAsText(file);
  }

  // Delete selected handler
  handleDeleteSelected() {
    if (this.state.selected.size === 0) {
      this.showMessage('No emails selected', 'error');
      return;
    }
    
    if (!confirm(`Delete ${this.state.selected.size} selected email(s)?`)) {
      return;
    }
    
    this.state.data = this.state.data.filter(item => !this.state.selected.has(item.email));
    this.state.selected.clear();
    
    this.updateStats();
    this.renderTableBody();
    this.showMessage('Deleted selected emails', 'success');
  }

  // Export CSV handler
  handleExportCSV() {
    const dataToExport = this.state.selected.size > 0 
      ? this.state.data.filter(item => this.state.selected.has(item.email))
      : this.state.data;
    
    if (dataToExport.length === 0) {
      this.showMessage('No data to export', 'error');
      return;
    }
    
    const csv = 'email,role\n' + dataToExport.map(item => `${item.email},${item.role}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `allowlist_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.showMessage(`Exported ${dataToExport.length} emails`, 'success');
  }

  // Select all handler
  selectAll(checked) {
    const filtered = this.getFilteredData();
    const pageData = this.getPageData(filtered);
    
    if (checked) {
      pageData.forEach(item => this.state.selected.add(item.email));
    } else {
      pageData.forEach(item => this.state.selected.delete(item.email));
    }
    
    this.renderTableBody();
  }

  // Pagination handler
  changePage(delta) {
    const filtered = this.getFilteredData();
    const totalPages = Math.ceil(filtered.length / this.options.pageSize);
    
    this.state.page = Math.max(1, Math.min(totalPages, this.state.page + delta));
    this.renderTableBody();
  }

  // Get filtered data
  getFilteredData() {
    return this.state.data.filter(item => {
      const matchesSearch = item.email.toLowerCase().includes(this.state.search.toLowerCase());
      const matchesRole = this.state.roleFilter === 'all' || item.role === this.state.roleFilter;
      return matchesSearch && matchesRole;
    });
  }

  // Get page data
  getPageData(filtered) {
    const start = (this.state.page - 1) * this.options.pageSize;
    const end = start + this.options.pageSize;
    return filtered.slice(start, end);
  }

  // Render table body
  renderTableBody() {
    const tbody = this.container.querySelector('#allowlist-tbody');
    if (!tbody) return;
    
    const filtered = this.getFilteredData();
    const pageData = this.getPageData(filtered);
    const totalPages = Math.ceil(filtered.length / this.options.pageSize);
    
    tbody.innerHTML = '';
    
    if (pageData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;opacity:0.6;">No emails found</td></tr>';
    } else {
      pageData.forEach(item => {
        const tr = document.createElement('tr');
        const isSelected = this.state.selected.has(item.email);
        
        tr.innerHTML = `
          <td class="px-4 py-3">
            <input type="checkbox" class="row-select rounded border-gray-300" data-email="${item.email}" ${isSelected ? 'checked' : ''} />
          </td>
          <td class="px-4 py-3 text-sm text-gray-900">${item.email}</td>
          <td class="px-4 py-3">
            <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${item.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
              ${item.role === 'admin' ? 'Admin' : 'Student'}
            </span>
          </td>
          <td class="px-4 py-3">
            <div class="flex gap-2">
              <button class="toggle-role px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-medium" data-email="${item.email}">
                Toggle
              </button>
              <button class="delete-email px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs font-medium" data-email="${item.email}">
                Delete
              </button>
            </div>
          </td>
        `;
        
        tbody.appendChild(tr);
      });
      
      // Add event listeners for row actions
      tbody.querySelectorAll('.row-select').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const email = e.target.getAttribute('data-email');
          if (e.target.checked) {
            this.state.selected.add(email);
          } else {
            this.state.selected.delete(email);
          }
        });
      });
      
      tbody.querySelectorAll('.toggle-role').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const email = e.target.getAttribute('data-email');
          const item = this.state.data.find(i => i.email === email);
          if (item) {
            item.role = item.role === 'admin' ? 'allowed' : 'admin';
            this.renderTableBody();
            this.showMessage(`Role changed for ${email}`, 'success');
          }
        });
      });
      
      tbody.querySelectorAll('.delete-email').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const email = e.target.getAttribute('data-email');
          if (confirm(`Delete ${email}?`)) {
            this.state.data = this.state.data.filter(item => item.email !== email);
            this.state.selected.delete(email);
            this.updateStats();
            this.renderTableBody();
            this.showMessage('Email deleted', 'success');
          }
        });
      });
    }
    
    // Update pagination
    const pageSpan = this.container.querySelector('#allowlist-page');
    if (pageSpan) {
      pageSpan.textContent = `Page ${this.state.page} of ${totalPages || 1}`;
    }
    
    // Update select all checkbox
    const selectAllCheckbox = this.container.querySelector('#select-all-table');
    if (selectAllCheckbox) {
      const allSelected = pageData.length > 0 && pageData.every(item => this.state.selected.has(item.email));
      selectAllCheckbox.checked = allSelected;
    }
    
    // Update pagination buttons
    const prevBtn = this.container.querySelector('#allowlist-prev');
    const nextBtn = this.container.querySelector('#allowlist-next');
    if (prevBtn) prevBtn.disabled = this.state.page === 1;
    if (nextBtn) nextBtn.disabled = this.state.page === totalPages || totalPages === 0;
  }

  // Update stats
  updateStats() {
    const total = this.state.data.length;
    const students = this.state.data.filter(item => item.role === 'allowed').length;
    const admins = this.state.data.filter(item => item.role === 'admin').length;
    const invalid = this.state.data.filter(item => !this.validateEmail(item.email)).length;
    
    const statTotal = this.container.querySelector('#stat-total');
    const statStudents = this.container.querySelector('#stat-students');
    const statAdmins = this.container.querySelector('#stat-admins');
    const statInvalid = this.container.querySelector('#stat-invalid');
    
    if (statTotal) statTotal.textContent = total;
    if (statStudents) statStudents.textContent = students;
    if (statAdmins) statAdmins.textContent = admins;
    if (statInvalid) statInvalid.textContent = invalid;
  }

  // Show message
  showMessage(text, type = 'info') {
    const msgEl = this.container.querySelector('#allowlist-msg');
    if (!msgEl) return;
    
    const colors = {
      error: 'text-red-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      info: 'text-blue-600'
    };
    
    msgEl.textContent = text;
    msgEl.className = `text-sm mt-2 ${colors[type] || colors.info}`;
    
    setTimeout(() => {
      if (msgEl.textContent === text) {
        msgEl.textContent = '';
      }
    }, 5000);
  }

  // Loading state
  setLoading(loading) {
    this.state.isLoading = loading;
    // Could add loading spinner here if needed
  }

  // Get current data (for saving)
  getData() {
    return [...this.state.data];
  }

  // Save handler (for dashboard integration)
  async handleSave() {
    if (this.options.onSave) {
      return await this.options.onSave(this.getData());
    }
    return { success: true };
  }
}

// Default export for vanilla JS usage
export default AllowlistManager;
