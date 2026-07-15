# Objection rights research — sources and capture status

Phase 1 working folder. Everything encoded in `openfisca_rules/variables/objections.py`
must trace back to a row of `decision-inventory.md`, and every row must trace back to a
source listed here.

## ⚠️ Status: DRAFT — pending tax specialist review

This research was drafted on **2026-07-06** from the sources below. The original
development environment's network policy blocked full-page capture of ato.gov.au,
AustLII and legislation.gov.au (HTTP 403 at the proxy), so section texts were initially
verified via search excerpts only.

On **2026-07-06** (later the same day, from a local machine) the primary legislative
text below was re-verified against full provision text pulled from a local
`legislation.gov.au` scrape (`frl_principal_legislation_all.csv`, EPA project,
`Compilation_PiT = latest`) rather than search excerpts. This resolved several of the
VERIFY flags below and surfaced two encoding errors (see "Findings from primary-text
verification"). It does **not** replace tax specialist sign-off — remaining open items:

1. Re-run this same primary-text check against a **dated compilation** (not just
   `latest`) if the ruleset needs to be correct as at a specific past date.
2. Have a tax technical specialist verify every row of `decision-inventory.md`,
   especially the still-open VERIFY items below.
3. Only then remove the draft banners here and in `Objection Rights Ruleset.md`.

## Primary sources (legislation)

All URLs point to the Federal Register of Legislation (`legislation.gov.au`), the
authoritative government source. (AustLII's `classic.austlii.edu.au` mirror, used in
the first draft, blocks scripted fetches with a Cloudflare challenge — this is a site
policy, not specific to any one environment.)

| Source | What it establishes | URL |
|---|---|---|
| TAA 1953 s 14ZL | What a "taxation objection" is; Part IVC applies where an Act provides that a person dissatisfied with a decision "may object … in the manner set out in this Part" | https://www.legislation.gov.au/C1953A00001/latest/text#s14ZL |
| TAA 1953 s 14ZQ | Definitions for Part IVC, incl. "ART" = Administrative Review Tribunal (ART Act 2024) | https://www.legislation.gov.au/C1953A00001/latest/text#s14ZQ |
| TAA 1953 s 14ZU | How objections must be made (approved form, in writing, state grounds fully and in detail) | https://www.legislation.gov.au/C1953A00001/latest/text#s14ZU |
| TAA 1953 s 14ZV | Objection against an amended assessment/determination is limited to the alterations or additions made by the amendment | https://www.legislation.gov.au/C1953A00001/latest/text#s14ZV |
| TAA 1953 s 14ZW | **Time limits.** Confirmed by full text (2026-07-06): para (aa) income tax — 2 years if s 170(1) items 1/2/3/3A apply, else 4 years; para (bg) GST/LCT/WET etc. net-amount assessments (Subdivision 155-C) — the "period of review" under s 155-35(2)(a) = **4 years**; para (aac) excess concessional contributions determinations (s 97-10 Sch 1) — **same period as objecting to the related income tax assessment under s 175A**, not a flat 60 days (see finding below); subss (1B)/(1BA) — "later of" rules for amended assessments; para (c) — 60 days catch-all | https://www.legislation.gov.au/C1953A00001/latest/text#s14ZW |
| TAA 1953 s 14ZX | Request for extension of time to lodge a late objection; Commissioner's refusal is reviewable by the ART (not objectable) | https://www.legislation.gov.au/C1953A00001/latest/text#s14ZX |
| TAA 1953 ss 14ZY–14ZZ | Objection decision; dissatisfied person may apply to the ART for review or appeal to the Federal Court | https://www.legislation.gov.au/C1953A00001/latest/text#s14ZY |
| ITAA 1936 s 175A | Right to object against an income tax assessment | https://www.legislation.gov.au/C1936A00027/latest/text#s175A |
| ITAA 1936 s 170(1) table | Amendment periods. Confirmed by full text: items 1–3 (individuals/companies/trustees that are small/medium business entities, with scheme/complexity carve-outs) → 2 years; item 4 (everyone else) → 4 years; item 3A (SBE/MBE-initiated late amendment application) → 4 years; item 5 (fraud/evasion) → unlimited; item 6 (giving effect to a review/objection outcome) → unlimited. Drives the 2yr/4yr objection split in s 14ZW(1)(aa) | https://www.legislation.gov.au/C1936A00027/latest/text#s170 |
| TAA 1953 Sch 1 s 359-60 | Objection against a private ruling; confirmed by full text: **not available if there is an assessment for the year/period the ruling relates to** (s 359-60(3)(a)), or if it relates to withholding tax already due and payable, or to a reviewable excise decision | https://www.legislation.gov.au/C1953A00001/latest/text#s359-60 |
| TAA 1953 Sch 1 s 280-170 | Objection against a shortfall interest charge (SIC) remission decision. Confirmed by full text, verbatim: objectable "if the amount of the charge that was not remitted is more than 20% of the additional amount" | https://www.legislation.gov.au/C1953A00001/latest/text#s280-170 |
| TAA 1953 Sch 1 ss 97-5, 97-10 | Excess concessional contributions determination (s 97-5) and its review right (s 97-10): "you may object against the determination in the manner set out in Part IVC" — time limit set by s 14ZW(1)(aac), see finding below | https://www.legislation.gov.au/C1953A00001/latest/text#s97-10 |

## Secondary sources (ATO guidance — the decision-tree content)

The ATO eligibility URL below was re-checked on 2026-07-06 and now 301-redirects to a
restructured, JS-driven "Check if you're eligible" tool page rather than a static
decisions/time-limits table — the citation is kept as the ATO's current landing page
for this topic, but its content should not be assumed to match the earlier description.

| Source | What it establishes | URL |
|---|---|---|
| ATO — Eligibility to lodge an objection | ATO's current landing page for objection eligibility (interactive tool; redirected from the original "decisions-you-can-object-to-and-time-limits" URL) | https://www.ato.gov.au/individuals-and-families/your-tax-return/if-you-disagree-with-an-ato-decision/object-to-a-decision/eligibility-to-lodge-an-objection |
| ATO — Remission of interest charges | Confirmed by full-page fetch (2026-07-06): "The law doesn't allow you to object to the GIC" (no objection right); SIC remission objectable above the 20% threshold | https://www.ato.gov.au/individuals-and-families/your-tax-return/if-you-disagree-with-an-ato-decision/dispute-interest-or-penalties/remission-of-interest-charges |
| ATO — Super guarantee charge amendments or objections | Confirmed by full-page fetch (2026-07-06): "You can object to your assessment within 60 days of the date it was made"; amendment request within 4 years; GIC on unpaid SGC is not objectable | https://www.ato.gov.au/businesses-and-organisations/super-for-employers/quarterly-super-to-30-june-2026/missed-and-late-super-guarantee-payments/the-super-guarantee-charge/super-guarantee-charge-amendments-or-objections |
| ATO — FBT guide for employers (objections chapter) | FBT assessments: 4 years; amended FBT: later of 4 years from original / 60 days from amended notice | https://www.ato.gov.au/law/view/view.htm?docid=SAV%2FFBTGEMP%2F00004 |
| ATO PS LA 2003/7 | How the ATO treats late objections and extension requests | https://www.ato.gov.au/law/view/document?docid=psr%2Fps20037%2Fnat%2Fato%2F00001 |
| ATO TR 2011/5 | Confirmed by full-page fetch (2026-07-06), ¶5–7: history of the 60-day → 4-year → 2yr/4yr-split evolution of the income tax objection period, corresponding to the amendment period under s 170 | https://www.ato.gov.au/law/view/document?DocID=TXR/TR20115/NAT/ATO/00001 |

## Context

- The **Administrative Review Tribunal (ART)** replaced the AAT from 14 October 2024;
  external review references use the ART. Confirmed by s 14ZQ definitions.
- Primary legislative text for all provisions above was pulled from a local
  `legislation.gov.au` "latest compilation" scrape (EPA project,
  `frl_principal_legislation_all.csv`) on 2026-07-06 and cross-checked against a live
  re-fetch of the same URLs. AustLII remains unreachable by script (Cloudflare
  challenge); `legislation.gov.au`'s own search UI is a JS SPA and can't be scraped
  without a browser, but direct provision URLs (`/<FRL-ID>/latest/text#<section>`)
  are static and fetchable.

## Findings from primary-text verification (2026-07-06)

Two likely **encoding errors**, found by reading the full text of s 14ZW rather than
relying on secondary summaries — not yet fixed in `objections.py`, pending a decision
on scope (see conversation):

- **Excess concessional contributions determination time limit is wrong.**
  `decision-inventory.md` row 8 encodes this as a flat 60 days after the determination.
  The actual rule (s 97-10 Sch 1 → s 14ZW(1)(aac)) is: the objection must be lodged
  **within the same period the person would have to object to their income tax
  assessment for that year under s 175A** — i.e. the same 2yr/4yr-from-notice logic as
  ordinary income tax objections, not a fixed 60-day/date-of-determination rule. Fixing
  this properly needs a new relationship (the related assessment's notice date and the
  taxpayer's 2yr/4yr category), not just a parameter tweak.
- **Private ruling deadline's 4-year limb should also split 2yr/4yr by taxpayer kind.**
  `objection_deadline`'s private-ruling branch treats the fallback limb as a flat
  4 years after the return due date. s 14ZW(1A)(b) actually mirrors the income tax
  split: 2 years after the return due date if s 170(1) items 1/2/3/3A apply to the
  taxpayer, else 4 years. Individuals/SBEs currently get an overstated deadline for
  private ruling objections.

## VERIFY flags — resolved

- ~~GST assessment 4-year limit~~ — **confirmed**. GST net-amount assessments are an
  "assessable amount" under s 155-5(2)(a) Sch 1; s 14ZW(1)(bg) sets their objection
  period as the "period of review" under s 155-35(2)(a) Sch 1, which is 4 years after
  notice. Matches the inventory.
- ~~SIC 20% threshold~~ — **confirmed verbatim** in s 280-170 Sch 1.
- ~~Private ruling "no assessment yet" gate~~ — **confirmed verbatim** in s 359-60(3)(a).
- ~~Excess concessional contributions determination basis~~ — **resolved, but the
  encoded limit was wrong** — see finding above; correct legal basis is s 97-5/97-10
  Sch 1 + s 14ZW(1)(aac), not a standalone 60-day rule.

## VERIFY flags — still open

- **No extension of time for late private-ruling objections.** The general extension
  mechanism (s 14ZW(2)–(4), s 14ZX) is worded as relief from a duty to lodge "within" a
  period (s 14ZW(1)). Private ruling deadlines are instead worded as an absolute bar —
  "cannot lodge … after the end of" (s 14ZW(1A)/(1AAC)) — which may or may not fall
  within the s 14ZW(2) extension mechanism's scope. The statute doesn't say this in so
  many words either way; this is a genuine drafting-interpretation question for a tax
  specialist, not something resolvable by re-reading the section text again.
- **"2 years/4 years after" anniversary-date convention** (incl. 29 Feb → 28 Feb) —
  s 14ZW itself doesn't spell out day-counting mechanics; this rests on the *Acts
  Interpretation Act 1901* general rules, not on TAA/ITAA text. Still needs specialist
  confirmation of the statutory end-day interpretation.
