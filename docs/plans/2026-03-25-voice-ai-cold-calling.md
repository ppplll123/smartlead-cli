# Voice AI Cold Calling for PI Law Firms — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an AI voice calling system that cold-calls PI law firm office landlines with Peter's cloned voice, handles objections naturally, and warm-transfers qualified prospects to Peter live.

**Architecture:** Retell AI (agent platform + telephony + branded caller ID) + ElevenLabs Professional Voice Clone (Peter's voice) + Smartlead lead data. No DIY WebSocket bridges, no stock voices.

**Tech Stack:** Retell AI SDK (Python), ElevenLabs API, PhoneValidator API, Python 3.12

**Why Retell + ElevenLabs from day 1:**
- Calling lawyers — voice credibility is everything, stock voices get hung up on instantly
- Retell has branded caller ID ($0.10/call) — critical for answer rates
- Built-in warm transfer with whisper briefing — no custom WebSocket plumbing
- 600ms latency — fastest hosted platform
- 4.8/5 on G2, 40M+ calls/month production track record
- Peter already has ElevenLabs API key

**Cost: ~$0.15/min all-in ($30 per 100 calls)**

---

### Task 1: ElevenLabs Voice Clone

**Files:**
- Create: `~/smartlead/voice-ai/clone_voice.py`
- Create: `~/smartlead/voice-ai/.env`

- [ ] **Step 1: Set up environment**

```bash
mkdir -p ~/smartlead/voice-ai && cd ~/smartlead/voice-ai
python3 -m venv venv && source venv/bin/activate
pip install elevenlabs retell-ai python-dotenv requests
```

Save to `.env`:
```
ELEVENLABS_API_KEY=<from existing ~/job-auto-apply/.env>
RETELL_API_KEY=<get from retellai.com after signup>
PHONE_VALIDATOR_API_KEY=ef1232eb-0878-4a83-a95f-3ec837a41f23
```

- [ ] **Step 2: Record voice samples**

Peter records 30+ minutes of natural speech (not reading). Include:
- Casual conversation
- Sales pitch delivery
- Handling objections ("I understand, no problem at all")
- Different emotions (enthusiastic, professional, empathetic)

Save as WAV/MP3 files in `~/smartlead/voice-ai/voice-samples/`

- [ ] **Step 3: Create Professional Voice Clone**

```python
# clone_voice.py
from elevenlabs import ElevenLabs
import os
from dotenv import load_dotenv

load_dotenv()
client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

# Upload samples for PVC
voice = client.voices.add(
    name="Peter-LeadsForLawyer",
    files=[open(f, "rb") for f in os.listdir("voice-samples/")],
    description="Peter Lewinski - male, European accent, professional sales tone"
)
print(f"Voice ID: {voice.voice_id}")
# Save voice_id to .env
```

Run: `python clone_voice.py`
Expected: Voice ID returned, save to `.env` as `ELEVENLABS_VOICE_ID`

- [ ] **Step 4: Test clone quality**

```python
# Quick TTS test
audio = client.generate(
    text="Hi, this is Peter from LeadsForLawyer. I'm reaching out because we generate verified MVA leads in Texas and I'd love to discuss a potential partnership.",
    voice=voice.voice_id,
    model="eleven_turbo_v2_5"
)
# Save and play
with open("test_voice.mp3", "wb") as f:
    for chunk in audio:
        f.write(chunk)
```

Listen. Does it sound like Peter? If not, record more samples and retrain.

- [ ] **Step 5: Commit**

```bash
git add voice-ai/.env.example voice-ai/clone_voice.py voice-ai/requirements.txt
git commit -m "feat: elevenlabs professional voice clone setup"
```

---

### Task 2: Retell AI Agent Setup

**Files:**
- Create: `~/smartlead/voice-ai/retell_setup.py`
- Create: `~/smartlead/voice-ai/prompts.py`

- [ ] **Step 1: Create Retell AI account + API key**

Sign up at retellai.com. Get API key. Buy a phone number with branded caller ID.

- [ ] **Step 2: Write the agent prompt**

```python
# prompts.py
AGENT_PROMPT = """You are calling on behalf of Peter at LeadsForLawyer.
Your voice IS Peter's voice (cloned). You speak as Peter in first person.

CONTEXT FOR THIS CALL:
- Firm: {{firm_name}}
- Contact: {{contact_name}}
- State: {{state}}
- Firm has {{reviews}} Google reviews (estimate {{lead_estimate}} past leads)

OPENING (when someone picks up):
"Hi, this is Peter from LeadsForLawyer. I should mention upfront this is an
AI-assisted call. I'm looking for {{contact_name}} — is that you?"

IF CONNECTED TO THE RIGHT PERSON:
"Great! I'll keep this brief. We generate verified motor vehicle accident leads
in {{state}} and refer them to PI firms like {{firm_name}} on a per-lead basis.
We work with over 30 firms right now. Would you be open to a quick 5-minute
call to see if this could work for your practice?"

IF YES → trigger transfer_to_peter function
"Perfect, let me connect you with our team now."

IF "HOW MUCH?" or PRICING QUESTION:
"It's $300 per verified lead. Each lead is a real person who's been in a motor
vehicle accident in {{state}} and is actively looking for representation."

IF "HOW DO YOU GET THE LEADS?":
"We run targeted digital advertising campaigns across multiple channels. Each
lead is verified before referral — we don't send junk."

IF "NOT INTERESTED" or "REMOVE ME":
"Totally understand. I'll make sure you're removed from our list. Have a great
day!" → end call, log DNC

IF GATEKEEPER (receptionist, not the contact):
"Hi, I'm trying to reach {{contact_name}} regarding a potential partnership
opportunity for the firm. Is {{contact_name}} available?"

IF VOICEMAIL:
"Hi {{contact_name}}, this is Peter from LeadsForLawyer. We generate verified
MVA leads in {{state}} and I'd love to discuss a referral partnership with
{{firm_name}}. You can reach me at [callback number]. Thanks!"

RULES:
- ALWAYS disclose "AI-assisted call" within the first 10 seconds (TCPA)
- Never be pushy or argumentative
- Keep every response under 2 sentences
- If they ask anything you can't answer: "That's a great question — when Peter
  connects, he can walk you through that in detail."
- Sound natural, conversational, NOT scripted
- Use their first name, not Mr./Ms.
"""
```

- [ ] **Step 3: Create agent via Retell API**

```python
# retell_setup.py
from retell import Retell
import os
from dotenv import load_dotenv
from prompts import AGENT_PROMPT

load_dotenv()
client = Retell(api_key=os.getenv("RETELL_API_KEY"))

# Create agent with ElevenLabs voice
agent = client.agent.create(
    response_engine={
        "type": "retell-llm",
        "llm_id": None  # will create LLM next
    },
    voice_id=os.getenv("ELEVENLABS_VOICE_ID"),
    agent_name="Peter-LeadsForLawyer",
    voice_temperature=0.7,
    responsiveness=0.8,  # balance between speed and thoughtfulness
    enable_backchannel=True,  # "uh huh", "right" while listening
    language="en-US",
)

# Create LLM with prompt
llm = client.llm.create(
    model="gpt-4o-mini",
    general_prompt=AGENT_PROMPT,
    general_tools=[
        {
            "type": "transfer_call",
            "name": "transfer_to_peter",
            "description": "Transfer to Peter when prospect is interested",
            "number": "+1PETERSCELL",
            "transfer_mode": "warm",
            "warm_transfer_prompt": "Connecting you with Peter now. Peter, this is {{contact_name}} from {{firm_name}} in {{state}} — they're interested in the MVA lead partnership."
        },
        {
            "type": "end_call",
            "name": "end_call",
            "description": "End the call when prospect declines or conversation is done"
        }
    ]
)

print(f"Agent ID: {agent.agent_id}")
print(f"LLM ID: {llm.llm_id}")
```

- [ ] **Step 4: Buy Retell phone number with branded caller ID**

```python
phone = client.phone_number.create(
    area_code=212,  # NYC area code — professional
    nickname="LeadsForLawyer-Main",
    branded_caller_id={
        "name": "LeadsForLawyer",  # shows on caller ID
    }
)
print(f"Phone: {phone.phone_number}")
```

- [ ] **Step 5: Test call to Peter's cell**

```python
call = client.call.create_phone_call(
    from_number=phone.phone_number,
    to_number="+1PETERSCELL",
    agent_id=agent.agent_id,
    retell_llm_dynamic_variables={
        "firm_name": "Test Law Firm",
        "contact_name": "Peter",
        "state": "New York",
        "reviews": "500",
        "lead_estimate": "5,000-15,000"
    }
)
```

Expected: Peter's phone rings, AI speaks with his cloned voice, full conversation works.

- [ ] **Step 6: Commit**

```bash
git add voice-ai/retell_setup.py voice-ai/prompts.py
git commit -m "feat: retell AI agent with elevenlabs voice clone + warm transfer"
```

---

### Task 3: TCPA Compliance Layer

**Files:**
- Create: `~/smartlead/voice-ai/compliance.py`

- [ ] **Step 1: Build compliance module**

```python
# compliance.py
import requests
from datetime import datetime
import pytz
import csv
import os

STATE_TIMEZONES = {
    "AL": "US/Central", "AK": "US/Alaska", "AZ": "US/Mountain",
    "CA": "US/Pacific", "FL": "US/Eastern", "NY": "US/Eastern",
    "TX": "US/Central", # ... all 50 states
}

# States with extra-strict AI calling laws
HIGH_RISK_STATES = {
    "FL": "FTSA requires prior written consent for ALL automated calls",
    "TX": "SB 140 requires AI disclosure in 30s, voice clone illegal without consent",
    "CA": "AB-2905 mandates AI disclosure at call outset",
    "NY": "Seinfeld Law: ID in 30s + DNC opt-out at outset, $20K/violation",
}

DNC_FILE = "dnc_list.csv"
CALL_LOG_FILE = "call_log.csv"  # 5-year FTC retention

def verify_business_landline(phone: str) -> dict:
    """Returns phone type via PhoneValidator API. MUST be LANDLINE for cold calls."""
    resp = requests.get(
        "https://api.phonevalidator.com/api/v4/phonesearch",
        params={
            "apikey": os.getenv("PHONE_VALIDATOR_API_KEY"),
            "phone": phone, "type": "basic", "region": "US"
        }
    )
    data = resp.json()["PhoneBasic"]
    return {
        "type": data["LineType"],  # LANDLINE, CELL PHONE, VOIP, etc.
        "company": data["PhoneCompany"],
        "location": data["PhoneLocation"],
        "is_safe_to_call": data["LineType"] == "LANDLINE"
    }

def check_calling_hours(state: str) -> bool:
    """10AM-6PM local time only."""
    tz = pytz.timezone(STATE_TIMEZONES.get(state, "US/Eastern"))
    local_hour = datetime.now(tz).hour
    return 10 <= local_hour < 18

def is_on_dnc(phone: str) -> bool:
    """Check internal DNC list."""
    if not os.path.exists(DNC_FILE):
        return False
    with open(DNC_FILE) as f:
        return phone in [row[0] for row in csv.reader(f)]

def add_to_dnc(phone: str, reason: str):
    with open(DNC_FILE, "a") as f:
        csv.writer(f).writerow([phone, reason, datetime.utcnow().isoformat()])

def log_call(phone, firm, contact, state, duration, outcome):
    """FTC requires 5-year retention of call records."""
    with open(CALL_LOG_FILE, "a") as f:
        csv.writer(f).writerow([
            datetime.utcnow().isoformat(), phone, firm, contact,
            state, duration, outcome
        ])

def pre_call_check(phone: str, state: str) -> tuple[bool, str]:
    """Run all compliance checks before dialing. Returns (ok, reason)."""
    if is_on_dnc(phone):
        return False, "On DNC list"
    if not check_calling_hours(state):
        return False, f"Outside calling hours for {state}"
    if state in HIGH_RISK_STATES:
        return False, f"High-risk state: {HIGH_RISK_STATES[state]}"
    phone_info = verify_business_landline(phone)
    if not phone_info["is_safe_to_call"]:
        return False, f"Not a business landline: {phone_info['type']}"
    return True, "Clear to call"
```

- [ ] **Step 2: Commit**

```bash
git add voice-ai/compliance.py
git commit -m "feat: TCPA compliance - landline verification, calling hours, DNC, state restrictions"
```

---

### Task 4: Batch Caller with Smartlead Integration

**Files:**
- Create: `~/smartlead/voice-ai/batch_caller.py`

- [ ] **Step 1: Build batch caller**

```python
# batch_caller.py
# Loads leads from Smartlead data (Tier 1 whales with Google Places enrichment)
# For each lead:
#   1. Run pre_call_check() — skip if fails
#   2. Create Retell phone call with dynamic variables (firm, contact, state, reviews)
#   3. Wait for call completion
#   4. Log result (answered/voicemail/no-answer/transferred/dnc)
#   5. If DNC requested during call → add_to_dnc()
#   6. 30-second delay between calls
#
# Features:
#   - Sequential calling (one at a time)
#   - Resume from last position if interrupted
#   - Real-time Telegram notification on transfers
#   - Daily summary report
#   - Max calls per session (default 20)
```

- [ ] **Step 2: Test with 5 calls to low-risk states**

Pick 5 Tier 1 whale firms in states NOT in HIGH_RISK_STATES.
Run batch caller. Verify:
- Compliance checks pass
- AI speaks with Peter's voice
- Objection handling works
- Transfer works
- DNC honored
- Call log populated

- [ ] **Step 3: Commit**

```bash
git add voice-ai/batch_caller.py
git commit -m "feat: batch caller with compliance checks and telegram notifications"
```

---

### Task 5: Telegram Integration for Live Notifications

**Files:**
- Create: `~/smartlead/voice-ai/notifications.py`

- [ ] **Step 1: Wire up Telegram bot for call events**

```python
# notifications.py
# On call start: "Calling {contact} at {firm} ({state})..."
# On transfer: "TRANSFER! {contact} from {firm} is interested — connecting to Peter"
# On DNC: "{contact} requested removal"
# On voicemail: "Left voicemail for {contact}"
# Daily summary: "Today: 20 calls, 3 answered, 1 transferred, 2 DNC, 14 no answer"
```

- [ ] **Step 2: Commit**

```bash
git add voice-ai/notifications.py
git commit -m "feat: telegram notifications for call events"
```

---

## Cost Summary

| Item | Cost |
|------|------|
| Retell AI (agent + telephony) | ~$0.10/min |
| ElevenLabs TTS (through Retell) | ~$0.04/min |
| GPT-4o-mini LLM | ~$0.01/min |
| Branded Caller ID | $0.10/call |
| PhoneValidator (landline check) | $0.004/call |
| **Total per 2-min call** | **~$0.41** |
| **Per 100 calls (200 min)** | **~$41** |
| **ElevenLabs Creator plan** | **$22/month** |
| **Retell phone number** | **$2/month** |

## Risk Mitigation

1. **Only call verified business LANDLINES** — PhoneValidator confirms before every call
2. **AI discloses identity** in first 10 seconds ("AI-assisted call")
3. **Skip FL, TX, CA, NY** initially — strictest state laws
4. **Start with 20 calls** to safe states, evaluate before scaling
5. **Maintain DNC list** — instant removal on request
6. **Log everything** — 5-year FTC recordkeeping requirement
7. **Consult TCPA attorney** before scaling beyond 50 calls ($500-1500 for consultation)
8. **Peter's real voice clone** — builds credibility, not deception (disclosed as AI)
