# Luke & Beth's Shopping List — Version 1.7.28.0

### 1.7.28.0 — Household Intelligence (frontend package)

This package carries forward the confirmed 1.7.27.0 frontend and updates the release version. The Household Lounge intelligence improvements are delivered in the separate Supabase Edge Function supplied with this release.

## Deployment
1. Replace the contents of your GitHub Pages deployment with the contents of `build198`.
2. Deploy the separately supplied `Index.ts` to your existing Supabase `lounge-ai` Edge Function.
3. Keep your existing database schema and environment secrets. No SQL migration is required for this update.
4. Allow GitHub Pages to publish, then refresh the app. If an older version remains cached, close and reopen the app.

The Edge Function reads the existing `household_members`, `household_lounge_messages`, `menu_entries`, `menu_favourites`, `shopping_lists`, `shopping_items`, and `household_lounge_ai_usage` tables. It scopes household context to the authenticated household.


Alfred receives only unbought items from shared shopping lists; private shopping lists are excluded.
