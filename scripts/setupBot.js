const token = '8623765854:AAFA0_nB3jTWdXctKNAJ4WsrYO1u3TmE2NA';
const webAppUrl = 'https://mersedesmy20-cyber.github.io/OTP-poputka/';

async function setupBot() {
  try {
    // 1. Set Menu Button to launch Telegram Mini App
    const menuRes = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text: '🚀 Їдемо Разом',
          web_app: { url: webAppUrl }
        }
      })
    }).then(r => r.json());
    console.log('Set Menu Button Result:', menuRes);

    // 2. Set Bot Welcome Description (shown on the black screen before start)
    const descriptionText = `🧪 БЕТА-ТЕСТ | Їдемо Разом (ОТП Банк) 🚗💨

Офіційний корпоративний сервіс спільного використання авто для співробітників ОТП Банку (ГО Жилянська 43 та райони Києва).

⚠️ Нам надзвичайно важливі ваша думка та відгуки!

👇 Для запуску натисніть кнопку «🚀 Їдемо Разом» у лівому нижньому кутку чату!`;

    const descRes = await fetch(`https://api.telegram.org/bot${token}/setMyDescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: descriptionText
      })
    }).then(r => r.json());
    console.log('Set Description Result:', descRes);

    // 3. Set Short Description (Profile About text)
    const shortDescRes = await fetch(`https://api.telegram.org/bot${token}/setMyShortDescription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        short_description: '🧪 БЕТА-ТЕСТ | Сервіс корпоративних поїздок ОТП Банку (ГО Жилянська 43).'
      })
    }).then(r => r.json());
    console.log('Set Short Description Result:', shortDescRes);

  } catch (err) {
    console.error('Error setting up bot:', err);
  }
}

setupBot();
