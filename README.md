Luke & Beth Shared Shopping List — Version 1.7.18

Update: added a Plymouth city-centre weather card to the Household Dashboard. It selects Beth's next upcoming timed shift from the connected read-only Google Calendar and shows the hourly forecast closest to her finishing time: temperature, feels-like temperature, precipitation probability, wind speed and conditions. Includes a manual refresh control and Open-Meteo attribution. Weather is retrieved from Open-Meteo's public forecast API; no API key, SQL migration or additional Google permission is required. Forecast availability depends on the provider's forecast horizon.

Luke & Beth Shared Shopping List — Version 1.7.16.1

Dashboard refinement, built from 1.7.16:
- Removes the list-change status banner, Share with Beth button and share hint from the Dashboard only. Sharing remains available on the Shopping tab.
- Removes the recent household activity section from the Dashboard.
- Fixes dinner cards to read the meal planner's saved `name` field.
- Improves mobile card sizing and wrapping to keep dashboard text and category bars inside their borders.
- Keeps the Shopping, Dashboard, Menu and More navigation order.
- No SQL or database changes required.

Luke & Beth Shared Shopping List — Version 1.7.15.5

Update: recipe method paragraphs and numbered steps now display as separate softly tinted outlined cards, alternating blue, teal and purple. Built from confirmed working 1.7.15.4. Preserves menu cleanup, meal finder and update checks. No SQL required.

Luke & Beth Shared Shopping List — Version 1.7.15.4

Update: online recipe methods are formatted as spaced numbered steps or separated paragraphs. Fixed displayed app version, stylesheet cache-busting URL and service-worker registration version. Built from the confirmed working 1.7.15.3 baseline; preserves its Menu banner/button fixes. No SQL required.

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


## Version 1.7.16.3
- Refined household dashboard heading and date layout for narrow mobile screens.
- Dashboard dinner cards now use the same meal artwork as the Menu Planner.
- Corrected bottom navigation to use four equal-width columns.
- No database or SQL changes.


## Version 1.7.16.3
- Added spacing above the household member strip when Dashboard is selected.
- Inset the dashboard title icon and date from the card edges for improved mobile alignment.
- No SQL changes.


## Version 1.7.17 – Google Calendar dashboard connection
- Added a read-only Google Calendar connection card to the Household Dashboard.
- Uses the deployed Supabase `google-calendar-oauth` Edge Function and the existing private token table.
- Displays matching Beth shift events for the next 30 days and their start/finish times.
- Calendar access is optional; shopping list and menu features remain unchanged.
- Requires Google OAuth and Supabase Edge Function setup; no additional SQL is required beyond the private token table already created.
