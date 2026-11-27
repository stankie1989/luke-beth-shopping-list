Luke & Beth's Shopping List — Version 1.7.21.1
Household Lounge — Stage 1 layout refinement

Changes:
- Aligns the household member strip spacing on the Lounge tab with the other main tabs.
- Hides the global Share with Beth button and its helper text while viewing the Lounge.
- Removes the excessive reserved space below the Lounge panel.
- Preserves the Stage 1 shared household messaging and all existing app areas.

No additional SQL migration is required. Keep the existing 1.7.21.0 Lounge table and policies.

Deployment:
1. Extract this ZIP.
2. Upload all contents of build198 to the existing GitHub Pages repository, replacing the corresponding files.
3. Preserve the images folder.
4. Refresh the app on both devices.
