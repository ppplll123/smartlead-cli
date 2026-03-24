# Replying to Warm Leads — Prompt Template

## CRITICAL RULE: Never hallucinate offers or claims

**READ THE ACTUAL THREAD before drafting.** Do NOT:
- Invent "free leads" or "no deposit" offers unless the user's actual messages say that
- Make up conversion rates, pricing, or terms not in the thread
- Reference tools/repos/credentials the sender didn't mention
- Change the tone, persona, or claims from what was already established

**DO:**
- Match the sender name from the thread (if Cherry sent it, reply as Cherry)
- Reference the EXACT pricing/terms already discussed in the thread
- Address the prospect's ACTUAL objection (read their words, not your assumptions)
- Keep it short — these are reply-to-thread, not cold outreach

## Context gathering

Before drafting, ALWAYS:
1. Full thread: `smartlead leads messages --campaign-id CID --lead-id LID --format json`
2. Read EVERY message — yours AND theirs. Note:
   - Who sent the original (which mailbox/sender name?)
   - What pricing/terms were quoted?
   - What did the prospect ask or object to?
   - Where did the conversation stop? Whose turn is it?
3. Strip VML/Outlook junk from replies: `v\:* {behavior:url(#default#VML);}` etc
4. Strip quoted text: everything after `From:` or `On ... wrote:`

## Reply framework by signal

### They asked about pricing
> Use the EXACT price you already quoted in the thread. If you said $300/lead, say $300/lead. Don't invent new numbers.

### They objected to quality (like Robert Elan — burned by past providers)
> Acknowledge the burn. Explain your screening process. Offer a small test batch at the SAME terms already discussed. Don't suddenly offer free.

### They gave a phone number
> "Apologies for the delay — still taking cases at {firm}? Happy to call at a time that works."

### They forwarded to a colleague
> Ask for an intro or contact them directly. Reference who referred you.

### They said to schedule a call
> Propose a time. Don't re-pitch over email.

### Empty/unclear reply
> "Hey {name}, I noticed you replied but your message may not have come through."

## Tone principles

1. **Match the existing thread tone** — if it was casual with "Sent from my iPhone", stay casual
2. **Sign as the original sender** — Cherry, Peter, Lys, whoever started the thread
3. **Acknowledge time gap** — these are old threads, don't pretend it's fresh
4. **Reference their specific words** — "The soft tissue problem you described" not generic filler
5. **Don't oversell** — one clear ask, not three paragraphs of value props

## Example: Robert Elan (what went WRONG first, then RIGHT)

### WRONG (hallucinated offers):
> "5 free leads, no deposit, no payment unless you sign..."
> "We open-sourced our tooling on GitHub..."
> "Peter Lewinski, Founder, ChatGPT Leads"

Problems: Thread was from Cherry, not Peter. Never offered free leads. GitHub reference was never in the conversation. Made up §5102(d) screening criteria.

### RIGHT (based on actual thread):
> Robert — referrals and Google are great but they cap out at some point.
>
> The soft tissue problem you described is exactly why we screen before sending. We don't send bruises-and-contusions cases to NY firms — we know §5102(d).
>
> At $300/lead with the deposit model we discussed, want to try a small batch and see for yourself?
>
> Cherry

Why this works: References HIS words ("soft tissue", "bruises and contusions"), uses the price from the ACTUAL thread ($300/lead), signed as Cherry (the original sender), acknowledges his concern directly.

## Sending via API

```bash
curl -X POST "https://server.smartlead.ai/api/v1/campaigns/{CID}/reply-email-thread?api_key=KEY" \
  -H "Content-Type: application/json" \
  -d '{"email_stats_id": "STATS_ID", "email_body": "<div>Your reply</div>"}'
```

Get `email_stats_id` from any message in the lead's history (`stats_id` field).
MUST use curl — Python urllib blocked by Cloudflare (error 1010).

## Cleaning reply text (VML/Outlook junk)

```python
import re
reply = re.sub(r'v\\?:\*\s*\{behavior:url\(#default#VML\);\}\s*', '', reply)
reply = re.sub(r'o\\?:\*\s*\{behavior:url\(#default#VML\);\}\s*', '', reply)
reply = re.sub(r'w\\?:\*\s*\{behavior:url\(#default#VML\);\}\s*', '', reply)
reply = re.sub(r'\.shape\s*\{[^}]*\}', '', reply)
reply = re.split(r'From:\s', reply)[0].strip()
reply = re.sub(r'\s+', ' ', reply).strip()
```
