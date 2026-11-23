# Luke & Beth's Shopping List — Version 1.7.6

## Version 1.7.6 – Smarter meal illustrations
- Added 16 original cartoon food illustrations, including sausages, sausage and mash, chicken nuggets, fish fingers, shepherd's pie, spaghetti bolognese and more.
- Added meal-aware suggestions using dish names and common alternative terms.
- Typing a meal name before opening the illustration picker now pre-fills search and suggests the closest matching artwork.
- Added recently used illustrations, remembered locally on the device.
- Existing emoji library remains available as a fallback.
- Artwork is bundled and cached for offline use.
- No Supabase SQL or database changes required.

## Version 1.7.5 – Add favourite meals to a selected day
- When adding a meal from a calendar day, choose to create a new meal or pick a saved favourite.
- Browse saved favourites in a scrollable list.
- Preview a favourite's saved ingredients and quantities before adding it.
- Add the selected favourite directly to the day and meal slot that was tapped.
- No database migration or SQL changes required.
- Built from the confirmed working 1.7.1 baseline.


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


## Version 1.7.1 – Menu Planner
- Added shared fortnight menu planner with dinner-first daily slots and optional breakfast/lunch.
- Added selectable cartoon food emoji illustrations, meal ingredients, favourites, and add-to-shopping-list support.
- Requires the separate menu planner SQL migration in Supabase.


## Version 1.7.1 – Food library and meal tracking
- Expanded food illustration library to 336 searchable options.
- Added shared meal completion tracking and a missed-meals recovery section.
- Missed meals can be marked as eaten or rescheduled using the monthly date picker.
- Requires the separate 1.7.1 Supabase migration to add the is_completed column.


## Version 1.7.1
- Highlighted the current day in the fortnight menu calendar.
- Added the ability to remove saved favourite meals without deleting planned meals.
- Improved service-worker update detection and checking frequency.
