# Luke & Beth's Shopping List — Version 1.5.2

## Fix
- Fixed the missing `activeListName` element referenced by the list selector. This could throw a `textContent` error during household loading and then show that error on the sign-in screen.
- Made toast messaging tolerate a missing toast container.
- Updated app and service-worker cache versions.

## Deployment
Replace the nine app files in the GitHub repository with these files and commit to `main`.

No SQL migration is required.
