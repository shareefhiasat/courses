// MongoDB Initialization Script
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('lms_dev');

// Create initial collections if they don't exist
db.createCollection('Category');
db.createCollection('User');

print('✅ MongoDB initialized successfully');
print('Database: lms_dev');
print('Collections created: Category, User');
