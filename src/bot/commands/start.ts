import { Markup } from 'telegraf';
import { BotContext } from '../../types';
import { createOrUpdateUser } from '../utils/database';
import { sendTemporaryError } from '../utils/errorHandler';

// Track active start messages per user
const activeStartMessages = new Map<string, number>();

export async function handleStart(ctx: BotContext) {
  try {
    if (!ctx.from) return;
    
    const userId = ctx.from.id.toString();
    
    // Delete previous start message if exists
    const previousMessageId = activeStartMessages.get(userId);
    if (previousMessageId) {
      try {
        await ctx.deleteMessage(previousMessageId);
      } catch (e) {
        // Previous message might already be deleted
      }
    }
    
    await createOrUpdateUser(
      userId,
      ctx.from.username,
      ctx.from.first_name
    );

    const message = `🚀 **Welcome to Superteam Earn, ${ctx.from.first_name}!**

Never miss a perfect opportunity again! 

I'll send you **personalized notifications** for bounties and projects that match your skills and interests.

✨ Get paid for what you love doing
💰 Filter by reward amount  
🎯 Choose your skills
📱 Instant Telegram alerts

Ready to get started?`;

    const startKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Get Started!', 'start_settings')]
    ]);

    const sentMessage = await ctx.reply(message, { 
      ...startKeyboard, 
      parse_mode: 'Markdown' 
    });
    
    // Track this message ID
    activeStartMessages.set(userId, sentMessage.message_id);
    
  } catch (error) {
    console.error('Start command error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error starting the bot. Please try again.');
  }
}

export async function handleStartSettings(ctx: BotContext) {
  try {
    const timestamp = new Date().toLocaleTimeString();
    const message = `⚙️ **Set up your notifications**

Choose what opportunities you want to hear about:

💰 **Reward Range** - Set your minimum/maximum USD value
📋 **Types** - Bounties, Projects, or both  
🎯 **Skills** - Pick from 50+ categories
📚 **Library** - Save notifications for later

*Updated: ${timestamp}*`;

    const settingsKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💰 USD Value Range', 'usd_range')],
      [Markup.button.callback('📋 Listing Types', 'listing_types')],
      [Markup.button.callback('🎯 Skills', 'skills')],
      [Markup.button.callback('📚 My Library', 'my_library')],
      [Markup.button.callback('🌐 Browse Opportunities', 'browse_opportunities')],
      [Markup.button.callback('📊 View Current Settings', 'view_settings')]
    ]);

    try {
      if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
        await ctx.editMessageText(message, { ...settingsKeyboard, parse_mode: 'Markdown' });
      } else {
        await ctx.reply(message, { ...settingsKeyboard, parse_mode: 'Markdown' });
      }
    } catch (editError: any) {
      // If edit fails because message is the same, just answer the callback query
      if (editError.description?.includes('message is not modified')) {
        if (ctx.callbackQuery) {
          await ctx.answerCbQuery('Let\'s set up your notifications! 🚀');
        }
      } else {
        throw editError;
      }
    }
  } catch (error) {
    console.error('Start settings error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error loading settings.');
  }
}

// NEW: Handle browse opportunities action
export async function handleBrowseOpportunities(ctx: BotContext) {
  try {
    const message = `🌐 **Browse All Opportunities**

Explore what's available on Superteam Earn:

🎯 **Bounties** - Fixed rewards for specific tasks
💼 **Projects** - Ongoing work opportunities

Choose what you'd like to browse:`;

    const browseKeyboard = Markup.inlineKeyboard([
      [
        { text: "🎯 Browse Bounties", url: "https://earn.superteam.fun/all/?tab=bounties&utm_source=telegrambot" },
        { text: "💼 Browse Projects", url: "https://earn.superteam.fun/all/?tab=projects&utm_source=telegrambot" }
      ],
      [
        { text: "🌍 Browse All", url: "https://earn.superteam.fun/all/?utm_source=telegrambot" }
      ],
      [Markup.button.callback('⬅️ Back to Settings', 'start_settings')]
    ]);

    await ctx.editMessageText(message, { ...browseKeyboard, parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error showing browse opportunities:', error);
    await ctx.answerCbQuery('❌ Error loading opportunities');
  }
}
