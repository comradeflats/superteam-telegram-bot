import { BotContext } from '../../types';
import { sendTemporaryError } from '../utils/errorHandler';
import { processAndSendNotifications } from '../../services/telegramNotificationService';

export async function handleTestNotifications(ctx: BotContext) {
  try {
    if (!ctx.from) return;
    
    // Only allow this for development/testing - check your actual Telegram ID
    if (ctx.from.id.toString() !== '1524299936') {
      await sendTemporaryError(ctx, 'This command is only available for developers.', 3000);
      return;
    }
    
    await ctx.reply('🧪 Testing notifications... This may take a moment.');
    
    await processAndSendNotifications();
    
    const successMsg = await ctx.reply('✅ Test notifications completed! Check the console for details.');
    
    // Delete success message after 5 seconds
    setTimeout(async () => {
      try {
        await ctx.deleteMessage(successMsg.message_id);
      } catch (e) {
        // Message might already be deleted
      }
    }, 5000);
    
  } catch (error) {
    console.error('Test notifications error:', error);
    await sendTemporaryError(ctx, 'Sorry, there was an error testing notifications.');
  }
}
