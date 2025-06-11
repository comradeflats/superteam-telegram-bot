import cron from 'node-cron';
import { processAndSendNotifications } from './telegramNotificationService';

export function startNotificationScheduler(): void {
  console.log('🕐 Starting notification scheduler...');
  
  // Run every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
  const cronExpression = '0 * * * *'; // minute hour day month weekday
  
  cron.schedule(cronExpression, async () => {
    console.log(`\n⏰ [${new Date().toISOString()}] Running scheduled notification check...`);
    
    try {
      await processAndSendNotifications();
      console.log('✅ Scheduled notification check completed');
    } catch (error) {
      console.error('❌ Error in scheduled notification check:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC" // Use UTC for consistency
  });
  
  console.log('✅ Notification scheduler started - will run every hour');
  
  // Optional: Also run once on startup to check for any missed notifications
  setTimeout(async () => {
    console.log('🚀 Running initial notification check on startup...');
    try {
      await processAndSendNotifications();
      console.log('✅ Initial notification check completed');
    } catch (error) {
      console.error('❌ Error in initial notification check:', error);
    }
  }, 5000); // Wait 5 seconds after startup
}

export function startTestScheduler(): void {
  console.log('🧪 Starting TEST scheduler (runs every 2 minutes)...');
  
  // For testing: run every 2 minutes
  const testCronExpression = '*/2 * * * *'; // every 2 minutes
  
  cron.schedule(testCronExpression, async () => {
    console.log(`\n⏰ [${new Date().toISOString()}] Running TEST notification check...`);
    
    try {
      await processAndSendNotifications();
      console.log('✅ TEST notification check completed');
    } catch (error) {
      console.error('❌ Error in TEST notification check:', error);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log('✅ TEST scheduler started - will run every 2 minutes');
}
