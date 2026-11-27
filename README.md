# Luke & Beth Shopping List — 1.8.8

## Wallace & Gromit character update
- Builds on the 1.8.7 Wallace personality reset and preserves the working Lounge interface.
- Keeps the concise acknowledgement behaviour while giving Wallace more eccentric inventor enthusiasm, playful food-and-cheese enthusiasm, gentle muddled humour, and more distinctive conversational rhythm.
- Makes Gromit a more active silent sidekick, targeting roughly one in three suitable AI conversations, while keeping him completely non-verbal.
- No frontend feature or database schema changes.
- Updates frontend version references to 1.8.8 and increments the service-worker cache to `luke-beth-shopping-v108`.

## Deployment
1. Upload the contents of `build198` to the existing GitHub Pages deployment, replacing the previous frontend files.
2. Replace and deploy the Supabase `lounge-ai` Edge Function with the complete `Index.ts` supplied separately in the ChatGPT conversation.
3. Open the app on both devices and use **Update now** if prompted.

## Important
The Wallace voice and Gromit's appearance frequency are controlled by the Supabase Edge Function, not the frontend ZIP alone. Deploy both parts of this update. No SQL migration is required.
