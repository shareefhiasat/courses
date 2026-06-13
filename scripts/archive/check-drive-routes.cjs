/**
 * Check Drive Backend Routes
 * 
 * This script checks if all the required routes are properly defined
 */

const fs = require('fs');
const path = require('path');

console.log('=== Checking Drive Backend Routes ===\n');

// Check if drive routes file exists
const routesPath = path.join(__dirname, 'backend/routes/drive.js');
if (!fs.existsSync(routesPath)) {
  console.log('ERROR: backend/routes/drive.js not found!');
  process.exit(1);
}

const routesContent = fs.readFileSync(routesPath, 'utf8');
console.log('Drive routes file found\n');

// Check each route
const routes = [
  { path: '/files/:fileId/shares', method: 'GET', desc: 'Get file shares' },
  { path: '/files/:fileId/share', method: 'POST', desc: 'Share file with user' },
  { path: '/shares/:shareId', method: 'PUT', desc: 'Update share permission' },
  { path: '/shares/:shareId', method: 'DELETE', desc: 'Delete share' },
  { path: '/files/:fileId/collabora/edit', method: 'GET', desc: 'Get Collabora edit URL' },
  { path: '/files/:fileId/collabora/view', method: 'GET', desc: 'Get Collabora view URL' },
  { path: '/files/:fileId/comments', method: 'GET', desc: 'Get file comments' },
  { path: '/files/:fileId/comments', method: 'POST', desc: 'Add file comment' },
  { path: '/comments/:commentId', method: 'DELETE', desc: 'Delete comment' },
  { path: '/files/:fileId/versions', method: 'GET', desc: 'Get file versions' },
  { path: '/files/:fileId/versions/:versionId/restore', method: 'POST', desc: 'Restore version' },
  { path: '/files/:fileId/enable-versioning', method: 'POST', desc: 'Enable versioning' },
  { path: '/files/:fileId/activities', method: 'GET', desc: 'Get file activities' }
];

let missingRoutes = [];

routes.forEach(route => {
  const routePattern = `router.${route.method.toLowerCase()}('${route.path}'`;
  if (routesContent.includes(routePattern)) {
    console.log(`   [OK] ${route.method} ${route.path} - ${route.desc}`);
  } else {
    console.log(`   [MISSING] ${route.method} ${route.path} - ${route.desc}`);
    missingRoutes.push(route);
  }
});

// Check if controllers are imported
console.log('\n=== Checking Controller Imports ===\n');

const controllerImports = [
  'shareFileWithUser',
  'getFileShares', 
  'updateSharePermission',
  'deleteShare',
  'getCollaboraEditUrl',
  'getCollaboraViewUrl',
  'addFileComment',
  'getFileComments',
  'deleteFileComment',
  'getFileVersions',
  'restoreFileVersion',
  'enableFileVersioning',
  'getFileActivities'
];

controllerImports.forEach(controller => {
  if (routesContent.includes(controller)) {
    console.log(`   [OK] ${controller} imported`);
  } else {
    console.log(`   [MISSING] ${controller} not imported`);
  }
});

// Check if controllers exist
console.log('\n=== Checking Controller Files ===\n');

const controllerFiles = [
  'backend/controllers/driveSharingController.js',
  'backend/controllers/collaborationController.js',
  'backend/controllers/versionController.js'
];

controllerFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   [OK] ${file} exists`);
  } else {
    console.log(`   [MISSING] ${file} not found`);
  }
});

// Summary
console.log('\n=== Summary ===\n');
if (missingRoutes.length > 0) {
  console.log(`Found ${missingRoutes.length} missing routes:`);
  missingRoutes.forEach(route => {
    console.log(`  - ${route.method} ${route.path}`);
  });
  console.log('\nThese routes need to be added to backend/routes/drive.js');
} else {
  console.log('All required routes are defined!');
}

// Check if routes are mounted in server.js
console.log('\n=== Checking Server.js Route Mounting ===\n');
const serverPath = path.join(__dirname, 'backend/server.js');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  if (serverContent.includes("app.use('/api/v1/drive', driveRoutes)")) {
    console.log('   [OK] Drive routes mounted at /api/v1/drive');
  } else {
    console.log('   [MISSING] Drive routes not mounted properly');
  }
} else {
  console.log('   [WARNING] server.js not found');
}
