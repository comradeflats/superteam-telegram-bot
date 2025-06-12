import { BotContext } from '../../types';
import { getUserWithPreferences, updateUserPreferences } from '../utils/database';
import { createBackToSettingsKeyboard } from '../utils/keyboards';
import { sendTemporaryError } from '../utils/errorHandler';

// Store user states for USD input
const userStates = new Map<string, { 
  state: 'waiting_min' | 'waiting_max',
  messageId: number,
  chatId: number
}>();

export async function handleUsdRange(ctx: BotContext) {
  try {
    if (!ctx.from) return;

    const user = await getUserWithPreferences(ctx.from.id.toString());
    if (!user) {
      await sendTemporaryError(ctx, 'User not found. Please use /start first.');
      return;
    }

    const prefs = user.preferences;
    const currentMin = prefs?.minUsdValue || 'Not set';
    const currentMax = prefs?.maxUsdValue || 'Not set';

    const message = `💰 USD Value Range Settings

Current range: $${currentMin} - $${currentMax}

Choose what to update:`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🔽 Set Minimum USD', callback_data: 'set_min_usd' }],
        [{ text: '🔼 Set Maximum USD', callback_data: 'set_max_usd' }],
        [{ text: '🗑️ Clear Range', callback_data: 'clear_usd_range' }],
        [{ text: '⬅️ Back to Settings', callback_data: 'back_to_settings' }]
      ]
    };

    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      await ctx.editMessageText(message, { reply_markup: keyboard });
    } else {
      await ctx.reply(message, { reply_markup: keyboard });
    }
  } catch (error) {
    console.error('USD range error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error loading USD range settings.');
  }
}

export async function handleSetMinUsd(ctx: BotContext) {
  try {
    if (!ctx.from || !ctx.callbackQuery || !('message' in ctx.callbackQuery)) return;
    
    const messageId = ctx.callbackQuery.message!.message_id;
    const chatId = ctx.callbackQuery.message!.chat.id;
    
    userStates.set(ctx.from.id.toString(), {
      state: 'waiting_min',
      messageId,
      chatId
    });
    
    // Get current max to show in hint
    const user = await getUserWithPreferences(ctx.from.id.toString());
    const currentMax = user?.preferences?.maxUsdValue;
    const maxHint = currentMax ? `\n(Must be less than current max: $${currentMax})` : '';
    
    const message = `💰 Enter minimum USD value (numbers only):

Example: 100 (for $100 minimum)${maxHint}

Type your number below:`;

    await ctx.editMessageText(message, createBackToSettingsKeyboard());
  } catch (error) {
    console.error('Set min USD error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error setting up minimum USD input.');
  }
}

export async function handleSetMaxUsd(ctx: BotContext) {
  try {
    if (!ctx.from || !ctx.callbackQuery || !('message' in ctx.callbackQuery)) return;
    
    const messageId = ctx.callbackQuery.message!.message_id;
    const chatId = ctx.callbackQuery.message!.chat.id;
    
    userStates.set(ctx.from.id.toString(), {
      state: 'waiting_max',
      messageId,
      chatId
    });
    
    // Get current min to show in hint
    const user = await getUserWithPreferences(ctx.from.id.toString());
    const currentMin = user?.preferences?.minUsdValue;
    const minHint = currentMin ? `\n(Must be greater than current min: $${currentMin})` : '';
    
    const message = `💰 Enter maximum USD value (numbers only):

Example: 5000 (for $5000 maximum)${minHint}

Type your number below:`;

    await ctx.editMessageText(message, createBackToSettingsKeyboard());
  } catch (error) {
    console.error('Set max USD error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error setting up maximum USD input.');
  }
}

export async function handleClearUsdRange(ctx: BotContext) {
  try {
    if (!ctx.from) return;

    const user = await getUserWithPreferences(ctx.from.id.toString());
    if (!user) return;

    await updateUserPreferences(user.id, { 
      minUsdValue: null,
      maxUsdValue: null
    });

    await ctx.answerCbQuery('USD range cleared!');
    await handleUsdRange(ctx); // Refresh the menu
  } catch (error) {
    console.error('Clear USD range error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error clearing USD range.');
  }
}

export async function handleUsdInput(ctx: BotContext, text: string) {
  try {
    if (!ctx.from) return false;

    const userId = ctx.from.id.toString();
    const userState = userStates.get(userId);
    
    if (!userState) return false; // Not waiting for USD input

    // Delete the user's message
    await ctx.deleteMessage();

    // Parse the number
    const value = parseInt(text.trim());
    
    if (isNaN(value) || value < 0) {
      // Gentle error messages for invalid input
      await sendTemporaryError(ctx, "💡 Please enter a valid number (like 100, 500, or 1000). You can also use the buttons above to navigate.", 4000);
      return true;
    }

    const user = await getUserWithPreferences(userId);
    if (!user) return true;

    // Validation logic
    if (userState.state === 'waiting_min') {
      const currentMax = user.preferences?.maxUsdValue;
      if (currentMax && value >= currentMax) {
        await sendTemporaryError(ctx, `💡 Minimum value ($${value}) should be less than your maximum ($${currentMax}).`, 4000);
        return true;
      }
      
      await updateUserPreferences(user.id, { 
        minUsdValue: value,
        maxUsdValue: user.preferences?.maxUsdValue
      });
      
    } else if (userState.state === 'waiting_max') {
      const currentMin = user.preferences?.minUsdValue;
      if (currentMin && value <= currentMin) {
        await sendTemporaryError(ctx, `💡 Maximum value ($${value}) should be greater than your minimum ($${currentMin}).`, 4000);
        return true;
      }
      
      await updateUserPreferences(user.id, { 
        minUsdValue: user.preferences?.minUsdValue,
        maxUsdValue: value
      });
    }

    // Clear the state
    userStates.delete(userId);
    
    // Show success message briefly
    const successMsg = await sendTemporaryError(ctx, `✅ ${userState.state === 'waiting_min' ? 'Minimum' : 'Maximum'} USD set to $${value}`, 2000);
    
    // Edit the original message back to the USD range menu
    setTimeout(async () => {
      try {
        const updatedUser = await getUserWithPreferences(userId);
        const prefs = updatedUser?.preferences;
        const currentMin = prefs?.minUsdValue || 'Not set';
        const currentMax = prefs?.maxUsdValue || 'Not set';

        const message = `💰 USD Value Range Settings

Current range: $${currentMin} - $${currentMax}

Choose what to update:`;

        const keyboard = {
          inline_keyboard: [
            [{ text: '🔽 Set Minimum USD', callback_data: 'set_min_usd' }],
            [{ text: '🔼 Set Maximum USD', callback_data: 'set_max_usd' }],
            [{ text: '🗑️ Clear Range', callback_data: 'clear_usd_range' }],
            [{ text: '⬅️ Back to Settings', callback_data: 'back_to_settings' }]
          ]
        };

        await ctx.telegram.editMessageText(
          userState.chatId,
          userState.messageId,
          undefined,
          message,
          { reply_markup: keyboard }
        );
      } catch (e) {
        console.log('Could not edit original message:', e);
      }
    }, 2500);

    return true; // Handled
  } catch (error) {
    console.error('USD input error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error processing your USD input.');
    return true;
  }
}
