# Luke & Beth's Shared Shopping List — v1.7.11

Smart Shopping Categories, built from confirmed working 1.7.10.4.
- Automatically guesses a supermarket category when a shopping item is added.
- Existing uncategorised items are assigned a suggested category when the list loads.
- Users can manually change an item's category.
- More tab includes a Show categories toggle, stored per device.
- When enabled, main list and Shopping Mode group items by category.
- When disabled, the list returns to the original ungrouped layout.
- Requires one Supabase migration adding nullable category column to shopping_items.
