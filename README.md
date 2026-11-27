# Luke & Beth Shopping List — 1.8.4

## What's new
- Clear Lounge now uses an in-app styled confirmation dialog instead of the browser's plain alert.
- Wallace and Gromit character cards have larger, more readable names, descriptions and portraits.
- Simple local replies now show Wallace's typing indicator and a short pause before appearing.
- Existing @ mention autocomplete, direct messages, household data access and Lounge clear functionality are retained.

## Deployment
1. Upload the contents of `build198` to the existing static hosting location, replacing the previous frontend files.
2. Keep the 1.8.3 Supabase SQL migration applied.
3. The existing `lounge-ai` Edge Function remains compatible. For the revised Wallace personality, deploy the separate 1.8.4 function.
4. Reload the app on both devices. Cache version is v104.

## Notes
- Direct messages are private to their sender and recipient under the database policies.
- Background push delivery while the app is fully closed is not included.
