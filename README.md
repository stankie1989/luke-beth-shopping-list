# Luke & Beth Shopping List — 1.9.4

## Lounge development usage allowance

Patch release built from 1.9.3. Existing app functionality and the Gromit direct-address/history improvements are retained.

### Changes
- Increased the server-side household Lounge AI rolling 24-hour request allowance from 100 to 300 to support active development testing.
- The existing 8-second household cooldown remains in place.
- No database schema or SQL migration changes are required.
- Visible app version and CSS/JS asset query strings updated to 1.9.4.
- Service-worker cache bumped to `luke-beth-shopping-v114`.

### Supabase deployment
1. No new SQL migration is required. Keep the existing 1.9.1 usage migration installed.
2. Replace the existing `lounge-ai` Edge Function with the complete `supabase/functions/lounge-ai/index.ts` supplied separately in the ChatGPT conversation, then deploy it. The function now passes `p_daily_limit: 300` to the existing usage RPC.
3. Keep the existing secrets: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS` (or legacy `SUPABASE_ANON_KEY`), `SUPABASE_SECRET_KEYS` (or legacy `SUPABASE_SERVICE_ROLE_KEY`), and `GEMINI_API_KEY`.
4. Upload the contents of this ZIP to the existing frontend hosting location, replacing the previous frontend files.

### Testing status
- ZIP archive integrity checked.
- Frontend JavaScript syntax checked.
- Not deployed or end-to-end tested against the live Supabase project.
- The 300-request allowance is intended for development testing; review and reduce it before considering the app production-final.
