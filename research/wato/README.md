# Working Australians Tax Offset (WATO) research — sources and capture status

Phase 1 working folder for the WATO ruleset. Everything encoded in
`openfisca_rules/variables/wato.py` must trace back to a row of `rule-inventory.md`,
and every row must trace back to a source listed here.

## Status: primary-source verified 2026-07-10 — tax specialist review still recommended

Unlike the objection-rights research (search-excerpt-only first draft), this ruleset
was drafted **directly from the enacted text**: Schedule 3 of the Treasury Laws
Amendment (Tax Reform No. 1) Act 2026 was pulled in full from the Federal Register of
Legislation on 2026-07-10 (see `sources/`). The measure is **enacted but not yet in
effect** — it applies to assessments for the **2027-28 income year and later**
(Schedule 3, Part 2).

Remaining open items before reliance:

1. The register's epub rendition does not render the s 61-155(2) formula image; the
   formula *labour amounts − labour deductions* is inferred from the surrounding
   defined terms and budget materials. Cross-check against the authorised PDF.
2. The defined term **"assessable labour income"** (s 995-1 ITAA 1997, inserted by the
   same Act) was not separately captured — the ruleset takes it as salary, wages,
   allowances and similar remuneration from employment. Verify the inserted definition.
3. Have a tax technical specialist review `rule-inventory.md` and the ruleset markdown,
   especially the treatment of the s 61-160(b) "basic income tax liability" hypothetical
   (this ruleset computes it with the resident basic rate scale only — no Medicare levy,
   no other offsets — which matches the s 4-10(3) ITAA 1997 meaning of "basic income
   tax liability", but the boundary deserves sign-off).

## Primary sources (legislation)

| Source | What it establishes | URL |
|---|---|---|
| Treasury Laws Amendment (Tax Reform No. 1) Act 2026 (No. 49, 2026), Schedule 3 | The whole measure: new Subdivision 61-E ITAA 1997 (ss 61-150, 61-155, 61-160), the s 63-10(1) non-refundable/non-transferable/no-carry-forward item, s 13-1 index entry, application to 2027-28+ assessments. Captured in full — `sources/act-c2026a00049-schedule-3-wato.md` | https://www.legislation.gov.au/C2026A00049/asmade/text |
| Income Tax Rates Act 1986 | The "tax-free threshold" ($18,200) that net labour income must exceed (s 61-155(1)(b)), and the resident rate scale used for the s 61-160(b) cap — 14% first marginal rate from 1 July 2027 (as amended by the 2025 cost-of-living tax cut Acts: 16% → 15% on 1 July 2026 → 14% on 1 July 2027) | https://www.legislation.gov.au/C2004A03437/latest/text |
| ITAA 1997 s 83A-25 | ESS discounts included in assessable income — labour amounts paragraph (d) | https://www.legislation.gov.au/C2004A05138/latest/text#s83A-25 |
| TAA 1953 Sch 1 s 12-60 | Labour-hire arrangement payments — labour amounts paragraph (e) | https://www.legislation.gov.au/C1953A00001/latest/text#s12-60 |
| ITAA 1997 s 25-130 (new, Schedule 4 of the same Act) | The $1,000 standard (instant) deduction for work-related expenses — a "labour deduction" under s 61-155(2) paragraphs (c) and (e) | https://www.legislation.gov.au/C2026A00049/asmade/text |

## Secondary sources (government guidance)

| Source | What it establishes | URL |
|---|---|---|
| Budget 2026-27 factsheet "New tax cuts for Australian workers" | Policy intent and cameo figures: up to $250, permanent, automatic on lodgment, sole traders included, 13m workers / 97% full offset, effective tax-free threshold $19,985 ($24,985 with LITO). Captured in full — `sources/budget-2026-27-factsheet-new-tax-cuts-workers.md` | https://budget.gov.au/content/factsheets/download/tax-explainers-new-tax-cuts-workers.pdf |
| Treasurer's second reading speech, Treasury Laws Amendment (Tax Reform No. 1) Bill 2026 | Confirms $250, "from the 2027-28 financial year", framing as effective tax-free threshold increase (checked 2026-07-10) | https://ministers.treasury.gov.au/ministers/jim-chalmers-2022/speeches/second-reading-speech-treasury-laws-amendment-tax-reform-no-1 |
| Budget 2026-27 tax measures overview | Announcement context (12 May 2026 Budget) | https://treasury.gov.au/policy-topics/taxation/budget2026-27 |

Capture notes: ato.gov.au and aph.gov.au (Bills Digest) return HTTP 403 to scripted
fetches — not re-attempted; the enacted text makes them non-essential for encoding.
legislation.gov.au provision text was pulled via the register's epub rendition (the
`/text` page itself is a JS SPA), same technique as the CGT/negative-gearing research.
