# CGT future rules — 2026–27 Budget reform (announced 12 May 2026, legislated 26 June 2026)

**Primary-source verified 2026-07-07 (tax-specialist review recommended).** The enacted
Act text has now been read directly from legislation.gov.au (see the verification log in
`README.md`); real ITAA 1997 provision numbers are noted in each row below. The
Explanatory Memorandum has not been read in full — a few fine mechanics still warrant an
EM check.

## Status and timeline

| Date | Event |
|---|---|
| **12 May 2026, 7:30pm AEST** | 2026–27 Budget announcement: negative gearing + CGT reform. This time is the grandfathering line for the negative gearing changes (property acquisitions) |
| 29 May 2026 (approx.) | Treasury Laws Amendment (Tax Reform No. 1) Bill 2026 introduced; referred to Senate Economics Legislation Committee |
| 15–16 June 2026 | Senate committee public hearings |
| **18 June 2026** | Government post-Budget carve-out package: active-asset-reduction turnover threshold to rise $2m → $10m; **Innovative Business CGT Concession (IBCC)** consultation paper released |
| 19 June 2026 | Senate committee report recommends passage |
| 23 June 2026 | Greens support secured; Senate amendment bans new SMSF limited recourse borrowing arrangements (LRBAs) for residential property (SIS Act change — condition of support, not a CGT rule) |
| **25 June 2026** | Bill passes both Houses (as amended) |
| **26 June 2026** | Enacted (assent) — Treasury Laws Amendment (Tax Reform No. 1) Act 2026 |
| **1 July 2027** | New CGT regime and negative gearing quarantine commence |
| 1 July 2028 | Announced commencement of the discretionary-trust 30% minimum tax (second bill — **not yet law**) |
| Late 2026 (expected) | Second, technical bill: discretionary-trust minimum tax detail, further carve-outs, IBCC (the $10m active-asset-reduction threshold was **not** deferred — it is in the No. 1 Act, s 152-205) |

## B. The enacted CGT measures (commencing 1 July 2027)

| # | Measure | Detail (as reconstructed from excerpts) | Encoding implication |
|---|---|---|---|
| B1 | **50% discount abolished** for individuals, trusts and partnerships (Div 115 amended: ss 115-1, 115-100, 115-210, 115-225) | The Div 115 50% discount is replaced for gains accruing from 1 July 2027. Companies were never eligible (unchanged); **complying super funds keep the 33⅓% discount** | Dated parameter change: `discount_percent` for individual/trust entity kinds ends 2027-06-30 |
| B2 | **CPI cost base indexation restored** (s 110-36 amended; s 960-275(1B),(1C) inserted) | For assets held **> 12 months**, the cost base is indexed by CPI over the holding period (factor = CPI at disposal ÷ CPI at acquisition); tax applies only to the gain above the inflation-adjusted cost base. Mirrors the pre-1999 system | New calculation branch; CPI becomes a live (unfrozen) dated parameter table (s 960-275(1B),(1C): factor = CPI at CGT event ÷ CPI at expenditure). **RESOLVED (EM):** indexation applies to the cost base only — the *reduced* cost base (losses) is not indexed, so indexation **cannot create/increase a loss**. The 12-month rule carries over (s 110-36(1A)(b)); assets held < 12 months get no indexation and no discount. |
| B3 | **Gains accrue-basis start** | The new rules apply only to gains **accruing after 1 July 2027**. Gains accrued before then keep their existing treatment (incl. the 50% discount treatment embedded in the transition) | See B5 transition |
| B4 | **30% minimum tax on net capital gains** — **new Division 119 ITAA 1997** "Minimum rate of tax on capital gains" (s 119-5 minimum tax capital gain, s 119-10 when extra income tax is payable, s 119-15 exception for recipients of certain payments). Structured as *extra income tax on a minimum tax capital gain*, not a rate swap | Net capital gains (post-indexation) accruing from 1 July 2027 are taxed at **at least 30%**, regardless of the taxpayer's marginal rate; taxpayers on marginal rates above 30% pay their marginal rate. **Income support recipients (incl. pensioners) are exempt** from the floor | Breaks rule A1 of the current-law inventory — the floor is now a rule with an entity-level input (`receives_income_support`). **RESOLVED (EM):** worked as a 7-step "minimum tax gap amount" (s 119-10(2)) topping the gain up to 30% of *basic income tax liability* (gain as top slice, before offsets); **Medicare levy is not part of it**; the **rate is set by the Rates Act s 12AA**. **Trusts: taxed at the beneficiary level** (attributed gains under s 115-215 are covered). |
| B5 | **Transition for assets held at 1 July 2027** — **new Subdivision 112-E** + s 112-5(6A): deemed sale & reacquisition just before 1 July 2027; new capital-loss ordering in **new s 102-6** | Taxpayer separates pre/post-1 July 2027 gain by either: (a) **market valuation** of the asset at 1 July 2027 (formal valuation), or (b) a prescribed **time-apportionment** method assuming the gain accrued evenly over the holding period. The choice is made when lodging the return for the year of the actual CGT event | Two new inputs (`transition_method`, `market_value_2027_07_01`). **RESOLVED (EM):** **market value is the default**; the only alternative is an **apportioning method set by Ministerial legislative instrument under s 112-185** — no straight-line formula is hard-coded. Choice via s 103-25, by return-lodgment day. |
| B6 | **Pre-CGT (pre-20 Sep 1985) exemption ends** | The 40-year blanket exemption is removed for individuals, trusts and partnerships: pre-CGT assets get a **deemed cost base = market value at 1 July 2027**; only growth after that date is taxable. Gains accrued to 1 July 2027 stay exempt | Current-law gate A8 becomes date-bounded: `acquisition_date < 1985-09-20` exempts only gains accrued to 2027-07-01. **CORRECTION (EM 1.194/1.198): s 112-175 applies to *all entities, including companies*** — not just individuals/trusts/partnerships; companies keep no-discount treatment but their pre-CGT assets still get the 1 July 2027 market-value reset. |
| B7 | **New-build election** — **s 115-102 (new residential dwellings)**; a parallel **s 115-125 (affordable housing)** discount carve-out also applies | Investors in **new builds** (dwelling constructed on vacant land, or demolition replaced with more dwellings — genuinely adding to housing supply) may **choose** on disposal between the old 50% discount and the new indexation+minimum regime | Election input; keeps the 50% parameter alive past 2027 for this class. **RESOLVED (EM):** the **"new residential dwelling" definition is set by Ministerial legislative instrument**; the election (s 115-102(5), s 103-25 choice rules) is made **by return-lodgment day**; a trustee’s choice binds the beneficiary. Discount is the default for the class; electing indexation opts into the 30% minimum. |
| B8 | **Main residence exemption unchanged** | Explicitly untouched (incl. the existing foreign-resident denial) | No change to D1 |
| B9 | **Small business CGT concessions** — the 15-year exemption, retirement exemption and rollover keep their existing $2m turnover / $6m MNAV tests. **CORRECTION (verified 2026-07-07):** the 50% active-asset-reduction (E3) turnover threshold rise **$2m → $10m IS enacted in this Act** — Sch 1 amends **s 152-205 ITAA 1997**, effective FY2027-28. It is *not* deferred to the second bill as first drafted | Dated parameter: active-asset-reduction turnover threshold $2m → $10m from 2027-07-01. **s 152-205** |
| B10 | **Innovative Business CGT Concession (IBCC)** — announced, consultation opened 18 June 2026 | Would preserve a 50% CGT discount for founders, employee-share-scheme participants and early-stage investors in innovative start-ups | Announced-only |
| B11 | **Discretionary trust 30% minimum tax from 1 July 2028** — announced for the second bill | Minimum 30% tax on discretionary trusts, with exceptions to be detailed | Announced-only; separate from B4 |

## C. Related negative gearing measure (context — interacts with CGT)

- From **1 July 2027**, net rental losses on **established** residential property
  acquired after **7:30pm AEST 12 May 2026** can no longer be deducted against wages
  or other non-rental income. Quarantined losses carry forward and can offset rental
  income or **future capital gains from rental property**.
- **Grandfathered**: property owned or under contract before the announcement time
  continues under current rules. **New builds** and certain investor types are excluded
  from the restriction.
- **RESOLVED (EM):** the amended s 102-5 method statement inserts **new Step 3** (apply current-year *quarantined amount* against **deferred residential** capital gains) and **new Step 4** (remainder against **residential** capital gains) — i.e. **after** capital losses (Steps 1–2) and **before** the discount (now Step 5). Quarantined amounts can reduce **residential** capital gains only.

## What this means for the ruleset encoding

1. **Encode as dated law, not a fork.** The No. 1 Act is enacted with a 1 July 2027
   commencement, so the OpenFisca encoding should express both regimes in one ruleset
   with dated parameters and date-gated formulas — exactly the repo's existing pattern
   for time-varying values. A calculation asked "as at 2026" gives current law; "as at
   2028" gives the new law.
2. **Announced-but-not-law items (B10–B11, and second-bill detail) must not be
   encoded** until enacted, per the repo's domain caution ("encode nothing that isn't
   in the reviewed ruleset md"). List them in the ruleset's caveats section instead so
   the chatbot can say "announced, not yet law".
3. **New inputs needed** relative to the current-law inventory: `receives_income_support`
   (B4), `transition_method` + `market_value_2027_07_01` (B5/B6), `is_new_build` +
   `new_build_election` (B7), and a live CPI parameter table (B2).
4. **Act + EM captured and every *(VERIFY)* resolved (2026-07-07).** Verified against
   the enacted Act text (`C2026A00049`) and the Explanatory Memorandum (ParlInfo
   `r7493_ems_a90ad43e…`) plus the Supplementary EM. Schedule/item and new/amended ITAA
   1997 provision numbers are now recorded in the rows above and in `README.md`. What
   remains is **tax-specialist review** of the interpretation — not source capture.