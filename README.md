# Luke & Beth Shopping List — 1.9.5

## Lounge character behaviour patch

Patch release built from 1.9.4. Existing app functionality, 300-request development allowance, 8-second cooldown, Lounge history loading, household context and menu behaviour are retained.

### Changes
- Direct Gromit address is now recognised when his name appears at the beginning or naturally at the end of a message, including questions such as “Do you like the rain, Gromit?” and “Fancy some cheese, Gromit?”.
- “Where's Gromit?” remains a location question for Wallace and does not invite Gromit to respond.
- Occasional Gromit appearances now use a genuine random selection rather than a deterministic message hash.
- The suitable-moment vocabulary is broadened to include everyday subjects such as rain, walks, cheese, biscuits, dogs and cosy household moments.
- Gromit remains optional and silent, with the existing spacing gate retained to prevent repeated appearances.
- Visible app version and CSS/JS asset query strings updated to 1.9.5.
- Service-worker cache bumped to `luke-beth-shopping-v115`.
- No new SQL migration is required.

### Supabase deployment
1. No new SQL migration is required. Keep the existing 1.9.1 usage migration installed.
2. Replace the existing `lounge-ai` Edge Function with the complete `supabase/functions/lounge-ai/index.ts` supplied separately in the ChatGPT conversation, then deploy it. It retains the 300-request rolling 24-hour allowance and 8-second cooldown.
3. Keep the existing secrets: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS` (or legacy `SUPABASE_ANON_KEY`), `SUPABASE_SECRET_KEYS` (or legacy `SUPABASE_SERVICE_ROLE_KEY`), and `GEMINI_API_KEY`.
4. Upload the contents of this ZIP to the existing frontend hosting location, replacing the previous frontend files.

### Testing status
- ZIP archive integrity and frontend JavaScript syntax should be checked before release.
- Not deployed or end-to-end tested against the live Supabase project.
- The 300-request allowance is intended for development testing; review and reduce it before considering the app production-final.
