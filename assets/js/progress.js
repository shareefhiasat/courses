import { db, auth, onAuthChange, signIn, signOutUser, getPublicActivities } from '../../firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';

(async function(){
  const row = document.getElementById('auth-row');
  const msg = document.getElementById('auth-msg');
  const statsCard = document.getElementById('stats-card');
  const progressCard = document.getElementById('progress-card');
  const activitiesList = document.getElementById('activities-list');
  const filterStatus = document.getElementById('filter-status');
  const filterCourse = document.getElementById('filter-course');

  let userProgress = {};
  let allActivities = [];

  function el(tag, attrs={}, ...children){
    const n=document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if(k==='class') n.className=v; else if(k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k,v);
    });
    children.forEach(c=> n.append(c instanceof Node ? c : document.createTextNode(c)));
    return n;
  }

  function renderLoggedOut(){
    row.innerHTML = '';
    const email = el('input', {type:'email', placeholder:'Email', style:'min-width:220px;'});
    const password = el('input', {type:'password', placeholder:'Password', style:'min-width:140px;'});
    const loginBtn = el('button', {class:'btn btn-primary'}, 'Login');
    loginBtn.addEventListener('click', async ()=>{
      const res = await signIn(email.value.trim(), password.value);
      msg.textContent = res.success ? 'Logged in' : res.error;
    });
    row.append(email, password, loginBtn);
  }

  function renderLoggedIn(user){
    row.innerHTML = '';
    const welcome = el('span', {}, `Welcome, ${user.email}`);
    const logoutBtn = el('button', {class:'btn btn-primary'}, 'Logout');
    logoutBtn.addEventListener('click', ()=> signOutUser());
    row.append(welcome, logoutBtn);
  }

  async function loadUserProgress(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      userProgress = userDoc.exists() ? (userDoc.data().progress || {}) : {};
      
      const activitiesRes = await getPublicActivities();
      allActivities = activitiesRes.success ? (activitiesRes.items || []) : [];
      
      updateStats();
      renderActivities();
    } catch (error) {
      console.error('Error loading progress:', error);
      msg.textContent = 'Failed to load progress data';
    }
  }

  function updateStats() {
    let completed = 0, totalScore = 0, maxScore = 0, attempts = 0, pending = 0;
    
    Object.values(userProgress).forEach(p => {
      if (p.completed) completed++;
      attempts += (p.attempts || 0);
      if (typeof p.grade === 'number' && typeof p.maxScore === 'number') {
        totalScore += p.grade;
        maxScore += p.maxScore;
      }
    });
    
    pending = allActivities.filter(a => a.show && !userProgress[a.id]?.completed).length;
    
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-total-score').textContent = `${totalScore}/${maxScore}`;
    document.getElementById('stat-attempts').textContent = attempts;
    document.getElementById('stat-pending').textContent = pending;
  }

  function getActivityStatus(activity) {
    const progress = userProgress[activity.id];
    if (progress?.completed) return 'completed';
    
    if (activity.dueDate) {
      const dueDate = new Date(activity.dueDate);
      const now = new Date();
      if (now > dueDate) return 'overdue';
      
      const daysDiff = (dueDate - now) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 3) return 'upcoming';
    }
    
    return 'pending';
  }

  function renderActivities() {
    if (!activitiesList) return;
    
    const statusFilter = filterStatus?.value || '';
    const courseFilter = filterCourse?.value || '';
    
    const filtered = allActivities.filter(activity => {
      if (!activity.show) return false;
      if (courseFilter && activity.course !== courseFilter) return false;
      
      const status = getActivityStatus(activity);
      if (statusFilter && status !== statusFilter) return false;
      
      return true;
    });
    
    activitiesList.innerHTML = '';
    
    filtered.forEach(activity => {
      const progress = userProgress[activity.id] || {};
      const status = getActivityStatus(activity);
      
      const item = document.createElement('div');
      item.className = `progress-item ${status}`;
      
      const dueText = activity.dueDate ? 
        `Due: ${new Date(activity.dueDate).toLocaleDateString()}` : 
        'No due date';
      
      const gradeText = progress.grade !== undefined ? 
        `Grade: ${progress.grade}/${progress.maxScore || '?'}` : 
        'Not graded';
      
      const attemptsText = `Attempts: ${progress.attempts || 0}`;
      
      item.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
          <div>
            <h3 style="margin:0;color:#2b2b2b;">${activity.title_en || activity.id}</h3>
            <p style="margin:4px 0;opacity:0.8;">${activity.course} • ${activity.type} • ${activity.difficulty}</p>
          </div>
          <div style="text-align:right;font-size:0.9rem;opacity:0.8;">
            <div>${dueText}</div>
            <div>${gradeText}</div>
            <div>${attemptsText}</div>
          </div>
        </div>
        <div style="margin-bottom:8px;">
          <p style="margin:0;opacity:0.9;">${activity.description_en || ''}</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          ${activity.url ? `<a href="${activity.url}" target="_blank" class="btn btn-primary">Start Activity</a>` : ''}
          ${progress.completed ? '<span class="btn btn-success">✓ Completed</span>' : ''}
          ${activity.allowRetake && progress.completed ? `<a href="${activity.url}" target="_blank" class="btn btn-warning">Retry</a>` : ''}
        </div>
      `;
      
      activitiesList.appendChild(item);
    });
    
    if (filtered.length === 0) {
      activitiesList.innerHTML = '<p style="text-align:center;opacity:0.6;padding:40px;">No activities found matching your filters.</p>';
    }
  }

  // Event listeners for filters
  filterStatus?.addEventListener('change', renderActivities);
  filterCourse?.addEventListener('change', renderActivities);

  onAuthChange((user) => {
    if (!user) {
      renderLoggedOut();
      statsCard.style.display = 'none';
      progressCard.style.display = 'none';
      return;
    }
    
    renderLoggedIn(user);
    statsCard.style.display = 'block';
    progressCard.style.display = 'block';
    loadUserProgress(user.uid);
  });
})();
