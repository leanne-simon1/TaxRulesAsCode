"""Working Australians Tax Offset (WATO) ruleset - entitlement to, and amount of,
the up-to-$250 tax offset on labour income, enacted for the 2027-28 income year and
later.

Encodes `Working Australians Tax Offset Ruleset.md` (primary-source verified
2026-07-10 against the enacted text of Schedule 3, Treasury Laws Amendment (Tax
Reform No. 1) Act 2026, C2026A00049, which inserts Subdivision 61-E - ss 61-150,
61-155, 61-160 - into the ITAA 1997; sources in `research/wato/`). Every branch
traces to a numbered rule statement; encode nothing that is not in the reviewed
ruleset markdown.

The measure is ENACTED BUT NOT YET IN EFFECT: it applies to assessments for the
2027-28 income year (starting 1 July 2027) and later (Sch 3, Part 2; ruleset rule
1.1.4). The offset:

  * needs an INDIVIDUAL who is an Australian resident at any time in the year
    (rule 1.1.1-1.1.2) whose NET LABOUR INCOME exceeds the $18,200 tax-free
    threshold (rule 1.1.3);
  * is the LESSER of $250 and the basic income tax liability there would be if
    taxable income were only that net labour income (rule 1.3.1) - so it phases in
    at the 14% first marginal rate between $18,200 and ~$19,986 (rule 1.3.2);
  * is non-refundable, non-transferable and cannot be carried forward
    (s 63-10(1) item 3; rule 1.3.3).

SCOPE / SIMPLIFICATIONS (see ruleset section 4):
  * The six labour-deduction paragraphs of s 61-155(2) are one aggregate input,
    not itemised sub-rules (same aggregate-input approach as negative_gearing.py).
  * The s 61-160(b) hypothetical "basic income tax liability" uses the resident
    basic rate scale only (dated parameter wato/resident_tax_scale) - no Medicare
    levy, no other offsets, no part-year non-resident scales.
  * Net labour income is floored at zero - a negative amount can never exceed the
    threshold, so the floor changes nothing the ruleset covers.

Periods: all variables use YEAR; `wato_income_year_start_date` (1 July of the income
year in question) is the explicit date input that gates commencement, mirroring
cgt.py and negative_gearing.py. Parameters are read at a fixed instant so the values
resolve regardless of the enquiry period.
"""

from datetime import date

import numpy as np

from openfisca_core.model_api import YEAR, Variable, where

from openfisca_rules.entities import TaxEntity

ITAA1997_URL = "https://www.legislation.gov.au/C2004A05138/latest/text#"
ITRA1986_URL = "https://www.legislation.gov.au/C2004A03437/latest/text"
REFORM_ACT_URL = "https://www.legislation.gov.au/C2026A00049/asmade/text"
BUDGET_FACTSHEET_URL = (
    "https://budget.gov.au/content/factsheets/download/"
    "tax-explainers-new-tax-cuts-workers.pdf"
)

# The WATO applies to assessments for the 2027-28 income year (starting 1 July
# 2027) and later (Sch 3, Part 2, Tax Reform No. 1 Act 2026; ruleset rule 1.1.4).
COMMENCEMENT_INCOME_YEAR_START = np.datetime64("2027-07-01", "D")

# Fixed instant at which the WATO parameters are read (mirrors cgt.py's
# PARAMS_INSTANT): the commencement-year values, incl. the 14% first marginal rate.
PARAMS_INSTANT = "2027-07-01"


# =============================================================================
# INPUT VARIABLES - who is asking, and their labour income facts
# =============================================================================


class wato_is_individual(Variable):
    value_type = bool
    default_value = True
    entity = TaxEntity
    definition_period = YEAR
    label = "The taxpayer is an individual (including a sole trader)"
    reference = REFORM_ACT_URL
    documentation = """
    Only an individual can be entitled to the WATO - a company, trust or
    partnership cannot (ruleset rule 1.1.1). A sole trader is an individual.
    Reference: s 61-155(1)(a) ITAA 1997 (Sch 3, Tax Reform No. 1 Act 2026)
    """


class wato_is_australian_resident(Variable):
    value_type = bool
    default_value = True
    entity = TaxEntity
    definition_period = YEAR
    label = "Australian resident at any time during the income year"
    reference = REFORM_ACT_URL
    documentation = """
    Residency at ANY time during the income year is enough - a full year is not
    required (ruleset rule 1.1.2).
    Reference: s 61-155(1)(a) ITAA 1997 (Sch 3, Tax Reform No. 1 Act 2026)
    """


class wato_income_year_start_date(Variable):
    value_type = date
    default_value = date(2027, 7, 1)
    entity = TaxEntity
    definition_period = YEAR
    label = "1 July of the income year being calculated"
    reference = REFORM_ACT_URL
    documentation = """
    The WATO applies to assessments for the 2027-28 income year (starting 1 July
    2027) and later (ruleset rule 1.1.4). This explicit date input gates
    commencement rather than the enquiry period.
    Reference: Sch 3, Part 2, Tax Reform No. 1 Act 2026
    """


class wato_salary_and_wages(Variable):
    value_type = float
    default_value = 0
    entity = TaxEntity
    definition_period = YEAR
    label = "Assessable labour income - salary, wages, allowances ($)"
    reference = REFORM_ACT_URL
    documentation = """
    Labour amounts paragraph (a): assessable labour income - salary, wages,
    allowances and similar remuneration from working (ruleset rule 1.2.1(a)).
    Reference: s 61-155(2) ITAA 1997, "labour amounts" para (a)
    """


class wato_sole_trader_business_income(Variable):
    value_type = float
    default_value = 0
    entity = TaxEntity
    definition_period = YEAR
    label = "Assessable income from a business carried on as an individual ($)"
    reference = REFORM_ACT_URL
    documentation = """
    Labour amounts paragraph (b): sole-trader business income. Assessable income
    from a business carried on by a PARTNERSHIP or TRUST does not count (ruleset
    rule 1.2.1(b)).
    Reference: s 61-155(2) ITAA 1997, "labour amounts" para (b)
    """


class wato_personal_services_income(Variable):
    value_type = float
    default_value = 0
    entity = TaxEntity
    definition_period = YEAR
    label = "Personal services income ($)"
    reference = ITAA1997_URL + "s84-5"
    documentation = """
    Labour amounts paragraph (c): personal services income - income mainly a reward
    for the individual's personal efforts or skills (ruleset rule 1.2.1(c)).
    Reference: s 61-155(2) ITAA 1997, "labour amounts" para (c); s 84-5 ITAA 1997
    """


class wato_ess_discounts(Variable):
    value_type = float
    default_value = 0
    entity = TaxEntity
    definition_period = YEAR
    label = "Employee share scheme discounts included in assessable income ($)"
    reference = ITAA1997_URL + "s83A-25"
    documentation = """
    Labour amounts paragraph (d): discounts on ESS interests included in assessable
    income under s 83A-25 (ruleset rule 1.2.1(d)).
    Reference: s 61-155(2) ITAA 1997, "labour amounts" para (d); s 83A-25 ITAA 1997
    """


class wato_labour_hire_payments(Variable):
    value_type = float
    default_value = 0
    entity = TaxEntity
    definition_period = YEAR
    label = "Payments under labour hire and similar arrangements ($)"
    reference = "https://www.legislation.gov.au/C1953A00001/latest/text#s12-60"
    documentation = """
    Labour amounts paragraph (e): payments subject to withholding under s 12-60 in
    Schedule 1 to the TAA 1953 (labour hire and certain other arrangements),
    whether or not the amount was actually withheld (ruleset rule 1.2.1(e)).
    Reference: s 61-155(2) ITAA 1997, "labour amounts" para (e)
    """


class wato_labour_deductions(Variable):
    value_type = float
    default_value = 0
    entity = TaxEntity
    definition_period = YEAR
    label = "Deductions attributable to the labour amounts ($)"
    reference = REFORM_ACT_URL
    documentation = """
    The sum of the s 61-155(2) "labour deductions" paragraphs (a)-(f): work-related
    outgoings, sole-trader business outgoings, the s 25-130 $1,000 instant
    deduction, and work-use depreciation (ruleset rule 1.2.2). Modelled as one
    aggregate input rather than itemised sub-rules (ruleset scope note 4.1).
    Reference: s 61-155(2) ITAA 1997, "labour deductions" paras (a)-(f)
    """


# =============================================================================
# CALCULATED - net labour income (rule 1.2) and the entitlement gates (rule 1.1)
# =============================================================================


class wato_labour_amounts(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Labour amounts - the s 61-155(2) work-income components summed ($)"
    reference = REFORM_ACT_URL
    documentation = """
    The sum of the five labour-amounts paragraphs (ruleset rule 1.2.1). Amounts
    covered by more than one paragraph are counted once (s 61-155(3)) - the inputs
    are defined as non-overlapping, so a plain sum implements that here.
    Reference: s 61-155(2) ITAA 1997, "labour amounts"
    """

    def formula(entities, period):
        return (
            entities("wato_salary_and_wages", period)
            + entities("wato_sole_trader_business_income", period)
            + entities("wato_personal_services_income", period)
            + entities("wato_ess_discounts", period)
            + entities("wato_labour_hire_payments", period)
        )


class wato_net_labour_income(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Net labour income - labour amounts minus labour deductions ($)"
    reference = REFORM_ACT_URL
    documentation = """
    The s 61-155(2) formula: labour amounts - labour deductions (ruleset rule
    1.2.3). Floored at zero: a negative amount can never exceed the tax-free
    threshold, so the floor changes no outcome (ruleset scope note 4.4).
    Reference: s 61-155(2) ITAA 1997
    """

    def formula(entities, period):
        amounts = entities("wato_labour_amounts", period)
        deductions = entities("wato_labour_deductions", period)
        return np.maximum(amounts - deductions, 0)


class wato_commenced_for_year(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "The income year is 2027-28 or later"
    reference = REFORM_ACT_URL
    documentation = """
    The WATO applies to assessments for the 2027-28 income year and later income
    years (ruleset rule 1.1.4).
    Reference: Sch 3, Part 2, item 4, Tax Reform No. 1 Act 2026
    """

    def formula(entities, period):
        start = entities("wato_income_year_start_date", period)
        return start >= COMMENCEMENT_INCOME_YEAR_START


class wato_exceeds_tax_free_threshold(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "Net labour income exceeds the $18,200 tax-free threshold"
    reference = ITRA1986_URL
    documentation = """
    Entitlement needs net labour income to EXCEED the tax-free threshold (within
    the meaning of the Income Tax Rates Act 1986) - exactly $18,200 is not enough
    (ruleset rule 1.1.3). The threshold is the dated parameter
    wato/tax_free_threshold.
    Reference: s 61-155(1)(b) ITAA 1997
    """

    def formula(entities, period, parameters):
        nli = entities("wato_net_labour_income", period)
        threshold = parameters(PARAMS_INSTANT).wato.tax_free_threshold
        return nli > threshold


class wato_entitled(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "Entitled to the Working Australians Tax Offset"
    reference = REFORM_ACT_URL
    documentation = """
    All the s 61-155(1) gates together (ruleset rules 1.1.1-1.1.4): an individual,
    an Australian resident at any time in the year, an income year of 2027-28 or
    later, and net labour income above the tax-free threshold.
    Reference: s 61-155(1) ITAA 1997 (Sch 3, Tax Reform No. 1 Act 2026)
    """

    def formula(entities, period):
        individual = entities("wato_is_individual", period)
        resident = entities("wato_is_australian_resident", period)
        commenced = entities("wato_commenced_for_year", period)
        exceeds = entities("wato_exceeds_tax_free_threshold", period)
        return individual & resident & commenced & exceeds


# =============================================================================
# CALCULATED - the amount (rule 1.3)
# =============================================================================


class wato_tax_on_net_labour_income(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Basic income tax there would be on net labour income alone ($)"
    reference = ITRA1986_URL
    documentation = """
    The s 61-160(b) hypothetical: the basic income tax liability if taxable income
    consisted only of net labour income - computed with the resident basic rate
    scale (dated parameter wato/resident_tax_scale; 14% first marginal rate from
    1 July 2027), with no Medicare levy and no other offsets (ruleset rule 1.3.1
    and scope note 4.2). This is what makes the offset phase in at 14c/$ between
    $18,200 and ~$19,986 (ruleset rule 1.3.2).
    Reference: s 61-160(b) ITAA 1997; Income Tax Rates Act 1986 Sch 7
    """

    def formula(entities, period, parameters):
        nli = entities("wato_net_labour_income", period)
        scale = parameters(PARAMS_INSTANT).wato.resident_tax_scale
        return scale.calc(nli)


class wato_amount(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Working Australians Tax Offset for the year ($)"
    reference = REFORM_ACT_URL
    documentation = """
    The lesser of the $250 cap (dated parameter wato/max_offset_amount) and the
    basic tax there would be on net labour income alone; nil if not entitled
    (ruleset rule 1.3.1). NON-REFUNDABLE: it reduces tax payable to no less than
    zero, cannot be transferred and cannot be carried forward (s 63-10(1) item 3;
    ruleset rule 1.3.3). Applied automatically on assessment - nothing to claim
    (ruleset rule 1.3.4).
    Reference: s 61-160 ITAA 1997; s 63-10(1) ITAA 1997 item 3
    """

    def formula(entities, period, parameters):
        entitled = entities("wato_entitled", period)
        tax_on_nli = entities("wato_tax_on_net_labour_income", period)
        cap = parameters(PARAMS_INSTANT).wato.max_offset_amount
        return where(entitled, np.minimum(tax_on_nli, cap), 0)


class wato_receives_full_amount(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "The full $250 offset applies (no phase-in shortfall)"
    reference = BUDGET_FACTSHEET_URL
    documentation = """
    True when the s 61-160(b) hypothetical tax reaches the $250 cap - i.e. net
    labour income of about $19,986 or more (ruleset rule 1.3.2; the Budget
    factsheet's "97 per cent ... receive the full $250 offset").
    Reference: s 61-160 ITAA 1997; Budget 2026-27 factsheet
    """

    def formula(entities, period, parameters):
        entitled = entities("wato_entitled", period)
        tax_on_nli = entities("wato_tax_on_net_labour_income", period)
        cap = parameters(PARAMS_INSTANT).wato.max_offset_amount
        return entitled & (tax_on_nli >= cap)
