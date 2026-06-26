/**
 * SLA Monitor Cron Job
 *
 * Monitors workflow SLA deadlines and sends notifications:
 * - Warning at 25% time remaining (e.g., 6h before 24h deadline)
 * - Overdue notification when deadline passes
 *
 * Run: node backend/scripts/slaMonitor.js
 * Or schedule with cron/systemd timer
 */

import prisma from '../db/prismaClient.js';
import notificationGateway from '../services/notifications/index.js';
import { EVENTS } from '../services/notifications/constants.js';


const SLA_WARNING_THRESHOLD_PERCENT = 0.25; // Warn at 25% time remaining
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log('🔔 SLA Monitor Starting...');
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

  try {
    // Get all pending workflow steps with SLA deadlines
    const pendingSteps = await prisma.workflowStep.findMany({
      where: {
        status: 'pending',
        slaDeadline: { not: null },
      },
      include: {
        instance: {
          include: {
            definition: true,
            currentStage: true,
          },
        },
        stage: true,
      },
    });

    console.log(`📊 Found ${pendingSteps.length} pending steps with SLA deadlines\n`);

    const now = new Date();
    let warningCount = 0;
    let overdueCount = 0;

    for (const step of pendingSteps) {
      const deadline = new Date(step.slaDeadline);
      const timeRemaining = deadline - now;
      const timeRemainingHours = timeRemaining / (1000 * 60 * 60);

      // Calculate original SLA duration
      const createdAt = new Date(step.createdAt);
      const totalDuration = deadline - createdAt;
      const elapsedPercent = (now - createdAt) / totalDuration;

      console.log(`\n📄 Instance: ${step.instance.id}`);
      console.log(`   Definition: ${step.instance.definition.name}`);
      console.log(`   Stage: ${step.stage.name}`);
      console.log(`   Deadline: ${deadline.toISOString()}`);
      console.log(`   Time Remaining: ${timeRemainingHours.toFixed(1)}h`);
      console.log(`   Elapsed: ${(elapsedPercent * 100).toFixed(1)}%`);

      // Check if overdue
      if (timeRemaining < 0) {
        console.log(`   ⚠️  STATUS: OVERDUE by ${Math.abs(timeRemainingHours).toFixed(1)}h`);
        
        // Check if we already sent overdue notification
        const alreadyNotified = step.metadata?.slaOverdueNotified;
        
        if (!alreadyNotified) {
          if (!DRY_RUN) {
            // Notify all approvers
            const approvers = await prisma.user.findMany({
              where: { roles: { hasSome: step.assignedRoles } },
              select: { id: true, email: true, name: true },
            });
            for (const user of approvers) {
              await notificationGateway.emit(EVENTS.WORKFLOW_SLA_OVERDUE, {
                instanceId: step.instance.id,
                workflowName: step.instance.definition.name,
                stageName: step.stage.name,
                overdueSince: new Date(),
              }, { userId: user.id, email: user.email, name: user.name });
            }
            
            // Mark as notified
            await prisma.workflowStep.update({
              where: { id: step.id },
              data: {
                metadata: {
                  ...(step.metadata || {}),
                  slaOverdueNotified: true,
                  slaOverdueNotifiedAt: now.toISOString(),
                },
              },
            });
            
            console.log(`   ✅ Overdue notification sent`);
          } else {
            console.log(`   🔍 [DRY RUN] Would send overdue notification`);
          }
          overdueCount++;
        } else {
          console.log(`   ℹ️  Already notified (at ${step.metadata.slaOverdueNotifiedAt})`);
        }
      }
      // Check if approaching deadline (warning threshold)
      else if (elapsedPercent >= (1 - SLA_WARNING_THRESHOLD_PERCENT)) {
        console.log(`   ⏰ STATUS: WARNING (${timeRemainingHours.toFixed(1)}h remaining)`);
        
        // Check if we already sent warning
        const alreadyWarned = step.metadata?.slaWarningNotified;
        
        if (!alreadyWarned) {
          if (!DRY_RUN) {
            // Notify all approvers
            const approvers = await prisma.user.findMany({
              where: { roles: { hasSome: step.assignedRoles } },
              select: { id: true, email: true, name: true },
            });
            for (const user of approvers) {
              await notificationGateway.emit(EVENTS.WORKFLOW_SLA_WARNING, {
                instanceId: step.instance.id,
                workflowName: step.instance.definition.name,
                stageName: step.stage.name,
                hoursRemaining: Math.round(timeRemainingHours),
              }, { userId: user.id, email: user.email, name: user.name });
            }
            
            // Mark as warned
            await prisma.workflowStep.update({
              where: { id: step.id },
              data: {
                metadata: {
                  ...(step.metadata || {}),
                  slaWarningNotified: true,
                  slaWarningNotifiedAt: now.toISOString(),
                },
              },
            });
            
            console.log(`   ✅ Warning notification sent`);
          } else {
            console.log(`   🔍 [DRY RUN] Would send warning notification`);
          }
          warningCount++;
        } else {
          console.log(`   ℹ️  Already warned (at ${step.metadata.slaWarningNotifiedAt})`);
        }
      }
      // Still on track
      else {
        console.log(`   ✅ STATUS: ON TRACK`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Summary:');
    console.log(`   Total Steps Monitored: ${pendingSteps.length}`);
    console.log(`   Warnings Sent: ${warningCount}`);
    console.log(`   Overdue Notifications Sent: ${overdueCount}`);
    console.log('='.repeat(60));
    console.log('\n✅ SLA Monitor Complete\n');

  } catch (error) {
    console.error('❌ SLA Monitor Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
