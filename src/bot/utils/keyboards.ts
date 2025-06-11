import { Markup } from 'telegraf';

export function createMainSettingsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('💰 USD Value Range', 'usd_range')],
    [Markup.button.callback('📋 Listing Types', 'listing_types')],
    [Markup.button.callback('🎯 Skills', 'skills')],
    [Markup.button.callback('📊 View Current Settings', 'view_settings')]
  ]);
}

export function createListingTypesKeyboard(bountiesEnabled: boolean, projectsEnabled: boolean) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(
      `${bountiesEnabled ? '✅' : '❌'} Bounties`, 
      'toggle_bounties'
    )],
    [Markup.button.callback(
      `${projectsEnabled ? '✅' : '❌'} Projects`, 
      'toggle_projects'
    )],
    [Markup.button.callback('⬅️ Back to Settings', 'back_to_settings')]
  ]);
}

export function createBackToSettingsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back to Settings', 'back_to_settings')]
  ]);
}
