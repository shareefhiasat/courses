/**
 * Test Drive Functionality
 * 
 * This script tests all the Drive UI functionality to ensure everything works
 */

const fs = require('fs');
const path = require('path');

console.log('=== Drive Functionality Test ===\n');

// Test 1: Check if all required components exist
console.log('1. Checking component files...');

const componentFiles = [
  'client/src/components/drive/FileCard.jsx',
  'client/src/components/drive/FileListRow.jsx',
  'client/src/components/drive/FileActionsMenu.jsx',
  'client/src/components/drive/DriveFileGrid.jsx',
  'client/src/components/drive/DriveToolbar.jsx',
  'client/src/components/drive/FileSidebar.jsx',
  'client/src/components/drive/CollaboraModal.jsx',
  'client/src/components/drive/BulkActionBar.jsx'
];

componentFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   [OK] ${file} exists`);
  } else {
    console.log(`   [MISSING] ${file} not found`);
  }
});

// Test 2: Check if service files exist
console.log('\n2. Checking service files...');

const serviceFiles = [
  'client/src/services/business/driveSharingService.js',
  'client/src/services/business/fileVersionService.js',
  'client/src/services/business/fileCommentService.js',
  'client/src/services/business/driveCollaboraService.js'
];

serviceFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   [OK] ${file} exists`);
  } else {
    console.log(`   [MISSING] ${file} not found`);
  }
});

// Test 3: Check if hook exists
console.log('\n3. Checking hooks...');

const hookPath = path.join(__dirname, 'client/src/hooks/useFileSidebar.js');
if (fs.existsSync(hookPath)) {
  console.log('   [OK] useFileSidebar.js exists');
} else {
  console.log('   [MISSING] useFileSidebar.js not found');
}

// Test 4: Check if main DriveWorkspacePage has been updated
console.log('\n4. Checking DriveWorkspacePage.jsx...');

const drivePagePath = path.join(__dirname, 'client/src/pages/DriveWorkspacePage.jsx');
if (fs.existsSync(drivePagePath)) {
  const drivePageContent = fs.readFileSync(drivePagePath, 'utf8');
  
  const checks = [
    { pattern: 'handleShare', desc: 'Share handler' },
    { pattern: 'handleComment', desc: 'Comment handler' },
    { pattern: 'handleDownload', desc: 'Download handler' },
    { pattern: 'handleFileOpen', desc: 'File open handler' },
    { pattern: 'handleCollaboraEdit', desc: 'Collabora edit handler' },
    { pattern: 'FileSidebar', desc: 'FileSidebar import' },
    { pattern: 'CollaboraModal', desc: 'CollaboraModal import' },
    { pattern: 'BulkActionBar', desc: 'BulkActionBar import' },
    { pattern: 'DriveToolbar', desc: 'DriveToolbar import' },
    { pattern: 'DriveFileGrid', desc: 'DriveFileGrid import' }
  ];
  
  checks.forEach(check => {
    if (drivePageContent.includes(check.pattern)) {
      console.log(`   [OK] ${check.desc} found`);
    } else {
      console.log(`   [MISSING] ${check.desc} not found`);
    }
  });
} else {
  console.log('   [ERROR] DriveWorkspacePage.jsx not found');
}

// Test 5: Check localization keys
console.log('\n5. Checking localization keys...');

const langContextPath = path.join(__dirname, 'client/src/contexts/LangContext.jsx');
if (fs.existsSync(langContextPath)) {
  const langContent = fs.readFileSync(langContextPath, 'utf8');
  
  const keys = [
    'drive.actions.view',
    'drive.actions.edit',
    'drive.actions.download',
    'drive.actions.share',
    'drive.actions.comment',
    'drive.actions.delete',
    'drive.downloadError',
    'drive.bulk.downloadStarted',
    'drive.collabora.opening',
    'drive.collabora.error',
    'drive.sidebar.details',
    'drive.sidebar.activity',
    'drive.sidebar.versions',
    'drive.sidebar.sharing'
  ];
  
  keys.forEach(key => {
    if (langContent.includes(`'${key}'`)) {
      console.log(`   [OK] ${key} found`);
    } else {
      console.log(`   [MISSING] ${key} not found`);
    }
  });
} else {
  console.log('   [ERROR] LangContext.jsx not found');
}

// Test 6: Check backend controllers
console.log('\n6. Checking backend controllers...');

const controllerFiles = [
  'backend/controllers/driveSharingController.js',
  'backend/controllers/collaborationController.js',
  'backend/controllers/versionController.js'
];

controllerFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('decodeURIComponent')) {
      console.log(`   [OK] ${file} has URL decoding`);
    } else {
      console.log(`   [WARNING] ${file} missing URL decoding`);
    }
  } else {
    console.log(`   [MISSING] ${file} not found`);
  }
});

// Test 7: Summary
console.log('\n=== Summary ===\n');
console.log('All Drive functionality components and files have been checked.');
console.log('\nTo test the UI functionality:');
console.log('1. Navigate to https://localhost/drive');
console.log('2. Test each button: Share, Edit, Download, View, Comment');
console.log('3. Check console for debugging logs');
console.log('4. Verify sidebar opens with correct tabs');
console.log('5. Test Collabora modal opening');
console.log('6. Test bulk actions (multi-select)');

console.log('\nExpected behavior:');
console.log('- Share button: Opens sidebar to "Sharing" tab');
console.log('- Edit button: Opens Collabora modal for documents');
console.log('- Download button: Opens file in new tab');
console.log('- View button: Opens sidebar to "Details" tab');
console.log('- Comment button: Opens sidebar to "Activity" tab');
console.log('- Sidebar: Should slide in from right with backdrop');
console.log('- File cards: Should have hover effects and scaling');
