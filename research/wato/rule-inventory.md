# WATO rule inventory — statute → rule statement → encoding

Every row traces a provision of Schedule 3, Treasury Laws Amendment (Tax Reform No. 1)
Act 2026 (new Subdivision 61-E ITAA 1997) to a numbered rule in
`Working Australians Tax Offset Ruleset.md` and its encoding in
`openfisca_rules/variables/wato.py`.

| # | Provision | Rule (plain language) | Ruleset rule | Encoding |
|---|---|---|---|---|
| 1 | s 61-155(1)(a) | Entitled only if an **individual** who is an **Australian resident at any time** during the income year | 1.1.1, 1.1.2 | `wato_is_individual`, `wato_is_australian_resident` → `wato_entitled` |
| 2 | s 61-155(1)(b) | Net labour income must **exceed the tax-free threshold** (ITRA 1986: $18,200) | 1.1.3 | `wato_exceeds_tax_free_threshold`; parameter `wato/tax_free_threshold` |
| 3 | s 61-155(2) "labour amounts" (a)–(e) | Labour amounts = assessable labour income (salary/wages etc.) + sole-trader business income (not partnership/trust) + personal services income + s 83A-25 ESS discounts + labour-hire payments (s 12-60 Sch 1 TAA) | 1.2.1 | `wato_salary_and_wages`, `wato_sole_trader_business_income`, `wato_personal_services_income`, `wato_ess_discounts`, `wato_labour_hire_payments` → `wato_labour_amounts` |
| 4 | s 61-155(2) "labour deductions" (a)–(f) | Deductions attributable to those amounts (incl. the s 25-130 instant deduction, work-use depreciation, sole-trader outgoings) reduce the labour amounts | 1.2.2 | `wato_labour_deductions` (aggregate input — scope note 3.2) |
| 5 | s 61-155(2) formula, (3) | Net labour income = labour amounts − labour deductions; no double counting | 1.2.3 | `wato_net_labour_income` |
| 6 | s 61-160 | Amount = **lesser of $250** and the **basic income tax liability** if taxable income were only net labour income (⇒ 14% × (NLI − $18,200) phase-in between $18,200 and ≈$19,986) | 1.3.1, 1.3.2 | `wato_tax_on_net_labour_income`, `wato_amount`; parameters `wato/max_offset_amount`, `wato/resident_tax_scale` |
| 7 | s 63-10(1) new item 3 | **Non-refundable**, non-transferable, no carry-forward | 1.3.3 | documentation on `wato_amount` (the engine returns the offset entitlement, not a refund) |
| 8 | Sch 3 Part 2 (item 4) | Applies to assessments for the **2027-28 income year and later** | 1.1.4 | `wato_income_year_start_date` → `wato_commenced_for_year` |
| 9 | Budget factsheet (guidance) | Applied **automatically** on assessment — no claim needed | 1.3.4 | documentation only (no variable — nothing to compute) |

Decisions deliberately **out of scope** (ruleset section 3): itemising the six
labour-deduction paragraphs (single aggregate input instead), the s 995-1 "assessable
labour income" definitional edges, non-resident part-year rate scales (the s 61-160(b)
hypothetical is computed with the resident scale), and the LITO interaction (LITO is a
separate offset; it never changes the WATO amount).
