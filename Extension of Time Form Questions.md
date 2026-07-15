# Extension of time (s 14ZX) form questions

Question flow for the EOT sense-check tool (`webapp/eot.html`) and for a
Copilot-style officer assistant using the engine as a grounded tool. All
variables use `period = year of the enquiry`. The subject is an ATO **officer or
reviewer** sense-checking a proposed s 14ZX decision (not a taxpayer asking "can
I object?" — that flow is `Objection Form Questions.md`).

The flow has three stages that mirror the Rule Determinism Model: deterministic
gatekeepers first (engine decides), factor record second (human decides, engine
records), sense check last (engine flags, human remains the decision maker).

## Stage 1 — gatekeepers (reuses the Objection Rights flow)

Ask the Objection Rights questions Q1–Q3 plus conditionals (decision type,
notice date(s), lodgment date, taxpayer kind, …) to establish:

- `has_objection_right` — anything to extend at all?
- `objection_deadline`, `objection_in_time`, `eot_days_late` — is it actually late?
- `can_request_extension` — is the mechanism available for this decision type?

Then the two request formalities (human findings on the lodged documents):

- **eot_request_in_writing (year)**: Was the late objection lodged together with
  a WRITTEN request to deal with it as if in time? (s 14ZW(2)) (yes/no)
- **eot_request_states_circumstances_fully (year)**: Does the request state the
  circumstances of, and reasons for, the lateness FULLY AND IN DETAIL?
  (s 14ZW(3)) (yes/no) — a "No" does NOT invalidate the request: it raises
  `eot_prompt_seek_further_information` (PS LA 2003/7 [6]) instead of blocking
  engagement.

Output gate: `eot_discretion_engaged` (= extension available AND written
request lodged). If false → stop; report `eot_flag_discretion_not_engaged` if
an outcome was proposed anyway.

## Stage 2 — factor record (only if the discretion is engaged)

Each question records the decision maker's finding (the engine never infers
these from other facts):

- **eot_explanation_covers_whole_period (year)**: Does the explanation genuinely
  account for the WHOLE period of the delay? (yes/no)
- **eot_objection_arguable (year)**: Is the objection arguable — not frivolous,
  not bound to fail in law? Low bar; no full merits investigation. (yes/no)
- **eot_concrete_prejudice_to_commissioner (year)**: Has concrete prejudice to
  the Commissioner's ability to deal with the dispute been identified?
  Administrative inconvenience does not count. (yes/no)
- **eot_ato_conduct_contributed (year)**: Did ATO conduct (action or inaction)
  contribute to the delay? (yes/no)
- **eot_taxpayer_rested_on_rights (year)**: Did the taxpayer rest on their
  rights — no signal of contest, no steps taken while time ran? (yes/no)

Also shown (calculated): `eot_delay_band` (short / moderate / long — descriptive
framing only, from dated parameters).

## Stage 3 — sense check (optional)

- **eot_proposed_outcome (year)**: What outcome is proposed?
  {`undecided`, `agree`, `refuse`} — default `undecided` (no sense check).

## Outputs to request in the payload

- Gatekeepers: `eot_discretion_engaged`, `eot_days_late`, `eot_delay_band`,
  `eot_art_review_available_if_refused`
- Flags and prompts: `eot_flag_discretion_not_engaged`,
  `eot_flag_atypical_refusal`, `eot_flag_atypical_grant`,
  `eot_prompt_seek_further_information`
- **Never requested (does not exist): an engine grant/refuse outcome.**

## Variable catalogue (inputs vs outputs)

- **Inputs (new, all period = year)**: `eot_request_in_writing`,
  `eot_request_states_circumstances_fully`,
  `eot_explanation_covers_whole_period`, `eot_objection_arguable`,
  `eot_concrete_prejudice_to_commissioner`, `eot_ato_conduct_contributed`,
  `eot_taxpayer_rested_on_rights`, `eot_proposed_outcome`
  (plus all Objection Rights inputs for Stage 1)
- **Outputs (calculated)**: `eot_discretion_engaged`, `eot_days_late`,
  `eot_delay_band`, `eot_art_review_available_if_refused`,
  `eot_flag_discretion_not_engaged`, `eot_flag_atypical_refusal`,
  `eot_flag_atypical_grant`, `eot_prompt_seek_further_information`
- **Policy parameters (do not collect; specialist-maintained)**:
  `eot.short_delay_max_days`, `eot.long_delay_min_days`
