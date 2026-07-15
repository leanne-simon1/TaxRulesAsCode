1. **Working Australians Tax Offset ruleset (the $250 WATO, from the 2027-28 income year)**

> **Primary-source verified 2026-07-10; tax-specialist review still recommended.** Encoded
> directly from the enacted text of **Schedule 3, Treasury Laws Amendment (Tax Reform
> No. 1) Act 2026** (`C2026A00049`, assent 26 June 2026) — the same Act as the CGT and
> negative-gearing reforms — which inserts **Subdivision 61-E** (ss 61-150, 61-155,
> 61-160) into the ITAA 1997. Full captured text and capture notes in
> `research/wato/`. The rules below are **enacted but not yet in effect**: they apply to
> assessments for the **2027-28 income year and later** (Schedule 3, Part 2). One open
> capture caveat: the register's epub rendition omits the s 61-155(2) formula image
> (*labour amounts − labour deductions* is inferred from the defined terms — see
> `research/wato/README.md`).

   1. **Who is entitled to the offset**

1. Only an **individual** can be entitled to the Working Australians Tax Offset — a
   company, trust or partnership cannot (though a sole trader, being an individual,
   can be entitled on their own business income under rule 1.2.1(b)).[^1]

2. The individual must be an **Australian resident at any time during the income
   year** — a full year of residency is not required.[^1]

3. The individual's **net labour income** for the year (rule 1.2) must **exceed the
   tax-free threshold** within the meaning of the *Income Tax Rates Act 1986* —
   **$18,200**. Net labour income of exactly $18,200 or less gives no
   entitlement.[^2]

4. The offset applies to assessments for the **2027-28 income year (starting 1 July
   2027) and later income years**. There is no entitlement for any earlier year, no
   matter the income.[^3]

   2. **Net labour income**

1. **Labour amounts** are the sum of the following amounts included in the
   individual's assessable income for the year:[^4]
   1. **assessable labour income** — salary, wages, allowances and similar
      remuneration from working;
   2. amounts **derived from carrying on a business as an individual** (a sole
      trader) — but **not** assessable income from a business carried on by a
      partnership or trust;
   3. **personal services income**;
   4. **employee share scheme discounts** included in assessable income under
      s 83A-25 ITAA 1997;
   5. payments subject to withholding under **labour hire and certain other
      arrangements** (s 12-60 in Schedule 1 to the TAA 1953), whether or not the
      amount was actually withheld.

2. **Labour deductions** are the sum of the deductions attributable to those labour
   amounts: losses or outgoings incurred in gaining the employment/personal-services
   amounts; outgoings necessarily incurred in the sole-trader business; the **$1,000
   standard (instant) deduction** for work-related expenses (s 25-130, inserted by
   Schedule 4 of the same Act); and work-use depreciation deductions (s 40-25 other
   than low-value-pool amounts, and Subdivision 328-D small-business depreciation, to
   the extent the asset is used to derive the labour amounts).[^5]

3. **Net labour income = labour amounts − labour deductions.** An amount covered by
   more than one paragraph is counted **only once**.[^6]

   3. **How much the offset is**

1. The amount of the offset for the year is the **lesser of**: (a) **$250**; and (b)
   the amount that **would be the individual's basic income tax liability if their
   taxable income consisted only of their net labour income**.[^7]

2. *Consequence of rule 1.3.1 (not a separate rule):* because the first marginal rate
   is **14%** from 1 July 2027, the offset **phases in** at 14 cents per dollar of net
   labour income above $18,200, reaching the full $250 at net labour income of about
   **$19,986**. This is the Budget's "effective tax-free threshold of $19,985" for
   workers (about $24,985 once the separate Low Income Tax Offset is counted); around
   97% of eligible workers receive the full $250.[^8]

3. The offset is **non-refundable**: it can reduce tax payable to zero but is never
   paid out in cash, cannot be transferred to anyone else, and cannot be carried
   forward to a later income year.[^9]

4. The offset is applied **automatically** when the ATO assesses the individual's tax
   return — there is nothing to claim.[^10]

   4. **Scope and simplifications of this encoding**

1. The six labour-deduction paragraphs are modelled as a **single aggregate input**
   (`wato_labour_deductions`) rather than itemised sub-rules — the statute's
   attribution rules (which deduction belongs to which labour amount) are a
   documented caveat, mirroring the aggregate-input simplifications in the
   negative-gearing ruleset.

2. The s 61-160(b) hypothetical **"basic income tax liability"** is computed with the
   **resident basic rate scale only** (dated policy parameter) — no Medicare levy, no
   other offsets, no part-year non-resident scales. That matches the s 4-10
   ITAA 1997 meaning of basic income tax liability, but the residency edge cases are
   for specialist sign-off.

3. The inserted s 995-1 definition of "assessable labour income" was not separately
   captured; it is taken as salary, wages, allowances and similar remuneration
   (research caveat 2).

4. Whether particular deductions must be netted even when that produces a **negative**
   net labour income is moot for the offset (a negative amount can never exceed the
   threshold); the encoding floors net labour income at zero.

## Glossary

| Term | Meaning here |
|---|---|
| WATO | Working Australians Tax Offset — the Subdivision 61-E tax offset of up to $250 |
| Income year | 1 July – 30 June Australian income year; "2027-28" starts 1 July 2027 |
| Tax-free threshold | $18,200, within the meaning of the Income Tax Rates Act 1986 |
| Net labour income | Labour amounts minus labour deductions (s 61-155(2)) |
| Assessable labour income | Salary, wages, allowances and similar remuneration from working (s 995-1 ITAA 1997, inserted by the same Act) |
| Personal services income | Income mainly a reward for an individual's personal efforts or skills (Division 84 ITAA 1997) |
| Basic income tax liability | Tax worked out at the basic rates on taxable income, before offsets and Medicare levy (s 4-10 ITAA 1997) |
| Non-refundable offset | Reduces tax payable to no less than zero; no cash refund of any excess |

[^1]: s 61-155(1)(a) ITAA 1997 (Sch 3, Treasury Laws Amendment (Tax Reform No. 1) Act 2026), https://www.legislation.gov.au/C2026A00049/asmade/text
[^2]: s 61-155(1)(b) ITAA 1997; tax-free threshold per the Income Tax Rates Act 1986, https://www.legislation.gov.au/C2004A03437/latest/text
[^3]: Sch 3, Part 2, item 4, Treasury Laws Amendment (Tax Reform No. 1) Act 2026
[^4]: s 61-155(2) ITAA 1997, definition of "labour amounts", paragraphs (a)–(e); s 83A-25 ITAA 1997; s 12-60 in Sch 1 to the TAA 1953
[^5]: s 61-155(2) ITAA 1997, definition of "labour deductions", paragraphs (a)–(f); s 25-130 ITAA 1997 (Sch 4 of the same Act)
[^6]: s 61-155(2) formula and s 61-155(3) ITAA 1997
[^7]: s 61-160 ITAA 1997
[^8]: Budget 2026-27 factsheet "New tax cuts for Australian workers", https://budget.gov.au/content/factsheets/download/tax-explainers-new-tax-cuts-workers.pdf; first-bracket rate 14% from 1 July 2027 per the Income Tax Rates Act 1986 as amended by the 2025 cost-of-living tax cut Acts
[^9]: s 63-10(1) ITAA 1997, new table item 3 (Sch 3, item 2)
[^10]: Budget 2026-27 factsheet (administrative practice — the statute itself imposes no claim requirement)
