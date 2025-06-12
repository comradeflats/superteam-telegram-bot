import { EarnListing } from './earnService';
import { logger } from '../utils/logger';

// Mock data that simulates real Earn listings
const mockListings: EarnListing[] = [
  {
    id: '1',
    title: 'Build a React Dashboard for DeFi Analytics',
    slug: 'react-defi-dashboard',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    usdValue: 2500,
    token: 'USDC',
    rewardAmount: 2500,
    rewards: { first: 2500 },
    type: 'bounty',
    skills: ['React', 'Javascript', 'UI/UX Design'],
    region: 'GLOBAL',
    publishedAt: new Date(Date.now() - 13 * 60 * 60 * 1000), // 13 hours ago (should notify)
    sponsor: {
      name: 'SuperteamDAO'
    },
    compensationType: 'fixed',
    minRewardAsk: null,
    maxRewardAsk: null
  },
  {
    id: '2',
    title: 'Solana Smart Contract Development',
    slug: 'solana-smart-contract',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    usdValue: 5000,
    token: 'SOL',
    rewardAmount: 15.5,
    rewards: { first: 5000 },
    type: 'project',
    skills: ['Rust', 'Solana'],
    region: 'GLOBAL',
    publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000), // 14 hours ago (should notify)
    sponsor: {
      name: 'Phantom Wallet'
    },
    compensationType: 'fixed',
    minRewardAsk: null,
    maxRewardAsk: null
  },
  {
    id: '3',
    title: 'Community Manager for Vietnamese Market',
    slug: 'vietnam-community-manager',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    usdValue: 800,
    token: 'USDT',
    rewardAmount: 800,
    rewards: { first: 800 },
    type: 'bounty',
    skills: ['Community Manager', 'Marketing'],
    region: 'VIETNAM',
    publishedAt: new Date(Date.now() - 15 * 60 * 60 * 1000), // 15 hours ago (should notify)
    sponsor: {
      name: 'Solana Foundation'
    },
    compensationType: 'fixed',
    minRewardAsk: null,
    maxRewardAsk: null
  },
  {
    id: '4',
    title: 'Mobile App UI/UX Design',
    slug: 'mobile-app-design',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    usdValue: null, // Variable compensation
    token: null,
    rewardAmount: null,
    rewards: null,
    type: 'project',
    skills: ['UI/UX Design', 'Mobile'],
    region: 'GLOBAL',
    publishedAt: new Date(Date.now() - 12.5 * 60 * 60 * 1000), // 12.5 hours ago (should notify)
    sponsor: {
      name: 'Magic Eden'
    },
    compensationType: 'variable',
    minRewardAsk: 1000,
    maxRewardAsk: 3000
  },
  {
    id: '5',
    title: 'Content Writing for Blockchain Blog',
    slug: 'blockchain-content-writing',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    usdValue: 150,
    token: 'USDC',
    rewardAmount: 150,
    rewards: { first: 150 },
    type: 'bounty',
    skills: ['Writing', 'Research'],
    region: 'GLOBAL',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago (should NOT notify yet)
    sponsor: {
      name: 'Solana Labs'
    },
    compensationType: 'fixed',
    minRewardAsk: null,
    maxRewardAsk: null
  },
  {
    id: '6',
    title: 'TypeScript API Development & Integration',
    slug: 'typescript-api-development',
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 days from now
    usdValue: null, // Range compensation
    token: null,
    rewardAmount: null,
    rewards: null,
    type: 'project',
    skills: ['Javascript', 'Typescript', 'Node.js'],
    region: 'GLOBAL',
    publishedAt: new Date(Date.now() - 13.2 * 60 * 60 * 1000), // 13.2 hours ago (should notify)
    sponsor: {
      name: 'Drift Protocol'
    },
    compensationType: 'range',
    minRewardAsk: 3500,
    maxRewardAsk: 7000
  }
];

export async function getNewListings(): Promise<EarnListing[]> {
  // Simulate the 12-hour delay logic
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
  
  const eligibleListings = mockListings.filter(listing => {
    return listing.publishedAt && listing.publishedAt <= twelveHoursAgo;
  });
  
  logger.debug(`Found ${eligibleListings.length} listings eligible for notification`);
  return eligibleListings;
}

export async function testEarnConnection(): Promise<boolean> {
  // Always return true for mock data
  return true;
}

export async function getRecentListingsForTesting(limit: number = 5): Promise<EarnListing[]> {
  return mockListings.slice(0, limit);
}

// Helper function to add new mock listings for testing
export function addMockListing(listing: Partial<EarnListing>): void {
  const newListing: EarnListing = {
    id: Date.now().toString(),
    title: listing.title || 'Test Listing',
    slug: listing.slug || 'test-listing',
    deadline: listing.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    usdValue: listing.usdValue || 1000,
    token: listing.token || 'USDC',
    rewardAmount: listing.rewardAmount || 1000,
    rewards: listing.rewards || { first: 1000 },
    type: listing.type || 'bounty',
    skills: listing.skills || ['Other'],
    region: listing.region || 'GLOBAL',
    publishedAt: listing.publishedAt || new Date(Date.now() - 13 * 60 * 60 * 1000),
    sponsor: listing.sponsor || { name: 'Test Sponsor' },
    compensationType: listing.compensationType || 'fixed',
    minRewardAsk: listing.minRewardAsk || null,
    maxRewardAsk: listing.maxRewardAsk || null
  };
  
  mockListings.push(newListing);
}
