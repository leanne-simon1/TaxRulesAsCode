"""Negative gearing ruleset - deductibility of rental property losses under CURRENT
law, and the enacted negative-gearing quarantine commencing for the 2027-28 income
year.

Encodes `Negative Gearing Ruleset.md` (EM-verified 2026-07-08 against the ITAA 1997
text held locally and the Explanatory Memorandum for the Treasury Laws Amendment
(Tax Reform No. 1) Act 2026, Schedule 2; sources in `research/negative_gearing/`).
Every branch traces to a numbered rule statement; encode nothing that is not in the
reviewed ruleset markdown.

The engine holds BOTH the current-law position and the enacted-but-not-yet-effective
quarantine reform at once (same "one engine, both regimes" constraint as `cgt.py`,
which this ruleset also interacts with - see `ng_residential_capital_gain_available`
and the cost-base note below):

  * CURRENT law (rules 1.1-1.4, 2.1-2.7) - a rental loss is an ordinary deduction that
    offsets the entity's other assessable income; Division 35 (non-commercial losses)
    does not apply because passive letting is not "carrying on a business".
  * ENACTED REFORM (rule 3) - for a residential dwelling acquired on or after
    7:30pm AEST 12 May 2026, net rental losses are quarantined from the 2027-28 income
    year: they can only offset non-quarantined rental income, or residential capital
    gains, and otherwise carry forward.

SCOPE / SIMPLIFICATIONS (see ruleset section 5):
  * One dwelling per entity for the primary calculation; multi-property netting is
    represented by a single aggregate "other non-quarantined dwellings' net income"
    input rather than property-by-property aggregation.
  * The Ministerial legislative instruments (new-build definition, further
    Minister-determined dwelling/business/entity exceptions) do not exist yet, so are
    modelled as direct boolean inputs, not computed logic - the same simplification
    `cgt.py` uses for its own not-yet-defined new-build election.
  * The s 25-25 borrowing-expense spread is taken as a direct per-year input; mixed
    private/rental apportionment and the pre-1992 Division 43 rates are out of scope
    (construction begun before 26 February 1992 gets no modelled Division 43 deduction).
  * Grandfathering and commencement dates are compared at day granularity; the exact
    7:30pm time-of-day boundary on 12 May 2026 is a documented caveat.

Periods: all variables use YEAR; `ng_income_year_start_date` (1 July of the income
year in question) is the explicit date input that gates the reform, rather than the
enquiry period, mirroring `cgt.py`'s use of explicit date variables over `period`.
"""

from datetime import date

import numpy as np

from openfisca_core.indexed_enums import Enum
from openfisca_core.model_api import YEAR, Variable, where

from openfisca_rules.entities import TaxEntity

ITAA1997_URL = "https://www.legislation.gov.au/C2004A05138/latest/text#"
REFORM_ACT_URL = "https://www.legislation.gov.au/C2026A00049/asmade/text"
EM_URL = (
    "https://parlinfo.aph.gov.au/parlInfo/search/display/display.w3p;"
    "query=Id:%22legislation/ems/r7493_ems_a90ad43e-17d7-4cd3-859b-84ac4e6f3dea%22"
)

# 7:30pm AEST 12 May 2026 - the Budget announcement / grandfathering cut-off for the
# quarantine (ruleset rule 3.2), compared at day granularity (documented caveat).
ANNOUNCEMENT_DATE = np.datetime64("2026-05-12", "D")

# Net rental losses incurred in the 2027-28 income year (starting 1 July 2027) and
# later are subject to quarantining (ruleset rule 3.1).
REFORM_INCOME_YEAR_START = np.datetime64("2027-07-01", "D")

# Division 43 capital works: this ruleset models only the standard modern case,
# construction begun after 26 February 1992 (ruleset rule 2.5).
CAPITAL_WORKS_RATE_START = np.datetime64("1992-02-27", "D")

# Fixed instant at which the negative-gearing parameters are read (mirrors cgt.py's
# PARAMS_INSTANT), so the values resolve regardless of the enquiry period.
PARAMS_INSTANT = "2027-07-01"


# =============================================================================
# ENUMS
# =============================================================================


class NGEntityKind(Enum):
    """Entity holding the rental property - drives two DIFFERENT exception sets."""

    individual = "Individual"
    smsf = "Self managed superannuation fund"
    other_complying_super_fund = "Other complying superannuation entity"
    widely_held_trust = "Widely held trust (e.g. a managed investment trust)"
    other_trust = "Other trust"
    company = "Company"


# =============================================================================
# INPUT VARIABLES
# =============================================================================


class ng_entity_kind(Variable):
    value_type = Enum
    possible_values = NGEntityKind
    default_value = NGEntityKind.individual
    entity = TaxEntity
    definition_period = YEAR
    label = "Kind of entity holding the rental property"
    reference = ITAA1997_URL + "s26-31"
    documentation = """
    Drives two DIFFERENT current-law/reform exception sets (ruleset rule 3.5): the
    s 26-31/s 40-27 current-law denial exceptions exclude a super fund that is NOT an
    SMSF (an SMSF gets no relief there), while the s 26-155(4) quarantine exception
    is the opposite - SMSFs ARE excepted, alongside widely held trusts. A company is
    excepted from neither.
    Reference: s 26-31, s 40-27 ITAA 1997; new s 26-155(4) ITAA 1997 (Sch 2, Tax
    Reform No. 1 Act 2026)
    """


class ng_ownership_interest_acquired_date(Variable):
    value_type = date
    default_value = date(2020, 1, 1)
    entity = TaxEntity
    definition_period = YEAR
    label = "Date the ownership interest in the dwelling was acquired"
    reference = ITAA1997_URL + "s109-5"
    documentation = """
    For a contract purchase this is the CONTRACT date, not settlement (ruleset rule
    3.2). Determines grandfathering from the negative-gearing quarantine: interests
    acquired before 7:30pm AEST 12 May 2026 are exempt.
    Reference: new s 26-155(3) ITAA 1997 (Sch 2, Tax Reform No. 1 Act 2026)
    """


class ng_income_year_start_date(Variable):
    value_type = date
    default_value = date(2026, 7, 1)
    entity = TaxEntity
    definition_period = YEAR
    label = "1 July of the income year being calculated"
    reference = REFORM_ACT_URL
    documentation = """
    The quarantine applies to net rental losses incurred in the 2027-28 income year
    (starting 1 July 2027) and later (ruleset rule 3.1). This explicit date input
    gates the reform rather than the enquiry period.
    Reference: Sch 2, Tax Reform No. 1 Act 2026
    """


class ng_is_new_residential_dwelling(Variable):
    value_type = bool
    default_value = False
    entity = TaxEntity
    definition_period = YEAR
    label = "Dwelling is a 'new residential dwelling' in relation to the entity"
    reference = REFORM_ACT_URL
    documentation = """
    Exempts the dwelling from the quarantine regardless of acquisition date (ruleset
    rule 3.3). The Minister's legislative instrument defining this does not exist yet;
    modelled as a direct input rather than computed logic.
    Reference: new s 26-160(3)-(5) ITAA 1997 (Sch 2, Tax Reform No. 1 Act 2026)
    """


class ng_is_minister_determined_exempt(Variable):
    value_type = bool
    default_value = False
    entity = TaxEntity
    definition_period = YEAR
    label = "Dwelling, activity, business or entity is Minister-determined exempt"
    reference = REFORM_ACT_URL
    documentation = """
    Covers all three not-yet-made Minister determinations (ruleset rule 3.4): a
    dwelling's activity/purpose, a business/enterprise (e.g. affordable housing), or
    an entity class. Modelled as one combined input since none has concrete criteria
    yet.
    Reference: new s 26-155(2)(c),(d),(4)(c) ITAA 1997 (Sch 2, Tax Reform No. 1 Act
    2026)
    """


class ng_is_fringe_benefit_expenditure(Variable):
    value_type = bool
    default_value = False
    entity = TaxEntity
    definition_period = YEAR
    label = "Expenditure is incurred providing a fringe benefit"
    reference = REFORM_ACT_URL
    documentation = """
    Employer-provided housing expenditure is excepted from the quarantine (ruleset
    rule 3.4).
    Reference: new s 26-155(5) ITAA 1997 (Sch 2, Tax Reform No. 1 Act 2026)
    """


class ng_ownership_percentage(Variable):
    value_type = float
    default_value = 1.0
    entity = TaxEntity
    definition_period = YEAR
    label = "Entity's legal ownership share of the dwelling (/1)"
    reference = "https://www.ato.gov.au/law/view/document?DocID=TXR/TR9332/NAT/ATO/00001"
    documentation = """
    Net rental income or loss is split by LEGAL ownership interest, never by a
    private agreement between co-owners or by who paid the expenses (ruleset rule
    1.4).
    Reference: FC of T v McDonald (1987) 18 ATR 957; ATO TR 93/32
    """


class ng_rental_income(Variable):
    value_type = float
    default_value = 0.0
    entity = TaxEntity
    definition_period = YEAR
    label = "Gross rental income from the dwelling for the year ($)"
    reference = ITAA1997_URL + "s8-1"
    documentation = """
    The whole property's rental income for the year, before applying the entity's
    ownership share.
    Reference: s 8-1 ITAA 1997
    """


class ng_interest_and_ownership_expenses(Variable):
    value_type = float
    default_value = 0.0
    entity = TaxEntity
    definition_period = YEAR
    label = "Loan interest, rates, insurance and agent fees for the year ($)"
    reference = ITAA1997_URL + "s8-1"
    documentation = """
    General deductions under the ordinary rule (ruleset rule 2.1): deductible in full
    to the extent incurred in producing the rental income.
    Reference: s 8-1 ITAA 1997
    """


class ng_repairs_expense(Variable):
    value_type = float
    default_value = 0.0
    entity = TaxEntity
    definition_period = YEAR
    label = "Repairs expenditure for the year ($)"
    reference = ITAA1997_URL + "s25-10"
    documentation = """
    Immediately deductible (ruleset rule 2.1) - capital improvements are excluded and
    must instead be depreciated or written off under Division 43.
    Reference: s 25-10 ITAA 1997
    """


class ng_borrowing_expense_this_year(Variable):
    value_type = float
    default_value = 0.0
    entity = TaxEntity
    definition_period = YEAR
    label = "This year's share of borrowing expenses ($)"
    reference = ITAA1997_URL + "s25-25"
    documentation = """
    Loan establishment costs are spread over the loan period (capped at 5 years), or
    deducted immediately if $100 or less for the year (ruleset rule 2.2). This input
    takes the year's already-apportioned amount rather than re-deriving the spread.
    Reference: s 25-25 ITAA 1997
    """


class ng_construction_expenditure(Variable):
    value_type = float
    default_value = 0.0
    entity = TaxEntity
    definition_period = YEAR
    label = "Original construction expenditure on the capital works ($)"
    reference = ITAA1997_URL + "s43-10"
    documentation = """
    The base for the Division 43 capital works deduction (ruleset rule 2.5).
    Reference: s 43-10 ITAA 1997
    """


class ng_construction_start_date(Variable):
    value_type = date
    default_value = date(2000, 1, 1)
    entity = TaxEntity
    definition_period = YEAR
    label = "Date construction of the capital works began"
    reference = ITAA1997_URL + "s43-25"
    documentation = """
    The Division 43 rate depends on when construction began (ruleset rule 2.5); this
    ruleset models only the standard 2.5%-per-year case for works begun after 26
    February 1992 - earlier construction is out of scope (modelled deduction: nil).
    Reference: s 43-25 ITAA 1997
    """


class ng_second_hand_depreciating_asset_decline_claimed(Variable):
    value_type = float
    default_value = 0.0
    entity = TaxEntity
    definition_period = YEAR
    label = "Decline in value claimed for second-hand depreciating assets ($)"
    reference = ITAA1997_URL + "s40-27"
    documentation = """
    Decline in value of plant/equipment the entity did not hold when first used or
    installed by any entity (ruleset rule 2.4) - denied unless the entity is an
    excepted kind (rule 3.5's current-law exception set).
    Reference: s 40-27 ITAA 1997
    """


class ng_travel_expense_claimed(Variable):
    value_type = float
    default_value = 0.0
    entity = TaxEntity
    definition_period = YEAR
    label = "Travel expenses claimed to inspect/maintain the property or collect rent ($)"
    reference = ITAA1997_URL + "s26-31"
    documentation = """
    Denied from 1 July 2017 unless the entity is an excepted kind (ruleset rule 2.3).
    Reference: s 26-31 ITAA 1997
    """


class ng_holds_vacant_land(Variable):
    value_type = bool
    default_value = False
    entity = TaxEntity
    definition_period = YEAR
    label = "The interest is in vacant land (no substantial permanent structure)"
    reference = ITAA1997_URL + "s26-102"
    documentation = """
    Gates the vacant-land holding-cost denial (ruleset rule 2.6).
    Reference: s 26-102 ITAA 1997
    """


class ng_vacant_land_holding_costs(Variable):
    value_type = float
    default_value = 0.0
    entity = TaxEntity
    definition_period = YEAR
    label = "Holding costs (incl. loan interest) for vacant land for the year ($)"
    reference = ITAA1997_URL + "s26-102"
    documentation = """
    Denied unless the land is used in a business (incl. primary production) or has a
    rentable structure (ruleset rule 2.6).
    Reference: s 26-102 ITAA 1997
    """


class ng_land_has_rentable_structure_or_business_use(Variable):
    value_type = bool
    default_value = True
    entity = TaxEntity
    definition_period = YEAR
    label = "Vacant land has a rentable structure, or is used in a business"
    reference = ITAA1997_URL + "s26-102"
    documentation = """
    A simplified combination of s 26-102's several carve-outs (a lawfully-occupiable
    dwelling that is leased/available for lease; primary production; arm's-length
    business lease) into one flag (ruleset rule 2.6). Ignored unless
    ng_holds_vacant_land is true.
    Reference: s 26-102 ITAA 1997
    """


class ng_other_non_quarantined_dwellings_net_income(Variable):
    value_type = float
    default_value = 0.0
    entity = TaxEntity
    definition_period = YEAR
    label = "Net income from the entity's other, non-quarantined dwellings ($)"
    reference = EM_URL
    documentation = """
    Stands in for full multi-property aggregation (ruleset section 5 caveat): this
    year's quarantined excess is reduced by this amount before being applied to
    capital gains or carried forward (ruleset rule 3.7).
    Reference: new s 26-155(6) ITAA 1997 (Sch 2, Tax Reform No. 1 Act 2026)
    """


class ng_residential_capital_gain_available(Variable):
    value_type = float
    default_value = 0.0
    entity = TaxEntity
    definition_period = YEAR
    label = "Capital gain available this year from a residential dwelling ($)"
    reference = EM_URL
    documentation = """
    A quarantined amount can be applied against a residential capital gain via the
    new steps inserted in the s 102-5 method statement (ruleset rule 3.7). Taken as a
    direct input in this PoC rather than chaining to `cgt_gross_capital_gain` in
    `cgt.py` (a documented integration point, not yet wired up).
    Reference: EM Ch 2, paras 2.60-2.77; Capital Gains Tax Ruleset.md rule 1.6.7
    """


class ng_prior_year_quarantined_carried_forward(Variable):
    value_type = float
    default_value = 0.0
    entity = TaxEntity
    definition_period = YEAR
    label = "Quarantined amount carried forward from the prior income year ($)"
    reference = EM_URL
    documentation = """
    Added to this year's quarantined excess before offsets (ruleset rule 3.7), unless
    extinguished by bankruptcy (ruleset rule 3.8).
    Reference: new s 26-155(1)(c) ITAA 1997 (Sch 2, Tax Reform No. 1 Act 2026)
    """


class ng_taxpayer_bankrupt(Variable):
    value_type = bool
    default_value = False
    entity = TaxEntity
    definition_period = YEAR
    label = "Entity was declared bankrupt during or before this income year"
    reference = EM_URL
    documentation = """
    A quarantined amount accrued before bankruptcy is extinguished - it cannot be
    deducted or applied to gains afterwards (ruleset rule 3.8).
    Reference: new s 26-155(8),(9) ITAA 1997 (Sch 2, Tax Reform No. 1 Act 2026)
    """


# =============================================================================
# CALCULATED - entity-kind exception sets (ruleset rule 3.5)
# =============================================================================


class ng_exempt_from_current_law_denials(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "Entity is excepted from the s 26-31/s 40-27 current-law denials"
    reference = ITAA1997_URL + "s26-31"
    documentation = """
    True for a corporate tax entity, a superannuation fund that is NOT an SMSF, or a
    widely held trust (proxy for MIT/public unit trust) (ruleset rule 3.5). An SMSF
    is NOT excepted here, unlike the quarantine exception below.
    Reference: s 26-31(2), s 40-27(3) ITAA 1997
    """

    def formula(entities, period):
        kind = entities("ng_entity_kind", period)
        return (
            (kind == NGEntityKind.company)
            | (kind == NGEntityKind.other_complying_super_fund)
            | (kind == NGEntityKind.widely_held_trust)
        )


class ng_exempt_from_quarantine(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "Entity is excepted from the negative-gearing quarantine"
    reference = REFORM_ACT_URL
    documentation = """
    True for a widely held trust or ANY complying superannuation entity, INCLUDING an
    SMSF (ruleset rule 3.5) - the opposite SMSF treatment from the current-law
    denials above. A company is not excepted.
    Reference: new s 26-155(4) ITAA 1997 (Sch 2, Tax Reform No. 1 Act 2026)
    """

    def formula(entities, period):
        kind = entities("ng_entity_kind", period)
        return (
            (kind == NGEntityKind.widely_held_trust)
            | (kind == NGEntityKind.smsf)
            | (kind == NGEntityKind.other_complying_super_fund)
        )


# =============================================================================
# CALCULATED - what is deductible this year (current law, rules 2.1-2.7)
# =============================================================================


class ng_capital_works_deduction(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Division 43 capital works deduction for the year ($)"
    reference = ITAA1997_URL + "s43-25"
    documentation = """
    Construction expenditure times the standard rate, for works begun after 26
    February 1992 (ruleset rule 2.5); nil for earlier construction (out of scope).
    Reference: s 43-10, s 43-25 ITAA 1997
    """

    def formula(entities, period, parameters):
        expenditure = entities("ng_construction_expenditure", period)
        start = entities("ng_construction_start_date", period)
        rate = parameters(PARAMS_INSTANT).negative_gearing.capital_works_rate
        return where(start >= CAPITAL_WORKS_RATE_START, expenditure * rate, 0.0)


class ng_second_hand_asset_deductible_decline(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Deductible decline in value of second-hand depreciating assets ($)"
    reference = ITAA1997_URL + "s40-27"
    documentation = """
    Denied unless the entity is an excepted kind (ruleset rule 2.4).
    Reference: s 40-27 ITAA 1997
    """

    def formula(entities, period):
        claimed = entities("ng_second_hand_depreciating_asset_decline_claimed", period)
        exempt = entities("ng_exempt_from_current_law_denials", period)
        return where(exempt, claimed, 0.0)


class ng_travel_deductible(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Deductible travel expenses ($)"
    reference = ITAA1997_URL + "s26-31"
    documentation = """
    Denied unless the entity is an excepted kind (ruleset rule 2.3).
    Reference: s 26-31 ITAA 1997
    """

    def formula(entities, period):
        claimed = entities("ng_travel_expense_claimed", period)
        exempt = entities("ng_exempt_from_current_law_denials", period)
        return where(exempt, claimed, 0.0)


class ng_vacant_land_deductible_costs(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Deductible vacant-land holding costs ($)"
    reference = ITAA1997_URL + "s26-102"
    documentation = """
    Denied where the interest is vacant land without a rentable structure or
    business use (ruleset rule 2.6).
    Reference: s 26-102 ITAA 1997
    """

    def formula(entities, period):
        costs = entities("ng_vacant_land_holding_costs", period)
        is_vacant = entities("ng_holds_vacant_land", period)
        has_structure_or_business = entities(
            "ng_land_has_rentable_structure_or_business_use", period
        )
        denied = is_vacant & ~has_structure_or_business
        return where(denied, 0.0, costs)


class ng_total_deductible_expenses(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Total deductible expenses for the dwelling for the year ($)"
    reference = ITAA1997_URL + "s8-1"
    documentation = """
    The whole property's deductible expenses (before applying the entity's ownership
    share): general deductions, repairs, borrowing expenses, capital works, and the
    second-hand-asset/travel/vacant-land amounts surviving their respective denials
    (ruleset rules 2.1-2.6).
    Reference: s 8-1 ITAA 1997
    """

    def formula(entities, period):
        return (
            entities("ng_interest_and_ownership_expenses", period)
            + entities("ng_repairs_expense", period)
            + entities("ng_borrowing_expense_this_year", period)
            + entities("ng_capital_works_deduction", period)
            + entities("ng_second_hand_asset_deductible_decline", period)
            + entities("ng_travel_deductible", period)
            + entities("ng_vacant_land_deductible_costs", period)
        )


class ng_net_rental_result(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Entity's share of the net rental result for the year ($; negative = loss)"
    reference = ITAA1997_URL + "s8-1"
    documentation = """
    The entity's ownership share (ruleset rule 1.4) of rental income less total
    deductible expenses. Negative means a rental loss.
    Reference: s 8-1 ITAA 1997; FC of T v McDonald (1987) 18 ATR 957
    """

    def formula(entities, period):
        income = entities("ng_rental_income", period)
        expenses = entities("ng_total_deductible_expenses", period)
        share = entities("ng_ownership_percentage", period)
        return share * (income - expenses)


# =============================================================================
# CALCULATED - does the quarantine apply this year (rule 3)
# =============================================================================


class ng_reform_commenced_for_year(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "The income year is 2027-28 or later"
    reference = REFORM_ACT_URL
    documentation = """
    The quarantine applies to net rental losses incurred in the 2027-28 income year
    (starting 1 July 2027) and later (ruleset rule 3.1).
    Reference: Sch 2, Tax Reform No. 1 Act 2026
    """

    def formula(entities, period):
        start = entities("ng_income_year_start_date", period)
        return start >= REFORM_INCOME_YEAR_START


class ng_grandfathered_by_acquisition_date(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "Ownership interest was acquired before the Budget announcement"
    reference = REFORM_ACT_URL
    documentation = """
    Interests last acquired before 7:30pm AEST 12 May 2026 are exempt from the
    quarantine (ruleset rule 3.2; day-granularity, documented caveat).
    Reference: new s 26-155(2)(a),(3) ITAA 1997 (Sch 2, Tax Reform No. 1 Act 2026)
    """

    def formula(entities, period):
        acquired = entities("ng_ownership_interest_acquired_date", period)
        return acquired < ANNOUNCEMENT_DATE


class ng_dwelling_exempt_from_quarantine(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "The dwelling itself is exempt from the quarantine"
    reference = REFORM_ACT_URL
    documentation = """
    Grandfathered by acquisition date, a new residential dwelling, or
    Minister-determined exempt (ruleset rules 3.2-3.4).
    Reference: new s 26-155(2) ITAA 1997 (Sch 2, Tax Reform No. 1 Act 2026)
    """

    def formula(entities, period):
        grandfathered = entities("ng_grandfathered_by_acquisition_date", period)
        new_build = entities("ng_is_new_residential_dwelling", period)
        minister_exempt = entities("ng_is_minister_determined_exempt", period)
        return grandfathered | new_build | minister_exempt


class ng_quarantine_applies(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "The negative-gearing quarantine applies to this dwelling this year"
    reference = REFORM_ACT_URL
    documentation = """
    True only once the reform has commenced for the year, the dwelling itself is not
    exempt, the entity is not an excepted kind, and the amount is not fringe-benefit
    expenditure (ruleset rules 3.1-3.5).
    Reference: new s 26-155 ITAA 1997 (Sch 2, Tax Reform No. 1 Act 2026)
    """

    def formula(entities, period):
        commenced = entities("ng_reform_commenced_for_year", period)
        dwelling_exempt = entities("ng_dwelling_exempt_from_quarantine", period)
        entity_exempt = entities("ng_exempt_from_quarantine", period)
        fringe_benefit = entities("ng_is_fringe_benefit_expenditure", period)
        return commenced & ~dwelling_exempt & ~entity_exempt & ~fringe_benefit


# =============================================================================
# CALCULATED - the headline outcome and the carry-forward waterfall (rule 3.1, 3.7-3.8)
# =============================================================================


class ng_negative_gearing_offset_available(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "This year's rental loss deductible against other income ($)"
    reference = ITAA1997_URL + "s8-1"
    documentation = """
    THE headline "negative gearing" figure: the rental loss immediately usable
    against salary, wages or other assessable income this year. Zero whenever the
    quarantine applies (ruleset rule 3.1); otherwise the full loss (ruleset rule 1.2).
    Reference: s 8-1 ITAA 1997; new s 26-155(1) ITAA 1997
    """

    def formula(entities, period):
        result = entities("ng_net_rental_result", period)
        quarantined = entities("ng_quarantine_applies", period)
        loss = np.maximum(-result, 0.0)
        return where(quarantined, 0.0, loss)


class ng_current_year_quarantined_excess(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "This year's quarantined excess before offsets ($)"
    reference = REFORM_ACT_URL
    documentation = """
    The dwelling's own rental loss for the year, where the quarantine applies
    (ruleset rule 3.1).
    Reference: new s 26-155(1) ITAA 1997 (Sch 2, Tax Reform No. 1 Act 2026)
    """

    def formula(entities, period):
        result = entities("ng_net_rental_result", period)
        quarantined = entities("ng_quarantine_applies", period)
        loss = np.maximum(-result, 0.0)
        return where(quarantined, loss, 0.0)


class ng_quarantined_excess_after_dwelling_offset(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Quarantined excess after netting other non-quarantined dwellings ($)"
    reference = EM_URL
    documentation = """
    This year's quarantined excess, plus any carried-forward amount (extinguished
    instead if the entity is bankrupt, ruleset rule 3.8), reduced by net income from
    other non-quarantined dwellings, floored at zero (ruleset rule 3.7).
    Reference: new s 26-155(6) ITAA 1997 (Sch 2, Tax Reform No. 1 Act 2026)
    """

    def formula(entities, period):
        current = entities("ng_current_year_quarantined_excess", period)
        carried_forward = entities("ng_prior_year_quarantined_carried_forward", period)
        bankrupt = entities("ng_taxpayer_bankrupt", period)
        brought_in = where(bankrupt, 0.0, carried_forward)
        other_income = entities(
            "ng_other_non_quarantined_dwellings_net_income", period
        )
        return np.maximum(current + brought_in - other_income, 0.0)


class ng_quarantined_amount_applied_to_capital_gains(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Quarantined amount applied against residential capital gains ($)"
    reference = EM_URL
    documentation = """
    The lesser of the remaining quarantined excess and the residential capital gain
    available this year - the new steps inserted in the s 102-5 method statement
    (ruleset rule 3.7).
    Reference: EM Ch 2, paras 2.75; Capital Gains Tax Ruleset.md rule 1.6.7
    """

    def formula(entities, period):
        excess = entities("ng_quarantined_excess_after_dwelling_offset", period)
        gain = entities("ng_residential_capital_gain_available", period)
        return np.minimum(excess, gain)


class ng_quarantined_amount_carried_forward(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Quarantined amount carried forward to the next income year ($)"
    reference = EM_URL
    documentation = """
    Whatever remains after the dwelling offset and the capital-gains offset (ruleset
    rule 3.7) - feeds `ng_prior_year_quarantined_carried_forward` for the next year's
    calculation.
    Reference: new s 26-155(1)(c) ITAA 1997 (Sch 2, Tax Reform No. 1 Act 2026)
    """

    def formula(entities, period):
        excess = entities("ng_quarantined_excess_after_dwelling_offset", period)
        applied = entities("ng_quarantined_amount_applied_to_capital_gains", period)
        return excess - applied


class ng_residential_capital_gain_after_offset(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Residential capital gain remaining after the quarantine offset ($)"
    reference = EM_URL
    documentation = """
    The capital gain available this year, reduced by the quarantined amount applied
    to it (ruleset rule 3.7) - the amount that then flows into the ordinary CGT
    calculation (`cgt.py`'s `cgt_capital_losses_applied`, a documented integration
    point not yet wired up).
    Reference: EM Ch 2, para 2.75
    """

    def formula(entities, period):
        gain = entities("ng_residential_capital_gain_available", period)
        applied = entities("ng_quarantined_amount_applied_to_capital_gains", period)
        return gain - applied
