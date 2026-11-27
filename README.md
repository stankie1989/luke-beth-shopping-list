# Luke & Beth Shopping List — 1.8.9

## Yorkshire Wallace and Gromit's silent sidekick
- Builds directly on the supplied 1.8.8 frontend.
- Keeps the existing Lounge layout, short canned acknowledgements, meal/shopping context and working character cards.
- The companion Supabase prompt update gives Wallace a stronger, original Yorkshire identity: warm, eccentric, inventive, enthusiastic and occasionally dry, without phonetic dialect or exaggerated slang.
- Wallace's message is now explicitly limited to Wallace's own dialogue. Gromit's physical reactions belong in a separate Gromit message only; the prompt discourages duplicated gestures and Wallace narrating Gromit's actions.
- Gromit remains entirely non-verbal and is encouraged to appear in roughly one in three suitable conversations, without being forced into serious or simple factual replies.
- Existing short acknowledgement replies remain concise.
- Historical chat rows stored under the old Alfred sender name continue to display as Wallace for compatibility; live typing events accept only Wallace and Gromit. No Alfred personality is used.
- Updates frontend version references to 1.8.9 and service-worker cache to `luke-beth-shopping-v109`.

## Deployment
1. Upload the contents of `build198` to the existing GitHub Pages deployment, replacing the previous frontend files.
2. Replace and deploy the Supabase `lounge-ai` Edge Function with the complete `Index.ts` supplied separately in the ChatGPT conversation.
3. Open the app on both devices and use **Update now** if prompted.

## Important
The AI personality and Gromit's appearance frequency are controlled by the Supabase Edge Function, not the frontend ZIP alone. Deploy both parts. No SQL migration is intended for this update.
