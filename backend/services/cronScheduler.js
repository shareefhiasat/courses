/**
 * Cron Scheduler Service
 * 
 * Manages all scheduled jobs using node-cron
 * Jobs run in-process as long as the backend server is running
 */

import cron from 'node-cron';
import { runAttendanceThresholdCheck } from '../scripts/attendanceThresholdCheck.js';
import { runSlaMonitor } from '../scripts/slaMonitor.js';

const jobs = [];

/**
 * Initialize all cron jobs
 * Called from server.js on startup
 */
export function initCronJobs() {
  console.log('[CronScheduler] Initializing scheduled jobs...');

  // Attendance threshold check - every 6 hours
  const attendanceJob = cron.schedule('0 */6 * * *', async () => {
    console.log('[CronScheduler] Running attendance threshold check...');
    try {
      await runAttendanceThresholdCheck();
      console.log('[CronScheduler] Attendance threshold check completed');
    } catch (error) {
      console.error('[CronScheduler] Error in attendance threshold check:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Riyadh' // Adjust to your timezone
  });

  jobs.push({ name: 'attendanceThreshold', job: attendanceJob });

  // SLA monitor - every 6 hours
  const slaJob = cron.schedule('0 */6 * * *', async () => {
    console.log('[CronScheduler] Running SLA monitor...');
    try {
      await runSlaMonitor();
      console.log('[CronScheduler] SLA monitor completed');
    } catch (error) {
      console.error('[CronScheduler] Error in SLA monitor:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Riyadh'
  });

  jobs.push({ name: 'slaMonitor', job: slaJob });

  console.log(`[CronScheduler] ${jobs.length} jobs initialized successfully`);
}

/**
 * Stop all cron jobs
 * Called on server shutdown
 */
export function stopCronJobs() {
  console.log('[CronScheduler] Stopping all scheduled jobs...');
  jobs.forEach(({ name, job }) => {
    job.stop();
    console.log(`[CronScheduler] Stopped job: ${name}`);
  });
  jobs.length = 0;
}

/**
 * Get status of all jobs
 */
export function getJobsStatus() {
  return jobs.map(({ name, job }) => ({
    name,
    running: job.getStatus() === 'scheduled'
  }));
}

export default {
  initCronJobs,
  stopCronJobs,
  getJobsStatus
};
