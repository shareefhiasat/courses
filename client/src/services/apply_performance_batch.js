#!/usr/bin/env node

/**
 * Batch apply performance utilities to service files
 * This script adds performance monitoring and memoization to service functions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Service directories to process
const SERVICE_DIRS = [
  'E:\\QAF\\Github\\courses\\client\\src\\services\\business',
  'E:\\QAF\\Github\\courses\\client\\src\\services\\db'
];

// Performance import to add
const PERFORMANCE_IMPORT = "import { withPerformanceMonitoring, memoize } from '@utils/performance';";

// Function patterns to wrap with performance monitoring
const FUNCTION_PATTERNS = [
  // Get functions
  { regex: /export const get(\w+)\s*=\s*async\s*\(/g, replacement: 'export const get$1 = withPerformanceMonitoring(async ' },
  // Create functions  
  { regex: /export const create(\w+)\s*=\s*async\s*\(/g, replacement: 'export const create$1 = withPerformanceMonitoring(async ' },
  // Update functions
  { regex: /export const update(\w+)\s*=\s*async\s*\(/g, replacement: 'export const update$1 = withPerformanceMonitoring(async ' },
  // Delete functions
  { regex: /export const delete(\w+)\s*=\s*async\s*\(/g, replacement: 'export const delete$1 = withPerformanceMonitoring(async ' },
  // Other common functions
  { regex: /export const (fetch|find|search|load)\w*\s*=\s*async\s*\(/g, replacement: 'export const $1 = withPerformanceMonitoring(async ' }
];

// Functions that should also have memoization
const MEMOIZE_PATTERNS = [
  { regex: /export const get(\w+)ById\s*=\s*withPerformanceMonitoring\(async\s*\(/g, replacement: 'export const get$1ById = withPerformanceMonitoring(memoize(async ' },
  { regex: /export const get(\w+)s\s*=\s*withPerformanceMonitoring\(async\s*\(/g, replacement: 'export const get$1s = withPerformanceMonitoring(memoize(async ' }
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Skip if already has performance imports
    if (content.includes('withPerformanceMonitoring')) {
      console.log(`⏭️  Skipping ${filePath} - already has performance utilities`);
      return false;
    }

    // Add performance import after existing imports
    const importRegex = /(import[^;]+;)/g;
    const imports = content.match(importRegex);
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      content = content.replace(lastImport, lastImport + '\n' + PERFORMANCE_IMPORT);
      modified = true;
    }

    // Apply performance monitoring to functions
    FUNCTION_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern.regex);
      if (matches) {
        content = content.replace(pattern.regex, pattern.replacement);
        modified = true;
      }
    });

    // Apply memoization to specific functions
    MEMOIZE_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern.regex);
      if (matches) {
        content = content.replace(pattern.regex, pattern.replacement);
        // Need to add closing parenthesis for memoize
        content = content.replace(/(\}\),\s*'[^']+')/g, ')), $1');
        modified = true;
      }
    });

    // Add closing parentheses and operation names for wrapped functions
    if (modified) {
      content = content.replace(/(\}\s*;?\s*)$/gm, '}, \'$1\');');
      
      // Fix operation names to be more descriptive
      content = content.replace(/}, 'get(\w+)'\);/g, '}, \'get$1\' );');
      content = content.replace(/}, 'create(\w+)'\);/g, '}, \'create$1\' );');
      content = content.replace(/}, 'update(\w+)'\);/g, '}, \'update$1\' );');
      content = content.replace(/}, 'delete(\w+)'\);/g, '}, \'delete$1\' );');
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting performance utilities batch application...\n');
  
  let totalFiles = 0;
  let updatedFiles = 0;

  SERVICE_DIRS.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directory ${dir} does not exist, skipping...`);
      return;
    }

    const files = fs.readdirSync(dir).filter(file => file.endsWith('.js'));
    
    console.log(`📁 Processing ${files.length} files in ${dir}...`);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      totalFiles++;
      
      if (processFile(filePath)) {
        updatedFiles++;
      }
    });
  });

  console.log(`\n✨ Batch processing complete!`);
  console.log(`📊 Total files processed: ${totalFiles}`);
  console.log(`🔄 Files updated: ${updatedFiles}`);
  console.log(`⏭️  Files skipped: ${totalFiles - updatedFiles}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { processFile, main };
