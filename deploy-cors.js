const { Storage } = require('@google-cloud/storage');

// Initialize storage
const storage = new Storage();
const bucketName = 'main-one-32026.appspot.com';

// CORS configuration
const corsConfiguration = [
  {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174", 
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:3000",
      "https://main-one-32026.web.app",
      "https://main-one-32026.firebaseapp.com",
      "https://qaf.academy"
    ],
    method: ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"],
    responseHeader: [
      "Content-Type",
      "Authorization",
      "x-goog-resumable",
      "x-goog-upload-url", 
      "x-goog-upload-status",
      "x-goog-upload-offset",
      "x-goog-upload-command",
      "x-goog-upload-protocol",
      "x-firebase-appcheck",
      "x-goog-meta-*"
    ],
    maxAgeSeconds: 3600
  }
];

async function configureCors() {
  try {
    console.log('Configuring CORS for bucket:', bucketName);
    
    const bucket = storage.bucket(bucketName);
    await bucket.setCorsConfiguration(corsConfiguration);
    
    console.log('✅ CORS configuration updated successfully!');
    
    // Verify the configuration
    const [corsConfig] = await bucket.getCorsConfiguration();
    console.log('Current CORS configuration:', JSON.stringify(corsConfig, null, 2));
    
  } catch (error) {
    console.error('❌ Failed to configure CORS:', error);
    process.exit(1);
  }
}

configureCors();
