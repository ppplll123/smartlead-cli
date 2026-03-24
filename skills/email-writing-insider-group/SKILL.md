---
name: email-writing-insider-group
description: Write outbound prospecting emails, cold outreach sequences, follow-ups, and whale client pitches. Use when user asks to write emails, draft sequences, improve copy, create outreach templates, or says "write email", "draft sequence", "improve my email", "whale client", "cold email", "outreach copy".
argument-hint: "[cold-intro|follow-up|whale|improve] [context...]"
allowed-tools: ["Bash", "Read", "Write", "Edit"]
---

# Outbound Email Writing

Write effective outbound prospecting emails based on proven frameworks from insider.group and real campaign data.

## Before writing ANYTHING

1. Read the full copywriting guide: `${CLAUDE_PLUGIN_ROOT}/skills/smartlead-prospect/references/email-copywriting-guide.md`
2. Read the reply drafting guide: `${CLAUDE_PLUGIN_ROOT}/skills/smartlead-prospect/references/replying-to-warm-leads.md`
3. If replying to an existing thread: read the ACTUAL thread first (`smartlead leads messages`)

## Core Rules

1. **Be natural** — no corporate jargon, no GPT-sounding copy
2. **Keep it short** — 3-5 sentences max for first touch
3. **Use their industry language** — speak like an insider
4. **One clear CTA** — don't ask 3 questions, ask 1
5. **Personalize** — reference something specific about THEM
6. **NEVER hallucinate** — don't invent offers, pricing, or claims not approved by user

## Email Types

### Cold Intro (first touch)
- Subject: short, personalized, partnership-framed
- Body: who you are, what you offer, social proof, one question
- Best performing format: Copy 4 or Copy 9 from the guide
- Always end with low-friction CTA: "Yes/No/More info" or "Who should I speak with?"

### Follow-Up (2nd-4th touch)
- Reply to same thread (RE: subject)
- Reference the previous email
- Add new value or angle each time
- Keep getting shorter with each follow-up
- Last attempt should be 1-2 sentences max

### Whale Client (high-value target)
- Research them first: ads they run, competitors, recent news
- Reference specific things about their business
- Name-drop their competitors
- Revenue/ROI framing for C-suite
- Offer small test (50 leads/week) not full commitment

### Reply to Warm Lead
- READ the actual thread first
- Match the sender name from original thread
- Use EXACT pricing/terms already discussed
- Address their specific objection
- See `replying-to-warm-leads.md` for full framework

## Sequence Structure (4-step proven cadence)

| Step | Timing | Type | Length |
|------|--------|------|--------|
| Seq 1 | Day 0 | Partnership inquiry + social proof | 4-5 sentences |
| Seq 2 | Day 3 | Follow-up + phone ask | 2-3 sentences |
| Seq 3 | Day 5 | New angle (cost-per-lead, conversion rate) | 3-4 sentences |
| Seq 4 | Day 7 | Last attempt | 1-2 sentences |

## Proven Subject Lines (ranked by reply rate)

1. `"{{first_name}} - partnership request | {{location}}"` — 1.16% reply rate at scale
2. `"partnership inquiry - {{first_name}}"` — strong performer
3. `"[Their Company] <> [Your Company]"` — professional
4. `"Can we send you more leads?"` — direct
5. `"One-word reply works: Yes/No/More info"` — low friction

**WORST:** Long salesy subjects like "Verified MVA Leads converting at ~21%..." — 0.5% reply rate

## Spintax Rules (Smartlead-specific)

- Use `{option1|option2|option3}` for variation
- **NEVER put {{variables}} inside spintax** — Smartlead parser crashes
- RIGHT: `{Hi|Hello} {{first_name}}`
- WRONG: `{Hi {{first_name}}|Hello {{first_name}}}`

## When Output Format

Always present email drafts as:
1. **Subject line**
2. **Body** (plain text, not HTML)
3. **Notes** (what to customize, what variables are used)
4. If multiple options: present 2-3 short variants, let user pick

## PI/Legal Vertical Specifics

For personal injury / law firm outreach:
- Lead with "partnership" framing, not "lead selling"
- Social proof: "Morgan & Morgan and 32+ other firms"
- Reference their state/location for relevance
- Common objection: quality (soft tissue vs real injury)
- Common objection: burned by past lead providers
- Use "who should I be speaking with?" CTA — works better than "are you interested?"
