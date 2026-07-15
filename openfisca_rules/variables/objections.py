"""Objection rights ruleset - which ATO decisions carry objection (review) rights.

Encodes `Objection Rights Ruleset.md` (drafted from Part IVC of the Taxation
Administration Act 1953 and the sources in `research/decision-inventory.md`).
Every branch traces to a numbered rule statement; encode nothing that is not in
the reviewed ruleset markdown.

Periods: all variables use YEAR, keyed to the calendar year of the enquiry. The
period only date-resolves the parameters (time limits are dated legislated
values); the decision facts themselves are the date inputs below.
"""

from datetime import date

import numpy as np

from openfisca_core.indexed_enums import Enum
from openfisca_core.model_api import YEAR, Variable, select, where

from openfisca_rules.entities import TaxEntity

TAA1953_URL = "https://www.legislation.gov.au/C1953A00001/latest/text#"
ITAA1936_URL = "https://www.legislation.gov.au/C1936A00027/latest/text#"
ATO_ELIGIBILITY_URL = (
    "https://www.ato.gov.au/individuals-and-families/your-tax-return/"
    "if-you-disagree-with-an-ato-decision/object-to-a-decision/"
    "eligibility-to-lodge-an-objection"
)


def _add_calendar_years(dates, years):
    """Add whole calendar years to a datetime64[D] array (ruleset rule 1.2.6).

    A period expressed in years ends on the same calendar day N years later;
    an anniversary of 29 February falls back to 28 February. `years` may be a
    scalar or a per-entity array.
    """

    def shift(d, n):
        try:
            return d.replace(year=d.year + n)
        except ValueError:  # 29 February with no anniversary
            return d.replace(year=d.year + n, day=28)

    years = np.broadcast_to(years, dates.shape)
    return np.array(
        [shift(d, int(n)) for d, n in zip(dates.astype(object), years)],
        dtype="datetime64[D]",
    )


# =============================================================================
# ENUMS
# =============================================================================


class ATODecisionType(Enum):
    """Decision types from research/decision-inventory.md (one value per row)."""

    income_tax_assessment = "Income tax assessment (original)"
    income_tax_amended_assessment = "Amended income tax assessment"
    private_ruling = "Private ruling"
    gst_assessment = "GST assessment (net amount)"
    fbt_assessment = "Fringe benefits tax assessment"
    penalty_assessment = "Administrative penalty assessment"
    super_guarantee_assessment = "Superannuation guarantee charge assessment"
    excess_concessional_contributions_determination = (
        "Excess concessional contributions determination"
    )
    sic_remission_decision = "Shortfall interest charge (SIC) remission decision"
    gic_remission_decision = "General interest charge (GIC) remission decision"
    objection_extension_refusal = "Refusal of a request for more time to object"


class TaxpayerKind(Enum):
    individual = "Individual"
    small_business_entity = "Small business entity"
    other = "Other (company, trust or partnership outside the SBE rules, super fund, ...)"


class RecommendedPathway(Enum):
    lodge_objection = "Lodge an objection (within time)"
    objection_with_extension_request = (
        "Lodge an objection together with a written request for an extension of time"
    )
    object_to_assessment_instead = "Object against the relevant assessment instead"
    art_review = "Apply to the Administrative Review Tribunal for review"
    complaint_or_judicial_review = (
        "No objection right - complaint (Tax Ombudsman) or judicial review"
    )


# =============================================================================
# INPUT VARIABLES - Decision facts
# =============================================================================


class ato_decision_type(Variable):
    value_type = Enum
    possible_values = ATODecisionType
    default_value = ATODecisionType.income_tax_assessment
    entity = TaxEntity
    definition_period = YEAR
    label = "Type of ATO decision the taxpayer is dissatisfied with"
    reference = ATO_ELIGIBILITY_URL
    documentation = """
    The pivotal input: one value per row of the decision inventory
    (research/decision-inventory.md). Decisions outside this list are out of scope -
    no objection-rights answer should be inferred for them.
    Reference: Decisions you can object to and time limits | ATO
    """


class decision_notice_date(Variable):
    value_type = date
    default_value = date(1970, 1, 1)
    entity = TaxEntity
    definition_period = YEAR
    label = "Date the notice of the decision was given to the taxpayer"
    reference = TAA1953_URL + "s14ZW"
    documentation = """
    The start event for the objection period (ruleset rule 1.2): the date the notice
    of assessment, determination, ruling or decision was given to (served on) the
    person. For an amended assessment this is the AMENDED notice date. Deemed-service
    rules are not modelled (ruleset caveats).
    Reference: s 14ZW TAA 1953
    """


class original_assessment_notice_date(Variable):
    value_type = date
    default_value = date(1970, 1, 1)
    entity = TaxEntity
    definition_period = YEAR
    label = "Date the notice of the ORIGINAL assessment was given (amended assessments only)"
    reference = TAA1953_URL + "s14ZW"
    documentation = """
    For amended income tax assessments the objection period ends at the later of the
    original assessment's 2-year/4-year window and 60 days after the amended notice
    (ruleset rule 1.2.3). This input anchors the first limb. Ignored for other
    decision types.
    Reference: s 14ZW TAA 1953
    """


class return_lodgment_due_date(Variable):
    value_type = date
    default_value = date(1970, 1, 1)
    entity = TaxEntity
    definition_period = YEAR
    label = "Last day allowed for lodging the return the private ruling relates to"
    reference = TAA1953_URL + "s14ZW"
    documentation = """
    For private rulings the objection period ends at the later of 60 days after the
    ruling and the taxpayer's 2-year/4-year period (ruleset rule 1.2.2) measured from
    the last day allowed for lodging the relevant return (ruleset rule 1.2.5). This
    input anchors the long limb. Ignored for other decision types.
    Reference: s 14ZW(1A)(b) TAA 1953
    """


class related_assessment_notice_date(Variable):
    value_type = date
    default_value = date(1970, 1, 1)
    entity = TaxEntity
    definition_period = YEAR
    label = (
        "Date notice was given of the related income tax assessment for the same "
        "year (excess concessional contributions determinations only)"
    )
    reference = TAA1953_URL + "s97-10"
    documentation = """
    An excess concessional contributions determination is not itself given a 60-day
    objection window: s 14ZW(1)(aac) ties its objection period to the SAME period
    the person would have to object to their income tax assessment for that year
    under s 175A - i.e. the row-1 2-year/4-year rule, keyed to `taxpayer_kind`, but
    measured from the notice date of that related assessment rather than the
    determination's own notice date. Ignored for other decision types.
    Reference: s 97-5, 97-10 TAA 1953 Sch 1; s 14ZW(1)(aac) TAA 1953
    """


class has_assessment_for_ruling_period(Variable):
    value_type = bool
    default_value = False
    entity = TaxEntity
    definition_period = YEAR
    label = "Has an assessment already been made for the period the private ruling relates to?"
    reference = TAA1953_URL + "s359-60"
    documentation = """
    A private ruling can be objected to only while no assessment has been made for the
    period it relates to; once an assessment exists the objection must be made against
    the assessment (ruleset rule 1.1.3).
    Reference: s 359-60 TAA 1953 Sch 1
    """


class sic_remaining_fraction_of_shortfall(Variable):
    value_type = float
    default_value = 0.0
    entity = TaxEntity
    definition_period = YEAR
    label = "Unremitted shortfall interest charge as a fraction of the tax shortfall"
    reference = TAA1953_URL + "s280-170"
    documentation = """
    For SIC remission decisions: the SIC left payable after the remission decision,
    divided by the tax shortfall (e.g. 0.25 = 25%). An objection is available only
    where this exceeds the legislated threshold (ruleset rule 1.1.5). Ignored for
    other decision types.
    Reference: s 280-170 TAA 1953 Sch 1
    """


class taxpayer_kind(Variable):
    value_type = Enum
    possible_values = TaxpayerKind
    default_value = TaxpayerKind.individual
    entity = TaxEntity
    definition_period = YEAR
    label = "Kind of taxpayer (drives the 2-year vs 4-year income tax objection period)"
    reference = ITAA1936_URL + "s170"
    documentation = """
    Approximates the statutory test of whether items 1, 2, 3 or 3A of the s 170(1)
    ITAA 1936 table apply to the assessment (the 'standard amendment period'):
    individuals and small business entities get 2 years, others 4 years (ruleset rule
    1.2.2). Edge cases (complex-affairs individuals, fraud or evasion) are not
    modelled - see the ruleset caveats.
    Reference: s 170 ITAA 1936; s 14ZW(1)(aa) TAA 1953
    """


class objection_lodgment_date(Variable):
    value_type = date
    default_value = date(1970, 1, 1)
    entity = TaxEntity
    definition_period = YEAR
    label = "Date the objection is (or would be) lodged"
    reference = TAA1953_URL + "s14ZW"
    documentation = """
    The date the objection was lodged, or today's date when asking "can I still
    object?". Compared against the objection deadline to decide timeliness (ruleset
    rule 1.2.6: lodgment on the final day is in time).
    Reference: s 14ZW TAA 1953
    """


# =============================================================================
# CALCULATED VARIABLES - Eligibility
# =============================================================================


class has_standard_amendment_period(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "Taxpayer is on the standard (2-year) amendment period"
    reference = ITAA1936_URL + "s170"
    documentation = """
    True where items 1, 2, 3 or 3A of the s 170(1) ITAA 1936 table apply to the
    assessment - modelled as: the taxpayer is an individual or a small business
    entity (ruleset rule 1.2.2 and caveats).
    Reference: s 170 ITAA 1936
    """

    def formula(entities, period):
        """Individuals and small business entities are on the 2-year period."""
        kind = entities("taxpayer_kind", period)
        return (kind == TaxpayerKind.individual) | (
            kind == TaxpayerKind.small_business_entity
        )


class has_objection_right(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "The decision can be objected to under Part IVC TAA 1953"
    reference = TAA1953_URL + "s14ZL"
    documentation = """
    Whether a taxation objection can be lodged against the decision (ruleset rule
    1.1): GIC remission refusals and refused extension requests carry no objection
    right; a private ruling is objectable only while no assessment exists for the
    ruling period; a SIC remission decision only where the unremitted SIC exceeds
    the legislated fraction of the shortfall; the other in-scope decisions are
    objectable.
    Reference: s 14ZL TAA 1953; s 175A ITAA 1936; ss 280-170, 359-60 TAA 1953 Sch 1
    """

    def formula(entities, period, parameters):
        """Ruleset rules 1.1.1-1.1.7, one branch per decision family."""
        decision = entities("ato_decision_type", period)
        has_assessment = entities("has_assessment_for_ruling_period", period)
        sic_fraction = entities("sic_remaining_fraction_of_shortfall", period)
        threshold = parameters(period).objections.sic_remission_objection_threshold

        never_objectable = (decision == ATODecisionType.gic_remission_decision) | (
            decision == ATODecisionType.objection_extension_refusal
        )
        return select(
            [
                never_objectable,
                decision == ATODecisionType.private_ruling,
                decision == ATODecisionType.sic_remission_decision,
            ],
            [
                False,
                ~has_assessment,
                sic_fraction > threshold,
            ],
            default=True,
        )


# =============================================================================
# CALCULATED VARIABLES - Time limits
# =============================================================================


class objection_deadline(Variable):
    value_type = date
    entity = TaxEntity
    definition_period = YEAR
    label = "Last day on which the objection can be lodged in time"
    reference = TAA1953_URL + "s14ZW"
    documentation = """
    The end of the s 14ZW objection period (ruleset rule 1.2): 60 days after notice
    for the standard family; 2 or 4 years for income tax assessments depending on
    the amendment period; the later of the original window and 60 days after the
    amended notice for amended assessments; the later of 60 days after the ruling
    and the taxpayer's 2-year/4-year period after the return due date for private
    rulings (s 14ZW(1A)(b)); the SAME 2-year/4-year period as the related income tax
    assessment for excess concessional contributions determinations (s 14ZW(1)(aac));
    4 years for GST and FBT assessments. Only meaningful where an objection right
    exists.
    Reference: s 14ZW TAA 1953
    """

    def formula(entities, period, parameters):
        """Ruleset rules 1.2.1-1.2.6, one deadline per decision family."""
        p = parameters(period).objections
        decision = entities("ato_decision_type", period)
        notice = entities("decision_notice_date", period)
        original_notice = entities("original_assessment_notice_date", period)
        return_due = entities("return_lodgment_due_date", period)
        related_assessment_notice = entities("related_assessment_notice_date", period)
        standard = entities("has_standard_amendment_period", period)

        sixty_days_after_notice = notice + np.timedelta64(int(p.standard_period_days), "D")
        review_years = where(
            standard,
            int(p.shortened_review_period_years),
            int(p.full_review_period_years),
        )
        income_tax_deadline = _add_calendar_years(notice, review_years)
        amended_deadline = np.maximum(
            _add_calendar_years(original_notice, review_years),
            sixty_days_after_notice,
        )
        ruling_deadline = np.maximum(
            _add_calendar_years(return_due, review_years),
            sixty_days_after_notice,
        )
        contributions_deadline = _add_calendar_years(
            related_assessment_notice, review_years
        )
        four_years_after_notice = _add_calendar_years(
            notice, int(p.full_review_period_years)
        )

        return select(
            [
                decision == ATODecisionType.income_tax_assessment,
                decision == ATODecisionType.income_tax_amended_assessment,
                decision == ATODecisionType.private_ruling,
                decision
                == ATODecisionType.excess_concessional_contributions_determination,
                (decision == ATODecisionType.gst_assessment)
                | (decision == ATODecisionType.fbt_assessment),
            ],
            [
                income_tax_deadline,
                amended_deadline,
                ruling_deadline,
                contributions_deadline,
                four_years_after_notice,
            ],
            default=sixty_days_after_notice,
        )


class objection_in_time(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "An objection lodged on the lodgment date would be within time"
    reference = TAA1953_URL + "s14ZW"
    documentation = """
    True where an objection right exists and the lodgment date is on or before the
    objection deadline (ruleset rule 1.2.6: lodgment on the final day is in time).
    Always false where no objection right exists.
    Reference: s 14ZW TAA 1953
    """

    def formula(entities, period):
        """Right exists and lodgment date does not pass the deadline."""
        has_right = entities("has_objection_right", period)
        lodgment = entities("objection_lodgment_date", period)
        deadline = entities("objection_deadline", period)
        return has_right & (lodgment <= deadline)


class can_request_extension(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "A late objection can be lodged with a s 14ZX extension request"
    reference = TAA1953_URL + "s14ZX"
    documentation = """
    True where an objection right exists, the objection period has ended, and the
    extension mechanism applies (ruleset rule 1.3): a late objection may be lodged
    together with a written request to treat it as in time - except for private
    rulings, where no extension is available.
    Reference: s 14ZW(2)-(3), s 14ZX TAA 1953
    """

    def formula(entities, period):
        """Ruleset rules 1.3.1-1.3.2."""
        has_right = entities("has_objection_right", period)
        in_time = entities("objection_in_time", period)
        decision = entities("ato_decision_type", period)
        return has_right & ~in_time & ~(decision == ATODecisionType.private_ruling)


# =============================================================================
# OUTPUT VARIABLES - Pathway
# =============================================================================


class recommended_pathway(Variable):
    value_type = Enum
    possible_values = RecommendedPathway
    default_value = RecommendedPathway.complaint_or_judicial_review
    entity = TaxEntity
    definition_period = YEAR
    label = "Recommended dispute pathway for the decision and dates given"
    reference = ATO_ELIGIBILITY_URL
    documentation = """
    The pathway the ruleset recommends (ruleset rules 1.3-1.4): lodge an objection
    while in time; lodge with an extension request when late (where available);
    object to the assessment instead for private rulings that are late or already
    assessed; ART review for refused extension requests; complaint or judicial
    review where no objection right exists (GIC remission, below-threshold SIC
    remission). Guidance for exploring Rules as Code, not legal advice.
    Reference: ss 14ZW, 14ZX TAA 1953; Decisions you can object to | ATO
    """

    def formula(entities, period):
        """Ruleset rules 1.3.3 and 1.4.1-1.4.4, most specific branch first."""
        decision = entities("ato_decision_type", period)
        has_right = entities("has_objection_right", period)
        in_time = entities("objection_in_time", period)
        can_extend = entities("can_request_extension", period)

        is_ruling = decision == ATODecisionType.private_ruling
        return select(
            [
                decision == ATODecisionType.objection_extension_refusal,
                is_ruling & ~has_right,
                is_ruling & has_right & ~in_time,
                has_right & in_time,
                can_extend,
            ],
            [
                RecommendedPathway.art_review,
                RecommendedPathway.object_to_assessment_instead,
                RecommendedPathway.object_to_assessment_instead,
                RecommendedPathway.lodge_objection,
                RecommendedPathway.objection_with_extension_request,
            ],
            default=RecommendedPathway.complaint_or_judicial_review,
        )
