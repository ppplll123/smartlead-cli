---
name: smartlead-status
description: Show Smartlead campaign dashboard with send/open/reply/bounce stats. Use when user says "campaign status", "how are campaigns doing", "check smartlead", "sending stats", or "outreach performance".
argument-hint: "[campaign-id]"
allowed-tools: ["Bash", "Read"]
---

# Smartlead Campaign Dashboard

Show a quick overview of all active campaigns or deep-dive into one.

## If no argument: show all campaigns

```bash
smartlead campaigns list --format json
```

For each campaign, get stats:
```bash
smartlead stats campaign --id CAMPAIGN_ID --format json
```

Present as a table:
```
| ID | Name | Status | Leads | Sent | Opens (%) | Replies (%) | Bounces (%) |
```

Include `campaign_lead_stats`: total, inprogress, completed, notStarted, interested.

## If campaign ID provided: deep dive

Show:
1. Campaign info (name, status, schedule, sequence count)
2. Stats (sent, opens, replies, bounces, click, unsubscribed)
3. Lead breakdown by category (interested, meeting request, not interested, DNC, OOO, wrong person)
4. Per-sequence analytics if available:
   ```bash
   smartlead campaigns sequence-analytics --id ID --start-date DATE --end-date DATE --format json
   ```
5. Mailbox health:
   ```bash
   smartlead analytics mailbox-health --from DATE --to DATE --format json
   ```

## Benchmark Data (from real campaigns)

### Campaign 118335 — Best performer
- 63K emails sent, 731 replies (1.16% reply rate)
- Subject format: `"{{first_name}} - partnership request | {{location}}"`
- Partnership inquiry + Morgan & Morgan social proof = best performing sequence
- 4-step sequence with 2-day delays between steps

### Campaign 3073597 — Justia-sourced, 361 leads
- Morgan & Morgan proof approach (Sequence C)
- Near 0% bounce rate (Reoon "safe" only after catch_all lesson)

### Campaign 3073163 — Apify-sourced, 254 leads
- Phone-forward approach (Sequence A)
- Had 5.7% bounce rate initially (catch_all emails) — fixed by removing catch_all

### Worst performer
- MVA leads subject line ("Verified MVA Leads converting at ~21%...") = 0.5% reply rate
- Too salesy, too long, buried the value prop

### Winning patterns
- Short subject with personalization: `"{{first_name}} - partnership request | {{location}}"`
- Social proof from recognizable firms (Morgan & Morgan)
- 4-step sequences outperform 1-step
- Send window: 7am-11:30am CT, all 7 days

## Alerting

Flag these issues:
- Bounce rate > 3% → "WARNING: High bounce rate, check email quality"
- Open rate < 20% → "WARNING: Low open rate, check subject lines or deliverability"
- Reply rate < 0.5% → "NOTE: Low reply rate, consider testing new sequences"
- Any leads with category "Sender Originated Bounce" → "Check sender reputation"
