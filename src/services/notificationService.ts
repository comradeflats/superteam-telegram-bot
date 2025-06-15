import { EarnListing } from './earnService';
import { getUserWithPreferences } from '../bot/utils/database';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export interface UserNotificationData {
  telegramId: string;
  firstName?: string;
  preferences: {
    minUsdValue?: number;
    maxUsdValue?: number;
    bounties: boolean;
    projects: boolean;
    skills: string[];
  };
}

export function checkUserEligibility(listing: EarnListing, user: UserNotificationData): boolean {
  const prefs = user.preferences;
  
  // Check listing type preference
  if (listing.type === 'bounty' && !prefs.bounties) return false;
  if (listing.type === 'project' && !prefs.projects) return false;
  
  // Check USD value range
  if (listing.usdValue !== null) {
    if (prefs.minUsdValue && listing.usdValue < prefs.minUsdValue) return false;
    if (prefs.maxUsdValue && listing.usdValue > prefs.maxUsdValue) return false;
  }
  
  // Check skills matching (user must have at least one matching skill)
  if (prefs.skills.length > 0 && listing.skills.length > 0) {
    const hasMatchingSkill = listing.skills.some(listingSkill => 
      prefs.skills.includes(listingSkill)
    );
    if (!hasMatchingSkill) return false;
  }
  
  return true;
}

export function formatNotificationMessage(listing: EarnListing): string {
  // Format reward information
  let rewardText = '';
  if (listing.compensationType === 'variable') {
    rewardText = 'Variable Comp';
  } else if (listing.compensationType === 'range' && listing.minRewardAsk && listing.maxRewardAsk) {
    rewardText = `$${listing.minRewardAsk} - $${listing.maxRewardAsk}`;
  } else if (listing.usdValue) {
    const tokenText = listing.token ? ` ${listing.token}` : '';
    rewardText = `${listing.rewardAmount || listing.usdValue}${tokenText} ($${listing.usdValue})`;
  } else {
    rewardText = 'Amount TBD';
  }
  
  // Format deadline
  const deadlineText = listing.deadline 
    ? listing.deadline.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : 'No deadline specified';
  
  // Format skills
  const skillsText = listing.skills && listing.skills.length > 0 
    ? listing.skills.join(', ')
    : 'Not specified';
  
  // Create Earn URL with UTM tracking
  const earnUrl = `https://earn.superteam.fun/listings/${listing.slug}?utm_source=telegrambot`;
  
  const message = `🚀 **New ${listing.type === 'bounty' ? 'Bounty' : 'Project'}!**

**${listing.title}**

💰 **Reward:** ${rewardText}
🏢 **Sponsor:** ${listing.sponsor.name}
🎯 **Skills:** ${skillsText}
⏰ **Deadline:** ${deadlineText}

`;

  return message;
}

// Format notification with action buttons AND store listing data for save functionality
export function formatNotificationWithActions(listing: EarnListing): object {
  const message = formatNotificationMessage(listing);
  const earnUrl = `https://earn.superteam.fun/listings/${listing.slug}?utm_source=telegrambot`;
  
  return {
    text: message,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: "💾 Save to Library", callback_data: `save_${listing.id}` },
          { text: "❌ Dismiss", callback_data: `dismiss_${listing.id}` }
        ],
        [
          { text: "🔗 View Details", url: earnUrl }
        ]
      ]
    }
  };
}

// Save notification to user's library (SIMPLIFIED LOGGING)
export async function saveNotificationToLibrary(telegramUserId: string, listing: EarnListing): Promise<void> {
  try {
    // Format reward text for storage
    let rewardText = '';
    if (listing.compensationType === 'variable') {
      rewardText = 'Variable Comp';
    } else if (listing.compensationType === 'range' && listing.minRewardAsk && listing.maxRewardAsk) {
      rewardText = `$${listing.minRewardAsk} - $${listing.maxRewardAsk}`;
    } else if (listing.usdValue) {
      const tokenText = listing.token ? ` ${listing.token}` : '';
      rewardText = `${listing.rewardAmount || listing.usdValue}${tokenText} ($${listing.usdValue})`;
    } else {
      rewardText = 'Amount TBD';
    }

    const earnUrl = `https://earn.superteam.fun/listings/${listing.slug}?utm_source=telegrambot`;

    await prisma.notificationLibrary.create({
      data: {
        telegramUserId,
        listingId: listing.id,
        listingTitle: listing.title,
        listingSlug: listing.slug,
        sponsorName: listing.sponsor.name,
        rewardText,
        deadline: listing.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        listingUrl: earnUrl,
        sentAt: new Date(),
        status: 'SAVED'
      }
    });

    // REDUCED LOGGING - Only in debug mode
    if (process.env.LOG_LEVEL === 'DEBUG') {
      console.log(`✅ Saved notification: ${listing.title} for user ${telegramUserId}`);
    }
  } catch (error) {
    console.error('Error saving notification to library:', error);
  }
}

// Get user's saved notifications
export async function getUserSavedNotifications(telegramUserId: string) {
  try {
    return await prisma.notificationLibrary.findMany({
      where: {
        telegramUserId,
        status: 'SAVED',
        deadline: {
          gte: new Date()
        }
      },
      orderBy: {
        deadline: 'asc'
      }
    });
  } catch (error) {
    console.error('Error fetching saved notifications:', error);
    return [];
  }
}

// Clean up expired notifications (SIMPLIFIED LOGGING)
export async function cleanupExpiredNotifications(): Promise<number> {
  try {
    const result = await prisma.notificationLibrary.deleteMany({
      where: {
        deadline: {
          lt: new Date()
        }
      }
    });

    // REDUCED LOGGING - Only show if items were actually deleted
    if (result.count > 0) {
      console.log(`🧹 Cleaned up ${result.count} expired notifications`);
    }
    return result.count;
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    return 0;
  }
}

export async function getAllUsersForNotification(): Promise<UserNotificationData[]> {
  try {
    // This would get all active users from your database
    // For now, we'll return mock users for testing
    return [
      {
        telegramId: 'user1',
        firstName: 'Test User 1',
        preferences: {
          minUsdValue: 100,
          maxUsdValue: 3000,
          bounties: true,
          projects: true,
          skills: ['React', 'Javascript']
        }
      },
      {
        telegramId: 'user2', 
        firstName: 'Test User 2',
        preferences: {
          minUsdValue: undefined,
          maxUsdValue: undefined,
          bounties: true,
          projects: false,
          skills: ['Writing', 'Research']
        }
      }
    ];
  } catch (error) {
    console.error('Error getting users for notification:', error);
    return [];
  }
}

export async function processNotifications(): Promise<void> {
  console.log('🔄 Processing notifications...');
  
  const { getNewListings } = await import('./earnService');
  const newListings = await getNewListings();
  
  if (newListings.length === 0) {
    console.log('No new listings to process');
    return;
  }
  
  console.log(`Found ${newListings.length} new listings`);
  
  const users = await getAllUsersForNotification();
  console.log(`Checking ${users.length} users for eligibility`);
  
  for (const listing of newListings) {
    console.log(`\n📋 Processing: ${listing.title}`);
    
    for (const user of users) {
      const isEligible = checkUserEligibility(listing, user);
      
      if (isEligible) {
        const notificationWithActions = formatNotificationWithActions(listing);
        console.log(`✅ Would notify ${user.firstName} (${user.telegramId})`);
        console.log(`Message preview:\n${notificationWithActions.text}\n`);
      } else {
        console.log(`❌ ${user.firstName} not eligible for this listing`);
      }
    }
  }
}
