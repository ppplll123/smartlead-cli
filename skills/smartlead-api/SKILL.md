---
name: smartlead-api
description: Built-in Smartlead API reference. Auto-loads when working with Smartlead CLI, campaigns, leads, prospects, or email outreach. Provides correct API endpoints, params, and known gotchas.
user-invocable: false
---

# Smartlead API Reference

Read the full endpoint reference at: `${CLAUDE_PLUGIN_ROOT}/skills/smartlead-api/references/api-reference.md`

## Quick Reference

### Auth
All endpoints: `?api_key=KEY` as query param. Get key from `smartlead config get api_key`.

### Base URLs
- Campaigns/Leads/Inbox: `https://server.smartlead.ai/api/v1`
- SmartProspect: `https://prospect-api.smartlead.ai/api/v1/search-email-leads`

### Rate Limit
10 requests / 2 seconds per API key. 429 on exceed.

## CRITICAL: SmartProspect API Gotchas

### search-contacts uses STRING filters, NOT numeric IDs

WRONG (returns random junk):
```json
{"subIndustryIds": [26], "countryIds": [233], "levelIds": [1,2]}
```

CORRECT:
```json
{
  "companySubIndustry": ["Law Practice"],
  "country": ["United States"],
  "level": ["C-Level", "VP-Level"],
  "title": ["attorney", "partner", "owner"],
  "companyKeyword": ["personal injury"]
}
```

### find-emails batch limit
- Max 10 per request per docs, but **5 is the reliable max** — 10 causes 504 timeouts.
- Format: `{"contacts": [{"firstName": "...", "lastName": "...", "companyDomain": "..."}]}`

### fetch-contacts needs filter_id
1. First call search-contacts to get `filter_id` from response
2. Then call fetch-contacts with that `filter_id` and `limit`

### Smartlead Template Variables
- Standard: `{{first_name}}`, `{{last_name}}`, `{{company_name}}`, `{{phone_number}}`, `{{email}}`, `{{website}}`, `{{location}}`
- Time: `{{sl_time_of_day}}`, `{{sl_time_of_day_cap}}`, `{{sl_day_of_week}}`
- Date: `{{sl_date "2 days from now" "dddd, MMMM Do YYYY"}}`
- Last touch: `{{sl_date sl_last_touch "Do MMM"}}`
- Sender: `%sender-firstname%`, `%sender-name%`, `%sender-domain%`, `%signature%`
- Custom fields uploaded via API map to the key name: `{{state}}` not `{{sl_custom_1}}`
- Spintax: `{option1|option2|option3}` — do NOT nest `{{variables}}` inside spintax `{}`

### Campaign Status Values
- Set: `START`, `PAUSED`, `STOPPED` (STOPPED is irreversible)
- Response shows: `ACTIVE`, `PAUSED`, `STOPPED`, `COMPLETED`, `DRAFTED`

### Leads CLI Pagination
- `--limit` caps at 100. Use `--offset` for pagination or `--all` flag (may be unreliable).
- Safer: paginate manually with `--limit 100 --offset N`.

## Sending Replies in Campaign Threads

### POST /campaigns/{campaign_id}/reply-email-thread
Reply to a lead's existing email thread (continues conversation).
```bash
curl -X POST "https://server.smartlead.ai/api/v1/campaigns/118335/reply-email-thread?api_key=KEY" \
  -H "Content-Type: application/json" \
  -d '{"email_stats_id": "STATS_ID", "email_body": "<div>Your reply HTML</div>"}'
```
- `email_stats_id`: Get from lead's message history (any message's `stats_id` field)
- Does NOT take `lead_id` in body — only `email_stats_id` + `email_body`

### POST /send-email/initiate (Single transactional email)
```bash
curl -X POST "https://server.smartlead.ai/api/v1/send-email/initiate?api_key=KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "email@example.com", "subject": "...", "body": "<div>...</div>", "fromEmailId": 57180}'
```
- Needs `fromEmailId` (mailbox ID, not email address)
- May be restricted to internal/verified recipients on some plans (403 for external)

## CRITICAL: SmartProspect Fetching Strategy

### Rate Limits
- SmartProspect has aggressive rate limits (~10 req/min on prospect endpoints)
- 429 errors come FAST if you do many search+fetch cycles
- DO NOT launch multiple parallel agents hitting SmartProspect — they'll all get throttled

### Fetching returns results in fixed order
- `fetch-contacts` with a `filter_id` returns results from a scroll cursor
- Once you've fetched contacts from a filter, fetching again returns the NEXT batch (not the same)
- If all good contacts are consumed, subsequent fetches return "no valid emails found"
- To get MORE leads, change the search keywords/filters to get a NEW filter_id

### Correct approach for 500+ leads
1. ONE search with `limit: 500` → get `filter_id`
2. Fetch in batches of 50 from that filter_id (each fetch returns next 50)
3. Wait 2-3 seconds between fetches
4. If results dry up, do a NEW search with DIFFERENT keywords
5. Never launch multiple agents hitting the same API simultaneously

### Keyword rotation for fresh results
Each keyword combo returns a different pool. Rotate through:
- Round 1: `["motor vehicle accident", "car accident"]`
- Round 2: `["truck accident", "motorcycle accident"]`
- Round 3: `["wrongful death", "catastrophic injury"]`
- Round 4: `["slip and fall", "premises liability"]`
- Round 5: `["trial attorney"]` with title filter

### `dontDisplayOwnedContact: true`
This filter EXCLUDES contacts you already fetched. Useful to avoid dupes but means you can't re-fetch the same results.

### Daily fetch exhaustion
After ~200-300 fetches in a day, SmartProspect starts returning empty results even with different keywords and available credits. This appears to be a hidden daily limit or verification pool cooldown. If fetches return 0 contacts despite thousands matching in search, STOP and wait 24 hours. Don't waste API calls.

### Practical daily budget
- ~200-300 new verified contacts per day is the realistic maximum
- Plan multi-day sourcing for 500+ leads
- Spread across different sessions, not one marathon

## CRITICAL: Cloudflare Blocks Python urllib

Smartlead's API is behind Cloudflare. **Python `urllib` gets error 1010** (bot detection).
- ALWAYS use `subprocess.run(['curl', ...])` or `requests` with a real User-Agent
- `curl` works natively — Cloudflare trusts it
- If using urllib: add `req.add_header("User-Agent", "Mozilla/5.0")` — but curl is safer

## Reoon API Gotcha

Reoon returns **lowercase email keys**. Always `.lower().strip()` before matching results.

## Campaign Sequence Gotchas

### Delay field naming
The delay field in sequence objects is `delay_in_days` (snake_case), NOT `delayInDays` (camelCase).
```json
{"seq_delay_details": {"delay_in_days": 2}}
```

### Template variable for custom fields uploaded via API
- Custom fields uploaded via API map to the KEY NAME: `{{state}}` works if you uploaded `custom_fields: {"state": "Texas"}`
- `{{sl_custom_1}}` is BROKEN for API-uploaded custom fields — it only works for fields added via the Smartlead dashboard UI
- `{{location}}` works reliably (it's a standard field)
- When in doubt, use standard fields (`{{location}}`, `{{company_name}}`) over custom fields

### Spintax + variables crash
Spintax `{option1|option2}` CANNOT contain `{{variables}}` inside. Smartlead's parser crashes.
- WRONG: `{Hi {{first_name}}|Hello {{first_name}}}`
- RIGHT: `{Hi|Hello} {{first_name}}`

### Lead upload limits
- Max **400 leads per POST** request to `/campaigns/{id}/leads`
- Max 200 custom_fields key-value pairs per lead
- Batch larger uploads into 400-lead chunks

## Bounce Miscategorization — CHECK MANUALLY

Smartlead's AI categorizer marks bounce/delivery-failure messages as "Interested" because they contain text. When checking inbox:
1. Look for keywords: "delivery", "undeliverable", "failed", "bounce", "returned", "550", "mailbox full"
2. If a "reply" contains delivery failure language, re-categorize via API:
   ```bash
   smartlead inbox update-category --lead-id LID --category-id 0
   ```
3. Category 0 = uncategorized (or use a custom bounce category if available)
4. This prevents false positive "interested" counts in your dashboard

## Email Verification — NEVER SKIP
Always verify emails before uploading to campaigns. Unverified emails bounce and destroy sender reputation.
Options:
1. SmartProspect fetch-contacts (pre-verified, costs credits)
2. SmartProspect find-emails (pre-verified, costs credits)
3. Reoon Bulk API (external, key: check env)
4. Derived `info@domain` emails have **0% safe rate** — never use without verification
