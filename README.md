# Luke & Beth Shopping List — 1.8.6

## What's included
- Carries forward the verified Lounge fixes from 1.8.5: styled clear-chat confirmation, household @mention suggestions and private direct messages, animated typing for canned replies, and larger Wallace/Gromit character cards.
- Updates the frontend version references to 1.8.6 and increments the service-worker cache to `luke-beth-shopping-v106` so installed devices can fetch the new release.

## Wallace conversation update
The more natural Northern English voice, concise acknowledgements, reduced repetition and duplicate-request protection are implemented in the separate Supabase Edge Function update supplied in the chat as `Index.ts`. Deploy that function update as well as this frontend ZIP for the complete 1.8.6 release.

## Deployment
1. Upload the contents of `build198` to the existing static hosting location, replacing the previous frontend files.
2. Replace the Supabase `lounge-ai` Edge Function source with the complete `Index.ts` supplied alongside this ZIP, then deploy it.
3. No SQL migration is required. The function uses the existing Lounge messages and AI usage tables.
4. Open the app on both devices and use **Update now** if prompted. The service-worker cache is `luke-beth-shopping-v106`.

## Notes
- The AI model remains `gemini-3.5-flash-lite`; this update changes Wallace's instructions and request handling, not the model.
- Gromit remains completely non-verbal.
- The frontend ZIP contains only the app's existing required files.
