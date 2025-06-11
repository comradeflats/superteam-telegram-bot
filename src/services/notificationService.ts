import { EarnListing } from './earnService';
import { getUserWithPreferences } from '../bot/utils/database';

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
  
  // For now, we'll assume all users are globally eligible
  // In production, you'd check user's region against listing.region
  
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

[View Details & Apply](${earnUrl})`;

  return message;
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
          projects: false, // Only bounties
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
  
  // This will be called by a cron job
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
        const message = formatNotificationMessage(listing);
        console.log(`✅ Would notify ${user.firstName} (${user.telegramId})`);
        console.log(`Message preview:\n${message}\n`);
        
        // In production, you'd send the actual Telegram message here
        // await sendTelegramNotification(user.telegramId, message);
      } else {
        console.log(`❌ ${user.firstName} not eligible for this listing`);
      }
    }
  }
}
