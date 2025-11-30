/**
 * Quiz Randomization & Adaptive Testing (Phase 3.3)
 */

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Randomize question order
 */
export function randomizeQuestions(questions, studentId) {
  if (!questions || questions.length === 0) return [];
  
  // Use studentId as seed for consistent randomization per student
  const seed = studentId ? hashCode(studentId) : Math.random();
  Math.seedrandom = seed;
  
  return shuffleArray(questions);
}

/**
 * Randomize options within each question
 */
export function randomizeOptions(question, studentId) {
  if (!question.options || question.options.length === 0) return question;
  
  const seed = studentId ? hashCode(studentId + question.id) : Math.random();
  Math.seedrandom = seed;
  
  return {
    ...question,
    options: shuffleArray(question.options)
  };
}

/**
 * Select random questions from a pool
 */
export function selectFromPool(pool, count, difficulty = null) {
  let questions = [...pool];
  
  // Filter by difficulty if specified
  if (difficulty) {
    questions = questions.filter(q => q.difficulty === difficulty);
  }
  
  // Shuffle and take first N
  questions = shuffleArray(questions);
  return questions.slice(0, Math.min(count, questions.length));
}

/**
 * Adaptive testing - adjust difficulty based on performance
 */
export function getNextQuestion(questionPool, performanceHistory) {
  if (questionPool.length === 0) return null;
  
  // Calculate current performance
  const recentAnswers = performanceHistory.slice(-5);
  const recentCorrect = recentAnswers.filter(a => a.correct).length;
  const recentRate = recentAnswers.length > 0 ? recentCorrect / recentAnswers.length : 0.5;
  
  let targetDifficulty;
  if (recentRate >= 0.8) {
    targetDifficulty = 'hard';
  } else if (recentRate >= 0.5) {
    targetDifficulty = 'medium';
  } else {
    targetDifficulty = 'easy';
  }
  
  // Find questions of target difficulty
  let candidates = questionPool.filter(q => 
    q.difficulty === targetDifficulty && 
    !performanceHistory.some(h => h.questionId === q.id)
  );
  
  // Fallback to any difficulty if none available
  if (candidates.length === 0) {
    candidates = questionPool.filter(q => 
      !performanceHistory.some(h => h.questionId === q.id)
    );
  }
  
  // Return random question from candidates
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Branching logic - determine next question based on answer
 */
export function evaluateBranchingLogic(currentQuestion, answer, allQuestions) {
  if (!currentQuestion.branchingRules || currentQuestion.branchingRules.length === 0) {
    return null; // No branching, proceed normally
  }
  
  // Check each branching rule
  for (const rule of currentQuestion.branchingRules) {
    if (evaluateCondition(rule.condition, answer)) {
      const nextQ = allQuestions.find(q => q.id === rule.nextQuestionId);
      return nextQ || null;
    }
  }
  
  return null;
}

/**
 * Evaluate branching condition
 */
function evaluateCondition(condition, answer) {
  switch (condition.type) {
    case 'equals':
      return answer === condition.value;
    case 'contains':
      return Array.isArray(answer) && answer.includes(condition.value);
    case 'range':
      return answer >= condition.min && answer <= condition.max;
    default:
      return false;
  }
}

/**
 * Hash code for seeded randomization
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) / 2147483647; // Normalize to 0-1
}

/**
 * Generate personalized quiz for student
 */
export function generatePersonalizedQuiz(config) {
  const {
    questionPool,
    studentId,
    totalQuestions,
    randomizeOrder = true,
    randomizeOptions = true,
    useQuestionPools = false,
    poolConfig = {},
    adaptiveTesting = false
  } = config;
  
  let selectedQuestions = [];
  
  if (useQuestionPools) {
    // Select from pools with specified difficulty distribution
    const easyCount = poolConfig.easy || 0;
    const mediumCount = poolConfig.medium || 0;
    const hardCount = poolConfig.hard || 0;
    
    selectedQuestions = [
      ...selectFromPool(questionPool, easyCount, 'easy'),
      ...selectFromPool(questionPool, mediumCount, 'medium'),
      ...selectFromPool(questionPool, hardCount, 'hard')
    ];
  } else {
    // Simple random selection
    selectedQuestions = selectFromPool(questionPool, totalQuestions);
  }
  
  // Randomize question order
  if (randomizeOrder) {
    selectedQuestions = randomizeQuestions(selectedQuestions, studentId);
  }
  
  // Randomize options within each question
  if (randomizeOptions) {
    selectedQuestions = selectedQuestions.map(q => randomizeOptions(q, studentId));
  }
  
  return selectedQuestions;
}
