---
name: smartlead-inbox
description: Check Smartlead inbox replies, show conversation threads, categorize leads. Use when user says "check inbox", "any replies", "show threads", "inbox status", "new responses", or "categorize leads".
argument-hint: "[unread|replies|important|campaign-id]"
allowed-tools: ["Bash", "Read"]
---

# Smartlead Inbox Manager

Check and manage the unified inbox across all campaigns.

## Default (no args): show unread + recent replies

```bash
smartlead inbox unread --format json
smartlead inbox replies --format json
```

Present as:
```
UNREAD (X):
  From: email | Campaign: name | Category: X | Last reply: date
  Preview: first 100 chars of reply...

RECENT REPLIES (X):
  ...same format...
```

## Show thread for a specific lead

Get lead messages:
```bash
smartlead leads messages --campaign-id CID --lead-id LID --format json
```

Show full thread: sent messages + replies in chronological order.
For each message show: direction (→ sent / ← reply), from, date, subject, body.

## Categorize a lead

Update category:
```bash
smartlead inbox update-category --lead-id LID --category-id CID
```

Categories:
- 1: Interested
- 2: Meeting Request
- 3: Not Interested
- 4: Do Not Contact
- 5: Information Request
- 6: Out Of Office
- 7: Wrong Person

## Other inbox views

- `important`: `smartlead inbox important --format json`
- `snoozed`: `smartlead inbox snoozed --format json`
- `archived`: `smartlead inbox archived --format json`

## CRITICAL: Bounce Miscategorization

Smartlead's AI categorizer frequently marks bounce/delivery-failure messages as "Interested" because they contain text that looks like a response. Always check "interested" replies for bounce indicators.

### Auto-detect bounces
When reading inbox replies, scan for these keywords:
- "delivery", "undeliverable", "failed", "bounce", "returned mail"
- "550", "554", "mailbox full", "user unknown", "does not exist"
- "postmaster@", "mailer-daemon@"

If found → re-categorize the lead:
```bash
smartlead inbox update-category --lead-id LID --category-id 0
```

This prevents inflated "interested" counts in your dashboard. Real bounce rate may be higher than reported if you don't do this check.

## Reply to a thread

```bash
smartlead inbox reply --from-json FILE
```
File format: `{"lead_id": N, "campaign_id": N, "body": "HTML", "email_account_id": N}`
