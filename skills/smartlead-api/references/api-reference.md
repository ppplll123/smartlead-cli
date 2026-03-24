# Smartlead API Reference (Compact)

Base URL: `https://server.smartlead.ai/api/v1`
Prospect API: `https://prospect-api.smartlead.ai/api/v1`
Auth: `?api_key=YOUR_API_KEY` (query param on all requests)
Rate Limit: 10 requests / 2 seconds per API key (429 on exceed)

---

## CAMPAIGNS

### GET /campaigns/
Params: api_key (string, required), client_id (number, optional), include_tags (boolean, optional, default false)
Returns: Array of campaign objects (id, name, status, schedule, tracking, sending limits)
```bash
curl "https://server.smartlead.ai/api/v1/campaigns/?api_key=KEY&include_tags=true"
```

### GET /campaigns/{campaign_id}
Params: api_key (string, required), include_tags (boolean, optional)
Path: campaign_id (number, required)
```bash
curl "https://server.smartlead.ai/api/v1/campaigns/123?api_key=KEY"
```

### POST /campaigns/create
Params: api_key (string, required)
Body: { name: string (optional, default "Untitled Campaign"), client_id: number (optional) }
Returns: { ok: true, id: number, name: string, created_at: string }
```bash
curl -X POST "https://server.smartlead.ai/api/v1/campaigns/create?api_key=KEY" -H "Content-Type: application/json" -d '{"name":"My Campaign"}'
```

### POST /campaigns/{campaign_id}/status
Path: campaign_id (number, required)
Body: { status: string } -- Values: "START", "PAUSED", "STOPPED" (STOPPED is irreversible)
Note: Use START not ACTIVE. Response may show ACTIVE.
```bash
curl -X POST "https://server.smartlead.ai/api/v1/campaigns/123/status?api_key=KEY" -H "Content-Type: application/json" -d '{"status":"START"}'
```

### POST /campaigns/{campaign_id}/sequences
Path: campaign_id (number, required)
Body: { sequences: [{ id: number|null, seq_number: number, subject: string (optional), email_body: string (HTML+{{variables}}), seq_delay_details: { delay_in_days: number } }] }
Note: Cannot modify while campaign is ACTIVE -- pause first.
CRITICAL: delay field is `delay_in_days` (snake_case), NOT `delayInDays` (camelCase).
```bash
curl -X POST "https://server.smartlead.ai/api/v1/campaigns/123/sequences?api_key=KEY" -H "Content-Type: application/json" -d '{"sequences":[{"id":null,"seq_number":1,"subject":"Hi {{first_name}}","email_body":"<p>Hello</p>","seq_delay_details":{"delay_in_days":0}}]}'
```

### GET /campaigns/{campaign_id}/sequences
Path: campaign_id (number, required)
Returns: Sequence data with variants

### POST /campaigns/{campaign_id}/schedule
Path: campaign_id (number, required)
Body: { schedule: { timezone: string (IANA), days: number[] (0=Sun..6=Sat), start_hour: string ("09:00"), end_hour: string ("17:00"), min_time_btw_emails: number (minutes) } }
```bash
curl -X POST "https://server.smartlead.ai/api/v1/campaigns/123/schedule?api_key=KEY" -H "Content-Type: application/json" -d '{"schedule":{"timezone":"America/New_York","days":[1,2,3,4,5],"start_hour":"09:00","end_hour":"17:00","min_time_btw_emails":120}}'
```

### POST /campaigns/{campaign_id}/settings
Path: campaign_id (number, required)
Body: { track_settings: { track_open: bool, track_click: bool }, sending_limit: number, min_time_btwn_emails: number, stop_lead_settings: string ("REPLY_TO_AN_EMAIL"|"OPENED_EMAIL"|"CLICKED_LINK"), enable_ai_esp_matching: bool, send_as_plain_text: bool }
```bash
curl -X POST "https://server.smartlead.ai/api/v1/campaigns/123/settings?api_key=KEY" -H "Content-Type: application/json" -d '{"track_settings":{"track_open":true,"track_click":true},"sending_limit":50}'
```

### DELETE /campaigns/{campaign_id}
Path: campaign_id (number, required)
WARNING: Permanently deletes campaign + all sequences, leads, stats, webhooks, email history. Use ARCHIVED status instead to preserve data.
```bash
curl -X DELETE "https://server.smartlead.ai/api/v1/campaigns/123?api_key=KEY"
```

### GET /campaigns/{campaign_id}/email-accounts
Path: campaign_id (number, required)
Returns: Email accounts assigned to campaign

### POST /campaigns/{campaign_id}/email-accounts
Path: campaign_id (number, required)
Body: Email account IDs to add

### DELETE /campaigns/{campaign_id}/email-accounts
Path: campaign_id (number, required)
Body: Email account IDs to remove

### GET /campaigns/{campaign_id}/statistics
Path: campaign_id (number, required)
Params: offset (number, default 0), limit (number, default 100, max 1000), email_sequence_number (number, 1-20), email_status (string: opened|clicked|replied|unsubscribed|bounced), sent_time_start_date (ISO string), sent_time_end_date (ISO string)
```bash
curl "https://server.smartlead.ai/api/v1/campaigns/123/statistics?api_key=KEY&limit=100&email_status=replied"
```

### GET /campaigns/{campaign_id}/analytics-by-date
Path: campaign_id (number, required)
Returns: Analytics broken down by date range

### GET /campaigns/{campaign_id}/analytics
Path: campaign_id (number, required)
Returns: Top-level campaign analytics

---

## LEADS

### POST /campaigns/{campaign_id}/leads
Path: campaign_id (number, required)
Body: { lead_list: [{ email: string (required), first_name: string, last_name: string, phone_number: string, company_name: string, website: string, location: string, linkedin_profile: string, company_url: string, custom_fields: object (max 200 k/v pairs) }], settings: { ignore_global_block_list: bool, ignore_unsubscribe_list: bool, ignore_duplicate_leads_in_other_campaign: bool, ignore_community_bounce_list: bool } }
Max: 400 leads per request
Returns: { added_count, skipped_count, skipped_leads[] }
```bash
curl -X POST "https://server.smartlead.ai/api/v1/campaigns/123/leads?api_key=KEY" -H "Content-Type: application/json" -d '{"lead_list":[{"email":"john@example.com","first_name":"John","company_name":"Acme"}]}'
```

### GET /campaigns/{campaign_id}/leads
Path: campaign_id (number, required)
Params: offset, limit (pagination)

### GET /leads/
Params: email (string) -- Fetch lead by email address
```bash
curl "https://server.smartlead.ai/api/v1/leads/?api_key=KEY&email=john@example.com"
```

### GET /leads/{lead_id}/campaigns
Returns: All campaigns containing this lead

### GET /leads/fetch-categories
Returns: Available lead categories

### POST /campaigns/{campaign_id}/leads/{lead_id}
Update individual lead fields

### POST /campaigns/{campaign_id}/leads/{lead_id}/pause
Pause sending to this lead

### POST /campaigns/{campaign_id}/leads/{lead_id}/resume
Resume sending to this lead

### DELETE /campaigns/{campaign_id}/leads/{lead_id}
Delete lead from campaign

### POST /campaigns/{campaign_id}/leads/{lead_id}/unsubscribe
Unsubscribe lead from specific campaign

### POST /leads/{lead_id}/unsubscribe
Global unsubscribe across all campaigns

### POST /leads/add-domain-block-list
Add domain(s) to block list

### GET /campaigns/{campaign_id}/leads/{lead_id}/message-history
Fetch full message history for a lead in a campaign

### POST /campaigns/{campaign_id}/reply-email-thread
Reply to a lead's email thread.
**CRITICAL:** Body takes `email_stats_id` (from message history), NOT `lead_id`.
```bash
curl -X POST "https://server.smartlead.ai/api/v1/campaigns/123/reply-email-thread?api_key=KEY" -H "Content-Type: application/json" -d '{"email_stats_id":"STATS_ID","email_body":"<div>Reply HTML</div>"}'
```
Get `email_stats_id` from any message in the lead's history (`stats_id` field).

### POST /send-email/initiate
Send a single transactional email (not part of a campaign sequence).
Body: { to: string, subject: string, body: string (HTML), fromEmailId: number (mailbox ID, not email address) }
Note: May return 403 for external recipients on some plans. Use campaign sequences for cold outreach instead.
```bash
curl -X POST "https://server.smartlead.ai/api/v1/send-email/initiate?api_key=KEY" -H "Content-Type: application/json" -d '{"to":"email@example.com","subject":"Subject","body":"<div>Body</div>","fromEmailId":57180}'
```

### GET /campaigns/{campaign_id}/leads-export
Export campaign leads to CSV

---

## EMAIL ACCOUNTS

### GET /email-accounts/
Params: api_key (required), offset (number, default 0), limit (number, default 100, max 100), isInUse (string: true|false), emailWarmupStatus (string: ACTIVE|INACTIVE), isSmtpSuccess (string: true|false), isWarmupBlocked (string: true|false), esp (string: GMAIL|OUTLOOK|SMTP), username (string, partial match), client_id (number)
```bash
curl "https://server.smartlead.ai/api/v1/email-accounts/?api_key=KEY&limit=50&emailWarmupStatus=ACTIVE"
```

### GET /email-accounts/{email_account_id}/
Path: email_account_id (number, required)
Params: fetch_campaigns (boolean, optional, default false)
Returns: Full account config, SMTP/IMAP details, warmup stats, optionally campaign_ids
```bash
curl "https://server.smartlead.ai/api/v1/email-accounts/123/?api_key=KEY&fetch_campaigns=true"
```

### POST /email-accounts/save
Body (required): { from_name: string, from_email: string, user_name: string, password: string, smtp_host: string, smtp_port: number (587/465/25), imap_host: string, imap_port: number (993/143), warmup_enabled: boolean }
Body (optional): type, token (OAuth), max_email_per_day, signature, total_warmup_per_day, daily_rampup, reply_rate_percentage
```bash
curl -X POST "https://server.smartlead.ai/api/v1/email-accounts/save?api_key=KEY" -H "Content-Type: application/json" -d '{"from_name":"John","from_email":"john@example.com","user_name":"john@example.com","password":"app_pass","smtp_host":"smtp.gmail.com","smtp_port":587,"imap_host":"imap.gmail.com","imap_port":993,"warmup_enabled":true}'
```

### POST /email-accounts/{email_account_id}
Path: email_account_id (number, required)
Body (all optional): { max_email_per_day: number, from_name: string, custom_tracking_url: string, bcc: string, signature: string (HTML), client_id: number, time_to_wait_in_mins: number, is_suspended: boolean }
```bash
curl -X POST "https://server.smartlead.ai/api/v1/email-accounts/123?api_key=KEY" -H "Content-Type: application/json" -d '{"max_email_per_day":60}'
```

### POST /email-accounts/{email_account_id}/warmup
Configure warmup settings (daily volume, ramp-up rate)

### GET /email-accounts/{email_account_id}/warmup-stats
Returns: Last 7 days warmup statistics

---

## ANALYTICS (Global)

### GET /analytics/overview
Returns: Global analytics across all campaigns (sent, opened, clicked, replied, bounced, unsubscribed counts)
```bash
curl "https://server.smartlead.ai/api/v1/analytics/overview?api_key=KEY"
```

---

## SMART PROSPECT (Lead Finder)

Base URL: `https://prospect-api.smartlead.ai/api/v1`

### POST /search-email-leads/search-contacts
Search the SmartProspect database for contacts matching filters.
Params: api_key (string, required)
Body: {
  limit: number (1-500, required),
  name: string[], firstName: string[], lastName: string[],
  title: string[], excludeTitle: string[], includeTitle: string[],
  department: string[], level: string[],
  companyName: string[], companyDomain: string[], companyKeyword: string[],
  companyHeadCount: string[], companyRevenue: string[],
  companyIndustry: string[], companySubIndustry: string[],
  city: string[], state: string[], country: string[],
  scroll_id: string (pagination token),
  dontDisplayOwnedContact: boolean,
  titleExactMatch: boolean, companyExactMatch: boolean, companyDomainExactMatch: boolean
}
All array fields: max 2000 items. Uses STRING filter names, not numeric IDs.
Key filters: companySubIndustry, country, title, companyKeyword
```bash
curl -X POST "https://prospect-api.smartlead.ai/api/v1/search-email-leads/search-contacts?api_key=KEY" -H "Content-Type: application/json" -d '{"limit":10,"title":["VP Sales"],"country":["United States"],"companySubIndustry":["Financial Technology"]}'
```

### POST /search-email-leads/fetch-contacts
Fetch full contact details using a filter_id from search-contacts.
Body: { filter_id: number (required), id: string[] (optional, specific contact IDs), limit: number (1-10000, optional), visual_limit: number (1-1000, default 10, page size), visual_offset: number (>=0, default 0) }
Either id or limit must be provided with filter_id.
```bash
curl -X POST "https://prospect-api.smartlead.ai/api/v1/search-email-leads/fetch-contacts?api_key=KEY" -H "Content-Type: application/json" -d '{"filter_id":327105,"limit":10,"visual_limit":10,"visual_offset":0}'
```

### POST /search-email-leads/search-contacts/find-emails
Find verified email addresses for contacts.
Body: { contacts: [{ firstName: string (required), lastName: string (required), companyDomain: string (required) }] }
Max array size: 10 (docs say 10, but 5 works reliably; 10 may timeout)
Returns: Found/not-found status with verification details. Uses 1 credit per found email.
```bash
curl -X POST "https://prospect-api.smartlead.ai/api/v1/search-email-leads/search-contacts/find-emails?api_key=KEY" -H "Content-Type: application/json" -d '{"contacts":[{"firstName":"John","lastName":"Doe","companyDomain":"example.com"}]}'
```

---

## IMPORTANT NOTES

### SmartProspect Gotchas
- search-contacts uses STRING filter names (e.g. "Financial Technology"), NOT numeric IDs
- companySubIndustry, country, title, companyKeyword are the most useful filters
- fetch-contacts requires filter_id returned from search-contacts
- find-emails: docs say max 10 contacts, but batch of 5 works reliably; 10 often times out
- find-emails costs credits per found email

### Campaign Status Values
- DRAFTED, ACTIVE, PAUSED, STOPPED, ARCHIVED
- Use "START" in POST body to activate (not "ACTIVE")
- STOPPED is irreversible

### Rate Limiting
- 10 requests per 2 seconds per API key
- 429 Too Many Requests on exceed

### Lead Import Limits
- Max 400 leads per POST /campaigns/{id}/leads request
- Max 200 custom_fields key-value pairs per lead

### Sequence Variables
- {{first_name}}, {{last_name}}, {{email}}, {{company_name}}, {{phone_number}}, {{location}}, {{website}}, {{linkedin_profile}}, {{company_url}}
- Time: {{sl_time_of_day}}, {{sl_time_of_day_cap}}, {{sl_day_of_week}}
- Date: {{sl_date "2 days from now" "dddd, MMMM Do YYYY"}}
- Sender: %sender-firstname%, %sender-name%, %sender-domain%, %signature%
- Custom fields uploaded via API: use the key name directly, e.g. {{state}} NOT {{sl_custom_1}}
- {{sl_custom_1}} is BROKEN for API-uploaded custom fields — only works for dashboard-added fields
- Spintax: {option1|option2} — CANNOT contain {{variables}} inside (parser crashes)
