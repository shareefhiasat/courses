# Shared Components Refactoring Plan

## Overview
This document outlines the refactoring plan to move common, reusable components to the shared directory for better maintainability and DRY principles.

## Components to Move to Shared

### 🎯 High Priority (Most Common)
1. **Loading** - Used throughout the application
2. **Modal** - Used in many pages and components
3. **NotificationDrawer** - Complex notification system
4. **DeleteConfirmationModal** - Used for delete operations
5. **ErrorBoundary** - Error handling wrapper
6. **ToggleSwitch** - Common UI toggle
7. **LanguageToggle** - Language switching component

### 🟡 Medium Priority (Frequently Used)
8. **FilterChips** - Filter UI component
9. **HelpDrawer** - Help system
10. **SmartGrid** - Data grid with advanced features
11. **DragGrid** - Drag and drop functionality
12. **CollapsibleSideWindow** - Side navigation

### 🟢 Low Priority (Specialized)
13. **EmailComposer** - Email functionality
14. **QRCodeGenerator** - QR code generation
15. **Timer/Stopwatch** - Time tracking components
16. **RankDisplay** - Ranking system
17. **StudentQuickActionModal** - Student actions

## CSS Files to Move to Shared

### 🎯 High Priority
1. **Loading.css** - Loading animations
2. **Modal.css** - Modal styling
3. **Navbar.css** - Navigation styling
4. **ToastProvider.css** - Toast notifications

### 🟡 Medium Priority
5. **SmartGrid.css** - Grid styling
6. **DraggableClock.css** - Clock component styling
7. **EmailManager.css** - Email component styling

## Refactoring Strategy

### Phase 1: Core Components
1. Create shared directory structure
2. Move Loading, Modal, DeleteConfirmationModal
3. Update all imports across the codebase
4. Create Storybook stories

### Phase 2: UI Components
1. Move ToggleSwitch, LanguageToggle, FilterChips
2. Move ErrorBoundary, ToastProvider
3. Update imports and test

### Phase 3: Complex Components
1. Move NotificationDrawer (largest refactor)
2. Move SmartGrid, DragGrid
3. Move specialized components

### Phase 4: CSS Organization
1. Move common CSS files
2. Create shared CSS architecture
3. Update imports

## Benefits
- **DRY Principle**: Single source of truth for common components
- **Maintainability**: Updates in one place affect all usage
- **Consistency**: Unified styling and behavior
- **Storybook Ready**: All components documented and testable
- **Bundle Optimization**: Better code splitting
