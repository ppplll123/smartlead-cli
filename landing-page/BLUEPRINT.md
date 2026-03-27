# LeadsForLawyer Personalized Landing Page — Blueprint

> Reference document for recreating or extending the personalized landing page system to other niches.
> Live at: `demo.leadsfor.lawyer` (Cloudflare Pages, CNAME)

---

## 1. URL Parameters

Every parameter the page accepts via query string (`?firm=...&state=...`):

| Parameter   | Type     | Description | Example |
|-------------|----------|-------------|---------|
| `firm`      | string   | Law firm name. Triggers personalized mode (banner, badge, title, form pre-fill, review estimates). **Primary trigger — if absent, page renders generic.** | `Dan Newlin Injury Attorneys` |
| `name`      | string   | Contact person's first+last name. Used in hero title, audio label, form pre-fill. | `Dan Newlin` |
| `email`     | string   | Contact's email address. Pre-filled in form. | `dan@newlinlaw.com` |
| `state`     | string   | Firm's state. Used in How It Works step 2 ("at scale across {state}"), form subtitle, form pre-fill. | `Florida` |
| `reviews`   | integer  | Google review count. Drives lead estimate (reviews x 5 = low, reviews x 10 = high), review badge in subtitle, auto-select of leads dropdown, reviews section visibility (shown when >50). | `16319` |
| `grating`   | float    | Google star rating. Displayed in review badge, hero-right score card, reviews section. Defaults to `4.9`. | `4.9` |
| `place_id`  | string   | Google Maps Place ID. Used to build canonical Maps URL for review links. | `ChIJQQqikv5654gRvOE7eqt1hq4` |
| `maps_url`  | URL      | Direct Google Maps URL. Fallback if `place_id` not provided. If neither present, auto-generates from firm name search. | `https://maps.google.com/?cid=125758...` |
| `website`   | URL      | Firm's website. Linked from the personalized banner ("using your brand colors" link). If absent, link hidden. | `https://newlinlaw.com` |
| `address`   | string   | Firm's physical address. Appended below the hero badge in small text. | `7335 W Sand Lake Rd #300, Orlando, FL` |
| `bg`        | hex      | Brand background color. Applied as gradient to hero section + banner only (rest stays default navy). | `#1a3a5c` |
| `accent`    | hex      | Brand accent color. Overrides `--gold` CSS variable (buttons, badges, borders, labels). | `#c9a84c` |
| `primary`   | hex      | Brand primary/text color. Overrides `--cream` CSS variable (headings, bright text). | `#ffffff` |
| `audio`     | URL/path | Path to ElevenLabs MP3 audio file. Shows audio player above badge when present. | `demo-audio-dan-newlin.mp3` |
| `greviews`  | base64   | Base64-encoded JSON array of review objects (`{text, stars, author}`). Rendered as white cards in hero-right and reviews section. | `W3sidGV4dCI6Ii4uLiIs...` |

### Example Personalized URL

```
https://demo.leadsfor.lawyer/?firm=Dan+Newlin+Injury+Attorneys&name=Dan+Newlin&state=Florida&reviews=16319&grating=4.9&place_id=ChIJQQqikv5654gRvOE7eqt1hq4&website=https://newlinlaw.com&email=dan@newlinlaw.com&bg=%231a3a5c&audio=demo-audio-dan-newlin.mp3&greviews=W3sidGV4dCI6IkFic29sdXRlbHkgZmFudGFzdGljLi4uIiwic3RhcnMiOjUsImF1dGhvciI6IlJpY2sgU291dGgifV0=
```

---

## 2. Personalization Elements

### 2.1 Personalized Banner (top of page)
- Gold gradient bar: "This page was prepared specifically for **{firm}** — [using your brand colors]({website})"
- Link to firm website; hidden if `website` param absent
- Adds `personalized` class to body (adjusts hero top padding)

### 2.2 Audio Player
- Position: Hero-left, **above** the badge — first thing visible
- Label: "Personal message for {name || firm}"
- HTML5 `<audio>` element with gold-tinted controls (`filter: sepia(20%) saturate(70%) hue-rotate(15deg)`)
- Source: `audio` URL param (typically a pre-generated ElevenLabs MP3)
- Only visible when `audio` param is present

### 2.3 Hero Badge
- Default: "Database Reactivation for PI Firms"
- Personalized: "Database Reactivation for **{firm}**"
- If `address` param present, appended below in small muted text

### 2.4 Hero Title (h1)
- Default: "Your old leads are worth more than *you think*"
- With `name`: "{name}, *{firm}* is sitting on a goldmine"
- Without `name` but with `firm`: "*{firm}* is sitting on a goldmine"

### 2.5 Hero Subtitle
- Default: Generic AI + SMS pitch
- With `reviews`: "With [star-badge {grating} {reviews} reviews]({maps_url}), {firm} has likely generated **{reviews x 5}–{reviews x 10} leads** over the years (sound about right?). Most sit dormant in your CRM. We reactivate them using AI + SMS — performance basis, no results no cost."
- Without `reviews` but with `firm`: Firm-specific version mentioning `{firm}` and `{state}`
- Review badge: Gold pill with star emoji + count, hyperlinked to Google Maps place_id URL

### 2.6 Hero-Right: Lead Capture Form (White Card)
Rendered as a white rounded card (`rgba(255,255,255,0.95)`, `border-radius:16px`) with shadow, high contrast against branded hero.

**Form fields:**
1. **Name** (text, required) — pre-filled from `name` param
2. **Email** (email, required) — pre-filled from `email` param
3. **Firm Name** (text, required) — pre-filled from `firm` param
4. **State** (text) — pre-filled from `state` param
5. **Old Leads in {firm}'s CRM** (select) — label personalized with firm name in gold; auto-selected based on `reviews x 10`:
   - Under 1,000 / 1,000-5,000 / 5,000-10,000 / 10,000-50,000 / 50,000+/ Not sure
6. **Avg Case Value** (select) — defaults to $10,000 (moderate MVA):
   - $2K / $5K / $10K / $25K / $50K+
7. **Revenue Calculator** (auto-display) — gold gradient box, shown when leads + case value selected:
   - Leads Reached (20-50% respond)
   - New Cases (1-5% convert)
   - Revenue (conservative estimate)
   - Arrow annotation: "Your leads want this too — we build 'what's my case worth?' into the SMS flow"
8. **Phone** (tel, optional) — labeled "(optional — live SMS demo)"
9. **TCPA Checkbox** — always visible (not hidden behind phone entry):
   - Full TCPA consent language with Privacy/Terms links
   - Arrow annotation: "Same TCPA language we deploy on YOUR leads' intake pages"
10. **Submit button**: "Reactivate My Old MVA Leads — Free"
11. **Footer note**: "No credit card. No commitment."

**Arrow annotations** (gold italic, 0.55rem, appended to each field when personalized):
| Field | Annotation |
|-------|-----------|
| Name | "← We pre-fill your leads' names too" |
| State | "← Geo-targeted to their state" |
| Leads | "← We estimate this from your data" |
| Case Value | "← Your leads get 'what's my case worth?'" |
| Phone | "← SMS demo — same as what your leads get" |
| TCPA | "↑ Same TCPA language we deploy on YOUR leads' intake pages" |
| Revenue Calc | "↑ Your leads want this too — we build 'what's my case worth?' into the SMS flow" |

### 2.7 Hero-Right: Review Cards (below form section)
- Rendered in `#heroReviews` div after the hero section
- Google score badge: Large rating number + stars + "{reviews} reviews on Google" — links to Maps
- If `greviews` base64 present: individual white cards with stars, quoted text, author name
- If no `greviews`: teaser card "N clients rated {firm} X/5 stars. Imagine reactivating the leads behind those reviews."

### 2.8 Brand Color Theming
- `bg` param: Only tints the hero section (`linear-gradient(135deg, bg, bg-20)`) and banner (lighter gradient). Rest of page stays default navy. This prevents readability issues.
- `accent` param: Overrides `--gold` and `--gold-light` (buttons, borders, badges, labels)
- `primary` param: Overrides `--cream` (headings, bright text)
- Color adjustment via `adjustBrightness(hex, amount)` utility function

### 2.9 State Personalization
- How It Works step 2: "at scale" becomes "at scale across {state}"
- Form subtitle: "your existing database" becomes "{firm}'s existing database in {state}"

### 2.10 Google Reviews Section
- Only shown when `reviews > 50`
- Header: "What Your Clients Already Say About {firm}"
- Star display: filled/empty stars based on rating
- Rating link: "{grating}/5 from {reviews} reviews on Google" linked to Maps
- Review cards: white rounded cards with stars, italic quoted text, author
- Reactivation CTA: "Your clients already love you. Now imagine reactivating the {5x}–{10x} leads who never left a review — and turning them into signed cases and even *more* 5-star reviews."

### 2.11 "Why This Works" Section
- Bullet personalized: "{firm} likely has {5x}–{10x} unconverted leads sitting in the CRM"
- Bullet: "Everything branded in your firm's colors — this page was built custom for you"

### 2.12 CRM Integrations Section
19 systems listed as pill badges:
Filevine, SmartAdvocate, Litify, CASEpeer, Needles/Neos, Clio, LeadDocket, CloudLex, MyCase, PracticePanther, HubSpot, Salesforce, Alert Center, Walker Advertising, LeadByte, Smokeball, Google Sheets, CSV Export, Custom API

### 2.13 Buy MVA Leads Upsell
- "$300/lead" section for firms that also want fresh leads
- Links to `https://leadsfor.lawyer/#intake`

### 2.14 Stats Bar
- 30+ PI Firms Partnered
- 20-50% Response Rate on Old Leads
- $0 Upfront Cost

### 2.15 Social Proof
- Quote: "The client couldn't believe it..."
- Attribution: "PI Firm Partner, 6-Figure Recovery from Dormant Database"
- Logos bar: Morgan & Morgan, 30+ PI Firms Nationwide, Performance-Based Only

---

## 3. Data Sources

### 3.1 google_places_tier1.json (547 whales)
- Path: `~/smartlead/data/google_places_tier1.json`
- Structure: keyed by domain, each entry has: `name`, `address`, `rating`, `review_count`, `phone`, `website`, `place_id`, `types`, `maps_url`
- Source: Google Places API enrichment via `scripts/enrich_tier1_google_places.py`
- Used for: generating personalized URL params for each whale

### 3.2 whale_reviews.json (3 whales with review text)
- Path: `~/smartlead/data/whale_reviews.json`
- Structure: keyed by domain, each has `place_id`, `name`, `rating`, `review_count`, `maps_url`, `reviews[]` (each with `text`, `stars`, `author`)
- Contains: Dan Newlin (16,319 reviews), Mike Morse (4,360 reviews), DM Law (from the file)
- Reviews are base64-encoded into the `greviews` URL param for landing page consumption

### 3.3 Reoon Verified Emails
- Email verification via Reoon API
- Only "safe" status emails used (catch_all excluded — bounces destroy sender reputation)
- CRITICAL: Reoon returns lowercase keys — always `.lower().strip()` before matching

### 3.4 SmartProspect Contacts
- Contact enrichment: names, roles, direct emails
- Only "valid" status used (same bounce protection as Reoon)

### 3.5 Brand Colors (Playwright scraping)
- Colors extracted from firm websites using headless Playwright
- Scraped values mapped to `bg`, `accent`, `primary` URL params
- Manual override for top whales where scraping produces poor contrast

---

## 4. Audio Generation — ElevenLabs

### Voice Configuration
| Setting | Value |
|---------|-------|
| Voice | **Matilda** |
| Voice ID | `XrExE9yKIg1WjnnlVkGX` |
| Style | Professional, Knowledgeable |
| Model | `eleven_multilingual_v2` |

### Script Template
The audio script must mention ALL of the following personalization variables:
1. **Review count** — "{firm} has {reviews} Google reviews"
2. **Lead estimate** — "That means roughly {5x}–{10x} leads sitting in your CRM"
3. **AI + SMS reactivation** — "We use AI and personalized SMS to reactivate those dormant leads"
4. **Performance basis** — "It's completely performance-based — no results, no cost"
5. **More 5-star reviews angle** — "Many of these reactivated clients leave new 5-star reviews"
6. **CRM integration** — "We plug into whatever CRM you already use"
7. **Case value calculator** — "We've built a calculator on this page so you can see the potential revenue"

### Example Script (personalized for Dan Newlin)
```
Hi Dan, this is a quick personal message from Peter at LeadsForLawyer.

I noticed Dan Newlin Injury Attorneys has over sixteen thousand Google reviews —
that's incredible. It tells me your firm has likely generated anywhere from
eighty thousand to a hundred sixty thousand leads over the years. Most PI firms
only convert a small fraction. The rest sit dormant in the CRM.

What we do is use AI and personalized SMS to reactivate those old leads — the ones
who called but never signed, intake forms that went cold. We reach out at scale
across Florida and the conversations happen automatically, qualifying interest and
booking consultations with your intake team.

It's completely performance-based. No results, no cost. And here's a bonus — many
of these reactivated clients end up leaving new five-star reviews too.

We plug into whatever CRM you already use — Filevine, SmartAdvocate, Litify, or
even just a CSV export. I've built a case value calculator right on this page so
you can see the potential revenue from your existing database.

Take a look and let me know if you'd like us to run a free test campaign.
```

### Generation
- API: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
- Output: MP3 files saved as `demo-audio-{slug}.mp3` in the landing-page directory
- Referenced via `audio` URL param

---

## 5. Deployment

### Platform: Cloudflare Pages

| Item | Value |
|------|-------|
| Hosting | Cloudflare Pages |
| CLI | `wrangler pages deploy` |
| Domain | `demo.leadsfor.lawyer` (CNAME) |
| Functions | `/functions/api/submit.js` — Cloudflare Pages Function (serverless) |

### Directory Structure
```
landing-page/
  index.html                    — Single-file SPA (HTML + CSS + JS, no build step)
  functions/
    api/
      submit.js                 — Cloudflare Pages Function for form submission
  demo-audio-dan-newlin.mp3     — ElevenLabs audio for Dan Newlin
  demo-audio-mike-morse.mp3     — ElevenLabs audio for Mike Morse
  demo-audio-dm-injury.mp3      — ElevenLabs audio for DM Injury Law
  original-855mikewins.jpg      — Firm logo/screenshot assets
  original-dmlawusa.jpg
  original-newlinlaw.jpg
  sora-demo.mp4                 — Video demos (Sora/Veo3 generated)
  veo3-demo.mp4
```

### Deploy Command
```bash
cd ~/smartlead/landing-page
npx wrangler pages deploy . --project-name=leadsfor-lawyer-demo
```

---

## 6. Form Submission

### Flow: Form → Cloudflare Worker → Telegram + Email

**POST /api/submit** (Cloudflare Pages Function)

1. **Telegram notification** — Instant alert to Peter's Telegram (bot token + chat ID)
   - Message format: "NEW DBR LEAD! Name / Email / Firm / State / Est. Leads / Source URL"
2. **Email to Peter** — via Smartlead API (`server.smartlead.ai/api/v1/send-email/initiate`)
   - From: `peter@fromthelawyers.com` (mailbox ID 693481)
   - To: `peter.lewinski.work@gmail.com`
3. **Auto-reply to firm** — via same Smartlead API
   - Subject: "{name} — your free test campaign request"
   - Body: Thank you + 24-hour follow-up promise + link to leadsfor.lawyer

**Client-side fallback**: If `/api/submit` fails, JS directly calls Telegram API as backup.

**Form data collected**: name, email, firm, state, leads (range), case_value, phone, tcpa_consent, source_url (current page URL with all params)

---

## 7. Key Design Principles

### "Show Don't Tell"
- **TCPA checkbox visible at all times** — demonstrates we understand compliance before the lawyer asks. The annotation "Same TCPA language we deploy on YOUR leads' intake pages" proves we build compliant intake flows.
- **Revenue calculator auto-triggers** — instead of claiming ROI, we let the lawyer see the math instantly with their own numbers.
- **Pre-filled form** — every field already populated proves the level of personalization their leads will receive.

### Pre-Fill Everything
- Name, email, firm, state all pre-filled from URL params
- Lead estimate auto-selected from review count (reviews x 10)
- Case value defaults to $10K (moderate MVA)
- Demonstrates: "If we can personalize this for you, imagine what we do for your leads"

### Arrow Annotations
- Every form field has a gold italic note explaining the parallel to the lead's experience
- Creates a mirror effect: "You're experiencing exactly what your leads will experience"
- Examples: "We pre-fill your leads' names too", "Geo-targeted to their state"

### White Form Card on Branded Hero
- Form rendered as white card (`rgba(255,255,255,0.95)`) on brand-colored hero background
- High contrast ensures readability regardless of brand color
- Professional feel — looks like a real product, not a squeeze page

### Brand Color Isolation
- `bg` param ONLY tints the hero section and banner — rest of page stays default navy
- Prevents readability disasters when firm has unusual brand colors
- Hero gradient uses `adjustBrightness(hex, amount)` for depth

### Reviews as Emotional Proof
- Real reviews from their own Google profile, not generic testimonials
- "Your clients already love you" framing — flattery + reactivation pitch
- Reactivation CTA beneath reviews: "the leads who never left a review" creates urgency

### Revenue Calculator as Value Visualization
- Appears between leads dropdown and phone field — strategic placement
- Conservative estimates (20% respond, 1% convert) build trust
- Three columns: Leads Reached / New Cases / Revenue
- Annotation ties it back to the lead experience: "we build 'what's my case worth?' into the SMS flow"

---

## 8. Extending to Other Niches

To adapt this page for a non-PI niche (e.g., family law, immigration, real estate):

1. **Replace CRM list** — swap PI-specific systems (Filevine, SmartAdvocate) for niche-relevant ones
2. **Update case value tiers** — adjust dollar amounts and labels in the case value dropdown
3. **Change "MVA leads"** — button text and $300/lead upsell section are PI-specific
4. **Update stats** — "30+ PI Firms" → niche equivalent
5. **Adjust social proof** — replace Morgan & Morgan reference
6. **Modify lead estimate formula** — reviews x 5-10 works for high-volume PI; other niches may need different multipliers
7. **Update audio script template** — change niche-specific language
8. **Regenerate data sources** — new Google Places enrichment for target niche
9. **Update How It Works copy** — step descriptions reference PI intake patterns

### What Stays the Same (Niche-Agnostic)
- URL parameter system
- Brand color theming logic
- Revenue calculator mechanics
- TCPA compliance pattern
- Arrow annotation strategy
- Form pre-fill approach
- Telegram + email submission flow
- Cloudflare Pages deployment
- ElevenLabs audio generation pipeline
