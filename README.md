# 🛡️ PhishGuard AI

> Paste a suspicious email, SMS or link. AI tells you in seconds if it's phishing, and every scan feeds a live, real-time threat feed.

Built for a 2-hour hackathon with a **100% free stack**: HTML/CSS/JS, Groq (Llama 3.3), Supabase and Vercel.

---

## 📌 Table of Contents
1. [Problem](#-problem)
2. [Solution](#-solution)
3. [Features](#-features)
4. [Tech Stack](#-tech-stack)
5. [Architecture](#-architecture)
6. [Project Structure](#-project-structure)
7. [Setup Guide](#-setup-guide)
8. [API Reference](#-api-reference)
9. [Database Schema](#-database-schema)
10. [Security & Privacy](#-security--privacy)
11. [Troubleshooting](#-troubleshooting)
12. [Roadmap](#-roadmap)
13. [License](#-license)

---

## 🎯 Problem
Phishing is the most common cyber attack. Fake "your account is locked" messages trick people into giving away passwords, OTPs and bank details. Non-technical users cannot easily tell a fake message from a real one.

## 💡 Solution
PhishGuard AI gives anyone a simple scanner:
1. Paste a message or link.
2. An AI analyst scores the risk from 0 to 100 and gives a verdict: **SAFE**, **SUSPICIOUS** or **PHISHING**.
3. It explains *why* and gives a safety tip.
4. The scan (with links redacted) is saved to a shared **Live Threat Feed** that updates instantly for every visitor.

## ✨ Features
- 🤖 **AI phishing analysis** using Llama 3.3 70B via Groq (free tier)
- 📊 **Animated risk gauge** with colour-coded verdicts
- 📡 **Real-time threat feed** powered by Supabase Realtime
- 🧠 **Offline fallback**: a built-in keyword heuristic works if the AI is unavailable
- 🔒 **Privacy first**: only a short snippet is stored, and URLs are replaced with `[link]`
- 🎨 **Cyber UI**: matrix rain canvas, glitch title, radar loader, slide-in feed items
- 📱 **Responsive** layout for phones and desktops

## 🧰 Tech Stack
| Layer | Technology | Cost |
|---|---|---|
| Frontend | HTML, CSS, vanilla JavaScript | Free |
| AI | Groq API, `llama-3.3-70b-versatile` | Free tier |
| Backend | Vercel Serverless Function (`/api/analyze`) | Free |
| Database | Supabase (PostgreSQL + Realtime + RLS) | Free |
| Hosting | Vercel | Free |

## 🏗️ Architecture

```
┌──────────────┐   POST /api/analyze    ┌─────────────────────┐   chat/completions   ┌────────────┐
│   Browser    │ ─────────────────────► │ Vercel Serverless   │ ───────────────────► │  Groq API  │
│ (index.html, │ ◄───────────────────── │ api/analyze.js      │ ◄─────────────────── │ Llama 3.3  │
│  app.js)     │   JSON verdict         │ (holds GROQ key)    │      JSON            └────────────┘
└──────┬───────┘                        └─────────────────────┘
       │ insert scan + subscribe (anon/publishable key, protected by RLS)
       ▼
┌────────────────────────────┐
│ Supabase: table `scans`    │ ──► Realtime broadcast ──► every open browser tab's Live Feed
└────────────────────────────┘
```

**Flow:**
1. User clicks **Scan Threat**.
2. `app.js` sends the text to `/api/analyze`.
3. The serverless function asks Groq for a strict JSON verdict and returns it.
4. If the call fails, `app.js` falls back to the local heuristic.
5. The UI animates the gauge and shows reasons plus a tip.
6. A redacted snippet is inserted into Supabase, and Realtime pushes it to all connected clients.

## 📁 Project Structure
```
phishguard/
├── index.html        # Page layout
├── style.css         # Cyber theme and animations
├── app.js            # UI logic, heuristic fallback, Supabase client, realtime feed
├── config.js         # Supabase URL + publishable (anon) key
├── api/
│   └── analyze.js    # Serverless AI endpoint (Groq)
├── schema.sql        # Database table, RLS policies, realtime setup
└── README.md
```

## 🚀 Setup Guide

### Prerequisites
Free accounts on [Supabase](https://supabase.com), [Groq](https://console.groq.com), [GitHub](https://github.com) and [Vercel](https://vercel.com).

### 1. Supabase (database)
1. Create a new project.
2. Open **SQL Editor**, paste the contents of `schema.sql` and click **Run**.
3. Open **Project Settings → API Keys** and copy:
   - **Project URL**
   - **Publishable / anon public key**
4. Put them in `config.js`:
   ```js
   window.CFG = {
     SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
     SUPABASE_ANON_KEY: "YOUR-PUBLISHABLE-OR-ANON-KEY"
   };
   ```

> ⚠️ **Never** use the **secret / service_role** key in `config.js`. It gives full database access, and GitHub will block the push.

### 2. Groq (AI)
1. Sign in at console.groq.com.
2. Go to **API Keys → Create API Key** and copy it.
3. **Do not** put this key in any file. It goes into Vercel as an environment variable (step 4).

### 3. GitHub
1. Create a public repository named `phishguard`.
2. Upload all files from this folder so that `index.html` is at the repo root and `api/analyze.js` keeps its path.

### 4. Deploy on Vercel
1. Click **Add New → Project** and import the repository.
2. Under **Environment Variables** add:
   | Name | Value |
   |---|---|
   | `GROQ_API_KEY` | your Groq key |
3. Click **Deploy**.
4. If you add the variable after the first deploy, go to **Deployments → Redeploy**.

### 5. Run locally (optional)
```bash
npm i -g vercel
vercel dev        # serves the site and /api/analyze on http://localhost:3000
```
Add `GROQ_API_KEY` to a local `.env` file (do not commit it).

## 🔌 API Reference

### `POST /api/analyze`
**Request**
```json
{ "text": "URGENT: verify your account at http://paypa1-secure.xyz" }
```
Text is truncated to 3000 characters.

**Response `200`**
```json
{
  "score": 92,
  "verdict": "PHISHING",
  "reasons": ["Urgent language", "Look-alike brand spelling", "Suspicious domain"],
  "tip": "Never click links in unexpected messages; visit the official site directly."
}
```
| Field | Type | Notes |
|---|---|---|
| `score` | number | 0 to 100, clamped server-side |
| `verdict` | string | `SAFE`, `SUSPICIOUS` or `PHISHING` |
| `reasons` | string[] | Up to 4 short reasons |
| `tip` | string | One safety tip |

**Errors:** `405` for non-POST requests, `500` if the AI call fails (the frontend then uses the local heuristic).

## 🗄️ Database Schema
Table `scans`:
| Column | Type | Constraint |
|---|---|---|
| `id` | bigint identity | primary key |
| `snippet` | text | max 80 characters |
| `score` | int | 0 to 100 |
| `verdict` | text | `SAFE`, `SUSPICIOUS`, `PHISHING` |
| `created_at` | timestamptz | default `now()` |

Row Level Security is enabled. Anyone can `select` and `insert`; nobody can update or delete from the client.

## 🔐 Security & Privacy
- **API key protection:** the Groq key lives only in Vercel environment variables, never in client code.
- **Publishable key only:** the browser uses the public Supabase key, and RLS limits what it can do.
- **Prompt-injection resistance:** the system prompt tells the model to treat user text purely as data and to reply with JSON only. The score is clamped and the verdict is rendered with `textContent`, never `innerHTML`, to prevent XSS.
- **Privacy:** only the first 60 characters are stored, with URLs replaced by `[link]`.
- **Known limitation:** the open insert policy can be spammed. A production version should add rate limiting (for example via an Edge Function) and CAPTCHA.

## 🛠️ Troubleshooting
| Problem | Fix |
|---|---|
| Scans are not saved or the feed is empty | Check `config.js` values, then re-upload and redeploy |
| Result looks basic (no AI reasons) | `GROQ_API_KEY` missing or wrong in Vercel, then Redeploy |
| `/api/analyze` returns 404 | `api/` folder must be at the repo root |
| GitHub blocks the push (secret scanning) | You pasted the secret key. Use the publishable/anon key and rotate the secret key |
| Realtime not updating | Make sure the last line of `schema.sql` (`alter publication supabase_realtime ...`) ran successfully |

## 🗺️ Roadmap
- [ ] URL reputation check (VirusTotal / Google Safe Browsing)
- [ ] "Report scam" button and community voting
- [ ] Leaderboard of most reported threats
- [ ] Browser extension for one-click scanning
- [ ] Multi-language support (Urdu, Hindi, Arabic)
- [ ] Rate limiting and CAPTCHA

## 📄 License
MIT: free to use, modify and share.

---
*Stay safe online. Think before you click.* 🛡️
