# Programmatic SMS relay from Mac Mini to iPhone: a complete technical guide

**Apple's SMS relay can send green-bubble texts from a Mac through a paired iPhone — but the system is fragile, underdocumented, and breaks frequently across macOS updates.** The most common cause of "Not Delivered" failures is surprisingly mundane: macOS Sequoia silently unchecks the phone number in Messages settings after updates. The deeper problem is architectural — Apple designed SMS relay for interactive GUI use, not programmatic automation, and provides zero public APIs for it. Every working solution ultimately relies on AppleScript controlling Messages.app, which is the only supported send mechanism on macOS. This report covers every angle: root-cause troubleshooting, AppleScript techniques, open-source tools, remote automation via Shortcuts and webhooks, and the fundamental technical limitations you're working against.

---

## Why SMS relay fails and how to fix "Not Delivered"

The specific failure pattern — iMessage (blue) works, SMS (green) shows "Not Delivered" — is **the single most reported Messages issue** across Apple Community forums since macOS Sonoma. The root cause is almost always a configuration state problem, not a hardware or network issue.

**The #1 culprit is a silently unchecked phone number.** On the Mac, open Messages → Settings → iMessage and verify that your **phone number** (not just your email) is checked under "You can be reached for messages at." macOS Sequoia updates — particularly **15.3.2 and 15.4** — have been documented silently unchecking this setting. Multiple Apple Community threads with hundreds of replies confirm this exact behavior. Additionally, "Start new conversations from" must be set to your phone number, not your email — emails cannot initiate SMS.

The full nuclear-option fix sequence that resolves this for most users:

1. On Mac: Messages → Settings → iMessage → **Sign Out completely**
2. On iPhone: Settings → Messages → Text Message Forwarding → **toggle Mac Mini OFF**
3. Restart both iPhone and Mac Mini
4. On iPhone: verify iMessage is activated (Settings → Messages → Send & Receive)
5. On Mac: open Messages, sign back into iMessage with Apple ID
6. Verify your phone number appears and is **checked** under "You can be reached"
7. On iPhone: Settings → Messages → Text Message Forwarding → **toggle Mac Mini ON**
8. Verify the Mac Mini appears in Find My (Settings → [Your Name] → Find My) — some users report Find My Mac must be enabled for the device to appear in the Text Message Forwarding list
9. Test by sending an SMS from Mac to a known Android number

Other documented causes include: VPN on the Mac interfering with APNs connections, macOS firewall blocking relay traffic, Messages in iCloud sync corruption (toggle off and back on), and carrier-side issues requiring a network reset from your provider. The Mac does **not** need its own phone number — it uses the iPhone's number as a relay. There is **no known difference** between Intel and Apple Silicon for SMS relay; it's entirely software-based through Apple Push Notification service.

---

## How SMS relay actually works under the hood

Understanding the architecture explains why programmatic sending is so difficult. When you send an SMS from Mac, the message does **not** travel directly to the iPhone over Bluetooth, USB, or local Wi-Fi. Instead, it follows this path: Mac → encrypted via APNs to Apple's servers → relayed to paired iPhone → iPhone sends the actual SMS via the carrier's cellular network. Both devices need internet access, but they don't need to be on the same network.

This has a critical implication: **SMS messages are not queued for offline devices**. Unlike iMessages (queued up to 30 days), if the iPhone is unreachable when the Mac attempts an SMS relay, the message simply fails. There's no retry mechanism built into the relay protocol. Apple's Platform Security Guide confirms this architecture and notes the relay uses iMessage-level encryption between devices.

The **fundamental technical limitation** is that Apple provides no public framework, API, or XPC service for initiating SMS from macOS. The Messages app's AppleScript dictionary is the only programmatic interface, and it's been degrading with each macOS rewrite. An Apple engineer ("Quinn the Eskimo") confirmed on Apple Developer Forums that "Messages got a significant rewrite in macOS 11 and it's not uncommon for that to cause problems for the AppleScript support." There is no `ContinuityFramework` or similar developer API — Continuity features are system-level with no programmatic access.

---

## Forcing SMS via AppleScript and command-line tools

AppleScript **can** explicitly target the SMS service rather than iMessage. The Messages app dictionary exposes services with a `service type` property that can be either `SMS` or `iMessage`. Here's the working syntax for macOS Big Sur through Sequoia:

```applescript
tell application "Messages"
    set targetService to 1st service whose service type = SMS
    set targetBuddy to buddy "+15555555555" of targetService
    send "Hello via SMS" to targetBuddy
end tell
```

The equivalent one-liner for terminal use:

```bash
osascript -e 'tell application "Messages"' \
  -e 'set targetService to 1st service whose service type = SMS' \
  -e 'set targetBuddy to buddy "+15555555555" of targetService' \
  -e 'send "Hello via SMS" to targetBuddy' \
  -e 'end tell'
```

**Critical caveat: the recipient must have an existing conversation** in Messages.app. AppleScript cannot initiate a brand-new SMS to a never-before-contacted number — you'll get error -1728 ("Can't get buddy id"). The workaround is to send one manual message first to establish the conversation, after which programmatic sends work. For truly new contacts, UI scripting (simulating keystrokes via System Events) is the fallback, but it's fragile and requires a visible Messages window.

An older syntax — `of service "SMS"` using a string literal — **broke in macOS Big Sur** with error -10002. The enum-based `service type = SMS` syntax replaced it. Another important behavior: AppleScript's `send` command does **not** throw errors when SMS delivery fails. The `on error` block never fires even when messages show "Not Delivered" in the UI, making automated error detection impossible through AppleScript alone.

For Python, the **`mac-imessage`** package (PyPI: `pip install mac_imessage`) wraps this AppleScript with an explicit `send_sms()` function:

```python
import mac_imessage
mac_imessage.send_sms(message='Hello', phone_number='+15555555555')
```

JXA (JavaScript for Automation) provides identical capabilities with JavaScript syntax but has the same limitations — Apple hasn't updated JXA substantially since Yosemite.

---

## The best open-source tools for the job

The landscape of tools has expanded significantly in 2024-2025, driven by the AI agent ecosystem. Here are the most relevant projects, ranked by practicality for a headless Mac Mini SMS server:

**`imsg` by steipete** is the current best-in-class CLI tool. Installable via `brew install steipete/tap/imsg`, it's a Swift-based utility tested over 10+ months with **5,000+ messages at 99.6% delivery rate and 1.2-second average latency**. It reads chat.db in read-only mode for monitoring and uses AppleScript for sending — no private APIs. It supports both iMessage and SMS (with Text Message Forwarding enabled) and includes event-driven watching via filesystem events. Requires macOS 14+, Full Disk Access, and Automation permission.

**BlueBubbles** is the most powerful option if you need a REST API. It runs as an Electron server on the Mac, watches chat.db via TypeORM, sends via AppleScript, and exposes a socket server for client connections. SMS relay is supported — the text box even shows "Text Forwarding" for SMS chats. You can send SMS programmatically via its API: `POST /api/v1/message/text` with `chatGuid: "SMS;-;+1234567890"`. A known bug (GitHub Issue #685): the first SMS to a new contact may silently fail because BlueBubbles attempts iMessage first. Subsequent messages to that contact work correctly. The project has ~851 GitHub stars and is actively maintained. It explicitly supports headless Mac Mini operation with LaunchAgent auto-start.

**`imessage-cli`** by macos-cli-tools offers 44 commands for Messages.app automation in TypeScript/Bun, including send, read, search, watch, and semantic search. It supports SMS when Text Message Forwarding is enabled and ships with Claude Code integration files.

**AirMessage** is simpler than BlueBubbles with native macOS server code (Swift). It supports SMS/MMS alongside iMessage and is easier to set up, though less feature-rich. A rewritten Server 4 is 3x more memory-efficient.

**pypush is broken and irrelevant** — it was a pure Python iMessage protocol reimplementation (no Mac required) but Apple's countermeasures against third-party iMessage clients killed it. It never supported SMS anyway, since SMS requires a cellular radio. The project was acquired by Beeper (now Automattic).

---

## No hidden defaults or debug menus exist for SMS relay

Despite extensive research, **no `defaults write` commands affect SMS relay behavior**. The preference domains `com.apple.MobileSMS`, `com.apple.Messages`, `com.apple.iChat`, and `com.apple.imservice.iMessage` contain no documented or undocumented keys that enable, force, or modify SMS relay. SMS relay configuration is managed entirely by Apple's private `IMDaemon` framework through the iPhone's Text Message Forwarding toggle.

Messages.app has **no debug menu** — unlike Safari or the App Store, there is no `ShowDebugMenu` or `InternalDebug` key. Apple removed most debug menus starting with macOS Sierra. The only plist modification with any community documentation is adding a subject field toggle to `com.apple.MobileSMS.plist`, which is unrelated to SMS relay and reportedly "killed Messages" for some users when improperly applied.

Writing directly to chat.db also **does not trigger outgoing messages**. The database is a log, not a command queue. Inserting a row into the `message` table creates a database entry but the Messages daemon (`IMDaemon`) does not transmit it. The database is protected by kernel-level Mandatory Access Control policies, and all external tools open it in read-only mode.

---

## Remote automation: Shortcuts, Pushcut, and the iPhone-triggering problem

The `shortcuts` CLI on Mac (`shortcuts run "ShortcutName"`) can **only run shortcuts that exist locally on the Mac** — there is no cross-device execution. While shortcut definitions sync via iCloud, personal automations do not, and iPhone-only actions aren't available on Mac. However, a Mac Shortcut containing "Send Message" does work for SMS because the Mac version routes through Text Message Forwarding. Running `shortcuts run "SendSMS"` from cron or a script is a viable approach, though you **cannot explicitly force SMS vs. iMessage** in a Shortcut — the system decides based on recipient capabilities.

There is **no native Apple mechanism to remotely trigger an iPhone Shortcut from a Mac**. SSH to a non-jailbroken iPhone is impossible. URL schemes (`shortcuts://run-shortcut`) are local-device-only. Continuity/Handoff APIs (NSUserActivity) are designed for UI state transfer, not command execution. Apple's automation ecosystem is fundamentally device-local.

**Pushcut Automation Server is the most practical workaround** for webhook-triggered iPhone-side SMS. It turns a dedicated iPhone into an automation server that runs Shortcuts in the background without user interaction. The workflow: Mac Mini script → HTTP POST to `https://api.pushcut.io/[secret]/execute?shortcut=SendSMS` → Pushcut cloud → iPhone runs "Send Message" Shortcut → SMS sent. Pricing is approximately $10-30/year for Pro + Server Extended (up to 5,000 daily requests). Reliability is good but not perfect — the server can occasionally disconnect, and the developer has been actively addressing reconnection issues in 2024-2025 updates.

**The iCloud file monitoring approach** works without any third-party apps: Mac writes a trigger file to iCloud Drive, and an iPhone time-based automation checks the file periodically. The limitation is latency — there's no "file changed" trigger in iOS Shortcuts, so checking happens on a schedule (minimum practical interval is about 30 minutes). An email-based variant (Mac sends email to self → iPhone "When I get an email" automation fires) provides near-real-time triggering but may still require "Ask Before Running" confirmation depending on iOS version.

---

## USB-based tools cannot send SMS — and email gateways are dead

Neither **libimobiledevice** (7,400+ GitHub stars, `brew install libimobiledevice`) nor **pymobiledevice3** (2,144+ stars, `pip install pymobiledevice3`) can send SMS. These tools access iOS lockdown services over USB for device info, backup/restore, app management, syslog, and crash reports — but Apple does not expose SMS sending through any lockdown service. The cellular baseband and iOS sandboxing completely isolate SMS functionality from external access. **There is no jailbreak-free method to send SMS through an iPhone over USB.**

Email-to-SMS carrier gateways (`number@txt.att.net`, `number@tmomail.net`, `number@vtext.com`) are **effectively dead as of 2024-2025**. AT&T officially shut down its gateway on June 17, 2025. T-Mobile's became unreliable in late 2024 and went offline by December 2024. Verizon discontinued theirs earlier. All carriers cite spam abuse as the reason.

Apple introduced a **Critical Messaging API** in iOS 18.4 (February 2025) using `MSCriticalSMSMessenger` — the first Apple API allowing automated SMS sending. However, it's iOS-only (not macOS), requires a special entitlement (`com.apple.developer.messages.critical-messaging`) that must be explicitly approved by Apple, and is restricted to enterprise safety use cases like hazardous-environment check-ins. Not applicable for general automation.

---

## Conclusion: the practical path forward

The most reliable architecture for a 24/7 Mac Mini SMS server is a layered approach. **First, fix the relay itself** — verify the phone number is checked in Messages settings, sign out and back in on both devices, and re-enable Text Message Forwarding. This alone resolves most "Not Delivered" issues. **Second, for programmatic sending**, install `imsg` via Homebrew (`brew install steipete/tap/imsg`) or use the `mac-imessage` Python package — both explicitly support SMS targeting via the `service type = SMS` AppleScript mechanism. **Third, for a REST API**, deploy BlueBubbles server on the Mac Mini with its documented `SMS;-;+number` chatGuid format. For a fully iPhone-side solution triggered by webhooks, Pushcut Automation Server is the only production-viable option.

The hard truth is that every solution depends on Apple's SMS relay working correctly, and Apple treats this as a consumer convenience feature, not a developer platform. Each macOS update risks breaking it. The `send` command provides no delivery confirmation. New contacts require a manual first message. Building anything mission-critical on this stack requires monitoring, retry logic, and a fallback plan — which, given the A2P/10DLC constraints, likely means keeping a spare Android phone with Tasker as an emergency SMS gateway rather than any cloud service.