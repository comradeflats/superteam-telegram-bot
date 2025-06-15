import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { BotContext } from '../types';
import { handleStart, handleStartSettings, handleBrowseOpportunities } from './commands/start';
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

// Import library handlers
import {
  handleLibraryCommand,
  handleActiveCommand,
  handleEndingSoonCommand,
  handleClearExpiredCommand,
  handleMyLibraryAction,
  handleLibraryUrgentAction,
  handleLibraryFullAction,
  handleLibraryManage,
  handleLibraryRemoveExpired,
  handleLibrarySelectItems,
  handleLibraryClearAllConfirm,
  handleLibraryClearAllExecute,
  handleLibraryDeleteItem,
  handleSaveNotification,
  handleDismissNotification
} from './handlers/library';

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
  const startPayload = ctx.startPayload;
  
  if (startPayload && startPayload.startsWith('earn_')) {
    const earnUserId = startPayload.split('_')[2];
    await handleEarnDeepLink(ctx, earnUserId);
  } else if (startPayload === 'earn') {
    await handleEarnDeepLink(ctx);
  } else {
    await handleStart(ctx);
  }
});

bot.command('settings', handleSettings);
bot.command('testnotify', handleTestNotifications);

// Library Commands (still available for power users)
bot.command('library', handleLibraryCommand);
bot.command('active', handleActiveCommand);
bot.command('ending_soon', handleEndingSoonCommand);
bot.command('clear_expired', handleClearExpiredCommand);

// Basic Action Handlers
bot.action('start_settings', handleStartSettings);
bot.action('show_example', handleShowExample);
bot.action('browse_opportunities', handleBrowseOpportunities);

// Feature Handlers
bot.action('listing_types', handleListingTypes);
bot.action('toggle_bounties', handleToggleBounties);
bot.action('toggle_projects', handleToggleProjects);
bot.action('back_to_settings', handleStartSettings);

bot.action('usd_range', handleUsdRange);
bot.action('set_min_usd', handleSetMinUsd);
bot.action('set_max_usd', handleSetMaxUsd);
bot.action('clear_usd_range', handleClearUsdRange);

bot.action('skills', handleSkills);
bot.action('clear_all_skills', handleClearAllSkills);
bot.action('back_to_skills', handleBackToSkills);

bot.action('view_settings', handleViewSettings);

// Library Action Handlers
bot.action('my_library', handleMyLibraryAction);
bot.action('library_urgent', handleLibraryUrgentAction);
bot.action('library_full', handleLibraryFullAction);

// NEW: Enhanced Library Management
bot.action('library_manage', handleLibraryManage);
bot.action('library_remove_expired', handleLibraryRemoveExpired);
bot.action('library_select_items', handleLibrarySelectItems);
bot.action('library_clear_all_confirm', handleLibraryClearAllConfirm);
bot.action('library_clear_all_execute', handleLibraryClearAllExecute);

// Individual item deletion
bot.action(/^library_delete_(.+)$/, handleLibraryDeleteItem);

// Notification Action Handlers
bot.action(/^save_(.+)$/, handleSaveNotification);
bot.action(/^dismiss_(.+)$/, handleDismissNotification);

// Dynamic Handlers
bot.action(/^skill_category_(.+)$/, (ctx) => {
  const category = ctx.match[1] as ParentSkills;
  handleSkillCategory(ctx, category);
});

bot.action(/^toggle_skill_(.+)$/, (ctx) => {
  const skillValue = ctx.match[1];
  handleToggleSkill(ctx, skillValue);
});

// Text Message Handler
bot.on('text', async (ctx) => {
  try {
    const handled = await handleUsdInput(ctx, ctx.text);
    
    if (!handled) {
      await ctx.deleteMessage();
      const instructionMsg = await ctx.reply('💡 Please use the menu buttons above to navigate. They make everything easier!');
      
      setTimeout(async () => {
        try {
          await ctx.deleteMessage(instructionMsg.message_id);
        } catch (e) {}
      }, 3000);
    }
  } catch (error) {
    console.log('Could not delete message:', error);
  }
});

// Start the bot
if (require.main === module) {
  bot.launch();
  console.log('🚀 Modular bot with Enhanced Library Management is running...');
  
  if (process.env.NODE_ENV === 'production') {
    startNotificationScheduler();
  } else {
    console.log('💡 Development mode: Auto-notifications disabled. Use /testnotify to test manually.');
  }
  
  process.on('SIGINT', () => {
    console.log('🛑 Shutting down bot...');
    bot.stop();
    process.exit(0);
  });
}
