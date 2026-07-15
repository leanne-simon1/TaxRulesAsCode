# Decision inventory — ATO decisions and objection rights

**DRAFT 2026-07-06 — pending tax specialist review.** Primary legislative text for every
row below was verified on 2026-07-06 against a local `legislation.gov.au` scrape (see
`README.md` "Findings from primary-text verification"). Two rows (3 and 8) had their
time limit **corrected** as a result; one row's VERIFY flag was resolved as originally
stated (row 4); rows still carrying a VERIFY flag need tax specialist sign-off before
reliance.

This table is the contract for the OpenFisca encoding: the `ato_decision_type` Enum in
`openfisca_rules/variables/objections.py` has exactly one value per row, and the YAML
tests in `openfisca_rules/tests/objections/` cover every row plus deadline boundary
cases.

| # | Decision type (`ato_decision_type`) | Objection right? | Legal basis | Time limit | Time-limit start event | Extension available if late? | Pathway if no objection right |
|---|---|---|---|---|---|---|---|
| 1 | `income_tax_assessment` — original income tax assessment | Yes | s 175A ITAA 1936; s 14ZW(1)(aa) TAA 1953 | **2 years** if items 1, 2, 3 or 3A of the s 170(1) ITAA 1936 table apply (individuals and small business entities on the standard amendment period); otherwise **4 years** | Notice of assessment given to the taxpayer | Yes — s 14ZX request lodged with the objection | — |
| 2 | `income_tax_amended_assessment` — amended income tax assessment | Yes, but limited to the alterations made by the amendment (s 14ZV) | s 175A ITAA 1936; ss 14ZV, 14ZW(1B)/(1BA) TAA 1953 | **Later of**: the original assessment's 2yr/4yr window, or **60 days** after the amended notice | Original notice (for the 2yr/4yr limb); amended notice (for the 60-day limb) | Yes — s 14ZX | — |
| 3 | `private_ruling` — private ruling | Yes, **only if no assessment has been made** for the period the ruling relates to (confirmed: s 359-60(3)(a)) | s 359-60 TAA 1953 Sch 1; s 14ZW(1A) TAA 1953 | **Later of**: 60 days after the ruling was given, or — **CORRECTED 2026-07-06** — the *same* 2yr/4yr split as row 1 (by `taxpayer_kind`) after the last day allowed for lodging the relevant return, not a flat 4 years as previously encoded | Ruling given (60-day limb); return lodgment due date (2yr/4yr limb) | **No** (VERIFY still open — see README.md; s 14ZW(1A) is worded as an absolute bar rather than a "must lodge within" duty, which may put it outside the s 14ZW(2) extension mechanism, but this is a drafting-interpretation question, not one resolvable from the text alone) | Object to the assessment instead once made |
| 4 | `gst_assessment` — GST assessment of a net amount | Yes | s 14ZW(1)(bg) TAA 1953; s 155-5(2)(a) ("assessable amount"), s 155-35(2)(a) ("period of review") TAA 1953 Sch 1 | **4 years** after notice — **confirmed 2026-07-06** via s 14ZW(1)(bg) → s 155-35(2)(a) Sch 1 | Notice of assessment given | Yes — s 14ZX | — |
| 5 | `fbt_assessment` — fringe benefits tax assessment | Yes | FBTAA 1986; s 14ZW(1) TAA 1953 | **4 years** after notice (amended FBT: later of 4 years from original / 60 days from amended notice) | Notice of assessment given | Yes — s 14ZX | — |
| 6 | `penalty_assessment` — administrative penalty assessment (e.g. false or misleading statement, failure to lodge) | Yes | Div 298 TAA 1953 Sch 1; s 14ZW(1)(a) | **60 days** after notice | Notice of penalty assessment given | Yes — s 14ZX | — |
| 7 | `super_guarantee_assessment` — superannuation guarantee charge assessment | Yes | SGAA 1992; s 14ZW(1)(a) | **60 days** — confirmed 2026-07-06 verbatim on the ATO's SG charge amendments/objections page | Notice of SGC assessment given (ATO guidance: date of assessment) | Yes — s 14ZX | — |
| 8 | `excess_concessional_contributions_determination` | Yes | s 97-5, 97-10 TAA 1953 Sch 1 (determination + review right) — **CORRECTED 2026-07-06**, was cited as Div 291 ITAA 1997 | **CORRECTED 2026-07-06**: the *same period* the person must lodge a taxation objection against their income tax assessment for that year under s 175A (i.e. the row-1 2yr/4yr rule, keyed to `taxpayer_kind`) — per s 14ZW(1)(aac). **Not** a flat 60 days as previously encoded; this was never actually stated in Div 291 ITAA 1997, which only defines the determination itself | Notice of the related income tax assessment for that year (not the determination) | Yes — s 14ZX | — |
| 9 | `sic_remission_decision` — refusal (full or partial) to remit shortfall interest charge | **Only if** the unremitted SIC is **more than 20%** of the tax shortfall (confirmed verbatim, s 280-170) | s 280-170 TAA 1953 Sch 1 | **60 days** | Notice of remission decision given | Yes — s 14ZX | ≤ 20%: ATO internal review request, complaint (Tax Ombudsman), or judicial review |
| 10 | `gic_remission_decision` — refusal to remit general interest charge | **No** (confirmed 2026-07-06: "The law doesn't allow you to object to the GIC") | No Part IVC right (ATO: Remission of interest charges) | — | — | — | Complaint (Tax Ombudsman) or judicial review in the Federal Court under the ADJR Act 1977; can also re-request remission |
| 11 | `objection_extension_refusal` — Commissioner's refusal of a s 14ZX request for extra time to object | **No** (not itself objectable) | s 14ZX(4) TAA 1953 | — | — | — | Apply to the **ART** for review of the refusal decision |

## Notes for the encoder

- **2yr vs 4yr pivot (rows 1, 2, 3, 8):** the statutory test is whether items 1, 2, 3 or
  3A of the table in s 170(1) ITAA 1936 apply to the assessment — approximately
  "individuals and small business entities with straightforward affairs". The ruleset
  models this as the `taxpayer_kind` input (individual / small_business_entity →
  2 years; other → 4 years) and flags the approximation for specialist review. As of
  2026-07-06 this same split is now known to also govern **row 3's** fallback limb
  (currently hard-coded to 4 years in `objection_deadline`) and **row 8's** entire
  deadline (currently a standalone flat 60 days) — both need code changes, not just
  documentation changes, to be legally correct. Not yet applied to `objections.py`.
- **Row 8's deadline depends on a different decision's notice date.** Correctly
  encoding row 8 requires knowing the notice date (and taxpayer kind) of the *related
  income tax assessment* for the same year, not just the determination's own date —
  this is a bigger change than the current single-decision-type model assumes.
- **Deadline day convention:** "2 years / 4 years after" is encoded as the same
  calendar day N years later (29 Feb anniversaries fall back to 28 Feb); "60 days
  after" is encoded as notice date + 60 calendar days. Lodgment **on** the deadline
  day is in time. Still VERIFY against Acts Interpretation Act conventions (open,
  see README.md).
- **Out-of-time is not the end:** for every objectable decision except private rulings,
  a late objection can be lodged together with a s 14ZX written extension request; the
  refusal of that request is row 11. Whether private rulings (row 3) are really
  excluded from this remains an open question — see README.md.
- Decisions outside this table (e.g. debt payment-plan refusals, compromise decisions)
  are out of scope for this iteration; the chatbot must not guess about them.
