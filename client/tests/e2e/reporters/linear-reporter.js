/**
 * Custom Playwright Reporter — Linear Integration
 *
 * On test failure, creates or updates a Linear issue with:
 * - Test case ID (extracted from test title, e.g., "TC-PROG-006: ...")
 * - Error message and stack trace
 * - Link to Allure report (if configured)
 * - Screenshot path (if available)
 *
 * Configuration (in playwright.config.js):
 *   reporter: [
 *     ...,
 *     ['../tests/e2e/reporters/linear-reporter.js', {
 *       teamKey: 'SHA',           // Linear team key
 *       labels: ['qa', 'bug'],    // Labels to apply
 *       allureUrl: 'http://localhost:5050',  // Optional Allure server URL
 *       dryRun: true,             // Set false to actually create issues
 *     }]
 *   ]
 *
 * Environment variables (optional):
 *   LINEAR_API_KEY - Linear personal API key
 *   LINEAR_TEAM_KEY - Team key override (e.g., SHA)
 */
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

// Load .env file from client root (no dotenv dependency needed)
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

const LINEAR_API_URL = 'https://api.linear.app/graphql';

function extractTestId(title) {
  const match = title.match(/(TC-[A-Z]+-\d+[a-z]?)/i);
  return match ? match[1] : null;
}

function sanitizeForLinear(text) {
  // Truncate to reasonable length for Linear
  const max = 5000;
  if (text.length > max) return text.slice(0, max) + '\n... (truncated)';
  return text;
}

class LinearReporter {
  constructor(options = {}) {
    this.teamKey = options.teamKey || process.env.LINEAR_TEAM_KEY || 'SHA';
    this.labels = options.labels || ['qa'];
    this.allureUrl = options.allureUrl || '';
    this.dryRun = options.dryRun !== false; // Default to dry-run for safety
    this.apiKey = process.env.LINEAR_API_KEY || '';
    this.failedTests = [];
    this.outputDir = './test-results/reports';
  }

  onTestEnd(test, result) {
    if (result.status === 'failed' || result.status === 'broken') {
      const testId = extractTestId(test.title);
      this.failedTests.push({
        testId: testId || 'UNKNOWN',
        title: test.title,
        file: test.location?.file || '',
        error: result.error?.message || 'No error message',
        stack: result.error?.stack || '',
        duration: result.duration,
        retry: result.retry || 0,
        screenshotPath: result.attachments?.find(a => a.name === 'screenshot')?.path || '',
      });
    }
  }

  async onEnd(result) {
    if (this.failedTests.length === 0) {
      console.log('[linear-reporter] No failures — skipping Linear sync.');
      return;
    }

    // Always write a summary file
    const summaryPath = join(this.outputDir, 'linear-failures.json');
    if (!existsSync(this.outputDir)) mkdirSync(this.outputDir, { recursive: true });
    writeFileSync(summaryPath, JSON.stringify(this.failedTests, null, 2));
    console.log(`[linear-reporter] Failure summary written to ${summaryPath}`);

    if (this.dryRun || !this.apiKey) {
      console.log(`[linear-reporter] DRY RUN — ${this.failedTests.length} failures would create/update Linear issues.`);
      console.log('[linear-reporter] Set LINEAR_API_KEY env and dryRun: false to enable issue creation.');
      this.failedTests.forEach(t => {
        console.log(`  - ${t.testId}: ${t.title.slice(0, 80)}`);
      });
      return;
    }

    // Actually create/update Linear issues
    for (const failure of this.failedTests) {
      try {
        await this.createOrUpdateLinearIssue(failure);
      } catch (err) {
        console.warn(`[linear-reporter] Failed to sync ${failure.testId}: ${err.message}`);
      }
    }
  }

  async createOrUpdateLinearIssue(failure) {
    const title = `[${failure.testId}] ${failure.title.slice(0, 100)}`;
    const description = this.buildDescription(failure);

    // Search for existing issue with this test ID
    const searchQuery = `
      query {
        issues(filter: { search: "${failure.testId}" }) {
          nodes { id identifier title state { name } }
        }
      }`;

    const searchRes = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: searchQuery }),
    });

    const searchData = await searchRes.json();
    const existing = searchData?.data?.issues?.nodes?.[0];

    if (existing) {
      // Add a comment with the latest failure info
      const commentMutation = `
        mutation {
          commentCreate(input: {
            issueId: "${existing.id}"
            body: "${sanitizeForLinear(description).replace(/"/g, '\\"').replace(/\n/g, '\\n')}"
          }) { success comment { id } }
        }`;
      await fetch(LINEAR_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: commentMutation }),
      });
      console.log(`[linear-reporter] Updated ${existing.identifier} with latest failure.`);
    } else {
      // Create new issue
      const createMutation = `
        mutation {
          issueCreate(input: {
            teamId: "${this.teamKey}"
            title: "${title.replace(/"/g, '\\"')}"
            description: "${sanitizeForLinear(description).replace(/"/g, '\\"').replace(/\n/g, '\\n')}"
            labels: [${this.labels.map(l => `"${l}"`).join(', ')}]
          }) { success issue { id identifier } }
        }`;
      const createRes = await fetch(LINEAR_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: createMutation }),
      });
      const createData = await createRes.json();
      const newIssue = createData?.data?.issueCreate?.issue;
      if (newIssue) {
        console.log(`[linear-reporter] Created ${newIssue.identifier} for ${failure.testId}.`);
      }
    }
  }

  buildDescription(failure) {
    const lines = [
      `**Test Case:** ${failure.testId}`,
      `**Test:** ${failure.title}`,
      `**File:** ${failure.file}`,
      `**Duration:** ${failure.duration}ms`,
      `**Retry:** ${failure.retry}`,
      '',
      '### Error',
      '```',
      failure.error,
      '```',
      '',
    ];

    if (failure.stack) {
      lines.push('### Stack Trace', '```', failure.stack.slice(0, 2000), '```', '');
    }

    if (failure.screenshotPath) {
      lines.push(`### Screenshot`, `Saved at: ${failure.screenshotPath}`, '');
    }

    if (this.allureUrl) {
      lines.push(`### Allure Report`, `${this.allureUrl}/allure-docker-service/projects/lms-e2e/reports/latest/index.html`, '');
    }

    lines.push('---', '*This issue was auto-created by the Playwright Linear reporter.*');

    return lines.join('\n');
  }
}

export default LinearReporter;
