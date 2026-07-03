/**
 * Load .env before any module reads process.env (ESM hoists static imports).
 */
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: join(rootDir, '.env') });
