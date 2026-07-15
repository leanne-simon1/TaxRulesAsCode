## PAYG OpenFisca API Integration Guide

This guide describes how to integrate accounting systems with the PAYG Instalment variation model via the OpenFisca API.

### Overview
- **Endpoint**: `POST /calculate`
- **Base URL**: `https://c16-rac.salsadev.au`
- **Entity**: `tax_entity` (singular), nested under `tax_entities`
- **Payload**:
```json
{
  "tax_entities": {
    "tax_entity": {
      "<variable_key>": { "<period>": <value_or_null> }
    }
  }
}
```
- Provide values for inputs; set calculated outputs to `null` to request computation.
- **Response shape**: The API echoes your payload structure and replaces any requested outputs (set to `null`) with calculated values.

### Periods
- **Year variables** use income year keys: e.g. "2025".
- **Month variables** use BAS period keys: e.g. "2025-09" (YY-MM aligned to quarter month).
- Ensure all period keys are consistent per request.
- Use the period you are calculating for (target BAS period), not necessarily the calendar "current" date.
- All month-level variables in a single request must use the same BAS period key (e.g. all "2025-12").
- Align year variables to the income year that contains that BAS period (e.g. "2025-09" and "2025-12" → year "2025"; "2026-03" → year "2026").

### Scenarios (what to send)
Choose the scenario(s) that match your workflow.

- **Scenario A: Estimate annual tax**
  - Send: `estimated_taxable_income`, `tax_offsets`, `estimated_tax_credits` for the income year
  - Main output: `estimated_tax`

- **Scenario B: Compute varied amount payable**
  - Send: annual tax inputs (Scenario A) + `current_quarter`, `instalments_year_to_date`, `instalment_variation_credits_year_to_date`
  - Main output: `varied_amount_payable`
  - Alternative (modular): Provide `estimated_tax` (year) directly instead of annual inputs

- **Scenario C: Compute new varied rate (%)**
  - Send: annual tax inputs (Scenario A) + `estimated_payg_instalment_income` (year)
  - Main output: `new_varied_rate` (guarded to 0 if `estimated_payg_instalment_income` is 0)
  - Alternative (modular): Provide `estimated_tax` (year) + `estimated_payg_instalment_income`

### Variable catalogue
- Inputs (year-level)
  - `estimated_taxable_income`, `tax_offsets`, `estimated_tax_credits`, `estimated_payg_instalment_income`
- Inputs (month-level)
  - `current_quarter`, `instalments_year_to_date`, `instalment_variation_credits_year_to_date`
- Outputs (calculated)
  - `estimated_tax`, `varied_amount_payable`, `new_varied_rate`
- Policy parameter (do not send)
  - `corporate_tax_rate`

### Validation and types
- Currency/number fields: non‑negative, up to 2 decimal places
- `current_quarter` in {1, 2, 3, 4}
- Only include outputs you want computed as `null`. Intermediate outputs are optional.

### Example requests
Set your base URL:
```bash
API_URL="https://c16-rac.salsadev.au/calculate"
```

#### A) Estimate annual tax (year)
- Minimal (main output only):
```bash
curl -sS -X POST "$API_URL" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data '{
    "tax_entities": {
      "tax_entity": {
        "estimated_taxable_income": { "2025": 100000 },
        "tax_offsets": { "2025": 5000 },
        "estimated_tax_credits": { "2025": 2000 },
        "estimated_tax": { "2025": null }
      }
    }
  }'
```
Example response:
```json
{
  "tax_entities": {
    "tax_entity": {
      "estimated_taxable_income": { "2025": 100000 },
      "tax_offsets": { "2025": 5000 },
      "estimated_tax_credits": { "2025": 2000 },
      "estimated_tax": { "2025": 18000 }
    }
  }
}
```

#### B) Varied amount payable (Q2 example)
- Minimal outputs requested (only final):
```bash
curl -sS -X POST "$API_URL" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data '{
    "tax_entities": {
      "tax_entity": {
        "estimated_taxable_income": { "2025": 100000 },
        "tax_offsets": { "2025": 5000 },
        "estimated_tax_credits": { "2025": 2000 },
        "current_quarter": { "2025-12": 2 },
        "instalments_year_to_date": { "2025-12": 3000 },
        "instalment_variation_credits_year_to_date": { "2025-12": 0 },
        "varied_amount_payable": { "2025-12": null }
      }
    }
  }'
```
Example response:
```json
{
  "tax_entities": {
    "tax_entity": {
      "estimated_taxable_income": { "2025": 100000 },
      "tax_offsets": { "2025": 5000 },
      "estimated_tax_credits": { "2025": 2000 },
      "current_quarter": { "2025-12": 2 },
      "instalments_year_to_date": { "2025-12": 3000 },
      "instalment_variation_credits_year_to_date": { "2025-12": 0 },
      "varied_amount_payable": { "2025-12": :6000 }
    }
  }
}
```

- Alternative (modular): Provide `estimated_tax` directly instead of annual inputs
```bash
curl -sS -X POST "$API_URL" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data '{
    "tax_entities": {
      "tax_entity": {
        "estimated_tax": { "2025": 18000 },
        "current_quarter": { "2025-12": 2 },
        "instalments_year_to_date": { "2025-12": 3000 },
        "instalment_variation_credits_year_to_date": { "2025-12": 0 },
        "varied_amount_payable": { "2025-12": null }
      }
    }
  }'
```
Example response:
```json
{
  "tax_entities": {
    "tax_entity": {
      "estimated_tax": { "2025": 18000 },
      "current_quarter": { "2025-12": 2 },
      "instalments_year_to_date": { "2025-12": 3000 },
      "instalment_variation_credits_year_to_date": { "2025-12": 0 },
      "varied_amount_payable": { "2025-12": 6000 }
    }
  }
}
```

#### C) New varied rate (%)
- With positive instalment income:
```bash
curl -sS -X POST "$API_URL" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data '{
    "tax_entities": {
      "tax_entity": {
        "estimated_taxable_income": { "2025": 100000 },
        "tax_offsets": { "2025": 5000 },
        "estimated_tax_credits": { "2025": 2000 },
        "estimated_payg_instalment_income": { "2025": 100000 },
        "new_varied_rate": { "2025-09": null }
      }
    }
  }'
```
Example response:
```json
{
  "tax_entities": {
    "tax_entity": {
      "estimated_taxable_income": { "2025": 100000 },
      "tax_offsets": { "2025": 5000 },
      "estimated_tax_credits": { "2025": 2000 },
      "estimated_payg_instalment_income": { "2025": 100000 },
      "new_varied_rate": { "2025-09": 25 }
    }
  }
}
```

- Alternative (modular): Provide `estimated_tax` directly with instalment income
```bash
curl -sS -X POST "$API_URL" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data '{
    "tax_entities": {
      "tax_entity": {
        "estimated_tax": { "2025": 18000 },
        "estimated_payg_instalment_income": { "2025": 100000 },
        "new_varied_rate": { "2025-09": null }
      }
    }
  }'
```
Example response:
```json
{
  "tax_entities": {
    "tax_entity": {
      "estimated_tax": { "2025": 18000 },
      "estimated_payg_instalment_income": { "2025": 100000 },
      "new_varied_rate": { "2025-09": 18 }
    }
  }
}
```
- With zero instalment income (rate = 0):
```bash
curl -sS -X POST "$API_URL" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data '{
    "tax_entities": {
      "tax_entity": {
        "estimated_taxable_income": { "2025": 100000 },
        "tax_offsets": { "2025": 5000 },
        "estimated_tax_credits": { "2025": 2000 },
        "estimated_payg_instalment_income": { "2025": 0 },
        "new_varied_rate": { "2025-09": null }
      }
    }
  }'
```
Example response:
```json
{
  "tax_entities": {
    "tax_entity": {
      "estimated_taxable_income": { "2025": 100000 },
      "tax_offsets": { "2025": 5000 },
      "estimated_tax_credits": { "2025": 2000 },
      "estimated_payg_instalment_income": { "2025": 0 },
      "new_varied_rate": { "2025-09": 0 }
    }
  }
}
```

Note: When `estimated_payg_instalment_income` for the year is 0, the engine returns `new_varied_rate` 0 (division-by-zero guard), regardless of the annual estimated tax.

#### Chained workflow (A → B and C)
You can call A to compute `estimated_tax`, then call B and/or C either:
- by reusing the same annual inputs (engine computes `estimated_tax` internally), or
- by providing `estimated_tax` directly (modular OpenAPI usage).

1) Compute annual tax (A) and capture value for logging (optional):
```bash
ETAX=$(curl -sS -X POST "$API_URL" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data '{
    "tax_entities": {
      "tax_entity": {
        "estimated_taxable_income": { "2025": 100000 },
        "tax_offsets": { "2025": 5000 },
        "estimated_tax_credits": { "2025": 2000 },
        "estimated_tax": { "2025": null }
      }
    }
  }' | jq -r '.tax_entities.tax_entity.estimated_tax["2025"]')
echo "Estimated tax (A): $ETAX"
```

2) Compute varied amount payable (B) using the same annual inputs:
```bash
curl -sS -X POST "$API_URL" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data '{
    "tax_entities": {
      "tax_entity": {
        "estimated_taxable_income": { "2025": 100000 },
        "tax_offsets": { "2025": 5000 },
        "estimated_tax_credits": { "2025": 2000 },
        "current_quarter": { "2025-12": 2 },
        "instalments_year_to_date": { "2025-12": 3000 },
        "instalment_variation_credits_year_to_date": { "2025-12": 0 },
        "varied_amount_payable": { "2025-12": null }
      }
    }
  }'
```

3) Compute varied amount payable (B) by providing `estimated_tax` directly:
```bash
curl -sS -X POST "$API_URL" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data '{
    "tax_entities": {
      "tax_entity": {
        "estimated_tax": { "2025": '"$ETAX"' },
        "current_quarter": { "2025-12": 2 },
        "instalments_year_to_date": { "2025-12": 3000 },
        "instalment_variation_credits_year_to_date": { "2025-12": 0 },
        "varied_amount_payable": { "2025-12": null }
      }
    }
  }'
```

4) Compute new varied rate (C) using the same annual inputs:
```bash
curl -sS -X POST "$API_URL" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data '{
    "tax_entities": {
      "tax_entity": {
        "estimated_taxable_income": { "2025": 100000 },
        "tax_offsets": { "2025": 5000 },
        "estimated_tax_credits": { "2025": 2000 },
        "estimated_payg_instalment_income": { "2025": 100000 },
        "new_varied_rate": { "2025-09": null }
      }
    }
  }'
```

5) Compute new varied rate (C) by providing `estimated_tax` directly:
```bash
curl -sS -X POST "$API_URL" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data '{
    "tax_entities": {
      "tax_entity": {
        "estimated_tax": { "2025": '"$ETAX"' },
        "estimated_payg_instalment_income": { "2025": 100000 },
        "new_varied_rate": { "2025-09": null }
      }
    }
  }'
```

### Supporting endpoints and OpenAPI spec
- **OpenAPI spec** (`/spec`): Machine‑readable API description. Many deployments expose Swagger UI at this route.
```bash
curl -sS "https://c16-rac.salsadev.au/spec" | jq
```
- **Variables catalogue** (`/variables`): Lists available variables.
```bash
curl -sS "https://c16-rac.salsadev.au/variables" | jq
```
- **Variable details** (`/variables/{variable_name}`): Shows entity, definition period, and metadata (e.g., whether it’s input or computed).
```bash
curl -sS "https://c16-rac.salsadev.au/variable/estimated_tax" | jq
```
- **Parameters catalogue** (`/parameters`): Lists parameter trees.
```bash
curl -sS "https://c16-rac.salsadev.au/parameters" | jq
```
- **Parameter details** (`/parameters/{parameter_name}`): Fetch a specific parameter node/value.
```bash
curl -sS "https://c16-rac.salsadev.au/parameter/corporate_tax_rate" | jq
```
- **Entities** (`/entities`): Lists entities defined by the package (e.g., `tax_entity`).
```bash
curl -sS "https://c16-rac.salsadev.au/entities" | jq
```

### Error handling
- The API returns standard HTTP codes and a JSON body describing issues.
- According to the OpenAPI spec:
  - 400 Bad Request: The request is invalid. Details about the error are sent back in the response body (e.g. malformed JSON, wrong period key type, schema mismatch, invalid enum).
  - 404 Not Found: A variable mentioned in the input situation does not exist in the loaded system. Details are sent back in the response body.
- The resource endpoints also return 404 when a variable/parameter is unknown: `/variable/{variableID}`, `/parameter/{parameterID}`.

Examples
- 400 ( wrong period key type)
```json
{"estimated_taxable_income":"Unable to set a value for variable "estimated_taxable_income" for month-long period "2025-12". "estimated_taxable_income" can only be set for one year at a time."}
```
- 404 (unknown variable)
```json
{"example_variable":"You tried to calculate or to set a value for variable 'example_variable', but it was not found in the loaded tax and benefit system"}
```

Recommended
- Validate payloads before sending (period keys, enums, numeric ranges) and log both request and response for diagnostics.