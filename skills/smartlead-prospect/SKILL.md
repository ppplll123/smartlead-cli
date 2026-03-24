---
name: smartlead-prospect
description: Search SmartProspect for leads by industry, title, keyword, then fetch verified emails and add to a Smartlead campaign. Use when user says "find prospects", "search for leads", "add leads from SmartProspect", "prospect search", or wants to source new contacts for outreach.
argument-hint: "[auto|interactive] [industry] [keywords...]"
allowed-tools: ["Bash", "Read", "Write", "Edit", "Glob", "Grep"]
---

# SmartProspect Lead Sourcing

Source verified leads from SmartProspect's 300M+ database, deduplicate against existing campaigns, and add to a Smartlead campaign.

## Mode

If user says "auto" or doesn't specify → run fully automated.
If user says "interactive" → show search results, ask which to fetch, confirm before adding.

## Prerequisites

1. Get API key: `smartlead config get api_key` or `$SMARTLEAD_API_KEY`
2. Check credits: call search-analytics endpoint
3. If no credits, tell user and stop

## Step 1: Search

POST to `https://prospect-api.smartlead.ai/api/v1/search-email-leads/search-contacts?api_key=KEY`

CRITICAL: Use **string-based filters**, not numeric IDs:
```json
{
  "limit": 500,
  "companySubIndustry": ["Law Practice"],
  "country": ["United States"],
  "title": ["attorney", "partner", "owner"],
  "companyKeyword": ["personal injury", "accident"]
}
```

Available filter fields (all string arrays):
- `companySubIndustry` — use exact names from sub-industries endpoint
- `country`, `state`, `city` — geographic filters
- `title`, `excludeTitle` — job title include/exclude
- `companyKeyword` — matches against company description
- `companyName`, `companyDomain`, `includeCompany`, `excludeCompany`
- `level` — "C-Level", "VP-Level", "Director-Level", "Manager-Level", "Staff"
- `department` — "Sales", "Marketing", "Finance & Administration", etc.
- `companyHeadCount`, `companyRevenue`
- `dontDisplayOwnedContact` — boolean, exclude already-fetched contacts

Save `filter_id` and `total_count` from response.

If interactive: show first 10 results, ask user to confirm or adjust filters.

## Step 2: Fetch (costs credits)

POST to `https://prospect-api.smartlead.ai/api/v1/search-email-leads/fetch-contacts?api_key=KEY`
```json
{"filter_id": FILTER_ID, "limit": 500}
```

Returns contacts with real emails and `verificationStatus` ("valid", "catch_all", etc).

If interactive: show fetched count, verification breakdown, ask to proceed.

## Step 3: Filter & Deduplicate

1. Keep only `verificationStatus: "valid"` (optionally include catch_all if user requests)
2. Load existing emails from all campaigns:
   ```bash
   # Paginate through campaigns to collect all emails
   for each campaign: smartlead leads list --campaign-id ID --limit 100 --offset N
   ```
3. Remove duplicates

## Step 4: Format & Upload

Format leads for Smartlead:
```json
{
  "lead_list": [
    {
      "email": "...",
      "first_name": "...",
      "last_name": "...",
      "company_name": "FIRM NAME from company.name",
      "website": "from company.website",
      "location": "City, State",
      "custom_fields": {"state": "State"}
    }
  ],
  "settings": {
    "ignore_global_block_list": false,
    "ignore_unsubscribe_list": false,
    "ignore_duplicate_leads_in_other_campaign": false
  }
}
```

Save to file, then: `smartlead leads add --campaign-id ID --from-json FILE`

If interactive: ask which campaign to add to (list campaigns) or create new one.

## Step 5: Report

Print summary: searched, fetched, verified, deduped, uploaded, credits used, credits remaining.

## Cost Estimation

Always estimate before running:
- Search: free (no credits)
- Fetch: ~1 credit per contact
- Present estimate to user before fetching

## Rate Limit Strategy — READ THIS

**NEVER launch multiple parallel agents hitting SmartProspect.** One agent at a time.

Correct approach for 500+ leads:
1. ONE search → get filter_id
2. Fetch 50 at a time from that filter_id, 3-second pause between fetches
3. Use `curl` subprocess (not urllib — Cloudflare blocks it with 1010)
4. When results dry up from one filter, do a NEW search with DIFFERENT keywords
5. Rotate keywords: `["car accident"]` → `["truck accident"]` → `["wrongful death"]` → etc.
6. Budget ~10 API calls per minute max to avoid 429

**Key gotcha:** fetch-contacts returns results sequentially. Once good contacts are consumed from a filter, you get empties. Change keywords for fresh results.

## Proven Strategy: 500+ Leads in One Session

Tested and confirmed on Mar 23, 2026 — got **521 verified PI/MVA leads** in ~28 min.

### What worked
- **90 search+fetch cycles** across 4 keyword rounds
- Each fetch returns ~10 real contacts (search shows 100 but with masked emails until fetched)
- Rotating keywords + state combos to get different pools each time:
  - Round 1 (50 searches): `["car accident", "auto accident", "motor vehicle accident"]` × states
  - Round 2 (50 searches): `["personal injury", "accident lawyer", "injury attorney"]` × states
  - Round 3 (30 searches): `["trial lawyer", "wrongful death", "truck accident"]` × states
  - Round 4 (10 searches): `["motorcycle", "DUI", "pedestrian accident"]` × states
- Total credits used: ~1,425 for 521 verified leads ($0)
- Quality spot-checked 6 firm websites via Firecrawl — all confirmed PI/MVA

### What didn't work
- Fetching 50+ from one filter_id — returns empties after ~10 real contacts
- Running multiple parallel agents — rate limits kick in fast (429)
- `dontDisplayOwnedContact: true` — useful for dedup but can cause 0 results if pool exhausted
- Python urllib — blocked by Cloudflare (error 1010), always use curl subprocess

### Daily cap
~200-500 verified contacts per day depending on how aggressively you rotate keywords.
After heavy usage, fetch returns empties even with credits available. Wait 24h.

### Upload results
521 fetched → 518 uploaded (3 blocked by global blocklist, 0 invalid, 0 bounced).
SmartProspect pre-verification means near-zero rejection at upload time.

## Alternative Sourcing Approaches — Cost Comparison

Six approaches tested for PI law firm lead sourcing (Mar 2026):

| Approach | Cost / 500 leads | Speed | Verification | Quality |
|----------|-----------------|-------|-------------|---------|
| **A: Firecrawl+Justia+Playwright+Reoon** | ~$0.42 | 30-45 min | Reoon | Enriched 34% safe |
| **B: Google Places+SmartProspect find-emails** | $0 | 5-10 min | SmartProspect | Pre-verified |
| **C: Apify Google Maps** | ~$24.50 | 10-15 min | Reoon | Enriched 34% safe |
| **D: Apify Justia Scraper** | ~$14 | 10-15 min | Reoon | Untested |
| **E: SmartProspect Search+Fetch** | $0 (credits) | 2-5 min | SmartProspect | Best quality |
| **F: Firecrawl+Justia+SmartProspect** | ~$0.07 | 10-15 min | SmartProspect | Hybrid, untested |

### Recommendation
1. **Best overall:** Approach E (SmartProspect native) — $0, pre-verified, fastest
2. **Best when credits exhausted:** Approach A (Firecrawl+Justia+Playwright+Reoon) — cheapest paid option
3. **Avoid:** Approach C (Apify Google Maps) — 50x more expensive than A for similar quality

### Key yield numbers from real campaigns
- Approach A: 2,494 lawyers → 961 emails → 699 after dedup → 362 verified (14.5% yield)
- Approach C: 600 firms → 245 enriched emails → 133 after Reoon (22% yield but $24.50)
- Approach E: 521 verified in 28 min, 518 uploaded (99.4% upload rate)

## Playwright Local Email Extraction

Free email extraction from law firm websites using Playwright (no API costs).

### Script: `/Users/openclaw/smartlead/scripts/extract_emails_playwright.py`

Key settings:
- `CONCURRENCY = 5` parallel browser contexts
- `TIMEOUT_MS = 10000` (10s per page)
- Scrapes homepage + /contact + /contact-us + /about pages
- Filters junk domains: sentry.io, wixpress.com, googleapis.com, etc.
- Email regex with 60-char max and domain dot-depth limit

### Performance
- ~2,000 sites in ~30 minutes
- ~34% of sites yield a valid email
- Cost: $0 (local Playwright)
- Requires Reoon verification afterward (enriched emails = 34.6% safe rate)

## Prospect Pipeline Script

Full end-to-end pipeline: `/Users/openclaw/smartlead/scripts/prospect_pipeline.py`

Usage modes:
```bash
python3 prospect_pipeline.py --scrape          # Full: Apify scrape → verify → push
python3 prospect_pipeline.py --verify-only     # Skip scrape, verify extracted leads
python3 prospect_pipeline.py --push-only       # Push already-verified leads
```

Options: `--max-places N`, `--locations N`, `--campaign-id N`

## Tool Installation Status

| Tool | Status | Notes |
|------|--------|-------|
| Smartlead CLI | `npm install -g @smartlead/cli` | Configured with API key |
| Playwright | Installed locally | Free, unlimited website scraping |
| Firecrawl CLI | Installed | ~754 credits remaining (pay-as-you-go) |
| gcloud | Installed | OAuth needed per Google account |
| Nimble | Installed | Needs API key activation |
| Reoon | API key active | 18,532 credits (as of Mar 2026) |
| Apify | Token in .env | Pay-per-use |
| Google Places API | Working | Free within $200/mo credit, NO emails |
