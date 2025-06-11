import { Context } from 'telegraf';

// Extend Telegraf's Context with our custom properties
export interface BotContext extends Context {
  // Add any custom context properties here later
}

// Database types
export interface UserPreferences {
  minUsdValue?: number;
  maxUsdValue?: number;
  bounties: boolean;
  projects: boolean;
}

// Notification types
export interface NotificationData {
  title: string;
  sponsor: string;
  rewardToken: string;
  rewardAmount: number;
  rewardUsd: number;
  isVariable: boolean;
  isRange: boolean;
  minAmount?: number;
  maxAmount?: number;
  deadline: Date;
  earnUrl: string;
}
