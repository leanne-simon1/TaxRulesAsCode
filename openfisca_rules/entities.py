"""This file defines the entities needed by our legislation.

Taxes and benefits can be calculated for different entities: persons, household,
companies, etc.

See https://openfisca.org/doc/key-concepts/person,_entities,_role.html
"""

from openfisca_core.entities import build_entity

TaxEntity = build_entity(
    key="tax_entity",
    plural="tax_entities",
    label="Tax Entity",
    doc="""
    A tax entity represents any individual, company, partnership, trust, or other legal entity
    that is subject to Australian tax obligations and may be required to pay PAYG instalments.
    
    This includes:
    - Companies (including base rate entities)
    - Individual taxpayers operating businesses
    - Partnerships
    - Trusts
    - Other entities with tax obligations
    
    For the RaC PoC PAYG calculation, this entity must satisfy specific eligibility criteria
    including being a base rate entity, quarterly instalment payer, and meeting various
    other constraints as defined in the Australian Tax Office regulations.
    """,
    is_person=True,
)

entities = [TaxEntity]
