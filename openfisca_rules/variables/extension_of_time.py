"""Extension of time to object ruleset - s 14ZX TAA 1953 sense-check support.

Encodes `Extension of Time Ruleset.md`. The s 14ZX discretion is a Level 4
(judgement-based) rule in the Rule Determinism Model: THIS MODULE NEVER COMPUTES
THE OUTCOME of the discretion and exposes no grant/refuse variable. It encodes
only the deterministic shell (whether the discretion is engaged, the delay
arithmetic, the ART review right on refusal), the structured record of factor
findings a human decision maker has made, and sense-check flags that compare a
PROPOSED human outcome against the decided-case patterns (PS LA 2003/7) -
prompting articulation, never substituting for judgement.

Builds on `variables/objections.py` (objection right, deadline, timeliness and
the availability of the extension mechanism). Periods: YEAR, as there.
"""

import numpy as np

from openfisca_core.indexed_enums import Enum
from openfisca_core.model_api import YEAR, Variable, select

from openfisca_rules.entities import TaxEntity

TAA1953_URL = "https://www.legislation.gov.au/C1953A00001/latest/text#"
PSLA_2003_7_URL = (
    "https://www.ato.gov.au/law/view/document?docid=psr%2Fps20037%2Fnat%2Fato%2F00001"
)


# =============================================================================
# ENUMS
# =============================================================================


class EOTDelayBand(Enum):
    not_late = "Objection lodged in time - no delay to explain"
    short = "Short delay (descriptive band - strongly favourable pattern in decided cases)"
    moderate = "Moderate delay (descriptive band)"
    long = "Long delay (descriptive band - records and fairness issues recur in decided cases)"


class EOTProposedOutcome(Enum):
    undecided = "No outcome proposed yet (no sense check)"
    agree = "Proposed: agree to the request (objection taken to be in time)"
    refuse = "Proposed: refuse the request"


# =============================================================================
# INPUT VARIABLES - Request formalities (s 14ZW(2)-(3), human findings)
# =============================================================================


class eot_request_in_writing(Variable):
    value_type = bool
    default_value = False
    entity = TaxEntity
    definition_period = YEAR
    label = "The late objection was lodged together with a WRITTEN extension request"
    reference = TAA1953_URL + "s14ZW"
    documentation = """
    s 14ZW(2): a late objection may be lodged together with a written request
    asking the Commissioner to deal with it as if lodged in time. Whether the
    lodged material includes such a written request is a finding about the
    documents (ruleset rule 1.1.4); its consequence is deterministic.
    Reference: s 14ZW(2) TAA 1953
    """


class eot_request_states_circumstances_fully(Variable):
    value_type = bool
    default_value = False
    entity = TaxEntity
    definition_period = YEAR
    label = "The request states the circumstances of the lateness fully and in detail"
    reference = TAA1953_URL + "s14ZW"
    documentation = """
    s 14ZW(3): the request must state fully and in detail the circumstances
    concerning, and the reasons for, the failure to lodge in time. Recorded as
    the decision maker's finding on the lodged request (ruleset rule 1.1.4).
    Per PS LA 2003/7 paragraph 6 this does NOT gate the discretion: an
    inadequate statement calls for an invitation to provide more information,
    and its absence must not be the sole reason for refusing.
    Reference: s 14ZW(3) TAA 1953; PS LA 2003/7 [6]
    """


# =============================================================================
# INPUT VARIABLES - Factor record (PS LA 2003/7, human findings)
# =============================================================================


class eot_explanation_covers_whole_period(Variable):
    value_type = bool
    default_value = False
    entity = TaxEntity
    definition_period = YEAR
    label = "Finding: the explanation genuinely accounts for the WHOLE period of delay"
    reference = PSLA_2003_7_URL
    documentation = """
    The core explanation pattern (ruleset rule 1.3.1): decisions refusing
    extensions repeatedly turn on explanations that are thin, vague, or cover
    only part of the delay. A human finding - the engine never infers it.
    Authorities: Hunter Valley Developments v Cohen (1984) 3 FCR 344 (acceptable
    explanation as a precondition); FCT v Primary Health Care Ltd [2017] FCAFC
    131.
    Reference: PS LA 2003/7 [10]; s 14ZW(3) TAA 1953
    """


class eot_objection_arguable(Variable):
    value_type = bool
    default_value = False
    entity = TaxEntity
    definition_period = YEAR
    label = "Finding: the objection is arguable (not frivolous, not bound to fail in law)"
    reference = PSLA_2003_7_URL
    documentation = """
    The arguable-case factor is a LOW bar assessed without a full merits
    investigation (ruleset rule 1.3.2); refusals justified on this factor alone
    are confined to objections that must fail in law. A human finding.
    Authorities: Brown v FCT [1999] FCA 563 (Hill J); Windshuttle v DFC of T
    (1993) 46 FCR 235 (indicating the factual assertions is usually enough).
    Reference: PS LA 2003/7 [10]
    """


class eot_concrete_prejudice_to_commissioner(Variable):
    value_type = bool
    default_value = False
    entity = TaxEntity
    definition_period = YEAR
    label = "Finding: concrete prejudice to the Commissioner from the delay is identified"
    reference = PSLA_2003_7_URL
    documentation = """
    Prejudice must be identified concretely and tied to the ability to properly
    deal with the dispute; administrative inconvenience is not prejudice
    (ruleset rule 1.3.3). A human finding.
    Authorities: Windshuttle v DFC of T (1993) 46 FCR 235 (von Doussa J - lost
    documents, faded recollections, dried-up enquiries); Brisbane South Regional
    Health Authority v Taylor (1996) 186 CLR 541.
    Reference: PS LA 2003/7 [10]
    """


class eot_ato_conduct_contributed(Variable):
    value_type = bool
    default_value = False
    entity = TaxEntity
    definition_period = YEAR
    label = "Finding: ATO conduct (action or inaction) contributed to the delay"
    reference = PSLA_2003_7_URL
    documentation = """
    A recurring "stronger explanation" pattern in decided cases: Commissioner
    conduct reasonably contributing to the taxpayer not objecting earlier weighs
    in favour of granting (ruleset rule 1.3.4). A human finding.
    Reference: PS LA 2003/7
    """


class eot_taxpayer_rested_on_rights(Variable):
    value_type = bool
    default_value = False
    entity = TaxEntity
    definition_period = YEAR
    label = "Finding: the taxpayer rested on their rights while time ran"
    reference = PSLA_2003_7_URL
    documentation = """
    The converse of keeping the ATO informed / actively pursuing rights: passing
    time with no signal of contest and no conscious trigger is a recurring
    adverse pattern (ruleset rule 1.3.5). A human finding.
    Authority: Hunter Valley Developments v Cohen (1984) 3 FCR 344 (a person who
    kept the decision maker aware they contested finality vs one who let the
    matter appear concluded).
    Reference: PS LA 2003/7 [10]
    """


class eot_proposed_outcome(Variable):
    value_type = Enum
    possible_values = EOTProposedOutcome
    default_value = EOTProposedOutcome.undecided
    entity = TaxEntity
    definition_period = YEAR
    label = "The decision maker's PROPOSED s 14ZX outcome, supplied for sense-checking"
    reference = TAA1953_URL + "s14ZX"
    documentation = """
    The draft human decision (ruleset rule 1.5): the engine checks a proposal,
    it never makes one. Leave as `undecided` for no sense check.
    Reference: s 14ZX(1) TAA 1953
    """


# =============================================================================
# CALCULATED VARIABLES - Deterministic shell (Levels 1-2)
# =============================================================================


class eot_days_late(Variable):
    value_type = int
    entity = TaxEntity
    definition_period = YEAR
    label = "Days between the objection deadline and the lodgment date (0 if in time)"
    reference = TAA1953_URL + "s14ZW"
    documentation = """
    Calculated delay (ruleset rule 1.2.1): lodgment date minus the s 14ZW
    objection deadline, floored at zero. Only meaningful where an objection
    right exists.
    Reference: s 14ZW TAA 1953
    """

    def formula(entities, period):
        """Ruleset rule 1.2.1."""
        lodgment = entities("objection_lodgment_date", period)
        deadline = entities("objection_deadline", period)
        days = (lodgment - deadline).astype("timedelta64[D]").astype(int)
        return np.maximum(days, 0)


class eot_delay_band(Variable):
    value_type = Enum
    possible_values = EOTDelayBand
    default_value = EOTDelayBand.not_late
    entity = TaxEntity
    definition_period = YEAR
    label = "Descriptive delay band (framing only - length of delay is never determinative)"
    reference = PSLA_2003_7_URL
    documentation = """
    Ruleset rule 1.2.2: days late classified against specialist-maintained band
    edges (dated parameters eot.short_delay_max_days / eot.long_delay_min_days).
    Paraphrases decided-case patterns for orientation; NOT a factor weight and
    never determinative (PS LA 2003/7).
    Reference: PS LA 2003/7
    """

    def formula(entities, period, parameters):
        """Ruleset rule 1.2.2: 0 = not late; <= short edge = short; >= long edge = long."""
        p = parameters(period).eot
        days = entities("eot_days_late", period)
        return select(
            [
                days == 0,
                days <= int(p.short_delay_max_days),
                days < int(p.long_delay_min_days),
            ],
            [
                EOTDelayBand.not_late,
                EOTDelayBand.short,
                EOTDelayBand.moderate,
            ],
            default=EOTDelayBand.long,
        )


class eot_discretion_engaged(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "The s 14ZX discretion is engaged - a valid extension request is before the Commissioner"
    reference = TAA1953_URL + "s14ZX"
    documentation = """
    Ruleset rules 1.1.1-1.1.5, all deterministic: an objection right exists, the
    objection period has ended, the extension mechanism is available for the
    decision type (all via `can_request_extension`), AND the late objection was
    lodged together with a WRITTEN request (s 14ZW(2)). The s 14ZW(3) "fully and
    in detail" standard is deliberately NOT part of this gate: per PS LA 2003/7
    paragraph 6 an inadequate statement prompts an invitation for more
    information rather than invalidating the request. Where engaged, the
    Commissioner must decide to agree or refuse (s 14ZX(1)); how to decide is
    human judgement outside this ruleset.
    Reference: s 14ZW(2), s 14ZX(1) TAA 1953; PS LA 2003/7 [5]-[7]
    """

    def formula(entities, period):
        """Ruleset rule 1.1.5: gatekeepers plus the written-request formality."""
        can_extend = entities("can_request_extension", period)
        in_writing = entities("eot_request_in_writing", period)
        return can_extend & in_writing


class eot_art_review_available_if_refused(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "If the request were refused, ART review of the refusal would be available"
    reference = TAA1953_URL + "s14ZX"
    documentation = """
    s 14ZX(4): a person whose extension request is refused may apply to the
    Administrative Review Tribunal for review of the refusal (ruleset rule
    1.6.2). Available whenever the discretion is engaged; the refusal itself
    carries no objection right.
    Reference: s 14ZX(4) TAA 1953
    """

    def formula(entities, period):
        """Ruleset rule 1.6.2."""
        return entities("eot_discretion_engaged", period)


class eot_prompt_seek_further_information(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "PROMPT: invite the taxpayer to better explain the lateness before deciding"
    reference = PSLA_2003_7_URL
    documentation = """
    Ruleset rule 1.5.4: the discretion is engaged but the request does not state
    the circumstances of the lateness fully and in detail (s 14ZW(3)). PS LA
    2003/7 paragraph 6: give the taxpayer the opportunity to provide further
    information or a better explanation, and do not treat the absence of a
    detailed explanation as the sole reason for refusing.
    Reference: s 14ZW(3) TAA 1953; PS LA 2003/7 [6]
    """

    def formula(entities, period):
        """Ruleset rule 1.5.4."""
        engaged = entities("eot_discretion_engaged", period)
        states_fully = entities("eot_request_states_circumstances_fully", period)
        return engaged & ~states_fully


# =============================================================================
# CALCULATED VARIABLES - Sense-check flags (deterministic checks on a proposal)
# =============================================================================


class eot_flag_discretion_not_engaged(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "FLAG: an outcome is proposed but the s 14ZX discretion is not engaged"
    reference = TAA1953_URL + "s14ZX"
    documentation = """
    The hard jurisdictional sense check (ruleset rule 1.5.1): agreeing to or
    refusing a request that is not validly before the Commissioner - objection
    in time, no objection right, extension mechanism unavailable, or no written
    request lodged with the objection - is an error regardless of the merits.
    Reference: s 14ZW(2), s 14ZX TAA 1953; PS LA 2003/7 [5], [7]
    """

    def formula(entities, period):
        """Ruleset rule 1.5.1."""
        proposed = entities("eot_proposed_outcome", period)
        engaged = entities("eot_discretion_engaged", period)
        return ~(proposed == EOTProposedOutcome.undecided) & ~engaged


class eot_flag_atypical_refusal(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "FLAG: proposed refusal despite an all-favourable factor profile"
    reference = PSLA_2003_7_URL
    documentation = """
    Ruleset rule 1.5.2: a refusal is proposed although every recorded factor
    points the applicant's way (short delay, whole-period explanation, arguable
    case, no concrete prejudice, no resting on rights). The flag asks the
    decision maker to articulate what outweighs that profile - it does not
    override the proposal, and mixed profiles never flag (rule 1.5.5).
    Pattern authorities (ruleset Authority base): Brown v FCT [1999] FCA 563
    (Hill J's balancing formulation, upheld by the Full Court, 99 ATC 4852);
    Windshuttle v DFC of T (1993) 46 FCR 235 (arguable case is a low bar);
    FCT v Primary Health Care Ltd [2017] FCAFC 131 (extension upheld where the
    explanation genuinely accounted for the delay).
    Reference: PS LA 2003/7 [10]-[11] and research/eot/case-table.md
    """

    def formula(entities, period):
        """Ruleset rule 1.5.2: fires only on the all-one-way grant profile."""
        proposed = entities("eot_proposed_outcome", period)
        engaged = entities("eot_discretion_engaged", period)
        band = entities("eot_delay_band", period)
        explains = entities("eot_explanation_covers_whole_period", period)
        arguable = entities("eot_objection_arguable", period)
        prejudice = entities("eot_concrete_prejudice_to_commissioner", period)
        rested = entities("eot_taxpayer_rested_on_rights", period)
        return (
            (proposed == EOTProposedOutcome.refuse)
            & engaged
            & (band == EOTDelayBand.short)
            & explains
            & arguable
            & ~prejudice
            & ~rested
        )


class eot_flag_atypical_grant(Variable):
    value_type = bool
    entity = TaxEntity
    definition_period = YEAR
    label = "FLAG: proposed grant despite the recurring refusal-pattern profile"
    reference = PSLA_2003_7_URL
    documentation = """
    Ruleset rule 1.5.3: a grant is proposed although the profile matches the
    recurring refusal pattern (long delay, and resting on rights or an
    explanation gap, with no contributing ATO conduct). The flag asks the
    decision maker to articulate what displaces that pattern - it does not
    override the proposal, and mixed profiles never flag (rule 1.5.5).
    Pattern authorities (ruleset Authority base): Hunter Valley Developments v
    Cohen (1984) 3 FCR 344 (resting on rights vs continuing to contest);
    Brisbane South Regional Health Authority v Taylor (1996) 186 CLR 541 (the
    purpose of time limits and how delay degrades the quality of justice).
    Reference: PS LA 2003/7 [10], [12] and research/eot/case-table.md
    """

    def formula(entities, period):
        """Ruleset rule 1.5.3: fires only on the all-one-way refusal profile."""
        proposed = entities("eot_proposed_outcome", period)
        engaged = entities("eot_discretion_engaged", period)
        band = entities("eot_delay_band", period)
        explains = entities("eot_explanation_covers_whole_period", period)
        ato_conduct = entities("eot_ato_conduct_contributed", period)
        rested = entities("eot_taxpayer_rested_on_rights", period)
        return (
            (proposed == EOTProposedOutcome.agree)
            & engaged
            & (band == EOTDelayBand.long)
            & (rested | ~explains)
            & ~ato_conduct
        )
