import { db, auth, onAuthChange, signIn, signOutUser, getClasses } from '../../firebase-config.js';
import { collection, addDoc, query, orderBy, limit, onSnapshot, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';
import { getDatabase, ref as dbRef, onValue } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js';

(async function(){
  const row = document.getElementById('auth-row');
  const msg = document.getElementById('auth-msg');
  const chatCard = document.getElementById('chat-card');
  
  // Chat elements
  const globalMessages = document.getElementById('global-messages');
  const directMessages = document.getElementById('direct-messages');
  const globalInput = document.getElementById('global-input');
  const directInput = document.getElementById('direct-input');
  const globalSend = document.getElementById('global-send');
  const directSend = document.getElementById('direct-send');
  const usersList = document.getElementById('users-list');
  const directChatHeader = document.getElementById('direct-chat-header');
  const tabsContainer = document.getElementById('chat-tabs');
  
  let currentUser = null;
  let selectedUserId = null;
  let globalUnsubscribe = null;
  let directUnsubscribe = null;

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

  function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  function renderMessage(message, container, isOwn = false) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${isOwn ? 'own' : 'other'}`;
    
    const info = document.createElement('div');
    info.className = 'message-info';
    info.textContent = `${message.senderEmail || 'Unknown'} • ${formatTime(message.timestamp)}`;
    
    const content = document.createElement('div');
    content.textContent = message.text || '';
    
    messageEl.appendChild(info);
    messageEl.appendChild(content);
    container.appendChild(messageEl);
    container.scrollTop = container.scrollHeight;
  }

  function setupGlobalChat() {
    if (globalUnsubscribe) globalUnsubscribe();
    
    const q = query(
      collection(db, 'chats/global/messages'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    globalUnsubscribe = onSnapshot(q, (snapshot) => {
      globalMessages.innerHTML = '';
      const messages = [];
      snapshot.forEach(doc => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      
      messages.reverse().forEach(message => {
        const isOwn = message.senderId === currentUser?.uid;
        renderMessage(message, globalMessages, isOwn);
      });
    });
  }

  function setupDirectChat(otherUserId) {
    if (directUnsubscribe) directUnsubscribe();
    if (!currentUser || !otherUserId) return;
    
    const chatId = [currentUser.uid, otherUserId].sort().join('__');
    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    directUnsubscribe = onSnapshot(q, (snapshot) => {
      directMessages.innerHTML = '';
      const messages = [];
      snapshot.forEach(doc => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      
      messages.reverse().forEach(message => {
        const isOwn = message.senderId === currentUser?.uid;
        renderMessage(message, directMessages, isOwn);
      });
    });
  }

  function setupClassChat(classId) {
    if (globalUnsubscribe) globalUnsubscribe(); // Reuse the global unsubscribe

    const q = query(
      collection(db, `chats/${classId}/messages`),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    globalUnsubscribe = onSnapshot(q, (snapshot) => {
      globalMessages.innerHTML = '';
      const messages = [];
      snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
      messages.reverse().forEach(message => {
        const isOwn = message.senderId === currentUser?.uid;
        renderMessage(message, globalMessages, isOwn);
      });
    });
  }

  async function sendGlobalMessage() {
    const text = globalInput.value.trim();
    if (!text || !currentUser) return;

    const activeTab = tabsContainer.querySelector('.active');
    const chatId = activeTab.dataset.chat;

    if (!chatId) return;

    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text,
        senderId: currentUser.uid,
        senderEmail: currentUser.email,
        timestamp: new Date()
      });
      globalInput.value = '';
    } catch (error) {
      console.error('Error sending message:', error);
      msg.textContent = 'Failed to send message';
    }
  }

  async function sendDirectMessage() {
    const text = directInput.value.trim();
    if (!text || !currentUser || !selectedUserId) return;
    
    try {
      const chatId = [currentUser.uid, selectedUserId].sort().join('__');
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text,
        senderId: currentUser.uid,
        senderEmail: currentUser.email,
        timestamp: new Date()
      });
      directInput.value = '';
    } catch (error) {
      console.error('Error sending direct message:', error);
      msg.textContent = 'Failed to send message';
    }
  }

  async function loadUsers() {
    try {
      const rtdb = getDatabase();
      const snapshot = await getDocs(collection(db, 'users'));
      usersList.innerHTML = '';
      
      snapshot.forEach(doc => {
        const userData = doc.data();
        if (doc.id === currentUser?.uid) return; // Skip self
        
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.dataset.userId = doc.id;

        const statusIndicator = el('span', { class: 'status-indicator' });
        const userEmail = el('span', {}, userData.email || doc.id);

        userItem.append(statusIndicator, userEmail);
        userItem.addEventListener('click', () => selectUser(doc.id, userData.email));
        usersList.appendChild(userItem);

        // Listen for status changes
        const userStatusRef = dbRef(rtdb, '/status/' + doc.id);
        onValue(userStatusRef, (snap) => {
          const status = snap.val();
          const indicator = userItem.querySelector('.status-indicator');
          if (status?.state === 'online') {
            indicator.style.backgroundColor = 'green';
          } else {
            indicator.style.backgroundColor = 'grey';
          }
        });
      });
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  function selectUser(userId, email) {
    selectedUserId = userId;
    directChatHeader.textContent = `Chat with ${email || userId}`;
    
    // Update UI
    document.querySelectorAll('.user-item').forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');
    
    directInput.disabled = false;
    directSend.disabled = false;
    
    setupDirectChat(userId);
  }

  tabsContainer.addEventListener('click', (e) => {
    const tab = e.target.closest('.chat-tab');
    if (!tab) return;

    const chatId = tab.dataset.chat;
    const isClassChat = !['global', 'direct'].includes(chatId);

    // Update UI
    tabsContainer.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    document.getElementById('global-chat').style.display = (chatId === 'global' || isClassChat) ? 'block' : 'none';
    document.getElementById('direct-chat').style.display = chatId === 'direct' ? 'block' : 'none';

    // Load data for tab
    if (chatId === 'global') {
      setupGlobalChat();
    } else if (isClassChat) {
      setupClassChat(chatId);
    } else if (chatId === 'direct') {
      loadUsers();
    }
  });

  // Event listeners
  globalSend.addEventListener('click', sendGlobalMessage);
  directSend.addEventListener('click', sendDirectMessage);
  
  globalInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendGlobalMessage();
  });
  
  directInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendDirectMessage();
  });

  async function loadUserChatData(uid) {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const enrolledClasses = userData.enrolledClasses || [];
      
      const classesRes = await getClasses();
      if (classesRes.success) {
        const classesMap = new Map(classesRes.classes.map(c => [c.id, c.name]));
        tabsContainer.querySelectorAll('[data-chat-type="class"]').forEach(tab => tab.remove());
        enrolledClasses.forEach(classId => {
          const tab = el('button', {
            class: 'chat-tab',
            'data-chat': classId,
            'data-chat-type': 'class'
          }, classesMap.get(classId) || classId);
          tabsContainer.appendChild(tab);
        });
      }
    }
  }

  onAuthChange((user) => {
    currentUser = user;
    
    if (!user) {
      renderLoggedOut();
      chatCard.style.display = 'none';
      if (globalUnsubscribe) globalUnsubscribe();
      if (directUnsubscribe) directUnsubscribe();
      return;
    }
    
    renderLoggedIn(user);
    chatCard.style.display = 'block';
    setupGlobalChat();
    loadUserChatData(user.uid);
  });
})();
