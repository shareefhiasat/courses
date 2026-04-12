#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test Configuration
const TEST_CONFIG = {
  baseUrl: 'https://localhost:5174',
  graphqlPort: 4001,
  testData: {
    program: {
      nameEn: 'Test Program TDD',
      nameAr: 'برنامج اختبار',
      code: 'TDD-001',
      descriptionEn: 'Test program for TDD',
      descriptionAr: 'برنامج اختبار للتطوير المدفوع بالاختبارات'
    },
    subject: {
      nameEn: 'Test Subject TDD',
      nameAr: 'مادة اختبار',
      code: 'TDD-SUB-001',
      descriptionEn: 'Test subject for TDD',
      descriptionAr: 'مادة اختبار للتطوير المدفوع بالاختبارات'
    },
    class: {
      name: 'Test Class TDD',
      nameAr: 'فصل اختبار',
      code: 'TDD-CLASS-001',
      term: 'Fall',
      year: '2024',
      locationEn: 'Test Location',
      locationAr: 'موقع الاختبار'
    }
  }
};

// Log Monitor Class
class LogMonitor {
  constructor() {
    this.logs = [];
    this.issues = [];
    this.graphqlLogs = [];
    this.databaseLogs = [];
  }

  addLog(logLine) {
    const logEntry = {
      text: logLine,
      timestamp: new Date().toISOString()
    };
    
    this.logs.push(logEntry);
    
    // Check for specific patterns
    if (logLine.includes('ERROR') || logLine.includes('error')) {
      this.issues.push({
        type: 'ERROR',
        message: logLine,
        timestamp: logEntry.timestamp
      });
      console.log(`🚨 ERROR DETECTED: ${logLine}`);
    }
    
    // Check for GraphQL server logs
    if (logLine.includes('[GraphQL Server]')) {
      this.graphqlLogs.push(logEntry);
      console.log(`📡 GraphQL: ${logLine}`);
    }
    
    // Check for database service logs
    if (logLine.includes('[ClassDbService]') || logLine.includes('[SubjectDbService]') || logLine.includes('[ProgramDbService]')) {
      this.databaseLogs.push(logEntry);
      console.log(`🗄️  Database: ${logLine}`);
    }

    // Check for class creation success
    if (logLine.includes('Class creation result:')) {
      console.log(`✅ Class Creation: ${logLine}`);
    }

    // Check for class ID
    if (logLine.includes('newClass.id:')) {
      console.log(`🆔 Class ID: ${logLine}`);
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalLogs: this.logs.length,
      issues: this.issues.length,
      graphqlLogs: this.graphqlLogs.length,
      databaseLogs: this.databaseLogs.length,
      summary: {
        hasErrors: this.issues.length > 0,
        hasGraphQLLogs: this.graphqlLogs.length > 0,
        hasDatabaseLogs: this.databaseLogs.length > 0,
        classIdFound: this.databaseLogs.some(log => log.text.includes('newClass.id:')),
        classCreationFound: this.graphqlLogs.some(log => log.text.includes('Class creation result:'))
      }
    };
    
    return report;
  }

  saveReport() {
    const report = this.generateReport();
    fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
    fs.writeFileSync('test-logs.json', JSON.stringify(this.logs, null, 2));
    return report;
  }
}

// Server Monitor
class ServerMonitor {
  constructor() {
    this.graphqlProcess = null;
    this.devProcess = null;
    this.logMonitor = new LogMonitor();
  }

  async startServers() {
    console.log('🚀 Starting servers with monitoring...');
    
    // Start GraphQL server
    this.graphqlProcess = spawn('node', ['working-graphql-server.cjs'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    this.graphqlProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          this.logMonitor.addLog(`[GraphQL] ${line.trim()}`);
        }
      });
    });

    this.graphqlProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          this.logMonitor.addLog(`[GraphQL-ERROR] ${line.trim()}`);
        }
      });
    });

    // Wait a bit for GraphQL server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start dev server
    this.devProcess = spawn('npm', ['run', 'dev'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    this.devProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          this.logMonitor.addLog(`[DEV] ${line.trim()}`);
        }
      });
    });

    this.devProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          this.logMonitor.addLog(`[DEV-ERROR] ${line.trim()}`);
        }
      });
    });

    console.log('✅ Servers started with monitoring');
  }

  async stopServers() {
    console.log('🛑 Stopping servers...');
    
    if (this.graphqlProcess) {
      this.graphqlProcess.kill();
    }
    
    if (this.devProcess) {
      this.devProcess.kill();
    }
    
    // Wait for processes to stop
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Servers stopped');
  }

  getLogMonitor() {
    return this.logMonitor;
  }
}

// Test Instructions Generator
function generateTestInstructions() {
  return `
🧪 LMS Test-Driven Development Instructions

📋 Test Steps:
1. Wait for servers to start (check console for "✅ Servers started with monitoring")
2. Open browser and navigate to: ${TEST_CONFIG.baseUrl}
3. Login with Keycloak
4. Follow these test steps:

🎯 Program CRUD Test:
   - Go to Programs tab
   - Create new program with: ${TEST_CONFIG.testData.program.nameEn}
   - Edit the program (add "Updated" to name)
   - Delete the program
   - Check console for GraphQL logs

🎯 Subject CRUD Test:
   - Go to Subjects tab  
   - Create new subject with: ${TEST_CONFIG.testData.subject.nameEn}
   - Edit the subject (add "Updated" to name)
   - Delete the subject
   - Check console for GraphQL logs

🎯 Class CRUD Test:
   - Go to Classes tab
   - Create new class with: ${TEST_CONFIG.testData.class.name}
   - Edit the class (add "Updated" to name)
   - Delete the class
   - Check console for GraphQL logs

🔍 What to Monitor:
- Look for "[GraphQL Server]" logs in console
- Look for "[ClassDbService]" logs in console  
- Check if "newClass.id:" shows a valid ID
- Check if "Class creation result:" shows success data
- Monitor for any ERROR messages

📊 Test Results:
- Report saved to: test-report.json
- Logs saved to: test-logs.json
- Press Ctrl+C to stop monitoring and generate report

⚠️  Important:
- All test data uses "TDD" prefix for easy identification
- Tests can be safely deleted as they don't affect production data
- Monitor console in real-time for immediate feedback
`;
}

// Main execution
async function main() {
  console.log(generateTestInstructions());
  
  const monitor = new ServerMonitor();
  
  try {
    await monitor.startServers();
    
    // Keep monitoring until user stops it
    console.log('🔍 Monitoring started. Press Ctrl+C to stop and generate report...');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...');
      await monitor.stopServers();
      
      const report = monitor.getLogMonitor().saveReport();
      console.log('\n📊 Final Test Report:');
      console.log(JSON.stringify(report, null, 2));
      
      console.log('\n✅ Test completed. Check test-report.json and test-logs.json for details.');
      process.exit(0);
    });
    
    // Keep the process running
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Monitor error:', error);
    await monitor.stopServers();
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ServerMonitor, LogMonitor, TEST_CONFIG, generateTestInstructions };
