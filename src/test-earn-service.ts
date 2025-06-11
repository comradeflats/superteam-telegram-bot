import { getNewListings, getRecentListingsForTesting } from './services/earnService';

async function testEarnService() {
  console.log('🔍 Testing Earn Service...\n');
  
  console.log('📋 Recent listings:');
  const recentListings = await getRecentListingsForTesting(3);
  recentListings.forEach(listing => {
    console.log(`- ${listing.title} ($${listing.usdValue || 'Variable'}) by ${listing.sponsor.name}`);
  });
  
  console.log('\n⏰ Listings ready for notification (12+ hours old):');
  const newListings = await getNewListings();
  newListings.forEach(listing => {
    const hoursAgo = Math.floor((Date.now() - listing.publishedAt!.getTime()) / (1000 * 60 * 60));
    console.log(`- ${listing.title} (published ${hoursAgo}h ago)`);
  });
}

testEarnService();
