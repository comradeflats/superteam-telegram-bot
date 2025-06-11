import { bot } from '../bot/index';
import { prisma } from '../bot/utils/database';
import { EarnListing } from './earnService';
import { formatNotificationMessage, checkUserEligibility } from './notificationService';
import { logger } from '../utils/logger';

export async function sendNotificationToUsers(listings: EarnListing[]): Promise<void> {
  if (listings.length === 0) {
    logger.info('No listings to notify about');
    return;
  }

  // Get all active users with preferences
  const users = await prisma.telegramUser.findMany({
    where: {
      isActive: true
    },
    include: {
      preferences: true
    }
  });

  logger.info(`Processing ${listings.length} listings for ${users.length} users`);

  let totalNotificationsSent = 0;

  for (const listing of listings) {
    logger.debug(`Processing listing: ${listing.title}`);
    let notificationsSent = 0;

    for (const user of users) {
      if (!user.preferences) {
        logger.debug(`User ${user.telegramId} has no preferences set, skipping`);
        continue;
      }

      const userNotificationData = {
        telegramId: user.telegramId,
        firstName: user.firstName || undefined,
        preferences: {
          minUsdValue: user.preferences.minUsdValue || undefined,
          maxUsdValue: user.preferences.maxUsdValue || undefined,
          bounties: user.preferences.bounties,
          projects: user.preferences.projects,
          skills: user.preferences.skills || []
        }
      };

      const isEligible = checkUserEligibility(listing, userNotificationData);

      if (isEligible) {
        try {
          const message = formatNotificationMessage(listing);
          
          await bot.telegram.sendMessage(user.telegramId, message, {
            parse_mode: 'Markdown',
            disable_web_page_preview: false
          });

          logger.debug(`Notified user ${user.telegramId} about "${listing.title}"`);
          notificationsSent++;
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          logger.error(`Failed to notify user ${user.telegramId}:`, error);
        }
      } else {
        logger.debug(`User ${user.telegramId} not eligible for "${listing.title}"`);
      }
    }

    if (notificationsSent > 0) {
      logger.info(`"${listing.title}": ${notificationsSent} notifications sent`);
    } else {
      logger.debug(`"${listing.title}": No eligible users found`);
    }
    totalNotificationsSent += notificationsSent;
  }

  logger.notificationSummary(users.length, listings.length, totalNotificationsSent);
}

export async function processAndSendNotifications(): Promise<void> {
  try {
    logger.debug('Starting notification process');
    
    const { getNewListings } = await import('./earnService');
    const newListings = await getNewListings();
    
    if (newListings.length === 0) {
      logger.info('No new listings to process');
      return;
    }
    
    await sendNotificationToUsers(newListings);
    logger.info('Notification process completed');
    
  } catch (error) {
    logger.error('Error in notification process:', error);
  }
}
