# Luke & Beth's Shopping List — Version 1.5.10

## Fixes
- Added a foreground refresh safety net for shopping items, so changes appear on the other device within a few seconds even if a Supabase Realtime event is missed.
- Kept the Realtime subscription in place for faster updates when it is working.
- Corrected contrast for every shared-list status card in both light and dark themes (Ready to share, Changes made, awaiting approval and liked).
- Added browser notification display for incoming share events while the app is open and notification permission is granted.
- Updated the service-worker cache version and app version.

## Notifications limitation
This release can display browser notifications while the app is open. True background push notifications while the app is closed or suspended require Web Push subscription storage and a secure server-side sender (for example, a Supabase Edge Function with VAPID keys). Enabling Android/iOS website notification permission alone does not create that backend.

## Deployment
Replace the nine app files in GitHub with these files and commit to `main`. No Supabase SQL migration is required.
