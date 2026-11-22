# Luke & Beth's Shopping List — starter build

This is the first **front-end prototype** of the agreed shopping-list design.

## What works in this prototype
- Responsive layout for phone and desktop.
- Dark/light theme preference stored on this device.
- Switch between Luke and Beth preview identities.
- Add items, change quantities, tick items off, rename/remove items.
- Local saving in the browser.
- Recent activity preview.
- PWA manifest and service worker for installability over HTTPS.

## Important current limitations
This is not yet the connected two-person app. Data is stored in the current browser only. The Share button is deliberately a preview and does **not** send a real notification. The activity feed is local demo activity, not a live feed from the other phone. Do not rely on this prototype as a shared list until the backend is connected.

## Run locally
Open `index.html` for a basic preview. For PWA/service-worker testing, serve the folder over HTTPS or localhost, for example:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Next build stage: shared backend
Recommended production architecture:
- Supabase Auth for separate Luke and Beth accounts.
- Supabase Postgres for households, memberships, shopping items, share events, reactions and activity events.
- Supabase Realtime for simultaneous list editing and live activity.
- Row Level Security so only the two household members can access the list.
- A secure server-side push service (e.g. Web Push with VAPID keys) for explicit share notifications and reaction notifications.
- Per-user theme preference stored against each account, not shared list data.

### Suggested data model
- `households`: one private household.
- `household_members`: user ID, household ID, display name.
- `shopping_items`: household ID, name, quantity, bought flag, created/updated metadata.
- `activity_events`: household ID, actor, event type, item reference, timestamp.
- `share_events`: household ID, sender, recipient, timestamp.
- `reactions`: share event ID, reactor, reaction type.
- `push_subscriptions`: user ID and encrypted/secured Web Push subscription data.

### Required behaviour for the real app
1. Normal edits save and sync but never send push notifications.
2. Pressing **Share with Beth/Luke** creates a share event and sends a push notification to the other member.
3. Recipient can open the list or react with 👍.
4. A reaction creates a push notification for the original sender.
5. Do not store or expose list-open/read receipts.
6. Each account has its own theme preference.
7. Activity events may say “Beth is editing…” only while a real editing/presence signal is active; show changes such as “Luke just added Milk” after the database confirms them.

## Deployment
The static prototype can be hosted on GitHub Pages, Netlify or another HTTPS static host. Real cross-device sync and push notifications require the backend and secure push configuration described above.


## Supabase-connected build

This build uses the Supabase project URL and public publishable key in the browser. Never put a Supabase secret/service-role key or database password in this repository.

### Deploy
1. Replace the files in the GitHub repository with the contents of this ZIP.
2. Commit the changes to `main`.
3. Open the GitHub Pages site and create your account with your own email.
4. Confirm your email if requested, then sign in.
5. Luke creates the household and privately sends Beth the invite code.
6. Beth creates her own account and joins with that code.

### Current scope
Account sign-in, private household membership, shared shopping items, activity feed and live database updates are included. Push notifications are not configured yet. The share action currently creates an in-app share event.


## Multiple lists (v1.5.0)

Before deploying this version, open Supabase → SQL Editor and run `supabase-v1.5.0-multiple-lists.sql` once. This migration preserves existing shopping items by moving them into the original shared Shopping List. Do not rerun the original database setup SQL.

The app now supports multiple lists per household. Each list has an owner and can be shared with the household or private to its owner. Private list items and activity are protected by Supabase Row Level Security. List visibility changes retain existing items.
