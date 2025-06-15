import { bot } from '../bot/index';
import { prisma } from '../bot/utils/database';
import { EarnListing } from './earnService';
import { formatNotificationWithActions, checkUserEligibility, saveNotificationToLibrary } from './notificationService';
import { logger } from '../utils/logger';

// Store listing data temporarily for save/dismiss actions
const listingCache = new Map<string, EarnListing>();

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

    // Cache the listing data for save/dismiss actions
    listingCache.set(listing.id, listing);

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
          const notificationWithActions = formatNotificationWithActions(listing);
          
          await bot.telegram.sendMessage(
            user.telegramId, 
            notificationWithActions.text, 
            notificationWithActions
          );
          
          logger.debug(`Notified user ${user.telegramId} about "${listing.title}" with action buttons`);
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

// Function to get cached listing data for save actions
export function getCachedListing(listingId: string): EarnListing | undefined {
  return listingCache.get(listingId);
}

// Function to clear old cached listings (cleanup)
export function clearOldCache(): void {
  // Keep cache size manageable - only keep last 50 listings
  if (listingCache.size > 50) {
    const entries = Array.from(listingCache.entries());
    const toKeep = entries.slice(-25); // Keep last 25
    listingCache.clear();
    toKeep.forEach(([id, listing]) => listingCache.set(id, listing));
  }
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
    
    // Clean up old cache entries
    clearOldCache();
    
    logger.info('Notification process completed');
    
  } catch (error) {
    logger.error('Error in notification process:', error);
  }
}
