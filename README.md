# Luke & Beth's Shopping List — Version 1.7.24.0

## Release notes

### 1.7.24.0 — Household Lounge AI presence
- Added a shared “Alfred and Gromit are thinking” indicator while the secure Lounge AI function is processing a household message.
- The indicator is shown to both household members through Supabase Realtime and clears when the AI function finishes or errors.
- Kept the existing human typing indicator, message counter, clean Lounge layout, character styling, and current AI invocation.
- Updated the app version labels, asset query versions, and service-worker cache to v96.

## Important scope note
This is the **frontend update**. It improves the visible AI conversation experience, but it does not change the server-side Gemini prompts, decide which character responds, or introduce staggered Alfred/Gromit replies. Those behaviours live in the Supabase `lounge-ai` Edge Function and require a separate Edge Function update. No SQL migration is required for this frontend change.

## Upload instructions
1. Extract this ZIP.
2. Open the `build198` folder.
3. Upload the contents of `build198` to the existing GitHub Pages repository, replacing the corresponding files.
4. Keep the `images` folder and all its contents.
5. Refresh the app. If an installed PWA still shows the previous version, close and reopen it after the service worker updates.

## Supabase notes
Do not delete or replace existing database objects, secrets, or the deployed `lounge-ai` function when uploading this frontend package. The Gemini API key must remain stored as a Supabase secret and must never be placed in frontend files.
