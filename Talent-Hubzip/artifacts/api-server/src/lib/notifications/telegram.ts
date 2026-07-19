export async function sendTelegram(message: string, chatId?: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = chatId ?? process.env.TELEGRAM_CHAT_ID;
  if (!token || !targetChatId) {
    console.log("[telegram stub]", message);
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: targetChatId, text: message }),
  });
  if (!res.ok) {
    throw new Error(`Telegram send failed: ${res.status}`);
  }
}

export async function sendTelegramToChannel(message: string): Promise<void> {
  const channelId = process.env.TELEGRAM_CHANNEL_ID ?? process.env.TELEGRAM_CHAT_ID;
  await sendTelegram(message, channelId);
}
