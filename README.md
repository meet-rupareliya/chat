# Circl Chat

Register, find other registered people, and chat with them live — built with
React (Vite) + Supabase (Auth, Postgres, Realtime).

## What it does

- **Sign up / Log in** — real accounts via Supabase Auth (email + password).
- **Find people** — every registered user appears in a searchable directory.
- **Live chat** — one-to-one messaging; new messages appear instantly for
  both people using Supabase Realtime (no page refresh, no polling).

## 1. Create a Supabase project

1. Go to https://supabase.com, sign in, and click **New project**.
2. Once it's ready, open **Project Settings → API**.
3. Copy the **Project URL** and the **anon public** key — you'll need both.

## 2. Set up the database

1. In your Supabase project, open **SQL Editor**.
2. Paste the entire contents of `supabase-schema.sql` (included in this
   project) and click **Run**.
   This creates the `profiles` and `messages` tables, sets up row-level
   security so people can only read their own conversations, and turns on
   Realtime for both tables.
3. Open **Authentication → Providers** and confirm **Email** is enabled
   (it is by default). For quick local testing, you can turn off
   "Confirm email" under **Authentication → Settings** so new accounts can
   log in immediately without clicking a confirmation link.

## 3. Configure the app

1. In this project folder, copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
2. Fill in your values:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

## 4. Run it

```bash
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173). Open it in a
second browser (or an incognito window), register a second account, and
message between the two — messages appear live on both screens.

## Project structure

```
circl-chat/
├── supabase-schema.sql     # run this in Supabase's SQL editor
├── .env.example             # copy to .env and fill in your project keys
├── src/
│   ├── supabaseClient.js    # Supabase client setup
│   ├── App.jsx               # auth/session state + layout
│   ├── index.css
│   └── components/
│       ├── Auth.jsx          # sign up / log in form
│       ├── UserList.jsx      # searchable directory of registered users
│       └── Chat.jsx          # real-time one-to-one messaging
```

## How the live chat works

- Sending a message just does an `insert` into the `messages` table.
- Both people's browsers are subscribed to that table via
  `supabase.channel(...).on('postgres_changes', ...)`.
- The moment a row is inserted, Supabase pushes it to every subscribed
  client over a WebSocket — that's what makes it "live" instead of needing
  a refresh or a polling timer.

## Notes / next steps you could add

- Online/offline presence using Supabase's Presence feature.
- Group chats (would need a `conversations` + `conversation_members` table).
- Read receipts, typing indicators, file/image attachments.
- Push notifications for messages received while the tab isn't open.
