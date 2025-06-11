# Pull Request Plan: Add Telegram Bot Integration

## Changes Made
- **File**: `src/features/navbar/components/UserMenu.tsx`
- **Addition**: Telegram notifications menu item
- **Location**: Between "Email Preferences" and "Get Help"

## Key Features
- ✅ User context passing (`earn_userid_${user.id}`)
- ✅ Fallback for anonymous users
- ✅ PostHog analytics tracking
- ✅ Opens in new tab
- ✅ Security attributes (noopener noreferrer)

## Testing Instructions
1. Login to Earn website
2. Click user menu (top right)
3. Click "🔔 Telegram Notifications"
4. Should open Telegram bot with welcome message
5. Bot should show user-specific onboarding

## Bot Details
- **Username**: @super_fun_earn_bot
- **Purpose**: Personalized bounty/project notifications
- **Features**: USD filtering, skill matching, listing type preferences

## Next Steps
1. Update bot username in code (replace `super_fun_earn_bot`)
2. Deploy bot to production
3. Test integration thoroughly
4. Submit PR to Superteam Earn repository
