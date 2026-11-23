# Luke & Beth's Shared Shopping List — v1.7.13

Shared custom categories and remembered category choices, built from 1.7.12.1.
- Custom categories are stored per household in Supabase and shared with household members.
- Add, rename and delete custom categories from More > Manage categories or the category picker.
- Renaming updates existing shopping items and learned category rules.
- Deleting a custom category moves its current items to Other and removes rules for it.
- Manual category changes save a household-wide learned rule for the exact normalized item name.
- Future additions of the same item use the remembered category; custom categories are available to the automatic category engine.
- New shopping items and meal ingredients use the learned/custom category assignment.
- Requires SQL migration in chat to create household_categories and household_item_category_rules.
