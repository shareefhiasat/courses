import { db, auth, onAuthChange, signIn, signOutUser, setGrade, getAllowlistConfig, setAllowlistConfig, upsertActivity, upsertResource, getPublicActivities, isAdmin, ensureAdminClaimRemote, upsertClass, getClasses, deleteClass, getEnrollments, enrollStudent, unenrollStudent, getAllSubmissions, updateSubmission, createAnnouncement, getAnnouncements } from '../../firebase-config.js';
import { collection, getDocs, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';
import { AllowlistManager } from './components/AllowlistManager.js';

(async function(){
  const row = document.getElementById('auth-row');
  const msg = document.getElementById('auth-msg');
  const mainCard = document.getElementById('main-card');
  const tbody = document.querySelector('#users-table tbody');
  const search = document.getElementById('search');
  const refreshBtn = document.getElementById('refresh');
  const saveActivityBtn = document.getElementById('save-activity');
  // Toast
  function toast(msg, type='info'){
    let host = document.getElementById('toast-host');
    if(!host){
      host = document.createElement('div');
      host.id = 'toast-host';
      Object.assign(host.style,{position:'fixed',top:'16px',right:'16px',zIndex:99999,display:'flex',flexDirection:'column',gap:'8px'});
      document.body.appendChild(host);
    }
    const t = document.createElement('div');
    t.textContent = String(msg||'');
    Object.assign(t.style,{background:type==='success'?'#198754':type==='error'?'#dc3545':'#0d6efd',color:'#fff',padding:'10px 14px',borderRadius:'8px',boxShadow:'0 6px 18px rgba(0,0,0,.2)',fontWeight:600});
    host.appendChild(t);
    setTimeout(()=> t.remove(), 3500);
  }
  const saveResourceBtn = document.getElementById('save-resource');
  
  let currentTab = 'users';
  
  // Tab switching
  function renderAdminDashboard() {
    const content = document.getElementById('admin-dashboard-content');
    content.innerHTML = `
      <div class="row" style="margin-bottom:16px;">
        <button class="btn-primary tab-btn" data-tab="users">Users</button>
        <button class="btn-primary tab-btn" data-tab="allowlist">Allowlist</button>
        <button class="btn-primary tab-btn" data-tab="activities">Activities</button>
        <button class="btn-primary tab-btn" data-tab="announcements">Announcements</button>
        <button class="btn-primary tab-btn" data-tab="classes">Classes</button>
        <button class="btn-primary tab-btn" data-tab="enrollments">Enrollments</button>
        <button class="btn-primary tab-btn" data-tab="submissions">Submissions</button>
      </div>
      <div id="tab-content-container"></div>
    `;

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    // Default to users tab
    switchTab('users');
  }

  function switchTab(tab) {
    // Toggle active class on tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });

    // Hide all tab-content divs
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
    });

    // Show the selected tab content
    const tabContent = document.getElementById(`${tab}-tab`);
    if (tabContent) {
      tabContent.style.display = 'block';
      
      // Special handling for allowlist tab
      if (tab === 'allowlist') {
        renderAllowlistTab();
      }
    }
  }

  function renderActivitiesTab(container) {
    container.innerHTML = `
      <h2>Activities Management</h2>
      <button id="add-activity-btn" class="btn-primary">Add New Activity</button>
      <div id="activities-list" style="margin-top: 16px;"></div>
    `;
    // Logic to load and display activities would go here
  }

  function renderAnnouncementsTab(container) {
    container.innerHTML = `
      <h2>Announcements Management</h2>
      <button id="add-announcement-btn" class="btn-primary">Add New Announcement</button>
      <div id="announcements-list" style="margin-top: 16px;"></div>
    `;
    // Logic to load and display announcements would go here
  }

  function renderAllowlistTab(container) {
    // Create a wrapper div for the AllowlistManager
    const wrapper = document.createElement('div');
    wrapper.className = 'p-4';
    container.appendChild(wrapper);

    // Initialize the AllowlistManager
    const manager = new AllowlistManager(wrapper, {
      showImport: true,
      showBulkActions: true,
      getAllowlistConfig: getAllowlistConfig,
      onSave: async (data) => {
        // Convert data back to Firebase format
        const allowedEmails = data.filter(item => item.role === 'allowed').map(item => item.email);
        const adminEmails = data.filter(item => item.role === 'admin').map(item => item.email);
        
        const res = await setAllowlistConfig({ allowedEmails, adminEmails });
        if (res.success) {
          toast('Allowlist saved successfully', 'success');
          return { success: true };
        } else {
          toast('Failed to save: ' + res.error, 'error');
          return { success: false, error: res.error };
        }
      }
    });

    // Render the component
    manager.render();
  }

  // ===== Activities List (filters, sorting, pagination) =====
  const tbl = document.getElementById('acts-table');
  const tb = tbl?.querySelector('tbody');
  const fltSearch = document.getElementById('flt-search');
  const fltCourse = document.getElementById('flt-course');
  const fltType = document.getElementById('flt-type');
  const fltDiff = document.getElementById('flt-diff');
  const fltSort = document.getElementById('flt-sort');
  const btnPrev = document.getElementById('acts-prev');
  const btnNext = document.getElementById('acts-next');
  const pageLbl = document.getElementById('acts-page');
  const PAGE_SIZE = 10;
  let actsCache = [];
  let page = 1;

  async function reloadActivitiesList(){
    try{
      const res = await getPublicActivities();
      actsCache = res.success ? (res.items || []) : [];
      page = 1;
      renderActs();
    }catch{ actsCache = []; renderActs(); }
  }

  function filteredSorted(){
    const q = (fltSearch?.value || '').toLowerCase();
    const c = (fltCourse?.value || '').toLowerCase();
    const t = (fltType?.value || '').toLowerCase();
    const d = (fltDiff?.value || '').toLowerCase();
    const sortKey = (fltSort?.value || 'order');

    let arr = actsCache.filter(a => {
      const text = `${a.id||''} ${a.title_en||''} ${a.url||''}`.toLowerCase();
      if (q && !text.includes(q)) return false;
      if (c && (a.course||'').toLowerCase() !== c) return false;
      if (t && (a.type||'').toLowerCase() !== t) return false;
      if (d && (a.difficulty||'').toLowerCase() !== d) return false;
      return true;
    });

    arr.sort((x,y)=>{
      const ax = (x[sortKey] ?? '').toString().toLowerCase();
      const ay = (y[sortKey] ?? '').toString().toLowerCase();
      if (sortKey==='order') return (x.order||0) - (y.order||0);
      return ax.localeCompare(ay);
    });
    return arr;
  }

  function renderActs(){
    if (!tb) return;
    tb.innerHTML = '';
    const arr = filteredSorted();
    const totalPages = Math.max(1, Math.ceil(arr.length / PAGE_SIZE));
    page = Math.min(page, totalPages);
    const slice = arr.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

    slice.forEach(a => {
      const tr = document.createElement('tr');
      const due = a.dueDate ? new Date(a.dueDate).toLocaleString() : '';
      tr.innerHTML = `
        <td>${a.id||''}</td>
        <td>${a.title_en||''}</td>
        <td>${a.course||''}</td>
        <td>${a.type||''}</td>
        <td>${a.difficulty||''}</td>
        <td>${a.order||0}</td>
        <td>${due}</td>
        <td>
          <button class="btn-primary btn-sm" data-act="edit" data-id="${a.id||''}">Edit</button>
        </td>`;
      tb.appendChild(tr);
    });

    pageLbl && (pageLbl.textContent = `${page}/${Math.max(1, Math.ceil(arr.length / PAGE_SIZE))}`);
  }

  fltSearch?.addEventListener('input', ()=>{ page=1; renderActs(); });
  ;[fltCourse, fltType, fltDiff, fltSort].forEach(el=> el?.addEventListener('change', ()=>{ page=1; renderActs(); }));
  btnPrev?.addEventListener('click', ()=>{ if (page>1){ page--; renderActs(); }});
  btnNext?.addEventListener('click', ()=>{ page++; renderActs(); });
  tb?.addEventListener('click', (e)=>{
    const b = e.target.closest('button[data-act="edit"]');
    if (!b) return;
    const id = b.getAttribute('data-id');
    if (id) {
      document.getElementById('act-id').value = id;
      toast(`Loaded ID into editor: ${id}`, 'success');
    }
  });

  // Duplicate current fields to a new ID
  const dupBtn = document.getElementById('duplicate-activity');
  dupBtn?.addEventListener('click', ()=>{
    const idEl = document.getElementById('act-id');
    if (!idEl.value.trim()) { toast('Load or enter an ID first, then change it to new one.', 'error'); return; }
    idEl.value = `${idEl.value.trim()}-copy`;
    toast('ID changed. Edit fields as needed and click Save.', 'success');
  });

  // initial list fetch when Activities tab is shown
  const actTabObserver = new MutationObserver(()=>{
    const vis = document.getElementById('activities-tab').style.display !== 'none';
    if (vis && actsCache.length===0) reloadActivitiesList();
  });
  const actTab = document.getElementById('activities-tab');
  if (actTab) actTabObserver.observe(actTab, { attributes:true, attributeFilter:['style'] });

  // ===== Activity Tracking Tab =====
  const trackTable = document.getElementById('tracking-table');
  const trackTbody = trackTable?.querySelector('tbody');
  const trackActivity = document.getElementById('track-activity');
  const trackStatus = document.getElementById('track-status');
  const trackRefresh = document.getElementById('track-refresh');
  let trackingData = [];

  async function loadActivityTracking() {
    try {
      // Load all users and activities
      const [usersSnap, activitiesRes] = await Promise.all([
        getDocs(collection(db, 'users')),
        getPublicActivities()
      ]);
      
      const users = [];
      usersSnap.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });
      
      const activities = activitiesRes.success ? activitiesRes.items : [];
      
      // Populate activity dropdown
      if (trackActivity) {
        trackActivity.innerHTML = '<option value="">All Activities</option>';
        activities.forEach(act => {
          const option = document.createElement('option');
          option.value = act.id;
          option.textContent = `${act.id} - ${act.title_en || act.id}`;
          trackActivity.appendChild(option);
        });
      }
      
      // Build tracking data
      trackingData = [];
      users.forEach(user => {
        const progress = user.progress || {};
        activities.forEach(activity => {
          const actProgress = progress[activity.id];
          trackingData.push({
            userId: user.id,
            userEmail: user.email || user.id,
            activityId: activity.id,
            activityTitle: activity.title_en || activity.id,
            completed: !!actProgress?.completed,
            attempts: actProgress?.attempts || 0,
            grade: actProgress?.grade,
            maxScore: actProgress?.maxScore,
            completedAt: actProgress?.completedAt,
            reviewedAt: actProgress?.reviewedAt
          });
        });
      });
      
      renderActivityTracking();
    } catch (error) {
      console.error('Error loading activity tracking:', error);
      toast('Failed to load tracking data', 'error');
    }
  }

  function renderActivityTracking() {
    if (!trackTbody) return;
    
    const activityFilter = trackActivity?.value || '';
    const statusFilter = trackStatus?.value || '';
    
    const filtered = trackingData.filter(item => {
      if (activityFilter && item.activityId !== activityFilter) return false;
      
      if (statusFilter === 'completed' && !item.completed) return false;
      if (statusFilter === 'pending' && item.completed) return false;
      if (statusFilter === 'graded' && (item.grade === undefined || item.grade === null)) return false;
      
      return true;
    });
    
    trackTbody.innerHTML = '';
    
    filtered.forEach(item => {
      const tr = document.createElement('tr');
      const completedText = item.completed ? 
        new Date(item.completedAt?.seconds ? item.completedAt.seconds * 1000 : item.completedAt).toLocaleDateString() : 
        'Not completed';
      
      const gradeText = item.grade !== undefined ? 
        `${item.grade}/${item.maxScore || '?'}` : 
        'Not graded';
      
      const status = item.completed ? 
        (item.grade !== undefined ? 'Graded' : 'Completed') : 
        'Pending';
      
      tr.innerHTML = `
        <td>${item.userEmail}</td>
        <td>${item.activityTitle}</td>
        <td><span class="badge">${status}</span></td>
        <td>${completedText}</td>
        <td>${item.attempts}</td>
        <td>${gradeText}</td>
        <td>
          <button class="btn-primary btn-sm" onclick="openUserModal('${item.userId}')">View Details</button>
        </td>
      `;
      
      trackTbody.appendChild(tr);
    });
    
    if (filtered.length === 0) {
      trackTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;opacity:0.6;padding:40px;">No data found matching your filters.</td></tr>';
    }
  }

  // Make openUserModal global for onclick
  window.openUserModal = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        showUserModal(userId, userDoc.data());
      }
    } catch (error) {
      toast('Failed to load user details', 'error');
    }
  };

  trackActivity?.addEventListener('change', renderActivityTracking);
  trackStatus?.addEventListener('change', renderActivityTracking);
  trackRefresh?.addEventListener('click', loadActivityTracking);

  // Load tracking data when tab is shown
  const trackTabObserver = new MutationObserver(()=>{
    const vis = document.getElementById('tracking-tab').style.display !== 'none';
    if (vis && trackingData.length === 0) loadActivityTracking();
  });
  const trackTab = document.getElementById('tracking-tab');
  if (trackTab) trackTabObserver.observe(trackTab, { attributes:true, attributeFilter:['style'] });

  // ===== Class Management Tab =====
  const classIdInput = document.getElementById('class-id');
  const classNameInput = document.getElementById('class-name');
  const classDescInput = document.getElementById('class-desc');
  const saveClassBtn = document.getElementById('save-class');
  const clearClassFormBtn = document.getElementById('clear-class-form');
  const classesTbody = document.querySelector('#classes-table tbody');

  async function loadClasses() {
    if (!classesTbody) return;
    const res = await getClasses();
    classesTbody.innerHTML = '';
    if (res.success) {
      res.classes.forEach(cls => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${cls.id}</td>
          <td>${cls.name}</td>
          <td>
            <button class="btn-secondary btn-sm" data-action="edit-class" data-id="${cls.id}">Edit</button>
            <button class="btn-danger btn-sm" data-action="delete-class" data-id="${cls.id}">Delete</button>
          </td>
        `;
        classesTbody.appendChild(tr);
      });
    } else {
      toast(res.error || 'Failed to load classes', 'error');
    }
  }

  saveClassBtn?.addEventListener('click', async () => {
    const classData = {
      id: classIdInput.value.trim(),
      name: classNameInput.value.trim(),
      description: classDescInput.value.trim(),
    };
    if (!classData.id || !classData.name) {
      toast('Class ID and Name are required.', 'error');
      return;
    }
    const res = await upsertClass(classData);
    if (res.success) {
      toast('Class saved successfully.', 'success');
      clearClassForm();
      loadClasses();
    } else {
      toast(res.error || 'Failed to save class.', 'error');
    }
  });

  function clearClassForm() {
    classIdInput.value = '';
    classNameInput.value = '';
    classDescInput.value = '';
    classIdInput.disabled = false;
  }

  clearClassFormBtn?.addEventListener('click', clearClassForm);

  classesTbody?.addEventListener('click', async (e) => {
    const target = e.target;
    const action = target.dataset.action;
    const id = target.dataset.id;

    if (action === 'edit-class') {
      const res = await getClasses();
      const cls = res.classes.find(c => c.id === id);
      if (cls) {
        classIdInput.value = cls.id;
        classNameInput.value = cls.name || '';
        classDescInput.value = cls.description || '';
        classIdInput.disabled = true; // Prevent changing ID of existing class
        toast(`Editing class: ${id}`, 'info');
      }
    } else if (action === 'delete-class') {
      if (confirm(`Are you sure you want to delete class ${id}? This cannot be undone.`)) {
        const res = await deleteClass(id);
        if (res.success) {
          toast('Class deleted.', 'success');
          loadClasses();
        } else {
          toast(res.error || 'Failed to delete class.', 'error');
        }
      }
    }
  });

  const classTabObserver = new MutationObserver(()=>{
    const vis = document.getElementById('classes-tab').style.display !== 'none';
    if (vis) loadClasses();
  });
  const classTab = document.getElementById('classes-tab');
  if (classTab) classTabObserver.observe(classTab, { attributes:true, attributeFilter:['style'] });

  // ===== Enrollment Management Tab =====
  const enrollClassSelect = document.getElementById('enroll-class-select');
  const enrolledList = document.getElementById('enrolled-students-list');
  const availableList = document.getElementById('available-students-list');
  let allUsersCache = [];

  async function loadEnrollmentTab() {
    // Populate classes dropdown
    const classesRes = await getClasses();
    if (classesRes.success) {
      enrollClassSelect.innerHTML = '<option value="">-- Select a Class --</option>';
      classesRes.classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.name;
        enrollClassSelect.appendChild(option);
      });
    }

    // Cache all users
    const usersSnap = await getDocs(collection(db, 'users'));
    allUsersCache = [];
    usersSnap.forEach(doc => {
      allUsersCache.push({ id: doc.id, ...doc.data() });
    });

    // Initial render
    renderEnrollmentLists();
  }

  async function renderEnrollmentLists() {
    const classId = enrollClassSelect.value;
    if (!enrolledList || !availableList) return;

    enrolledList.innerHTML = 'Loading...';
    availableList.innerHTML = 'Loading...';

    if (!classId) {
      enrolledList.innerHTML = '<p>Select a class to see enrolled students.</p>';
      availableList.innerHTML = '<p>Select a class to see available students.</p>';
      return;
    }

    const enrollmentsRes = await getEnrollments(classId);
    if (!enrollmentsRes.success) {
      toast('Failed to load enrollments', 'error');
      return;
    }

    const enrolledUserIds = new Set(enrollmentsRes.enrollments.map(e => e.userId));

    enrolledList.innerHTML = '';
    availableList.innerHTML = '';

    enrollmentsRes.enrollments.forEach(enrollment => {
      const userDiv = document.createElement('div');
      userDiv.innerHTML = `
        <span>${enrollment.userEmail}</span>
        <button class="btn-danger btn-sm" data-action="unenroll" data-id="${enrollment.id}" style="float:right;">Unenroll</button>
      `;
      enrolledList.appendChild(userDiv);
    });

    allUsersCache.forEach(user => {
      if (!enrolledUserIds.has(user.id)) {
        const userDiv = document.createElement('div');
        userDiv.innerHTML = `
          <span>${user.email}</span>
          <button class="btn-primary btn-sm" data-action="enroll" data-userid="${user.id}" data-email="${user.email}" style="float:right;">Enroll</button>
        `;
        availableList.appendChild(userDiv);
      }
    });
  }

  enrollClassSelect?.addEventListener('change', renderEnrollmentLists);

  enrolledList?.addEventListener('click', async (e) => {
    if (e.target.dataset.action === 'unenroll') {
      const enrollmentId = e.target.dataset.id;
      const res = await unenrollStudent(enrollmentId);
      if (res.success) {
        toast('Student unenrolled.', 'success');
        renderEnrollmentLists();
      } else {
        toast(res.error || 'Failed to unenroll.', 'error');
      }
    }
  });

  availableList?.addEventListener('click', async (e) => {
    if (e.target.dataset.action === 'enroll') {
      const classId = enrollClassSelect.value;
      const userId = e.target.dataset.userid;
      const userEmail = e.target.dataset.email;
      const res = await enrollStudent(classId, userId, userEmail);
      if (res.success) {
        toast('Student enrolled.', 'success');
        renderEnrollmentLists();
      } else {
        toast(res.error || 'Failed to enroll.', 'error');
      }
    }
  });

  const enrollmentTabObserver = new MutationObserver(()=>{
    const vis = document.getElementById('enrollments-tab').style.display !== 'none';
    if (vis) loadEnrollmentTab();
  });
  const enrollmentTab = document.getElementById('enrollments-tab');
  if (enrollmentTab) enrollmentTabObserver.observe(enrollmentTab, { attributes:true, attributeFilter:['style'] });

  // ===== Submissions Review Tab =====
  const subClassFilter = document.getElementById('sub-class-filter');
  const subActivityFilter = document.getElementById('sub-activity-filter');
  const subStatusFilter = document.getElementById('sub-status-filter');
  const submissionsTbody = document.querySelector('#submissions-table tbody');
  let allSubmissionsCache = [];

  async function loadSubmissionsTab() {
    const [classesRes, activitiesRes, submissionsRes] = await Promise.all([
      getClasses(),
      getPublicActivities(),
      getAllSubmissions()
    ]);

    if (classesRes.success) {
      subClassFilter.innerHTML = '<option value="">All Classes</option>';
      classesRes.classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.name;
        subClassFilter.appendChild(option);
      });
    }

    if (activitiesRes.success) {
      subActivityFilter.innerHTML = '<option value="">All Activities</option>';
      activitiesRes.items.forEach(act => {
        const option = document.createElement('option');
        option.value = act.id;
        option.textContent = act.title_en || act.id;
        subActivityFilter.appendChild(option);
      });
    }

    allSubmissionsCache = submissionsRes.success ? submissionsRes.submissions : [];
    renderSubmissions();
  }

  function renderSubmissions() {
    if (!submissionsTbody) return;

    const classFilter = subClassFilter.value;
    const activityFilter = subActivityFilter.value;
    const statusFilter = subStatusFilter.value;

    // This is a client-side filter. For large datasets, this should be moved server-side.
    const filtered = allSubmissionsCache.filter(sub => {
      if (activityFilter && sub.activityId !== activityFilter) return false;
      if (statusFilter === 'pending' && sub.grade !== undefined) return false;
      if (statusFilter === 'graded' && sub.grade === undefined) return false;
      // Class filter requires a join, which is complex on client. Deferring for now.
      return true;
    });

    submissionsTbody.innerHTML = '';
    filtered.forEach(sub => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${sub.userEmail}</td>
        <td>${sub.activityId}</td>
        <td>${new Date(sub.submittedAt.seconds * 1000).toLocaleString()}</td>
        <td><a href="${sub.fileURL}" target="_blank">${sub.fileName}</a></td>
        <td>
          <input type="number" id="grade-${sub.id}" value="${sub.grade || ''}" placeholder="N/A" style="width: 60px;">
          / <input type="number" id="max-score-${sub.id}" value="${sub.maxScore || '100'}" style="width: 60px;">
        </td>
        <td>
          <button class="btn-primary btn-sm" data-action="save-grade" data-id="${sub.id}">Save</button>
          <button class="btn-secondary btn-sm" data-action="mark-reviewed" data-id="${sub.id}">${sub.reviewedAt ? 'Reviewed' : 'Mark Reviewed'}</button>
        </td>
      `;
      submissionsTbody.appendChild(tr);
    });
  }

  [subClassFilter, subActivityFilter, subStatusFilter].forEach(el => el?.addEventListener('change', renderSubmissions));

  submissionsTbody?.addEventListener('click', async (e) => {
    const action = e.target.dataset.action;
    const submissionId = e.target.dataset.id;
    if (!action || !submissionId) return;

    if (action === 'save-grade') {
      const grade = document.getElementById(`grade-${submissionId}`).value;
      const maxScore = document.getElementById(`max-score-${submissionId}`).value;
      const res = await updateSubmission(submissionId, { 
        grade: Number(grade),
        maxScore: Number(maxScore)
      });
      toast(res.success ? 'Grade saved.' : 'Failed to save grade.', res.success ? 'success' : 'error');
    } else if (action === 'mark-reviewed') {
      const res = await updateSubmission(submissionId, { reviewedAt: new Date() });
      if (res.success) {
        toast('Marked as reviewed.', 'success');
        e.target.textContent = 'Reviewed';
        e.target.disabled = true;
      } else {
        toast('Failed to mark as reviewed.', 'error');
      }
    }
  });

  const submissionsTabObserver = new MutationObserver(()=>{
    const vis = document.getElementById('submissions-tab').style.display !== 'none';
    if (vis) loadSubmissionsTab();
  });
  const submissionsTab = document.getElementById('submissions-tab');
  if (submissionsTab) submissionsTabObserver.observe(submissionsTab, { attributes:true, attributeFilter:['style'] });

  // ===== Announcements Tab =====
  const annTitle = document.getElementById('ann-title');
  const annContent = document.getElementById('ann-content');
  const annTarget = document.getElementById('ann-target');
  const sendAnnBtn = document.getElementById('send-announcement');
  const recentAnnList = document.getElementById('recent-announcements-list');

  async function loadAnnouncementsTab() {
    // Populate target dropdown
    const classesRes = await getClasses();
    if (classesRes.success) {
      annTarget.innerHTML = '<option value="global">Global (All Users)</option>';
      classesRes.classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = `Class: ${cls.name}`;
        annTarget.appendChild(option);
      });
    }

    // Load recent announcements
    const annRes = await getAnnouncements();
    if (annRes.success) {
      recentAnnList.innerHTML = '';
      annRes.announcements.forEach(ann => {
        const item = document.createElement('div');
        item.innerHTML = `
          <strong>${ann.title}</strong> (Target: ${ann.target})
          <p>${ann.content}</p>
          <small>${new Date(ann.createdAt.seconds * 1000).toLocaleString()}</small>
          <hr>
        `;
        recentAnnList.appendChild(item);
      });
    }
  }

  sendAnnBtn?.addEventListener('click', async () => {
    const announcement = {
      title: annTitle.value.trim(),
      content: annContent.value.trim(),
      target: annTarget.value,
      author: auth.currentUser.email
    };

    if (!announcement.title || !announcement.content) {
      toast('Title and content are required.', 'error');
      return;
    }

    const res = await createAnnouncement(announcement);
    if (res.success) {
      toast('Announcement sent!', 'success');
      annTitle.value = '';
      annContent.value = '';
      loadAnnouncementsTab(); // Refresh list
    } else {
      toast(res.error || 'Failed to send announcement.', 'error');
    }
  });

  const announcementsTabObserver = new MutationObserver(()=>{
    const vis = document.getElementById('announcements-tab').style.display !== 'none';
    if (vis) loadAnnouncementsTab();
  });
  const announcementsTab = document.getElementById('announcements-tab');
  if (announcementsTab) announcementsTabObserver.observe(announcementsTab, { attributes:true, attributeFilter:['style'] });





  // Load existing activity data by ID
  const idInput = document.getElementById('act-id');
  if (idInput){
    const loadBtn = document.createElement('button');
    loadBtn.textContent = 'Load';
    loadBtn.className = 'btn-secondary';
    idInput.insertAdjacentElement('afterend', loadBtn);
    loadBtn.addEventListener('click', async ()=>{
      const id = idInput.value.trim();
      if (!id) { toast('Enter an activity ID to load', 'error'); return; }
      try {
        const res = await getPublicActivities();
        if (!res.success) throw new Error(res.error || 'Failed to fetch activities');
        const item = (res.items || []).find(a => a.id === id);
        if (!item) { toast('Not found', 'error'); return; }
        document.getElementById('act-course').value = item.course || 'python';
        document.getElementById('act-type').value = item.type || 'training';
        document.getElementById('act-difficulty').value = item.difficulty || 'beginner';
        document.getElementById('act-url').value = item.url || '';
        document.getElementById('act-image').value = item.image || '';
        document.getElementById('act-order').value = item.order || 0;
        document.getElementById('act-show').checked = !!item.show;
        document.getElementById('act-allowRetake').checked = !!item.allowRetake;
        document.getElementById('act-title-en').value = item.title_en || '';
        document.getElementById('act-title-ar').value = item.title_ar || '';
        document.getElementById('act-desc-en').value = item.description_en || '';
        document.getElementById('act-desc-ar').value = item.description_ar || '';
        if (item.dueDate){
          const d = new Date(item.dueDate);
          const fp = document.getElementById('act-due');
          if (fp && window.flatpickr){
            // format YYYY-MM-DD HH:mm
            const pad = n=> String(n).padStart(2,'0');
            const v = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
            fp._flatpickr ? fp._flatpickr.setDate(v) : (fp.value = v);
          }
        }
        toast('Activity loaded', 'success');
        switchTab('activities');
      } catch (e) {
        toast(e.message || 'Failed to load activity', 'error');
      }
    });
  }

  async function loadActivitiesEditor() {
    // Initialize Flatpickr once
    if (window.flatpickr && !document.getElementById('act-due')){
      const input = document.createElement('input');
      input.id = 'act-due';
      const anchor = document.getElementById('act-allowRetake');
      const parent = anchor?.closest('.row');
      if (parent) parent.insertBefore(input, anchor);
      flatpickr('#act-due', { enableTime:true, dateFormat:'Y-m-d H:i', time_24hr:true });
    }
  }

  function readActivityForm() {
    const dueRaw = (document.getElementById('act-due')?.value || '').trim();
    // Flatpickr returns 'YYYY-MM-DD HH:mm' by our format
    const dueValue = dueRaw ? `${dueRaw.replace(' ', 'T')}:00` : '';
    return {
      id: document.getElementById('act-id').value.trim(),
      course: document.getElementById('act-course').value,
      type: document.getElementById('act-type').value,
      difficulty: document.getElementById('act-difficulty').value,
      url: document.getElementById('act-url').value.trim(),
      image: document.getElementById('act-image').value.trim(),
      order: Number(document.getElementById('act-order').value || 0),
      dueDate: dueValue ? new Date(dueValue).toISOString() : null,
      show: document.getElementById('act-show').checked,
      allowRetake: document.getElementById('act-allowRetake').checked,
      title_en: document.getElementById('act-title-en').value,
      title_ar: document.getElementById('act-title-ar').value,
      description_en: document.getElementById('act-desc-en').value,
      description_ar: document.getElementById('act-desc-ar').value,
    };
  }

  saveActivityBtn?.addEventListener('click', async () => {
    const act = readActivityForm();
    if (!act.id) { document.getElementById('act-msg').textContent = 'id is required'; return; }
    const res = await upsertActivity(act);
    document.getElementById('act-msg').textContent = res.success ? 'Saved' : ('Failed: ' + res.error);
    toast(res.success ? 'Activity saved' : (res.error || 'Failed to save'), res.success ? 'success' : 'error');
  });

  function readResourceForm() {
    return {
      id: document.getElementById('res-id').value.trim(),
      title: document.getElementById('res-title').value.trim(),
      link: document.getElementById('res-link').value.trim(),
      order: Number(document.getElementById('res-order').value || 0),
      visible: document.getElementById('res-visible').checked,
      html: document.getElementById('res-html').value,
    };
  }

  saveResourceBtn?.addEventListener('click', async () => {
    const resObj = readResourceForm();
    if (!resObj.id) { document.getElementById('res-msg').textContent = 'id is required'; return; }
    const r = await upsertResource(resObj);
    document.getElementById('res-msg').textContent = r.success ? 'Saved' : ('Failed: ' + r.error);
    toast(r.success ? 'Resource saved' : (r.error || 'Failed to save resource'), r.success ? 'success' : 'error');
  });
  });
  

  function renderLoggedOut(){
    row.innerHTML = '';
    const email = el('input', {type:'email', placeholder:'Email', style:'min-width:220px;'});
    const password = el('input', {type:'password', placeholder:'Password', style:'min-width:140px;'});
    const loginBtn = el('button', {class:'btn-primary'}, 'Login');
    loginBtn.addEventListener('click', async ()=>{
      const res = await signIn(email.value.trim(), password.value);
      msg.textContent = res.success ? 'Logged in' : res.error;
    });
    row.append(email, password, loginBtn);
  }

  function renderLoggedIn(user){
    row.innerHTML = '';
    const welcome = el('span', {}, `Signed in as ${user.email}`);
    const logoutBtn = el('button', {class:'btn-danger'}, 'Logout');
    logoutBtn.addEventListener('click', ()=> signOutUser());
    row.append(welcome, logoutBtn);
  }

  function el(tag, attrs={}, ...children){
    const n=document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if(k==='class') n.className=v; else if(k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k,v);
    });
    children.forEach(c=> n.append(c instanceof Node ? c : document.createTextNode(c)));
    return n;
  }

  async function loadUsers(){
    tbody.innerHTML = '';
    try{
      const snap = await getDocs(collection(db,'users'));
      // Preload activities to show due dates map
      let actMap = {};
      try {
        const acts = await getPublicActivities();
        if (acts.success) {
          acts.items.forEach(a => { actMap[a.id] = a; });
        }
      } catch {}
      const items = [];
      snap.forEach(d=> items.push({ id:d.id, ...d.data() }));
      const q = (search.value||'').toLowerCase();
      items.filter(u=> u.email?.toLowerCase().includes(q)).forEach(u=>{
        const totals = computeTotals(u.progress || {});
        const tr = document.createElement('tr');
        const progressCount = u.progress ? Object.keys(u.progress).length : 0;
        tr.innerHTML = `
          <td>${u.email||''}</td>
          <td>${totals.scored}/${totals.outOf}</td>
          <td><span class="badge">${progressCount} items</span></td>
          <td><button data-id="${u.id}" class="btn-primary btn-view">View</button></td>
        `;
        tbody.appendChild(tr);
      });
      tbody.addEventListener('click', async (e)=>{
        const btn = e.target.closest('.btn-view');
        if(!btn) return;
        const id = btn.getAttribute('data-id');
        const userDoc = await getDoc(doc(db,'users',id));
        if(!userDoc.exists()) return;
        showUserModal(id, userDoc.data());
      });
    }catch(err){
      msg.textContent = 'Permission denied or rules not configured. See README/Firebase rules for admin access.';
    }
  }

  function computeTotals(progress) {
    let scored = 0;
    let outOf = 0;
    Object.values(progress || {}).forEach(p => {
      if (typeof p.grade === 'number' && typeof p.maxScore === 'number') {
        scored += p.grade;
        outOf += p.maxScore;
      }
    });
    return { scored, outOf };
  }

  function showUserModal(uid, data){
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000;';
    const box = document.createElement('div');
    box.style.cssText = 'background:#fff;border-radius:12px;padding:16px;max-width:800px;max-height:80vh;overflow:auto;';
    const title = el('h3',{}, `Progress for ${data.email}`);

    const table = el('table',{});
    const head = el('thead',{}, el('tr',{}, el('th',{},'Activity'), el('th',{},'Due Date'), el('th',{},'Completed'), el('th',{},'Attempts'), el('th',{},'Grade'), el('th',{},'Reviewed'), el('th',{},'Actions')));
    const body = el('tbody',{});
    table.append(head, body);

    const progress = data.progress || {};
    Object.entries(progress).forEach(([actId, p])=>{
      const tr = el('tr',{});
      const gradeCell = el('td',{});
      
      if (p.grade !== undefined) {
        gradeCell.textContent = `${p.grade}/${p.maxScore || '?'}`;
      } else {
        const gradeInput = el('input', {type:'number', placeholder:'Grade', style:'width:60px;margin-right:4px;'});
        const maxInput = el('input', {type:'number', placeholder:'Max', style:'width:50px;margin-right:4px;'});
        const setBtn = el('button', {class:'btn-primary', style:'font-size:0.8rem;padding:4px 8px;'}, 'Set');
        setBtn.addEventListener('click', async()=>{
          const grade = Number(gradeInput.value);
          const maxScore = Number(maxInput.value);
          if (isNaN(grade) || isNaN(maxScore)) return;
          const res = await setGrade(uid, actId, grade, maxScore);
          if (res.success) {
            gradeCell.innerHTML = '';
            gradeCell.textContent = `${grade}/${maxScore}`;
          } else {
            alert('Failed to set grade: ' + res.error);
          }
        });
        gradeCell.append(gradeInput, maxInput, setBtn);
      }
      
      // Get activity details for due date
      const activityDueDate = ''; // You'd fetch this from activities collection
      
      tr.append(
        el('td',{}, actId),
        el('td',{}, activityDueDate || 'No due date'),
        el('td',{}, p.completed ? new Date(p.completedAt.seconds? p.completedAt.seconds*1000 : p.completedAt).toLocaleString() : ''),
        el('td',{}, p.attempts || 0),
        gradeCell,
        el('td',{}, p.reviewedAt ? new Date(p.reviewedAt.seconds? p.reviewedAt.seconds*1000: p.reviewedAt).toLocaleDateString() : ''),
        el('td',{}, (()=>{ 
          const actions = el('div', {style:'display:flex;gap:4px;'});
          const reviewBtn = el('button',{class:'btn-primary', style:'font-size:0.8rem;padding:4px 8px;'},'Mark Reviewed'); 
          const dueDateBtn = el('button',{class:'btn-primary', style:'font-size:0.8rem;padding:4px 8px;'},'Set Due Date');
          
          reviewBtn.addEventListener('click', async()=>{
            try{
              const userRef = doc(db,'users',uid);
              const docSnap = await getDoc(userRef);
              const cur = docSnap.data();
              const newProg = cur.progress || {};
              newProg[actId] = Object.assign({}, newProg[actId], { reviewedAt: new Date() });
              await updateDoc(userRef, { progress: newProg });
              reviewBtn.textContent = 'Reviewed ✓';
            }catch(err){
              alert('Permission denied. Update Firestore rules to allow admin read/write.');
            }
          });
          
          dueDateBtn.addEventListener('click', ()=>{
            const newDate = prompt('Enter due date (YYYY-MM-DD HH:MM):');
            if(newDate) {
              // Here you'd update the activity's dueDate in Firestore
              alert('Due date feature: Update activity in Firestore activities collection');
            }
          });
          
          actions.append(reviewBtn, dueDateBtn);
          return actions;
        })())
      );
      body.appendChild(tr);
    });

    const closeBtn = el('button',{class:'btn-danger', style:'margin-top:8px;'},'Close');
    closeBtn.addEventListener('click', ()=> modal.remove());
    box.append(title, table, closeBtn);
    modal.appendChild(box);
    document.body.appendChild(modal);
  }

  onAuthChange((user)=>{
    if(!user){ renderLoggedOut(); mainCard.style.display='none'; return; }
    renderLoggedIn(user);
    (async () => {
      // Try to ensure admin claim once after login (no-op if already admin or not listed)
      try { await ensureAdminClaimRemote(); } catch {}
      // Refresh token to pick up new claims, then check
      try { await auth.currentUser?.getIdToken(true); } catch {}
      const admin = await isAdmin();
      if (!admin) {
        msg.textContent = 'Signed in (visitor mode). If you should be admin, use the Allowlist tab to add your email to Admin Emails, then sign out and back in.';
        mainCard.style.display = 'none';
        // Show a simple visitor summary
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const snap = await getDoc(userRef);
          const data = snap.exists() ? snap.data() : {};
          const prog = data.progress || {};
          let completed = 0, attempts = 0, scored=0, outOf=0;
          Object.values(prog).forEach(p=>{
            if (p.completed) completed += 1;
            attempts += (p.attempts||0);
            if (typeof p.grade==='number' && typeof p.maxScore==='number'){ scored+=p.grade; outOf+=p.maxScore; }
          });
          const elSum = document.getElementById('visitor-summary');
          if (elSum) elSum.textContent = `Items completed: ${completed}, attempts: ${attempts}, total score: ${scored}/${outOf || '—'}`;
        } catch {}
        document.getElementById('visitor-card').style.display = 'block';
        return;
      }
      document.getElementById('visitor-card').style.display = 'none';
      mainCard.style.display='block';
      switchTab('users');
      loadUsers();
    })();
  });

  refreshBtn.addEventListener('click', loadUsers);
  search.addEventListener('input', loadUsers);
  const recheckBtn = document.getElementById('admin-recheck');
  recheckBtn?.addEventListener('click', async ()=>{
    const note = document.getElementById('admin-recheck-msg');
    note.textContent = 'Checking...';
    try{
      const r = await ensureAdminClaimRemote();
      if (r.success){
        note.textContent = 'If your email is listed, claims were updated. Please sign out and sign in again to apply.';
      } else {
        note.textContent = r.error || 'Failed to update claims.';
      }
    }catch(e){
      note.textContent = e?.message || 'Failed to update claims.';
    }
  });
})();
