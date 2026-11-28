# Luke & Beth Shopping List — 1.9.3

## Lounge history and Gromit direct-address refinement

Patch release built from the supplied 1.9.2 package. Existing shopping, shared/private list, meal planner, favourites, recipe finder, calendar, weather and Lounge functionality are retained.

### Frontend
- Visible app version and CSS/JS asset query strings updated to 1.9.3.
- Service-worker cache bumped to `luke-beth-shopping-v113`.
- Lounge history still initially loads the newest 150 household messages and supports pagination to older messages.
- The history control is now styled as a more obvious button and labelled **Load previous messages**.
- Loading older messages retains the user's scroll position and does not delete or modify stored messages.

### Lounge Edge Function
- A direct greeting or address such as **Hey Gromit** now counts as addressing Gromit and triggers a separate silent Gromit response.
- Asking where Gromit is remains a Wallace-only answer.
- Explicit questions to Gromit still produce a separate silent gesture.
- Occasional Gromit appearances, Wallace's reference resolution, UK date handling, meal context and atomic usage limits are retained.

### Supabase deployment
1. No new SQL migration is required for 1.9.3. Keep the 1.9.1 usage migration already installed.
2. Replace the existing `lounge-ai` Edge Function with the complete `supabase/functions/lounge-ai/index.ts` supplied separately in the ChatGPT conversation, then deploy it.
3. Keep the existing Edge Function secrets: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS` (or legacy `SUPABASE_ANON_KEY`), `SUPABASE_SECRET_KEYS` (or legacy `SUPABASE_SERVICE_ROLE_KEY`), and `GEMINI_API_KEY`.
4. Upload the contents of this ZIP to the existing frontend hosting location, replacing the previous frontend files.

### Testing status
- ZIP archive integrity checked.
- Frontend JavaScript syntax checked.
- Not deployed or end-to-end tested against the live Supabase project.
