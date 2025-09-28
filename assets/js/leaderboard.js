import { db, auth, onAuthChange, signIn, signOutUser } from '../../firebase-config.js';
import { collection, getDocs, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';

(async function(){
  const row = document.getElementById('auth-row');
  const msg = document.getElementById('auth-msg');
  const leaderboardCard = document.getElementById('leaderboard-card');
  const leaderboardList = document.getElementById('leaderboard-list');
  const yourRank = document.getElementById('your-rank');
  const yourRankDetails = document.getElementById('your-rank-details');
  const filterCourse = document.getElementById('filter-course');
  const filterPeriod = document.getElementById('filter-period');
  const searchUser = document.getElementById('search-user');
  const refreshBtn = document.getElementById('refresh-btn');

  let currentUser = null;
  let allUsers = [];

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
    const welcome = el('span', {}, `Signed in as ${user.email}`);
    const logoutBtn = el('button', {class:'btn btn-primary'}, 'Logout');
    logoutBtn.addEventListener('click', ()=> signOutUser());
    row.append(welcome, logoutBtn);
  }

  async function loadUsers() {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      allUsers = [];
      
      snapshot.forEach(doc => {
        const userData = doc.data();
        const progress = userData.progress || {};
        
        let totalScore = 0;
        let maxScore = 0;
        let completed = 0;
        let attempts = 0;
        
        Object.values(progress).forEach(p => {
          if (p.completed) completed++;
          attempts += (p.attempts || 0);
          if (typeof p.grade === 'number' && typeof p.maxScore === 'number') {
            totalScore += p.grade;
            maxScore += p.maxScore;
          }
        });
        
        allUsers.push({
          id: doc.id,
          email: userData.email || doc.id,
          totalScore,
          maxScore,
          completed,
          attempts,
          progress,
          lastActivity: userData.lastActivity || null
        });
      });
      
      renderLeaderboard();
    } catch (error) {
      console.error('Error loading users:', error);
      msg.textContent = 'Failed to load leaderboard data';
    }
  }

  function filterUsers() {
    const courseFilter = filterCourse?.value || '';
    const periodFilter = filterPeriod?.value || '';
    const searchQuery = (searchUser?.value || '').toLowerCase();
    
    let filtered = allUsers.filter(user => {
      // Search filter
      if (searchQuery && !user.email.toLowerCase().includes(searchQuery)) {
        return false;
      }
      
      // Course filter - check if user has progress in that course
      if (courseFilter) {
        const hasProgressInCourse = Object.keys(user.progress).some(activityId => {
          // This is a simplified check - in a real app you'd need to cross-reference with activities
          return true; // For now, show all users
        });
      }
      
      // Period filter
      if (periodFilter !== 'all' && user.lastActivity) {
        const lastActivity = new Date(user.lastActivity);
        const now = new Date();
        const daysDiff = (now - lastActivity) / (1000 * 60 * 60 * 24);
        
        if (periodFilter === 'week' && daysDiff > 7) return false;
        if (periodFilter === 'month' && daysDiff > 30) return false;
      }
      
      return true;
    });
    
    // Sort by total score (descending)
    filtered.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.completed !== a.completed) return b.completed - a.completed;
      return a.email.localeCompare(b.email);
    });
    
    return filtered;
  }

  function renderLeaderboard() {
    if (!leaderboardList) return;
    
    const filtered = filterUsers();
    leaderboardList.innerHTML = '';
    
    if (filtered.length === 0) {
      leaderboardList.innerHTML = '<p style="text-align:center;opacity:0.6;padding:40px;">No users found matching your filters.</p>';
      return;
    }
    
    filtered.forEach((user, index) => {
      const rank = index + 1;
      const item = document.createElement('div');
      item.className = 'leaderboard-item';
      
      // Highlight current user
      if (currentUser && user.id === currentUser.uid) {
        item.style.background = '#e7f3ff';
        item.style.border = '2px solid #0d6efd';
      }
      
      const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
      const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
      
      const percentage = user.maxScore > 0 ? Math.round((user.totalScore / user.maxScore) * 100) : 0;
      
      item.innerHTML = `
        <div class="rank ${rankClass}">
          ${rankIcon}${rank}
        </div>
        <div class="user-info">
          <div class="user-email">${user.email}</div>
          <div class="user-stats">
            ${user.completed} completed • ${user.attempts} attempts • ${percentage}% accuracy
          </div>
        </div>
        <div class="score">
          ${user.totalScore}/${user.maxScore}
        </div>
      `;
      
      leaderboardList.appendChild(item);
    });
    
    // Show current user's rank if they're not in the visible list
    if (currentUser) {
      const userIndex = filtered.findIndex(u => u.id === currentUser.uid);
      if (userIndex !== -1) {
        const userRank = userIndex + 1;
        const userData = filtered[userIndex];
        const percentage = userData.maxScore > 0 ? Math.round((userData.totalScore / userData.maxScore) * 100) : 0;
        
        yourRankDetails.innerHTML = `
          Rank #${userRank} of ${filtered.length} • 
          Score: ${userData.totalScore}/${userData.maxScore} (${percentage}%) • 
          ${userData.completed} completed activities
        `;
        yourRank.style.display = 'block';
      } else {
        yourRank.style.display = 'none';
      }
    }
  }

  // Event listeners
  filterCourse?.addEventListener('change', renderLeaderboard);
  filterPeriod?.addEventListener('change', renderLeaderboard);
  searchUser?.addEventListener('input', renderLeaderboard);
  refreshBtn?.addEventListener('click', loadUsers);

  onAuthChange((user) => {
    currentUser = user;
    
    if (!user) {
      renderLoggedOut();
      leaderboardCard.style.display = 'none';
      return;
    }
    
    renderLoggedIn(user);
    leaderboardCard.style.display = 'block';
    loadUsers();
  });
})();
