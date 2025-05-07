// netlify/functions/contacts.js
const getPrismaClient = require('./utils/prismaClient');

exports.handler = async function(event, context) {
    console.log('--- Incoming Request ---');
    console.log('Method:', event.httpMethod);
    console.log('Headers:', event.headers);
    console.log('Body:', event.body);

    const prisma = getPrismaClient();
    const method = event.httpMethod;
    let userAuthenticated = false;

    // Simple auth (reuse logic if needed)
    const authHeader = event.headers['authorization'] || event.headers['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '').trim();
        if (token === process.env.APP_PASSWORD) {
            userAuthenticated = true;
        } else {
            console.log('Auth failed: Invalid password');
        }
    } else {
        console.log('Auth header missing or malformed');
    }
    if (!userAuthenticated) {
        console.log('User not authenticated');
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (method === 'GET') {
        // List contacts
        try {
            const contacts = await prisma.contact.findMany();
            console.log('Fetched contacts:', contacts);
            return { statusCode: 200, body: JSON.stringify(contacts) };
        } catch (err) {
            console.error('Error fetching contacts:', err);
            return { statusCode: 500, body: 'Errore nel recupero contatti.' };
        }
    }
    if (method === 'POST') {
        // Create contact
        let data;
        try {
            data = JSON.parse(event.body);
            console.log('Parsed POST data:', data);
        } catch (e) {
            console.error('POST: Invalid JSON', e);
            return { statusCode: 400, body: 'Invalid JSON' };
        }
        try {
            const contact = await prisma.contact.create({ data });
            console.log('Contact created:', contact);
            return { statusCode: 201, body: JSON.stringify(contact) };
        } catch (err) {
            console.error('Error creating contact:', err);
            return { statusCode: 500, body: 'Errore nel salvataggio.' };
        }
    }
    if (method === 'PUT') {
        // Update contact
        let data;
        try {
            data = JSON.parse(event.body);
            console.log('Parsed PUT data:', data);
        } catch (e) {
            console.error('PUT: Invalid JSON', e);
            return { statusCode: 400, body: 'Invalid JSON' };
        }
        if (!data.id) {
            console.error('PUT: ID required');
            return { statusCode: 400, body: 'ID required' };
        }
        try {
            const updated = await prisma.contact.update({ where: { id: data.id }, data });
            console.log('Contact updated:', updated);
            return { statusCode: 200, body: JSON.stringify(updated) };
        } catch (err) {
            console.error('Error updating contact:', err);
            return { statusCode: 500, body: 'Errore nell\'aggiornamento.' };
        }
    }
    if (method === 'DELETE') {
        // Delete contact
        let data;
        try {
            data = JSON.parse(event.body);
            console.log('Parsed DELETE data:', data);
        } catch (e) {
            console.error('DELETE: Invalid JSON', e);
            return { statusCode: 400, body: 'Invalid JSON' };
        }
        if (!data.id) {
            console.error('DELETE: ID required');
            return { statusCode: 400, body: 'ID required' };
        }
        try {
            await prisma.contact.delete({ where: { id: data.id } });
            console.log('Contact deleted:', data.id);
            return { statusCode: 204, body: '' };
        } catch (err) {
            console.error('Error deleting contact:', err);
            return { statusCode: 500, body: 'Errore nell\'eliminazione.' };
        }
    }
    return { statusCode: 405, body: 'Method Not Allowed' };
};
