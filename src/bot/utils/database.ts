import { PrismaClient } from '../../generated/prisma';

export const prisma = new PrismaClient();

export async function createOrUpdateUser(telegramId: string, username?: string, firstName?: string) {
  return await prisma.telegramUser.upsert({
    where: { telegramId },
    update: {
      username,
      firstName,
    },
    create: {
      telegramId,
      username,
      firstName,
    },
  });
}

export async function getUserWithPreferences(telegramId: string) {
  return await prisma.telegramUser.findUnique({
    where: { telegramId },
    include: { preferences: true }
  });
}

export async function updateUserPreferences(userId: string, preferences: { bounties?: boolean; projects?: boolean; minUsdValue?: number | null; maxUsdValue?: number | null; skills?: string[] }) {
  return await prisma.notificationPreference.upsert({
    where: { userId },
    update: preferences,
    create: {
      userId,
      bounties: preferences.bounties ?? true,
      projects: preferences.projects ?? true,
      minUsdValue: preferences.minUsdValue,
      maxUsdValue: preferences.maxUsdValue,
      skills: preferences.skills || [],
    }
  });
}
