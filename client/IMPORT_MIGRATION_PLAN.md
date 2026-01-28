# Import Migration Plan - Phase 3

## 🎯 Current Situation
- ✅ Components copied to shared directory
- ❌ Original components still exist (duplicates)
- ❌ Imports still point to old locations
- ❌ Need to update all references across the codebase

## 📋 Migration Strategy

### Step 1: Find All Import References
Search for all imports of moved components across the codebase:
- Loading
- Modal
- DeleteConfirmationModal
- ErrorBoundary
- NotificationDrawer
- ToggleSwitch
- LanguageToggle
- HelpDrawer
- SmartGrid
- DragGrid
- CollapsibleSideWindow
- FilterChips

### Step 2: Update Import Statements
Replace old import paths with new shared imports:

#### Before:
```javascript
import Loading from '../components/Loading';
import Modal from '../../components/Modal';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';
import ToggleSwitch from '../components/ToggleSwitch';
```

#### After:
```javascript
import { Loading, Modal, DeleteConfirmationModal, ToggleSwitch } from '../components/shared';
// OR individual imports for tree-shaking:
import { Loading } from '../components/shared/common/Loading';
import { ToggleSwitch } from '../components/shared/ui/ToggleSwitch';
```

### Step 3: Delete Original Components
After confirming all imports are updated:
- Remove original .jsx files
- Remove original .css files
- Clean up any remaining references

### Step 4: Test Everything
- Run Storybook to verify components work
- Test application functionality
- Check for any broken imports

## 🎯 Priority Order

### High Priority (Most Used):
1. Loading - Used throughout the app
2. Modal - Used in many pages
3. DeleteConfirmationModal - Used for delete operations
4. ToggleSwitch - Common UI component

### Medium Priority:
5. ErrorBoundary - Error handling
6. NotificationDrawer - Notification system
7. LanguageToggle - Language switching

### Lower Priority:
8. HelpDrawer - Help system
9. SmartGrid - Data grid
10. DragGrid - Dashboard layout
11. FilterChips - Filter UI
12. CollapsibleSideWindow - Side panels

## 🚀 Execution Plan

### Phase 3A: Update Imports (Automated)
1. Search and replace import statements
2. Update relative paths
3. Verify syntax

### Phase 3B: Delete Originals (Manual Verification)
1. Confirm all imports updated
2. Delete original files
3. Test application

### Phase 3C: Final Testing
1. Run full application tests
2. Verify Storybook works
3. Check bundle size optimization

## 📊 Files to Update

Based on typical usage patterns, expect to update:
- ~50+ component files
- ~20+ page files
- ~10+ utility files
- ~5+ test files

## ⚠️ Risks & Mitigations

### Risk 1: Broken Imports
- **Mitigation**: Use find/replace with verification
- **Backup**: Keep originals until confirmed working

### Risk 2: Relative Path Issues
- **Mitigation**: Test each updated file
- **Solution**: Use centralized shared imports

### Risk 3: CSS Import Issues
- **Mitigation**: CSS imports handled in shared components
- **Verification**: Check styling still works

## 🎯 Success Criteria

- ✅ All imports use shared components
- ✅ No duplicate components exist
- ✅ Application functions normally
- ✅ Storybook works correctly
- ✅ Bundle size optimized

## 🚀 Let's Start!

Ready to begin the import migration? Let me know and I'll start with Step 1!
