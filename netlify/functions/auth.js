// netlify/functions/auth.js
// Simple password authentication Netlify Function

const AUTH_PASSWORD = process.env.APP_PASSWORD;

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (err) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON' })
        };
    }

    const { password } = body;
    if (!password) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Password required' })
        };
    }

    // Basic plain-text match (for now)
    if (password === AUTH_PASSWORD) {
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } else {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Unauthorized' })
        };
    }
};
