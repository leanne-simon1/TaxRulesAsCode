## PAYG form questions by scenario

### 1) Estimated annual net tax (estimated_net_tax_payable)
- **estimated_taxable_income (year)**: Estimated taxable income for the income year? (A$)
- **tax_offsets (year)**: Total tax offsets for the income year? (A$)
- **estimated_tax_credits (year)**: Estimated tax credits for the income year? (A$)
- Note: **corporate_tax_rate** is a policy parameter (no input required).

### 2) Estimated tax for the year (estimated_tax)
- Outcome: `estimated_tax = max(estimated_net_tax_payable, 0)`.

### 3) Year-to-date fraction (fraction_year_to_date)
- **current_quarter (month)**: Which quarter is this BAS?
  - 1 (Q1)
  - 2 (Q2)
  - 3 (Q3)
  - 4 (Q4)

### 4) YTD instalment adjustment (instalment_adjustment_year_to_date)
- **instalments_year_to_date (month)**: PAYG instalments YTD in the income year (BAS A label 5A)? (A$)
- **instalment_variation_credits_year_to_date (month)**: Instalment variation credits YTD (BAS A label 5B)? (A$)

### 5) Varied amount payable (varied_amount_payable)
- Derived from: estimated_tax(this_year), fraction_year_to_date, instalment_adjustment_year_to_date. No additional inputs.
- Main output to request in the payload: `varied_amount_payable`.
- Optional diagnostics: `fraction_year_to_date`, `instalment_adjustment_year_to_date`.

### 6) New varied rate (new_varied_rate)
- Derived from: estimated_tax(this_year), estimated_payg_instalment_income (year). No additional inputs.
- Validation: If `estimated_payg_instalment_income = 0`, the new varied rate is 0.
- Main output to request in the payload: `new_varied_rate`.

---

### Variable catalogue (inputs vs outputs)
- **Inputs (user-provided)**
  - Year: `estimated_taxable_income`, `tax_offsets`, `estimated_tax_credits`, `estimated_payg_instalment_income`
  - Month: `current_quarter`, `instalments_year_to_date`, `instalment_variation_credits_year_to_date`
- **Outputs (calculated)**
  - Main: `estimated_tax`, `varied_amount_payable`, `new_varied_rate`
  - Optional diagnostics: `fraction_year_to_date`, `instalment_adjustment_year_to_date`, `estimated_net_tax_payable`
- **Policy parameter (do not collect)**
  - `corporate_tax_rate`

### Field specification (for engineers)
- **`estimated_taxable_income`**
  - label: Estimated taxable income for the income year (A$)
  - period: year
  - type: currency/number
  - required: yes
  - validation: number ≥ 0, 2 decimal places

- **`non_refundable_tax_offsets` (year)**
  - label: Non‑refundable tax offsets for the income year (A$)
  - period: year
  - type: currency/number
  - required: no (enter 0 if none)
  - validation: number ≥ 0, 2 decimal places

- **`estimated_tax_credits`**
  - label: Estimated tax credits for the income year (A$)
  - period: year
  - type: currency/number
  - required: no (enter 0 if none)
  - validation: number ≥ 0, 2 decimal places

- **`current_quarter`**
  - label: Current quarter number (1–4)
  - period: month
  - type: enum {1,2,3,4}
  - required: yes
  - validation: must be one of {1,2,3,4}

- **`instalments_year_to_date`**
  - label: PAYG instalments year‑to‑date (BAS A label 5A) (A$)
  - period: month
  - type: currency/number
  - required: no (enter 0 if none)
  - validation: number ≥ 0, 2 decimal places

- **`instalment_variation_credits_year_to_date`**
  - label: Instalment variation credits year‑to‑date (BAS A label 5B) (A$)
  - period: month
  - type: currency/number
  - required: no (enter 0 if none)
  - validation: number ≥ 0, 2 decimal places

- Notes:
  - Do not collect `corporate_tax_rate`; it is provided by policy parameters.
  - Outputs `varied_amount_payable` and `new_varied_rate` are calculated and should be displayed as results, not collected from users.
