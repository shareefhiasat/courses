/**
 * Dashboard Database Service - API Client
 * 
 * PURPOSE: Handles dashboard aggregation operations via REST API
 * ARCHITECTURE: Browser → API Server → Prisma → PostgreSQL
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get dashboard summary data
 */
const getDashboardSummary = async (params = {}) => {
  const startTime = Date.now();
  try {
    console.log('[DashboardDbService] Getting dashboard summary with params:', params);
    
    const today = new Date();
    const todayStr = today.toISOString();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Get today's schedule sessions
    const todaySessions = await prisma.scheduleSession.findMany({
      where: {
        date: todayStr,
        isCancelled: false,
        isActive: true
      },
      include: {
        class: {
          include: {
            program: true
          }
        },
        subject: true,
        instructor: true,
        classroom: true,
        timeSlot: true
      }
    });
    
    // Get teacher load (sessions per teacher today)
    const teacherLoad = await prisma.scheduleSession.groupBy({
      by: ['instructorUserId'],
      where: {
        date: todayStr,
        isCancelled: false,
        isActive: true
      },
      _count: {
        id: true
      },
      include: {
        instructor: true
      }
    });
    
    // Get classroom utilization (sessions per classroom today)
    const classroomUtil = await prisma.scheduleSession.groupBy({
      by: ['classroomId'],
      where: {
        date: todayStr,
        isCancelled: false,
        isActive: true,
        classroomId: { not: null }
      },
      _count: {
        id: true
      },
      include: {
        classroom: true
      }
    });
    
    // Get upcoming holidays (next 30 days)
    const holidaysEnd = new Date(today);
    holidaysEnd.setDate(holidaysEnd.getDate() + 30);
    
    const upcomingHolidays = await prisma.holiday.findMany({
      where: {
        startDate: { gte: todayStr },
        endDate: { lte: holidaysEnd.toISOString() },
        isActive: true
      },
      orderBy: {
        startDate: 'asc'
      },
      take: 5
    });
    
    // Get conflicts (sessions with potential conflicts today)
    const conflicts = await prisma.scheduleSession.findMany({
      where: {
        date: todayStr,
        isCancelled: false,
        isActive: true,
        OR: [
          // Teacher conflicts (same teacher, same time slot)
          {
            instructorUserId: { in: todaySessions.map(s => s.instructorUserId) }
          }
        ]
      }
    });
    
    // Calculate conflict count (simplified - actual conflict detection is more complex)
    const conflictCount = Math.floor(conflicts.length / 2);
    
    // Get pending items (sessions requiring attention)
    const pendingItems = await prisma.scheduleSession.count({
      where: {
        date: { gte: todayStr },
        isCancelled: false,
        isActive: true,
        classroomId: null // Sessions without classroom assigned
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`[DashboardDbService] ✅ Retrieved dashboard summary in ${duration}ms`);
    
    return {
      success: true,
      data: {
        todaySchedule: {
          date: todayStr,
          totalSessions: todaySessions.length,
          sessions: todaySessions
        },
        teacherLoad: teacherLoad.map(tl => ({
          instructorId: tl.instructorUserId,
          instructorName: tl.instructor?.displayName || tl.instructor?.firstName || 'Unknown',
          sessionCount: tl._count.id
        })),
        classroomUtilization: classroomUtil.map(cu => ({
          classroomId: cu.classroomId,
          classroomName: cu.classroom?.nameEn || cu.classroom?.code || 'Unknown',
          sessionCount: cu._count.id
        })),
        holidays: upcomingHolidays,
        conflicts: {
          count: conflictCount,
          hasConflicts: conflictCount > 0
        },
        pendingItems: {
          count: pendingItems,
          hasPending: pendingItems > 0
        }
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
