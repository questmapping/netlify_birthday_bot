// netlify/functions/birthday-checker.js
const getPrismaClient = require('./utils/prismaClient');
const https = require('https');

exports.handler = async function(event, context) {
    console.log("Birthday checker scheduled function running...");
    const prisma = getPrismaClient();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Get today's date in DD/MM format
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const today = `${day}/${month}`;

    // Find contacts with birthday today
    const contacts = await prisma.contact.findMany({ where: { birthday: today } });
    if (!contacts.length) {
        return { statusCode: 200, body: 'No birthdays today.' };
    }

    // Send Telegram notification for each contact
    for (const contact of contacts) {
        const message =
            `🎉 Buon compleanno, ${contact.name}!\n` +
            `Messaggio: ${contact.greetingMessage}\n` +
            (contact.mobile ? `Telefono: ${contact.mobile}\n` : '') +
            (contact.birthYear ? `Anno di nascita: ${contact.birthYear}\n` : '');

        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const postData = JSON.stringify({ chat_id: chatId, text: message });

        await new Promise((resolve, reject) => {
            const req = https.request(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, res => {
                res.on('data', () => {});
                res.on('end', resolve);
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }
    return { statusCode: 200, body: 'Birthday notifications sent.' };
};
