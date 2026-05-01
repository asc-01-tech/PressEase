const twilio = require('twilio');

const sendWhatsAppNotification = async (toPhone, customerName, orderNumber, totalAmount, billUrl) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM;

  // Clean phone number - ensure it has country code
  let cleanPhone = toPhone.replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone; // Default to India
  }

  const message = `Hello ${customerName} 👋\n\nYour clothes are *ready for pickup* at our shop!\n\n🧾 *Order ID:* ${orderNumber}\n💰 *Total Bill:* ₹${totalAmount.toFixed(2)}\n\nPlease visit our shop to collect your clothes.\n\nThank you for choosing us! 🙏`;

  const encodedMessage = encodeURIComponent(message);
  const waLink = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  // Skip if Twilio not configured
  if (!accountSid || accountSid.startsWith('ACxx') || !authToken || authToken === 'your_auth_token_here') {
    console.log(`[WhatsApp SKIPPED] Twilio not configured. Generating web link instead: ${waLink}`);
    return { success: true, via: 'web', waLink };
  }


  try {
    const client = twilio(accountSid, authToken);
    const result = await client.messages.create({
      body: message,
      from: fromWhatsApp,
      to: `whatsapp:+${cleanPhone}`,
    });
    console.log(`WhatsApp sent to ${toPhone}, SID: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('WhatsApp send error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendWhatsAppNotification };
