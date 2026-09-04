# Deploying genovation.ai to Vercel

The `site/` folder is static HTML. No build step, no framework, no npm install.

## 1. Deploy

**Option A — drag and drop (fastest)**
1. Go to vercel.com/new
2. Drag the entire `site` folder onto the page
3. Framework Preset: **Other**. Build Command: leave empty. Output Directory: leave empty.
4. Deploy. You get a `*.vercel.app` URL in about 60 seconds.

**Option B — Git (recommended long term)**
1. Push the contents of `site/` to a GitHub repo root
2. vercel.com/new → Import that repo → Framework Preset **Other** → Deploy
3. Every push to `main` redeploys automatically

`vercel.json` is already in the folder. It sets clean URLs (`/about` instead of `/about.html`),
one-year immutable caching on `assets/` and images, and basic security headers.

## 2. Point the domain

In Vercel: Project → Settings → Domains → Add `genovation.ai` and `www.genovation.ai`.

Vercel gives you one of these to set at your registrar:
- **A record** on `@` → `76.76.21.21`
- **CNAME** on `www` → `cname.vercel-dns.com`

Use whatever Vercel's Domains screen shows, it's authoritative. DNS takes 10 minutes to
a few hours. HTTPS is issued automatically once DNS resolves.

## 3. Turn the contact form on

The form validates client-side, then POSTs as JSON. It currently has no endpoint, so it
falls back to opening the visitor's email app. To make it deliver:

1. Sign up at **formspree.io** (free tier: 50 submissions/month) with contact@genovation.ai
2. Create a new form. Copy the endpoint, it looks like `https://formspree.io/f/xxxxxxx`
3. Open `site/contact.html`, find near the bottom:
   ```js
   const FORM_ENDPOINT = '';
   ```
   Put your endpoint in the quotes:
   ```js
   const FORM_ENDPOINT = 'https://formspree.io/f/xxxxxxx';
   ```
4. Redeploy. Submissions arrive by email and are stored in the Formspree dashboard.

Basin (usebasin.com) works identically if you prefer it. If the POST ever fails, the
visitor still gets the email-app fallback, so a message is never silently lost.

## 4. Before announcing it

- [ ] Confirm the booking link is live: `api.leadconnectorhq.com/widget/booking/3qoHJXcr2Hv7u9ADreKm`
- [ ] Click through all 16 pages on the `*.vercel.app` URL before pointing DNS
- [ ] Submit a test message through the form and check it lands
- [ ] Add the site to Google Search Console, submit `genovation.ai/sitemap.xml`
- [ ] Analytics: Vercel Analytics is one toggle in Project → Analytics, no code needed

## URL structure

All internal links, canonicals and the sitemap use clean paths: `/`, `/about`, `/contact`,
`/ai-agents`, `/industry-hvac` and so on. No `.html` anywhere, so no redirect hops.
This depends on `cleanUrls: true` in `vercel.json` — if you ever move off Vercel, the host
needs equivalent extensionless routing.

**Test on the `*.vercel.app` URL, not from your desktop.** Because links are root-relative,
opening `site/index.html` from disk renders the page correctly but the navigation will not
work. That is expected and only affects local file previews.

## Notes

- Videos in `assets/` total roughly 40 MB. Well inside Vercel's free tier, served from CDN.
- The 404 page is wired automatically by `404.html`.
- Canonical URLs and og:tags across all 16 pages already point at `https://genovation.ai`.
