# Voice AI cold calling platforms for B2B law firm outreach

**Retell AI and a DIY Twilio + OpenAI Realtime stack emerge as the two strongest options for cold calling PI law firms on office landlines — but the legal landscape demands extreme caution.** The FCC's February 2024 ruling classifying AI voices as "artificial" under TCPA means every platform in this space carries regulatory risk, though a legitimate B2B business-landline exemption provides a narrow legal path. After researching all seven platforms, reviewing community feedback across Reddit, G2, and Trustpilot, and analyzing DIY alternatives, the field narrows quickly: Air AI is defunct after an FTC fraud settlement, GoHighLevel blocks cold calling at the platform level, and Bland AI explicitly prohibits the use case in its own terms of service.

---

## The seven platforms ranked for this exact use case

### Tier 1: Production-ready for outbound calling

**Retell AI** stands out as the most purpose-built option for outbound phone campaigns. Pricing starts at **$0.07/min base** but the realistic all-in cost runs **$0.10–$0.19/min** depending on LLM and voice selection. A budget configuration (Retell Platform Voice + GPT-4.1 mini + Retell telephony) hits roughly **$0.10/min**, while a premium stack (ElevenLabs voice + Claude 4.5 Sonnet) reaches ~$0.19/min. Retell has **built-in telephony** via managed Twilio/Telnyx numbers at $2/month each, or you can bring your own SIP trunk for free. Latency benchmarks at approximately **600ms round-trip** — the fastest among hosted platforms and the threshold where conversations feel natural. The warm transfer implementation is best-in-class: cold transfer, warm transfer with whisper briefing, and an "agentic" warm transfer where a dedicated AI assistant checks human availability before bridging. Retell supports batch calling for high-volume campaigns, **branded caller ID** ($0.10/outbound call), and verified phone numbers to combat spam flagging. G2 rating sits at **4.8/5 across 1,420+ reviews**, the largest review count in the category. The main drawback is complexity — it's a developer toolkit at heart, though a no-code flow builder has been added.

**Vapi** offers the most **LLM flexibility** in the market — 35+ models from 16+ providers including GPT-4o, Claude, Gemini, and any OpenAI-compatible endpoint. The headline $0.05/min rate is misleading; true all-in cost runs **$0.13–$0.33/min** after adding STT (~$0.01), LLM (~$0.02–$0.20), TTS (~$0.01–$0.065), and telephony (~$0.008–$0.014). An optimized budget stack (Deepgram + GPT-4o-mini + Deepgram Aura + Telnyx) lands around **$0.13/min**. Latency achieves **sub-500ms** when optimized, though typical performance runs 500–800ms. Vapi requires external telephony (Twilio, Telnyx, or Vonage) for production — it provides free US numbers but with limited outbound capacity. Live transfer supports blind, warm, and AI-assisted modes, though warm transfer requires Twilio specifically. Critically, Vapi **does not explicitly prohibit cold calling** in its terms (unlike Bland), though its TCPA consent guide warns about compliance obligations. The platform is developer-heavy and the multi-vendor billing across 4–5 separate providers is the top user complaint.

### Tier 2: Viable with trade-offs

**ElevenLabs Conversational AI** brings **industry-leading voice quality** — ranked #1 globally in human preference evaluations — to the phone calling space. Pricing runs **$0.08–$0.10/min** on paid plans (cut by ~50% in February 2025), plus Twilio telephony costs (~$0.015/min), landing at roughly **$0.12–$0.14/min total**. LLM costs are currently absorbed by ElevenLabs but will eventually be passed through. The platform requires **external telephony** (Twilio, Telnyx, or SIP trunk) — there are no built-in phone numbers. Latency runs **600–900ms** depending on model choice, with Flash v2.5 optimized for lowest latency. The Expressive Mode on Eleven v3 adapts emotional tone to conversational context — a genuine differentiator for cold calling where detecting frustration matters. Live transfer supports conference, blind, and SIP REFER modes. However, the agent orchestration features are **less mature than Retell's** (launched late 2024 vs. Retell's 40M+ calls/month track record), and cold-calling-specific tooling like branded caller ID and safe-dial pacing is absent. The strongest play is using ElevenLabs voices *through* Retell or Vapi — getting the best voice quality on the most capable platform.

**Synthflow** is the clear winner for **non-technical users**. True no-code drag-and-drop agent building, deployable in ~30 minutes. The Pro plan costs **$375/month for 2,000 included minutes** (~$0.19/min effective), with overage at $0.12–$0.13/min. Synthflow has its own telephony infrastructure — no Twilio required. Latency averages around **400ms** per third-party testing. The platform supports cold, warm, and contextual-summary transfers. However, G2 reviews consistently note that **when conversations go off-script, the agent loses track** and defaults to canned responses — a serious concern for cold calling hostile law firm gatekeepers. Reddit users report "bait and switch" pricing where basic plan features feel "crippled." Customer support is widely criticized as slow and lacking technical depth.

### Tier 3: Not viable for this use case

**Bland AI** explicitly states on its own blog (February 2025): *"Utilizing Bland for AI outbound calling campaigns, especially for cold calling, is NOT permissible."* New December 2025 pricing raised rates to **$0.11–$0.14/min** (up from the old $0.09 flat rate), with an additional $0.015 charge per failed outbound attempt. Latency averages **~800ms** — the slowest among major platforms — with spikes reaching 2.5 seconds. The Conversational Pathways system is more scripted-flow than LLM-driven reasoning, making dynamic objection handling weaker than Vapi or Retell. Customer support rated **3.0/5** across review aggregators. Despite $65M in funding and enterprise clients, the explicit cold-calling prohibition makes it unusable for this scenario.

**GoHighLevel Voice AI** enforces **opt-in verification at the platform level** — it will reject any outbound call to a contact who hasn't opted in through a HighLevel form. A product team member confirmed: *"Not for cold calling, only to consented users."* Cost runs ~$0.08–$0.13/min on top of the $97–$297/month base subscription. The compliance features are excellent (automated KYC, DNC checks, calling-hour enforcement), but they're designed to prevent exactly the use case described here. GoHighLevel would become relevant if the user pivoted to calling **opted-in leads** from advertising campaigns.

**Air AI** is effectively **defunct**. The FTC filed a federal lawsuit in August 2025 alleging a **$19 million fraud scheme**, and the company settled in March 2026 with owners banned from marketing business opportunities. Trustpilot rating: **1.2/5** with 98% one-star reviews. Users report losses of $15,000–$250,000 with no functional product. In hands-on testing, the AI showed multi-second response delays, talked to voicemails thinking they were humans, and repeatedly ignored prospect requests. Zero current employees listed on RepVue as of February 2026.

---

## DIY alternatives deliver the lowest cost per minute

**Twilio + OpenAI Realtime API** is the most cost-effective path and surprisingly accessible. Twilio published an official Python tutorial with a copy-paste starter repo that gets a working voice agent running in 2–4 hours. The architecture pipes phone audio through Twilio Media Streams via WebSocket to OpenAI's speech-to-speech Realtime API, eliminating the traditional STT→LLM→TTS triple-handoff. Using the **gpt-4o-mini-realtime** model, total cost lands at roughly **$0.04–$0.05/min** (OpenAI audio: ~$0.025/min + Twilio outbound: $0.014/min). The premium gpt-4o-realtime model costs ~$0.18–$0.20/min but offers superior reasoning. Latency hits **450–800ms** voice-to-voice — competitive with or better than hosted platforms. Live transfer works through Twilio's Conference or Programmable SIP, and OpenAI Realtime supports function calling to trigger transfers programmatically. The limitation is you're locked into OpenAI's built-in voices (alloy, echo, fable, onyx, nova, shimmer) — no custom voice cloning. For a beginner Python developer with a Mac Mini, this is achievable with ngrok for webhook tunneling and ~$20 in startup costs.

**LiveKit Agents** offers maximum flexibility as an **open-source (Apache 2.0)** framework with 9,800+ GitHub stars. It supports any combination of STT, LLM, and TTS providers — meaning you can pair Deepgram transcription with GPT-4.1 mini reasoning and ElevenLabs voice cloning. PSTN calling works via LiveKit's own phone numbers or any SIP trunk (Twilio, Telnyx). An economy stack costs approximately **$0.05–$0.08/min**, and a premium stack with ElevenLabs TTS runs $0.07–$0.12/min. LiveKit Cloud's free tier includes 1,000 agent minutes and 1,000 SIP minutes — enough for substantial testing. Latency runs **600–1,000ms** with the modular pipeline. The trade-off is higher setup complexity — configuring SIP trunks, dispatch rules, and the room/participant model requires more engineering than the Twilio+OpenAI approach. However, the ability to use ElevenLabs voice cloning while keeping costs under $0.10/min makes this the best option for someone who wants a custom European-accented voice at low cost.

---

## TCPA compliance creates a narrow but defensible legal path

The **strongest legal argument** for this use case rests on a gap in the TCPA statute. Section 227(b)(1)(A) covers cell phones and Section 227(b)(1)(B) covers "residential telephone lines" — but **neither section expressly covers pure business landlines**. This means AI voice calls to verified business landlines technically fall outside the TCPA's core consent requirements. Leading TCPA attorney Eric Troutman (TCPAWorld) acknowledges this gap but warns that the **caller bears the burden of proving** the number is a business landline, and "just because ZoomInfo says so isn't likely enough." Law firm office numbers published on state bar listings and firm websites are among the most verifiable business numbers available.

The **FCC's February 8, 2024 Declaratory Ruling** (FCC-24-17) confirmed that AI-generated voices are "artificial" under TCPA, meaning all existing TCPA restrictions for prerecorded/artificial voice calls now apply to AI calls. This doesn't create new restrictions for business landlines specifically — it simply ensures AI voices can't escape existing rules through a technicality. The ruling explicitly states the TCPA "does not allow for any carve out of technologies that purport to provide the equivalent of a live agent."

Even with the business-landline exemption, **Section 227(d) requirements still apply to all artificial voice calls**: the AI must identify the caller's business name at the beginning and provide a callback number. The FTC's March 2024 TSR expansion now covers B2B calls for misrepresentation prohibitions, with **5-year recordkeeping requirements** for call details.

**State laws dramatically increase risk.** Florida's FTSA requires prior express written consent for automated solicitations regardless of B2B status and imposes $500 per violation (trebled for willful violations). California's AB-2905 (effective January 2025) mandates AI disclosure at the call's outset. Texas SB 140 (effective September 2025) requires AI disclosure within 30 seconds and makes voice cloning without consent illegal with $1,000–$10,000 per violation penalties. New York's "Seinfeld Law" (effective January 2025) requires identification within 30 seconds and DNC opt-out at the outset, with fines up to $20,000 per violation.

**Calling law firms multiplies the risk exponentially.** PI attorneys are experienced litigators who handle contingency cases and understand TCPA damages models. Per-call damages range from $500–$1,500. TCPA class actions surged **285%** in September 2025 alone. A systematic AI calling campaign targeting hundreds of firms could be aggregated into a class action with devastating exposure.

---

## Voice cloning works best through ElevenLabs Professional

For a male voice with a slight European accent, **ElevenLabs Professional Voice Cloning (PVC)** on the Creator plan ($22/month) is the clear recommendation. PVC trains a dedicated model on 30+ minutes (ideally 2–3 hours) of audio, capturing nuanced accent characteristics, cadence, and breathing patterns that Instant Voice Cloning (IVC) misses. IVC uses pattern matching against training data and struggles with unique accents since it relies on "similar voices it has heard before." The quality difference is substantial for production cold calling where voice credibility determines whether prospects hang up in the first 3 seconds.

Cross-platform compatibility is strong: ElevenLabs cloned voices integrate directly with **Vapi** (add API key in dashboard, reference voiceId in config) and **Retell AI** (paste Voice ID, $0.04/min TTS cost). Bland AI doesn't offer direct ElevenLabs integration — it uses proprietary voices with beta cloning at $200–$300/month extra. LiveKit Agents supports ElevenLabs as a TTS plugin natively. PlayHT offers cheaper cloning ($31.20/month) from only 30 seconds of audio, but quality is consistently rated below ElevenLabs, reliability issues are well-documented, and there are indications PlayHT may have ceased operations.

Cloning your own voice is **legal** for commercial use. Cloning someone else's voice requires explicit consent and violates multiple state laws without it. The FCC's pending July 2024 NPRM proposes requiring explicit AI disclosure and separate AI-specific consent in consent forms — while not yet final, the direction is clear.

---

## Ranked recommendations with cost estimates

The following ranking assumes 100 outbound calls averaging 2 minutes each (200 total minutes) to PI law firm office landlines. Monthly platform fees are amortized assuming ~1,000 calls/month total operation.

| Rank | Platform | Cost per 100 calls | Setup difficulty | Why |
|------|----------|-------------------|-----------------|-----|
| **1** | **Twilio + OpenAI mini-realtime** | **~$9–$10** | Moderate | Lowest cost, official tutorial, 500ms latency, beginner-accessible |
| **2** | **Retell AI (budget config)** | **~$20–$24** | Moderate | Best compliance tooling, branded caller ID, 600ms latency, production-proven |
| **3** | **LiveKit + economy stack** | **~$10–$16** | High | Open source, any voice/LLM, ElevenLabs cloning compatible, lowest vendor lock-in |
| **4** | **Retell AI + ElevenLabs voice** | **~$30–$38** | Moderate | Best voice quality on best platform, ideal for credibility with attorneys |
| **5** | **Vapi (optimized stack)** | **~$26–$34** | High | Maximum LLM flexibility, strong objection handling, complex billing |
| **6** | **ElevenLabs standalone** | **~$24–$28** | Moderate-High | Best voice, newer agent platform, requires Twilio setup |
| **7** | **Synthflow Pro** | **~$26–$38** | Low | Easiest setup, no-code, struggles off-script |
| — | Bland AI | N/A | — | Explicitly prohibits cold calling in TOS |
| — | GoHighLevel | N/A | — | Platform blocks non-opted-in outbound calls |
| — | Air AI | N/A | — | FTC fraud settlement, effectively defunct |

---

## The recommended implementation path

Given the user's setup (Mac Mini, beginner Python, HighLevel account, ElevenLabs API key, OpenAI API key, willingness to set up Twilio), the optimal path unfolds in three phases.

**Phase 1 — Prototype with Twilio + OpenAI Realtime (Week 1).** Follow Twilio's official Python outbound calling tutorial. Use gpt-4o-mini-realtime at ~$0.04/min. Run on the Mac Mini with ngrok. Total startup cost: ~$20 (Twilio number + credits). Test with 10–20 calls to friendly contacts to validate conversation quality, latency, and transfer mechanics. This proves the concept at minimal cost.

**Phase 2 — Upgrade to Retell AI for production (Week 2–3).** Move to Retell for branded caller ID, verified phone numbers, batch calling, and compliance tooling. Import the ElevenLabs PVC voice ($0.04/min TTS) for the European-accented male voice. Use GPT-4.1 mini for cost-effective reasoning. Total cost: ~$0.15/min. Register Twilio numbers, configure STIR/SHAKEN attestation, and set up the warm transfer flow to hand qualified prospects to a live closer.

**Phase 3 — Scale carefully with legal guardrails (Week 4+).** Before scaling beyond test calls, consult a TCPA attorney (budget $500–$1,500 for a consultation). Verify every target number is a published business landline. Build a compliance checklist: AI discloses identity and business name within the first sentence, provides callback number, offers opt-out, maintains internal DNC list, restricts calling hours to 10AM–6PM local time. Start with a small campaign of 20–50 firms in states with less restrictive telemarketing laws (avoid Florida and Texas initially). Track complaint rates rigorously — a single TCPA demand letter should trigger an immediate pause for legal review.

---

## What the realistic risk-reward looks like

The business-landline exemption provides a **defensible but untested** legal position for AI cold calling law firms. No court has specifically ruled on AI voice calls to verified business landlines post-FCC-2024-ruling. The user is operating in a legal gray zone where the technical reading of the statute favors them, but the practical risk of calling litigators who specialize in personal injury (and understand damages) is severe. A single antagonized PI firm could file a TCPA suit with **$500–$1,500 per call** in statutory damages. At 100 calls, maximum exposure reaches $150,000 before attorney fees.

The safer evolution of this strategy is a **hybrid model**: use AI for initial research and qualification (identifying which firms handle PI cases, finding the right contact), then use AI for warm outreach to firms that have shown some intent signal (visited your website, downloaded a resource, responded to an email). This converts the use case from cold calling to opted-in outbound — which GoHighLevel's compliant infrastructure handles excellently and which eliminates virtually all TCPA risk while still leveraging AI voice technology to scale the operation.