import { BotContext } from '../../types';
import { createOrUpdateUser } from '../utils/database';
import { sendTemporaryError } from '../utils/errorHandler';
import { logger } from '../../utils/logger';

export async function handleEarnDeepLink(ctx: BotContext, earnUserId?: string) {
  try {
    if (!ctx.from) return;
    
    logger.info(`Deep link accessed by user ${ctx.from.id}${earnUserId ? ` with Earn ID ${earnUserId}` : ''}`);
    
    // Create or update user with Earn context
    await createOrUpdateUser(
      ctx.from.id.toString(),
      ctx.from.username,
      ctx.from.first_name
    );
    
    // If earnUserId is provided, we could store the connection
    // For now, we'll just acknowledge it
    
    const welcomeMessage = earnUserId 
      ? `Welcome from Superteam Earn! 🎉\n\nYour account is now connected for personalized notifications.`
      : `Welcome from Superteam Earn! 🎉\n\nI'll help you stay updated with relevant bounties and projects.`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '⚙️ Set Up Notifications', callback_data: 'start_settings' }],
        [{ text: '📊 View Example Notification', callback_data: 'show_example' }]
      ]
    };

    await ctx.reply(welcomeMessage, { reply_markup: keyboard });
    
  } catch (error) {
    logger.error('Earn deep link error:', error);
    await sendTemporaryError(ctx, 'Welcome! There was a minor issue, but you can still set up notifications.');
  }
}

export async function handleShowExample(ctx: BotContext) {
  try {
    const exampleMessage = `🚀 **New Bounty!**

**Build a React Dashboard for DeFi Analytics**

💰 **Reward:** 2500 USDC ($2500)
🏢 **Sponsor:** SuperteamDAO
🎯 **Skills:** React, Javascript, UI/UX Design
⏰ **Deadline:** Jun 18, 2025


*This is what your notifications will look like!*`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '⚙️ Configure My Preferences', callback_data: 'start_settings' }]
      ]
    };

    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      await ctx.editMessageText(exampleMessage, { 
        reply_markup: keyboard, 
        parse_mode: 'Markdown',
        disable_web_page_preview: true 
      });
    } else {
      await ctx.reply(exampleMessage, { 
        reply_markup: keyboard, 
        parse_mode: 'Markdown',
        disable_web_page_preview: true 
      });
    }
    
  } catch (error) {
    logger.error('Show example error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error showing the example.');
  }
}
