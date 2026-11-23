Luke & Beth Shared Shopping List — Version 1.7.15.3

Fix: Menu tab now persistently hides the list status banner, Share with Beth button, share hint and approval card, even when background list-status refreshes run. The What can I cook? button remains at the top of Menu. No SQL required.

Luke & Beth Shared Shopping List — Version 1.7.15.2

Update: hides the list-change status banner on the login screen and Menu tab. The existing What can I cook? button is moved to a prominent full-width position at the top of Menu, and returns to its original location when leaving Menu. No database changes or SQL required.

# Luke & Beth's Shared Shopping List — v1.7.15

Automatic smart category inference, built from confirmed 1.7.13.3.
- Expands offline category matching with scored product terms and phrases.
- Exact household learned corrections retain highest priority.
- Automatically recognises custom categories using category-name concepts and built-in product knowledge (e.g. Pet Food, Baby Products, Toiletries, Cleaning Products).
- Uses product-specific phrase weighting to reduce ambiguous classifications (e.g. chicken nuggets -> Frozen).
- No manual keyword entry and no external AI/API call.
- No SQL changes.


## v1.7.15 – Smart Meal Finder
- Favourite meal matches appear first, followed by online recipe ideas from TheMealDB.
- Recipe cards compare available and missing ingredients, show full ingredients and instructions, and can add missing items to a chosen shopping list.
- Online recipes can be saved to household favourites.
- Quick links search BBC Good Food and Slimming World-style recipes using the ingredients entered.
- No database migration or SQL required.
