# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/cc83abb4-1856-45a1-b4fe-abc5f63bcf57

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/cc83abb4-1856-45a1-b4fe-abc5f63bcf57) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo & push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up environment variables
# Copy .env.example to .env.local and fill in your Supabase credentials
cp .env.example .env.local
# Edit .env.local with your actual Supabase URL and keys

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Environment Variables Setup

This project requires Supabase configuration. Follow these steps:

1. **Create `.env.local` file** (this file is git-ignored and will NOT be committed):
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here
   ```

2. **Get your Supabase credentials**:
   - Go to your Supabase project: https://app.supabase.com
   - Navigate to **Settings → API**
   - Copy the **Project URL** and **anon/public key**

3. **Important Security Notes**:
   - ✅ `.env.local` is already in `.gitignore` - your credentials are safe
   - ❌ **NEVER commit actual credentials to GitHub**
   - ✅ You can commit `.env.example` (template file with placeholder values)

4. **Restart your dev server** after creating `.env.local`

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

This project is deployed via **Vercel**. The app uses Supabase as the backend (no Lovable Cloud dependency).

### Setting Environment Variables in Vercel

For production deployment on Vercel, set your environment variables:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → **Settings** → **Environment Variables**
3. Add your Supabase credentials:
   - `VITE_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key-here`
4. Set for: **Production**, **Preview**, and **Development**
5. Redeploy your application

**Note:** 
- The app is now **fully independent** of Lovable Cloud
- All data operations use Supabase directly
- See `MIGRATION_RUNBOOK.md` for detailed deployment instructions

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
