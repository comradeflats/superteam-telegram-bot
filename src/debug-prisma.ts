import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

console.log('Prisma client:', prisma);
console.log('TelegramUser model:', prisma.telegramUser);
console.log('Available models:', Object.keys(prisma));
