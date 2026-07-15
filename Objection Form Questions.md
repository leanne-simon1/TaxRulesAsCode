# Objection rights form questions

Question flow for the objection-rights calculator / decision tree (Phase 3) and the
chatbot slot-filler (Phase 4). All variables use `period = year of the enquiry`
(the period only date-resolves the time-limit parameters).

> Updated 2026-07-06: `taxpayer_kind` is now also asked for `private_ruling` (its
> deadline's long limb follows the same 2yr/4yr split as income tax - previously
> encoded as a flat 4 years) and `excess_concessional_contributions_determination`
> (its whole deadline follows the 2yr/4yr split, not a flat 60 days). A new field,
> `related_assessment_notice_date`, is asked for
> `excess_concessional_contributions_determination` - see `research/README.md`
> "Findings from primary-text verification".

## Question flow

### Q1 — always ask
- **ato_decision_type (year)**: What kind of ATO decision are you dissatisfied with?
  - `income_tax_assessment` — Income tax assessment (original)
  - `income_tax_amended_assessment` — Amended income tax assessment
  - `private_ruling` — Private ruling
  - `gst_assessment` — GST assessment (net amount)
  - `fbt_assessment` — Fringe benefits tax assessment
  - `penalty_assessment` — Administrative penalty assessment
  - `super_guarantee_assessment` — Superannuation guarantee charge assessment
  - `excess_concessional_contributions_determination` — Excess concessional contributions determination
  - `sic_remission_decision` — Refusal to remit shortfall interest charge (SIC)
  - `gic_remission_decision` — Refusal to remit general interest charge (GIC)
  - `objection_extension_refusal` — Refusal of a request for more time to object
  - Anything else → **out of scope**: do not answer from this ruleset.

### Q2 — always ask (except `gic_remission_decision`, `objection_extension_refusal`)
- **decision_notice_date (year)**: What date is on the notice of the decision?
  (For an amended assessment: the date on the AMENDED notice. For a private ruling:
  the date the ruling was given. For an excess concessional contributions
  determination: the date the DETERMINATION was given - not the related assessment;
  see the separate question below.)

### Q3 — always ask
- **objection_lodgment_date (year)**: When will (or did) you lodge the objection?
  Default to today's date for "can I still object?" enquiries.

### Conditional questions, by decision type
- If `income_tax_assessment`, `income_tax_amended_assessment`, `private_ruling` or
  `excess_concessional_contributions_determination`:
  - **taxpayer_kind (year)**: Are you an individual, a small business entity, or
    another kind of entity? {`individual`, `small_business_entity`, `other`}
- If `income_tax_amended_assessment`:
  - **original_assessment_notice_date (year)**: What date is on the notice of the
    ORIGINAL assessment (before it was amended)?
- If `private_ruling`:
  - **has_assessment_for_ruling_period (year)**: Has an assessment already been
    issued for the period the ruling relates to? (yes/no)
  - **return_lodgment_due_date (year)**: What was the last day allowed for lodging
    the tax return the ruling relates to?
- If `excess_concessional_contributions_determination`:
  - **related_assessment_notice_date (year)**: What date is on the notice of your
    INCOME TAX ASSESSMENT for the same year (not the determination)? The objection
    period for the determination tracks this date, per s 14ZW(1)(aac) TAA 1953.
- If `sic_remission_decision`:
  - **sic_remaining_fraction_of_shortfall (year)**: After the ATO's decision, how
    much SIC is still payable, as a fraction of the tax shortfall? (e.g. 0.25 for
    25%; collect the two dollar amounts and divide if easier for the user)

## Outputs to request in the payload
- Main: `has_objection_right`, `objection_deadline`, `objection_in_time`,
  `recommended_pathway`
- Secondary: `can_request_extension`, `has_standard_amendment_period` (diagnostic)

## Variable catalogue (inputs vs outputs)
- **Inputs (user-provided, all period = year)**: `ato_decision_type`,
  `decision_notice_date`, `objection_lodgment_date`, `taxpayer_kind`,
  `original_assessment_notice_date`, `has_assessment_for_ruling_period`,
  `return_lodgment_due_date`, `related_assessment_notice_date`,
  `sic_remaining_fraction_of_shortfall`
- **Outputs (calculated)**: `has_objection_right`, `objection_deadline`,
  `objection_in_time`, `can_request_extension`, `recommended_pathway`,
  `has_standard_amendment_period`
- **Policy parameters (do not collect)**: `objections.standard_period_days`,
  `objections.shortened_review_period_years`, `objections.full_review_period_years`,
  `objections.sic_remission_objection_threshold`

## Field specification (for engineers)

- **`ato_decision_type`** — type: enum (values above); required: yes.
- **`decision_notice_date`** — type: date; required: yes except for the two
  no-right decision types; validation: not in the future.
- **`objection_lodgment_date`** — type: date; required: yes; default: today.
- **`taxpayer_kind`** — type: enum {individual, small_business_entity, other};
  required: for income tax (original/amended), private rulings, and excess
  concessional contributions determinations; default: individual.
- **`original_assessment_notice_date`** — type: date; required: only for
  `income_tax_amended_assessment`; validation: on or before `decision_notice_date`.
- **`has_assessment_for_ruling_period`** — type: boolean; required: only for
  `private_ruling`; default: no.
- **`return_lodgment_due_date`** — type: date; required: only for `private_ruling`.
- **`related_assessment_notice_date`** — type: date; required: only for
  `excess_concessional_contributions_determination`.
- **`sic_remaining_fraction_of_shortfall`** — type: number ≥ 0 (fraction, not %);
  required: only for `sic_remission_decision`.

## Display notes
- Always show the `reference` URL of each output variable as a "why" link, and the
  deadline with its start event ("60 days from the notice dated …").
- When `has_objection_right` is false, the headline result is `recommended_pathway`
  — the "no" branches matter as much as the "yes" branches.
- Show the standing caveat: guidance for exploring Rules as Code, not legal or tax
  advice; time limits assume the notice date entered is the service date.
