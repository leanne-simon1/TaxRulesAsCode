"""RaC PoC PAYG Instalment Variation Calculation - OpenFisca Implementation.

Based on the RaC PoC ruleset for Australian Tax Office PAYG calculations.
"""

from openfisca_core.model_api import MONTH, YEAR, Variable, max_, select

from openfisca_rules.entities import TaxEntity

# =============================================================================
# INPUT VARIABLES - Core Financial Data
# =============================================================================


class estimated_taxable_income(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Estimated taxable income for the year"
    reference = "https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/payg-instalments/how-to-vary-your-payg-instalments/estimating-tax-on-your-instalment-income#BK_1Workoutyourestimatedtaxableincome"
    documentation = """
    The predicted income for an income year for a taxpayer that is subject to tax.
    Reference: Estimating tax on your instalment income | ATO
    """


class estimated_tax_credits(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Estimated tax credits"
    reference = "https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/payg-instalments/how-to-vary-your-payg-instalments/estimating-tax-on-your-instalment-income#BK_10Subtractanyestimatedtaxcredits"
    documentation = """
    Estimated tax credits for the income year.
    Reference: Estimating tax on your instalment income | ATO
    """


class tax_offsets(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Tax offsets"
    reference = "https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/payg-instalments/how-to-vary-your-payg-instalments/estimating-tax-on-your-instalment-income#BK_3Subtacttaxoffsetsotherthanrefundable"
    documentation = """
    Tax offsets (non-refundable) that reduce tax liability.
    Reference: Estimating tax on your instalment income | ATO
    """


class current_quarter(Variable):
    value_type = int
    entity = TaxEntity
    definition_period = MONTH
    label = "Current quarter number (1-4)"
    documentation = """
    Current quarter for which PAYG instalment is being calculated (1-4).
    """


# =============================================================================
# INPUT VARIABLES - Annual Estimates
# =============================================================================


class estimated_payg_instalment_income(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Estimated PAYG instalment income for the year"
    reference = "https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/payg-instalments/calculate-your-payg-instalments/instalment-income"
    documentation = """
    Estimated annual PAYG instalment income (T1 basis) used for the varied rate.
    Defined as the estimated ordinary income from business and investment activities for the year (excluding GST).
    Reference: Instalment income | ATO
    """


# =============================================================================
# INPUT VARIABLES - Historical Data
# =============================================================================


class instalments_year_to_date(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = MONTH
    label = "Instalments year-to-date"
    reference = "BAS A label 5A"
    documentation = """
    PAYG instalments year-to-date in the income year.
    Reference: BAS A label 5A from prior lodgments
    """


class instalment_variation_credits_year_to_date(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = MONTH
    label = "Instalment variation credits year-to-date"
    reference = "BAS A label 5B"
    documentation = """
    Instalment variation credits year-to-date in the income year.
    Reference: BAS A label 5B from prior lodgments
    """


# =============================================================================
# CALCULATED VARIABLES - Year-to-Date Calculations
# =============================================================================


class fraction_year_to_date(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = MONTH
    label = "Year-to-date fraction"
    documentation = """
    Proportion of the income year completed as at the end of the current quarter.
    Q1 = 0.25, Q2 = 0.5, Q3 = 0.75, Q4 = 1.0
    """

    def formula(entities, period):
        """Calculate year-to-date fraction based on current quarter."""
        quarter = entities("current_quarter", period)
        return quarter / 4.0


class instalment_adjustment_year_to_date(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = MONTH
    label = "Year-to-date instalment adjustment"
    documentation = """
    Year-to-date instalment adjustment = instalments year-to-date - instalment variation credits year-to-date.
    """

    def formula(entities, period):
        """Calculate year-to-date instalment adjustment."""
        instalments = entities("instalments_year_to_date", period)
        variation_credits = entities("instalment_variation_credits_year_to_date", period)
        return instalments - variation_credits


# =============================================================================
# CALCULATED VARIABLES - Tax Calculations
# =============================================================================


class estimated_net_tax_payable(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Estimated net tax payable for the year"
    reference = "https://www.ato.gov.au/tax-rates-and-codes/company-tax-rates"
    documentation = """
    Estimated annual net tax payable = (estimated taxable income * applicable corporate tax rate)
    - tax offsets - estimated tax credits.
    Applicable tax rate for the PoC is the base rate entity rate (parameterised).
    Reference: Company tax rates | ATO
    """

    def formula(entities, period, parameters):
        """Calculate estimated annual net tax payable including offsets and credits."""
        taxable_income = entities("estimated_taxable_income", period)
        offsets = entities("tax_offsets", period)
        tax_credits = entities("estimated_tax_credits", period)
        corporate_tax_rate = parameters(period).corporate_tax_rate
        return (taxable_income * corporate_tax_rate) - offsets - tax_credits


class estimated_tax(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = YEAR
    label = "Estimated tax for the year"
    reference = "https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/payg-instalments/how-to-vary-your-payg-instalments/estimating-tax-on-your-instalment-income#BK_10Subtractanyestimatedtaxcredits"
    documentation = """
    Estimated tax for the year (T8) = max(estimated annual net tax payable, 0).
    Credits are already included in the annual net tax payable figure.
    Reference: BAS A label T8
    """

    def formula(entities, period):
        """Calculate estimated tax for the year as non-negative annual net tax payable."""
        annual_net_tax = entities("estimated_net_tax_payable", period)
        return max_(annual_net_tax, 0)


# =============================================================================
# OUTPUT VARIABLES - Main Calculations
# =============================================================================


class varied_amount_payable(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = MONTH
    label = "Varied amount payable for the quarter"
    reference = "BAS A label T9"
    documentation = """
    Varied amount payable for the quarter = (estimated tax * YTD fraction) - YTD adjustment.
    Reference: BAS A label T9
    """

    def formula(entities, period):
        """Calculate varied amount payable for the quarter."""
        estimated_tax = entities("estimated_tax", period.this_year)
        ytd_fraction = entities("fraction_year_to_date", period)
        ytd_adjustment = entities("instalment_adjustment_year_to_date", period)

        return (estimated_tax * ytd_fraction) - ytd_adjustment


class new_varied_rate(Variable):
    value_type = float
    entity = TaxEntity
    definition_period = MONTH
    label = "New varied rate (%)"
    reference = "BAS A label T3"
    documentation = """
    New varied rate (T3) = (estimated tax for the year / estimated annual PAYG instalment income) * 100.
    Estimated PAYG instalment income is the estimated ordinary income from business and investment activities for the year (excl GST).
    Reference: BAS A label T3
    """

    def formula(entities, period):
        """Calculate new varied rate as percentage of estimated annual instalment income."""
        estimated_tax = entities("estimated_tax", period.this_year)
        annual_instalment_income = entities("estimated_payg_instalment_income", period.this_year)

        # Avoid division by zero warnings by using a safe denominator for the vectorised division.
        # The select will mask out the zero-income cases to 0 afterwards.
        # NOTE: the value 1e-9 is 0.000000001, but should be small enough to not affect the result.
        safe_annual_instalment_income = max_(annual_instalment_income, 1e-9)
        new_rate_percent = (estimated_tax / safe_annual_instalment_income) * 100
        return select([annual_instalment_income > 0], [new_rate_percent], default=0)
