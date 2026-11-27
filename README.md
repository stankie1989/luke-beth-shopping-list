# Luke & Beth Shopping List — 1.8.7

## Release notes
- Carries forward the confirmed Lounge interface fixes from 1.8.5/1.8.6: styled clear-chat confirmation, household @mention suggestions and private direct messages, typing animation for canned replies, and larger Wallace/Gromit character cards.
- Keeps the existing short canned replies unchanged.
- Updates frontend asset references and app version to 1.8.7.
- Increments the service-worker cache to `luke-beth-shopping-v107` for automatic update detection.

## Required Supabase update
The Wallace personality reset is delivered separately as the complete `lounge-ai` Edge Function `Index.ts` in the ChatGPT conversation. Deploy that function as well as these frontend files. No SQL migration is required.

## Deploy
1. Upload the contents of this `build198` folder to the existing GitHub Pages deployment, replacing the previous frontend files.
2. Replace the Supabase `lounge-ai` Edge Function with the supplied `Index.ts` and deploy it.
3. Open the app on both devices and use **Update now** if prompted. The service-worker cache is `luke-beth-shopping-v107`.

## Notes
- The Gemini model remains `gemini-3.5-flash-lite`.
- The Edge Function starts Wallace from a clean character definition. It does not inherit the former assistant's personality instructions. Household data context and Gromit's non-verbal supporting role remain separate.
- Historical character messages previously stored under the old name are displayed as Wallace for continuity; new AI replies are Wallace and optionally Gromit only.
