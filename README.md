# Luke & Beth's Shopping List — Version 1.5.1

This update is based on the supplied 1.5.0 app build.

## Changes
- Prevents missing message elements from causing a secondary `textContent` error on the sign-in screen.
- History quantity-change entries now include the item name, for example: `Luke changed quantity for "Cheese" from 2 to 3`.
- App version and service-worker cache version updated.

## Deployment
Replace the existing app files in the GitHub repository with the files in this ZIP and commit to `main`.

No Supabase SQL migration is required for version 1.5.1.
