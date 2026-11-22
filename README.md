# Luke & Beth's Shopping List — Version 1.5.8

## Fix
- Applied a more specific light-theme contrast rule directly to the Ready to share status card.
- Explicitly styles the card background, title, description and icon using high-specificity selectors and `!important` so generic status styles cannot override them.
- Dark theme remains unchanged.

## Deployment
Replace the nine app files in GitHub with these files and commit to `main`.

No Supabase SQL migration is required.
