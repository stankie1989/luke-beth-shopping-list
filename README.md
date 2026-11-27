# Luke & Beth's Shopping List — Version 1.8.0

### 1.8.0 — Wallace & Gromit Household Lounge (frontend package)

This is the frontend package for the 1.8.0 release, built from the confirmed 1.7.30.1 baseline. It introduces the Wallace & Gromit Lounge branding and portrait icons, retains the existing app features, and increments the service-worker cache to v102 with registration URL 1.8.0. The Supabase `lounge-ai` Edge Function is not included in this ZIP.

## Deployment
1. Replace the contents of your GitHub Pages deployment with the contents of `build198`.
2. The Lounge Edge Function must be updated separately to return `Wallace` and `Gromit` as character names. The current deployed function source was not present in the confirmed frontend baseline, so do not overwrite it with an older copy.
3. No SQL migration is included in this frontend package. The existing app continues to read `menu_entries`, `menu_favourites`, `household_members`, `household_lounge_messages`, `household_lounge_ai_usage`, `shopping_lists`, and `shopping_items` records.
4. Shopping-list context is restricted to unbought items belonging to lists marked `is_shared=true`. If the `shopping_lists` lookup is unavailable, shopping context is omitted rather than exposing private-list items.
5. Refresh the app after GitHub Pages publishes.

## Notes
- The UI recognises legacy `Alfred` messages and displays them as Wallace so the conversation remains intact. New server replies should use the character name `Wallace`.
- The character portraits are bundled locally in `images/wallace-avatar.png` and `images/gromit-avatar.png`.
- Past menu entries are distinguished from completed meals using `is_completed`; future entries are treated as plans.
- Household member names are resolved from `household_members` using the message sender's `sender_id`.
- The Edge Function is not included in this ZIP; use the copyable code supplied separately.
