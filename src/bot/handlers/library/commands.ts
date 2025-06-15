import { BotContext } from '../../../types';
import { getUserSavedNotifications, cleanupExpiredNotifications } from '../../../services/notificationService';

export async function handleLibraryCommand(ctx: BotContext) {
  try {
    const savedNotifications = await getUserSavedNotifications(ctx.from.id.toString());
    
    if (savedNotifications.length === 0) {
      return ctx.reply('📚 Your library is empty!\n\nSave notifications using the 💾 button when you receive them to access them later.');
    }
    
    const libraryText = `📚 **Your Notification Library** (${savedNotifications.length} items)

${savedNotifications.slice(0, 10).map((notification, index) => {
  const deadline = new Date(notification.deadline);
  const isUrgent = deadline.getTime() - Date.now() < 24 * 60 * 60 * 1000;
  const urgentIcon = isUrgent ? '🔥 ' : '';
  
  return `${urgentIcon}**${notification.listingTitle}**
💰 ${notification.rewardText} | ${notification.sponsorName}
⏰ Deadline: ${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
🔗 [View Details](${notification.listingUrl})

`;
}).join('')}${savedNotifications.length > 10 ? `\n... and ${savedNotifications.length - 10} more items` : ''}

💡 **Commands:**
/active - Active opportunities only
/ending_soon - Ending in 24 hours
/clear_expired - Remove expired items`;

    return ctx.reply(libraryText, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true 
    });
  } catch (error) {
    console.error('Error showing library:', error);
    return ctx.reply('❌ Sorry, there was an error accessing your library. Please try again.');
  }
}

export async function handleActiveCommand(ctx: BotContext) {
  try {
    const savedNotifications = await getUserSavedNotifications(ctx.from.id.toString());
    const activeNotifications = savedNotifications.filter(n => new Date(n.deadline) > new Date());
    
    if (activeNotifications.length === 0) {
      return ctx.reply('📊 No active opportunities in your library.\n\nSave notifications to keep track of opportunities!');
    }
    
    const activeText = `📊 **Active Opportunities** (${activeNotifications.length} items)

${activeNotifications.slice(0, 10).map(notification => {
  const deadline = new Date(notification.deadline);
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  
  return `**${notification.listingTitle}**
💰 ${notification.rewardText}
⏰ ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left
🔗 [Apply](${notification.listingUrl})

`;
}).join('')}

Use /library to see all saved notifications`;

    return ctx.reply(activeText, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true 
    });
  } catch (error) {
    console.error('Error showing active notifications:', error);
    return ctx.reply('❌ Sorry, there was an error. Please try again.');
  }
}

export async function handleEndingSoonCommand(ctx: BotContext) {
  try {
    const savedNotifications = await getUserSavedNotifications(ctx.from.id.toString());
    const endingSoon = savedNotifications.filter(n => {
      const deadline = new Date(n.deadline);
      const hoursLeft = (deadline.getTime() - Date.now()) / (60 * 60 * 1000);
      return hoursLeft > 0 && hoursLeft <= 24;
    });
    
    if (endingSoon.length === 0) {
      return ctx.reply('✅ No opportunities ending in the next 24 hours.\n\nYou\'re all caught up!');
    }
    
    const urgentText = `🔥 **Ending Soon** (${endingSoon.length} items)

${endingSoon.map(notification => {
  const deadline = new Date(notification.deadline);
  const hoursLeft = Math.round((deadline.getTime() - Date.now()) / (60 * 60 * 1000));
  
  return `🚨 **${notification.listingTitle}**
💰 ${notification.rewardText}
⏰ **${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left!**
🔗 [Apply Now](${notification.listingUrl})

`;
}).join('')}

⚡ Don't miss out on these opportunities!`;

    return ctx.reply(urgentText, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true 
    });
  } catch (error) {
    console.error('Error showing ending soon notifications:', error);
    return ctx.reply('❌ Sorry, there was an error. Please try again.');
  }
}

export async function handleClearExpiredCommand(ctx: BotContext) {
  try {
    const deletedCount = await cleanupExpiredNotifications();
    return ctx.reply(`🧹 Cleaned up ${deletedCount} expired notification${deletedCount !== 1 ? 's' : ''} from the library.`);
  } catch (error) {
    console.error('Error clearing expired notifications:', error);
    return ctx.reply('❌ Sorry, there was an error clearing expired notifications.');
  }
}
