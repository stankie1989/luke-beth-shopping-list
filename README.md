# Luke & Beth's Shopping List — Version 1.7.26.0

## Release notes

### 1.7.26.0 — Household Lounge AI conversation upgrade
- Made the AI thinking indicator more noticeable using the app's purple accent colour.
- Increased the AI indicator font size and weight while leaving ordinary human typing indicators more subtle.
- Updated the Lounge AI Edge Function prompt to strengthen Alfred's butler voice and Gromit's playful, affectionate personality.
- The AI now has clearer permission to stay quiet when there is nothing useful to add, usually select one character, and only occasionally choose a second character for a distinct follow-up.
- When two character replies are selected, the Edge Function inserts the first reply, waits 2.4 seconds, then inserts the second so the conversation feels less robotic.
- Preserved authentication, household membership checks, Gemini API configuration, the 8-second cooldown, and the 40-turn-per-household UTC daily limit.
- No SQL migration is required.

## Frontend deployment
1. Extract this ZIP.
2. Open the `build198` folder.
3. Upload the contents of `build198` to the existing GitHub Pages repository, replacing the corresponding files.
4. Keep the `images` folder and all its contents.
5. Refresh the app. If the installed PWA still shows the previous version, close and reopen it after the service worker updates.

## Supabase Edge Function deployment
The updated function is included at:
`supabase/functions/lounge-ai/index.ts`

Deploy this file to the existing Supabase project as the `lounge-ai` Edge Function, replacing the current function code. For Supabase CLI users, from the project root run:

`supabase functions deploy lounge-ai`

Alternatively, paste the contents of the included `index.ts` into the existing `lounge-ai` function in the Supabase Dashboard and deploy it.

Keep the existing Supabase secrets and database tables. In particular, do not remove or expose `GEMINI_API_KEY`, `SUPABASE_URL`, or the existing Supabase keys. No database schema changes are included or needed.

## Important
The frontend and Edge Function are both included in this package, but they deploy separately: upload the `build198` contents to GitHub Pages and deploy the Edge Function to Supabase. The Edge Function change has not been live-tested against your Supabase project. After deployment, test a normal message, a quiet/no-reply turn, and a two-character turn. Existing usage limits are retained in the code.


Version 1.7.26.0: Lounge message text and character labels are slightly larger. AI typing is displayed inline beside the selected character avatar instead of the generic combined thinking banner. The frontend broadcasts a character-specific typing event. The deployed lounge-ai Edge Function must accept `typing_character` and broadcast `ai-character-typing` for cross-device indicators to be fully synchronised. Scheduled independent conversations and the updated silent-action Gromit personality require the separate server-side update and scheduler setup; they are not activated by this frontend ZIP alone.
