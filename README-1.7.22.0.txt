Luke & Beth's Shopping List — Version 1.7.22.0
Household Lounge — Stage 2: Alfred & Gromit AI replies

App changes:
- Adds character message rendering for Alfred and Gromit.
- Human messages invoke the secure Supabase Edge Function named lounge-ai.
- Character replies arrive through the existing Supabase Realtime subscription.
- Shows updated character descriptions and Lounge status.
- Existing shopping, dashboard, menu, calendar and household features are retained.

Important model update:
Google has restricted Gemini 2.5 model generation for new projects/users. For new projects Google recommends newer Flash-Lite models. This build therefore uses gemini-3.5-flash-lite, the current cost-efficient Flash-Lite model, rather than the previously discussed 2.5 Flash-Lite.

Deployment order:
1. Run LOUNGE-1.7.22.0-AI-SETUP.sql in Supabase SQL Editor.
2. In Supabase Dashboard > Edge Functions, create a function named lounge-ai.
3. Deploy the source in supabase/functions/lounge-ai/index.ts.
4. In Supabase Dashboard > Edge Function Secrets, add GEMINI_API_KEY with the API key created in Google AI Studio. Do not put this key in GitHub or app.js.
5. Upload the contents of build198 to the existing GitHub Pages repository, replacing the corresponding files.
6. Refresh the app and send a test message in the Lounge.

Security and usage safeguards:
- The function verifies the caller's Supabase session and household membership.
- Gemini API key and Supabase server key remain server-side.
- The function only responds to a human message belonging to the caller.
- At most one AI turn every 8 seconds per household.
- At most 40 AI turns per household per UTC day.
- Each AI turn may add up to two short character messages.
- This is a request-count safeguard, not a guaranteed GBP spend cap. Review Google AI Studio usage/billing separately.

Privacy note:
Google's Gemini API pricing page states that free-tier content may be used to improve Google's products, while paid-tier content is not. Avoid sending sensitive information until you have reviewed Google's current terms and chosen the appropriate tier.
