// netlify/functions/contacts.js
const getPrismaClient = require('./utils/prismaClient');

exports.handler = async function(event, context) {
    const prisma = getPrismaClient();
    const method = event.httpMethod;
    let userAuthenticated = false;

    // Simple auth (reuse logic if needed)
    const authHeader = event.headers['authorization'] || event.headers['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '').trim();
        if (token === process.env.APP_PASSWORD) {
            userAuthenticated = true;
        }
    }
    if (!userAuthenticated) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (method === 'GET') {
        // List contacts
        const contacts = await prisma.contact.findMany();
        return { statusCode: 200, body: JSON.stringify(contacts) };
    }
    if (method === 'POST') {
        // Create contact
        let data;
        try { data = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: 'Invalid JSON' }; }
        const contact = await prisma.contact.create({ data });
        return { statusCode: 201, body: JSON.stringify(contact) };
    }
    if (method === 'PUT') {
        // Update contact
        let data;
        try { data = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: 'Invalid JSON' }; }
        if (!data.id) return { statusCode: 400, body: 'ID required' };
        const updated = await prisma.contact.update({ where: { id: data.id }, data });
        return { statusCode: 200, body: JSON.stringify(updated) };
    }
    if (method === 'DELETE') {
        // Delete contact
        let data;
        try { data = JSON.parse(event.body); } catch (e) { return { statusCode: 400, body: 'Invalid JSON' }; }
        if (!data.id) return { statusCode: 400, body: 'ID required' };
        await prisma.contact.delete({ where: { id: data.id } });
        return { statusCode: 204, body: '' };
    }
    return { statusCode: 405, body: 'Method Not Allowed' };
};
