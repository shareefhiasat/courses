/**
 * Dashboard Database Service - API Client
 * 
 * PURPOSE: Handles dashboard aggregation operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import prisma from './prismaClient.js';
import { buildLocalizedNameFields, buildNotificationNameVars } from '../utils/localizedUserName.js';


/**
 * Get dashboard summary data
 */
const getDashboardSummary = async (params = {}) => {
  const startTime = Date.now();
  try {
    console.log('[DashboardDbService] Getting dashboard summary with params:', params);
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearStartStr = yearStart.toISOString().split('T')[0];
    
    // Get total teachers (users with instructor role)
    const totalTeachers = await prisma.user.count({
      where: {
        roles: {
          some: {
            name: 'instructor'
          }
        }
      }
    });
    
    // Get active teachers
    const activeTeachers = await prisma.user.count({
      where: {
        roles: {
          some: {
            name: 'instructor'
          }
        },
        isActive: true
      }
    });
    
    // Get total subjects
    const totalSubjects = await prisma.subject.count();
    
    // Get total categories
    const totalCategories = await prisma.category.count();
    
    // Get total classrooms
    const totalClassrooms = await prisma.classroom.count();
    
    // Get available classrooms
    const availableClassrooms = await prisma.classroom.count({
      where: {
        status: 'Available'
      }
    });
    
    // Get today's schedule sessions (using flexible schedule sessions)
    const todaySessions = await prisma.flexibleScheduleSession.findMany({
      where: {
        date: todayStr,
        isCancelled: false
      },
      include: {
        program: true,
        subject: true,
        instructor: true,
        classroom: true,
        timeSlot: true
      }
    });
    
    // Get week sessions
    const weekSessions = await prisma.flexibleScheduleSession.count({
      where: {
        date: {
          gte: weekStartStr,
          lte: todayStr
        },
        isCancelled: false
      }
    });
    
    // Get month sessions
    const monthSessions = await prisma.flexibleScheduleSession.count({
      where: {
        date: {
          gte: monthStartStr,
          lte: todayStr
        },
        isCancelled: false
      }
    });
    
    // Get year sessions
    const yearSessions = await prisma.flexibleScheduleSession.count({
      where: {
        date: {
          gte: yearStartStr,
          lte: todayStr
        },
        isCancelled: false
      }
    });
    
    // Get teacher load (sessions per teacher this month)
    const teacherLoadData = await prisma.flexibleScheduleSession.groupBy({
      by: ['instructorUserId'],
      where: {
        date: {
          gte: monthStartStr,
          lte: todayStr
        },
        isCancelled: false
      },
      _count: {
        id: true
      }
    });
    
    const teacherLoad = await Promise.all(teacherLoadData.map(async (tl) => {
      const instructor = await prisma.user.findUnique({
        where: { id: tl.instructorUserId },
        select: { displayName: true, firstName: true, lastName: true, displayNameAr: true, firstNameAr: true, lastNameAr: true }
      });
      const names = buildLocalizedNameFields(instructor, 'Unknown');
      return {
        instructorName: names.instructorName,
        instructorNameAr: names.instructorNameAr,
        sessionCount: tl._count.id
      };
    }));
    
    // Get subject sessions (sessions per subject this month)
    const subjectSessionsData = await prisma.flexibleScheduleSession.groupBy({
      by: ['subjectId'],
      where: {
        date: {
          gte: monthStartStr,
          lte: todayStr
        },
        isCancelled: false
      },
      _count: {
        id: true
      }
    });
    
    const subjectSessions = await Promise.all(subjectSessionsData.map(async (ss) => {
      const subject = await prisma.subject.findUnique({
        where: { id: ss.subjectId },
        select: { nameEn: true, nameAr: true }
      });
      return {
        subjectNameEn: subject?.nameEn || 'Unknown',
        subjectNameAr: subject?.nameAr || 'Unknown',
        sessionCount: ss._count.id
      };
    }));
    
    // Get upcoming holidays (next 30 days)
    const holidaysEnd = new Date(today);
    holidaysEnd.setDate(holidaysEnd.getDate() + 30);
    const holidaysEndStr = holidaysEnd.toISOString().split('T')[0];
    
    const holidays = await prisma.holiday.findMany({
      where: {
        startDate: { gte: todayStr },
        endDate: { lte: holidaysEndStr },
        isActive: true
      },
      orderBy: {
        startDate: 'asc'
      },
      take: 5
    });
    
    const duration = Date.now() - startTime;
    console.log(`[DashboardDbService] ✅ Retrieved dashboard summary in ${duration}ms`);
    
    return {
      success: true,
      data: {
        totalTeachers,
        activeTeachers,
        totalSubjects,
        totalCategories,
        totalClassrooms,
        availableClassrooms,
        weekSessions,
        monthSessions,
        yearSessions,
        todaySchedule: todaySessions,
        holidays,
        teacherLoad,
        subjectSessions
      }
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[DashboardDbService] ❌ Error getting dashboard summary:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get teacher-specific dashboard data
 */
const getTeacherDashboard = async (teacherUserId) => {
  const startTime = Date.now();
  try {
    console.log(`[DashboardDbService] Getting teacher dashboard for user: ${teacherUserId}`);
    
    const today = new Date();
    const todayStr = today.toISOString();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    // Get teacher's sessions today
    const todaySessions = await prisma.scheduleSession.findMany({
      where: {
        instructorUserId: parseInt(teacherUserId),
        date: todayStr,
        isCancelled: false,
        isActive: true
      },
      include: {
        class: true,
        subject: true,
        classroom: true,
        timeSlot: true
      },
      orderBy: {
        timeSlot: { sortOrder: 'asc' }
      }
    });
    
    // Get teacher's sessions this week
    const weekSessions = await prisma.scheduleSession.findMany({
      where: {
        instructorUserId: parseInt(teacherUserId),
        date: { gte: weekStart.toISOString() },
        isCancelled: false,
        isActive: true
      },
      include: {
        class: true,
        subject: true,
        classroom: true,
        timeSlot: true
      }
    });
    
    // Get teacher availability
    const teacherAvailability = await prisma.teacherAvailability.findFirst({
      where: {
        userId: parseInt(teacherUserId),
        isActive: true
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`[DashboardDbService] ✅ Retrieved teacher dashboard in ${duration}ms`);
    
    return {
      success: true,
      data: {
        todaySchedule: {
          date: todayStr,
          sessions: todaySessions,
          totalSessions: todaySessions.length
        },
        weekSchedule: {
          startDate: weekStart.toISOString(),
          sessions: weekSessions,
          totalSessions: weekSessions.length
        },
        availability: teacherAvailability
      }
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[DashboardDbService] ❌ Error getting teacher dashboard:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getDashboardSummary,
  getTeacherDashboard
};
