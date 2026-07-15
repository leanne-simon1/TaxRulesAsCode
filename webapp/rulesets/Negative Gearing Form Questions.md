# Negative gearing form questions

Question flow for the negative-gearing calculator (Phase 3 style) and a future
chatbot slot-filler (Phase 4 style). All variables use `period = year of the
enquiry` (the period only date-resolves the Division 43 rate parameter).

## Question flow

### Q1 — always ask
- **ng_entity_kind (year)**: What kind of entity holds the property?
  - `individual` — Individual
  - `smsf` — Self managed superannuation fund
  - `other_complying_super_fund` — Other complying superannuation entity
  - `widely_held_trust` — Widely held trust (e.g. a managed investment trust)
  - `other_trust` — Other trust
  - `company` — Company

### Q2 — always ask
- **ng_ownership_interest_acquired_date (year)**: What date did you enter into the
  contract to buy the property (or acquire your interest in it)? Use the contract
  date, not settlement.

### Q3 — always ask
- **ng_income_year_start_date (year)**: Which income year are you asking about?
  (Collect as 1 July of that income year, e.g. 2028-07-01 for the 2028-29 year.)

### Q4 — ask if the acquisition date is on/after 7:30pm AEST 12 May 2026
- **ng_is_new_residential_dwelling (year)**: Is the property a new residential
  dwelling — built on vacant land, or a rebuild that added more dwellings than were
  demolished — that you are the first to hold since construction? (yes/no)

### Q5 — advanced / optional, same condition as Q4
- **ng_is_minister_determined_exempt (year)**: Has the ATO listed your property,
  its use, or your entity type as an exception to the negative-gearing quarantine
  (e.g. affordable/social housing)? Default no — this covers rules not yet made by
  legislative instrument.
- **ng_is_fringe_benefit_expenditure (year)**: Is this expenditure incurred by an
  employer providing the property as a fringe benefit? Default no.

### Q6 — always ask
- **ng_ownership_percentage (year)**: What is your legal ownership share of the
  property (e.g. 0.5 for a 50/50 joint owner)? This is fixed by title, not by any
  private agreement about who pays what.

### Q7 — always ask
- **ng_rental_income (year)**: Total rent received for the property this year.
- **ng_interest_and_ownership_expenses (year)**: Loan interest, council rates,
  insurance and agent fees for the year.
- **ng_repairs_expense (year)**: Repairs (not improvements) for the year.
- **ng_borrowing_expense_this_year (year)**: This year's share of loan
  establishment costs (already spread over the loan period if applicable).

### Q8 — ask if claiming a capital works (building) deduction
- **ng_construction_expenditure (year)**: Original construction cost of the
  building.
- **ng_construction_start_date (year)**: Date construction began. (Only
  construction begun after 26 February 1992 gets a modelled deduction.)

### Q9 — ask if claiming decline in value of plant/equipment
- **ng_second_hand_depreciating_asset_decline_claimed (year)**: Decline in value
  claimed for depreciating assets (e.g. appliances) you did not hold when first
  used or installed by anyone.

### Q10 — ask if claiming travel
- **ng_travel_expense_claimed (year)**: Travel expenses claimed to inspect or
  maintain the property, or collect rent.

### Q11 — ask if the interest is in land without a completed dwelling
- **ng_holds_vacant_land (year)**: Is this vacant land (no substantial permanent
  structure)? (yes/no)
- If yes — **ng_vacant_land_holding_costs (year)**: Holding costs (incl. interest)
  for the year.
- If yes — **ng_land_has_rentable_structure_or_business_use (year)**: Is the land
  used in a business (incl. primary production), or does it have a dwelling that is
  lawfully occupiable and leased/available for lease? (yes/no)

### Q12 — ask only once Q3/Q4/Q5 indicate the quarantine could apply
- **ng_other_non_quarantined_dwellings_net_income (year)**: Net rental income
  (after expenses) this year from your OTHER properties that are not quarantined
  (bought before the announcement, or new builds). Default 0.
- **ng_residential_capital_gain_available (year)**: Any capital gain this year from
  disposing of a residential dwelling. Default 0.
- **ng_prior_year_quarantined_carried_forward (year)**: Quarantined amount carried
  forward from last year's calculation, if any. Default 0.
- **ng_taxpayer_bankrupt (year)**: Were you declared bankrupt this year or earlier?
  (yes/no) — extinguishes any carried-forward quarantined amount.

## Outputs to request in the payload
- Main: `ng_net_rental_result`, `ng_negative_gearing_offset_available`,
  `ng_quarantine_applies`
- Reform detail (only meaningful once quarantine could apply):
  `ng_current_year_quarantined_excess`, `ng_quarantined_excess_after_dwelling_offset`,
  `ng_quarantined_amount_applied_to_capital_gains`,
  `ng_quarantined_amount_carried_forward`, `ng_residential_capital_gain_after_offset`
- Diagnostic (drives the "why"): `ng_grandfathered_by_acquisition_date`,
  `ng_dwelling_exempt_from_quarantine`, `ng_exempt_from_quarantine`,
  `ng_exempt_from_current_law_denials`, `ng_reform_commenced_for_year`

## Variable catalogue (inputs vs outputs)
- **Inputs**: `ng_entity_kind`, `ng_ownership_interest_acquired_date`,
  `ng_income_year_start_date`, `ng_is_new_residential_dwelling`,
  `ng_is_minister_determined_exempt`, `ng_is_fringe_benefit_expenditure`,
  `ng_ownership_percentage`, `ng_rental_income`,
  `ng_interest_and_ownership_expenses`, `ng_repairs_expense`,
  `ng_borrowing_expense_this_year`, `ng_construction_expenditure`,
  `ng_construction_start_date`, `ng_second_hand_depreciating_asset_decline_claimed`,
  `ng_travel_expense_claimed`, `ng_holds_vacant_land`,
  `ng_vacant_land_holding_costs`, `ng_land_has_rentable_structure_or_business_use`,
  `ng_other_non_quarantined_dwellings_net_income`,
  `ng_residential_capital_gain_available`,
  `ng_prior_year_quarantined_carried_forward`, `ng_taxpayer_bankrupt`
- **Outputs (calculated)**: `ng_exempt_from_current_law_denials`,
  `ng_exempt_from_quarantine`, `ng_capital_works_deduction`,
  `ng_second_hand_asset_deductible_decline`, `ng_travel_deductible`,
  `ng_vacant_land_deductible_costs`, `ng_total_deductible_expenses`,
  `ng_net_rental_result`, `ng_reform_commenced_for_year`,
  `ng_grandfathered_by_acquisition_date`, `ng_dwelling_exempt_from_quarantine`,
  `ng_quarantine_applies`, `ng_negative_gearing_offset_available`,
  `ng_current_year_quarantined_excess`,
  `ng_quarantined_excess_after_dwelling_offset`,
  `ng_quarantined_amount_applied_to_capital_gains`,
  `ng_quarantined_amount_carried_forward`,
  `ng_residential_capital_gain_after_offset`
- **Policy parameters (do not collect)**: `negative_gearing.capital_works_rate`

## Field specification (for engineers)
- **`ng_entity_kind`** — type: enum (values above); required: yes; default:
  `individual`.
- **`ng_ownership_interest_acquired_date`** / **`ng_income_year_start_date`** /
  **`ng_construction_start_date`** — type: date; not in the future (except a
  forecast enquiry).
- **`ng_ownership_percentage`** — type: number, 0–1; default: 1.0.
- All `$`-amount inputs — type: number ≥ 0; default: 0.
- All boolean inputs — default: false, except
  `ng_land_has_rentable_structure_or_business_use` (default true — most vacant-land
  scenarios are asked about only when the flag matters).

## Display notes
- Always show the `reference` URL of each output as a "why" link, same as the other
  rulesets in this repo.
- Lead with `ng_negative_gearing_offset_available` when the quarantine does not
  apply, or `ng_quarantine_applies` plus the carry-forward waterfall
  (`ng_current_year_quarantined_excess` → `ng_quarantined_excess_after_dwelling_offset`
  → `ng_quarantined_amount_applied_to_capital_gains` →
  `ng_quarantined_amount_carried_forward`) when it does — the "no" (quarantined)
  outcome is exactly the case a taxpayer most wants explained.
- Show the standing caveat: guidance for exploring Rules as Code, not legal or tax
  advice; the Ministerial legislative instruments this ruleset stands in for as
  boolean inputs (new-build definition, further exceptions) do not exist yet.
