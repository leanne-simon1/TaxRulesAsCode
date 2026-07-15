# Capital gains tax research — sources and capture status

Phase 1 working folder for the **capital gains tax (CGT) ruleset**. Anything later
encoded in an `openfisca_rules/variables/cgt.py` module must trace back to a row of
`rule-inventory.md` (current law) or `future-changes-2026-27-budget.md` (enacted and
announced changes), and every row must trace back to a source listed here.

## ✅ Status: primary-source verified 2026-07-07 (tax-specialist review still recommended)

This research was drafted on **2026-07-06** in a sandbox whose network policy blocked
**all** full-page capture (HTTP 403 at the proxy), so the first draft was built from
web-search excerpts only. On **2026-07-07**, on Leanne's local machine, every fact was
re-verified against primary sources — see the verification log immediately below. What
remains outstanding:

1. ~~Capture the primary sources and re-verify each row against full text~~ **done**
   (current law against the local FRL text; the reform against the enacted Act at
   legislation.gov.au — see log). The **Explanatory Memorandum** has still not been read
   in full; the provision *map* is confirmed but the fine detail of a few mechanics
   (e.g. the exact time-apportionment formula) should be read against the EM.
2. **Tax-specialist review is still recommended** before this is treated as
   authoritative — the encoding maps legal mechanics to boolean/date logic and a
   specialist should confirm the interpretation, even though the source facts now check
   out.
3. The draft banners have been downgraded accordingly (verified, specialist-review
   pending) rather than removed.

## ✅ Verification log — 2026-07-07 (completed on local machine)

The network limitation noted below applied only to the original sandbox. On Leanne's
local machine both **web search** and **legislation.gov.au** are reachable, so every
fact was re-verified against **primary sources** on 2026-07-07:

**Current law** — verified against the authoritative Federal Register text held locally
in the EPA project (`/home/lsimon/Downloads/EPA/site/data/pit.db`, ITAA 1997 =
`C2004A05138`, compilation in force to 2026-05-21). Confirmed verbatim: s 102-5 method
statement (step 3 = discount); s 104-10 event A1 timing "when you enter into the
contract" and the pre-20 September 1985 carve-out; s 115-25 (12-month rule); s 115-100
(discount 50% individual/trust, 33⅓% complying super / life insurance company);
s 108-10 ($500 collectables) and s 108-20 ($10,000 personal use assets); s 118-110
(main residence basic case); s 855-10 (foreign residents — taxable Australian property);
s 152-10 (small business basic conditions: CGT small business entity / MNAV test). **No
corrections to the current-law rules were needed.**

**2026 reform** — verified against the enacted Act text itself, pulled from
legislation.gov.au (the epub document parts behind the Angular shell):

- The reform is a **two-Act package**, both assented **26 June 2026**:
  - **Treasury Laws Amendment (Tax Reform No. 1) Act 2026** — `C2026A00049` (No. 49 of
    2026). Omnibus: Sch 1 = CGT; Sch 2 = negative-gearing limitation; Sch 3 = Working
    Australians Tax Offset; Sch 4 = standard work-expense deduction; Sch 5 = SMSF
    limited-recourse borrowing restriction.
  - **Income Tax Rates Amendment (Tax Reform No. 1) Act 2026** — `C2026A00050` (No. 50
    of 2026). The companion rates Act. *(The original draft named only one Act.)*
- **Real provision map (Schedule 1, from the as-made text):**
  | Reform element | Actual provision(s) inserted/amended in ITAA 1997 |
  |---|---|
  | 30% minimum tax | **New Division 119 "Minimum rate of tax on capital gains"** (after Div 118): s 119-5 *your minimum tax capital gain*, s 119-10 *when extra income tax is payable*, s 119-15 *exception for recipients of certain payments*. Note added at end of s 102-1. Structured as **"extra income tax" on a "minimum tax capital gain"**, not a literal rate swap. |
  | Transition (assets held at 1 Jul 2027) | **New Subdivision 112-E** (end of Div 112) + s 112-5(6A): **deemed sale and reacquisition** just before 1 July 2027; market value default with an apportionment-method election. |
  | New capital-loss ordering | **New s 102-6** (after 102-5) with residential / non-residential and deferred gain categories; s 102-5 method statement steps amended. |
  | CPI indexation (unfrozen) | **s 110-36** amended + **s 960-275(1B),(1C)** inserted — indexation for expenditure incurred on/after 1 July 2027, asset held ≥ 12 months. |
  | Discount abolition + carve-outs | Div 115 amended (ss 115-1, 115-100, 115-210, 115-225); **s 115-102 (new residential dwellings)** and **s 115-125 (affordable housing)** keep a discount by election. |
  | Pre-CGT reset | s 100-25 / s 104-10 gated to "the CGT event happens before 1 July 2027"; market-value reset delivered via the Subdiv 112-E deemed reacquisition. |
  | Small business $10m threshold | **s 152-205 amended in this Act (Sch 1)** — effective FY2027-28. |

**⚠️ Correction to the draft:** the **$10 million** small-business 50%-active-asset-
reduction threshold is **enacted in this Act (s 152-205)**, *not* "announced / second
bill / not yet law" as `future-changes-2026-27-budget.md` (B9) and the ruleset (1.7.1)
originally recorded. It has been moved to the enacted-future-law section.

**Confirmed still NOT law** (0 occurrences in the enacted Act, consistent with the
draft): the **discretionary-trust 30% minimum tax** (announced from 1 July 2028) and the
**Innovative Business CGT Concession (IBCC)** — both remain announced-only / second bill.

**Citation-anchor note resolved:** legislation.gov.au serves an Angular shell; the real
text lives at `…/{id}/{version}/text/original/epub/OEBPS/document_N/document_N.html`.
Section anchors are internal `_Toc…` ids, so the `#s102-5`-style fragments in the links
below do not resolve — the Act-level URL + section number is the citation.

## Primary sources — current law (legislation)

Capital gains tax is Parts 3-1 and 3-3 of the *Income Tax Assessment Act 1997*
(ITAA 1997), Federal Register of Legislation ID `C2004A05138`.

| Source | What it establishes | URL |
|---|---|---|
| ITAA 1997 s 102-5 | The **method statement**: how the net capital gain included in assessable income is built up (gains − current losses − carried-forward losses → discount → small business concessions) | https://www.legislation.gov.au/C2004A05138/latest/text#s102-5 |
| ITAA 1997 s 102-10, 102-15 | Capital losses offset only capital gains; net capital losses carry forward indefinitely and are applied in order | https://www.legislation.gov.au/C2004A05138/latest/text#s102-10 |
| ITAA 1997 Div 104 (s 104-5 summary; s 104-10 event A1) | The **CGT events** that trigger a gain or loss; event A1 (disposal) happens at **contract** time, not settlement | https://www.legislation.gov.au/C2004A05138/latest/text#s104-10 |
| ITAA 1997 s 104-10(5), s 100-25 | Assets acquired **before 20 September 1985** ("pre-CGT") — gains and losses disregarded under current law | https://www.legislation.gov.au/C2004A05138/latest/text#s104-10 |
| ITAA 1997 Div 110 (ss 110-25, 110-55) | **Cost base** (5 elements) and **reduced cost base** | https://www.legislation.gov.au/C2004A05138/latest/text#s110-25 |
| ITAA 1997 Div 114, s 960-275 | **Indexation method** (current law): only assets acquired at or before 11:45am 21 September 1999; CPI frozen at the 30 September 1999 quarter (123.4) | https://www.legislation.gov.au/C2004A05138/latest/text#s114-1 |
| ITAA 1997 Div 115 (ss 115-25, 115-100, 115-105, 115-115) | **Discount capital gains**: 12-month holding rule; discount percentage 50% (individuals, trusts), 33⅓% (complying super funds, eligible life insurance companies); companies excluded; foreign/temporary resident exclusion and apportionment for gains accruing after 8 May 2012 | https://www.legislation.gov.au/C2004A05138/latest/text#s115-100 |
| ITAA 1997 Subdiv 118-B (s 118-110 etc.) | **Main residence exemption** (full, partial, 6-year absence rule); denied to foreign residents at the time of the CGT event unless a "life events" test is met | https://www.legislation.gov.au/C2004A05138/latest/text#s118-110 |
| ITAA 1997 ss 118-5, 118-10, 108-10, 108-20 | Exempt assets (cars, etc.); **collectables** ($500 acquisition threshold; losses quarantined to collectable gains) and **personal use assets** ($10,000 threshold; losses disregarded) | https://www.legislation.gov.au/C2004A05138/latest/text#s118-10 |
| ITAA 1997 Div 152 | **Small business CGT concessions**: basic conditions (CGT small business entity — aggregated turnover < $2m — or $6m maximum net asset value; active asset test), then 15-year exemption, 50% active asset reduction, retirement exemption ($500,000 lifetime cap), small business rollover | https://www.legislation.gov.au/C2004A05138/latest/text#s152-10 |
| ITAA 1997 Div 855 | **Foreign residents**: CGT applies only to "taxable Australian property" (direct/indirect Australian real property, business assets of an Australian PE, etc.) | https://www.legislation.gov.au/C2004A05138/latest/text#s855-10 |
| ITAA 1997 Div 128 | **Death**: not itself a taxable event for assets passing to the legal personal representative or a beneficiary; cost base inheritance (deceased's cost base for post-CGT assets; market value at death for pre-CGT assets) | https://www.legislation.gov.au/C2004A05138/latest/text#s128-15 |

## Primary sources — May 2026 Budget reform (announced and enacted)

| Source | What it establishes | URL |
|---|---|---|
| Budget 2026–27 — Tax reform overview | The 12 May 2026 announcement: replace the 50% CGT discount with indexation + 30% minimum tax from 1 July 2027; negative gearing changes; discretionary trust minimum tax from 1 July 2028 | https://budget.gov.au/content/04-tax-reform.htm |
| Budget 2026–27 factsheet — Negative Gearing and Capital Gains Tax Reform | The measure-level factsheet (grandfathering, new-build election, income-support-recipient exemption) | https://budget.gov.au/content/factsheets/download/tax-explainers-negative-gearing-capital-gains-tax.pdf |
| ATO — Tax reform: Boosting home ownership – Reforming negative gearing and capital gains tax | ATO new-legislation page tracking the measure | https://www.ato.gov.au/about-ato/new-legislation/in-detail/individuals/tax-reform-boosting-home-ownership-reforming-negative-gearing-and-capital-gains-tax |
| **Treasury Laws Amendment (Tax Reform No. 1) Bill 2026** — Parliament of Australia bill page | The implementing bill: passed both Houses **25 June 2026**, assent reported **26 June 2026** (as amended in the Senate). Homepage for the Act text + EM once captured | https://www.aph.gov.au/Parliamentary_Business/Bills_Legislation/Bills_Search_Results/Result?bId=r7493 |
| Parliamentary Library Bills Digest for the Bill | Independent description of the bill's mechanics | https://www.aph.gov.au/Parliamentary_Business/Bills_Legislation/bd/bd2526/26bd067 |
| Treasurer — second reading speech | Government's stated intent for the reform | https://ministers.treasury.gov.au/ministers/jim-chalmers-2022/speeches/second-reading-speech-treasury-laws-amendment-tax-reform-no-1 |
| PM — Tax reform implementation for small business and startups (18 June 2026) | Post-Budget carve-outs: active-asset-reduction turnover threshold $2m → $10m; Innovative Business CGT Concession (IBCC) consultation | https://www.pm.gov.au/media/tax-reform-implementation-small-business-and-startups |
| Office of Impact Analysis — Capital Gains Tax and Negative Gearing | Published impact analysis for the measure | https://oia.pmc.gov.au/published-impact-analyses-and-reports/capital-gains-tax-and-negative-gearing |

## Secondary sources (commentary used to reconstruct mechanics)

All read via search excerpts only (2026-07-06); none fetched in full.

| Source | What it contributed | URL |
|---|---|---|
| Pitcher Partners — "A fundamental shift in Capital Gains Tax: Pre-CGT assets, indexation and minimum tax" | Transition mechanics: market-value vs time-apportionment choice, deferred until lodgment of the return for the realisation year; pre-CGT deemed cost base = market value at 1 July 2027 | https://www.pitcher.com.au/insights/federal-budget-2026-27-a-fundamental-shift-in-capital-gains-tax-pre-cgt-assets-indexation-and-minimum-tax/ |
| PwC — 2026-27 Federal Budget: CGT and housing tax reform | 30% minimum applies regardless of marginal rate; deterrence rationale; entity scope (individuals, trusts, partnerships) | https://www.pwc.com.au/tax/tax-alerts/cgt-and-housing-tax-reform.html |
| Baker McKenzie — "Major Changes to CGT and Negative Gearing" (July 2026) | Post-enactment summary: indexation for assets held > 12 months; main residence exemption unaffected; income-support-recipient exemption; negative gearing loss carry-forward | https://www.bakermckenzie.com/en/insight/publications/2026/07/australia-major-changes-to-cgt-and-negative-gearing |
| William Buck — Federal Budget Analysis 2026: Capital Gains Tax | Companies unaffected; super funds expected to keep the one-third discount | https://williambuck.com/tools/federal-budget-2026/capital-gains-tax/ |
| CA ANZ — Proposed capital gains tax changes | Small business CGT concessions unchanged by the No. 1 Bill | https://www.charteredaccountantsanz.com/news-and-analysis/news/federal-budget-2026-27-proposed-capital-gains-tax-changes |
| Corrs — Capital gains tax and negative gearing amendments | Key changes and implications of the amendments as passed | https://www.corrs.com.au/insights/capital-gains-tax-and-negative-gearing-amendments-key-changes-and-implications |
| The Adviser / SmartCompany / Capital Brief (news) | Passage timeline: Senate committee report 19 June; Greens support 23 June (SMSF LRBA residential-property ban as condition); passed 25 June 2026 | https://www.theadviser.com.au/growth/48598-negative-gearing-cgt-reforms-pass-senate |
| Piper Alderman — Tax reform update: post-Budget carve-outs and the new start-up CGT concession | 18 June package detail; IBCC scope (founders, ESS participants, early-stage investors); second technical bill later in 2026 | https://piperalderman.com.au/insight/tax-reform-update-governments-post-budget-carve-outs-and-the-new-start-up-cgt-concession/ |
| ATO — CGT discount | Current-law discount percentages and the 8 May 2012 foreign/temporary resident exclusion | https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/cgt-discount |
| ATO — Cost base of assets | Five cost-base elements; exclusion of deductible/deducted expenditure (post-13 May 1997 acquisitions) | https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/calculating-your-cgt/cost-base-of-asset |
| ATO — Guide to capital gains tax (Part A) | CGT is not a separate tax; net capital gain is assessable income | https://www.ato.gov.au/law/view/print?DocID=SAV/GCGT/00003&PiT=20220701000001 |

## Findings that shape the encoding

1. **The "future rules" are no longer just an announcement.** The Budget measure was
   legislated within seven weeks: the Treasury Laws Amendment (Tax Reform No. 1) Bill
   2026 passed both Houses on 25 June 2026 (assent 26 June 2026), with Senate
   amendments. The core CGT regime change **commences 1 July 2027**, so an OpenFisca
   encoding can treat it as **dated law**: the discount-vs-indexation switch is exactly
   the kind of time-varying rule the `parameters/*.yaml` dated-value mechanism exists
   for (e.g. `discount_percent_individual`: 0.5 until 2027-06-30, indexation regime
   from 2027-07-01).
2. **Three regimes now coexist** for individuals/trusts: (a) legacy indexation
   (pre-21 Sep 1999 acquisitions, CPI frozen at Sep 1999), (b) the 50% discount (until
   30 June 2027, and preserved by election for eligible new builds), (c) the new
   CPI indexation + 30% minimum (gains accruing from 1 July 2027). The encoding's
   pivotal inputs are acquisition date, disposal (contract) date, entity kind, and —
   for transitioned assets — the market-value-vs-time-apportionment choice.
3. **The 30% minimum is a rate floor on net capital gains**, with a carve-out for
   income support recipients — a new entity-level input the PAYG/objections model
   doesn't have yet.
4. **Second bill pending.** Discretionary-trust 30% minimum tax (from 1 July 2028),
   the $10m active-asset-reduction threshold, the IBCC and further carve-outs are in
   a second, technical bill expected later in 2026 (IBCC consultation opened 18 June
   2026). These are **announced, not law** — keep them out of any encoding, or behind
   an explicit "announced measure" flag.

## VERIFY flags — RESOLVED against the Explanatory Memorandum (2026-07-07)

The Bill's **Explanatory Memorandum** (main EM, 125 pp, and Supplementary EM, 37 pp)
was captured from ParlInfo and read. Each flag is now closed with a provision-level
answer:

- ✅ **30% minimum tax mechanics** — new **Division 119 ITAA 1997** (+ Div 119 of the
  Income Tax (Transitional Provisions) Act 1997); the **rate is set by the Rates Act,
  new s 12AA** (via the companion Bill). It works as *extra income tax* on a **"minimum
  tax gap amount"** (s 119-10(2)), a 7-step top-up: Step 1 = 30% × your *minimum tax
  capital gain*; Steps 2–4 = the tax you'd already pay on that gain treated as the **top
  slice** of your income at marginal rates, **before offsets**; Step 5 = the shortfall.
  It is computed on **basic income tax liability** (s 4-10(3)) — the **Medicare levy is
  not part of the calculation**. It only bites where your effective rate on the gain is
  below 30%. **Trusts: taxed at the beneficiary level** — capital gains attributed to a
  beneficiary under **s 115-215** are "covered". (Foreign/temporary residents present
  part-year may be caught; a later tranche will refine this.)
- ✅ **Indexation cannot create or increase a capital loss** — EM 1.38: capital losses
  use the **reduced cost base**, which "excludes certain elements and is **not indexed**
  (and has never been indexed)". Only the cost base (gains side) is indexed.
- ✅ **Time-apportionment method** — **market value at 1 July 2027 is the default**; the
  only alternative is an **apportioning method set by Ministerial legislative instrument
  under new s 112-185** — the Act does **not** hard-code a straight-line formula. The
  choice is made under s 103-25, by the day the return is lodged for the realisation
  year (s 112-155(3)/112-165(3)/112-175(4)).
- ✅ **"New residential dwelling" definition + election** — the **definition is set by
  the Minister by legislative instrument** (see EM Ch 2, negative gearing). The election
  is under **s 115-102(5)** using the s 103-25 choice rules: choose the **50% discount
  (default for this class)** or **indexation + minimum tax**, made **by return-lodgment
  day** for the realisation year. A trustee's choice **binds the beneficiary**
  (a beneficiary can't independently elect). A parallel carve-out exists for
  **affordable housing (s 115-125)**.
- ✅ **Income-support-recipient exemption** — s 119-15; the exempt payments are
  **prescribed by Ministerial legislative instrument** (Age Pension, JobSeeker, DSP,
  Carer/Parenting payments, Youth Allowance/Austudy/ABSTUDY, FTB, DVA/MRCA payments,
  etc.); exempt if such a payment is received **at any time in the income year**.
- ✅ **12-month rule carries over** — new indexation under **s 110-36(1A)(b)** requires
  the asset to have been "acquired at least 12 months before the CGT event". Assets held
  < 12 months at disposal get **no indexation** (and no discount) — the gain is taxed in
  full (still subject to the 30% floor).
- ✅ **Negative-gearing quarantine ↔ CGT ordering** — the amended **s 102-5 method
  statement** inserts two new steps: **Step 3** applies a current-year *quarantined
  amount* (quarantined rental losses) against **deferred residential** capital gains, and
  **Step 4** applies any remainder against **residential** capital gains — i.e. **after**
  capital losses (Steps 1–2) and **before** the discount (now Step 5). Quarantined
  amounts can only reduce **residential** capital gains.
- ✅ **Pre-CGT assets held by companies — CORRECTION.** EM 1.194/1.198: the pre-CGT
  deemed sale (30 Jun 2027) and reacquisition at market value (1 Jul 2027) under
  **s 112-175 applies to *all entities, including companies***, individuals and trusts —
  not just individuals/trusts/partnerships as the draft assumed. Companies keep their
  no-discount treatment, but their pre-CGT assets **do** get the market-value reset and
  become subject to CGT for growth from 1 July 2027.

**Sources captured 2026-07-07** (added to this folder's citations):
- Enacted Act text — Treasury Laws Amendment (Tax Reform No. 1) Act 2026, `C2026A00049`
  (epub document parts, legislation.gov.au).
- **Explanatory Memorandum** (main) — ParlInfo `r7493_ems_a90ad43e…` (JC018386.pdf).
- **Supplementary Explanatory Memorandum** — ParlInfo `r7493_ems_e5a9c782…`.

Remaining genuinely-open item: none of the CGT mechanics — only a **tax-specialist
review** of the interpretation before the ruleset is relied upon. (The `#s…` anchor
fragments on the legislation.gov.au links remain cosmetic — see the citation-anchor note
above.)
