// Simple script to send a test Telegram message using the HTTP API
// Usage: node scripts/sendTestMessage.js <chatId> "Your message here"

require('dotenv').config();
const axios = require('axios');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/sendTestMessage.js <chatId> [message]');
    process.exit(1);
  }
  const chatId = args[0];
  const message = args[1] || 'Test message from MediConnect';

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is not set in your environment (.env).');
    process.exit(2);
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await axios.post(url, { chat_id: chatId, text: message });
    console.log('Message sent, telegram response ok?:', res.data.ok);
    process.exit(0);
  } catch (err) {
    console.error('Failed to send message via HTTP API:', err.response ? err.response.data : err.message || err);
    process.exit(3);
  }
}

main();
