/**
 * Page Object for Instructor Attendance Management
 * File: client/src/pages/AttendancePage.jsx
 */
import { BASE_URL, PATHS, TIMEOUTS } from '../config/constants.js';

export class AttendancePage {
  constructor(page) {
    this.page = page;
    // Class selection
    this.classSelect = page.locator('select[name="classId"], select[name="class"]');
    this.selectedClass = page.locator('[data-testid="selected-class"], .selected-class');
    
    // Session management
    this.startSessionButton = page.locator('button:has-text("Start Session"), button:has-text("Start")');
    this.endSessionButton = page.locator('button:has-text("End Session"), button:has-text("End")');
    this.sessionStatus = page.locator('[data-testid="session-status"], .session-status');
    
    // QR Code display
    this.qrCodeContainer = page.locator('[data-testid="qr-code"], .qr-code-container, canvas');
    this.qrCodeImage = page.locator('img[alt*="QR"], canvas');
    this.manualCodeDisplay = page.locator('[data-testid="manual-code"], .manual-code');
    
    // Student link
    this.copyLinkButton = page.locator('button:has-text("Copy Link"), button:has-text("Copy Student Link")');
    
    // Real-time stats
    this.scanCount = page.locator('[data-testid="scan-count"], .scan-count');
    this.totalStudents = page.locator('[data-testid="total-students"], .total-students');
    
    // Late mode
    this.lateModeToggle = page.locator('input[type="checkbox"][name*="late"], button:has-text("Late Mode")');
    this.enableLateModeButton = page.locator('button:has-text("Enable Late Mode")');
    
    // Export
    this.exportButton = page.locator('button:has-text("Export"), button:has-text("Export CSV")');
    
    // Session list
    this.sessionList = page.locator('[data-testid="session-list"], .session-list');
    this.sessionItems = page.locator('.session-item, [data-testid="session-item"]');
  }

  async goto() {
    await this.page.goto(BASE_URL + '/attendance');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(TIMEOUTS.PAGE_LOAD);
  }

  async selectClass(className) {
    await this.classSelect.selectOption({ label: className });
    await this.page.waitForTimeout(500);
  }

  async startSession() {
    await this.startSessionButton.click();
    await this.page.waitForTimeout(2000); // Wait for QR code generation
  }

  async endSession() {
    await this.endSessionButton.click();
    await this.page.waitForTimeout(1000);
  }

  async enableLateMode() {
    if (await this.enableLateModeButton.isVisible()) {
      await this.enableLateModeButton.click();
    } else {
      await this.lateModeToggle.check();
    }
  }

  async getQRCode() {
    // QR code might be in canvas or img
    const qrCode = this.qrCodeImage.first();
    return await qrCode.isVisible();
  }

  async getManualCode() {
    return await this.manualCodeDisplay.textContent();
  }

  async getScanCount() {
    const text = await this.scanCount.textContent();
    return parseInt(text.match(/\d+/)?.[0] || '0');
  }

  async copyStudentLink() {
    await this.copyLinkButton.click();
    // Link is copied to clipboard, can't directly read in Playwright
    // But we can verify the button state changed
    await this.page.waitForTimeout(500);
  }

  async exportCSV() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.exportButton.click()
    ]);
    return download;
  }

  async isSessionActive() {
    const status = await this.sessionStatus.textContent();
    return status?.toLowerCase().includes('open') || status?.toLowerCase().includes('active');
  }
}
