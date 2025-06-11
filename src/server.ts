import express from 'express';

console.log('🚀 Starting Superteam Telegram Bot...');

const app = express();

// Middleware for parsing JSON
app.use(express.json());

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
const host = '0.0.0.0';

app.listen(port, host, async () => {
  console.log(`✅ Server running on ${host}:${port}`);
  console.log(`✅ Health check available`);
  
  // Import and start bot after server is ready
  try {
    const { setupBot } = await import('./bot/webhook-setup');
    await setupBot(app);
    console.log('✅ Bot webhook setup completed');
  } catch (error) {
    console.error('❌ Error setting up bot:', error);
  }
});
