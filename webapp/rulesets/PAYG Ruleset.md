1. **Pay As You Go (PAYG) Instalment variation calculation ruleset**

   1. **Estimated tax for the year**

The estimated tax for the year is the greater of following:

1. Estimated annual net tax payable

2. Zero

   1. **Estimated annual net tax payable** 

1. Estimated taxable income

2. Multiplied by applicable tax rate

3. Less tax offsets (where greater than zero)[^1]

4. less estimated tax credits (where greater than zero)[^2]

   1. **Applicable tax rate**

The applicable tax rate for the purposes of the PoC is the base rate entity rate (currently 25%)[^3]

2. **Varied amount payable for the quarter**

The varied amount payable for the quarter is calculated as:

1. the estimated tax for the year

2. multiplied by the year-to-date fraction

3. less the year-to-date instalment adjustment

   1. **Year-to-date fraction**

The year-to-date fraction is the proportion of the income year completed by the end of the relevant quarter (Q1 \= 0.25, Q2 \= 0.5, Q3 \= 0.75, Q4 \= 1).

2. **Year-to-date instalment adjustment**

The year-to-date instalment adjustment is calculated as:

1. sum of instalments reported to date in the income year

2. less the sum of instalment variation credits reported to date in the income year

   3. **New varied rate**

1. estimated tax for the year

2. divided by estimated annual PAYG instalment income

3. multiplied by 100

   1. **estimated annual PAYG instalment income**

The PAYG instalment income[^4] is the ordinary income earned from business and investment activities (excluding GST) normally required for BAS label T1, except as an estimate for the entire year, instead of just the calculation for that quarter.

2. **Terms**

| Term | Definition | References |
| :---- | :---- | :---- |
| Estimated tax for the year | estimated amount of tax owed after applying estimated tax credits | Corresponds to BAS A label: T8 |
| Estimated taxable income | The predicted income for a taxpayer that is subject to income tax  | [Estimating tax on your instalment income | Australian Taxation Office](https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/payg-instalments/how-to-vary-your-payg-instalments/estimating-tax-on-your-instalment-income#BK_1Workoutyourestimatedtaxableincome) (step 1\) |
| Instalments reported | Instalment amounts reported for prior quarters | Corresponds to BAS A label: 5A (from prior lodgments) |
| Instalment variation credits reported | instalment credit amounts already claimed for prior quarters | Corresponds to BAS A label: 5B (from prior lodgments) |
| New varied rate | The tax rate used to calculate an instalment | Corresponds to BAS A label: T3 [How we calculate your PAYG instalment amount or rate | Australian Taxation Office](https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/payg-instalments/calculate-your-payg-instalments/how-we-calculate-your-payg-instalment-amount-or-rate#ato-Howwecalculateyourinstalmentrate) |
| PAYG instalment income | The income amount used for calculating the instalment rate | Corresponds to BAS A label: T1 [Instalment income | Australian Taxation Office](https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/payg-instalments/calculate-your-payg-instalments/instalment-income) |
| Varied amount payable for the quarter | The self-assessed instalment amount a taxpayer declares when electing to vary their PAYGI amount | Corresponds to BAS A label: T9 |

3. **PoC constraints and caveats**

For the purposes of the PoC, the ruleset can be used for an (test) entity only if all the following are true:

* The entity is a base rate entity[^5]

* The entity is not an income tax consolidated group head[^6]

* The entity is not a mandatory TOFA reporter[^7]

* The entity is not eligible for R\&D Offset[^8]

* The entity is not eligible for early-stage investor offset[^9]

* The entity reports on a standard income year[^10] that is twelve-months long

* The entity is a quarterly instalment payer[^11]

* The entity does not report gross payments subject to foreign resident withholding[^12]

* The entity does not report a loss at the gross distribution from partnerships[^13]

* The entity does not report a loss at the other gross income[^14]

[^1]:  [Estimating tax on your instalment income | Australian Taxation Office](https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/payg-instalments/how-to-vary-your-payg-instalments/estimating-tax-on-your-instalment-income#BK_3Subtacttaxoffsetsotherthanrefundable)

[^2]:  [Estimating tax on your instalment income | Australian Taxation Office](https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/payg-instalments/how-to-vary-your-payg-instalments/estimating-tax-on-your-instalment-income#BK_10Subtractanyestimatedtaxcredits)

[^3]:  [Company tax rates | Australian Taxation Office](https://www.ato.gov.au/tax-rates-and-codes/company-tax-rates)

[^4]:  [Instalment income | Australian Taxation Office](https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/payg-instalments/calculate-your-payg-instalments/instalment-income)

[^5]:  [INCOME TAX RATES ACT 1986 \- SECT 23AA Meaning of base rate entity](https://classic.austlii.edu.au/au/legis/cth/consol_act/itra1986174/s23aa.html)

[^6]:  [INCOME TAX ASSESSMENT ACT 1997 \- SECT 703.15 Members of a consolidated group or consolidatable group](https://www5.austlii.edu.au/au/legis/cth/consol_act/itaa1997240/s703.15.html)

[^7]:  [Taxation of financial arrangements (TOFA) | Australian Taxation Office](https://www.ato.gov.au/businesses-and-organisations/corporate-tax-measures-and-assurance/taxation-of-financial-arrangements-tofa)

[^8]:  [Eligibility for R\&D tax offsets | Australian Taxation Office](https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/incentives-and-concessions/research-and-development-tax-incentive-and-concessions/research-and-development-tax-incentive/eligibility-for-r-d-tax-offsets)

[^9]:  [Qualifying as an early stage innovation company | Australian Taxation Office](https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/incentives-and-concessions/tax-incentives-for-innovation/tax-incentives-for-early-stage-investors/qualifying-as-an-early-stage-innovation-company#Earlystagetestrequirements)

[^10]:  [Income year | Australian Taxation Office](https://www.ato.gov.au/forms-and-instructions/foreign-income-return-form-guide-2005/glossary/income-year)

[^11]:  [When are PAYG instalments due? | Australian Taxation OfficeWhen are PAYG instalments due? | Australian Taxation Office](https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/payg-instalments/when-are-payg-instalments-due)

[^12]:  [6\. Income | Australian Taxation Office](https://www.ato.gov.au/forms-and-instructions/company-tax-return-2022-instructions/instructions-to-complete-the-return/information-statement-items-6-to-25/6-income#ato-BGrosspaymentssubjecttoforeignresidentwithholding) – company tax return label 6B

[^13]:  [6\. Income | Australian Taxation Office](https://www.ato.gov.au/forms-and-instructions/company-tax-return-2022-instructions/instructions-to-complete-the-return/information-statement-items-6-to-25/6-income#ato-BGrosspaymentssubjecttoforeignresidentwithholding) – company tax return label 6D

[^14]:  [6\. Income | Australian Taxation Office](https://www.ato.gov.au/forms-and-instructions/company-tax-return-2022-instructions/instructions-to-complete-the-return/information-statement-items-6-to-25/6-income#ato-BGrosspaymentssubjecttoforeignresidentwithholding) – company tax return label 6R