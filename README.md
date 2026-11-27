# Luke & Beth Shopping List — 1.8.3

## What's new
- WhatsApp-style `@` autocomplete for the other household member.
- Direct household messages stored separately from AI Lounge messages; direct messages do not invoke Wallace.
- Clear shared Lounge conversation control in Personal Settings.
- Local canned Wallace replies for simple greetings, thanks and short reactions to reduce Gemini calls.
- Existing Wallace and Gromit portraits, household lists and meal planner retained.

## Deployment
1. Upload the contents of `build198` to the existing static hosting location, replacing the previous frontend files.
2. Run the supplied SQL migration in Supabase SQL Editor before testing direct mentions.
3. The existing `lounge-ai` Edge Function remains compatible. For the updated Gromit appearance frequency, deploy the matching 1.8.3 Edge Function supplied separately.
4. Clear the app cache/reload if the update banner does not appear.

## Notes
- Direct messages are visible only to their sender and recipient in the database policy.
- In-app/browser notifications can appear while the app is open and notification permission is granted. This release does not configure background push delivery when the app is fully closed.
- Local replies are deliberately limited to simple greetings, thanks and short reactions; substantive questions continue to use Gemini.
