# JKVoyage Deployment Guide

JKVoyage is built as a high-performance modern web application using **React 19**, **Vite**, **Tailwind CSS v4**, and **Firebase / Express**. It is fully pre-configured for instant zero-config deployment to all major cloud hosting platforms:

- [Vercel](#1-deploying-to-vercel)
- [Netlify](#2-deploying-to-netlify)
- [Cloudflare Pages](#3-deploying-to-cloudflare-pages)
- [Render](#4-deploying-to-render)
- [Railway / Fly.io / Docker](#5-deploying-with-docker-railway-flyio)

---

## 1. Deploying to Vercel

The repository includes a ready-to-use `vercel.json` and `api/index.ts` serverless API endpoint.

### Option A: Via Vercel Web Dashboard (Recommended)
1. Push your repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. Vercel automatically detects the project settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. (Optional) Add your Environment Variables in the Vercel dashboard:
   - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API key for the AI concierge.
   - `VITE_GOOGLE_PLACES_API_KEY`: *(Optional)* For Google Places autocomplete & photos.
5. Click **Deploy**. Vercel will build the frontend and serve both the SPA and serverless API seamlessly!

### Option B: Via Vercel CLI
```bash
npm install -g vercel
vercel
```

---

## 2. Deploying to Netlify

The repository includes `netlify.toml`, `public/_redirects`, and `public/_headers` to ensure client-side SPA routing (`/index.html 200`) and security headers work immediately.

### Option A: Via Netlify Web Dashboard
1. Go to [app.netlify.com](https://app.netlify.com) and click **"Add new site" > "Import an existing project"**.
2. Connect your Git repository.
3. Configure the build settings (detected automatically from `netlify.toml`):
   - **Base directory**: Leave blank (root)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. (Optional) Set Environment Variables under **Site configuration > Environment variables**.
5. Click **"Deploy site"**.

### Option B: Via Netlify CLI
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

---

## 3. Deploying to Cloudflare (Pages & Workers)

Cloudflare natively serves Vite SPA applications with global edge caching and instant page loads.

### Option A: Via Cloudflare Dashboard (Pages)
1. Go to **Cloudflare Dashboard > Workers & Pages > Create application > Pages > Connect to Git**.
2. Select your repository.
3. Configure the build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. (Optional) In **Environment Variables (advanced)**, add:
   - `NODE_VERSION`: `20`
   - Any custom `VITE_*` variables if overriding default Firebase settings.
5. Click **"Save and Deploy"**.

### Option B: Via Wrangler CLI (Workers Static Assets / Pages)
```bash
npm run build
npx wrangler deploy
```
*Note: `wrangler.toml` has `not_found_handling = "single-page-application"` preconfigured, which natively routes all deep links to `index.html` without causing infinite redirect loops (`code: 100324`).*

### Cloudflare Troubleshooting:
- **Infinite loop detected in _redirects [code: 100324]**:
  - **Cause**: Cloudflare Workers Static Assets API rejects wildcard redirects `/* /index.html 200` as an infinite loop.
  - **Fix**: SPA fallback is handled natively via `not_found_handling = "single-page-application"` in `wrangler.toml`. Conflicting `_redirects` files are removed.
- **"No build associated with that uuid"**:
  - **Cause**: Occurred when `bun.lock` failed to parse in early runners.
  - **Fix**: The repository uses standard `package-lock.json` and excludes `bun.lock`. Cloudflare builds cleanly with `npm ci`.

---

## 4. Deploying to Render

The repository includes a `render.yaml` blueprint.

1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New > Blueprint**.
2. Connect your Git repository.
3. Render will read `render.yaml` and configure:
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.ts`
4. Click **Apply** to deploy.

---

## 5. Deploying with Docker (Railway / Fly.io / Self-Hosted)

A multi-stage production `Dockerfile` and `.dockerignore` are included.

### Build and Run with Docker Locally:
```bash
# Build the container
docker build -t jkvoyage .

# Run on port 3000
docker run -p 3000:3000 --env-file .env jkvoyage
```

### Railway:
1. Connect your GitHub repository to [railway.app](https://railway.app).
2. Railway will automatically detect either the `Dockerfile` or `Procfile` / `package.json`.
3. Set the `PORT` variable (default 3000 or Railway auto-assigned port).
4. Click **Deploy**.

---

## Environment Variables Reference

Copy `.env.example` to `.env` when deploying or configuring environment variables on your platform:

| Variable | Description | Required? |
|---|---|---|
| `GEMINI_API_KEY` | Server-side Gemini API key for AI Concierge | Optional (Built-in offline travel assistant provided) |
| `VITE_GOOGLE_PLACES_API_KEY` | Google Places API key for live search | Optional (Curated presets provided) |
| `VITE_FIREBASE_API_KEY` | Custom Firebase Web API Key | Optional (Default bundled applet config included) |
| `VITE_FIREBASE_PROJECT_ID` | Custom Firebase Project ID | Optional |
| `PORT` | Web server port (defaults to 3000) | Optional |

---

## Verification & Health Check

After deployment, visit:
- `/` - Main application
- `/api/health` - API health check (returns `{ "status": "ok", "service": "JKVoyage API" }`)
