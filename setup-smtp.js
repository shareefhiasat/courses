// Script to set up SMTP configuration in Firestore
const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupSMTP() {
  console.log('\n📧 SMTP Configuration Setup\n');
  console.log('This will configure your email settings in Firestore.\n');

  const host = await question('SMTP Host (default: smtp.gmail.com): ') || 'smtp.gmail.com';
  const port = await question('SMTP Port (default: 587): ') || '587';
  const user = await question('Email Address: ');
  const password = await question('Email Password/App Password: ');
  const senderName = await question('Sender Name (default: CS Learning Hub): ') || 'CS Learning Hub';

  const smtpConfig = {
    host,
    port: parseInt(port),
    secure: false,
    user,
    password,
    senderName,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection('config').doc('smtp').set(smtpConfig);
    console.log('\n✅ SMTP configuration saved successfully!');
    console.log('\nConfiguration:');
    console.log(`  Host: ${host}`);
    console.log(`  Port: ${port}`);
    console.log(`  User: ${user}`);
    console.log(`  Sender Name: ${senderName}`);
    console.log('\n⚠️  Password is stored securely in Firestore');
  } catch (error) {
    console.error('\n❌ Error saving SMTP configuration:', error);
  }

  rl.close();
  process.exit(0);
}

setupSMTP();
