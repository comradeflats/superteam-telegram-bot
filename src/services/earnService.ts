// Mock service for development
export * from './mockEarnService';

export interface EarnListing {
  id: string;
  title: string;
  slug: string;
  deadline: Date | null;
  usdValue: number | null;
  token: string | null;
  rewardAmount: number | null;
  rewards: any; // JSON field
  type: string; // 'bounty' | 'project'
  skills: string[]; // Array of skill names
  region: string;
  publishedAt: Date | null;
  sponsor: {
    name: string;
  };
  compensationType: string;
  minRewardAsk: number | null;
  maxRewardAsk: number | null;
}
