import { Telegraf, Markup } from 'telegraf';
import { PrismaClient } from './generated/prisma';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const prisma = new PrismaClient();

// Start command - register user
bot.start(async (ctx) => {
  try {
    await prisma.telegramUser.upsert({
      where: { telegramId: ctx.from.id.toString() },
      update: {
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      },
      create: {
        telegramId: ctx.from.id.toString(),
        username: ctx.from.username,
        firstName: ctx.from.first_name,
      },
    });

    ctx.reply(`Hello ${ctx.from.first_name}! 🎉\n\nUse /settings to configure your notification preferences.`);
  } catch (error) {
    console.error('Database error:', error);
    ctx.reply('Sorry, there was an error. Please try again.');
  }
});

// Settings command - show main menu
bot.command('settings', async (ctx) => {
  const settingsMenu = Markup.inlineKeyboard([
    [Markup.button.callback('💰 USD Value Range', 'usd_range')],
    [Markup.button.callback('📋 Listing Types', 'listing_types')],
    [Markup.button.callback('🎯 Skills', 'skills')],
    [Markup.button.callback('📊 View Current Settings', 'view_settings')]
  ]);

  ctx.reply('⚙️ Configure your notification preferences:', settingsMenu);
});

// Handle button clicks
bot.action('usd_range', (ctx) => {
  ctx.reply('💰 USD Value Range setting coming soon!');
});

bot.action('listing_types', (ctx) => {
  ctx.reply('📋 Listing Types setting coming soon!');
});

bot.action('skills', (ctx) => {
  ctx.reply('🎯 Skills setting coming soon!');
});

bot.action('view_settings', (ctx) => {
  ctx.reply('📊 Current settings view coming soon!');
});

bot.launch();
console.log('Settings bot is running...');
