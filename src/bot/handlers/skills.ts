import { BotContext } from '../../types';
import { getUserWithPreferences, updateUserPreferences } from '../utils/database';
import { skillSubSkillMap, allParentSkills, ParentSkills } from '../../data/skills';
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
    return `${category}: ${skills.join(', ')}`;
  });
  
  return formattedCategories.join('\n');
}

export async function handleSkills(ctx: BotContext) {
  try {
    if (!ctx.from) return;

    const user = await getUserWithPreferences(ctx.from.id.toString());
    if (!user) {
      await sendTemporaryError(ctx, 'User not found. Please use /start first.');
      return;
    }

    const currentSkills = user.preferences?.skills || [];
    const formattedSkills = formatSkillsWithCategories(currentSkills);
    
    const message = `🎯 Skills Selection

Current skills:
${formattedSkills}

Choose a skill category:`;

    // Create keyboard with parent skills (max 2 per row for readability)
    const skillButtons = [];
    for (let i = 0; i < allParentSkills.length; i += 2) {
      const row = allParentSkills.slice(i, i + 2).map(skill => ({
        text: `${skill}`,
        callback_data: `skill_category_${skill}`
      }));
      skillButtons.push(row);
    }
    
    skillButtons.push([{ text: '🗑️ Clear All Skills', callback_data: 'clear_all_skills' }]);
    skillButtons.push([{ text: '⬅️ Back to Settings', callback_data: 'back_to_settings' }]);

    const keyboard = { inline_keyboard: skillButtons };

    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      await ctx.editMessageText(message, { reply_markup: keyboard });
    } else {
      await ctx.reply(message, { reply_markup: keyboard });
    }
  } catch (error) {
    console.error('Skills error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error loading skills.');
  }
}

export async function handleSkillCategory(ctx: BotContext, category: ParentSkills) {
  try {
    if (!ctx.from || !ctx.callbackQuery || !('message' in ctx.callbackQuery)) return;

    const messageId = ctx.callbackQuery.message!.message_id;
    const chatId = ctx.callbackQuery.message!.chat.id;
    
    const user = await getUserWithPreferences(ctx.from.id.toString());
    if (!user) return;

    const currentSkills = user.preferences?.skills || [];
    const subSkills = skillSubSkillMap[category];
    
    // Count selected skills in this category
    const selectedInCategory = subSkills.filter(skill => currentSkills.includes(skill.value)).length;
    
    const message = `🎯 ${category} Skills

Selected: ${selectedInCategory}/${subSkills.length}

Choose sub-skills for notifications:`;

    // Create keyboard with sub-skills - only show checkmark if selected
    const skillButtons = subSkills.map(skill => {
      const isSelected = currentSkills.includes(skill.value);
      return [{
        text: isSelected ? `✅ ${skill.label}` : skill.label,
        callback_data: `toggle_skill_${skill.value}`
      }];
    });
    
    skillButtons.push([{ text: '⬅️ Back to Skills', callback_data: 'back_to_skills' }]);

    const keyboard = { inline_keyboard: skillButtons };

    await ctx.editMessageText(message, { reply_markup: keyboard });
  } catch (error) {
    console.error('Skill category error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error loading skill category.');
  }
}

export async function handleToggleSkill(ctx: BotContext, skillValue: string) {
  try {
    if (!ctx.from) return;

    const user = await getUserWithPreferences(ctx.from.id.toString());
    if (!user) return;

    const currentSkills = user.preferences?.skills || [];
    let updatedSkills: string[];

    if (currentSkills.includes(skillValue)) {
      // Remove skill
      updatedSkills = currentSkills.filter(s => s !== skillValue);
      await ctx.answerCbQuery(`Removed ${skillValue}`);
    } else {
      // Add skill
      updatedSkills = [...currentSkills, skillValue];
      await ctx.answerCbQuery(`Added ${skillValue}`);
    }

    // Update database
    await updateUserPreferences(user.id, { 
      skills: updatedSkills
    });

    // Find which category this skill belongs to and refresh that view
    const category = getSkillCategory(skillValue);

    if (category) {
      await handleSkillCategory(ctx, category);
    }
  } catch (error) {
    console.error('Toggle skill error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error updating skill.');
  }
}

export async function handleClearAllSkills(ctx: BotContext) {
  try {
    if (!ctx.from) return;

    const user = await getUserWithPreferences(ctx.from.id.toString());
    if (!user) return;

    await updateUserPreferences(user.id, { 
      skills: []
    });

    await ctx.answerCbQuery('All skills cleared!');
    await handleSkills(ctx); // Refresh the main skills menu
  } catch (error) {
    console.error('Clear skills error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error clearing skills.');
  }
}

export async function handleBackToSkills(ctx: BotContext) {
  try {
    await handleSkills(ctx);
  } catch (error) {
    console.error('Back to skills error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error returning to skills.');
  }
}
