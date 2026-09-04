# Genovation AI — website

Sixteen static pages. No build step, no server code, no dependencies to install.

    index.html                 landing page
    industries.html            Industries · the eight + four deep profiles
    about.html                 About · founder, method, responsible AI
    contact.html               Contact · message form + booking embed
    ai-agents.html             Service 01 · AI Agents & Automation
    software-and-websites.html Service 02 · AI Software & Websites
    get-found.html             Service 03 · Get Found · AI Marketing
    video-and-ugc.html         Service 04 · Video & UGC Content

    industry-hvac.html              Industry · HVAC
    industry-massage-chiro.html     Industry · Massage & Chiro
    industry-auto-dealerships.html  Industry · Auto Dealerships
    industry-optical.html           Industry · Optical Stores
    industry-restaurants.html       Industry · Restaurants
    industry-real-estate.html       Industry · Real Estate
    industry-tech-repair.html       Industry · Tech Repair / ITAD
    industry-dental.html            Industry · Dental & Injury Law

    404.html                   not-found page (point your host at it)
    sitemap.xml                all sixteen pages
    robots.txt                 allow-all + sitemap pointer
    support.js                 rendering runtime (required)
    cine-scene.js              canvas motion layer (required)
    assets/                    logos + twenty-one videos

The eight industry pages are reached from the cards on industries.html. Every
page carries the same nav and footer, so all sixteen are two clicks from home.

Every page carries the same floating glass navbar (four services · Industries ·
About · Contact · Claim a Slot) and the same four-column footer.

## Design system

Black page, full-bleed video with no dark overlay — all contrast comes from the
liquid-glass chrome: rgba(255,255,255,.01) fill, luminosity blend, 4px backdrop
blur (50px on primary CTAs), and a top/bottom gradient border ring drawn with
mask-composite. Pill radius on every control.

Type: Instrument Serif italic for every heading, Barlow 300/400/500 for body.

Shot rhythm — video framing varies per section, deliberately, so the page reads as
composed rather than as clips pasted in a row. On the landing: full-bleed
establishing shot (hero) → no video at all, canvas only (What we build) → a masked
inset panel on the right (AI Workforce) → a thin full-width band (How we work) →
full-bleed closing shot (audit), bookending the hero. Inner pages: full-bleed hero,
then a bottom-anchored masked band on the CTA so light appears to rise off the floor.

Live motion layer — `cine-scene.js`, a <cine-scene mode="…"> canvas component
sitting between each video and its content. Six modes, one per story beat:
- `leak` — five holes leaking, sealing one by one as you scroll, then the column rises
- `route` — a call travelling through answer → qualify → book → remind
- `assemble` — scattered points snapping into a dashboard grid
- `converge` — signals arriving from every direction at one point
- `broadcast` — frames flying out from a single source
- `workforce` — five agents passing data across a shared ring
Pure canvas 2D: no CDN, no WebGL context loss, DPI-aware, halves its particle count
on phones, pauses when scrolled out of view, and freezes for prefers-reduced-motion.
Tune per mount with mode / tint / opacity / density / speed.

Element motion is hand-written, no library:
- rAF/CSS video crossfade — clips under 12s loop natively, longer ones fade out
  0.6s before the end, reset and fade back in
- word-by-word blur reveal on hero headlines (blur 10px → 5px → 0, 100ms stagger)
- blur + lift entrance on every other element, IntersectionObserver-triggered
- count-ups on the stat cards, magnetic CTA buttons, 3D card lean on pointer

## Putting it live

**Netlify** — app.netlify.com/drop, drag this whole folder on. Live URL immediately.
**Cloudflare Pages** — dash.cloudflare.com > Workers & Pages > Create > Pages > Upload.

Any static host works: upload the folder contents to the web root. Keep the
structure — support.js and assets/ must sit beside the HTML files.

## Before you launch

- Every "Claim a Slot" / audit button points at the booking widget:
  api.leadconnectorhq.com/widget/booking/3qoHJXcr2Hv7u9ADreKm — swap if it changes.
  contact.html also embeds that widget in an iframe.
- The contact form has no server. Submitting validates the fields and hands the
  visitor a pre-filled email to contact@genovation.ai. Point it at your form
  handler when you go live.
- about.html no longer has a photo placeholder. The founder column is a
  typographic panel (initials + founded / also-runs / industries-served). If you
  want a real photo of Jamal there instead, send the image and it swaps in.
- The favicon, apple-touch-icon and social share image all point at
  assets/logo.png. Swap in a purpose-made 1200x630 image for og:image if you
  want richer link previews.
- sitemap.xml, robots.txt and every canonical URL assume the site is served from
  https://genovation.ai. Find-and-replace that origin if the domain differs.
- Set 404.html as your host's not-found page (Netlify and Cloudflare Pages both
  pick it up automatically).
- The videos are the bulk of the page weight. If first load feels slow, re-encode
  them smaller — nothing in the markup needs to change.
