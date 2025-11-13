# 🎯 Badge System - Quick Setup Guide

## 🚀 Step 1: Seed Badges into Firestore

Before users can earn badges, you need to populate the badge definitions in Firestore.

### Option A: Via Browser Console (Recommended)

1. Open your application in the browser
2. Log in as an admin
3. Open the browser console (F12)
4. Run the following code:

```javascript
import { seedBadges } from './firebase/seedBadges';
seedBadges().then(result => console.log('Badge seeding result:', result));
```

### Option B: Create a Seed Button

Add this to your Dashboard page temporarily:

```jsx
import { seedBadges } from '../firebase/seedBadges';

// In your component:
<button 
  onClick={async () => {
    const result = await seedBadges();
    console.log(result);
    alert(result.success ? '✅ Badges seeded!' : '❌ Error seeding badges');
  }}
  style={{ padding: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}
>
  🌱 Seed Badges (Run Once)
</button>
```

### Option C: Firebase Console

Manually create badge documents in Firestore:
- Collection: `badges`
- Use the badge definitions from `seedBadges.js`

---

## 🎮 Step 2: Test Badge System

### Test Manual Awards:
1. Navigate to `/award-medals/:classId`
2. Select students
3. Choose a badge
4. Click "Award Medals"
5. Check student profile to see badges

### Test Student Profile:
1. Navigate to `/student-profile`
2. Scroll to "Badges & Achievements" section
3. You should see:
   - Stats cards (streak, time, score, perfect scores)
   - Badge grid with earned/unearned badges
   - Badge count (X / Y earned)

---

## 📊 Step 3: Initialize User Stats

For existing users, you may need to initialize their stats. Create a function to do this:

```javascript
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase/config';

async function initializeUserStats(userId) {
  await setDoc(doc(db, `users/${userId}/stats`, 'general'), {
    quizzesCompleted: 0,
    homeworksCompleted: 0,
    trainingsCompleted: 0,
    assignmentsSubmitted: 0,
    totalTimeSpent: 0,
    loginStreak: 0,
    lastLoginDate: new Date().toISOString().split('T')[0],
    averageScore: 0,
    perfectScores: 0
  }, { merge: true });
}
```

---

## 🔄 Step 4: Implement Auto-Awards (Future)

To enable automatic badge awards, you need to:

1. **Hook into Activity Completion**:
   - In `ActivitiesPage.jsx` or submission handler
   - Call `processBadgeTrigger(userId, 'quiz_completion', { score })`

2. **Hook into Login**:
   - In `AuthContext` or main App
   - Call `processBadgeTrigger(userId, 'login', {})`

3. **Implement Trigger Logic**:
   - Complete the `processBadgeTrigger()` function in `badges.js`
   - Check user stats against badge requirements
   - Award badges when requirements are met

Example implementation:

```javascript
export async function processBadgeTrigger(userId, eventType, eventData = {}) {
  try {
    // Get user stats
    const statsResult = await getUserStats(userId);
    const stats = statsResult.data || {};

    // Get all badges
    const badgesResult = await getBadgeDefinitions();
    const allBadges = badgesResult.data || [];

    // Get user's current badges
    const userBadgesResult = await getUserBadges(userId);
    const userBadges = userBadgesResult.data || [];
    const earnedBadgeIds = userBadges.map(b => b.badgeId);

    const newBadges = [];

    // Check each badge
    for (const badge of allBadges) {
      // Skip if already earned
      if (earnedBadgeIds.includes(badge.id)) continue;

      // Skip if trigger doesn't match
      if (badge.trigger !== eventType) continue;

      // Check requirement
      let shouldAward = false;
      
      switch (eventType) {
        case 'quiz_completion':
          if (stats.quizzesCompleted >= badge.requirement) shouldAward = true;
          break;
        case 'homework_completion':
          if (stats.homeworksCompleted >= badge.requirement) shouldAward = true;
          break;
        case 'login_streak':
          if (stats.loginStreak >= badge.requirement) shouldAward = true;
          break;
        case 'perfect_score':
          if (eventData.score === 100) shouldAward = true;
          break;
        // Add more cases...
      }

      if (shouldAward) {
        // Award the badge
        await setDoc(doc(db, `users/${userId}/badges`, badge.id), {
          badgeId: badge.id,
          earnedAt: serverTimestamp(),
          progress: badge.requirement
        });
        newBadges.push(badge);
      }
    }

    return { success: true, newBadges };
  } catch (error) {
    console.error('Error processing badge trigger:', error);
    return { success: false, error: error.message, newBadges: [] };
  }
}
```

---

## 🎨 Step 5: Customize Badges

You can customize badges by:

1. **Adding New Badges**:
   - Add to `seedBadges.js`
   - Run seeder again (it will merge new badges)

2. **Creating Custom Icons**:
   - Use emoji or Lucide icon names
   - Update badge icon field

3. **Adjusting Requirements**:
   - Modify `requirement` field in badge definition
   - Update in Firestore

4. **Creating Badge Levels**:
   - Create multiple badges for same achievement
   - E.g., "Quiz Novice" (1), "Quiz Master" (10), "Quiz Legend" (50)

---

## 📱 Step 6: Add Notifications (Optional)

When a badge is earned, show a toast notification:

```javascript
import { useToast } from '../components/ToastProvider';

const toast = useToast();

// After awarding badge:
toast.showSuccess(`🎉 Badge Earned: ${badge.name}!`);
```

Or create a fancy modal:

```jsx
<BadgeEarnedModal 
  badge={badge} 
  onClose={() => setBadgeModal(null)} 
/>
```

---

## 🔍 Troubleshooting

### Badges not showing in profile:
- Check if badges are seeded in Firestore (`/badges` collection)
- Check user badges (`/users/{userId}/badges` subcollection)
- Check console for errors

### Manual awards not working:
- Verify user is logged in
- Check Firestore rules allow writes to `users/{userId}/badges`
- Check console for errors

### Stats not updating:
- Initialize user stats first
- Check that stats document exists at `/users/{userId}/stats/general`
- Verify Firestore rules

---

## 🎯 Testing Checklist

- [ ] Badges seeded in Firestore
- [ ] Student profile shows badges section
- [ ] Manual award page loads
- [ ] Can award medals to students
- [ ] Awarded badges appear in student profile
- [ ] Stats cards display correct data
- [ ] Earned badges show checkmark and date
- [ ] Unearned badges are grayscale
- [ ] Hover animations work
- [ ] Dark mode looks good
- [ ] Mobile responsive
- [ ] Badge count is accurate

---

## 🎉 You're All Set!

Your badge system is now ready to:
- ✅ Motivate students with achievements
- ✅ Track engagement and progress
- ✅ Reward excellence and participation
- ✅ Create a gamified learning experience

**Next**: Implement auto-awards to make it fully automatic! 🚀

---

*For support or questions, refer to:*
- `FINAL_COMPLETION_SUMMARY.md` - Complete overview
- `IMPLEMENTATION_ROADMAP.md` - Future enhancements
- `badges.js` - API reference
