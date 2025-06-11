import { Application } from 'express';
import { bot } from './index';

export async function setupBot(app: Application) {
  // Webhook endpoint for Telegram
  app.post('/webhook', (req, res) => {
    console.log('📨 Received webhook from Telegram');
    try {
      bot.handleUpdate(req.body);
      res.sendStatus(200);
    } catch (error) {
      console.error('❌ Error handling update:', error);
      res.sendStatus(500);
    }
  });

  // Set webhook URL
  const webhookUrl = `https://${process.env.RAILWAY_STATIC_URL || 'your-app.railway.app'}/webhook`;
  
  try {
    // Remove any existing webhook
    await bot.telegram.deleteWebhook();
    console.log('🗑️ Cleared old webhook');
    
    // Set new webhook
    await bot.telegram.setWebhook(webhookUrl);
    console.log(`✅ Webhook set to: ${webhookUrl}`);
    
    // Verify webhook
    const webhookInfo = await bot.telegram.getWebhookInfo();
    console.log('📋 Webhook info:', webhookInfo);
    
  } catch (error) {
    console.error('❌ Failed to set webhook:', error);
    console.log('🔄 Falling back to polling mode');
    bot.launch();
  }
}
