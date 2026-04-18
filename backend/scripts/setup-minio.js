require('dotenv').config();
const { ensureBuckets } = require('../services/minioService');

async function setupMinIO() {
  try {
    console.log('[setup-minio] Starting MinIO setup...');
    await ensureBuckets();
    console.log('[setup-minio] MinIO setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('[setup-minio] Setup failed:', error);
    process.exit(1);
  }
}

setupMinIO();
