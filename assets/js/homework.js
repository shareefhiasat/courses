import { db, auth, onAuthChange, signIn, signOutUser, getPublicActivities, getUserSubmissions, uploadHomeworkFile, createSubmission, updateSubmission, functions } from '../../firebase-config.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-functions.js';

(async function(){
  const row = document.getElementById('auth-row');
  const msg = document.getElementById('auth-msg');
  const homeworkCard = document.getElementById('homework-card');
  const homeworkList = document.getElementById('homework-list');
  let currentUser = null;

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

  async function loadHomework() {
    if (!currentUser) return;

    const [activitiesRes, submissionsRes] = await Promise.all([
      getPublicActivities(),
      getUserSubmissions(currentUser.uid)
    ]);

    const homeworkActivities = activitiesRes.success ? activitiesRes.items.filter(a => a.type === 'homework' && a.show) : [];
    const submissions = submissionsRes.success ? submissionsRes.submissions : [];
    const submissionsMap = new Map(submissions.map(s => [s.activityId, s]));

    homeworkList.innerHTML = '';

    homeworkActivities.forEach(activity => {
      const submission = submissionsMap.get(activity.id);
      const item = document.createElement('div');
      item.className = 'homework-item';

      const isReviewed = submission?.reviewedAt;
      const canSubmit = !isReviewed;

      item.innerHTML = `
        <div class="item-header">
          <div>
            <h3 class="item-title">${activity.title_en || activity.id}</h3>
            <p class="item-due-date">Due: ${activity.dueDate ? new Date(activity.dueDate).toLocaleString() : 'N/A'}</p>
          </div>
          <div id="status-${activity.id}"></div>
        </div>
        <p>${activity.description_en || ''}</p>
        ${canSubmit ? `
        <div class="submission-area">
          <input type="file" id="file-${activity.id}" accept=".zip,.rar,.pdf,.doc,.docx">
          <button class="btn btn-primary" data-action="upload" data-activity-id="${activity.id}">Upload</button>
          <div class="progress-bar" id="progress-${activity.id}"><div class="progress-bar-fill"></div></div>
        </div>
        ` : ''}
      `;
      homeworkList.appendChild(item);
      updateStatus(activity.id, submission);
    });
  }

  function updateStatus(activityId, submission) {
    const statusDiv = document.getElementById(`status-${activityId}`);
    if (!statusDiv) return;

    let statusText = 'Pending';
    let statusClass = 'status-pending';

    if (submission) {
      if (submission.grade !== undefined) {
        statusText = `Graded: ${submission.grade}/${submission.maxScore || '?'}`;
        statusClass = 'status-graded';
      } else {
        statusText = `Submitted: ${submission.fileName}`;
        statusClass = 'status-submitted';
      }
      if (submission.reviewedAt) {
        statusText += ' (Reviewed)';
        statusClass = 'status-locked';
      }
    }
    statusDiv.innerHTML = `<span class="status-tag ${statusClass}">${statusText}</span>`;
  }

  homeworkList.addEventListener('click', async (e) => {
    if (e.target.dataset.action === 'upload') {
      const activityId = e.target.dataset.activityId;
      const fileInput = document.getElementById(`file-${activityId}`);
      const file = fileInput.files[0];

      if (!file) {
        alert('Please select a file to upload.');
        return;
      }

      const progressBar = document.getElementById(`progress-${activityId}`);
      const progressBarFill = progressBar.querySelector('.progress-bar-fill');
      progressBar.style.display = 'block';

      uploadHomeworkFile(file, currentUser.uid, activityId, (progress, error, downloadURL) => {
        if (error) {
          alert('Upload failed: ' + error.message);
          progressBar.style.display = 'none';
          return;
        }

        progressBarFill.style.width = progress + '%';

        if (progress === 100 && downloadURL) {
          const submissionData = {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            activityId: activityId,
            fileName: file.name,
            fileURL: downloadURL,
            submittedAt: new Date(),
          };

          const createHomeworkSubmission = httpsCallable(functions, 'createHomeworkSubmission');
          createHomeworkSubmission(submissionData)
            .then(() => loadHomework())
            .catch((error) => {
              alert('Failed to create submission: ' + error.message);
            });
        }
      });
    }
  });

  onAuthChange((user) => {
    currentUser = user;
    if (!user) {
      renderLoggedOut();
      homeworkCard.style.display = 'none';
      return;
    }
    renderLoggedIn(user);
    homeworkCard.style.display = 'block';
    loadHomework();
  });

})();
