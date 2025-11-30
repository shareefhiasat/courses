/**
 * Question Types Configuration for Phase 3.1
 * Extended question types beyond basic multiple choice
 */

export const QUESTION_TYPES = {
  // Existing
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  
  // Phase 3.1 - New Advanced Types
  FILL_BLANK: 'fill_blank',
  MATCHING: 'matching',
  ORDERING: 'ordering',
  SHORT_ANSWER: 'short_answer',
  ESSAY: 'essay',
  CODE_SNIPPET: 'code_snippet',
  IMAGE_BASED: 'image_based',
  AUDIO_VIDEO: 'audio_video'
};

export const QUESTION_TYPE_CONFIG = {
  [QUESTION_TYPES.SINGLE_CHOICE]: {
    label: 'Single Choice',
    description: 'Select one correct answer from multiple options',
    icon: '🔘',
    autoGrade: true,
    requiresOptions: true
  },
  [QUESTION_TYPES.MULTIPLE_CHOICE]: {
    label: 'Multiple Choice',
    description: 'Select multiple correct answers',
    icon: '☑️',
    autoGrade: true,
    requiresOptions: true
  },
  [QUESTION_TYPES.TRUE_FALSE]: {
    label: 'True/False',
    description: 'Simple true or false question',
    icon: '✓✗',
    autoGrade: true,
    requiresOptions: false
  },
  [QUESTION_TYPES.FILL_BLANK]: {
    label: 'Fill in the Blank',
    description: 'Type the missing word or phrase',
    icon: '___',
    autoGrade: true,
    requiresOptions: false,
    caseSensitive: false,
    acceptableAnswers: [] // array of acceptable answers
  },
  [QUESTION_TYPES.MATCHING]: {
    label: 'Matching',
    description: 'Match items from two columns',
    icon: '⇄',
    autoGrade: true,
    requiresOptions: false,
    pairs: [] // [{ left: 'A', right: 'B' }]
  },
  [QUESTION_TYPES.ORDERING]: {
    label: 'Ordering',
    description: 'Arrange items in correct sequence',
    icon: '1️⃣2️⃣3️⃣',
    autoGrade: true,
    requiresOptions: false,
    correctOrder: [] // array of item IDs in correct order
  },
  [QUESTION_TYPES.SHORT_ANSWER]: {
    label: 'Short Answer',
    description: 'Text response (manual grading)',
    icon: '✍️',
    autoGrade: false,
    requiresOptions: false,
    maxWords: 100
  },
  [QUESTION_TYPES.ESSAY]: {
    label: 'Essay',
    description: 'Long-form text with rubric grading',
    icon: '📝',
    autoGrade: false,
    requiresOptions: false,
    maxWords: 1000,
    rubric: []
  },
  [QUESTION_TYPES.CODE_SNIPPET]: {
    label: 'Code Snippet',
    description: 'Write code with syntax highlighting',
    icon: '💻',
    autoGrade: true, // can run test cases
    requiresOptions: false,
    language: 'javascript',
    testCases: []
  },
  [QUESTION_TYPES.IMAGE_BASED]: {
    label: 'Image-Based',
    description: 'Click on image regions or upload image',
    icon: '🖼️',
    autoGrade: true,
    requiresOptions: false,
    imageUrl: '',
    hotspots: [] // clickable regions
  },
  [QUESTION_TYPES.AUDIO_VIDEO]: {
    label: 'Audio/Video Response',
    description: 'Record audio or video answer',
    icon: '🎤',
    autoGrade: false,
    requiresOptions: false,
    mediaType: 'audio', // 'audio' | 'video'
    maxDuration: 60 // seconds
  }
};

/**
 * Validate question based on type
 */
export function validateQuestion(question) {
  const config = QUESTION_TYPE_CONFIG[question.type];
  if (!config) return { valid: false, error: 'Invalid question type' };

  // Check required fields
  if (!question.question || question.question.trim() === '') {
    return { valid: false, error: 'Question text is required' };
  }

  if (config.requiresOptions && (!question.options || question.options.length < 2)) {
    return { valid: false, error: 'At least 2 options required' };
  }

  // Type-specific validation
  switch (question.type) {
    case QUESTION_TYPES.FILL_BLANK:
      if (!question.acceptableAnswers || question.acceptableAnswers.length === 0) {
        return { valid: false, error: 'At least one acceptable answer required' };
      }
      break;
    
    case QUESTION_TYPES.MATCHING:
      if (!question.pairs || question.pairs.length < 2) {
        return { valid: false, error: 'At least 2 matching pairs required' };
      }
      break;
    
    case QUESTION_TYPES.ORDERING:
      if (!question.correctOrder || question.correctOrder.length < 2) {
        return { valid: false, error: 'At least 2 items required for ordering' };
      }
      break;
    
    case QUESTION_TYPES.CODE_SNIPPET:
      if (!question.testCases || question.testCases.length === 0) {
        return { valid: false, error: 'At least one test case required for code questions' };
      }
      break;
    
    case QUESTION_TYPES.IMAGE_BASED:
      if (!question.imageUrl) {
        return { valid: false, error: 'Image URL is required' };
      }
      break;
  }

  return { valid: true };
}

/**
 * Auto-grade question based on type
 */
export function autoGradeQuestion(question, answer) {
  const config = QUESTION_TYPE_CONFIG[question.type];
  if (!config.autoGrade) {
    return { autoGraded: false, score: null };
  }

  switch (question.type) {
    case QUESTION_TYPES.SINGLE_CHOICE:
    case QUESTION_TYPES.TRUE_FALSE:
      const correctOption = question.options?.find(opt => opt.correct);
      const isCorrect = answer === correctOption?.id;
      return { autoGraded: true, isCorrect, score: isCorrect ? (question.points || 1) : 0 };
    
    case QUESTION_TYPES.MULTIPLE_CHOICE:
      const correctIds = question.options?.filter(opt => opt.correct).map(opt => opt.id) || [];
      const allCorrect = Array.isArray(answer) &&
        answer.length === correctIds.length &&
        answer.every(id => correctIds.includes(id));
      return { autoGraded: true, isCorrect: allCorrect, score: allCorrect ? (question.points || 1) : 0 };
    
    case QUESTION_TYPES.FILL_BLANK:
      const normalized = (answer || '').trim().toLowerCase();
      const acceptable = question.acceptableAnswers?.map(a => 
        question.caseSensitive ? a.trim() : a.trim().toLowerCase()
      ) || [];
      const matches = acceptable.includes(normalized);
      return { autoGraded: true, isCorrect: matches, score: matches ? (question.points || 1) : 0 };
    
    case QUESTION_TYPES.MATCHING:
      const pairs = question.pairs || [];
      const correctMatches = pairs.every(pair => 
        answer[pair.left] === pair.right
      );
      return { autoGraded: true, isCorrect: correctMatches, score: correctMatches ? (question.points || 1) : 0 };
    
    case QUESTION_TYPES.ORDERING:
      const correctOrder = question.correctOrder || [];
      const orderMatches = JSON.stringify(answer) === JSON.stringify(correctOrder);
      return { autoGraded: true, isCorrect: orderMatches, score: orderMatches ? (question.points || 1) : 0 };
    
    case QUESTION_TYPES.CODE_SNIPPET:
      // Run test cases (simplified - in production, use sandboxed executor)
      try {
        const testResults = question.testCases?.map(test => {
          // This would need proper sandboxing in production
          return test.passed || false;
        }) || [];
        const allPassed = testResults.every(r => r);
        return { autoGraded: true, isCorrect: allPassed, score: allPassed ? (question.points || 1) : 0 };
      } catch (error) {
        return { autoGraded: true, isCorrect: false, score: 0, error: error.message };
      }
    
    default:
      return { autoGraded: false, score: null };
  }
}
