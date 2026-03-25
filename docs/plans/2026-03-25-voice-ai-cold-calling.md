# Voice AI Cold Calling for PI Law Firms — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an AI voice calling system that cold-calls PI law firm office landlines with a short pitch, handles objections, and warm-transfers qualified prospects to Peter live.

**Architecture:** Twilio for telephony (outbound calls + PSTN) → OpenAI Realtime API (gpt-4o-mini-realtime) for speech-to-speech conversation → Python server on Mac Mini with ngrok for webhook tunneling. Phase 2 upgrades to Retell AI for branded caller ID + ElevenLabs voice clone.

**Tech Stack:** Python 3.12, Twilio SDK, OpenAI Realtime API, WebSockets, ngrok, FastAPI

---

### Task 1: Twilio Account Setup + First Test Call

**Files:**
- Create: `~/smartlead/voice-ai/.env`
- Create: `~/smartlead/voice-ai/requirements.txt`

- [ ] **Step 1: Create Twilio account and get credentials**

Sign up at twilio.com → get Account SID, Auth Token, buy a phone number ($1.15/mo).
Save to `.env`:
```
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
OPENAI_API_KEY=sk-xxxxx  # from existing .env
```

- [ ] **Step 2: Install dependencies**

```bash
cd ~/smartlead/voice-ai
python3 -m venv venv && source venv/bin/activate
pip install twilio openai fastapi uvicorn websockets python-dotenv
```

- [ ] **Step 3: Test outbound call (TwiML only, no AI)**

```python
# test_call.py
from twilio.rest import Client
from dotenv import load_dotenv
import os

load_dotenv()
client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))

call = client.calls.create(
    twiml='<Response><Say>Hello, this is a test call from Peter at Leads For Lawyer.</Say></Response>',
    to="+1YOURNUMBER",  # Peter's cell for testing
    from_=os.getenv("TWILIO_PHONE_NUMBER")
)
print(f"Call SID: {call.sid}")
```

Run: `python test_call.py`
Expected: Phone rings, hear the test message.

- [ ] **Step 4: Commit**

```bash
git add voice-ai/
git commit -m "feat: twilio account setup + test outbound call"
```

---

### Task 2: OpenAI Realtime API + WebSocket Bridge

**Files:**
- Create: `~/smartlead/voice-ai/server.py`
- Create: `~/smartlead/voice-ai/prompts.py`

- [ ] **Step 1: Write the call handler server**

FastAPI server that:
1. Receives Twilio webhook when call connects
2. Returns TwiML that opens a WebSocket media stream
3. Bridges audio between Twilio and OpenAI Realtime API

```python
# server.py — core architecture
# POST /outbound-call → TwiML with <Connect><Stream>
# WebSocket /media-stream → bridges Twilio audio ↔ OpenAI Realtime
```

- [ ] **Step 2: Write the AI system prompt**

```python
# prompts.py
SYSTEM_PROMPT = """You are Peter's assistant calling on behalf of LeadsForLawyer.
You're calling {firm_name} to speak with {contact_name}.

YOUR SCRIPT:
1. "Hi, this is [assistant name] calling on behalf of Peter at LeadsForLawyer.
   Is {contact_name} available?"
2. If connected: "We generate verified motor vehicle accident leads in {state}
   and refer them to PI firms on a per-lead basis. We currently work with over
   30 firms including some of the largest in the country. Would {contact_name}
   be open to a quick 5-minute call with Peter to discuss?"
3. If yes: "Great, let me connect you with Peter now." [TRANSFER]
4. If objection: Handle naturally, don't be pushy, offer to email instead.

RULES:
- Identify yourself as AI assistant at the start (TCPA compliance)
- Provide callback number if asked
- If they say "not interested" or "do not call" — thank them and end call
- Never be aggressive or argumentative
- Keep responses under 2 sentences
"""
```

- [ ] **Step 3: Test with ngrok tunnel**

```bash
ngrok http 5050  # get public URL
# Update Twilio webhook to ngrok URL
python server.py  # start server
python make_call.py +1TESTNUMBER  # call Peter's cell
```

Expected: Phone rings, AI speaks the script, responds to voice input.

- [ ] **Step 4: Commit**

```bash
git add voice-ai/server.py voice-ai/prompts.py
git commit -m "feat: openai realtime voice agent with twilio bridge"
```

---

### Task 3: Warm Transfer to Peter

**Files:**
- Modify: `~/smartlead/voice-ai/server.py`

- [ ] **Step 1: Add transfer function call to OpenAI**

Configure OpenAI Realtime with a `transfer_to_peter` tool that:
1. AI says "Let me connect you with Peter now"
2. Twilio Conference bridges the prospect + Peter's cell
3. AI whispers context to Peter before connecting ("This is {name} from {firm}, interested in MVA leads")

- [ ] **Step 2: Test transfer flow**

Call test number → AI speaks → say "yes I'm interested" → AI transfers → Peter's phone rings → both connected.

- [ ] **Step 3: Commit**

```bash
git commit -am "feat: warm transfer with whisper briefing"
```

---

### Task 4: Batch Caller with Lead Integration

**Files:**
- Create: `~/smartlead/voice-ai/batch_caller.py`
- Create: `~/smartlead/voice-ai/lead_loader.py`

- [ ] **Step 1: Write lead loader from Smartlead data**

```python
# lead_loader.py
# Reads from smartlead/data/phone_validated_mobile.json
# Filters to: cell phones only (from PhoneValidator), Tier 1 firms
# Returns list of {name, firm, phone, state, email} dicts
```

- [ ] **Step 2: Write batch caller with pacing**

```python
# batch_caller.py
# - Calls one at a time (sequential, not parallel)
# - 10AM-6PM local time enforcement per state timezone
# - 30-second delay between calls
# - Logs results: answered/voicemail/no-answer/transferred
# - Maintains internal DNC list
# - Max 20 calls per session initially
```

- [ ] **Step 3: Test with 5 friendly numbers**

Run batch caller on 5 test numbers. Verify:
- Calling hours enforced
- DNC list works (add a number, verify it's skipped)
- Results logged correctly
- Transfer works from batch flow

- [ ] **Step 4: Commit**

```bash
git add voice-ai/batch_caller.py voice-ai/lead_loader.py
git commit -m "feat: batch caller with pacing, DNC, and timezone enforcement"
```

---

### Task 5: TCPA Compliance Layer

**Files:**
- Create: `~/smartlead/voice-ai/compliance.py`

- [ ] **Step 1: Build compliance checks**

```python
# compliance.py
# - verify_business_landline(phone) → bool (uses PhoneValidator API)
# - check_calling_hours(state) → bool (10AM-6PM local)
# - check_dnc_list(phone) → bool
# - generate_disclosure() → str ("This is an AI assistant calling on behalf of...")
# - log_call_record(phone, duration, outcome, timestamp) → saves to CSV
#   (FTC requires 5-year retention)
# - check_state_restrictions(state) → warns for FL, TX, CA, NY
```

- [ ] **Step 2: Integrate into batch caller**

Every call goes through compliance checks before dialing. High-risk states (FL, TX) skipped by default with override flag.

- [ ] **Step 3: Commit**

```bash
git add voice-ai/compliance.py
git commit -m "feat: TCPA compliance layer with state restrictions and call logging"
```

---

### Task 6: Phase 2 — ElevenLabs Voice Clone (Optional)

**Files:**
- Create: `~/smartlead/voice-ai/voice_clone.py`

- [ ] **Step 1: Record 30+ minutes of Peter speaking**

Use Mac Mini microphone or upload existing recordings. Script natural conversation, not reading — ElevenLabs PVC needs varied speech patterns.

- [ ] **Step 2: Upload to ElevenLabs PVC**

```python
# voice_clone.py
# Uses ElevenLabs API to create Professional Voice Clone
# Saves voice_id for use in Retell AI or LiveKit
```

- [ ] **Step 3: Test voice quality on 3 calls**

Compare AI-with-clone vs AI-with-stock-voice. Get honest feedback from test recipients.

---

### Task 7: Phase 2 — Retell AI Migration (Optional)

**Files:**
- Create: `~/smartlead/voice-ai/retell_agent.py`

- [ ] **Step 1: Set up Retell AI account**

Get API key, create agent with ElevenLabs voice, configure branded caller ID ($0.10/call).

- [ ] **Step 2: Migrate prompt and transfer logic**

Port the OpenAI Realtime prompt → Retell agent config. Set up warm transfer with whisper.

- [ ] **Step 3: A/B test Twilio+OpenAI vs Retell**

20 calls each, compare:
- Answer rate (does branded caller ID help?)
- Conversation quality (latency, naturalness)
- Transfer rate
- Cost per transferred call

---

## Cost Summary

| Phase | Setup Cost | Per 100 Calls | Monthly (1K calls) |
|-------|-----------|---------------|---------------------|
| Phase 1: Twilio+OpenAI mini | ~$20 | ~$9-10 | ~$100 |
| Phase 2: Retell+ElevenLabs | ~$50 | ~$30-38 | ~$350 |
| Phase 2: Retell budget | ~$50 | ~$20-24 | ~$220 |

## Risk Mitigation

1. **Start with 10-20 test calls** to firms in low-risk states (not FL/TX/CA/NY)
2. **AI discloses identity** in first sentence
3. **Only call verified business landlines** (PhoneValidator confirmed LANDLINE)
4. **Maintain DNC list** — honor "not interested" immediately
5. **Log everything** — 5-year FTC recordkeeping
6. **Consult TCPA attorney** before scaling beyond 50 calls ($500-1500)
