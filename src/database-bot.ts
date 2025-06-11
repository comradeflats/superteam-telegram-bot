import { Telegraf } from 'telegraf';
import { PrismaClient } from './generated/prisma';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const prisma = new PrismaClient();

bot.start(async (ctx) => {
  try {
    // Save user to database
    const user = await prisma.telegramUser.upsert({
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

    ctx.reply(`Hello ${ctx.from.first_name}! Your data has been saved to the database. 🎉`);
    console.log('User saved:', user);
  } catch (error) {
    console.error('Database error:', error);
    ctx.reply('Sorry, there was an error saving your data.');
  }
});

bot.launch();
console.log('Database bot is running...');
