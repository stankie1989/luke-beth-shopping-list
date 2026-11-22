# Luke & Beth's Shopping List — Version 1.5.9

## Fix
- Replaced the fragile CSS-only Ready to share contrast correction with runtime theme styling.
- The app now explicitly sets the neutral share card background, border, heading, description and icon colours based on the active app theme.
- Theme changes reapply the correct colours immediately.
- This avoids dependence on CSS selector specificity or stylesheet cascade order.

## Deployment
Replace the nine app files in GitHub with these files and commit to `main`.

No Supabase SQL migration is required.
