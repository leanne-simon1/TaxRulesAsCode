# CGT rule inventory — current law (to 30 June 2027)

**Primary-source verified 2026-07-07; tax-specialist review recommended.** Every
current-law row below was checked against the authoritative ITAA 1997 text held locally
(EPA project `site/data/pit.db`, `C2004A05138`, in force to 2026-05-21) — s 102-5,
s 104-10, s 108-10/20, s 110-25, Div 114/960-275, s 115-25/100, s 118-110, s 152-10 and
s 855-10 all confirmed; no corrections were needed (see the verification log in
`README.md`). This table is the contract for an OpenFisca encoding of the **capital gain
calculation for a single CGT asset disposal**, the CGT analogue of
`../decision-inventory.md`.

Scope decision for the PoC: model **one disposal by one taxpayer entity**, producing
the assessable net capital gain contribution and the "which method applies" reasoning.
Aggregation across multiple assets, loss pools and the full return are out of scope for
a first iteration (the method statement is encoded for the single-asset + prior-losses
case).

## A. The calculation pipeline (method statement)

| # | Rule | Legal basis | Notes for the encoder |
|---|---|---|---|
| A1 | CGT is not a separate tax: the **net capital gain** for the income year is included in assessable income and taxed at the entity's ordinary rate(s) | s 102-5 ITAA 1997 | Output variable `net_capital_gain`; the marginal-rate tax impact is presentation, not a rule, under current law (this changes from 2027 — see future-changes doc B4) |
| A2 | A gain or loss arises only if a **CGT event** happens; the most common is **event A1** (disposal). Timing: the time of the **contract**, or of the change of ownership if no contract | s 104-5, s 104-10 ITAA 1997 | Input `cgt_event_date` = contract date; document this trap (settlement date is not the event date) |
| A3 | **Capital gain** = capital proceeds − cost base (if positive). **Capital loss** = reduced cost base − capital proceeds (if positive) | s 104-10(4) ITAA 1997 | Inputs `capital_proceeds`, `cost_base`, `reduced_cost_base` |
| A4 | **Cost base** has 5 elements: (1) acquisition cost, (2) incidental costs, (3) ownership costs, (4) capital improvement costs, (5) title defence costs — excluding amounts deducted or deductible (for post-13 May 1997 acquisitions) | Div 110 ITAA 1997; ATO "Cost base of assets" | PoC takes `cost_base` as an input rather than modelling elements |
| A5 | Current-year capital **losses** are applied against gains (taxpayer chooses order), then **carried-forward net capital losses** (applied in the order they were made) — both **before** any discount | s 102-5 method statement steps 1–2; s 102-15 | Input `capital_losses_applied`; ordering matters: losses first, discount after |
| A6 | Capital losses can never offset ordinary income; unused net capital losses carry forward **indefinitely** | s 102-10 ITAA 1997 | Guardrail output for the chatbot, not arithmetic |
| A7 | After losses, the **discount** (Part B) or **indexation** (Part C) is applied if eligible; then **small business concessions** (Part E) | s 102-5 steps 3–4 | The method choice is the pivotal branch |
| A8 | Assets acquired **before 20 September 1985** (pre-CGT): gains and losses **disregarded** entirely (current law; ends 1 July 2027 — see future-changes B6) | s 104-10(5) ITAA 1997 | Input `acquisition_date`; first gate in the flow |

## B. Discount method (Div 115)

| # | Rule | Legal basis | Notes |
|---|---|---|---|
| B1 | Discount requires the asset to have been acquired **at least 12 months** before the CGT event | s 115-25 ITAA 1997 | Boundary tests needed at exactly 12 months (acquisition-day and event-day exclusion conventions — *(VERIFY)* the day-counting) |
| B2 | Discount percentage: **50%** for individuals and trusts; **33⅓%** for complying superannuation funds and eligible life insurance companies; **companies get no discount** | s 115-100 ITAA 1997; ATO "CGT discount" | Parameter file per entity kind (dated values — the 50% rate ends 30 June 2027 for gains accruing after that date) |
| B3 | **Foreign and temporary residents**: no discount on gains accruing after **8 May 2012**; apportionment applies for periods of Australian residency and for gains accrued to 8 May 2012 (market value option) | s 115-105 ff ITAA 1997; ATO "CGT discount for foreign residents" | PoC: model the all-or-nothing case (fully foreign for the whole period → 0%); apportionment flagged out of scope |
| B4 | The discount is applied **after** losses (A5), to the remaining gain | s 102-5 step 3 | |

## C. Indexation method — legacy (Div 114)

| # | Rule | Legal basis | Notes |
|---|---|---|---|
| C1 | Available only for assets acquired **at or before 11:45am (ACT time) 21 September 1999**, held ≥ 12 months | Div 114 ITAA 1997 | |
| C2 | Cost base elements (except element 3) are indexed by CPI from the acquisition quarter, with the index **frozen at the 30 September 1999 quarter (123.4)** | s 960-275 ITAA 1997 | Parameter: CPI table (dated values — a natural fit) |
| C3 | An eligible taxpayer **chooses** indexation or discount, whichever is better; indexation cannot create or increase a capital loss | Div 114; ATO Guide to CGT | Output `better_method` — a good calculator feature |

## D. Exemptions and special asset classes

| # | Rule | Legal basis | Notes |
|---|---|---|---|
| D1 | **Main residence**: full exemption for a dwelling that was the taxpayer's main residence for the whole ownership period (partial otherwise); up to **6-year absence** rule while rented; **denied to foreign residents** at the time of the CGT event unless a life-events test is met | Subdiv 118-B ITAA 1997 | Unchanged by the 2026 reform (future-changes B8). PoC: boolean gates, not the partial-exemption arithmetic |
| D2 | **Collectables**: acquired for ≤ $500 → gains/losses disregarded; collectable losses offset **only** collectable gains | s 108-10, s 118-10 ITAA 1997 | |
| D3 | **Personal use assets**: acquired for ≤ $10,000 → gains disregarded; personal-use losses **always** disregarded | s 108-20, s 118-10 ITAA 1997 | |
| D4 | **Cars**, depreciating assets used wholly for a taxable purpose, gambling winnings, compensation for personal injury: exempt/disregarded | s 118-5 ff ITAA 1997 | Enum of asset classes gates the whole calc |
| D5 | **Death** is not a CGT event for assets passing to the LPR or a beneficiary; beneficiary inherits the deceased's cost base (post-CGT assets) or market value at death (pre-CGT assets) | Div 128 ITAA 1997 | Out of scope for the single-disposal PoC; record for the chatbot's "no, death doesn't trigger CGT" answer |
| D6 | **Foreign residents** are subject to CGT only on **taxable Australian property** (Australian real property, indirect real property interests, PE business assets); a 15% **foreign resident capital gains withholding** applies on disposals of relevant property from 1 January 2025 (no threshold) | Div 855 ITAA 1997; FRCGW rules | PoC: gate + guidance output |

## E. Small business CGT concessions (Div 152)

| # | Rule | Legal basis | Notes |
|---|---|---|---|
| E1 | **Basic conditions**: CGT small business entity (aggregated turnover < **$2m**) **or** maximum net asset value ≤ **$6m**; the asset satisfies the **active asset** test | s 152-10 ITAA 1997 | Turnover threshold for E3 (50% active asset reduction) rises $2m → $10m from 2027-28 — **enacted** (s 152-205, Tax Reform No. 1 Act 2026; future-changes B9) |
| E2 | **15-year exemption**: full disregard if the asset was owned 15+ years and the taxpayer is 55+ and retiring, or permanently incapacitated | Subdiv 152-B | |
| E3 | **50% active asset reduction**: gain reduced by a further 50% (after the Div 115 discount, if applicable) | Subdiv 152-C | |
| E4 | **Retirement exemption**: up to **$500,000** lifetime cap disregarded (under 55: must be paid into super) | Subdiv 152-D | |
| E5 | **Rollover**: deferral where a replacement active asset is acquired within the window | Subdiv 152-E | |

## F. Rates applied to the net capital gain (context, current law)

| Entity | Effective treatment of an eligible long-held gain |
|---|---|
| Individual | 50% of the gain taxed at marginal rates (0–45% + Medicare levy) |
| Trust | 50% discount at beneficiary level for individual beneficiaries (flow-through) |
| Company | No discount; whole gain at 25%/30% company rate |
| Complying super fund (accumulation) | 33⅓% discount → effective 10% on the gain |
| Complying super fund (pension phase) | 0% (exempt current pension income) |

## Notes for the encoder

- **Pivotal inputs**: `entity_kind` (individual / trust / company / complying_super_fund
  / foreign_resident_individual), `asset_class` (Enum per Part D), `acquisition_date`,
  `cgt_event_date` (contract date), `capital_proceeds`, `cost_base`,
  `reduced_cost_base`, `capital_losses_applied`, main-residence and small-business
  booleans.
- **Pivotal branches**, in order: pre-CGT gate (A8) → exempt asset class (D) →
  main residence (D1) → gain-or-loss (A3) → losses (A5) → method choice
  (B vs C vs none) → small business concessions (E).
- **Dated parameters**: discount percentages by entity kind, the $500/$10,000 asset
  thresholds, Div 152 thresholds ($2m/$6m/$500k), frozen CPI table, the 20 Sep 1985 /
  21 Sep 1999 / 8 May 2012 dates. From 1 July 2027 the discount parameters change —
  see `future-changes-2026-27-budget.md`.
- Every threshold above is a **parameter**, not a formula constant, per repo
  convention — several of them are exactly what the 2026 reform changes.
