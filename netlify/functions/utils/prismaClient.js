// netlify/functions/utils/prismaClient.js
const { PrismaClient } = require('@prisma/client');

let prisma = null;

function getPrismaClient() {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
}

module.exports = getPrismaClient;
