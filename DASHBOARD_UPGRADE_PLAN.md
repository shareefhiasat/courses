# Dashboard Upgrade Plan

## Overview
Systematically replace all native HTML elements with Storybook UI components across the entire Dashboard.

## Rules
1. **No labels on Select** - Use placeholder only
2. **Replace all native elements**:
   - `<input>` → `Input`
   - `<select>` → `Select searchable`
   - `<textarea>` → `Input` (multiline)
   - `<button>` → `Button`
   - `DateTimePicker` → `DatePicker`
   - `ToggleSwitch` → checkbox (or UI Switch if available)
   - `SmartGrid` → `DataGrid`

## Sections to Upgrade

### ✅ Phase 1: Users Form (DONE)
- Lines 2035-2102
- 4 Input components
- 1 Select (role)
- 2 Button components

### 🔄 Phase 2: Activities Form (IN PROGRESS)
- Lines 805-1040
- **Inputs**: id, title_en, title_ar, url, image, maxScore
- **Textareas**: description_en, description_ar → Input multiline
- **Selects**: classId, course, type, difficulty, quizId, emailLang
- **DateTimePicker**: dueDate → DatePicker
- **Checkboxes**: show, allowRetake, featured, optional, requiresSubmission, sendEmail, createAnnouncement
- **Buttons**: submit, cancel

### Phase 3: Announcements Form
- Find and replace all inputs/selects/buttons

### Phase 4: Classes Form
- Find and replace all inputs/selects/buttons

### Phase 5: Enrollments Form
- Find and replace all inputs/selects/buttons

### Phase 6: Resources Form
- Find and replace all inputs/selects/buttons

### Phase 7: Submissions Section
- Find and replace all inputs/selects/buttons

### Phase 8: SMTP/Email Forms
- Find and replace all inputs/selects/buttons

### Phase 9: Allowlist Form
- Find and replace all inputs/selects/buttons

### Phase 10: SmartGrid → DataGrid Migration
- Replace all SmartGrid instances with DataGrid
- Configure columns, actions, search, pagination

## Estimated Time
- Phase 1: ✅ Done (15 min)
- Phase 2: 30 min
- Phase 3-9: 2 hours
- Phase 10: 2-3 hours
- **Total**: 4-5 hours

## Progress
- [x] Phase 1: Users Form
- [ ] Phase 2: Activities Form
- [ ] Phase 3: Announcements Form
- [ ] Phase 4: Classes Form
- [ ] Phase 5: Enrollments Form
- [ ] Phase 6: Resources Form
- [ ] Phase 7: Submissions Section
- [ ] Phase 8: SMTP/Email Forms
- [ ] Phase 9: Allowlist Form
- [ ] Phase 10: DataGrid Migration
