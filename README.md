# Luke & Beth's Shopping List — Version 1.7.27.0

### 1.7.27.0 — Household Lounge typing sequence and character rules

- Removes the frontend's random Alfred/Gromit typing guess.
- The Lounge now listens for character-specific typing broadcasts from the `lounge-ai` Supabase Edge Function. Each indicator is shown immediately before the matching character message is inserted, in the server's actual reply order.
- Keeps the existing individual character typing bubbles and avatars.
- The Edge Function update is supplied separately in the chat and must be deployed to Supabase.
- Alfred's instructions now identify Luke as male and Beth as female, address Luke as Luke, and prohibit incorrect gendered honorifics.
- Gromit is based on Beth's teddy in her dressing room and is strictly non-verbal. He communicates only through actions, expressions, gestures, pantomime, and occasional written notes. The prompt avoids implying that the teddy is frequently moved or knows about events it has not been told.

## Deploying the frontend

1. Extract this ZIP.
2. Open the `build198` folder.
3. Upload the contents of `build198` to the existing GitHub Pages repository, replacing the corresponding files.
4. Allow GitHub Pages to publish, then refresh the app. If an older version remains cached, close and reopen the app or refresh the page.

## Deploying the Supabase function

Deploy the updated `lounge-ai` Edge Function separately using the complete `Index.ts` code supplied in the accompanying ChatGPT message. Do not upload an Edge Function file from this ZIP.

The frontend and updated Edge Function must both be deployed for the character typing indicators to reflect the real speaker and reply order.
