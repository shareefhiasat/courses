# 🚨 Urgent Fixes Needed - Priority List

**Date:** November 29, 2024  
**Total Issues:** 9 major issues + sub-issues

---

## ✅ **PRIORITY 1: QuizBuilder Critical Bugs** (Blocking)

### 1.1 Duplicate Quill Editors ❌
**Issue:** Two Quill toolbars appear for each RichTextEditor  
**Location:** `QuizBuilderPage.jsx` - Question text, Options, Explanation  
**Root Cause:** RichTextEditor component likely rendering toolbar twice  
**Fix:** Check RichTextEditor component, ensure single instance

### 1.2 HTML Tags Showing in Preview ❌
**Issue:** Preview shows `<p><strong>text</strong></p>` instead of rendered HTML  
**Location:** `QuizBuilderPage.jsx` lines 519-520, 536-537  
**Current Code:**
```jsx
<h3 className={styles.previewQuestionText}>
  {question.question || 'No question text'}  // ❌ Shows HTML tags
</h3>
<span className={styles.optionText}>
  {option.text || `Option ${oIndex + 1}`}  // ❌ Shows HTML tags
</span>
```
**Fix:** Use `dangerouslySetInnerHTML` to render HTML properly

### 1.3 Created By Shows Email Instead of Name ❌
**Issue:** "CREATED BY: shareefhiasat@gmail.com" should show "Shareef Hiasat"  
**Location:** `QuizBuilderPage.jsx` - Preview header  
**Fix:** Fetch user display name from Firestore users collection

### 1.4 Missing Difficulty Field in Questions ❌
**Issue:** No way to set question difficulty (easy/medium/hard)  
**Location:** `QuizBuilderPage.jsx` - Question form  
**Impact:** Performance tab shows "MEDIUM 0%" but no way to set it  
**Fix:** Add difficulty dropdown to question form

### 1.5 Missing Topic Field in Questions ❌
**Issue:** Performance tab shows "General" topic but no way to set it  
**Location:** `QuizBuilderPage.jsx` - Question form  
**Impact:** Cannot categorize questions by topic  
**Fix:** Add topic input field to question form

### 1.6 Bottom Buttons UI Issues ❌
**Issue:** "Cancel" and "Continue to Questions" buttons look off  
**Fix:** Better spacing, alignment, modern design

---

## ✅ **PRIORITY 2: StudentQuizPage UX Overhaul** (High Impact)

### 2.1 Question Palette Too Large ❌
**Issue:** Question palette takes too much space on the right  
**Current:** Large sidebar with legend  
**Desired:** Compact, smaller, moved to top  
**Fix:** Redesign as horizontal compact strip at top

### 2.2 Labels Everywhere ❌
**Issue:** Too many text labels cluttering UI  
**Labels to Remove:**
- "Exit" → Just ← icon
- "Calculator" → Just 🧮 icon
- "Scratch Pad" → Just ✏️ icon
- "Previous" → Just ← icon
- "Next" → Just → icon
- "Next Unanswered" → Just icon
- "Next Marked" → Just icon
- "Mark" → Just 🏴 icon

**Fix:** Icon-only buttons with tooltips

### 2.3 Calculator & Scratch Pad Placement ❌
**Issue:** Toolbar buttons at top are too prominent  
**Desired:** Smaller, floating action buttons (FAB) in corner  
**Fix:** Move to bottom-right as small circular FABs

### 2.4 Question Area Too Narrow ❌
**Issue:** Question palette takes space from main content  
**Fix:** Remove sidebar, expand question area to full width

### 2.5 Bottom Navigation Poorly Designed ❌
**Issue:** Bottom nav with "Previous", "Next Unanswered", "Next Marked", "Submit" looks cluttered  
**Fix:** Clean icon-only design with smart spacing

---

## ✅ **PRIORITY 3: DetailedResults HTML Rendering** (Medium)

### 3.1 HTML Tags in Questions Tab ❌
**Issue:** Shows `<p>fffff</p>` instead of rendered text  
**Location:** `DetailedResults.jsx` - Questions tab  
**Fix:** Use `dangerouslySetInnerHTML` for question text and options

### 3.2 Explanations Not Showing ❌
**Issue:** Explanations exist but don't display  
**Fix:** Check if explanation field is being rendered

### 3.3 Topic Shows "General" ❌
**Issue:** Performance tab shows "General" topic from nowhere  
**Root Cause:** Questions don't have topic field, defaulting to "General"  
**Fix:** Add topic field to questions (see 1.5)

---

## ✅ **PRIORITY 4: Dashboard Permissions Error** (Critical)

### 4.1 Firebase Permissions Error ❌
**Error:**
```
[Dashboard] Error loading dashboard data: FirebaseError: Missing or insufficient permissions.
```
**Location:** `DashboardPage.jsx`  
**Root Cause:** Firestore rules don't allow reading required collections  
**Fix:** Update Firestore rules or adjust queries

### 4.2 Duplicate Keys Warning ❌
**Error:**
```
Encountered two children with the same key, `1764420823894`
```
**Location:** Unknown component rendering list  
**Fix:** Ensure unique keys in map() functions

---

## ✅ **PRIORITY 5: StudentDashboardPage Redesign** (High Impact)

### 5.1 Make Cards More Compact ❌
**Current:** Large cards for Enrolled Classes, Completed Classes, Total Hours, Achievements  
**Desired:** Small summary cards (like analytics cards)  
**Fix:** Reduce card size, use compact layout

### 5.2 Add Class/Term Filters for Admin/Instructor ❌
**Issue:** Admin/Instructor should filter by class/term to view student dashboards  
**Desired:**
- Admin: See all classes → pick class → pick student → see dashboard  
- Instructor: See my classes → pick class → pick student → see dashboard  
**Fix:** Add filter dropdowns at top

### 5.3 Remove Achievements/Awards/Medals/Leaderboard ❌
**Decision:** Deprecate these features for now  
**Fix:** Remove from StudentDashboardPage

### 5.4 Replace "Upcoming Classes" with "Pending Tasks" ❌
**Issue:** Students don't have "classes" but "tasks" (quizzes, assignments, resources)  
**Desired:** Show pending quizzes/assignments filterable by class  
**Fix:** Replace "Upcoming Classes" with "Pending Tasks" section

### 5.5 Add Grades/Marks Display ❌
**Issue:** Students need to see their grades  
**Desired:** Show quiz scores, assignment grades, overall performance  
**Fix:** Add grades section with breakdown by class

---

## 📋 **Implementation Order**

### **Phase 1: Critical Bugs (1-2 hours)**
1. ✅ Fix duplicate Quill editors
2. ✅ Fix HTML rendering in QuizBuilder preview
3. ✅ Fix HTML rendering in DetailedResults
4. ✅ Add difficulty field to questions
5. ✅ Add topic field to questions
6. ✅ Fix created by to show name

### **Phase 2: UX Overhaul (2-3 hours)**
7. ✅ Redesign StudentQuizPage (compact palette, icon-only, FABs)
8. ✅ Fix bottom navigation design
9. ✅ Move calculator/scratch pad to FABs

### **Phase 3: Dashboard Fixes (1-2 hours)**
10. ✅ Fix Dashboard permissions error
11. ✅ Fix duplicate keys warning
12. ✅ Redesign StudentDashboardPage (compact cards, filters, grades)

### **Phase 4: Features (2-3 hours)**
13. ✅ Add pending tasks section
14. ✅ Add grades display
15. ✅ Add class/term filters for admin/instructor

---

## 🎯 **Quick Wins (Do First)**

1. **Fix HTML rendering** - 10 minutes
   - QuizBuilder preview: Use `dangerouslySetInnerHTML`
   - DetailedResults: Use `dangerouslySetInnerHTML`

2. **Add difficulty & topic fields** - 15 minutes
   - Add dropdown for difficulty (easy/medium/hard)
   - Add input for topic

3. **Fix created by** - 10 minutes
   - Fetch user display name from Firestore

4. **Remove labels, use icons** - 20 minutes
   - Replace all button labels with icons
   - Add tooltips

---

## 📝 **Notes**

- **Quill Duplicate:** Likely RichTextEditor component issue, check if it's creating multiple instances
- **Permissions Error:** Need to check Firestore rules for dashboard collections
- **Student Dashboard:** Major redesign needed, focus on tasks/grades instead of classes/achievements
- **Icon Library:** Using Lucide React icons throughout

---

**Total Estimated Time:** 6-10 hours  
**Priority:** Start with Phase 1 (Critical Bugs) immediately
