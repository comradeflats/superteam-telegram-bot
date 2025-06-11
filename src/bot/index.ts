import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { BotContext } from '../types';
import { handleStart, handleStartSettings } from './commands/start';
import { handleSettings } from './commands/settings';
import { handleTestNotifications } from './commands/testNotifications';
import { handleEarnDeepLink, handleShowExample } from './handlers/earnIntegration';
import { 
  handleListingTypes, 
  handleToggleBounties, 
  handleToggleProjects, 
  handleBackToSettings 
} from './handlers/listingTypes';
import {
  handleUsdRange,
  handleSetMinUsd,
  handleSetMaxUsd,
  handleClearUsdRange,
  handleUsdInput
} from './handlers/usdRange';
import {
  handleSkills,
  handleSkillCategory,
  handleToggleSkill,
  handleClearAllSkills,
  handleBackToSkills
} from './handlers/skills';
import { handleViewSettings } from './handlers/viewSettings';
import { ParentSkills } from '../data/skills';
import { startNotificationScheduler, startTestScheduler } from '../services/cronService';

dotenv.config();

// Create bot instance
export const bot = new Telegraf<BotContext>(process.env.TELEGRAM_BOT_TOKEN!);

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('Sorry, something went wrong. Please try again.');
});

// Commands
bot.start(async (ctx) => {
  // Check if this is a deep link from Earn with user context
  const startPayload = ctx.startPayload;
  
  if (startPayload && startPayload.startsWith('earn_')) {
    // Deep link from Earn: /start earn_userid_123
    const earnUserId = startPayload.split('_')[2];
    await handleEarnDeepLink(ctx, earnUserId);
  } else if (startPayload === 'earn') {
    // Simple deep link from Earn: /start earn
    await handleEarnDeepLink(ctx);
  } else {
    // Regular start command
    await handleStart(ctx);
  }
});

bot.command('settings', handleSettings);
bot.command('testnotify', handleTestNotifications);

// Start flow
bot.action('start_settings', handleStartSettings);
bot.action('show_example', handleShowExample);

// Listing Types handlers
bot.action('listing_types', handleListingTypes);
bot.action('toggle_bounties', handleToggleBounties);
bot.action('toggle_projects', handleToggleProjects);
bot.action('back_to_settings', handleStartSettings); // Use handleStartSettings instead

// USD Range handlers
bot.action('usd_range', handleUsdRange);
bot.action('set_min_usd', handleSetMinUsd);
bot.action('set_max_usd', handleSetMaxUsd);
bot.action('clear_usd_range', handleClearUsdRange);

// Skills handlers
bot.action('skills', handleSkills);
bot.action('clear_all_skills', handleClearAllSkills);
bot.action('back_to_skills', handleBackToSkills);

// View Settings handler
bot.action('view_settings', handleViewSettings);

// Dynamic skill category handlers
bot.action(/^skill_category_(.+)$/, (ctx) => {
  const category = ctx.match[1] as ParentSkills;
  handleSkillCategory(ctx, category);
});

// Dynamic skill toggle handlers
bot.action(/^toggle_skill_(.+)$/, (ctx) => {
  const skillValue = ctx.match[1];
  handleToggleSkill(ctx, skillValue);
});

// Handle text messages (USD input + cleanup)
bot.on('text', async (ctx) => {
  try {
    // First check if this is USD input
    const handled = await handleUsdInput(ctx, ctx.text);
    
    if (!handled) {
      // Delete unrecognized messages
      await ctx.deleteMessage();
      
      // Send brief instruction that auto-deletes
      const instructionMsg = await ctx.reply('Please use the menu buttons to interact with the bot.');
      
      // Delete instruction after 3 seconds
      setTimeout(async () => {
        try {
          await ctx.deleteMessage(instructionMsg.message_id);
        } catch (e) {
          // Message might already be deleted, ignore
        }
      }, 3000);
    }
  } catch (error) {
    // If we can't delete (maybe in a group), just log
    console.log('Could not delete message:', error);
  }
});

// Start the bot
if (require.main === module) {
  bot.launch();
  console.log('🚀 Modular bot is running...');
  
  // Start the notification scheduler
  if (process.env.NODE_ENV === 'production') {
    startNotificationScheduler(); // Every hour in production
  } else {
    // For development, you can choose:
    // startTestScheduler(); // Every 2 minutes for testing
    // OR comment out to disable auto-notifications during development
    console.log('💡 Development mode: Auto-notifications disabled. Use /testnotify to test manually.');
  }
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('🛑 Shutting down bot...');
    bot.stop();
    process.exit(0);
  });
}
