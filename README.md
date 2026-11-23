# Luke & Beth's Shared Shopping List — v1.7.7

This build starts from the confirmed working v1.7.6 baseline.

## What's new
- Search favourite meals by meal name or ingredient.
- Automatically assign a suggested category based on the meal name and ingredients.
- Manually change a favourite's category from the favourites screen.
- Filter favourites by category.
- Existing favourite preview, add-to-menu, removal, menu planner, custom meal illustrations and shopping list features retained.

## Notes
- No SQL migration is required.
- Manual category overrides are currently stored locally on the device/browser using localStorage. They do not yet sync between household members/devices; shared category storage can be added with a small database migration in a later update if desired.
- This build has not been tested on physical phones. Test before treating it as stable.
