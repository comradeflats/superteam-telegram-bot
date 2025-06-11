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

    const message = `Hello ${ctx.from.first_name}! 🎉

Welcome to Superteam Earn Notifications!

I'll help you stay updated with new bounties and projects.`;

    const startKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⚙️ Configure Notifications', 'start_settings')]
    ]);

    const sentMessage = await ctx.reply(message, startKeyboard);
    
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
    const message = `⚙️ Configure your notification preferences:

Set up filters to receive only the bounties and projects that match your interests.

*Updated: ${timestamp}*`;

    const settingsKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💰 USD Value Range', 'usd_range')],
      [Markup.button.callback('📋 Listing Types', 'listing_types')],
      [Markup.button.callback('🎯 Skills', 'skills')],
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
          await ctx.answerCbQuery('Settings loaded! ⚙️');
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
