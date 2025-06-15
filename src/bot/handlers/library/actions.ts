import { Markup } from 'telegraf';
import { BotContext } from '../../../types';
import { getUserSavedNotifications, saveNotificationToLibrary } from '../../../services/notificationService';
import { getCachedListing } from '../../../services/telegramNotificationService';

export async function handleMyLibraryAction(ctx: BotContext) {
  try {
    const savedNotifications = await getUserSavedNotifications(ctx.from.id.toString());
    
    if (savedNotifications.length === 0) {
      const message = `📚 **Your Library**

Your library is empty! 

Save notifications using the 💾 button when you receive them to access them later.`;

      const libraryKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Back to Settings', 'start_settings')]
      ]);

      await ctx.editMessageText(message, { ...libraryKeyboard, parse_mode: 'Markdown' });
      return;
    }
    
    const libraryText = `📚 **Your Library** (${savedNotifications.length} items)

${savedNotifications.slice(0, 3).map((notification, index) => {
      const deadline = new Date(notification.deadline);
      const isUrgent = deadline.getTime() - Date.now() < 24 * 60 * 60 * 1000;
      const urgentIcon = isUrgent ? '🔥 ' : '';
      
      return `${urgentIcon}**${notification.listingTitle}**
💰 ${notification.rewardText} | ⏰ ${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }).join('\n\n')}${savedNotifications.length > 3 ? `\n\n... and ${savedNotifications.length - 3} more items` : ''}`;

    // Simplified keyboard - removed Active button, kept Full List, Urgent, and Manage Items
    const libraryKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('📋 Full List', 'library_full'),
        Markup.button.callback('🔥 Urgent', 'library_urgent')
      ],
      [
        Markup.button.callback('🧹 Manage Items', 'library_manage')
      ],
      [Markup.button.callback('⬅️ Back to Settings', 'start_settings')]
    ]);

    await ctx.editMessageText(libraryText, { ...libraryKeyboard, parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error showing library:', error);
    await ctx.answerCbQuery('❌ Error accessing library');
  }
}

export async function handleLibraryUrgentAction(ctx: BotContext) {
  try {
    const savedNotifications = await getUserSavedNotifications(ctx.from.id.toString());
    const endingSoon = savedNotifications.filter(n => {
      const deadline = new Date(n.deadline);
      const hoursLeft = (deadline.getTime() - Date.now()) / (60 * 60 * 1000);
      return hoursLeft > 0 && hoursLeft <= 24;
    });
    
    if (endingSoon.length === 0) {
      const message = `🔥 **Ending Soon**

✅ No opportunities ending in the next 24 hours.

You're all caught up!`;

      const backKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Back to Library', 'my_library')]
      ]);

      await ctx.editMessageText(message, { ...backKeyboard, parse_mode: 'Markdown' });
      return;
    }
    
    const urgentText = `🔥 **Ending Soon** (${endingSoon.length} items)

${endingSoon.map(notification => {
      const deadline = new Date(notification.deadline);
      const hoursLeft = Math.round((deadline.getTime() - Date.now()) / (60 * 60 * 1000));
      
      return `🚨 **${notification.listingTitle}**
💰 ${notification.rewardText} | ⏰ **${hoursLeft}h left!**
🔗 [Apply Now](${notification.listingUrl})`;
    }).join('\n\n')}`;

    // Simplified keyboard - removed Active button
    const urgentKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('📋 Full List', 'library_full')
      ],
      [Markup.button.callback('⬅️ Back to Library', 'my_library')]
    ]);

    await ctx.editMessageText(urgentText, { ...urgentKeyboard, parse_mode: 'Markdown', disable_web_page_preview: true });
    
  } catch (error) {
    console.error('Error showing urgent notifications:', error);
    await ctx.answerCbQuery('❌ Error loading urgent items');
  }
}

export async function handleLibraryFullAction(ctx: BotContext) {
  try {
    const savedNotifications = await getUserSavedNotifications(ctx.from.id.toString());
    
    if (savedNotifications.length === 0) {
      const message = `📋 **Full Library List**

Your library is empty!`;

      const backKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Back to Library', 'my_library')]
      ]);

      await ctx.editMessageText(message, { ...backKeyboard, parse_mode: 'Markdown' });
      return;
    }

    const fullText = `📋 **Full Library List** (${savedNotifications.length} items)

${savedNotifications.map((notification, index) => {
      const deadline = new Date(notification.deadline);
      const isUrgent = deadline.getTime() - Date.now() < 24 * 60 * 60 * 1000;
      const urgentIcon = isUrgent ? '🔥 ' : '';
      
      return `${urgentIcon}**${notification.listingTitle}**
💰 ${notification.rewardText} | ⏰ ${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
🔗 [View](${notification.listingUrl})`;
    }).join('\n\n')}`;

    // Simplified keyboard - removed Active button
    const fullKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🔥 Urgent', 'library_urgent')
      ],
      [Markup.button.callback('⬅️ Back to Library', 'my_library')]
    ]);

    await ctx.editMessageText(fullText, { ...fullKeyboard, parse_mode: 'Markdown', disable_web_page_preview: true });
    
  } catch (error) {
    console.error('Error showing full library:', error);
    await ctx.answerCbQuery('❌ Error loading full list');
  }
}

// NEW: Library management options
export async function handleLibraryManage(ctx: BotContext) {
  try {
    const savedNotifications = await getUserSavedNotifications(ctx.from.id.toString());
    
    if (savedNotifications.length === 0) {
      const message = `🧹 **Manage Library**

Your library is empty!`;

      const backKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Back to Library', 'my_library')]
      ]);

      await ctx.editMessageText(message, { ...backKeyboard, parse_mode: 'Markdown' });
      return;
    }

    const message = `🧹 **Manage Library Items** (${savedNotifications.length} total)

Choose how you'd like to clean up your library:

🗑️ **Remove Expired** - Auto-remove items past deadline
📝 **Select Items** - Choose specific items to delete  
🧹 **Clear All** - Remove everything (use with caution)`;

    const manageKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🗑️ Remove Expired', 'library_remove_expired')],
      [Markup.button.callback('📝 Select Items', 'library_select_items')],
      [Markup.button.callback('🧹 Clear All', 'library_clear_all_confirm')],
      [Markup.button.callback('⬅️ Back to Library', 'my_library')]
    ]);

    await ctx.editMessageText(message, { ...manageKeyboard, parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error showing library management:', error);
    await ctx.answerCbQuery('❌ Error loading management options');
  }
}

// Auto-remove expired items (deadline + 1 day)
export async function handleLibraryRemoveExpired(ctx: BotContext) {
  try {
    const { PrismaClient } = await import('../../../generated/prisma');
    const prisma = new PrismaClient();
    
    // Remove items that are 1 day past their deadline
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const result = await prisma.notificationLibrary.deleteMany({
      where: {
        telegramUserId: ctx.from.id.toString(),
        deadline: {
          lt: oneDayAgo
        }
      }
    });
    
    const message = `🗑️ **Remove Expired Items**

Removed ${result.count} expired item${result.count !== 1 ? 's' : ''}.

${result.count > 0 ? 'Items past their deadline (+1 day) have been cleaned up!' : 'No expired items found.'}`;

    const backKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Back to Library', 'my_library')]
    ]);

    await ctx.editMessageText(message, { ...backKeyboard, parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error removing expired items:', error);
    await ctx.answerCbQuery('❌ Error removing expired items');
  }
}

// Show items for selective deletion
export async function handleLibrarySelectItems(ctx: BotContext) {
  try {
    const savedNotifications = await getUserSavedNotifications(ctx.from.id.toString());
    
    if (savedNotifications.length === 0) {
      const message = `📝 **Select Items to Delete**

No items in your library to select.`;

      const backKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Back to Manage', 'library_manage')]
      ]);

      await ctx.editMessageText(message, { ...backKeyboard, parse_mode: 'Markdown' });
      return;
    }

    const message = `📝 **Select Items to Delete**

Choose which notifications to remove:

${savedNotifications.slice(0, 5).map((notification, index) => {
      const deadline = new Date(notification.deadline);
      return `${index + 1}. **${notification.listingTitle}**
💰 ${notification.rewardText} | ⏰ ${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }).join('\n\n')}${savedNotifications.length > 5 ? `\n\n... and ${savedNotifications.length - 5} more items` : ''}

Tap an item to remove it:`;

    const selectKeyboard = Markup.inlineKeyboard([
      ...savedNotifications.slice(0, 5).map((notification, index) => [
        Markup.button.callback(
          `❌ ${notification.listingTitle.slice(0, 25)}${notification.listingTitle.length > 25 ? '...' : ''}`, 
          `library_delete_${notification.id}`
        )
      ]),
      ...(savedNotifications.length > 5 ? [[Markup.button.callback('📋 Show All Items', 'library_select_all')]] : []),
      [Markup.button.callback('⬅️ Back to Manage', 'library_manage')]
    ]);

    await ctx.editMessageText(message, { ...selectKeyboard, parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error showing item selection:', error);
    await ctx.answerCbQuery('❌ Error loading items');
  }
}

// Clear all confirmation
export async function handleLibraryClearAllConfirm(ctx: BotContext) {
  try {
    const message = `🧹 **Clear All Items**

⚠️ **This will remove ALL notifications from your library.**

Are you sure you want to continue?`;

    const confirmKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Yes, Clear All', 'library_clear_all_execute'),
        Markup.button.callback('❌ Cancel', 'library_manage')
      ]
    ]);

    await ctx.editMessageText(message, { ...confirmKeyboard, parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error showing clear all confirmation:', error);
    await ctx.answerCbQuery('❌ Error loading confirmation');
  }
}

export async function handleLibraryClearAllExecute(ctx: BotContext) {
  try {
    const { PrismaClient } = await import('../../../generated/prisma');
    const prisma = new PrismaClient();
    
    const result = await prisma.notificationLibrary.deleteMany({
      where: {
        telegramUserId: ctx.from.id.toString()
      }
    });
    
    const message = `🧹 **Library Cleared**

Removed all ${result.count} item${result.count !== 1 ? 's' : ''} from your library.

Your library is now empty!`;

    const backKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Back to Library', 'my_library')]
    ]);

    await ctx.editMessageText(message, { ...backKeyboard, parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error clearing library:', error);
    await ctx.answerCbQuery('❌ Error clearing library');
  }
}

// Handle individual item deletion
export async function handleLibraryDeleteItem(ctx: BotContext) {
  try {
    const itemId = ctx.match![1];
    const { PrismaClient } = await import('../../../generated/prisma');
    const prisma = new PrismaClient();
    
    // Get the item first to show its name
    const item = await prisma.notificationLibrary.findUnique({
      where: { id: itemId }
    });
    
    if (!item) {
      await ctx.answerCbQuery('Item not found');
      return;
    }
    
    await prisma.notificationLibrary.delete({
      where: { id: itemId }
    });
    
    await ctx.answerCbQuery(`🗑️ Deleted: ${item.listingTitle}`);
    
    // Refresh the selection screen
    await handleLibrarySelectItems(ctx);
    
  } catch (error) {
    console.error('Error deleting item:', error);
    await ctx.answerCbQuery('❌ Error deleting item');
  }
}

export async function handleSaveNotification(ctx: BotContext) {
  try {
    const listingId = ctx.match![1];
    
    // Get the real listing data from cache
    const listing = getCachedListing(listingId);
    
    if (!listing) {
      await ctx.answerCbQuery('❌ Listing data not found');
      return;
    }
    
    // Save the REAL listing to library
    await saveNotificationToLibrary(ctx.from.id.toString(), listing);
    await ctx.answerCbQuery('💾 Saved to library!');
    
    // Show brief confirmation
    const confirmMsg = await ctx.reply('💾 Saved to library!');
    
    // Remove the original notification immediately  
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (e) {}
    }, 1000);
    
    // Remove confirmation after 2 seconds
    setTimeout(async () => {
      try {
        await ctx.deleteMessage(confirmMsg.message_id);
      } catch (e) {}
    }, 2000);
    
  } catch (error) {
    console.error('Error saving notification:', error);
    await ctx.answerCbQuery('❌ Error saving notification');
  }
}

export async function handleDismissNotification(ctx: BotContext) {
  try {
    await ctx.answerCbQuery('❌ Dismissed');
    
    // Remove the original notification FIRST (immediately)
    setTimeout(async () => {
      try {
        await ctx.deleteMessage();
      } catch (e) {}
    }, 500);
    
    // Show confirmation after original is gone
    setTimeout(async () => {
      try {
        const confirmMsg = await ctx.reply('❌ Dismissed.');
        
        // Remove confirmation after 2 seconds
        setTimeout(async () => {
          try {
            await ctx.deleteMessage(confirmMsg.message_id);
          } catch (e) {}
        }, 2000);
      } catch (e) {}
    }, 600);
    
  } catch (error) {
    console.error('Error dismissing notification:', error);
    await ctx.answerCbQuery('❌ Error dismissing notification');
  }
}
