#!/usr/bin/env node

/**
 * Lookup Migration Script
 * 
 * PURPOSE: Automate migration of frontend components from hardcoded constants to lookup hooks
 * USAGE: node scripts/migrate-lookup-system.cjs
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CLIENT_SRC_DIR = path.join(__dirname, '../client/src');
const LOOKUP_HOOK_IMPORT = "import { useLookupTypes } from '@hooks/useLookupTypes.js';";
const LOOKUP_TYPE_HOOK_IMPORT = "import { useLookupType } from '@hooks/useLookupTypes.js';";

// Mapping of old constant imports to new lookup types
const CONSTANT_TO_LOOKUP_MAPPING = {
  'BEHAVIOR_TYPES': 'behavior-types',
  'PARTICIPATION_TYPES': 'participation-types', 
  'PENALTY_TYPES': 'penalty-types',
  'SUBJECT_TYPES': 'subject-types',
  'REQUIREMENT_TYPES': 'requirement-types',
  'CATEGORY_TYPES': 'category-types',
  'RESOURCE_TYPES': 'resource-types',
  'PRIORITY_TYPES': 'priority-types',
  'USER_STATUS_TYPES': 'user-status-types',
  'ENROLLMENT_STATUS_TYPES': 'enrollment-status-types',
  'ACTIVITY_TYPES': 'activity-types',
  'ATTENDANCE_STATUS_TYPES': 'attendance-status-types',
  'USER_ROLES': 'user-roles'
};

// Files to check for migration
const FILE_PATTERNS = [
  '**/*.jsx',
  '**/*.js',
  '!**/node_modules/**',
  '!**/dist/**',
  '!**/build/**'
];

/**
 * Find all JavaScript/JSX files in the client src directory
 */
function findAllJsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findAllJsFiles(fullPath, files);
    } else if (item.match(/\.(js|jsx)$/)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Analyze a file for lookup migration opportunities
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const analysis = {
    filePath,
    hasLookupConstants: false,
    constantsFound: [],
    usesHardcodedData: false,
    needsMigration: false,
    suggestions: []
  };
  
  // Check for lookup constant imports
  for (const line of lines) {
    for (const [constant, lookupType] of Object.entries(CONSTANT_TO_LOOKUP_MAPPING)) {
      if (line.includes(constant) && line.includes('import')) {
        analysis.hasLookupConstants = true;
        analysis.constantsFound.push({
          constant,
          lookupType,
          line: lines.indexOf(line) + 1
        });
        analysis.needsMigration = true;
      }
    }
  }
  
  // Check for hardcoded array data patterns
  const hardcodedPatterns = [
    /\.map\(.*category.*=/,
    /const.*=.*\[.*id.*:/,
    /\[.*\{.*id.*:.*name.*\}/
  ];
  
  for (const pattern of hardcodedPatterns) {
    if (content.match(pattern)) {
      analysis.usesHardcodedData = true;
      analysis.needsMigration = true;
      break;
    }
  }
  
  // Generate suggestions
  if (analysis.needsMigration) {
    if (analysis.constantsFound.length > 0) {
      analysis.suggestions.push('Replace constant imports with useLookupTypes hook');
    }
    if (analysis.usesHardcodedData) {
      analysis.suggestions.push('Replace hardcoded arrays with lookup data');
    }
  }
  
  return analysis;
}

/**
 * Generate migration code for a file
 */
function generateMigrationCode(analysis) {
  const migrations = [];
  
  if (analysis.constantsFound.length > 0) {
    const lookupTypes = analysis.constantsFound.map(c => c.lookupType);
    migrations.push(`
// MIGRATION: Replace hardcoded constants with lookup hook
// OLD: import { ${analysis.constantsFound.map(c => c.constant).join(', ')} } from '@constants/...';
// NEW: ${LOOKUP_HOOK_IMPORT}
const { data: lookupData, loading, error } = useLookupTypes({
  types: [${lookupTypes.map(t => `'${t}'`).join(', ')}]
});

// Access data like: lookupData['${lookupTypes[0]}'] or use the activityTypeOptions helper
const activityTypeOptions = useLookupTypes().activityTypeOptions;
`);
  }
  
  return migrations.join('\n');
}

/**
 * Main migration function
 */
function runMigration() {
  console.log('🔍 Starting Lookup System Migration Analysis...\n');
  
  const allJsFiles = findAllJsFiles(CLIENT_SRC_DIR);
  const filesNeedingMigration = [];
  
  console.log(`📁 Analyzing ${allJsFiles.length} JavaScript/JSX files...\n`);
  
  // Analyze each file
  for (const filePath of allJsFiles) {
    const analysis = analyzeFile(filePath);
    
    if (analysis.needsMigration) {
      filesNeedingMigration.push(analysis);
    }
  }
  
  // Report results
  console.log(`\n📊 Migration Analysis Results:`);
  console.log(`Total files analyzed: ${allJsFiles.length}`);
  console.log(`Files needing migration: ${filesNeedingMigration.length}`);
  console.log(`Files already compliant: ${allJsFiles.length - filesNeedingMigration.length}\n`);
  
  if (filesNeedingMigration.length === 0) {
    console.log('✅ All files are already using the lookup system!');
    return;
  }
  
  // Show detailed results
  console.log('📋 Files needing migration:\n');
  
  for (const analysis of filesNeedingMigration) {
    console.log(`📄 ${path.relative(CLIENT_SRC_DIR, analysis.filePath)}`);
    console.log(`   Constants found: ${analysis.constantsFound.map(c => c.constant).join(', ') || 'None'}`);
    console.log(`   Uses hardcoded data: ${analysis.usesHardcodedData ? 'Yes' : 'No'}`);
    console.log(`   Suggestions: ${analysis.suggestions.join(', ')}`);
    console.log('');
  }
  
  // Generate migration report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: allJsFiles.length,
      filesNeedingMigration: filesNeedingMigration.length,
      filesCompliant: allJsFiles.length - filesNeedingMigration.length
    },
    files: filesNeedingMigration
  };
  
  // Save migration report
  const reportPath = path.join(__dirname, '../lookup-migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📄 Detailed migration report saved to: ${path.relative(__dirname, reportPath)}`);
  
  // Show next steps
  console.log('\n🚀 Next Steps:');
  console.log('1. Review the migration report');
  console.log('2. Update files to use useLookupTypes hook');
  console.log('3. Test components after migration');
  console.log('4. Remove old constant imports');
  console.log('5. Update any hardcoded data usage');
  
  console.log('\n💡 Migration Example:');
  console.log(`
// BEFORE:
import { BEHAVIOR_TYPES, PARTICIPATION_TYPES } from '@constants/behaviorTypes.jsx';

const options = [
  ...BEHAVIOR_TYPES.map(type => ({ ...type, category: 'behavior' })),
  ...PARTICIPATION_TYPES.map(type => ({ ...type, category: 'participation' }))
];

// AFTER:
import { useLookupTypes } from '@hooks/useLookupTypes.js';

const { activityTypeOptions, loading, error } = useLookupTypes();

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;

// activityTypeOptions already contains the formatted data
  `);
}

// Run the migration
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration, analyzeFile, generateMigrationCode };
