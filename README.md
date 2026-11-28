# Luke & Beth Shopping List — 1.9.1

## Household intelligence and Lounge reliability update

This is a patch release built directly from the supplied 1.9.0 frontend. It preserves the existing shopping lists, shared/private list handling, meal planner, favourites, recipe finder, calendar, weather, and Lounge interface.

### Frontend
- Updated visible app version and asset query strings to 1.9.1.
- Bumped the service-worker cache to `luke-beth-shopping-v111` so installed devices fetch the patch.
- No database schema changes are required for the frontend itself.

### Lounge Edge Function (`supabase/functions/lounge-ai/index.ts`)
- Uses the existing Wallace and Gromit character setup from the supplied current Lounge source.
- Makes Wallace-only the default. Gromit is optional and only appears for a distinct, useful visual reaction.
- Adds a server-side spacing gate: after Gromit appears, he is suppressed for the next two human turns. A direct message to Gromit still receives a silent response.
- Validates Gromit's output as a short, starred, non-verbal action; rejects quoted or spoken dialogue and uses a silent fallback for direct address.
- Uses the UK `Europe/London` calendar date for today and date-window calculations, with UTC-noon date-only arithmetic to avoid server UTC midnight and daylight-saving drift.
- Supplies weekday and past/today/upcoming labels for meal entries. Planned entries remain distinct from evidence of meals actually eaten; `is_completed` is retained as the app's completion flag.
- Preserves recent conversation context so follow-up references (for example, a question about cheese just suggested) can be resolved against earlier turns.
- Atomically reserves household usage through a service-role-only SQL RPC to avoid concurrent requests bypassing cooldown or daily limits.

### Supabase deployment
1. Open Supabase SQL Editor and run `supabase/migrations/202611280001_claim_household_lounge_ai_usage.sql` once.
2. Replace the existing `lounge-ai` Edge Function with `supabase/functions/lounge-ai/index.ts`, then deploy it.
3. Keep the existing Edge Function secrets: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS` (or legacy `SUPABASE_ANON_KEY`), `SUPABASE_SECRET_KEYS` (or legacy `SUPABASE_SERVICE_ROLE_KEY`), and `GEMINI_API_KEY`.
4. Upload the contents of this ZIP to the existing frontend hosting location, replacing the previous frontend files.
5. Open the app on Android and iPhone. Use **Update now** if prompted; otherwise reload once after the service worker updates.

### Important notes
- The SQL migration assumes the existing `public.household_lounge_ai_usage` table used by the current Lounge Edge Function, with `household_id`, `user_id`, and `created_at` columns. It does not create or alter that table.
- The Edge Function validates household membership before making the privileged usage-claim call. The RPC is executable only by `service_role`.
- The migration enforces a rolling 24-hour cap of 100 calls per household and an 8-second household cooldown, matching the current server configuration.
- This package has not been tested against your live Supabase project. It has not changed household data or live settings. Deploy and test before treating it as confirmed stable.
