const token = '8623765854:AAFA0_nB3jTWdXctKNAJ4WsrYO1u3TmE2NA';
const webAppUrl = 'https://mersedesmy20-cyber.github.io/OTP-poputka/';

let lastUpdateId = 0;

const startMessage = `🧪 *БЕТА-ТЕСТ | Їдемо Разом (ОТП Банк)* 🚗💨

Вітаємо в офіційному корпоративному сервісі підвозу співробітників до ГО Жилянська 43 та у райони Києва!

⚠️ *Зараз триває бета-тестування!*
Нам надзвичайно важливі ваша думка, відгуки та пропозиції щодо роботи сервісу.

👇 *ЯК РОЗПОЧАТИ:*
Натисніть кнопку *«🚀 Їдемо Разом»* у лівому нижньому кутку чату або прямо на кнопку нижче!`;

async function pollUpdates() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`).then(r => r.json());
    if (res.ok && Array.isArray(res.result)) {
      for (const update of res.result) {
        lastUpdateId = update.update_id;
        if (update.message && update.message.text) {
          const chatId = update.message.chat.id;
          console.log(`Received message: "${update.message.text}" from chat ${chatId}`);

          // Send auto response with inline button
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: startMessage,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '🚀 Відкрити Їдемо Разом',
                      web_app: { url: webAppUrl }
                    }
                  ]
                ]
              }
            })
          });
          console.log(`Sent reply to chat ${chatId}`);
        }
      }
    }
  } catch (e) {
    console.error('Polling error:', e.message);
  }

  setTimeout(pollUpdates, 2000);
}

console.log('🤖 Telegram Bot Auto-Responder Daemon started...');
pollUpdates();
