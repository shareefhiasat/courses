/**
 * Cron Scheduler Service
 * 
 * Manages all scheduled jobs using node-cron
 * Jobs run in-process as long as the backend server is running
 */

import cron from 'node-cron';
import { runAttendanceThresholdCheck } from '../scripts/attendanceThresholdCheck.js';
import { runSlaMonitor } from '../scripts/slaMonitor.js';
import { ensureDailyWorkflows } from '../services/workflowDocumentService.js';
import { warmupAllMetrics } from '../ai/dataCache.js';

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

  // Ensure daily attendance workflows — weekday mornings at 6 AM Riyadh
  const ensureDailyJob = cron.schedule('0 6 * * 1-5', async () => {
    console.log('[CronScheduler] Ensuring daily attendance workflows...');
    try {
      const today = new Date();
      await ensureDailyWorkflows({ date: today.toISOString().slice(0, 10), classIds: [] });
      console.log('[CronScheduler] Daily workflow ensure completed');
    } catch (error) {
      console.error('[CronScheduler] Error ensuring daily workflows:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Riyadh',
  });

  jobs.push({ name: 'ensureDailyWorkflows', job: ensureDailyJob });

  // AI metric cache warm-up — high-rate refresh with setInterval for sub-minute intervals
  const fastMode = process.env.AI_FAST_MODE !== 'false';
  const refreshSeconds = parseInt(process.env.AI_CACHE_REFRESH_SECONDS || '60', 10);
  if (fastMode && refreshSeconds > 0) {
    // Run once shortly after startup
    setTimeout(() => {
      warmupAllMetrics().catch(err => console.error('[CronScheduler] Initial AI warm-up failed:', err.message));
    }, 5000);

    let isWarming = false;
    const aiWarmupFn = async () => {
      if (isWarming) {
        console.log('[CronScheduler] AI warm-up already running, skipping this tick');
        return;
      }
      isWarming = true;
      console.log('[CronScheduler] Running AI metric warm-up...');
      try {
        await warmupAllMetrics();
        console.log('[CronScheduler] AI metric warm-up completed');
      } catch (error) {
        console.error('[CronScheduler] AI metric warm-up error:', error.message);
      } finally {
        isWarming = false;
      }
    };

    if (refreshSeconds < 60) {
      // Cron only supports minute-level; use setInterval for high-rate invalidation (e.g. every 30s)
      const intervalMs = refreshSeconds * 1000;
      const intervalId = setInterval(aiWarmupFn, intervalMs);
      jobs.push({
        name: 'aiMetricWarmup',
        job: { stop: () => clearInterval(intervalId), getStatus: () => 'scheduled' },
      });
      console.log(`[CronScheduler] AI metric warm-up scheduled every ${refreshSeconds}s via setInterval`);
    } else {
      const aiWarmupJob = cron.schedule(`*/${Math.max(1, Math.floor(refreshSeconds / 60))} * * * *`, aiWarmupFn, {
        scheduled: true,
        timezone: 'Asia/Riyadh',
      });
      jobs.push({ name: 'aiMetricWarmup', job: aiWarmupJob });
      console.log(`[CronScheduler] AI metric warm-up scheduled every ${Math.max(1, Math.floor(refreshSeconds / 60))} minute(s) via cron`);
    }
  }

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
