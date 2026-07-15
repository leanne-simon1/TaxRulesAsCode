"""Capital gains tax ruleset - the taxable gain and tax cost on disposal of a
single CGT asset, under CURRENT law and under the enacted 1 July 2027 reform.

Encodes `Capital Gains Tax Ruleset.md` (primary-source verified 2026-07-07 against
ITAA 1997 and the Treasury Laws Amendment (Tax Reform No. 1) Act 2026, C2026A00049;
sources in `research/cgt/`). Every branch traces to a numbered rule statement;
encode nothing that is not in the reviewed ruleset markdown.

The engine holds BOTH regimes at once (ruleset PoC constraint: "one engine, both
regimes", section 1.6 encoded as dated law gated on the CGT-event / accrual date):

  * CURRENT rules  - gain after losses, then the 50% discount (individuals/trusts),
    33 1/3% (super), nil (companies); taxed at the entity's rate. (rules 1.3-1.5)
  * AMENDED rules  - for gains accruing from 1 July 2027 the discount is abolished
    for individuals/trusts and replaced by CPI indexation of the cost base plus a
    30% minimum tax. (rule 1.6)
  * ACTUAL         - the grandfathered/transitional outcome for the actual dates: a
    gain straddling 1 July 2027 is split (time-apportionment or market value at the
    reform) into a grandfathered pre-reform part (current rules) and a post-reform
    part (amended rules). (rule 1.6.4)

This lets the calculator show "current vs amended" side by side and the
grandfathered reality, and forecast future purchase/sale dates (the regime follows
the dates).

SCOPE / SIMPLIFICATIONS (see ruleset section 3 and the caveats below):
  * One disposal, one entity; post-1985 (post-CGT) asset; no exempt asset classes,
    main-residence, small-business concessions, foreign-resident apportionment,
    pre-CGT market-value reset (rule 1.6.6) or new-build election (rule 1.6.5).
  * Indexation is modelled from an assumed annual inflation rate input (CPI over the
    holding period, no frozen index); the legacy frozen-index method (rule 1.3.4) is
    not offered.
  * The 30% minimum tax is modelled as an effective-rate floor on the post-reform
    taxable gain, not the full 7-step s 119-10 top-up; the income-support exemption
    (s 119-15) is not modelled.
  * The 12-month long-term test uses 365 days; boundary day-counting is a caveat.

Periods: all variables use YEAR (the enquiry year only date-resolves parameters);
the CGT facts themselves are the date inputs below. Parameters are read at fixed
instants so both regimes are available regardless of the enquiry period.
"""

from datetime import date

import numpy as np

from openfisca_core.indexed_enums import Enum
from openfisca_core.model_api import YEAR, Variable, select, where

from openfisca_rules.entities import TaxEntity

ITAA1997_URL = "https://www.legislation.gov.au/C2004A05138/latest/text#"
REFORM_ACT_URL = "https://www.legislation.gov.au/C2026A00049/asmade/text"
BUDGET_FACTSHEET_URL = (
    "https://budget.gov.au/content/factsheets/download/"
    "tax-explainers-negative-gearing-capital-gains-tax.pdf"
)

# Commencement of the enacted CGT reform (Tax Reform No. 1 Act 2026): gains
# accruing from this date fall under the amended rules (ruleset rule 1.6).
REFORM_DATE = np.datetime64("2027-07-01", "D")

# Fixed instant at which the CGT parameters are read, so both the current-law
# values (discount percentages, from 1999) and the reform values (minimum tax,
# from 2027-07-01) resolve regardless of the enquiry period.
PARAMS_INSTANT = "2027-07-01"


def _days(a, b):
    """Whole days from datetime64[D] array ``a`` to array ``b`` (b - a)."""
    return (b - a).astype("timedelta64[D]").astype(np.float64)


# =============================================================================
# ENUMS
# =============================================================================


class CGTEntityKind(Enum):
    """Entity disposing of the asset (drives the discount and reform exposure)."""

    individual = "Individual"
    trust = "Trust (individual beneficiary)"
    complying_super_fund = "Complying superannuation fund (accumulation)"
    company = "Company"


class CGTRegime(Enum):
    """Which regime actually applies to the gain, given the dates (rule 1.6.4)."""

    current_only = "Current rules only (disposed before 1 July 2027)"
    transitional = "Transitional - gain straddles 1 July 2027 (grandfathered split)"
    amended_only = "Amended rules only (acquired on/after 1 July 2027)"


class CGTTransitionMethod(Enum):
    """How a straddling gain is split at 1 July 2027 (ruleset rule 1.6.4)."""

    time_apportionment = "Time apportionment (gain assumed to accrue evenly)"
    market_value = "Market value of the asset at 1 July 2027"


# =============================================================================
# INPUT VARIABLES - the CGT facts
# =============================================================================


class cgt_entity_kind(Variable):
    value_type = Enum
    possible_values = CGTEntityKind
    default_value = CGTEntityKind.individual
    entity = TaxEntity
    definition_period = YEAR
    label = "Kind of entity disposing of the asset"
    reference = ITAA1997_URL + "s115-100"
    documentation = """
    Drives the discount percentage (rule 1.3.2) and exposure to the 2027 reform
    (rule 1.6): only individuals and trusts lose the discount and face the 30%
    minimum tax; complying super funds keep the 33 1/3% discount; companies get no
    discount either way. (Partnerships - also affected by the reform - are not a
    separate value in this PoC.)
    Reference: s 115-100 ITAA 1997
    """


class cgt_acquisition_date(Variable):
    value_type = date
    default_value = date(2000, 1, 1)
    entity = TaxEntity
    definition_period = YEAR
    label = "Date the asset was acquired"
    reference = ITAA1997_URL + "s109-5"
    documentation = """
    When ownership of the asset began - the start of the holding period (rule 1.3.2)
    and the point from which indexation runs under the amended rules (rule 1.6.2). For a
    forecast of a future purchase, enter the expected acquisition date.
    Reference: s 109-5 ITAA 1997
    """


class cgt_disposal_date(Variable):
    value_type = date
    default_value = date(2028, 7, 1)
    entity = TaxEntity
    definition_period = YEAR
    label = "Date of the CGT event (contract date for a disposal, event A1)"
    reference = ITAA1997_URL + "s104-10"
    documentation = """
    The time of the CGT event: for a sale this is the CONTRACT date, not settlement
    (ruleset rule 1.1.2 - a common trap). This date decides which regime applies
    (rule 1.6.4). For a forecast of a future sale, enter the expected contract date.
    Reference: s 104-10 ITAA 1997
    """


class cgt_cost_base(Variable):
    value_type = float
    default_value = 0.0
    entity = TaxEntity
    definition_period = YEAR
    label = "Cost base of the asset ($)"
    reference = ITAA1997_URL + "s110-25"
    documentation = """
    The asset's cost base (ruleset rule 1.2.2): acquisition cost plus incidental,
    ownership, improvement and title-defence costs, excluding amounts deducted or
    deductible. Taken as a single input in this PoC rather than modelling the five
    elements. Also used as the reduced cost base for the loss test.
    Reference: Div 110 ITAA 1997
    """


class cgt_capital_proceeds(Variable):
    value_type = float
    default_value = 0.0
    entity = TaxEntity
    definition_period = YEAR
    label = "Capital proceeds from the disposal ($)"
    reference = ITAA1997_URL + "s116-20"
    documentation = """
    What is received (or the market value substituted) for the CGT event (ruleset
    rule 1.2.1). A capital gain arises where this exceeds the cost base.
    Reference: s 116-20 ITAA 1997
    """


class cgt_capital_losses_applied(Variable):
    value_type = float
    default_value = 0.0
    entity = TaxEntity
    definition_period = YEAR
    label = "Capital losses applied against this gain ($)"
    reference = ITAA1997_URL + "s102-5"
    documentation = """
    Current-year then carried-forward net capital losses applied against the gain
    BEFORE any discount or indexation (ruleset rule 1.3.1; s 102-5 method statement
    steps 1-2). Capital losses can never offset ordinary income.
    Reference: s 102-5, s 102-15 ITAA 1997
    """


class cgt_marginal_rate(Variable):
    value_type = float
    default_value = 0.45
    entity = TaxEntity
    definition_period = YEAR
    label = "Entity's tax rate applied to the net capital gain (/1)"
    reference = ITAA1997_URL + "s102-5"
    documentation = """
    The ordinary rate at which the net capital gain is taxed (rule 1.5.1): the
    individual's top marginal rate on the gain (Medicare levy excluded - it is not
    part of the minimum-tax calculation, rule 1.6.3), the company rate (0.25/0.30),
    or 0.15 for a complying super fund's accumulation phase. Presentation of the
    marginal-rate impact, not a legislated rule under current law.
    Reference: s 102-5 ITAA 1997
    """


class cgt_assumed_annual_inflation(Variable):
    value_type = float
    default_value = 0.025
    entity = TaxEntity
    definition_period = YEAR
    label = "Assumed annual CPI inflation for indexation (/1)"
    reference = BUDGET_FACTSHEET_URL
    documentation = """
    Under the amended rules the cost base is indexed by CPI over the holding period
    (no frozen index) so only the real gain is taxed (ruleset rule 1.6.2). Actual CPI
    is not known for future years, so this assumed annual rate drives the indexation
    factor for the forecast. Default 2.5% (RBA target midpoint). Only affects the
    amended rules; ignored under current law.
    Reference: Budget 2026-27 CGT factsheet
    """


class cgt_transition_method(Variable):
    value_type = Enum
    possible_values = CGTTransitionMethod
    default_value = CGTTransitionMethod.time_apportionment
    entity = TaxEntity
    definition_period = YEAR
    label = "Method for splitting a gain that straddles 1 July 2027"
    reference = REFORM_ACT_URL
    documentation = """
    For an asset held at 1 July 2027, only the gain accruing after that date is under
    the amended rules (ruleset rule 1.6.4). The taxpayer splits the gain either by a
    market valuation at 1 July 2027 or by a prescribed time-apportionment (gain
    assumed to accrue evenly over the ownership period).
    Reference: Subdiv 112-E ITAA 1997 (Tax Reform No. 1 Act 2026)
    """


class cgt_market_value_at_reform(Variable):
    value_type = float
    default_value = 0.0
    entity = TaxEntity
    definition_period = YEAR
    label = "Market value of the asset at 1 July 2027 ($, market-value method only)"
    reference = REFORM_ACT_URL
    documentation = """
    Used only when the transition method is market value: the pre-reform gain is this
    value less the cost base, the post-reform gain is the proceeds less this value
    (ruleset rule 1.6.4). Ignored for the time-apportionment method or when the gain
    does not straddle 1 July 2027.
    Reference: Subdiv 112-E ITAA 1997 (Tax Reform No. 1 Act 2026)
    """


# =============================================================================
# CALCULATED - the gain
# =============================================================================


class cgt_holding_period_days(Variable):
    value_type = int
    entity = TaxEntity
    definition_period = YEAR
    label = "Holding period in days (acquisition to CGT event)"
    reference = ITAA1997_URL + "s115-25"
    documentation = """
    Days from acquisition to the CGT event (ruleset rule 1.3.2). The discount and,
    from 2027, indexation require at least 12 months (modelled as 365 days).
    Reference: s 115-25 ITAA 1997
    """

    def formula(entities, period):
        acq = entities("cgt_acquisition_date", period)
        disp = entities("cgt_disposal_date", period)
        return np.maximum(_days(acq, disp), 0).astype(np.int32)


class cgt_is_long_term(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "Asset held at least 12 months before the CGT event"
    reference = ITAA1997_URL + "s115-25"
    documentation = """
    True where the holding period is at least the legislated minimum (ruleset rule
    1.3.2 / 1.6.2). Eligibility for the discount (current law) and for indexation
    (the amended rules); an asset held under 12 months gets neither.
    Reference: s 115-25 ITAA 1997
    """

    def formula(entities, period, parameters):
        days = entities("cgt_holding_period_days", period)
        min_days = parameters(PARAMS_INSTANT).cgt.long_term_holding_days
        return days >= min_days


class cgt_gross_capital_gain(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Gross capital gain before losses ($)"
    reference = ITAA1997_URL + "s104-10"
    documentation = """
    Capital proceeds less cost base, where positive (ruleset rule 1.2.1). A loss
    (proceeds below the reduced cost base) is out of scope for this gain-focused PoC
    and reported as a zero gain.
    Reference: s 104-10(4) ITAA 1997
    """

    def formula(entities, period):
        proceeds = entities("cgt_capital_proceeds", period)
        cost_base = entities("cgt_cost_base", period)
        return np.maximum(proceeds - cost_base, 0.0)


class cgt_gain_after_losses(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Capital gain after applying capital losses ($)"
    reference = ITAA1997_URL + "s102-5"
    documentation = """
    Gross capital gain less capital losses applied, floored at zero (ruleset rule
    1.3.1) - losses are applied BEFORE any discount or indexation.
    Reference: s 102-5 ITAA 1997 (method statement steps 1-2)
    """

    def formula(entities, period):
        gain = entities("cgt_gross_capital_gain", period)
        losses = entities("cgt_capital_losses_applied", period)
        return np.maximum(gain - losses, 0.0)


class cgt_discount_percentage(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Applicable CGT discount percentage under current law (/1)"
    reference = ITAA1997_URL + "s115-100"
    documentation = """
    The discount for the entity kind (ruleset rule 1.3.2): 50% individuals/trusts,
    33 1/3% complying super funds, nil companies - and only where the asset is held
    at least 12 months. This is the CURRENT-law discount; the amended rules replace
    it for individuals/trusts (rule 1.6.1).
    Reference: s 115-100 ITAA 1997
    """

    def formula(entities, period, parameters):
        kind = entities("cgt_entity_kind", period)
        long_term = entities("cgt_is_long_term", period)
        d = parameters(PARAMS_INSTANT).cgt.discount_percentage
        pct = select(
            [
                kind == CGTEntityKind.individual,
                kind == CGTEntityKind.trust,
                kind == CGTEntityKind.complying_super_fund,
                kind == CGTEntityKind.company,
            ],
            [d.individual, d.trust, d.complying_super_fund, d.company],
            default=0.0,
        )
        return where(long_term, pct, 0.0)


class cgt_indexation_relief(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Indexation relief under the amended rules ($)"
    reference = REFORM_ACT_URL
    documentation = """
    The inflationary growth of the cost base removed from the taxable gain under the
    amended rules (ruleset rule 1.6.2): cost base * ((1 + inflation) ^ holding_years - 1),
    only where the asset is held at least 12 months. Indexation lifts the cost base
    only, so it cannot create or increase a loss (relief is capped at the gain where
    used). Modelled from the assumed annual inflation input.
    Reference: Div 115 as amended; Budget 2026-27 CGT factsheet
    """

    def formula(entities, period):
        long_term = entities("cgt_is_long_term", period)
        cost_base = entities("cgt_cost_base", period)
        infl = entities("cgt_assumed_annual_inflation", period)
        years = entities("cgt_holding_period_days", period) / 365.25
        factor = np.power(1.0 + infl, years) - 1.0
        return where(long_term, cost_base * factor, 0.0)


# =============================================================================
# CALCULATED - CURRENT rules (50% discount world)
# =============================================================================


class cgt_current_rules_taxable_gain(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Taxable capital gain under current rules ($)"
    reference = ITAA1997_URL + "s102-5"
    documentation = """
    Gain after losses reduced by the discount (ruleset rules 1.3-1.5). This is the
    amount included in assessable income under current law.
    Reference: s 102-5, Div 115 ITAA 1997
    """

    def formula(entities, period):
        gain = entities("cgt_gain_after_losses", period)
        discount = entities("cgt_discount_percentage", period)
        return gain * (1.0 - discount)


class cgt_current_rules_tax(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "CGT cost under current rules ($)"
    reference = ITAA1997_URL + "s102-5"
    documentation = """
    Taxable gain under current rules times the entity's rate (ruleset rule 1.5.1) -
    the tax attributable to the capital gain if the 50% discount regime applied to
    the whole gain.
    Reference: s 102-5 ITAA 1997
    """

    def formula(entities, period):
        taxable = entities("cgt_current_rules_taxable_gain", period)
        rate = entities("cgt_marginal_rate", period)
        return taxable * rate


# =============================================================================
# CALCULATED - AMENDED rules (indexation + 30% minimum tax)
# =============================================================================


class cgt_affected_by_reform(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "Entity is affected by the 2027 CGT reform"
    reference = REFORM_ACT_URL
    documentation = """
    True for individuals and trusts (and partnerships): they lose the discount and
    face indexation + the 30% minimum tax (ruleset rule 1.6). Complying super funds
    keep the 33 1/3% discount and companies keep no-discount treatment, so for them
    the amended rules equal the current rules in this PoC.
    Reference: Tax Reform No. 1 Act 2026
    """

    def formula(entities, period):
        kind = entities("cgt_entity_kind", period)
        return (kind == CGTEntityKind.individual) | (kind == CGTEntityKind.trust)


class cgt_amended_rules_taxable_gain(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Taxable capital gain under the amended rules ($)"
    reference = REFORM_ACT_URL
    documentation = """
    For affected entities: gain after losses reduced by indexation relief instead of
    the discount, floored at zero (ruleset rules 1.6.1-1.6.2). For unaffected
    entities (super, company) this equals the current-rules taxable gain.
    Reference: Div 115 as amended (Tax Reform No. 1 Act 2026)
    """

    def formula(entities, period):
        affected = entities("cgt_affected_by_reform", period)
        gain = entities("cgt_gain_after_losses", period)
        relief = entities("cgt_indexation_relief", period)
        indexed = np.maximum(gain - relief, 0.0)
        current = entities("cgt_current_rules_taxable_gain", period)
        return where(affected, indexed, current)


class cgt_amended_rules_rate(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Effective rate on the taxable gain under the amended rules (/1)"
    reference = REFORM_ACT_URL
    documentation = """
    For affected entities the 30% minimum tax floors the rate: the greater of the
    marginal rate and 30% (ruleset rule 1.6.3) - a taxpayer already at 30%+ pays no
    extra. Modelled as an effective-rate floor (the full s 119-10 top-up and the
    income-support exemption are simplifications). Unaffected entities keep their
    ordinary rate.
    Reference: Div 119 ITAA 1997 (Tax Reform No. 1 Act 2026)
    """

    def formula(entities, period, parameters):
        affected = entities("cgt_affected_by_reform", period)
        rate = entities("cgt_marginal_rate", period)
        min_rate = parameters(PARAMS_INSTANT).cgt.minimum_tax_rate
        return where(affected, np.maximum(rate, min_rate), rate)


class cgt_amended_rules_tax(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "CGT cost under the amended rules ($)"
    reference = REFORM_ACT_URL
    documentation = """
    Taxable gain under the amended rules times the amended-rules rate (ruleset rule
    1.6) - the tax attributable to the gain if the amended indexation + 30%
    minimum-tax regime applied to the whole gain. For unaffected entities this
    equals the current tax.
    Reference: Tax Reform No. 1 Act 2026
    """

    def formula(entities, period):
        taxable = entities("cgt_amended_rules_taxable_gain", period)
        rate = entities("cgt_amended_rules_rate", period)
        return taxable * rate


# =============================================================================
# CALCULATED - ACTUAL grandfathered / transitional outcome
# =============================================================================


class cgt_actual_regime(Variable):
    value_type = Enum
    possible_values = CGTRegime
    default_value = CGTRegime.current_only
    entity = TaxEntity
    definition_period = YEAR
    label = "Which regime actually applies given the dates"
    reference = REFORM_ACT_URL
    documentation = """
    Disposed before 1 July 2027 -> current rules only; acquired on/after 1 July 2027
    -> amended rules only; otherwise the gain straddles the reform and is split
    (ruleset rule 1.6.4).
    Reference: Subdiv 112-E ITAA 1997 (Tax Reform No. 1 Act 2026)
    """

    def formula(entities, period):
        acq = entities("cgt_acquisition_date", period)
        disp = entities("cgt_disposal_date", period)
        return select(
            [disp < REFORM_DATE, acq >= REFORM_DATE],
            [CGTRegime.current_only, CGTRegime.amended_only],
            default=CGTRegime.transitional,
        )


class cgt_transition_pre_fraction(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Fraction of the gain accruing before 1 July 2027"
    reference = REFORM_ACT_URL
    documentation = """
    For a straddling gain, the share that is **grandfathered** under the pre-reform
    rules (ruleset rule 1.6.4): by time apportionment (days held before 1 July 2027 /
    total days held) or by market value (pre-reform gain / total gross gain). 1.0
    where the gain is wholly pre-reform, 0.0 where wholly post-reform.
    Reference: Subdiv 112-E ITAA 1997 (Tax Reform No. 1 Act 2026)
    """

    def formula(entities, period):
        acq = entities("cgt_acquisition_date", period)
        disp = entities("cgt_disposal_date", period)
        method = entities("cgt_transition_method", period)
        mv = entities("cgt_market_value_at_reform", period)
        cost_base = entities("cgt_cost_base", period)
        gross = entities("cgt_gross_capital_gain", period)

        total_days = np.maximum(_days(acq, disp), 1.0)
        pre_days = np.clip(_days(acq, np.array(REFORM_DATE)), 0.0, total_days)
        time_frac = pre_days / total_days

        # Market-value split, guarded against divide-by-zero / missing MV.
        safe_gross = np.where(gross > 0.0, gross, 1.0)
        mv_frac = np.clip((mv - cost_base) / safe_gross, 0.0, 1.0)
        use_mv = (
            (method == CGTTransitionMethod.market_value) & (mv > 0.0) & (gross > 0.0)
        )
        frac = where(use_mv, mv_frac, time_frac)

        # Force the pure cases to exact 0/1 regardless of method.
        frac = where(disp < REFORM_DATE, 1.0, frac)
        frac = where(acq >= REFORM_DATE, 0.0, frac)
        return frac


class cgt_actual_tax(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Actual CGT cost given the dates (grandfathered) ($)"
    reference = REFORM_ACT_URL
    documentation = """
    The grandfathered outcome (ruleset rule 1.6.4). Current-only -> current tax;
    amended-only -> amended tax; transitional -> the grandfathered pre-reform share
    of the gain taxed under the current rules (discount) plus the post-reform share
    taxed under the amended rules (indexation relief pro-rated to that share, then
    the 30% minimum-tax floor). Unaffected entities (super, company) always equal
    the current tax.
    Reference: Subdiv 112-E ITAA 1997 (Tax Reform No. 1 Act 2026)
    """

    def formula(entities, period):
        affected = entities("cgt_affected_by_reform", period)
        regime = entities("cgt_actual_regime", period)

        current_tax = entities("cgt_current_rules_tax", period)
        amended_tax = entities("cgt_amended_rules_tax", period)

        gain = entities("cgt_gain_after_losses", period)
        discount = entities("cgt_discount_percentage", period)
        relief = entities("cgt_indexation_relief", period)
        marginal = entities("cgt_marginal_rate", period)
        amended_rate = entities("cgt_amended_rules_rate", period)
        frac_pre = entities("cgt_transition_pre_fraction", period)

        # Transitional split for affected entities.
        pre_taxable = gain * frac_pre * (1.0 - discount)
        pre_tax = pre_taxable * marginal
        post_gain = gain * (1.0 - frac_pre)
        post_relief = relief * (1.0 - frac_pre)
        post_taxable = np.maximum(post_gain - post_relief, 0.0)
        post_tax = post_taxable * amended_rate
        transitional_tax = pre_tax + post_tax

        affected_tax = select(
            [
                regime == CGTRegime.current_only,
                regime == CGTRegime.amended_only,
            ],
            [current_tax, amended_tax],
            default=transitional_tax,
        )
        # Unaffected entities are grandfathered to the current treatment throughout.
        return where(affected, affected_tax, current_tax)


class cgt_amended_vs_current_difference(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Amended-rules tax minus current-rules tax ($; positive = more tax)"
    reference = REFORM_ACT_URL
    documentation = """
    The headline "current vs amended" comparison on the whole gain (ruleset rule
    1.6): amended-rules tax less current-rules tax. Positive means the amended
    regime costs more.
    Reference: Tax Reform No. 1 Act 2026
    """

    def formula(entities, period):
        return entities("cgt_amended_rules_tax", period) - entities(
            "cgt_current_rules_tax", period
        )


class cgt_actual_vs_current_difference(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Actual (grandfathered) tax minus current-rules tax ($)"
    reference = REFORM_ACT_URL
    documentation = """
    What the grandfathered/transitional outcome costs over the pure current-rules
    treatment (ruleset rule 1.6.4) - the real-world impact of the reform on this
    disposal given its dates.
    Reference: Subdiv 112-E ITAA 1997 (Tax Reform No. 1 Act 2026)
    """

    def formula(entities, period):
        return entities("cgt_actual_tax", period) - entities(
            "cgt_current_rules_tax", period
        )
