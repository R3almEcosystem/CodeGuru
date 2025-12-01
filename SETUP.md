# CodeGuru Setup Guide

## Quick Start - Create Demo Account

### Step 1: Get Your Service Role Key

1. Go to your Supabase project: https://app.supabase.com
2. Click on your project
3. Go to **Settings** → **API** (left sidebar)
4. Scroll to find the **Service Role** key (it says "secret" in red)
5. Copy the full Service Role key

### Step 2: Add Service Role Key to Environment

Edit your `.env.local` file and add:

```
VITE_SUPABASE_URL=https://gsljjtirhyzmbzzucufu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGpqdGlyaHl6bWJ6enVjdWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDE1MjUsImV4cCI6MjA4MDA3NzUyNX0.hKR4lNuf1BsFmMxz7TlTtJOuFa6bHD4eNyV4Dx_pmFU
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 3: Run the Setup Script

```bash
npm run setup:demo
```

### Step 4: Sign In

1. Make sure the dev server is running: `npm run dev`
2. Go to http://localhost:5173/auth
3. Enter these admin credentials:
   - **Email:** admin@r3alm.com
   - **Password:** Z3us!@#$1
4. You'll be redirected to the main app!

## Manual Alternative

The admin account has been created in Supabase with these credentials:

- **Email:** admin@r3alm.com
- **Password:** Z3us!@#$1

Simply sign in at http://localhost:5173/auth with these credentials.

## Development Commands

```bash
# Start dev server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck

# Run linter
npm lint

# Setup demo account (requires SERVICE_ROLE_KEY in .env.local)
npm run setup:demo
```

## Project Structure

```
src/
├── pages/
│   └── AuthPage.tsx          # Sign in / Sign up page
├── components/
│   ├── ui/
│   │   ├── Sidebar.tsx       # Project/conversation navigator
│   │   ├── ChatPanel.tsx     # Main chat interface
│   │   └── Header.tsx        # Page header
│   └── ...
├── hooks/
│   ├── useAuth.ts            # Authentication state
│   ├── useMessages.ts        # Chat/project state
│   └── useSettings.ts        # User settings
├── lib/
│   ├── supabase.ts           # Supabase client & auth functions
│   └── xai.ts                # xAI API integration
└── App.tsx                   # Main app with routing
```

## Features

- ✅ Email/password authentication via Supabase
- ✅ Project and conversation management
- ✅ Real-time AI chat with xAI (Grok)
- ✅ Message persistence in Supabase
- ✅ File attachments support
- ✅ Markdown rendering with syntax highlighting
- ✅ Dark theme (Bolt.new inspired)
- ✅ Responsive design

## Troubleshooting

### Blank screen after sign in
- Check that you have projects created (they should be auto-created)
- Check browser console for errors (F12 → Console tab)
- Try refreshing the page

### "Cannot find module" errors
- Run `npm run typecheck` to see TypeScript errors
- If you see module resolution errors, restart the dev server

### Sign in not working
- Make sure the user exists in Supabase Authentication
- Check .env.local has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Check browser console for API errors

### Getting "Service Role Key not set" when running npm run setup:demo
- See Step 1-2 above to add VITE_SUPABASE_SERVICE_ROLE_KEY to .env.local
- The key should start with `eyJ...` and be quite long

## Next Steps

Once logged in, you can:
1. Create new projects with the `+` button
2. Create conversations within projects
3. Start chatting with the AI
4. Upload files and get AI analysis
5. Organize your conversations by project
