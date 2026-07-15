# Extension of time to object (s 14ZX TAA 1953) — research notes

Captured 2026-07-15. Supports `Extension of Time Ruleset.md` and
`openfisca_rules/variables/extension_of_time.py`.

## Question being researched

Can the rules engine support and **sense-check** extension-of-time (EOT) decisions
under s 14ZX TAA 1953 — a **discretionary** decision — and thereby ground AI tools
(Copilot-style officer assistants) the way it already grounds the deterministic
objection-rights ruleset?

Framing input: an internal "EOT Copilot" concept pack (screenshots supplied
2026-07-15, not committed — treat as internal) comprising:

- an **analysis scaffold prompt** (facts only → decision readiness → gatekeeper
  rules → PS LA 2003/7 factors → sense-check against decided cases → guidance
  separated from decision; template-lock: *no scoring, matrices or decision
  trees; no factor is determinative; the discretion is evaluative and balancing,
  not mechanical*);
- a **case table** of 14ZX jurisprudence (each case broken down by length of
  delay, explanation, arguable-case treatment, prejudice, conduct/finality,
  outcome, with pinpoint references) — "a closed, traceable authority base" so
  Copilot does not free-generate legal knowledge;
- a **criteria library** ("patterns, not rules"): recurring reasoning patterns —
  explanation must genuinely account for the **whole** delay period; stronger
  explanations include ATO conduct contributing to delay, late discovery of an
  honest mistake, change in authoritative understanding, dispute crystallising
  from later ATO action; weaker ones include ignorance of the law, mere change
  of mind, choosing to negotiate/settle instead of objecting; **length of delay**
  matters but is not a switch (very short delays strongly favour, multi-year
  delays raise records/fairness issues); **"resting on rights"** is a recurring
  red flag; **arguable case** is a low bar — "not unarguable", no full merits
  determination, refusals justified on this factor alone only where the case
  "must fail in law";
- a **Rule Determinism Model**: Level 1 calculated and Level 2 conditional rules
  are safe to encode; Level 3 interpreted rules may be included *selectively*
  with caveats and mandatory references; Level 4 discretionary/judgement rules
  **remain firmly outside scope for rules-as-code delivery**.

## Primary legislative text (verified against local FRL point-in-time data)

Source: `/home/lsimon/Downloads/EPA/site/data/pit.db` (Federal Register of
Legislation point-in-time capture; act `TAA1953`), queried 2026-07-15. Direct
web capture of legislation.gov.au/AustLII/ato.gov.au returned HTTP 403 from this
sandbox (same limitation recorded in `research/README.md`).

### s 14ZW(2)–(3) TAA 1953 (verbatim)

> (2) If the period within which an objection by a person is required to be
> lodged has passed, the person may nevertheless lodge the objection with the
> Commissioner together with a written request asking the Commissioner to deal
> with the objection as if it had been lodged within that period.
>
> (3) The request must state fully and in detail the circumstances concerning,
> and the reasons for, the person's failure to lodge the objection with the
> Commissioner within the required period.

### s 14ZX TAA 1953 (verbatim, complete)

> **14ZX Commissioner to consider applications for extension of time**
>
> (1) After considering the request, the Commissioner must decide whether to
> agree to it or refuse it.
>
> (2) The Commissioner must give the person written notice of the
> Commissioner's decision.
>
> (3) If the Commissioner decides to agree to the request, then, for the
> purposes of this Part, the objection is taken to have been lodged with the
> Commissioner within the required period.
>
> (4) If the Commissioner decides to refuse the request, the person may apply
> to the Tribunal for review of the decision.

### Points confirmed

- The **discretion itself is unconfined on the face of the statute**: s 14ZX(1)
  says only "agree to it or refuse it". Everything about *how* to weigh is
  administrative guidance (PS LA 2003/7) and case law — i.e. Level 3/4 in the
  determinism model, not statute.
- The **gatekeepers are statutory and deterministic** (Level 1–2): an EOT
  question only exists where (a) the decision carries an objection right at all
  (s 14ZL + provision-specific rights — already encoded), (b) the objection
  period has ended (s 14ZW(1) — already encoded as `objection_deadline`),
  (c) the extension mechanism applies to that decision family (the s 14ZW(1A)
  private-ruling bar is worded absolutely — existing ruleset rule 1.3.2), and
  (d) the request is **written** and states the circumstances/reasons **fully
  and in detail** (s 14ZW(2)–(3)).
- **If refused**: ART review right under s 14ZX(4) (already encoded as the
  `objection_extension_refusal` pathway). Refusal itself carries **no**
  objection right (existing ruleset rule 1.1.8).
- **No deemed-refusal clock for EOT requests.** s 14ZYA (person may require the
  Commissioner to decide) applies to *objection decisions*; s 14ZYB's 60-day
  deemed disallowance applies to objections under ss 155-30(2)/359-50(3)
  Sch 1 (failure to assess / failure to rule), not to s 14ZX requests. Do not
  encode any deadline on the Commissioner's s 14ZX decision.

## PS LA 2003/7 — factors (VERIFIED against full text, 2026-07-15)

PS LA 2003/7 *How to treat a request to lodge a late objection* (ATO legal
database Doc ID PSR/PS20037/NAT/ATO/00001; issued 30 July 2003, current, not
withdrawn). ato.gov.au returns HTTP 403 to this sandbox, but the **full text is
in the EPA project's local ATOLaw dataset**
(`/home/lsimon/Downloads/EPA/EV_Data/law_admin_practice_statements_all.jsonl`,
key `Statement_Reference == 'PS LA 2003/7'`) — captured verbatim to
`sources/ps-la-2003-7.md`. That dataset also holds ATO interpretative
decisions, decision impact statements, edited private advice and legislative
instruments — use it first for any ATOLaw content before fighting the 403.

Key paragraphs: [5]–[7] (how a late objection + request comes before the
Commissioner; an inadequate explanation prompts an invitation for more
information and must not be the sole refusal ground; a request without an
objection cannot be considered), [10] (the factor list), [11] (circumstances
generally warranting extension — illness, absence, non-receipt, futility
corrected by later events, ATO conduct, adviser negligence despite prompt
instructions, vulnerability incl. family violence, arguable case within 4 years
for 2-year taxpayers), [12] (circumstances generally against — no explanation
despite prompts, change of adviser alone, excessive unexplained delay, lost
records/decision-maker, fairness/efficiency, public interest in settled
matters, taxpayer's own decision despite advisers, no arguable case), [13]–[14]
(written notice of refusal; record all factors and their weighting), [15] (ART
review), [16] (*Brown v CoT* [1999] FCA 563 is the leading case).

The paragraph 10 balance (no single factor determinative):

1. the taxpayer's **explanation** for not lodging in time — and whether it
   accounts for the **whole** period of the delay;
2. the **duration of the delay** (years require a better explanation than days);
3. the extent to which the taxpayer **kept the ATO informed** of disagreement /
   took steps to contest (converse: "resting on rights");
4. whether an **adviser's negligent failure** contributed;
5. whether the taxpayer has an **arguable case** on the objection (no
   full-scale merits investigation — a low bar);
6. **prejudice to the Commissioner** from the delay in properly dealing with
   the dispute (administrative inconvenience is *not* prejudice);
7. fairness/consistency considerations relative to taxpayers in like positions.

Officers must record all factors considered and how they weighed them
(PS LA 2003/7 [14]). The underlying principles trace to *Hunter Valley
Developments Pty Ltd v Cohen* (1984) 3 FCR 344 as applied in the tax EOT
context — the verified, URL-sourced authority base is in **`case-table.md`**
(core: *Brown* [1999] FCA 563 and the Full Court; *Windshuttle* (1993) 46 FCR
235; *CoT v Primary Health Care* [2017] FCAFC 131; HCA principle: *Brisbane
South v Taylor* (1996) 186 CLR 541).

**Design consequence of the full-text verification:** the first cut of the
ruleset gated `eot_discretion_engaged` on BOTH s 14ZW(2) (written request) and
s 14ZW(3) (fully and in detail). PS LA 2003/7 [6] shows practice treats an
inadequate statement as a prompt to seek further information, never as a
nullity or a standalone refusal ground — so the ruleset was corrected
2026-07-15: only the written-request requirement gates engagement, and a new
`eot_prompt_seek_further_information` output implements paragraph [6].

## Determination — what is and is not encodable

| Determinism level | s 14ZX content | Engine role |
| --- | --- | --- |
| 1 Calculated | days late; deadline arithmetic (already encoded) | compute |
| 2 Conditional | objection right; period ended; mechanism available; request formalities; ART review on refusal | decide deterministically |
| 3 Interpreted | factor *findings* (explanation covers whole period? arguable? concrete prejudice?) once a human has made them; descriptive delay banding per the criteria library | structure + record + cite; caveated |
| 4 Discretionary | the weighing / grant-or-refuse outcome | **never computed** — engine exposes no outcome variable; it can only flag a *proposed* human outcome as atypical against the criteria-library patterns |

The sense-check design: the officer's proposed outcome is an **input**; the
engine deterministically flags (a) proposals made where the discretion is not
even engaged (jurisdictional error — the highest-value hard rule), and
(b) proposals whose factor profile is atypical against the criteria-library
patterns (prompting better articulation, never overriding judgement). This
mirrors the scaffold's own template-lock and keeps Level 4 out of the engine.

## Sources

| Source | Where | Captured |
| --- | --- | --- |
| s 14ZW, s 14ZX, s 14ZYA/B TAA 1953 (current compilation) | local FRL point-in-time db (`pit.db`, act TAA1953) | 2026-07-15 |
| PS LA 2003/7 **full text** | EPA local ATOLaw dataset (`law_admin_practice_statements_all.jsonl`) → `sources/ps-la-2003-7.md`; canonical URL https://www.ato.gov.au/law/view/document?Docid=PSR%2FPS20037%2FNAT%2FATO%2F00001 | 2026-07-15 |
| Case authority base (FCA/FCAFC/HCA + adjacent) | `case-table.md` — per-case URLs (AustLII/Jade/ATO-hosted PDFs), verified via multiple search sources | 2026-07-15 |
| Internal EOT Copilot pack (scaffold, case table, criteria library, determinism model) | screenshots supplied by user — **internal, not committed** | 2026-07-15 |

## Open items before reliance

- ~~Verify the factor list against the full text of PS LA 2003/7~~ — done
  2026-07-15 from the local ATOLaw capture (`sources/ps-la-2003-7.md`).
- Tax specialist review of `Extension of Time Ruleset.md`, especially the
  atypical-profile flag definitions (they paraphrase the internal criteria
  library, which is itself "patterns, not rules").
- Click-verify the AustLII/Jade URLs in `case-table.md` from a browser
  (Cloudflare blocks this sandbox), resolve the two ⚠ neutral-citation items
  (Hunter Valley FCA 176 vs Jade 186; Full Court Brown [1999] FCA 1198), and
  URL-verify the internal-pack AAT cases before adding them.
- Sweep published ART (ARTA) decisions for post-Oct-2024 s 14ZX refusals.
