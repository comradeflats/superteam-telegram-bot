import express from 'express';

console.log('🚀 Starting Superteam Telegram Bot...');

// Start the bot
import('./bot/index').then(() => {
  console.log('✅ Bot module loaded successfully');
}).catch((error) => {
  console.error('❌ Error loading bot module:', error);
});

const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    bot: 'Superteam Telegram Bot'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Superteam Earn Telegram Bot is running!',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

const port = process.env.PORT || 3000;
const host = '0.0.0.0'; // Important for Railway

app.listen(port, host, () => {
  console.log(`✅ Server running on ${host}:${port}`);
  console.log(`✅ Health check available at http://${host}:${port}/health`);
});
