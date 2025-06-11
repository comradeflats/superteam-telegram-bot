import { BotContext } from '../../types';
import { getUserWithPreferences } from '../utils/database';
import { skillSubSkillMap, ParentSkills } from '../../data/skills';
import { sendTemporaryError } from '../utils/errorHandler';

// Helper function to get category for a skill
function getSkillCategory(skillValue: string): ParentSkills | null {
  for (const [category, skills] of Object.entries(skillSubSkillMap)) {
    if (skills.some(s => s.value === skillValue)) {
      return category as ParentSkills;
    }
  }
  return null;
}

// Helper function to format skills grouped by categories
function formatSkillsWithCategories(skillsList: string[]): string {
  if (skillsList.length === 0) return 'None selected';
  
  // Group skills by category
  const skillsByCategory: { [key: string]: string[] } = {};
  
  skillsList.forEach(skill => {
    const category = getSkillCategory(skill);
    if (category) {
      if (!skillsByCategory[category]) {
        skillsByCategory[category] = [];
      }
      skillsByCategory[category].push(skill);
    }
  });
  
  // Format each category on its own line
  const formattedCategories = Object.entries(skillsByCategory).map(([category, skills]) => {
    return `• ${category}: ${skills.join(', ')}`;
  });
  
  return formattedCategories.join('\n');
}

export async function handleViewSettings(ctx: BotContext) {
  try {
    if (!ctx.from) return;

    const user = await getUserWithPreferences(ctx.from.id.toString());
    if (!user) {
      await sendTemporaryError(ctx, 'User not found. Please use /start first.');
      return;
    }

    const prefs = user.preferences;
    
    // Format USD range
    const minUsd = prefs?.minUsdValue || 'Not set';
    const maxUsd = prefs?.maxUsdValue || 'Not set';
    const usdRange = `$${minUsd} - $${maxUsd}`;
    
    // Format listing types
    const bounties = prefs?.bounties ?? true;
    const projects = prefs?.projects ?? true;
    let listingTypes = [];
    if (bounties) listingTypes.push('Bounties');
    if (projects) listingTypes.push('Projects');
    const listingTypesText = listingTypes.length > 0 ? listingTypes.join(', ') : 'None';
    
    // Format skills
    const currentSkills = prefs?.skills || [];
    const skillsText = formatSkillsWithCategories(currentSkills);
    
    // Count total settings
    const settingsCount = [
      prefs?.minUsdValue || prefs?.maxUsdValue,
      bounties || projects,
      currentSkills.length > 0
    ].filter(Boolean).length;

    // Add timestamp to make refresh work
    const timestamp = new Date().toLocaleTimeString();
    
    const message = `📊 Your Current Settings

🎯 **Active Filters: ${settingsCount}/3**

💰 **USD Value Range:**
${usdRange}

📋 **Listing Types:**
${listingTypesText}

🎯 **Skills:**
${skillsText}

${settingsCount === 0 ? '⚠️ No filters set - you\'ll receive all notifications!' : '✅ Notifications will be filtered based on these preferences.'}

*Last updated: ${timestamp}*`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '⚙️ Modify Settings', callback_data: 'back_to_settings' }],
        [{ text: '🔄 Refresh', callback_data: 'view_settings' }]
      ]
    };

    try {
      if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
        await ctx.editMessageText(message, { reply_markup: keyboard, parse_mode: 'Markdown' });
      } else {
        await ctx.reply(message, { reply_markup: keyboard, parse_mode: 'Markdown' });
      }
    } catch (editError: any) {
      // If edit fails because message is the same, just answer the callback query
      if (editError.description?.includes('message is not modified')) {
        if (ctx.callbackQuery) {
          await ctx.answerCbQuery('Settings refreshed! ✅');
        }
      } else {
        throw editError;
      }
    }
  } catch (error) {
    console.error('View settings error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error loading your settings.');
  }
}
