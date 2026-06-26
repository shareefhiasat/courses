/**
 * Allure Enricher — post-processes allure-results JSON files to add:
 * - Labels: testType (API/UI), module, testCaseId
 * - Tags: API, UI, module name
 * - Description: business story context
 * - Links: Linear issue link if test case ID matches
 *
 * Run after tests, before `allure generate`.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'fs';
import { join, resolve, basename } from 'path';

const ROOT = resolve(process.cwd());
const ALLURE_RESULTS = join(ROOT, 'allure-results');
const CONFIG_DIR = join(ROOT, 'tests', 'e2e', 'config');

// Business story descriptions per module
const BUSINESS_STORIES = {
  auth: 'Authentication & Authorization — Users can securely log in via Keycloak, access role-appropriate pages, and are redirected when unauthorized.',
  activities: 'Activities Management — Instructors and admins can create, edit, search, filter, and delete learning activities for classes and programs.',
  announcements: 'Announcements — Staff can publish announcements targeted at programs, classes, or all users; students can view relevant announcements.',
  attendance: 'Attendance Tracking — Instructors can mark daily attendance, export reports, and view attendance statistics for their classes.',
  chat: 'Chat & Messaging — Users can send and receive messages in class-based chat channels for communication.',
  classes: 'Class Management — Admins can create, assign instructors, enroll students, and manage class schedules and details.',
  dashboard: 'Dashboard — Role-based landing pages showing relevant widgets, stats, and quick actions for each user type.',
  drive: 'File Manager (Drive) — Users can upload, organize, share, and manage files via MinIO-backed storage with folder hierarchies.',
  enrollments: 'Enrollments — Admins can enroll students into programs and classes, manage enrollment status, and track enrollment history.',
  marks: 'Marks & Grades — Instructors can enter, edit, and publish student grades; students can view their published grades.',
  notifications: 'Notifications — System-generated notifications for announcements, assignments, and events; users can view and dismiss them.',
  penalties: 'Penalties Management — Staff can create, assign, and track student penalties with severity levels and reasons.',
  programs: 'Programs Management — Admins can create, edit, and manage academic programs with subjects, classes, and enrollment rules.',
  quizzes: 'Quizzes & Assessments — Instructors can create quizzes with questions, assign to classes, and review student submissions.',
  resources: 'Resources & Participations — Upload and manage learning resources; track student participation and behavior records.',
  scheduling: 'Scheduling & Availability — Manage class schedules, room availability, and time slot conflicts for instructors and rooms.',
  subjects: 'Subjects Management — Create and manage academic subjects with codes, credits, and program assignments.',
  users: 'User Management — Admins can create, edit, assign roles, and manage user accounts with scope-based permissions.',
  workflow: 'Workflow Documents — Manage and track workflow documents with approval states and document lifecycle.',
  rbac: 'Role-Based Access Control — Verify that each role (student, instructor, admin, super-admin) has correct API and page access.',
  analytics: 'Analytics — View aggregate statistics on student performance, attendance trends, and engagement metrics.',
  profile: 'User Profile — Users can view and edit their profile information, change password, and manage preferences.',
  global: 'Global Pages — Home page, 404 pages, and misc routes that should load correctly for all user roles.',
  'ui-misc': 'UI Misc — Dark mode toggle and Arabic/RTL layout support across the application.',
};

// Module display names
const MODULE_NAMES = {
  auth: 'Authentication',
  activities: 'Activities',
  announcements: 'Announcements',
  attendance: 'Attendance',
  chat: 'Chat',
  classes: 'Classes',
  dashboard: 'Dashboard',
  drive: 'Drive / File Manager',
  enrollments: 'Enrollments',
  marks: 'Marks & Grades',
  notifications: 'Notifications',
  penalties: 'Penalties',
  programs: 'Programs',
  quizzes: 'Quizzes',
  resources: 'Resources & Participations',
  scheduling: 'Scheduling',
  subjects: 'Subjects',
  users: 'User Management',
  workflow: 'Workflow Documents',
  rbac: 'RBAC / Roles',
  analytics: 'Analytics',
  profile: 'Profile',
  global: 'Global Pages',
  'ui-misc': 'UI Misc (Dark Mode / RTL)',
};

function extractModule(filePath) {
  if (!filePath) return null;
  const base = basename(filePath);
  const match = base.match(/^([a-z-]+)-(api|ui)\./i);
  if (match) return { module: match[1], type: match[2].toUpperCase() };
  // Try to guess from filename
  for (const key of Object.keys(BUSINESS_STORIES)) {
    if (base.includes(key)) return { module: key, type: 'Other' };
  }
  return null;
}

function extractTestCaseId(title) {
  if (!title) return null;
  const match = title.match(/(TC-[A-Z]+-\d+[a-z]?)/i);
  return match ? match[1] : null;
}

function enrich() {
  if (!existsSync(ALLURE_RESULTS)) {
    console.log('[allure-enricher] allure-results directory not found, skipping');
    return;
  }

  // Copy environment.properties and categories.json
  mkdirSync(ALLURE_RESULTS, { recursive: true });
  const envSrc = join(CONFIG_DIR, 'allure-environment.properties');
  if (existsSync(envSrc)) {
    copyFileSync(envSrc, join(ALLURE_RESULTS, 'environment.properties'));
  }
  const catSrc = join(CONFIG_DIR, 'allure-categories.json');
  if (existsSync(catSrc)) {
    copyFileSync(catSrc, join(ALLURE_RESULTS, 'categories.json'));
  }

  const files = readdirSync(ALLURE_RESULTS).filter(f => f.endsWith('-result.json'));
  let enriched = 0;

  for (const file of files) {
    const filePath = join(ALLURE_RESULTS, file);
    try {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'));

      // Extract info from test name and labels
      const fullName = data.fullName || '';
      const name = data.name || '';
      const title = name;

      // Try to find the source file path from labels
      const packageLabel = data.labels?.find(l => l.name === 'package');
      const sourceFilePath = packageLabel?.value || fullName;

      const modInfo = extractModule(sourceFilePath);
      const testCaseId = extractTestCaseId(title);

      // Add labels
      if (!data.labels) data.labels = [];

      // Add testType label (API/UI)
      if (modInfo) {
        data.labels.push({ name: 'testType', value: modInfo.type });
        data.labels.push({ name: 'module', value: modInfo.module });
        data.labels.push({ name: 'moduleName', value: MODULE_NAMES[modInfo.module] || modInfo.module });

        // Add as tag too (for Allure "Tags" tab)
        if (!data.tags) data.tags = [];
        if (!data.tags.includes(modInfo.type)) data.tags.push(modInfo.type);
        if (!data.tags.includes(modInfo.module)) data.tags.push(modInfo.module);
      }

      // Add test case ID as tag and label
      if (testCaseId) {
        if (!data.tags) data.tags = [];
        if (!data.tags.includes(testCaseId)) data.tags.push(testCaseId);
        data.labels.push({ name: 'testCaseId', value: testCaseId });
      }

      // Add business story description
      if (modInfo && BUSINESS_STORIES[modInfo.module]) {
        if (!data.description) {
          data.description = BUSINESS_STORIES[modInfo.module];
        } else if (!data.description.includes('Business Story:')) {
          data.description = `Business Story: ${BUSINESS_STORIES[modInfo.module]}\n\n${data.description}`;
        }
      }

      // Add Linear link if test case ID exists
      if (testCaseId) {
        if (!data.links) data.links = [];
        const hasLinearLink = data.links.some(l => l.url?.includes('linear.app'));
        if (!hasLinearLink) {
          data.links.push({
            name: `${testCaseId} in Linear`,
            url: `https://linear.app/shareefhiasat/issue/${testCaseId}`,
            type: 'issue',
          });
        }
      }

      writeFileSync(filePath, JSON.stringify(data, null, 2));
      enriched++;
    } catch (err) {
      // Skip files that can't be parsed
    }
  }

  console.log(`[allure-enricher] Enriched ${enriched} test result files with labels, tags, and descriptions`);
}

enrich();
