import express from 'express';
import './bot/index'; // This starts the bot

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
    status: 'active'
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Bot and health check server started');
});
