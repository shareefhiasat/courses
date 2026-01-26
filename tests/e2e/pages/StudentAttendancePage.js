/**
 * Page Object for Student Attendance (QR Scanner)
 * File: client/src/pages/StudentAttendancePage.jsx
 */
import { BASE_URL, PATHS, TIMEOUTS } from '../config/constants.js';

export class StudentAttendancePage {
  constructor(page) {
    this.page = page;
    // QR Scanner
    this.cameraContainer = page.locator('#qr-reader-container, [data-testid="qr-scanner"]');
    this.cameraVideo = page.locator('video, #qr-reader-container video');
    this.scanningIndicator = page.locator('[data-testid="scanning"], .scanning-indicator');
    
    // Manual entry
    this.manualCodeInput = page.locator('input[name="manualCode"], input[placeholder*="Enter code"]');
    this.manualCodeSubmit = page.locator('button:has-text("Submit"), button:has-text("Mark Attendance")');
    
    // Status selection
    this.statusSelect = page.locator('select[name="status"], select[name="attendanceStatus"]');
    this.presentOption = page.locator('option[value="present"], option:has-text("Present")');
    this.leaveOption = page.locator('option[value="leave"], option:has-text("Leave")');
    
    // Leave reason (if status is leave)
    this.reasonSelect = page.locator('select[name="reason"], select[name="leaveReason"]');
    this.reasonMedical = page.locator('option[value="medical"], option:has-text("Medical")');
    this.reasonOfficial = page.locator('option[value="official"], option:has-text("Official")');
    this.reasonOther = page.locator('option[value="other"], option:has-text("Other")');
    this.noteInput = page.locator('textarea[name="note"], textarea[placeholder*="Note"]');
    
    // Messages
    this.successMessage = page.locator('.toast-success, .success-message, [role="alert"]:has-text("success")');
    this.errorMessage = page.locator('.toast-error, .error-message, [role="alert"]:has-text("error")');
    
    // Attendance history
    this.attendanceHistory = page.locator('[data-testid="attendance-history"], .attendance-list');
    this.attendanceRecords = page.locator('.attendance-record, [data-testid="attendance-record"]');
  }

  async goto(sessionId = null, token = null) {
    if (sessionId && token) {
      await this.page.goto(BASE_URL + `/my-attendance?sid=${sessionId}&t=${token}`);
    } else {
      await this.page.goto(BASE_URL + '/my-attendance');
    }
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(TIMEOUTS.PAGE_LOAD);
  }

  async enterManualCode(code, status = 'present', reason = null, note = null) {
    await this.manualCodeInput.fill(code);
    await this.statusSelect.selectOption(status);
    
    if (status === 'leave') {
      if (reason) {
        await this.reasonSelect.selectOption(reason);
      }
      if (note) {
        await this.noteInput.fill(note);
      }
    }
    
    await this.manualCodeSubmit.click();
  }

  async waitForSuccess() {
    await this.successMessage.waitFor({ timeout: 10000 });
  }

  async waitForError() {
    await this.errorMessage.waitFor({ timeout: 10000 });
  }

  async getSuccessMessage() {
    return await this.successMessage.textContent();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }

  async isCameraActive() {
    return await this.cameraVideo.isVisible();
  }

  async grantCameraPermission() {
    // In Playwright, we can grant permissions via context
    // This is handled in test setup, not in page object
  }

  async getAttendanceHistory() {
    await this.attendanceHistory.waitFor({ timeout: 5000 }).catch(() => {});
    const records = await this.attendanceRecords.all();
    return records.length;
  }
}
