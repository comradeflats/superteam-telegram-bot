import { BotContext } from '../../types';
import { sendTemporaryError } from '../utils/errorHandler';
import { processAndSendNotifications } from '../../services/telegramNotificationService';

export async function handleTestNotifications(ctx: BotContext) {
  try {
    if (!ctx.from) return;
    
    // Only allow this for development/testing
    if (ctx.from.id.toString() !== '1524299936') { // Replace with your Telegram ID
      await sendTemporaryError(ctx, 'This command is only available for developers.');
      return;
    }
    
    await ctx.reply('🧪 Testing notifications... This may take a moment.');
    
    await processAndSendNotifications();
    
    await ctx.reply('✅ Test notifications completed! Check the console for details.');
    
  } catch (error) {
    console.error('Test notifications error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error testing notifications.');
  }
}
