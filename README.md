# Luke & Beth Shopping List — 1.9.0

## Household Intelligence & Lounge Expansion

This release builds on the confirmed 1.8.9 frontend and preserves the existing shopping, shared/private lists, meal planner, favourites, recipe finder, calendar, weather and Wallace & Gromit Lounge features.

### Frontend changes
- Updated app version references to **1.9.0** and service-worker registration URL.
- Bumped the service-worker cache to `luke-beth-shopping-v110` so installed devices fetch the new release.
- Reduced the general background refresh loop from every 4 seconds to every 15 seconds. Existing Supabase Realtime subscriptions remain the preferred live-update path; periodic refresh remains as a fallback.
- Kept the release limited to the existing required frontend files and assets.

### Lounge / Supabase update
Deploy the companion `Index.ts` Edge Function supplied in the ChatGPT conversation. It includes stricter request validation, a request timeout, improved Gromit direct-address recognition, server-side silent-action validation, safer usage reservation handling and the updated conversation guidance.

The SQL migration supplied in the conversation adds an atomic household usage-claim function. Run it once before deploying the new Edge Function.

### Deployment
1. Run the complete SQL migration in Supabase SQL Editor.
2. Replace the existing `lounge-ai` Edge Function with the complete `Index.ts` supplied in the conversation, then deploy it.
3. Upload the contents of this ZIP to the existing frontend hosting location, replacing the previous frontend files.
4. Open the app on Android and iPhone. Use **Update now** if prompted; otherwise reload once after the service worker updates.

### Notes
- Existing household data and tables are retained.
- The migration creates a PostgreSQL function and does not delete or rewrite household records.
- This package does not claim to have audited your live Supabase Row Level Security policies. Those must be reviewed against the actual project policies separately.
- SmartThings device-state integration and persistent long-term AI memory are not enabled in this release; they require additional verified integrations/schema work rather than assumptions.
