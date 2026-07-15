#!/usr/bin/env bash
set -euo pipefail

API_URL=${API_URL:-https://c16-rac.salsadev.au/calculate}
HEADER_CONTENT_TYPE='Content-Type: application/json; charset=utf-8'

post() {
  local name="$1"
  printf "\n=== %s ===\n" "$name"
  if command -v jq >/dev/null 2>&1; then
    curl -sS -X POST "${API_URL}" -H "${HEADER_CONTENT_TYPE}" --data "$PAYLOAD" | jq
  else
    curl -sS -X POST "${API_URL}" -H "${HEADER_CONTENT_TYPE}" --data "$PAYLOAD"
  fi
  echo
}

# Helper to emit payloads via env var and call post
run_payload() {
  local name="$1"
  local payload="$2"
  PAYLOAD="$payload"
  post "$name"
}

# 1) estimated tax for year (credits, max at zero) — 3 scenarios
run_payload "1.1 estimated tax for year — scenario 1" '
{
  "tax_entities": {
    "tax_entity": {
      "estimated_taxable_income": { "2025": 100000 },
      "tax_offsets": { "2025": 5000 },
      "estimated_tax_credits": { "2025": 2000 },
      "estimated_net_tax_payable": { "2025": null },
      "estimated_tax": { "2025": null }
    }
  }
}'

run_payload "1.2 estimated tax for year — scenario 2" '
{
  "tax_entities": {
    "tax_entity": {
      "estimated_taxable_income": { "2025": 10000 },
      "tax_offsets": { "2025": 0 },
      "estimated_tax_credits": { "2025": 5000 },
      "estimated_net_tax_payable": { "2025": null },
      "estimated_tax": { "2025": null }
    }
  }
}'

run_payload "1.3 estimated tax for year — scenario 3" '
{
  "tax_entities": {
    "tax_entity": {
      "estimated_taxable_income": { "2025": 200000 },
      "tax_offsets": { "2025": 2000 },
      "estimated_tax_credits": { "2025": 1000 },
      "estimated_net_tax_payable": { "2025": null },
      "estimated_tax": { "2025": null }
    }
  }
}'

# 2) year-to-date fraction by quarter — 4 scenarios
run_payload "2.1 YTD fraction — Q1" '
{
  "tax_entities": {
    "tax_entity": {
      "current_quarter": { "2025-09": 1 },
      "fraction_year_to_date": { "2025-09": null }
    }
  }
}'

run_payload "2.2 YTD fraction — Q2" '
{
  "tax_entities": {
    "tax_entity": {
      "current_quarter": { "2025-09": 2 },
      "fraction_year_to_date": { "2025-09": null }
    }
  }
}'

run_payload "2.3 YTD fraction — Q3" '
{
  "tax_entities": {
    "tax_entity": {
      "current_quarter": { "2025-09": 3 },
      "fraction_year_to_date": { "2025-09": null }
    }
  }
}'

run_payload "2.4 YTD fraction — Q4" '
{
  "tax_entities": {
    "tax_entity": {
      "current_quarter": { "2025-09": 4 },
      "fraction_year_to_date": { "2025-09": null }
    }
  }
}'

# 3) year-to-date instalment adjustment — 3 scenarios
run_payload "3.1 YTD instalment adjustment — scenario 1" '
{
  "tax_entities": {
    "tax_entity": {
      "instalments_year_to_date": { "2025-09": 1000 },
      "instalment_variation_credits_year_to_date": { "2025-09": 200 },
      "instalment_adjustment_year_to_date": { "2025-09": null }
    }
  }
}'

run_payload "3.2 YTD instalment adjustment — scenario 2" '
{
  "tax_entities": {
    "tax_entity": {
      "instalments_year_to_date": { "2025-09": 200 },
      "instalment_variation_credits_year_to_date": { "2025-09": 500 },
      "instalment_adjustment_year_to_date": { "2025-09": null }
    }
  }
}'

run_payload "3.3 YTD instalment adjustment — scenario 3" '
{
  "tax_entities": {
    "tax_entity": {
      "instalments_year_to_date": { "2025-09": 0 },
      "instalment_variation_credits_year_to_date": { "2025-09": 0 },
      "instalment_adjustment_year_to_date": { "2025-09": null }
    }
  }
}'

# 4) varied amount payable for the quarter (Q2) — 2 scenarios
run_payload "4.1 varied amount payable — scenario 1" '
{
  "tax_entities": {
    "tax_entity": {
      "estimated_taxable_income": { "2025": 100000 },
      "tax_offsets": { "2025": 0 },
      "estimated_tax_credits": { "2025": 0 },
      "current_quarter": { "2025-12": 2 },
      "instalments_year_to_date": { "2025-12": 3000 },
      "instalment_variation_credits_year_to_date": { "2025-12": 0 },
      "varied_amount_payable": { "2025-12": null }
    }
  }
}'

run_payload "4.2 varied amount payable — scenario 2" '
{
  "tax_entities": {
    "tax_entity": {
      "estimated_taxable_income": { "2025": 20000 },
      "tax_offsets": { "2025": 0 },
      "estimated_tax_credits": { "2025": 15000 },
      "current_quarter": { "2025-12": 2 },
      "instalments_year_to_date": { "2025-12": 1000 },
      "instalment_variation_credits_year_to_date": { "2025-12": 0 },
      "varied_amount_payable": { "2025-12": null }
    }
  }
}'

# 5) new varied rate (%) with zero-denominator guard — 2 scenarios
run_payload "5.1 new varied rate — scenario 1" '
{
  "tax_entities": {
    "tax_entity": {
      "estimated_taxable_income": { "2025": 100 },
      "tax_offsets": { "2025": 0 },
      "estimated_tax_credits": { "2025": 0 },
      "estimated_payg_instalment_income": { "2025": 100 },
      "new_varied_rate": { "2025-09": null }
    }
  }
}'

run_payload "5.2 new varied rate — zero-denominator" '
{
  "tax_entities": {
    "tax_entity": {
      "estimated_taxable_income": { "2025": 100 },
      "tax_offsets": { "2025": 0 },
      "estimated_tax_credits": { "2025": 0 },
      "estimated_payg_instalment_income": { "2025": 0 },
      "new_varied_rate": { "2025-09": null }
    }
  }
}'

# 6) annual net tax negative clamps estimated tax to zero — 1 row
run_payload "6 annual net tax negative clamps to zero" '
{
  "tax_entities": {
    "tax_entity": {
      "estimated_taxable_income": { "2025": 10000 },
      "tax_offsets": { "2025": 5000 },
      "estimated_tax_credits": { "2025": 0 },
      "estimated_net_tax_payable": { "2025": null },
      "estimated_tax": { "2025": null }
    }
  }
}'

# 7) new varied rate equals zero when estimated tax is zero and income positive — 1 row
run_payload "7 new varied rate equals zero when tax is zero" '
{
  "tax_entities": {
    "tax_entity": {
      "estimated_taxable_income": { "2025": 0 },
      "tax_offsets": { "2025": 0 },
      "estimated_tax_credits": { "2025": 0 },
      "estimated_tax": { "2025": null },
      "new_varied_rate": { "2025-09": null }
    }
  }
}'

printf "\nAll requests submitted.\n"
