# Luke & Beth Shopping List — 1.9.2

## Lounge history and character behaviour update

Patch release built from the supplied 1.9.1 package. Existing shopping, shared/private list, meal planner, favourites, recipe finder, calendar, weather and Lounge functionality are retained.

### Frontend
- Visible app version and CSS/JS asset query strings updated to 1.9.2.
- Service-worker cache bumped to `luke-beth-shopping-v112`.
- Lounge now initially loads the newest 150 household messages, rather than starting at the oldest end of the table.
- Added **Load older messages** pagination so earlier messages remain accessible without trying to render the entire conversation at once.
- Direct messages continue to be filtered to the signed-in household member.

### Lounge Edge Function
- Wallace now answers "Where's Gromit?" naturally instead of automatically handing the conversation to him.
- A direct invitation for Gromit to give an opinion still produces a separate, silent Gromit gesture.
- Occasional Gromit appearances are selected by a server-side suitability check and deterministic one-in-three selection for light-hearted prompts, subject to the spacing gate. Ordinary/factual/serious messages remain Wallace-only.
- Gromit's non-verbal validation and silent fallback are retained.
- Wallace's follow-up reference resolution, UK date handling, meal context and atomic usage limit are retained.

### Supabase deployment
1. No new SQL migration is required for 1.9.2. Keep the 1.9.1 usage migration already installed.
2. Replace the existing `lounge-ai` Edge Function with the complete `supabase/functions/lounge-ai/index.ts` supplied separately in the ChatGPT conversation, then deploy it.
3. Keep the existing Edge Function secrets: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS` (or legacy `SUPABASE_ANON_KEY`), `SUPABASE_SECRET_KEYS` (or legacy `SUPABASE_SERVICE_ROLE_KEY`), and `GEMINI_API_KEY`.
4. Upload the contents of this ZIP to the existing frontend hosting location, replacing the previous frontend files.
5. Refresh Android and iPhone. Use **Update now** if prompted; otherwise reload once after the service worker updates.

### Safety and verification notes
- The update does not delete or modify any Lounge database messages. The new history pagination only changes how messages are fetched and displayed.
- No SQL is included because the update requires no schema change.
- This package has passed local archive and syntax checks, but has not been deployed to or tested against the live Supabase project. Do not treat it as confirmed stable until the household tests it.
