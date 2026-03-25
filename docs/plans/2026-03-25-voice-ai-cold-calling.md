# Voice AI Cold Calling for PI Law Firms — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI calls PI law firm landlines, pitches MVA lead partnership, warm-transfers interested prospects to Peter.

**Architecture:** Retell AI + ElevenLabs stock female voice + PhoneValidator landline check

**Tech Stack:** Retell AI SDK (Python), PhoneValidator API, Python 3.12

---

### Task 1: Setup

- [ ] **Step 1: Install + configure**

```bash
mkdir -p ~/smartlead/voice-ai && cd ~/smartlead/voice-ai
python3 -m venv venv && source venv/bin/activate
pip install retell-ai python-dotenv requests
```

`.env`:
```
RETELL_API_KEY=<from retellai.com>
PHONE_VALIDATOR_API_KEY=ef1232eb-0878-4a83-a95f-3ec837a41f23
ELEVENLABS_API_KEY=<existing>
PETER_CELL=+1XXXXXXXXXX
TELEGRAM_BOT_TOKEN=<existing>
TELEGRAM_CHAT_ID=<existing>
```

- [ ] **Step 2: Pick ElevenLabs voice**

Browse elevenlabs.io/voice-library → filter: Female, American, Young Adult, Conversational. Good options: "Rachel", "Emily", "Jessica". Pick one that sounds warm + professional. Save voice_id to `.env`.

- [ ] **Step 3: Create Retell agent**

```python
# setup.py
from retell import Retell
from dotenv import load_dotenv
import os

load_dotenv()
client = Retell(api_key=os.getenv("RETELL_API_KEY"))

agent = client.agent.create(
    response_engine={"type": "retell-llm"},
    voice_id=os.getenv("ELEVENLABS_VOICE_ID"),
    agent_name="LeadsForLawyer-Caller",
    language="en-US",
)

llm = client.llm.create(
    model="gpt-4o-mini",
    general_prompt="""You are Sarah, calling on behalf of Peter at LeadsForLawyer.

OPENING: "Hi, this is Sarah from LeadsForLawyer. Is {{contact_name}} available?"

IF CONNECTED: "We generate verified motor vehicle accident leads in {{state}} and
refer them to PI firms like {{firm_name}}. We work with 30+ firms. Would you be
open to a quick call with Peter to discuss?"

IF YES → call transfer_to_peter
IF PRICING: "$300 per verified lead."
IF NOT INTERESTED: "No problem at all. Have a great day!" → end call

Keep responses under 2 sentences. Be warm, not pushy.""",
    general_tools=[
        {
            "type": "transfer_call",
            "name": "transfer_to_peter",
            "number": os.getenv("PETER_CELL"),
            "transfer_mode": "warm",
        },
        {"type": "end_call", "name": "end_call"}
    ]
)

phone = client.phone_number.create(area_code=212, nickname="LFL-Main")

print(f"Agent: {agent.agent_id}")
print(f"LLM: {llm.llm_id}")
print(f"Phone: {phone.phone_number}")
```

- [ ] **Step 4: Test call to Peter's cell**

```python
call = client.call.create_phone_call(
    from_number=phone.phone_number,
    to_number=os.getenv("PETER_CELL"),
    agent_id=agent.agent_id,
    retell_llm_dynamic_variables={
        "firm_name": "Test Law Firm",
        "contact_name": "Peter",
        "state": "New York",
    }
)
```

- [ ] **Step 5: Commit**

---

### Task 2: Batch Caller

- [ ] **Step 1: Write caller script**

```python
# call.py
import json, time, requests, os, csv
from retell import Retell
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
client = Retell(api_key=os.getenv("RETELL_API_KEY"))
PV_KEY = os.getenv("PHONE_VALIDATOR_API_KEY")

def is_landline(phone):
    """$0.004/check. Only call landlines."""
    r = requests.get("https://api.phonevalidator.com/api/v4/phonesearch",
        params={"apikey": PV_KEY, "phone": phone, "type": "basic", "region": "US"})
    return r.json()["PhoneBasic"]["LineType"] == "LANDLINE"

def notify_telegram(msg):
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat = os.getenv("TELEGRAM_CHAT_ID")
    requests.post(f"https://api.telegram.org/bot{token}/sendMessage",
        json={"chat_id": chat, "text": msg})

def log_call(phone, firm, contact, outcome):
    with open("call_log.csv", "a") as f:
        csv.writer(f).writerow([datetime.utcnow().isoformat(), phone, firm, contact, outcome])

# Load leads
leads = json.load(open("../data/tier1_whales_with_phones.json"))

MAX_CALLS = 20
called = 0

for lead in leads:
    if called >= MAX_CALLS:
        break

    phone = lead["phone"]
    if not is_landline(phone):
        log_call(phone, lead["firm"], lead["name"], "SKIPPED-not-landline")
        continue

    print(f"Calling {lead['name']} at {lead['firm']} ({phone})...")
    notify_telegram(f"Calling {lead['name']} at {lead['firm']}")

    call = client.call.create_phone_call(
        from_number=os.getenv("RETELL_PHONE"),
        to_number=phone,
        agent_id=os.getenv("RETELL_AGENT_ID"),
        retell_llm_dynamic_variables={
            "firm_name": lead["firm"],
            "contact_name": lead["name"],
            "state": lead["state"],
        }
    )

    log_call(phone, lead["firm"], lead["name"], call.call_id)
    called += 1
    time.sleep(30)  # pace between calls

print(f"Done. {called} calls made.")
notify_telegram(f"Batch complete: {called} calls")
```

- [ ] **Step 2: Test with 5 firms**

```bash
python call.py  # will call first 5 landlines from lead list
```

- [ ] **Step 3: Commit**

---

### Task 3: Post-Call Analytics

- [ ] **Step 1: Fetch call results from Retell API**

```python
# results.py
# Pull call recordings, transcripts, durations, outcomes
# Match with lead data
# Generate summary: answered/voicemail/no-answer/transferred
# Send daily summary to Telegram
```

- [ ] **Step 2: Commit**

---

## Cost

| Item | Cost |
|------|------|
| Retell (agent + telephony) | ~$0.10/min |
| ElevenLabs TTS | ~$0.04/min |
| GPT-4o-mini | ~$0.01/min |
| PhoneValidator | $0.004/call |
| **Per 2-min call** | **~$0.31** |
| **Per 100 calls** | **~$31** |

## That's it. 3 tasks.
