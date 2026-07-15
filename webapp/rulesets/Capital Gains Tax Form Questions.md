# Capital gains tax form questions

Question flow for the CGT calculator (single-asset disposal, current law vs. the
enacted 1 July 2027 reform). All variables use `period = year of the CGT event`
(the period only date-resolves the CGT/reform parameters — both regimes are held
live at once so the actual, grandfathered outcome can be computed for any date;
see `openfisca_rules/variables/cgt.py`).

## Question flow

### Q1 — always ask
- **cgt_entity_kind (year)**: What kind of entity is disposing of the asset?
  - `individual` — Individual
  - `trust` — Trust (individual beneficiary)
  - `complying_super_fund` — Complying superannuation fund (accumulation)
  - `company` — Company

### Q2 — always ask
- **cgt_acquisition_date (year)**: When was the asset acquired (or, for a
  forecast, when will it be)?
- **cgt_disposal_date (year)**: What is the date of the CGT event — the
  CONTRACT date for a sale, not settlement (or the expected contract date, for
  a forecast)?

### Q3 — always ask
- **cgt_cost_base (year)**: What is the asset's cost base? (A$)
- **cgt_capital_proceeds (year)**: What are the capital proceeds from the
  disposal? (A$)
- **cgt_capital_losses_applied (year)**: Capital losses to apply against this
  gain, before any discount or indexation? (A$; enter 0 if none)

### Q4 — always ask
- **cgt_marginal_rate (year)**: What tax rate applies to the entity's net
  capital gain? (%; e.g. the individual's top marginal rate, 25/30 for a
  company, 15 for a complying super fund's accumulation phase)

### Q5 — always ask
- **cgt_assumed_annual_inflation (year)**: What annual CPI inflation rate
  should be assumed for indexation under the amended (post-1 July 2027) rules?
  (%; default 2.5, the RBA target midpoint — only affects a gain accruing from
  1 July 2027; ignored under current law)

### Conditional questions — only where the holding period straddles 1 July 2027
(acquired before that date, disposed on or after it)
- **cgt_transition_method (year)**: How should the gain be split between the
  grandfathered pre-reform period and the post-reform period?
  - `time_apportionment` — Time apportionment (gain assumed to accrue evenly
    over the ownership period)
  - `market_value` — Market value of the asset at 1 July 2027
- If `market_value`:
  - **cgt_market_value_at_reform (year)**: What was the asset's market value
    at 1 July 2027? (A$)

## Outputs to request in the payload
- Main: `cgt_actual_tax`, `cgt_actual_regime` — the real, grandfathered outcome
  for the dates entered.
- Comparison ("what if"): `cgt_current_rules_tax`, `cgt_amended_rules_tax`,
  `cgt_amended_vs_current_difference`, `cgt_actual_vs_current_difference`.
- Diagnostics / "why": `cgt_is_long_term`, `cgt_gross_capital_gain`,
  `cgt_gain_after_losses`, `cgt_discount_percentage`, `cgt_indexation_relief`,
  `cgt_current_rules_taxable_gain`, `cgt_amended_rules_taxable_gain`,
  `cgt_amended_rules_rate`, `cgt_affected_by_reform`,
  `cgt_transition_pre_fraction`, `cgt_holding_period_days`.

## Variable catalogue (inputs vs outputs)
- **Inputs (user-provided, all period = year)**: `cgt_entity_kind`,
  `cgt_acquisition_date`, `cgt_disposal_date`, `cgt_cost_base`,
  `cgt_capital_proceeds`, `cgt_capital_losses_applied`, `cgt_marginal_rate`,
  `cgt_assumed_annual_inflation`, `cgt_transition_method`,
  `cgt_market_value_at_reform`
- **Outputs (calculated)**: `cgt_holding_period_days`, `cgt_is_long_term`,
  `cgt_gross_capital_gain`, `cgt_gain_after_losses`, `cgt_discount_percentage`,
  `cgt_indexation_relief`, `cgt_current_rules_taxable_gain`,
  `cgt_current_rules_tax`, `cgt_affected_by_reform`,
  `cgt_amended_rules_taxable_gain`, `cgt_amended_rules_rate`,
  `cgt_amended_rules_tax`, `cgt_actual_regime`, `cgt_transition_pre_fraction`,
  `cgt_actual_tax`, `cgt_amended_vs_current_difference`,
  `cgt_actual_vs_current_difference`
- **Policy parameters (do not collect)**: `cgt.discount_percentage.*`,
  `cgt.long_term_holding_days`, `cgt.minimum_tax_rate`

## Field specification (for engineers)
- **`cgt_entity_kind`** — type: enum (values above); required: yes; default:
  `individual`.
- **`cgt_acquisition_date`** — type: date; required: yes; default:
  `2000-01-01` (forecast: enter the expected purchase date).
- **`cgt_disposal_date`** — type: date; required: yes; default: `2028-07-01`;
  validation: on or after `cgt_acquisition_date` (forecast: enter the expected
  contract date).
- **`cgt_cost_base`** — type: currency/number; required: yes; validation:
  number ≥ 0.
- **`cgt_capital_proceeds`** — type: currency/number; required: yes;
  validation: number ≥ 0.
- **`cgt_capital_losses_applied`** — type: currency/number; required: no
  (enter 0 if none); validation: number ≥ 0.
- **`cgt_marginal_rate`** — type: percentage; required: yes; default: 45;
  validation: 0–100.
- **`cgt_assumed_annual_inflation`** — type: percentage; required: no;
  default: 2.5; only relevant where the gain accrues from 1 July 2027.
- **`cgt_transition_method`** — type: enum {time_apportionment, market_value};
  required: only when the holding period straddles 1 July 2027; default:
  `time_apportionment`.
- **`cgt_market_value_at_reform`** — type: currency/number; required: only
  when `cgt_transition_method = market_value`; validation: number ≥ 0.

## Display notes
- Always show the `reference` URL of each output variable as a "why" link (see
  `explorer.html` / the `/variable/<name>` metadata).
- Lead with `cgt_actual_regime` and `cgt_actual_tax` — the real, grandfathered
  outcome for the dates entered — before the `cgt_current_rules_tax` /
  `cgt_amended_rules_tax` "what if" comparison either side of it.
- Show the standing caveat: guidance for exploring Rules as Code, not tax
  advice. Scope is a single-asset disposal only — see the ruleset's "PoC
  constraints and caveats" section (`Capital Gains Tax Ruleset.md`).
