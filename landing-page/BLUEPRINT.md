# Whale Personalization Pipeline — Complete Blueprint

> **FINAL VERSION** — Documents the entire end-to-end system for generating hyper-personalized landing pages,
> audio messages, screenshots, and email sequences for 547 whale PI law firms.
> Live at: `demo.leadsfor.lawyer` (Cloudflare Pages, CNAME -> `leadsforlawyer-demo.pages.dev`)

---

## Table of Contents

1. [URL Parameters (16 params)](#1-url-parameters)
2. [Personalization Elements (16 elements)](#2-personalization-elements)
3. [Data Pipeline (5 stages)](#3-data-pipeline)
4. [Audio Generation (GCP TTS)](#4-audio-generation)
5. [Screenshot Generation (Playwright)](#5-screenshot-generation)
6. [Email Sequences (4-step cadence)](#6-email-sequences)
7. [Form Submission & Notifications](#7-form-submission--notifications)
8. [Deployment](#8-deployment)
9. [Quality Controls](#9-quality-controls)
10. [Costs](#10-costs)
11. [File Locations](#11-file-locations)
12. [Design Principles](#12-design-principles)
13. [Extending to Other Niches](#13-extending-to-other-niches)

---

## 1. URL Parameters

Every parameter the page accepts via query string. The `firm` param is the primary trigger -- if absent, the page renders generic.

| # | Parameter   | Type     | Description | Example |
|---|-------------|----------|-------------|---------|
| 1 | `firm`      | string   | Law firm name. Triggers personalized mode (banner, badge, title, form pre-fill, review estimates). **Primary trigger.** | `Dan Newlin Injury Attorneys` |
| 2 | `name`      | string   | Contact person's first+last name. Used in hero title, audio label, form pre-fill. | `Dan Newlin` |
| 3 | `email`     | string   | Contact's email address. Pre-filled in form. | `dan@newlinlaw.com` |
| 4 | `state`     | string   | Firm's state. Used in How It Works step 2, form subtitle, form pre-fill. | `Florida` |
| 5 | `reviews`   | integer  | Google review count. Drives lead estimate (reviews x 5-10), review badge, auto-select of leads dropdown, reviews section visibility (shown when >50). | `16319` |
| 6 | `grating`   | float    | Google star rating. Displayed in review badge, hero-right score card, reviews section. Defaults to `4.9`. | `4.9` |
| 7 | `place_id`  | string   | Google Maps Place ID. Builds canonical Maps URL for all review links. | `ChIJQQqikv5654gRvOE7eqt1hq4` |
| 8 | `maps_url`  | URL      | Direct Google Maps URL. Fallback if `place_id` not provided. If neither, auto-generates from firm name search. | `https://maps.google.com/?cid=...` |
| 9 | `website`   | URL      | Firm's website. Linked from the personalized banner. If absent, link + dash hidden. | `https://newlinlaw.com` |
| 10 | `address`  | string   | Firm's physical address. Appended below the hero badge in small muted text. | `7335 W Sand Lake Rd #300, Orlando, FL` |
| 11 | `bg`       | hex      | Brand background color. Applied as darkened gradient to hero section + brightened gradient on banner only (rest stays default navy). | `#1a3a5c` |
| 12 | `accent`   | hex      | Brand accent color. Overrides `--gold` CSS variable (buttons, badges, borders, labels). | `#c9a84c` |
| 13 | `primary`  | hex      | Brand primary/text color. Overrides `--cream` CSS variable (headings, bright text). | `#ffffff` |
| 14 | `audio`    | URL/path | Path to MP3 audio file. Shows audio player above badge when present. | `audio/newlinlaw.com.mp3` |
| 15 | `greviews` | base64   | Base64-encoded JSON array of review objects (`{text, stars, author}`). Rendered as white cards in hero-right and reviews section. Stars < 4 filtered out. | `W3sidGV4dCI6Ii4uLiIs...` |

### Example Personalized URL

```
https://demo.leadsfor.lawyer/?firm=Dan+Newlin+Injury+Attorneys&name=Dan+Newlin&state=Florida&reviews=16319&grating=4.9&place_id=ChIJQQqikv5654gRvOE7eqt1hq4&website=https://newlinlaw.com&email=dan@newlinlaw.com&bg=%231a3a5c&accent=%23c9a84c&audio=audio/newlinlaw.com.mp3&greviews=W3sidGV4dCI6IkFic29sdXRlbHkgZmFudGFzdGljLi4uIiwic3RhcnMiOjUsImF1dGhvciI6IlJpY2sgU291dGgifV0=
```

### Maps URL Construction Priority

1. If `place_id`: `https://www.google.com/maps/place/?q=place_id:{place_id}`
2. If `maps_url`: use directly
3. Fallback: `https://www.google.com/maps/search/?api=1&query={encodeURIComponent(firm)}`

---

## 2. Personalization Elements

### 2.1 Top Banner
- Gold gradient bar: "This page was prepared specifically for **{firm}** -- [using your brand colors]({website})"
- Firm name link goes to `website` param; if no website, both the link and preceding dash are hidden
- Banner background adapts to brand colors: `adjustBrightness(bg, +40)` to `adjustBrightness(bg, +60)`
- Text color logic: if `getBrightness(bannerBg) > 140` then dark text (`#1a1a2e`), else white
- Adds `personalized` class to `<body>` which adjusts hero top padding to `8rem`

### 2.2 Audio Player
- Position: Hero-left, **above** the badge -- first element visible after banner
- Label: "Personal message for {name || firm}" with headphone emoji
- HTML5 `<audio>` with gold-tinted controls via CSS filter: `sepia(20%) saturate(70%) hue-rotate(15deg)`
- **Lazy loading**: `preload="none"`, `<source>` element gets `src` set from param, `player.load()` called on first play
- Voice: Google Cloud TTS `en-US-Studio-O` (male, professional)
- Duration: ~70-90 seconds per script (~1,250 chars)
- Only visible when `audio` param is present

### 2.3 Hero Badge
- Default: "Database Reactivation for PI Firms"
- Personalized: "Database Reactivation for **{firm}**"
- If `address` param present: appended below in small muted text (0.65rem, 60% opacity)
- Gold line-before pseudo-element (32px horizontal rule)

### 2.4 Hero Title (h1)
- Default: "Your old leads are worth more than *you think*"
- With `name` + `firm`: "{name}, *{firm}* is sitting on a goldmine" (firm name in gold italic `<em>`)
- With `firm` only: "*{firm}* is sitting on a goldmine"
- Font: Playfair Display, 900 weight, clamp(2.8rem, 6vw, 5.5rem), text-shadow for readability

### 2.5 Hero Subtitle with Google Review Badge
- Default: Generic AI + SMS pitch
- With `reviews`: "With [star-badge] {grating} {reviews} reviews, {firm} has likely generated **{estLow}-{estHigh} leads** over the years (sound about right?). Most sit dormant in your CRM. We reactivate them using AI + SMS -- performance basis, no results no cost."
- Review badge: Gold pill (`background: rgba(201,168,76,0.15)`, `border: 1px solid rgba(201,168,76,0.3)`, `border-radius: 8px`) containing "star {rating} {count} reviews", hyperlinked to Google Maps
- Without `reviews` but with `firm`: Firm-specific version mentioning `{firm}` and `{state}`

### 2.6 Lead Estimate Calculation
- Formula: `reviews x 5` (low) to `reviews x 10` (high)
- **Minimum floor**: 10,000 (low) and 20,000 (high) for firms with fewer reviews
- Code: `Math.max(10000, reviews * 5)` / `Math.max(20000, reviews * 10)`
- Displayed in subtitle + "Why This Works" bullet
- Grammar: `(sound about right?)` parenthetical

### 2.7 Hero Right: White Form Card
- Container: `rgba(255,255,255,0.95)`, `border-radius: 16px`, `padding: 2rem`, `box-shadow: 0 8px 40px rgba(0,0,0,0.2)`
- Heading: "See what your old CRM leads are worth" (Playfair Display, 1.4rem, dark text)
- Subheading: "We'll reach out within 24 hours with a free reactivation plan."

#### Form Fields (in order):
1. **Name** (text, required) -- pre-filled from `name` param
2. **Email** (email, required) -- pre-filled from `email` param
3. **Firm Name** (text, required) -- pre-filled from `firm` param
4. **State** (text) + **Old Leads in {firm}'s CRM** (select) -- side by side
   - Leads dropdown label personalized: "Old Leads in **{firm}**'s CRM" (firm name in gold)
   - Options: Under 1,000 / 1,000-5,000 / 5,000-10,000 / 10,000-50,000 / 50,000+ / Not sure
   - Auto-selected based on `reviews x 10`: if <= 20K or < 50K -> "10,000-50,000"; if >= 50K -> "50,000+"
5. **Avg Case Value** (select) -- defaults to $10,000 (moderate MVA), **always visible**
   - Options: ~$2,000 (minor injury) / ~$5,000 (soft tissue) / ~$10,000 (moderate MVA) / ~$25,000 (serious injury) / ~$50,000+ (catastrophic/wrongful death)
6. **Your CRM / Case Management** (select) -- 29 options in 4 optgroups:
   - **PI Case Management** (7): Filevine, SmartAdvocate, Litify, CASEpeer, Needles/Neos, CloudLex, TrialWorks
   - **Legal CRM** (9): Clio, MyCase, PracticePanther, Lawmatics, Law Ruler, Smokeball, CARET Legal, Captorra, SimplyConvert
   - **Lead Intake** (7): Lead Docket, Alert Center, Walker Advertising, LeadByte, eLocal, Best Case Leads, 4LegalLeads
   - **General** (5): HubSpot, Salesforce, Google Sheets, CSV/Spreadsheet, Other/Custom
   - Annotation below: "We connect directly to your system"
7. **Revenue Calculator** (auto-display, gold gradient box) -- shown when leads + case value both selected
   - Three columns: Leads Reached (20-50% respond) / New Cases (1-5% convert) / Revenue (conservative est.)
   - Formula: conservative = leads x 0.2 respond x 0.01 convert; optimistic = leads x 0.5 x 0.05
   - Leads midpoint mapping: under-1000->500, 1000-5000->3000, 5000-10000->7500, 10000-50000->25000, 50000+->75000
   - Annotation: "Your leads want this too -- we build 'what's my case worth?' into the SMS flow"
8. **Mobile Phone** (tel, optional) -- labeled "(optional -- live SMS demo)"
9. **TCPA Checkbox** -- **always visible** (not hidden behind phone entry)
   - Full TCPA consent language with Privacy/Terms links to leadsfor.lawyer
   - Annotation: "Same TCPA language we deploy on YOUR leads' intake pages"
10. **Submit button**: "Reactivate My Old MVA Leads -- Free" (gold background, dark text, uppercase)
11. **Footer note**: "No credit card. No commitment." (0.6rem, gray, centered)

#### Arrow Annotations (gold italic, 0.55rem, appended via JS when personalized):

| Field | Annotation |
|-------|-----------|
| Name | "<- We pre-fill your leads' names too" |
| State | "<- Geo-targeted to their state" |
| Leads | "<- We estimate this from your data" |
| Case Value | "<- Your leads get 'what's my case worth?'" |
| CRM | "<- We connect directly to your system" |
| Phone | "<- SMS demo -- same as what your leads get" |
| TCPA | "Same TCPA language we deploy on YOUR leads' intake pages" |
| Revenue Calc | "Your leads want this too -- we build 'what's my case worth?' into the SMS flow" |

### 2.8 Hero Right: Google Review Cards (below form)
- Rendered in `#heroReviews` div after the hero section
- Google score badge: Large rating number (2.2rem, 700 weight) + gold stars + "{reviews} reviews on Google" -- clickable, links to Maps
- If `greviews` base64 present: individual white cards (`rgba(255,255,255,0.95)`, `border-radius: 14px`, `box-shadow`) with stars, quoted italic text (double quotes stripped), author name
- **Filter: only stars >= 4 displayed** (`reviewData.filter(r => (r.stars || 5) >= 4)`)
- If no `greviews`: teaser card "{N} clients rated {firm} {rating}/5 stars. Imagine reactivating the leads behind those reviews."

### 2.9 Stats Bar
- Three columns:
  - **30+** -- PI Firms Partnered
  - **20-50%** -- Response Rate on Old Leads
  - **$0** -- Upfront Cost
- Gold dividers, navy background, Playfair Display numbers (2.8rem)

### 2.10 "Why This Works" Section
- Headline: "You already paid to acquire these leads"
- Personalized bullet: "{firm} likely has {estLow}-{estHigh} unconverted leads sitting in the CRM"
- Static bullets: 20-50% respond, $5K-$20K first campaign, no new ad spend, everything branded in firm's colors

### 2.11 Client Reviews Section
- Only shown when `reviews > 50`
- Header: "What Your Clients Already Say About {firm}"
- Star display: filled/empty stars based on rating
- Rating link: "{grating}/5 from {reviews} reviews on Google" linked to Maps
- Review cards: white rounded cards (14px radius) with stars, italic quoted text, author name
- Reactivation CTA: "Your clients already love you. Now imagine reactivating the {5x}-{10x} leads who never left a review -- and turning them into signed cases and even *more* 5-star reviews."

### 2.12 CRM Integration Pills
- 27 systems displayed as pill badges with URLs, plus 3 non-linked (Google Sheets, CSV Export, Custom API)
- Full list with URLs:
  - Filevine, SmartAdvocate, Litify, CASEpeer, Needles/Neos, Clio, Lead Docket, CloudLex, MyCase, PracticePanther, Lawmatics, Law Ruler, Captorra, TrialWorks, SimplyConvert, CARET Legal, HubSpot, Salesforce, Smokeball, Alert Center, Walker Advertising, LeadByte, eLocal, Best Case Leads, 4LegalLeads, Google Sheets, CSV Export, Custom API

### 2.13 MVA Leads Upsell Section
- "$300/lead" for firms that also want fresh leads
- Links to `https://leadsfor.lawyer/#intake`
- Mentions "30+ firms including Morgan & Morgan"

### 2.14 Social Proof
- Quote: "The client couldn't believe it. They were watching it all unfold in disbelief -- leads they'd written off years ago, suddenly booking consultations."
- Attribution: "PI Firm Partner, 6-Figure Recovery from Dormant Database"
- Logos bar: Morgan & Morgan | 30+ PI Firms Nationwide | Performance-Based Only

### 2.15 Brand Color Theming (detailed logic)

```
if (bg param provided):
  1. Calculate brightness: (R*299 + G*587 + B*114) / 1000
  2. Darken for hero:
     - brightness > 120: darken by -(brightness - 30)  [aggressive]
     - brightness > 50:  darken by -max(60, brightness * 0.7) [moderate]
     - brightness <= 50: darken by -20 [barely touch]
  3. Hero gradient: linear-gradient(135deg, darkBg, darkerBg(-15))
  4. Banner gradient: adjustBrightness(bg, +40) to adjustBrightness(bg, +60)
  5. Banner text: dark (#1a1a2e) if bannerBrightness > 140, else white
  6. Prevent bg === accent: if same hex, reset accent to default gold (#c9a84c)

if (no bg but firm present):
  Default hero: linear-gradient(135deg, #263b8e, #1a2a6c)  [Dan Newlin blue]

Default color scheme:
  --navy: #0a0e1a
  --gold: #c9a84c
  --gold-light: #e8d48b
  --cream: #f4f0e8

adjustBrightness(hex, amount):
  Clamp each RGB channel: min(255, max(0, channel + amount))
```

### 2.16 Page Title
- Default: "LeadsFor.Lawyer -- Database Reactivation for PI Firms"
- Personalized: "{firm} -- Database Reactivation by LeadsForLawyer"

---

## 3. Data Pipeline

### Stage 1: Domain Identification (Tier 1 Whales)
- Source: `reoon_full_safe_emails.json` -- Reoon-verified safe emails
- Grouping: count emails per business domain (excluding personal email providers)
- Threshold: 5+ verified emails per domain = Tier 1 whale
- Result: **547 whale law firm domains**
- Script: `scripts/enrich_tier1_google_places.py`

### Stage 2: Google Places Enrichment
- API: Google Places API (New) -- `searchText` endpoint
- Endpoint: `https://places.googleapis.com/v1/places:searchText`
- Fields: `id, displayName, formattedAddress, rating, userRatingCount, websiteUri, types, reviews`
- Query pattern: `{domain_name} personal injury lawyer`
- Cost: $0.032 per call
- Output: `data/google_places_tier1.json` -- keyed by domain, each entry has: name, address, rating, review_count, phone, website, place_id, types, maps_url
- Validation: checks for `lawyer` type match

### Stage 3: Top 50 Review Text Extraction
- Top 50 firms by review count get full review text from Google Places API `reviews` field
- Output: `data/whale_top50_reviews.json` -- keyed by domain, each has reviews array with text, stars, author
- These get base64-encoded into the `greviews` URL parameter
- Cost: ~$1.60 (50 additional API calls with reviews field)

### Stage 4: Brand Color Extraction
- Tool: Playwright headless browser (`scripts/scrape_brand_colors.py`)
- Concurrency: 10 simultaneous pages
- Timeout: 5 seconds per page
- Extraction JS queries:
  - CSS custom properties on `:root` (22 common var names checked)
  - Header/nav background colors
  - Link colors (top 50 links sampled, most common color wins)
  - Button background/text colors
- Output: `data/whale_brand_colors.json` -- keyed by domain, each has bg, accent, primary hex values
- Cost: $0 (local Playwright, no API)

### Stage 5: Email Verification
- Reoon bulk API for email verification
- **CRITICAL**: Only "safe" status used -- catch_all emails bounce ~9%, NEVER included
- **CRITICAL**: Reoon returns lowercase keys -- always `.lower().strip()` before matching
- SmartProspect for additional contact discovery (search + fetch endpoints)
- Only "valid" status from SmartProspect used

---

## 4. Audio Generation

### Voice Configuration (Google Cloud TTS)

| Setting | Value |
|---------|-------|
| API | Google Cloud Text-to-Speech |
| Endpoint | `https://texttospeech.googleapis.com/v1/text:synthesize` |
| Voice | `en-US-Studio-O` (male, professional) |
| Language | `en-US` |
| Format | MP3 |
| Cost | ~$0.004 per script (~1,250 chars) |
| Concurrency | 10 simultaneous requests, batches of 50 |
| Total generated | **546 files** (547 minus ~5 pre-existing) |

### Script Template (~1,250 characters, ~70-90 seconds spoken)

```
Hi {contact_name}, this is a personal message from Peter at LeadsForLawyer.

I put together a custom page for {firm_name} -- and I think the numbers will surprise you.

You have {reviews:,} Google reviews at {rating} stars. Your clients clearly love you.
Based on that volume, {firm_name} has likely generated between {est_low} and {est_high}
leads over the years. Most of those are sitting dormant in your CRM right now.

Here's what we do. We plug into whatever system you use -- whether that's Filevine,
SmartAdvocate, Litify, Clio, or even just a spreadsheet -- and we use AI and SMS to
reactivate those old leads.

On this page, you'll see a calculator. Pick your average case value and it shows you
the estimated revenue from reactivation. For a firm your size, the numbers are significant.

And here's the kicker -- when those old leads come back and become signed cases, many of
them leave new five-star reviews. So you're not just getting cases, you're growing your
reputation even further.

We do this on a performance basis. No results, no cost. We'll run your first campaign
completely free. Just fill out the form on this page, or reply to the email, and we'll
have something set up for {firm_name} within 24 hours.

Thanks {contact_name}. Talk soon.
```

### Script Variables
- `{contact_name}`: Extracted from email (first part before `.` or `_`), capitalized. Falls back to "there" if generic (info@, contact@, etc.)
- `{firm_name}`: From Google Places data
- `{reviews}`: Comma-formatted review count
- `{rating}`: Star rating
- `{est_low}`: `max(20000, reviews * 5)` formatted with commas
- `{est_high}`: `max(20000, reviews * 10)` formatted with commas

### Script Must-Mention Checklist
1. Review count and rating
2. Lead estimate range
3. AI + SMS reactivation method
4. Performance basis / no cost
5. Five-star reviews angle (reactivated clients leave new reviews)
6. CRM integration (name specific systems)
7. Case value calculator on the page
8. 24-hour setup promise

### Output
- Files: `landing-page/audio/{domain}.mp3` (e.g., `newlinlaw.com.mp3`)
- Progress tracking: `landing-page/audio/_progress.json` (resumes from last completed batch)
- Referenced via `audio` URL param in landing page URLs

---

## 5. Screenshot Generation

### Configuration (Playwright)

| Setting | Value |
|---------|-------|
| Tool | Playwright (Chromium, headless) |
| Viewport | 1200 x 900 |
| Format | JPEG, quality 80 |
| Concurrency | 5 pages simultaneously |
| Wait strategy | `networkidle` + 2s extra for JS rendering |
| Fallback | `domcontentloaded` + 3s if networkidle times out |
| Timeout | 30s per page (primary), 20s (fallback) |

### Process
1. Load `whale_lead_urls.json` -- pick first lead per unique domain
2. Skip domains that already have screenshots
3. Open personalized URL in headless Chromium
4. Wait for full render (networkidle + 2s)
5. Clip screenshot to 1200x900 viewport
6. Save as `screenshots/{domain}.jpg`

### Output
- Files: `landing-page/screenshots/{domain}.jpg`
- Used in email sequence step C (embedded screenshot preview)
- Cost: $0 (local Playwright)

---

## 6. Email Sequences (4-Step Cadence)

### Proven Best Performer: Partnership Inquiry + Landing Page

| Step | Day | Subject | Content |
|------|-----|---------|---------|
| A | 0 | "{name} -- I built something for {firm}" | Landing page URL + brief pitch |
| B | 2 | RE: thread | Audio link + landing page link + "listen to the 90-second message" |
| C | 5 | RE: thread | Embedded screenshot of their personalized page + all links |
| D | 8 | "dumb idea?" | Pattern interrupt -- short 2 sentences max, creates curiosity |

### Key Sequence Rules
- **delay_in_days** (snake_case, NOT delayInDays) -- Smartlead crashes on wrong format
- **Spintax `{a|b}` CANNOT contain `{{variables}}` inside** -- Smartlead parser crashes
- API-uploaded custom fields use `{{key_name}}` not `{{sl_custom_1}}`
- Best measured result: 1.16% reply rate with partnership inquiry + Morgan & Morgan proof + 4-step cadence
- Smartlead AI marks bounces as "Interested" -- always check for delivery failure keywords in reply text

---

## 7. Form Submission & Notifications

### Flow: Form -> Cloudflare Worker -> Telegram + Email + Auto-Reply

**POST /api/submit** (Cloudflare Pages Function at `functions/api/submit.js`)

1. **Telegram notification** -- Instant alert via bot API
   - Format: "NEW DBR LEAD! Name / Email / Firm / State / Est. Leads / Source URL"
   - Bot token + Chat ID hardcoded in worker

2. **Email to Peter** -- via Smartlead API (`server.smartlead.ai/api/v1/send-email/initiate`)
   - From: `peter@fromthelawyers.com` (mailbox ID 693481)
   - To: `peter.lewinski.work@gmail.com`
   - Subject: "DBR Lead: {firm} ({state})"

3. **Auto-reply to firm** -- via same Smartlead API
   - Subject: "{name} -- your free test campaign request"
   - Body: Thank you + 24-hour follow-up promise + link to leadsfor.lawyer
   - Only sent if email contains `@`

**Client-side fallback**: If `/api/submit` fails, JS opens `mailto:` link with all form data.

**Form data collected**: name, email, firm, state, leads (range), case_value, crm, phone, tcpa_consent, source_url (current page URL with all params)

---

## 8. Deployment

### Platform: Cloudflare Pages

| Item | Value |
|------|-------|
| Hosting | Cloudflare Pages |
| Project | `leadsforlawyer-demo` |
| CLI | `wrangler pages deploy` |
| Domain | `demo.leadsfor.lawyer` |
| CNAME | `demo.leadsfor.lawyer` -> `leadsforlawyer-demo.pages.dev` |
| Functions | `/functions/api/submit.js` (serverless) |

### Deploy Command
```bash
cd ~/smartlead/landing-page
npx wrangler pages deploy . --project-name=leadsfor-lawyer-demo
```

### Directory Structure
```
landing-page/
  index.html                    -- Single-file SPA (HTML + CSS + JS, no build step)
  functions/
    api/
      submit.js                 -- Cloudflare Pages Function for form submission
  audio/
    {domain}.mp3                -- 546 personalized GCP TTS audio files
    _progress.json              -- Generation progress tracker
  screenshots/
    {domain}.jpg                -- Personalized page screenshots (1200x900, JPEG q80)
  demo-audio-dan-newlin.mp3     -- Legacy ElevenLabs demos (3 files)
  demo-audio-mike-morse.mp3
  demo-audio-dm-injury.mp3
  take_screenshots.js           -- Playwright screenshot generator
  whale-sequences-preview.html  -- Email sequence preview tool
```

### All Assets Deploy Together
Audio files, screenshots, and index.html all deploy in one `wrangler pages deploy` -- no separate CDN or storage needed.

---

## 9. Quality Controls

| Control | Implementation |
|---------|---------------|
| Filter reviews < 4 stars | `reviewData.filter(r => (r.stars \|\| 5) >= 4)` |
| Prevent bg === accent | If same hex, reset accent to default gold `#c9a84c` |
| Dark text on light banners | `getBrightness(bannerBg) > 140` -> text color `#1a1a2e` |
| Text shadow on hero | `text-shadow: 0 2px 8px rgba(0,0,0,0.4)` for readability |
| Minimum lead estimate floor | `Math.max(10000, reviews * 5)` / `Math.max(20000, reviews * 10)` |
| Grammar: "1 review" vs "reviews" | Handled in subtitle template |
| Strip double quotes from reviews | `r.text.replace(/^["'"]+\|["'"]+$/g, '')` |
| Validate website before showing | If no `website` param, hide link + preceding dash |
| Hero color isolation | `bg` only tints hero section + banner; rest of page stays default navy |
| Audio lazy loading | `preload="none"`, src set on element, load triggered on play |
| Catch-all email exclusion | Only Reoon "safe" or SmartProspect "valid" -- catch_all ~9% bounce rate |
| Reoon key case sensitivity | Always `.lower().strip()` before matching |
| Smartlead API pagination | Max 100 per request, silently returns 0 above -- always paginate |

---

## 10. Costs

### Per-Campaign Costs (547 Whales)

| Item | Unit Cost | Quantity | Total |
|------|-----------|----------|-------|
| Google Places enrichment | $0.032/call | 547 | ~$17.50 |
| Top 50 reviews + place_ids | $0.032/call | 50 | ~$1.60 |
| GCP TTS audio generation | $0.004/script | 546 | ~$2.18 |
| Brand color scraping (Playwright) | $0 | 547 | $0 |
| Screenshot generation (Playwright) | $0 | 547 | $0 |
| Reoon email verification | varies | -- | ~$2-5 |
| **Total pipeline cost** | | | **~$23-27** |

### Hosting
- Cloudflare Pages: Free tier (unlimited bandwidth, 500 deploys/month)
- Custom domain: existing leadsfor.lawyer DNS

---

## 11. File Locations

### Landing Page
| File | Path |
|------|------|
| Landing page HTML | `~/smartlead/landing-page/index.html` |
| Form submission worker | `~/smartlead/landing-page/functions/api/submit.js` |
| Audio files (546) | `~/smartlead/landing-page/audio/{domain}.mp3` |
| Screenshots | `~/smartlead/landing-page/screenshots/{domain}.jpg` |
| Screenshot script | `~/smartlead/landing-page/take_screenshots.js` |

### Data Files
| File | Path |
|------|------|
| Google Places data (547 whales) | `~/smartlead/data/google_places_tier1.json` |
| Brand colors | `~/smartlead/data/whale_brand_colors.json` |
| Top 50 reviews | `~/smartlead/data/whale_top50_reviews.json` |
| Lead URLs (JSON) | `~/smartlead/data/whale_lead_urls.json` |
| Lead URLs (full CSV) | `~/smartlead/data/whale_lead_urls_full.csv` |
| Whale reviews (3 demos) | `~/smartlead/data/whale_reviews.json` |

### Scripts
| Script | Path |
|--------|------|
| Audio generation (GCP TTS) | `~/smartlead/generate_audio_gcp.py` |
| Brand color scraper | `~/smartlead/scripts/scrape_brand_colors.py` |
| Google Places enrichment | `~/smartlead/scripts/enrich_tier1_google_places.py` |
| Domain enrichment (Playwright) | `~/smartlead/scripts/enrich_domains_playwright.py` |
| Lead deduplication | `~/smartlead/scripts/dedup_leads.py` |
| Prospect pipeline | `~/smartlead/scripts/prospect_pipeline.py` |

---

## 12. Design Principles

### "Show Don't Tell"
- **TCPA checkbox visible at all times** -- demonstrates compliance understanding before the lawyer asks
- **Revenue calculator auto-triggers** -- lets the lawyer see the math with their own numbers
- **Pre-filled form** -- every field already populated proves the personalization level
- **Their own Google reviews** displayed on their page -- not generic testimonials

### The Mirror Effect
Every form field has a gold italic annotation explaining the parallel to the lead's experience:
- "We pre-fill your leads' names too"
- "Geo-targeted to their state"
- "Your leads get 'what's my case worth?'"

The lawyer experiences exactly what their leads will experience.

### White Form Card on Branded Hero
- Form as white card (`rgba(255,255,255,0.95)`) on brand-colored background
- High contrast ensures readability regardless of brand color choice
- Professional feel -- looks like a real product, not a squeeze page

### Brand Color Isolation
- `bg` param ONLY tints the hero section and banner -- rest of page stays default navy
- Prevents readability disasters from unusual brand colors
- Hero gradient uses darkened brand color for depth

### Reviews as Emotional Proof
- Real reviews from their own Google profile
- "Your clients already love you" framing -- flattery + reactivation pitch
- Reactivation CTA: "the leads who never left a review" creates urgency

### Audio as Differentiation
- Personal voice message is the first element above the fold
- ~90 second length is long enough to build credibility, short enough to finish
- Mentions specific details (review count, lead estimate, CRM systems) proving research

---

## 13. Extending to Other Niches

To adapt this system for a non-PI niche (e.g., family law, immigration, real estate, dental):

### Must Change
1. **CRM list** -- swap PI-specific systems (Filevine, SmartAdvocate) for niche-relevant ones
2. **Case value tiers** -- adjust dollar amounts and labels in dropdown
3. **"MVA leads" references** -- button text, upsell section, lead gen pricing
4. **Stats** -- "30+ PI Firms" -> niche equivalent
5. **Social proof** -- replace Morgan & Morgan reference
6. **Lead estimate formula** -- reviews x 5-10 works for high-volume PI; other niches may need different multipliers
7. **Audio script template** -- change niche-specific language (CRM names, case types)
8. **Data sources** -- new Google Places enrichment for target niche
9. **How It Works copy** -- step descriptions reference PI intake patterns
10. **TCPA language** -- verify compliance for niche-specific outreach

### Stays the Same (Niche-Agnostic)
- URL parameter system (all 15 params)
- Brand color theming logic
- Revenue calculator mechanics
- Arrow annotation strategy
- Form pre-fill approach
- Audio generation pipeline (GCP TTS voice + lazy loading)
- Screenshot generation (Playwright)
- Telegram + email submission flow
- Cloudflare Pages deployment
- White form card on branded hero design pattern

---

## Appendix: CSS Variables

```css
:root {
  --navy: #0a0e1a;
  --navy-light: #121832;
  --navy-mid: #1a2240;
  --gold: #c9a84c;          /* overridden by accent param */
  --gold-light: #e8d48b;    /* overridden by adjustBrightness(accent, 40) */
  --gold-dim: rgba(201, 168, 76, 0.15);
  --cream: #f4f0e8;          /* overridden by primary param */
  --cream-dim: rgba(244, 240, 232, 0.7);
  --white: #ffffff;
  --text: #b8bcc8;
  --text-bright: #dde0e8;
}
```

## Appendix: Fonts

- **Playfair Display** -- headings, numbers, prices (serif, 400/700/900, italic)
- **DM Sans** -- body text, labels, form fields (sans-serif, 300/400/500/600)
- Loaded via Google Fonts with `preconnect`
