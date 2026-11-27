Luke & Beth's Shopping List — Version 1.7.21.0
Household Lounge — Stage 1 foundation

What's new:
- Adds a dedicated Lounge tab without replacing existing Shopping, Dashboard, Menu or More areas.
- Adds a shared household conversation for Luke and Beth.
- Messages are stored in a separate household_lounge_messages table.
- Supabase Realtime keeps the conversation updated across devices.
- Adds introductory character cards for Alfred and Gromit. AI replies and proactive conversations are not enabled yet; those are planned for Stage 2/3.

Setup required:
1. Open Supabase Dashboard > SQL Editor.
2. Paste and run the complete contents of LOUNGE-1.7.21.0-SETUP.sql.
3. Deploy all files in this folder to the existing GitHub Pages repository, preserving the images folder.
4. Open the app on both phones and update/reload. Sign in and choose Lounge.
5. Send a test message from one phone; it should appear on the other phone shortly after.

Safety:
- The SQL creates only the new Lounge message table and its index/policies.
- Row Level Security restricts reading and sending to authenticated members of the same household.
- No AI provider, camera, location, Tapo, SmartThings or Google Calendar settings are changed.

If the Lounge says the database setup is missing, run the SQL migration and reload the app.
