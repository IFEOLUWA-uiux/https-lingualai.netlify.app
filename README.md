# Lingual AI

Lingual AI is an AI language workspace for chat, grammar correction, translation, file reading, saved history, and progress tracking.

## Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

## Environment Variables

Add these in Netlify:

- `GROQ_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Run `supabase/schema.sql` in Supabase before testing accounts, history, and file storage.
