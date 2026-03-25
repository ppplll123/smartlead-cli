# SMS Relay from Mac Mini - Complete Guide

Saved from Claude Research - 2026-03-25

## Quick Fix Sequence (Do This First)

1. On Mac: Messages → Settings → iMessage → **Sign Out completely**
2. On iPhone: Settings → Messages → Text Message Forwarding → **toggle Mac Mini OFF**
3. Restart both iPhone and Mac Mini
4. On iPhone: verify iMessage is activated (Settings → Messages → Send & Receive)
5. On Mac: open Messages, sign back into iMessage with Apple ID
6. **CRITICAL**: Verify your **phone number** (not just email) is **checked** under "You can be reached for messages at"
7. Set "Start new conversations from" to your **phone number**, not email
8. On iPhone: Settings → Messages → Text Message Forwarding → **toggle Mac Mini ON**
9. Test by sending SMS from Mac to a known Android number

## Root Cause
macOS Sequoia silently unchecks the phone number in Messages settings after updates (15.3.2, 15.4).

## Force SMS via AppleScript

```bash
osascript -e 'tell application "Messages"' \
  -e 'set targetService to 1st service whose service type = SMS' \
  -e 'set targetBuddy to buddy "+15555555555" of targetService' \
  -e 'send "Hello via SMS" to targetBuddy' \
  -e 'end tell'
```

**Caveat**: Recipient must have existing conversation. New contacts need one manual message first.

## Best Tools

1. **imsg** (brew install steipete/tap/imsg) — 99.6% delivery rate, 5K+ messages tested
2. **BlueBubbles** — REST API, `POST /api/v1/message/text` with `chatGuid: "SMS;-;+number"`
3. **mac-imessage** (pip install mac_imessage) — `mac_imessage.send_sms(message, phone_number)`
4. **Pushcut** — webhook → iPhone → SMS ($10-30/yr)

## What Does NOT Work
- USB tools (libimobiledevice, pymobiledevice3) — can't access SMS
- Email-to-SMS gateways — AT&T/T-Mobile/Verizon all shut down 2024-2025
- Writing to chat.db — it's a log, not a command queue
- `defaults write` — no hidden SMS relay settings exist
