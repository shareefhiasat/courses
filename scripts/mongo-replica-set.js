// MongoDB Replica Set Initialization Script
// This script runs after MongoDB initialization to set up replica set

// Connect to admin database and create replica set
db = db.getSiblingDB('admin');

// Initialize replica set if not already done
try {
  rs.status();
  print('✅ Replica set already initialized');
} catch (err) {
  print('🔧 Initializing replica set...');
  rs.initiate({
    _id: 'rs0',
    members: [
      { _id: 0, host: 'localhost:27017' }
    ]
  });
  print('✅ Replica set initialized successfully');
}

print('📊 MongoDB replica set setup completed');
