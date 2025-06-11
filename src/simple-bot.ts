import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
dotenv.config();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
bot.start((ctx) => {
  ctx.reply('Hello! Your bot is working! 🎉');
});
bot.launch();
console.log('Bot is running... Send /start to your bot in Telegram');
