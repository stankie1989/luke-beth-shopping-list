# Luke & Beth Shopping List — 1.8.5

## What's included
- Replaces the browser's plain confirmation prompt with a styled in-app confirmation before clearing the shared Lounge chat. The clear action deletes both household Lounge messages and direct messages only after confirmation.
- Fixes the @mention regular expressions so typing `@` and part of a household member's name filters the suggestion list correctly. Selecting a member inserts their name and routes the message privately, without invoking Wallace or using AI.
- Gives Wallace's canned greetings and quick replies the same animated character typing indicator as AI replies, including a short natural pause.
- Makes Wallace and Gromit's names, descriptions and portraits more readable.
- Corrects the app, stylesheet, script and service-worker version references so they consistently identify 1.8.5.

## Deployment
1. Upload the contents of `build198` to the existing static hosting location, replacing the previous frontend files.
2. No new SQL migration is required for this frontend update. It uses the existing Lounge tables and `post_lounge_canned_reply` RPC.
3. No Supabase Edge Function replacement is required for these frontend fixes. Keep the current `lounge-ai` function deployed.
4. Open the app on both devices and use **Update now** if prompted. The service-worker cache is incremented to `luke-beth-shopping-v105`.

## Important behaviour
- Clearing the Lounge is household-wide and irreversible; the confirmation dialog explains this before proceeding.
- Direct messages remain restricted to the sender and recipient by the existing database policies.
- Canned replies still use the existing Supabase RPC; the typing animation is shown locally and broadcast to the other household member.
