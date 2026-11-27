# Luke & Beth's Shopping List — Version 1.7.23.1

## Release notes

### 1.7.23.1 — Lounge message counter and package cleanup
- Restored the message counter above the chat.
- Kept the “Household conversation” heading removed.
- Kept the character introduction cards and welcome panel removed.
- Consolidated release notes into this single README.
- Removed old, duplicate README files and kept SQL/Edge Function files out of the app ZIP.
- Updated the service-worker cache version so devices can receive the new files.

### 1.7.23.0 — Clean Lounge chat
- Removed the character introduction cards.
- Removed the large welcome/information panel.
- Removed the “Household conversation” heading and message count (the counter is restored in 1.7.23.1).
- Added human typing indicator support for Luke and Beth.
- Preserved the existing Lounge messaging and AI integration.

### 1.7.22.0 — Alfred and Gromit AI
- Added AI-generated character replies through the Supabase `lounge-ai` Edge Function.
- Added Alfred and Gromit character message styling.
- Added recent conversation context for character replies.
- Added server-side cooldown and daily usage limits.
- Required a Gemini API key stored as a Supabase secret named `GEMINI_API_KEY`.

### 1.7.21.1 — Lounge layout refinement
- Adjusted spacing around the household member panel.
- Removed the redundant “Share with Beth” area from the Lounge screen.
- Reduced unnecessary space beneath the chat.

### 1.7.21.0 — Household Lounge foundation
- Added a dedicated Household Lounge tab.
- Added shared household text messaging backed by Supabase.
- Added introductory character placeholders for Alfred and Gromit.

### 1.7.20.0 — Compact sharing status
- Introduced a compact household sharing status indicator.

### 1.7.19.9 — Compact header accent
- Refined the compact header glow line and reduced excess spacing.

## Upload instructions
1. Extract this ZIP.
2. Open the `build198` folder.
3. Upload the contents of `build198` to the existing GitHub Pages repository, replacing the corresponding files.
4. Keep the `images` folder and all its contents.
5. Refresh the app. If an installed PWA still shows the previous version, close and reopen it after the service worker updates.

## Supabase files
SQL migrations and Edge Function source are intentionally supplied separately in the ChatGPT conversation, not inside this app ZIP. Do not delete or replace your deployed Supabase function or existing database objects when uploading this package.

## Notes
- This package is the app frontend only.
- Existing Supabase project settings and secrets are not included.
- Gemini API keys must remain in Supabase secrets and must never be placed in frontend files.
