# PhishGuard AI – 2-hour hackathon setup (all free)
1. **Supabase** (supabase.com): new project → SQL Editor → run `schema.sql` → copy URL + anon key into `config.js`.
2. **Groq** (console.groq.com): create free API key.
3. **Deploy**: push folder to GitHub → import in **Vercel** → add env var `GROQ_API_KEY` → Deploy.
4. Open the site, click "Try sample". Scans appear live on every open tab.
Without keys it still works (local heuristic fallback + in-page feed).
Pitch: AI + realtime crowdsourced threat feed; snippets are stored with links redacted for privacy.
