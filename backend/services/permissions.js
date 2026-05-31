/**
 * Permissions Service
 * 
 * PURPOSE: Business logic for permission management
 * ARCHITECTURE: Services → DB
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Screen definitions with their default operations
const SCREENS = {
  home: { nameEn: 'Home', nameAr: 'الرئيسية', operations: ['view'] },
  dashboard: { nameEn: 'Dashboard', nameAr: 'لوحة التحكم', operations: ['view'] },
  categories: { nameEn: 'Categories', nameAr: 'الفئات', operations: ['view', 'create', 'edit', 'delete'] },
  studentDashboard: { nameEn: 'Student Dashboard', nameAr: 'لوحة الطالب', operations: ['view'] },
  studentProfile: { nameEn: 'Student Profile', nameAr: 'ملف الطالب', operations: ['view', 'edit'] },
  activities: { nameEn: 'Activities', nameAr: 'الأنشطة', operations: ['view', 'create', 'edit', 'delete'] },
  quizzes: { nameEn: 'Quizzes', nameAr: 'الاختبارات', operations: ['view', 'create', 'edit', 'delete', 'take'] },
  attendance: { nameEn: 'Attendance', nameAr: 'الحضور', operations: ['view', 'mark', 'edit'] },
  hrAttendance: { nameEn: 'HR Attendance', nameAr: 'حضور الموارد البشرية', operations: ['view', 'edit'] },
  penalty: { nameEn: 'Penalty', nameAr: 'العقوبات', operations: ['view', 'create', 'edit', 'delete'] },
  participation: { nameEn: 'Participation', nameAr: 'المشاركة', operations: ['view', 'mark', 'edit'] },
  behavior: { nameEn: 'Behavior', nameAr: 'السلوك', operations: ['view', 'create', 'edit', 'delete'] },
  qrScanner: { nameEn: 'QR Scanner', nameAr: 'ماسح الباركود', operations: ['view', 'scan'] },
  enrollments: { nameEn: 'Enrollments', nameAr: 'التسجيل', operations: ['view', 'create', 'edit', 'delete'] },
  programs: { nameEn: 'Programs', nameAr: 'البرامج', operations: ['view', 'create', 'edit', 'delete'] },
  subjects: { nameEn: 'Subjects', nameAr: 'المواد', operations: ['view', 'create', 'edit', 'delete'] },
  marksEntry: { nameEn: 'Marks Entry', nameAr: 'إدخال الدرجات', operations: ['view', 'edit'] },
  classSchedules: { nameEn: 'Class Schedules', nameAr: 'جدول الحصص', operations: ['view', 'create', 'edit', 'delete'] },
  analytics: { nameEn: 'Analytics', nameAr: 'التحليلات', operations: ['view'] },
  advancedAnalytics: { nameEn: 'Advanced Analytics', nameAr: 'التحليلات المتقدمة', operations: ['view'] },
  chat: { nameEn: 'Chat', nameAr: 'المحادثة', operations: ['view', 'send'] },
  notifications: { nameEn: 'Notifications', nameAr: 'الإشعارات', operations: ['view', 'manage'] },
  scheduledReports: { nameEn: 'Scheduled Reports', nameAr: 'التقارير المجدولة', operations: ['view', 'create', 'edit', 'delete'] },
  workflow: { nameEn: 'Workflow', nameAr: 'سير العمل', operations: ['view', 'create', 'approve', 'reject', 'close'] },
  workspace: { nameEn: 'Workspace', nameAr: 'مساحة العمل', operations: ['view', 'upload', 'delete', 'share', 'edit'] },
  drive: { nameEn: 'Drive', nameAr: 'محرك الأقراص', operations: ['view', 'upload', 'delete', 'share', 'edit'] },
  profile: { nameEn: 'Profile Settings', nameAr: 'إعدادات الملف الشخصي', operations: ['view', 'edit'] },
  permissionMatrix: { nameEn: 'Permission Matrix', nameAr: 'مصف الأذونات', operations: ['view', 'edit'] },
  // Flexible Scheduling screens
  summaryDashboard: { nameEn: 'Summary Dashboard', nameAr: 'لوحة الملخص', operations: ['view'] },
  flexibleSchedule: { nameEn: 'Flexible Schedule', nameAr: 'الجدول المرن', operations: ['view', 'create', 'edit', 'delete'] },
  instructorAvailability: { nameEn: 'Instructor Availability', nameAr: 'توفر المدرب', operations: ['view', 'create', 'edit', 'delete'] },
  classroomAvailability: { nameEn: 'Classroom Availability', nameAr: 'توافر الفصل', operations: ['view', 'create', 'edit', 'delete'] },
  userCategoryAccess: { nameEn: 'User Category Access', nameAr: 'وصول المستخدم للفئة', operations: ['view', 'create', 'edit', 'delete'] },
  flexibleSchedulingDashboard: { nameEn: 'Flexible Scheduling Dashboard', nameAr: 'لوحة الجدولة المرنة', operations: ['view', 'create', 'edit', 'delete'] }
};

/**
 * Get all permissions
 */
export const permissionsService = {
  /**
   * Get all permissions (screens, operations, role permissions)
   */
  async getPermissions(lang = 'en') {
    try {
      // Fetch from database
      const screens = await prisma.screen.findMany({
        where: { isActive: true },
        include: {
          operations: {
            where: { isActive: true },
            include: {
              rolePermissions: true
            },
            orderBy: { category: 'asc' }
          }
        },
        orderBy: { category: 'asc' }
      });
      
      // Get all roles
      const roles = ['super_admin', 'admin', 'hr', 'instructor', 'student'];
      
      // Build tree structure
      const tree = screens.map(screen => ({
        id: screen.id,
        screenId: screen.screenId,
        name: lang === 'ar' ? screen.nameAr : screen.nameEn,
        description: lang === 'ar' ? screen.descriptionAr : screen.descriptionEn,
        category: screen.category,
        operations: screen.operations.map(op => ({
          id: op.id,
          operationKey: op.operationKey,
          name: lang === 'ar' ? op.nameAr : op.nameEn,
          description: lang === 'ar' ? op.descriptionAr : op.descriptionEn,
          category: op.category,
          permissions: roles.map(role => {
            const perm = op.rolePermissions.find(p => p.role === role);
            return {
              role,
              allowed: perm ? perm.allowed : false
            };
          })
        }))
      }));
      
      return tree;
    } catch (error) {
      console.error('Error getting permissions:', error);
      throw error;
    }
  },
  
  /**
   * Update permissions (batch update)
   */
  async updatePermissions(updates) {
    try {
      console.log(`📝 Updating ${updates.length} permissions`);
      
      // Use transaction for atomic updates
      const result = await prisma.$transaction(async (tx) => {
        const results = [];
        
        for (const update of updates) {
          const { role, screenId, operationId, allowed } = update;
          
          // Upsert the permission
          const permission = await tx.rolePermission.upsert({
            where: {
              role_screenId_operationId: {
                role,
                screenId,
                operationId
              }
            },
            update: {
              allowed,
              updatedAt: new Date()
            },
            create: {
              role,
              screenId,
              operationId,
              allowed
            }
          });
          
          results.push(permission);
        }
        
        return results;
      });
      
      console.log('✅ Permissions updated successfully');
      return result;
    } catch (error) {
      console.error('Error updating permissions:', error);
      throw error;
    }
  },
  
  /**
   * Check if a role has a specific permission
   */
  async checkPermission(role, screenId, operationKey) {
    try {
      const screen = await prisma.screen.findUnique({
        where: { screenId },
        include: {
          operations: {
            where: { operationKey },
            include: {
              rolePermissions: {
                where: { role }
              }
            }
          }
        }
      });
      
      if (!screen || !screen.operations[0]) {
        return false;
      }
      
      const permission = screen.operations[0].rolePermissions[0];
      return permission ? permission.allowed : false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }
};

export default permissionsService;
