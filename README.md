# Luke & Beth's Shopping List — Version 1.7.30.0

### 1.7.30.0 — Alfred shopping connection and Lounge status (frontend package)

This is the frontend package for the 1.7.30.0 release. It preserves the 1.7.28.0 Household Lounge interface and increments the service-worker cache version to v101 and updates the service-worker registration URL to 1.7.30.0. The functional household-data integration is delivered in the separate Supabase `lounge-ai` Edge Function supplied as copyable `Index.ts` code in the conversation.

## Deployment
1. Replace the contents of your GitHub Pages deployment with the contents of `build198`.
2. Replace the existing Supabase `lounge-ai` Edge Function with the separate 1.7.30.0 `Index.ts` code and deploy it.
3. No SQL migration is intended. The function reads existing `menu_entries`, `menu_favourites`, `household_members`, `household_lounge_messages`, `household_lounge_ai_usage`, `shopping_lists`, and `shopping_items` records.
4. Shopping-list context is restricted to unbought items belonging to lists marked `is_shared=true`. If the `shopping_lists` lookup is unavailable, shopping context is omitted rather than exposing private-list items.
5. Refresh the app after GitHub Pages publishes.

## Notes
- Past menu entries are distinguished from completed meals using `is_completed`; future entries are treated as plans.
- Household member names are resolved from `household_members` using the message sender's `sender_id`.
- The Edge Function is not included in this ZIP; use the copyable code supplied separately.
