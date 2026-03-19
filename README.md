# Vibe Starter

A minimal prototype starter kit for VibeSharing.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Deploy to VibeSharing
npm run deploy
```

## Setup for VibeSharing

### One-Time Setup (do once)

1. Sign in to [vibesharing.app](https://vibesharing.app)
2. Go to **Account** (person icon, top-right) → Copy your deploy token
3. Save it globally so all projects can use it:

```bash
mkdir -p ~/.vibesharing
echo '{"deployToken": "vs_your_token_here"}' > ~/.vibesharing/config.json
```

### Per-Project Setup

1. Create a project and prototype on vibesharing.app
2. Copy the prototype ID from the prototype page
3. Add it to `vibesharing.json`:

```json
{
  "prototypeId": "your-prototype-id-here"
}
```

4. Run `npm run deploy` to ship it!

## Project Structure

```
├── app/
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page (edit this!)
│   └── globals.css   # Global styles
├── components/       # Reusable components
├── CLAUDE.md         # AI context (auto-imported on deploy)
├── vibesharing.json  # VibeSharing config
├── vercel.json       # Vercel config (enables preview embedding)
└── package.json
```

## vercel.json

The included `vercel.json` configures headers to allow your prototype to be embedded in VibeSharing's preview iframe. Don't remove it unless you have a specific reason.

## CLAUDE.md

Keep your `CLAUDE.md` file updated with:
- What you built
- Decisions made
- Known issues
- Next steps

When you deploy, VibeSharing automatically imports this as context history.

## Deploying

```bash
npm run deploy
```

This will:
1. Zip your project (excluding node_modules, .git, etc.)
2. Upload to VibeSharing
3. Deploy to Vercel
4. Import CLAUDE.md as context

Your prototype will be live in seconds!
