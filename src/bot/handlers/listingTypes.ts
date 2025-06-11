import { BotContext } from '../../types';
import { getUserWithPreferences, updateUserPreferences } from '../utils/database';
import { createListingTypesKeyboard, createMainSettingsKeyboard } from '../utils/keyboards';
import { sendTemporaryError } from '../utils/errorHandler';

export async function handleListingTypes(ctx: BotContext) {
  try {
    if (!ctx.from) return;

    const user = await getUserWithPreferences(ctx.from.id.toString());
    if (!user) {
      await sendTemporaryError(ctx, 'User not found. Please use /start first.');
      return;
    }

    const prefs = user.preferences;
    const bountiesEnabled = prefs?.bounties ?? true;
    const projectsEnabled = prefs?.projects ?? true;

    const listingMenu = createListingTypesKeyboard(bountiesEnabled, projectsEnabled);

    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      await ctx.editMessageText('📋 Choose which types of listings to receive:', listingMenu);
    } else {
      await ctx.reply('📋 Choose which types of listings to receive:', listingMenu);
    }
  } catch (error) {
    console.error('Listing types error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error loading listing types.');
  }
}

export async function handleToggleBounties(ctx: BotContext) {
  try {
    if (!ctx.from) return;

    const user = await getUserWithPreferences(ctx.from.id.toString());
    if (!user) return;

    const currentValue = user.preferences?.bounties ?? true;
    
    await updateUserPreferences(user.id, { 
      bounties: !currentValue,
      projects: user.preferences?.projects ?? true
    });

    await ctx.answerCbQuery(`Bounties ${!currentValue ? 'enabled' : 'disabled'}`);
    
    // Get updated preferences and rebuild menu
    const updatedUser = await getUserWithPreferences(ctx.from.id.toString());
    const prefs = updatedUser?.preferences;
    const bountiesEnabled = prefs?.bounties ?? true;
    const projectsEnabled = prefs?.projects ?? true;
    const listingMenu = createListingTypesKeyboard(bountiesEnabled, projectsEnabled);

    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      try {
        await ctx.editMessageReplyMarkup(listingMenu.reply_markup);
      } catch (editError) {
        // If edit fails, it's probably because the message is the same
        console.log('Message not changed, skipping edit');
      }
    }
  } catch (error) {
    console.error('Toggle bounties error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error updating bounties setting.');
  }
}

export async function handleToggleProjects(ctx: BotContext) {
  try {
    if (!ctx.from) return;

    const user = await getUserWithPreferences(ctx.from.id.toString());
    if (!user) return;

    const currentValue = user.preferences?.projects ?? true;
    
    await updateUserPreferences(user.id, { 
      projects: !currentValue,
      bounties: user.preferences?.bounties ?? true
    });

    await ctx.answerCbQuery(`Projects ${!currentValue ? 'enabled' : 'disabled'}`);
    
    // Get updated preferences and rebuild menu
    const updatedUser = await getUserWithPreferences(ctx.from.id.toString());
    const prefs = updatedUser?.preferences;
    const bountiesEnabled = prefs?.bounties ?? true;
    const projectsEnabled = prefs?.projects ?? true;
    const listingMenu = createListingTypesKeyboard(bountiesEnabled, projectsEnabled);

    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      try {
        await ctx.editMessageReplyMarkup(listingMenu.reply_markup);
      } catch (editError) {
        // If edit fails, it's probably because the message is the same
        console.log('Message not changed, skipping edit');
      }
    }
  } catch (error) {
    console.error('Toggle projects error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error updating projects setting.');
  }
}

export async function handleBackToSettings(ctx: BotContext) {
  try {
    const settingsMenu = createMainSettingsKeyboard();
    
    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      await ctx.editMessageText('⚙️ Configure your notification preferences:', settingsMenu);
    } else {
      await ctx.reply('⚙️ Configure your notification preferences:', settingsMenu);
    }
  } catch (error) {
    console.error('Back to settings error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error returning to settings.');
  }
}
