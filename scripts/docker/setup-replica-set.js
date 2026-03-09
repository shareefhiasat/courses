// MongoDB Replica Set Setup Script
// This script runs after MongoDB initialization

// Connect to admin database
db = db.getSiblingDB('admin');

// Create admin user
db.createUser({
  user: 'admin',
  pwd: 'admin123',
  roles: [
    { role: 'userAdminAnyDatabase', db: 'admin' },
    { role: 'readWriteAnyDatabase', db: 'admin' },
    { role: 'clusterAdmin', db: 'admin' }
  ]
});

print('✅ Admin user created');

// Switch to lms_dev database
db = db.getSiblingDB('lms_dev');

// Create collections
db.createCollection('Category');
db.createCollection('User');

print('✅ Collections created in lms_dev');

// Create application user
db.createUser({
  user: 'lms_user',
  pwd: 'lms_password',
  roles: [
    { role: 'readWrite', db: 'lms_dev' }
  ]
});

print('✅ Application user created');

// Initialize replica set (this will be executed separately)
print('✅ MongoDB setup completed');
print('📝 Ready for replica set initialization');
