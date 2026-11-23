# Luke & Beth's Shared Shopping List — v1.7.10.4

Meal slot and swap reliability update based on 1.7.10.3.
- Only one meal can be added to a household/date/meal-type slot through normal add, favourite-add, and reschedule flows.
- If copying a meal into an occupied slot, the only available choices are Swap or Cancel. No copy-alongside option.
- If copying a day into an occupied day, the only available choices are Swap or Cancel.
- Whole-day swaps stage source rows on a temporary date before moving destination rows, avoiding same-slot collisions during the swap.
- Detects legacy duplicate entries in the same slot and blocks unsafe swaps rather than creating more duplicates.
- No SQL migration required.
