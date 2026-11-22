# Luke & Beth's Shopping List — Version 1.5.11

## iPhone improvements
- Added an Apple Touch Icon so iPhone home-screen installation uses the shopping trolley app artwork instead of a generic initial.
- Added Apple web-app metadata for the installed home-screen experience.
- Added responsive width and horizontal-overflow safeguards to prevent sideways panning on narrow iPhone screens.
- Set form controls to a readable 16px minimum to prevent iOS Safari from automatically zooming in when an input is focused.
- Preserved the existing viewport settings and pinch-zoom accessibility.
- Bumped the app/service-worker cache version so installed copies can receive the update.

## Deployment
Replace the app files in the GitHub repository with the files in this ZIP and commit to `main`. No Supabase SQL migration is required. The ZIP contains no SQL file.

For Beth's iPhone icon, after deployment she may need to remove the existing home-screen shortcut and add the website to her Home Screen again so iOS fetches the new Apple Touch Icon.
