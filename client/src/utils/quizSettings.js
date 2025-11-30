/**
 * Enhanced Quiz Settings (Phase 3.5)
 * Scheduling, attempts, proctoring, accessibility, gamification
 */

/**
 * Default quiz settings
 */
export const DEFAULT_QUIZ_SETTINGS = {
  // Timing
  timeLimit: 30, // minutes, 0 = unlimited
  availableFrom: null, // Date
  availableTo: null, // Date
  dueDate: null, // Date
  
  // Attempts
  maxAttempts: 1,
  attemptsScoring: 'highest', // 'highest' | 'average' | 'last' | 'first'
  timeBetweenAttempts: 0, // minutes
  
  // Display
  questionsPerPage: 1,
  showProgressBar: true,
  showQuestionNumbers: true,
  allowNavigation: true,
  allowReview: true,
  
  // Feedback
  showAnswers: false,
  showAnswersWhen: 'after_submission', // 'never' | 'after_submission' | 'after_due_date'
  showExplanations: true,
  showScore: true,
  showCorrectAnswers: false,
  instantFeedback: false,
  
  // Grading
  passingScore: 70, // percentage
  partialCredit: false,
  
  // Proctoring
  requireWebcam: false,
  lockBrowser: false,
  detectTabSwitch: false,
  requirePassword: false,
  password: '',
  ipRestrictions: [],
  
  // Accessibility
  screenReaderSupport: true,
  keyboardNavigation: true,
  highContrastMode: false,
  textToSpeech: false,
  allowExtraTime: false,
  extraTimePercentage: 50,
  
  // Collaboration
  allowGroupWork: false,
  groupSize: 1,
  peerReview: false,
  
  // Gamification
  enableBadges: false,
  showLeaderboard: false,
  bonusPoints: 0,
  streakBonus: false,
  
  // Randomization
  randomizeQuestions: false,
  randomizeOptions: false,
  useQuestionPools: false
};

/**
 * Validate quiz availability
 */
export function isQuizAvailable(settings) {
  const now = new Date();
  
  if (settings.availableFrom && new Date(settings.availableFrom) > now) {
    return { 
      available: false, 
      reason: 'not_started',
      availableFrom: settings.availableFrom 
    };
  }
  
  if (settings.availableTo && new Date(settings.availableTo) < now) {
    return { 
      available: false, 
      reason: 'ended',
      endedAt: settings.availableTo 
    };
  }
  
  return { available: true };
}

/**
 * Check if student can attempt quiz
 */
export function canAttemptQuiz(settings, studentAttempts) {
  // Check max attempts
  if (settings.maxAttempts > 0 && studentAttempts.length >= settings.maxAttempts) {
    return { 
      allowed: false, 
      reason: 'max_attempts_reached',
      remaining: 0 
    };
  }
  
  // Check time between attempts
  if (settings.timeBetweenAttempts > 0 && studentAttempts.length > 0) {
    const lastAttempt = studentAttempts[studentAttempts.length - 1];
    const lastAttemptTime = new Date(lastAttempt.completedAt);
    const nextAllowedTime = new Date(lastAttemptTime.getTime() + settings.timeBetweenAttempts * 60000);
    
    if (new Date() < nextAllowedTime) {
      return { 
        allowed: false, 
        reason: 'cooldown',
        nextAttempt: nextAllowedTime 
      };
    }
  }
  
  return { 
    allowed: true,
    remaining: settings.maxAttempts > 0 ? settings.maxAttempts - studentAttempts.length : -1
  };
}

/**
 * Calculate final score based on attempt scoring method
 */
export function calculateFinalScore(settings, attempts) {
  if (attempts.length === 0) return 0;
  
  const scores = attempts.map(a => a.percentage || 0);
  
  switch (settings.attemptsScoring) {
    case 'highest':
      return Math.max(...scores);
    case 'average':
      return scores.reduce((sum, s) => sum + s, 0) / scores.length;
    case 'last':
      return scores[scores.length - 1];
    case 'first':
      return scores[0];
    default:
      return Math.max(...scores);
  }
}

/**
 * Check if answers should be shown
 */
export function shouldShowAnswers(settings, submittedAt) {
  if (!settings.showAnswers) return false;
  
  switch (settings.showAnswersWhen) {
    case 'never':
      return false;
    case 'after_submission':
      return !!submittedAt;
    case 'after_due_date':
      return settings.dueDate && new Date() > new Date(settings.dueDate);
    default:
      return false;
  }
}

/**
 * Apply proctoring settings
 */
export async function initializeProctoring(settings) {
  const proctoring = {
    enabled: false,
    webcam: null,
    tabSwitches: 0,
    violations: []
  };
  
  try {
    // Request webcam if required
    if (settings.requireWebcam) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      proctoring.webcam = stream;
      proctoring.enabled = true;
    }
    
    // Detect tab switches
    if (settings.detectTabSwitch) {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          proctoring.tabSwitches++;
          proctoring.violations.push({
            type: 'tab_switch',
            timestamp: new Date()
          });
        }
      });
      proctoring.enabled = true;
    }
    
    // Lock browser (fullscreen)
    if (settings.lockBrowser) {
      await document.documentElement.requestFullscreen();
      proctoring.enabled = true;
    }
    
    return { success: true, data: proctoring };
  } catch (error) {
    console.error('Error initializing proctoring:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Release proctoring resources
 */
export function releaseProctoring(proctoring) {
  if (proctoring.webcam) {
    proctoring.webcam.getTracks().forEach(track => track.stop());
  }
  
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
}

/**
 * Apply accessibility settings
 */
export function applyAccessibilitySettings(settings) {
  const root = document.documentElement;
  
  if (settings.highContrastMode) {
    root.setAttribute('data-theme', 'high-contrast');
  }
  
  if (settings.screenReaderSupport) {
    root.setAttribute('aria-live', 'polite');
  }
  
  // Adjust time limit for students needing extra time
  if (settings.allowExtraTime) {
    const extraTime = settings.timeLimit * (settings.extraTimePercentage / 100);
    return settings.timeLimit + extraTime;
  }
  
  return settings.timeLimit;
}

/**
 * Calculate gamification rewards
 */
export function calculateRewards(submission, settings, previousAttempts) {
  const rewards = {
    points: submission.score,
    badges: [],
    bonuses: []
  };
  
  // Bonus points
  if (settings.bonusPoints > 0) {
    rewards.bonuses.push({
      type: 'completion',
      points: settings.bonusPoints,
      description: 'Completion bonus'
    });
    rewards.points += settings.bonusPoints;
  }
  
  // Perfect score badge
  if (submission.percentage === 100) {
    rewards.badges.push({
      id: 'perfect_score',
      name: 'Perfect Score',
      icon: '🏆',
      description: 'Achieved 100% on this quiz'
    });
  }
  
  // Fast completion
  const avgTime = 30; // Would calculate from all submissions
  if (submission.timeSpent < avgTime * 0.5) {
    rewards.badges.push({
      id: 'speed_demon',
      name: 'Speed Demon',
      icon: '⚡',
      description: 'Completed quiz in record time'
    });
    rewards.bonuses.push({
      type: 'speed',
      points: 5,
      description: 'Speed bonus'
    });
    rewards.points += 5;
  }
  
  // Streak bonus
  if (settings.streakBonus && previousAttempts.length > 0) {
    const allPassed = previousAttempts.every(a => a.percentage >= settings.passingScore);
    if (allPassed && submission.percentage >= settings.passingScore) {
      const streakCount = previousAttempts.length + 1;
      rewards.badges.push({
        id: 'on_fire',
        name: `${streakCount}-Quiz Streak`,
        icon: '🔥',
        description: `Passed ${streakCount} quizzes in a row`
      });
      rewards.bonuses.push({
        type: 'streak',
        points: streakCount * 2,
        description: `Streak bonus (x${streakCount})`
      });
      rewards.points += streakCount * 2;
    }
  }
  
  return rewards;
}

/**
 * Validate quiz password
 */
export function validatePassword(settings, inputPassword) {
  if (!settings.requirePassword) return { valid: true };
  
  return {
    valid: inputPassword === settings.password,
    error: inputPassword !== settings.password ? 'Incorrect password' : null
  };
}

/**
 * Check IP restrictions
 */
export function checkIPRestrictions(settings, clientIP) {
  if (!settings.ipRestrictions || settings.ipRestrictions.length === 0) {
    return { allowed: true };
  }
  
  const allowed = settings.ipRestrictions.some(allowed IP => {
    // Support CIDR notation or exact match
    return clientIP === allowedIP || clientIP.startsWith(allowedIP.split('/')[0]);
  });
  
  return {
    allowed,
    error: allowed ? null : 'Access denied from this IP address'
  };
}
