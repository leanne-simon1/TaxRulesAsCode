# Negative gearing ruleset — research sources

Prepared 2026-07-08. Current-law provisions verified against the **local authoritative
ITAA 1997 text** ([[epa-legislation-data-source]] — the sibling `EPA` project's
`site/data/pit.db`, table `segments`, current in-force text as at 2026-07-08). The
enacted 2027 negative-gearing reform is verified against the **Explanatory Memorandum**
for the Bill that became the Act — the same primary document already captured for
`Capital Gains Tax Ruleset.md` (see `research/cgt/README.md` and
`research/cgt/sources/EM-main-tax-reform-no1-2026.txt`), re-read here for its
**Chapter 2 (Schedule 2 — "Limit negative gearing for residential property to new
builds")**, which was not needed for the CGT ruleset and so had not previously been
extracted. The Act's own Schedule 2 body text was **not** independently re-fetched this
session (only Schedule 1 — CGT — was previously captured in
`research/cgt/sources/Act-C2026A00049-asmade-schedule1-body.txt`); the EM is an official
document tabled with the Bill and quotes/paraphrases each new subsection with its exact
citation (e.g. "[Schedule 2 to the Bill, item 1, subsection 26-155(1) of the ITAA 1997]"),
so provision numbers below are taken from those citations. **Tax-specialist review is
still recommended**, and re-fetching the enacted Schedule 2 body text directly would
raise this to the same "primary-source verified" tier as the CGT ruleset.

## Current law (ITAA 1997) — queried from `pit.db`, act='ITAA1997'

| Provision | Heading | What it establishes |
|---|---|---|
| s 8-1 | General deductions | Rental expenses are deductible to the extent incurred in producing assessable (rental) income; capital/private/domestic outgoings and expenses relating to exempt income are excluded |
| s 25-10 | Repairs | Repairs to rental premises/a depreciating asset held for income-producing purposes are immediately deductible (apportioned for partial use); capital expenditure (improvements) is excluded |
| s 25-25 | Borrowing expenses | Loan establishment costs are deductible, spread over the loan period (capped at 5 years); immediately deductible in full if the year's total is ≤ $100 |
| s 26-31 | Travel related to use of residential premises as residential accommodation | Denies deduction of travel expenses to inspect/maintain a residential rental property or collect rent, unless the entity is a corporate tax entity, a super fund that is not an SMSF, a managed investment trust, a public unit trust, or a trust/partnership wholly of such entities |
| s 26-102 | Expenses associated with holding vacant land | Denies deduction of holding costs (incl. loan interest) for land without a substantial permanent structure in use/available for use, unless the land is used in a business, or (for residential premises) they are lawfully occupiable and leased/available for lease; same kind-of-entity exceptions as s 26-31; plus primary-production and arm's-length-business-lease carve-outs |
| s 35-10 | Deferral of deductions from non-commercial business activities (Division 35) | Quarantines losses only from a **business activity** carried on by an individual (incl. in partnership). Ordinary residential letting by a passive investor is not "carrying on a business", so Division 35 does not apply to it — this is *why* current law allows negative gearing (the loss is a general deduction under s 8-1, not deferred under Division 35) |
| Div 40 s 40-27 | Further reduction of deduction for second-hand assets in residential property | Denies decline-in-value deductions for a depreciating asset in residential rental premises if the taxpayer did not hold the asset when it was first used/installed by any entity (i.e. it was already "second-hand" when acquired), unless supplied as part of new residential premises with no prior use, or the taxpayer is a corporate tax entity/non-SMSF super/MIT/public unit trust, or the asset is in a low-value pool |
| Div 43 s 43-10, s 43-25 | Deductions for capital works; rate of deduction | Construction cost of capital works (incl. a rental building) is deductible at 2.5% p.a. (up to 40 years) for works begun after 26 February 1992; 4% p.a. for works begun 22 August 1984 – 26 February 1992; no Division 43 deduction for earlier works. This ruleset models only the post-26-February-1992 2.5% case |
| s 110-45 | Cost base: assets acquired after 7.30pm 13 May 1997 | Expenditure that has been or can be deducted (e.g. Division 43 capital works, decline in value) is excluded from the CGT cost base — links a property's negative-gearing deductions to a smaller cost base, and so a larger capital gain, on eventual disposal (see `Capital Gains Tax Ruleset.md`, `cgt_cost_base`) |

## Co-ownership (net income/loss splitting) — verified 2026-07-08 by web search

- **FC of T v McDonald (1987) 18 ATR 957; 87 ATC 4541** — the Full Federal Court held
  that co-owners of a rental property are not partners at general law; a private
  agreement to split profits/losses unevenly (in that case 25/75 profits, 100/0 losses)
  has no effect for tax purposes — the net income or loss must be split according to
  **legal ownership interest**.
- **ATO Taxation Ruling TR 93/32** — "Income tax: rental property – division of net
  income or loss between co-owners" — confirms the *McDonald* principle as the ATO's
  administrative position: co-owners share rental net income/loss in the same
  proportion as their ownership interest, regardless of who actually paid the expenses
  or any private agreement, except in the limited case of documented differing
  equitable interests.

## Enacted 2027 reform — Schedule 2, Treasury Laws Amendment (Tax Reform No. 1) Act
2026 (`C2026A00049`) — from the Explanatory Memorandum, Chapter 2

Same Act as the CGT reform ([[cgt-research-verified]]); Schedule 2 is a **separate,
free-standing measure** (new ITAA 1997 provisions, not amendments to Division 115) that
happens to interact with the CGT method statement. Assented 26 June 2026; Schedule 2
commences the day after assent but **applies to net rental losses incurred in the
2027-28 income year and later**, for interests **acquired on or after 7:30pm AEST
12 May 2026 (the Budget announcement time)**.

- **New s 26-155(1)** — the general rule: to the extent deductions relating to a
  quarantined residential dwelling exceed assessable income from quarantined residential
  dwellings for the year, the excess is **not deductible that year**; instead it can be
  applied (via new steps inserted in the s 102-5 method statement) against net income
  from **non-quarantined** residential dwellings, or revenue/capital gains on residential
  dwellings; any remainder is **carried forward**.
- **New s 26-155(2)** — exceptions (the dwelling is not quarantined) where the entity's
  ownership interest was **last acquired before 7:30pm AEST 12 May 2026**; the dwelling
  is a **new residential dwelling** (definition by Ministerial legislative instrument —
  not yet made); or the dwelling's activity/purpose or business/enterprise is
  Minister-determined (e.g. affordable/social housing).
- **New s 26-155(3)** — for the pre-announcement grandfathering test, ownership interest
  under a contract is taken to be acquired **when the contract is entered into** (not
  settlement) — mirrors the existing CGT s 109-5/109-10 timing concept.
- **New s 26-155(4)** — entity-level exceptions: **widely held trusts** (e.g. most MITs)
  and **complying superannuation entities (including SMSFs)** are never subject to
  quarantining, plus any Minister-determined entity class. *(Note the entity-exception
  set here is narrower than, and different from, s 26-31/s 40-27's: those exclude a
  super fund that is **not** an SMSF, an SMSF is NOT excepted there; s 26-155(4) is the
  opposite — SMSFs ARE excepted from quarantining. Companies are excepted from neither
  the current-law nor the quarantine provisions' general rule, but are also not caught by
  the current-law s 26-31/s 40-27 restrictions since those name "corporate tax entity" as
  an exception — companies are simply not the intended target of any of these
  anti-avoidance-style rules; a company IS however subject to the s 26-155 quarantine if
  it holds a non-excepted established dwelling.)*
- **New s 26-155(5)** — exception for expenditure incurred providing a fringe benefit
  (e.g. employer-provided housing).
- **New s 26-155(6)** — modification: the quarantined excess is first reduced by (a) any
  net assessable income from **non-quarantined** residential dwellings, and (b) gains
  from disposal of a residential dwelling that is a revenue asset, before being applied
  to capital gains and carried forward.
- **New s 26-155(7)** — modification for trust beneficiaries: the character of
  distributed trust income flows through, including via interposed trusts/partnerships.
- **New s 26-155(8)–(9)** — modification on bankruptcy: a quarantined amount accrued
  before an entity is declared bankrupt cannot be deducted or applied to gains after
  bankruptcy (modelled on the existing s 26-47 boating-loss and Division 35/36 pattern).
- **New s 26-160(1), s 995-1(1) "residential dwelling"** — a dwelling (s 118-115
  meaning) other than a caravan/mobile home, hotel/motel/hostel/boarding house, student
  accommodation, boat, or a Minister-excluded class; **s 26-160(2)** extends it to
  adjacent land/structures (garage, shed, etc.) used with the dwelling.
  **s 26-160(3)–(5)** — "new residential dwelling" is defined by Ministerial legislative
  instrument (not yet made); the EM's non-binding guidance: dwellings built on vacant
  land or genuinely adding to housing supply (e.g. one dwelling demolished and replaced
  by two separately titled dwellings) qualify; replacing one dwelling with one does not.
- **New s 110-38(8A), s 110-55(9JA)** — a quarantined amount is excluded from the
  dwelling's CGT cost base/reduced cost base once it has reduced a capital gain, so the
  same amount is not both a rental deduction/loss offset **and** a larger CGT cost base
  (avoids double benefit) — this is the negative-gearing-specific analogue of the
  existing s 110-45 principle above.
- **Method statement interaction (Ch 1 of the EM, cross-referenced from Ch 2)** — the
  amended s 102-5 method statement (used to work out the net capital gain — see
  `Capital Gains Tax Ruleset.md`) inserts **new Step 3** (apply the current year's
  quarantined amount against **deferred residential** capital gains) and **new Step 4**
  (apply any remainder against **residential** capital gains) — after capital losses
  (Steps 1–2) and before the discount/indexation step. Quarantined amounts can reduce
  **residential** capital gains only.
- **Worked examples in the EM** (2.1–2.6) confirm: apportionment for a dwelling that is
  partly main residence and partly rented; a dwelling ceasing to be "residential" (e.g.
  rezoned to a boarding house) drops out of quarantining from that point; the
  pre-announcement exception extends to vacant land acquired before the announcement
  even though a dwelling is built on it afterwards (s 26-102's vacant-land-holding-cost
  denial still applies separately until the building is complete/rented); a
  multi-property investor nets quarantined and non-quarantined dwellings together each
  year, carrying forward only the final remaining excess (Tyson, examples 2.5–2.6).

## What this means for the encoding

1. **Two rulesets living in one Act, again.** As with CGT, Schedule 2 is enacted law
   with a future commencement — encode as **dated law** (a fixed commencement-date gate
   plus a fixed grandfathering-cutoff date), not a fork, per this repo's existing
   pattern (`cgt.py`'s `REFORM_DATE`).
2. **The Ministerial legislative instruments (new-build definition, Minister-determined
   dwelling/business/entity exceptions) do not exist yet.** Model them as direct boolean
   inputs (the same simplification `cgt.py` uses for the not-yet-defined new-build
   election), not as computed logic.
3. **Scope, mirroring the CGT ruleset's discipline:** one dwelling per entity as the
   primary calculation, with a single aggregate "other non-quarantined dwellings' net
   income" input standing in for full multi-property aggregation (real multi-property
   netting, as in EM examples 2.5–2.6, is a documented simplification); the s 25-25
   borrowing-expense 5-year spread is taken as a direct per-year input rather than
   re-deriving the method statement; mixed private/rental apportionment (EM example 2.1)
   is a documented caveat, not modelled.
4. **Still open:** tax-specialist review of the interpretation (as with every ruleset in
   this repo), and independently re-fetching the enacted Schedule 2 body text to move
   this from "EM-verified" to the CGT ruleset's "primary-source verified" tier.
