import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * Seed initial badge definitions into Firestore
 * Run this once to populate the badges collection
 */
export async function seedBadges() {
  const badges = [
    // ============= COMPLETION BADGES =============
    {
      id: 'quiz_novice',
      name: 'Quiz Novice',
      description: 'Complete your first quiz',
      icon: '🎯',
      category: 'completion',
      trigger: 'quiz_completion',
      requirement: 1,
      points: 5
    },
    {
      id: 'quiz_master',
      name: 'Quiz Master',
      description: 'Complete 10 quizzes',
      icon: '🎮',
      category: 'completion',
      trigger: 'quiz_completion',
      requirement: 10,
      points: 25
    },
    {
      id: 'homework_hero',
      name: 'Homework Hero',
      description: 'Submit 10 homework assignments',
      icon: '📝',
      category: 'completion',
      trigger: 'homework_completion',
      requirement: 10,
      points: 20
    },
    {
      id: 'training_champion',
      name: 'Training Champion',
      description: 'Complete 10 training exercises',
      icon: '🏋️',
      category: 'completion',
      trigger: 'training_completion',
      requirement: 10,
      points: 20
    },
    {
      id: 'assignment_ace',
      name: 'Assignment Ace',
      description: 'Submit 10 assignments',
      icon: '📤',
      category: 'completion',
      trigger: 'assignment_completion',
      requirement: 10,
      points: 20
    },
    
    // ============= PERFORMANCE BADGES =============
    {
      id: 'perfect_score',
      name: 'Perfect Score',
      description: 'Get 100% on any quiz',
      icon: '💯',
      category: 'performance',
      trigger: 'perfect_score',
      requirement: 1,
      points: 15
    },
    {
      id: 'high_achiever',
      name: 'High Achiever',
      description: 'Maintain average score above 90%',
      icon: '⭐',
      category: 'performance',
      trigger: 'high_average',
      requirement: 90,
      points: 30
    },
    {
      id: 'consistent_performer',
      name: 'Consistent Performer',
      description: 'Pass 5 consecutive activities',
      icon: '🎖️',
      category: 'performance',
      trigger: 'consecutive_pass',
      requirement: 5,
      points: 25
    },
    
    // ============= ENGAGEMENT BADGES =============
    {
      id: 'streak_starter',
      name: 'Streak Starter',
      description: 'Login for 3 consecutive days',
      icon: '🔥',
      category: 'engagement',
      trigger: 'login_streak',
      requirement: 3,
      points: 10
    },
    {
      id: 'streak_master',
      name: 'Streak Master',
      description: 'Login for 7 consecutive days',
      icon: '🔥',
      category: 'engagement',
      trigger: 'login_streak',
      requirement: 7,
      points: 25
    },
    {
      id: 'streak_legend',
      name: 'Streak Legend',
      description: 'Login for 30 consecutive days',
      icon: '🔥',
      category: 'engagement',
      trigger: 'login_streak',
      requirement: 30,
      points: 100
    },
    {
      id: 'time_warrior',
      name: 'Time Warrior',
      description: 'Spend 100 hours learning',
      icon: '⏰',
      category: 'engagement',
      trigger: 'time_spent',
      requirement: 360000, // 100 hours in seconds
      points: 50
    },
    {
      id: 'chat_champion',
      name: 'Chat Champion',
      description: 'Send 100 messages',
      icon: '💬',
      category: 'engagement',
      trigger: 'messages_sent',
      requirement: 100,
      points: 20
    },
    {
      id: 'resource_explorer',
      name: 'Resource Explorer',
      description: 'View 20 resources',
      icon: '📚',
      category: 'engagement',
      trigger: 'resources_viewed',
      requirement: 20,
      points: 15
    },
    
    // ============= SPECIAL BADGES =============
    {
      id: 'first_place',
      name: 'First Place',
      description: 'Reach #1 on the leaderboard',
      icon: '👑',
      category: 'special',
      trigger: 'leaderboard_top',
      requirement: 1,
      points: 50
    },
    {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Be first to complete an activity',
      icon: '🚀',
      category: 'special',
      trigger: 'first_completion',
      requirement: 1,
      points: 20
    },
    {
      id: 'helping_hand',
      name: 'Helping Hand',
      description: 'Help 5 classmates',
      icon: '🤝',
      category: 'special',
      trigger: 'help_others',
      requirement: 5,
      points: 25
    },
    
    // ============= MANUAL AWARD BADGES =============
    {
      id: 'teamwork',
      name: 'Teamwork',
      description: 'Awarded for excellent teamwork',
      icon: '🤝',
      category: 'manual',
      points: 1
    },
    {
      id: 'focus',
      name: 'Focus',
      description: 'Awarded for exceptional focus',
      icon: '🎯',
      category: 'manual',
      points: 1
    },
    {
      id: 'leadership',
      name: 'Leadership',
      description: 'Awarded for leadership qualities',
      icon: '📣',
      category: 'manual',
      points: 1
    },
    {
      id: 'resilience',
      name: 'Resilience',
      description: 'Awarded for resilience and perseverance',
      icon: '🛡️',
      category: 'manual',
      points: 1
    },
    {
      id: 'dedication',
      name: 'Dedication',
      description: 'Awarded for dedication and commitment',
      icon: '🎖️',
      category: 'manual',
      points: 1
    },
    {
      id: 'excellence',
      name: 'Excellence',
      description: 'Awarded for excellence in work',
      icon: '🏆',
      category: 'manual',
      points: 2
    },
    {
      id: 'participation',
      name: 'Participation',
      description: 'Awarded for active participation',
      icon: '📢',
      category: 'manual',
      points: 1
    },
    {
      id: 'helping_others',
      name: 'Helping Others',
      description: 'Awarded for helping classmates',
      icon: '❤️',
      category: 'manual',
      points: 1
    }
  ];

  try {
    console.log('🌱 Seeding badges...');
    
    for (const badge of badges) {
      await setDoc(doc(db, 'badges', badge.id), badge);
      console.log(`✅ Created badge: ${badge.name}`);
    }
    
    console.log('🎉 Badge seeding complete!');
    return { success: true, count: badges.length };
  } catch (error) {
    console.error('❌ Error seeding badges:', error);
    return { success: false, error: error.message };
  }
}

// Call this function once to seed the database
// seedBadges();
