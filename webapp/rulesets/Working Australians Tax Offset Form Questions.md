# Working Australians Tax Offset form questions

Question flow for the WATO eligibility questionnaire and calculator (Phase 3 style)
and a future chatbot slot-filler (Phase 4 style). All variables use `period = year of
the enquiry`; `wato_income_year_start_date` is the explicit date input that gates
commencement, mirroring the CGT and negative-gearing rulesets.

## Question flow

### Q1 — always ask
- **wato_income_year_start_date (year)**: Which income year are you asking about?
  (Collect as 1 July of that income year, e.g. 2027-07-01 for the 2027-28 year.)
  If before 2027-07-01 the engine returns no entitlement (`wato_commenced_for_year`
  is false) — the questionnaire can stop here with that explanation.

### Q2 — always ask
- **wato_is_individual (year)**: Are you asking about a person (including a sole
  trader), rather than a company, trust or partnership? (yes/no) A "no" ends the
  flow: only individuals can be entitled (rule 1.1.1).

### Q3 — always ask
- **wato_is_australian_resident (year)**: Were you an Australian resident for tax
  purposes at **any time** during that income year? (yes/no) Part-year residency is
  enough (rule 1.1.2).

### Q4 — always ask (income from work; enter 0 for any that don't apply)
- **wato_salary_and_wages (year)**: Salary, wages, allowances and similar amounts
  from your job(s) for the year (rule 1.2.1(a)).
- **wato_sole_trader_business_income (year)**: Assessable income from a business you
  carry on **as an individual** (sole trader) — not through a partnership or trust
  (rule 1.2.1(b)).
- **wato_personal_services_income (year)**: Personal services income — income mainly
  a reward for your personal efforts or skills (rule 1.2.1(c)).
- **wato_ess_discounts (year)**: Employee share scheme discounts included in your
  assessable income (rule 1.2.1(d)).
- **wato_labour_hire_payments (year)**: Payments to you under labour-hire or similar
  arrangements (rule 1.2.1(e)).

Superannuation pension income, investment income (rent, dividends, interest,
capital gains) and partnership/trust distributions are **not** labour amounts —
they never count towards the offset.

### Q5 — always ask
- **wato_labour_deductions (year)**: Deductions attributable to that work income —
  work-related expenses (including the $1,000 instant deduction if used), sole-trader
  business outgoings, and work-use depreciation (rule 1.2.2). Enter 0 if none.

## Outputs to show

- **wato_entitled** — whether the person is entitled at all (rules 1.1.1–1.1.4),
  with the reason when not: pre-commencement year, not an individual, not a
  resident, or net labour income at/below $18,200.
- **wato_net_labour_income** — labour amounts minus labour deductions (rule 1.2.3).
- **wato_amount** — the offset: lesser of $250 and basic tax on net labour income
  alone (rule 1.3.1); show the phase-in when partial (rule 1.3.2).
- **wato_receives_full_amount** — whether the full $250 applies.
- Always caveat: non-refundable (rule 1.3.3), applied automatically on assessment
  (rule 1.3.4), guidance not advice.
