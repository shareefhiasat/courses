# SLA Monitor Cron Job Setup

## Overview

The SLA Monitor checks workflow approval deadlines and sends notifications when:
- **Warning**: 25% time remaining (e.g., 6h before 24h deadline)
- **Overdue**: Deadline has passed

## Manual Execution

```powershell
# Dry run (test without sending notifications)
node backend/scripts/slaMonitor.js --dry-run

# Live run
node backend/scripts/slaMonitor.js
```

## Automated Scheduling

### Option 1: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Name: "LMS SLA Monitor"
4. Trigger: Daily at 9:00 AM (or every 6 hours)
5. Action: Start a program
   - Program: `node`
   - Arguments: `backend/scripts/slaMonitor.js`
   - Start in: `E:\QAF\Github\courses`

### Option 2: PowerShell Scheduled Job

```powershell
# Register scheduled job (runs every 6 hours)
$trigger = New-JobTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 6) -RepetitionDuration ([TimeSpan]::MaxValue)

Register-ScheduledJob -Name "LMS-SLA-Monitor" `
  -Trigger $trigger `
  -ScriptBlock {
    Set-Location "E:\QAF\Github\courses"
    node backend/scripts/slaMonitor.js
  }

# View scheduled jobs
Get-ScheduledJob

# Remove job
Unregister-ScheduledJob -Name "LMS-SLA-Monitor"
```

### Option 3: Node.js Cron (In-Process)

Add to `server.js`:

```javascript
import cron from 'node-cron';
import { exec } from 'child_process';

// Run SLA monitor every 6 hours
cron.schedule('0 */6 * * *', () => {
  console.log('[CRON] Running SLA Monitor...');
  exec('node backend/scripts/slaMonitor.js', (error, stdout, stderr) => {
    if (error) {
      console.error('[CRON] SLA Monitor failed:', error);
      return;
    }
    console.log('[CRON] SLA Monitor output:', stdout);
  });
});
```

Then install: `npm install node-cron`

## Configuration

### Environment Variables

```env
# Enable/disable notifications
NOTIFICATIONS_ENABLED=true

# SLA warning threshold (default: 0.25 = 25% time remaining)
SLA_WARNING_THRESHOLD=0.25
```

### Notification Channels

Edit `backend/services/notificationService.js` to configure:
- Email SMTP settings
- Push notification providers
- In-app notification behavior

## Monitoring

### Check Logs

```powershell
# View recent SLA monitor runs
Get-Content backend/logs/sla-monitor.log -Tail 50
```

### Database Queries

```sql
-- Check pending steps with SLA deadlines
SELECT 
  wi.id,
  wd.name as workflow,
  ws.name as stage,
  ws.sla_deadline,
  ws.status,
  ws.metadata
FROM workflow_steps ws
JOIN workflow_instances wi ON ws.instance_id = wi.id
JOIN workflow_definitions wd ON wi.definition_id = wd.id
WHERE ws.status = 'pending'
  AND ws.sla_deadline IS NOT NULL
ORDER BY ws.sla_deadline ASC;

-- Check overdue workflows
SELECT 
  wi.id,
  wd.name,
  ws.sla_deadline,
  NOW() - ws.sla_deadline as overdue_duration
FROM workflow_steps ws
JOIN workflow_instances wi ON ws.instance_id = wi.id
JOIN workflow_definitions wd ON wi.definition_id = wd.id
WHERE ws.status = 'pending'
  AND ws.sla_deadline < NOW()
ORDER BY ws.sla_deadline ASC;
```

## Troubleshooting

### No Notifications Sent

1. Check `NOTIFICATIONS_ENABLED=true` in `.env`
2. Verify notification service configuration
3. Check user roles match workflow stage requirements
4. Review notification logs

### Duplicate Notifications

The monitor tracks sent notifications in `workflow_steps.metadata`:
- `slaWarningNotified`: true/false
- `slaWarningNotifiedAt`: timestamp
- `slaOverdueNotified`: true/false
- `slaOverdueNotifiedAt`: timestamp

If duplicates occur, check the metadata is being updated correctly.

### Performance

For large deployments with many workflows:
- Add database indexes on `workflow_steps.status` and `workflow_steps.sla_deadline`
- Consider batching notifications
- Increase monitoring interval (e.g., every 12 hours instead of 6)

## Best Practices

1. **Test First**: Always run with `--dry-run` before live execution
2. **Monitor Regularly**: Check logs and database for anomalies
3. **Adjust Thresholds**: Tune warning threshold based on team response times
4. **Escalation**: Configure super_admin notifications for overdue items
5. **Audit Trail**: All notifications are logged in `workflow_history`
