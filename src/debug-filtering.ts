import { checkUserEligibility } from './services/notificationService';
import { getNewListings } from './services/earnService';

async function debugFiltering() {
  const listings = await getNewListings();
  const reactListing = listings.find(l => l.title.includes('React'));
  
  if (reactListing) {
    console.log('📋 React Dashboard Listing:');
    console.log('Type:', reactListing.type);
    console.log('Skills:', reactListing.skills);
    console.log('USD Value:', reactListing.usdValue);
    
    const user2 = {
      telegramId: 'user2',
      firstName: 'Test User 2', 
      preferences: {
        minUsdValue: undefined,
        maxUsdValue: undefined,
        bounties: true,
        projects: false,
        skills: ['Writing', 'Research']
      }
    };
    
    console.log('\n👤 User 2 Preferences:');
    console.log('Bounties:', user2.preferences.bounties);
    console.log('Projects:', user2.preferences.projects); 
    console.log('Skills:', user2.preferences.skills);
    
    const eligible = checkUserEligibility(reactListing, user2);
    console.log('\n✅ Eligible?', eligible);
    
    // Check each criteria
    console.log('\nDetailed Check:');
    console.log('- Type match:', reactListing.type === 'bounty' ? 'YES (bounty)' : 'NO (not bounty)');
    console.log('- Skills match:', reactListing.skills.some(s => user2.preferences.skills.includes(s)) ? 'YES' : 'NO');
  }
}

debugFiltering();
