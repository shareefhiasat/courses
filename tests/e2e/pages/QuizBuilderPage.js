/**
 * Page Object for Quiz Builder
 * File: client/src/pages/QuizBuilderPage.jsx
 */
import { BASE_URL, PATHS, TIMEOUTS } from '../config/constants.js';

export class QuizBuilderPage {
  constructor(page) {
    this.page = page;
    // Quiz metadata
    this.titleInput = page.locator('input[name="title"], input[placeholder*="Title"]');
    this.titleArInput = page.locator('input[name="title_ar"], input[placeholder*="Title (Arabic)"]');
    this.descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="Description"]');
    
    // Question management
    this.addQuestionButton = page.locator('button:has-text("Add Question"), button:has-text("New Question")');
    this.questionTypeSelect = page.locator('select[name="questionType"], select[name="type"]');
    this.questionTextInput = page.locator('textarea[name="question"], textarea[placeholder*="Question"]');
    
    // Options (for multiple choice)
    this.addOptionButton = page.locator('button:has-text("Add Option"), button:has-text("+ Option")');
    this.optionInputs = page.locator('input[name*="option"], input[placeholder*="Option"]');
    this.correctAnswerCheckbox = page.locator('input[type="checkbox"][name*="correct"]');
    
    // Settings
    this.timeLimitInput = page.locator('input[name="timeLimit"], input[name="time_limit"]');
    this.allowRetakeCheckbox = page.locator('input[name="allowRetake"], input[type="checkbox"]:near(:text("Allow Retake"))');
    this.shuffleQuestionsCheckbox = page.locator('input[name="shuffleQuestions"], input[type="checkbox"]:near(:text("Shuffle"))');
    
    // Assignment
    this.assignToClassSelect = page.locator('select[name="classId"], select[name="assignedClassIds"]');
    this.deadlineInput = page.locator('input[name="deadline"], input[type="date"]');
    
    // Actions
    this.saveButton = page.locator('button:has-text("Save"), button:has-text("Save Quiz")');
    this.previewButton = page.locator('button:has-text("Preview")');
    this.cancelButton = page.locator('button:has-text("Cancel")');
  }

  async goto() {
    await this.page.goto(BASE_URL + '/quiz-builder');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(TIMEOUTS.PAGE_LOAD);
  }

  async createBasicQuiz(title, description) {
    await this.titleInput.fill(title);
    if (description) {
      await this.descriptionInput.fill(description);
    }
  }

  async addQuestion(type, questionData) {
    await this.addQuestionButton.click();
    await this.page.waitForTimeout(500);
    
    if (this.questionTypeSelect.isVisible()) {
      await this.questionTypeSelect.selectOption(type);
    }
    
    await this.questionTextInput.fill(questionData.text);
    
    // Add options for multiple choice
    if (type === 'multiple_choice' && questionData.options) {
      for (let i = 0; i < questionData.options.length; i++) {
        if (i > 0) {
          await this.addOptionButton.click();
        }
        const optionInput = this.optionInputs.nth(i);
        await optionInput.fill(questionData.options[i].text);
        
        if (questionData.options[i].correct) {
          const checkbox = this.correctAnswerCheckbox.nth(i);
          await checkbox.check();
        }
      }
    }
  }

  async configureSettings(settings) {
    if (settings.timeLimit) {
      await this.timeLimitInput.fill(settings.timeLimit.toString());
    }
    if (settings.allowRetake !== undefined) {
      await this.allowRetakeCheckbox.setChecked(settings.allowRetake);
    }
    if (settings.shuffleQuestions !== undefined) {
      await this.shuffleQuestionsCheckbox.setChecked(settings.shuffleQuestions);
    }
  }

  async assignToClass(classId, deadline = null) {
    await this.assignToClassSelect.selectOption(classId);
    if (deadline) {
      await this.deadlineInput.fill(deadline);
    }
  }

  async saveQuiz() {
    await this.saveButton.click();
    await this.page.waitForSelector('.toast-success, .success-message', { timeout: 10000 }).catch(() => {});
  }

  async waitForSaveSuccess() {
    await this.page.waitForSelector('.toast-success', { timeout: 10000 });
  }
}
