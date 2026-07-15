1. **Extension of time to object ruleset (s 14ZX TAA 1953 — sense-check support for a discretionary decision)**

> **DRAFT — pending tax specialist review.** Drafted 2026-07-15. Primary text of
> ss 14ZW(2)–(3) and 14ZX TAA 1953 verified verbatim against Federal Register of
> Legislation point-in-time data, and the PS LA 2003/7 factor list verified
> 2026-07-15 against the practice statement's full text (local ATOLaw capture —
> see `research/eot/README.md` and `research/eot/sources/ps-la-2003-7.md`). Case
> authorities are catalogued with URLs in `research/eot/case-table.md`.
>
> **Scope declaration (Rule Determinism Model).** The s 14ZX discretion is a
> Level 4 (judgement-based) rule: whether to agree to or refuse an extension
> request is decided by a human, on a balancing of factors, with no single factor
> determinative. **This ruleset does not, and must not, compute that outcome.**
> It encodes only: the Level 1–2 deterministic shell around the discretion
> (whether the discretion is engaged at all, the delay arithmetic, the review
> right on refusal), a Level 3 structured record of the factor findings a human
> has made (with citations), and deterministic *sense-check flags* that compare a
> **proposed** human outcome against recurring decision patterns — prompting
> better articulation, never substituting for judgement.

   1. **When the s 14ZX discretion is engaged (deterministic gatekeepers)**

1. An extension-of-time question arises only for a decision that carries an
   objection right under the Objection Rights Ruleset (rule 1.1 there). If there
   is no objection right, there is nothing to extend.[^1]

2. An extension-of-time question arises only where the objection period under
   s 14ZW(1) has ended before the objection is lodged (Objection Rights Ruleset
   rule 1.2). An objection lodged in time needs no extension request, and a
   request purportedly decided for one is a nullity to be flagged, not weighed.[^2]

3. The extension mechanism is treated as **not available** for late objections
   against private rulings (Objection Rights Ruleset rule 1.3.2, which carries its
   own *(VERIFY)* flag).[^3]

4. A late objection is validly before the Commissioner for s 14ZX purposes only
   where it is lodged **together with a written request** asking the Commissioner
   to deal with it as if lodged in time.[^4] (A request received without the
   objection cannot be considered until the objection is lodged.[^7a]) The
   statute also requires the request to **state fully and in detail** the
   circumstances concerning, and reasons for, the lateness,[^5] but an inadequate
   statement does **not** invalidate the request: the decision maker should give
   the taxpayer the opportunity to provide further information, and the absence
   of a detailed explanation must not be the sole reason for refusing (rule
   1.5.4).[^7a] Both findings are recorded as inputs; only the written-request
   requirement gates engagement.

5. The discretion is **engaged** where rules 1.1.1–1.1.4 are all satisfied. Where
   it is engaged, the Commissioner *must* decide to agree or refuse (there is no
   option to not decide), and must give written notice of the decision.[^6]

   2. **Delay measurement (calculated)**

1. The **days late** equals the number of days from the objection deadline
   (Objection Rights Ruleset rule 1.2) to the objection lodgment date. An
   objection lodged on or before the deadline is 0 days late.[^2]

2. For orientation only, the days late are classified into **descriptive delay
   bands** — short, moderate, long — using maintained banding values (dated
   parameters). The bands paraphrase recurring patterns in decided cases (very
   short delays strongly favour the applicant; multi-year delays raise records
   and fairness issues). **The band is framing, not a factor weight: length of
   delay is never determinative.**[^7] *(VERIFY — band edges are editorial values
   for specialists to maintain, not legislated.)*

   3. **The factor record (interpreted — human findings, engine-structured)**

The factors below come from paragraph 10 of PS LA 2003/7 (verified against the
full text, 2026-07-15) and the case-law patterns it reflects. The engine does
not evaluate any of them; it records the decision maker's finding on each
(yes/no), attaches the citation, and makes the record available to any AI
assistant so the assistant cites governed findings rather than free-generating
legal conclusions. Paragraph 10 factors not separately encoded — the
legislative purpose of the time limit, whether the request came as soon as
circumstances permitted, adviser negligence, whether the taxpayer was informed
of the right to object, an intent to let a review period expire, and "any other
relevant matter" — remain part of the human weighing and are not modelled.[^7]

1. **Explanation for the delay** — does the explanation genuinely account for
   the **whole** period of the delay (not just part of it)?

2. **Arguable case** — is the objection arguable (not frivolous, not bound to
   fail in law)? This is a low bar; no full-scale merits investigation is made.

3. **Prejudice to the Commissioner** — has **concrete** prejudice to the
   Commissioner's ability to properly deal with the dispute been identified?
   Administrative inconvenience is not prejudice.

4. **ATO conduct** — did ATO conduct (action or inaction) contribute to the
   delay? (A recurring "stronger explanation" pattern.)

5. **Resting on rights** — did the taxpayer sit on the dispute without signalling
   contest or taking steps (as opposed to actively pursuing it or keeping the
   ATO informed)? (A recurring adverse pattern.)

   4. **What the ruleset deliberately does not answer (Level 4)**

1. The ruleset exposes **no variable for the outcome** of the s 14ZX discretion.
   Whether the factors, weighed together, justify agreeing or refusing is a human
   judgement: no scoring, no matrices, no decision tree, no factor determinative.
   Any consumer (calculator, chatbot, Copilot) must present the outcome as the
   decision maker's, supported — not made — by the rules engine.[^8]

   5. **Sense-check flags (deterministic checks on a proposed outcome)**

Where a **proposed outcome** (agree / refuse) is supplied as an input, the
engine raises flags. A flag never blocks or reverses a proposal; it identifies a
proposal that is legally unavailable or atypical against the decision patterns,
so the decision maker (or a reviewing Copilot) can check the reasoning.

1. **Discretion-not-engaged flag.** Raised where an outcome is proposed but the
   discretion is not engaged (rules 1.1.1–1.1.4 not all satisfied). This is the
   hard, jurisdictional check: agreeing to or refusing a request that is not
   validly before the Commissioner is an error regardless of the merits.[^4]

2. **Atypical-refusal flag.** Raised where a **refusal** is proposed although
   every recorded factor points the applicant's way: delay band short, the
   explanation accounts for the whole period, the case is arguable, no concrete
   prejudice is identified, and the taxpayer did not rest on their rights. The
   flag asks the decision maker to articulate what outweighs that profile.
   *(VERIFY — pattern paraphrases the internal criteria library.)*[^7]

3. **Atypical-grant flag.** Raised where a **grant** is proposed although the
   profile is the recurring refusal pattern: delay band long, and the taxpayer
   rested on their rights or the explanation does not account for the whole
   period, and no ATO conduct contributed to the delay. The flag asks the
   decision maker to articulate what displaces that pattern. *(VERIFY — as
   above.)*[^7]

4. **Seek-further-information prompt.** Raised where the discretion is engaged
   but the request does not state the circumstances of the lateness fully and
   in detail (rule 1.1.4): the decision maker should invite further information
   or a better explanation before deciding, and must not refuse on that ground
   alone.[^7a]

5. No flag is raised for any other combination: a mixed profile is the normal
   territory of the discretion and carries no engine comment.

   6. **After the decision**

1. If the Commissioner agrees to the request, the objection is taken to have
   been lodged within the required period, and proceeds as an in-time
   objection.[^9]

2. If the Commissioner refuses the request, the person may apply to the
   Administrative Review Tribunal for review of the refusal decision. The
   refusal itself carries no objection right (Objection Rights Ruleset rules
   1.1.8 and 1.4.4).[^10]

3. There is **no deemed refusal**: no statutory clock compels the s 14ZX
   decision. (The deemed-disallowance rule in s 14ZYB applies to certain
   objections against a failure to assess or rule, not to extension
   requests.)[^11]

   7. **Authority base (closed citation list for AI grounding)**

The decided cases behind the factor patterns, catalogued with URL sources in
`research/eot/case-table.md`. Any AI assistant using this ruleset cites from
this closed list (plus the legislation and PS LA 2003/7 above) — it must not
free-generate case law. The cases inform the *patterns*; none of them, and no
combination of them, decides an individual request.

| Authority | Court | Stands for |
| :---- | :---- | :---- |
| *Hunter Valley Developments Pty Ltd v Cohen* [1984] FCA 176; (1984) 3 FCR 344 | FCA (Wilcox J) | The aggregated extension-of-time principles: acceptable explanation; resting on rights vs continuing to contest; prejudice; merits; fairness |
| *Brown v Commissioner of Taxation* [1999] FCA 563; 99 ATC 4516 | FCA (Hill J) | The leading s 14ZX case (PS LA 2003/7 [16]): balance the delay, its explanation and circumstances, and prejudice to the Commissioner against the taxpayer's lost review right; arguable case required |
| *FC of T v Brown* 99 ATC 4852; (1999) 42 ATR 672 | FCA Full Court | Upheld Hill J's formulation on appeal |
| *Windshuttle v DFC of T* [1993] FCA 843; (1993) 46 FCR 235 | FCA (von Doussa J) | Relevant prejudice = lost documents, faded recollections, dried-up enquiries; arguable case shown by indicating the factual assertions — no merits trial |
| *FCT v Primary Health Care Ltd* [2017] FCAFC 131 (affirming [2017] AATA 393) | FCA Full Court | Modern application: Tribunal's grant of extensions upheld against the Commissioner's refusal |
| *Brisbane South Regional Health Authority v Taylor* [1996] HCA 25; (1996) 186 CLR 541 | High Court | Why time limits exist and how delay degrades the quality of justice (general limitation principle, applied by analogy) |

2. **Terms**

| Term | Definition | References |
| :---- | :---- | :---- |
| Extension request | Written request lodged together with a late objection asking the Commissioner to deal with it as if lodged in time | s 14ZW(2) TAA 1953 |
| Fully and in detail | The statutory standard for the request's statement of the circumstances of, and reasons for, the lateness | s 14ZW(3) TAA 1953 |
| Discretion engaged | All deterministic gatekeepers satisfied so that s 14ZX(1) obliges the Commissioner to decide the request | ss 14ZW(2)–(3), 14ZX(1) TAA 1953 |
| Days late | Days from the s 14ZW objection deadline to the lodgment date (0 if in time) | s 14ZW(1) TAA 1953 |
| Delay band | Descriptive classification of days late (short / moderate / long) from maintained parameters — framing only, never a factor weight | PS LA 2003/7 patterns |
| Arguable case | The objection is not frivolous and not bound to fail in law — assessed without a full merits investigation | PS LA 2003/7 |
| Concrete prejudice | Identified impairment of the Commissioner's ability to properly deal with the dispute (not administrative inconvenience) | PS LA 2003/7 |
| Resting on rights | Failing to signal contest or take steps while time ran | PS LA 2003/7 patterns |
| Proposed outcome | The human decision maker's draft decision (agree / refuse) supplied to the engine for sense-checking | — |
| ART | Administrative Review Tribunal — reviews s 14ZX refusals | s 14ZX(4) TAA 1953 |

3. **PoC constraints and caveats**

* The engine outputs **no grant/refuse recommendation**; the sense-check flags
  are prompts for articulation only. Any user-facing or officer-facing surface
  must present them that way (also the TASA / reliance consideration from the
  PoC evaluation).
* Factor findings are **inputs** — human findings of fact and evaluation. The
  engine's contribution is structure, citations, determinism at the gatekeepers,
  and consistency of the record; garbage findings in, garbage record out.
* Delay-band edges are editorial parameters (specialist-maintained), not law.
* The atypical-profile flag definitions (rules 1.5.2–1.5.3) paraphrase an
  internal criteria library derived from decided cases; they must be reviewed by
  a tax specialist and re-tuned as the case law moves. They are deliberately
  conservative: flags fire only on all-one-way profiles.
* Deemed-service subtleties, and the *(VERIFY)* flags inherited from the
  Objection Rights Ruleset (private-ruling extension bar; end-day convention),
  carry through unchanged.

[^1]:  [TAA 1953 s 14ZL — Part applies to taxation objections](https://www.legislation.gov.au/C1953A00001/latest/text#s14ZL)

[^2]:  [TAA 1953 s 14ZW — When taxation objections are to be made](https://www.legislation.gov.au/C1953A00001/latest/text#s14ZW)

[^3]:  [TAA 1953 s 14ZW(1A) — private ruling time bar](https://www.legislation.gov.au/C1953A00001/latest/text#s14ZW)

[^4]:  [TAA 1953 s 14ZW(2) — late lodgment with written request](https://www.legislation.gov.au/C1953A00001/latest/text#s14ZW)

[^5]:  [TAA 1953 s 14ZW(3) — request must state circumstances fully and in detail](https://www.legislation.gov.au/C1953A00001/latest/text#s14ZW)

[^6]:  [TAA 1953 s 14ZX(1)–(2) — Commissioner must decide and notify](https://www.legislation.gov.au/C1953A00001/latest/text#s14ZX)

[^7]:  [ATO PS LA 2003/7 — How to treat a request to lodge a late objection](https://www.ato.gov.au/law/view/document?docid=psr%2Fps20037%2Fnat%2Fato%2F00001), esp. [10]–[12]; full text captured locally at `research/eot/sources/ps-la-2003-7.md`

[^7a]:  PS LA 2003/7 [5]–[7]: the request should explain the lateness; if inadequate, give the taxpayer the opportunity to provide further information — its absence must not be the sole reason for refusal; a request without an objection cannot be considered until the objection is lodged.

[^8]:  Internal EOT Copilot analysis scaffold (template-lock: no scoring, matrices or decision trees; no factor determinative) — see `research/eot/README.md`.

[^9]:  [TAA 1953 s 14ZX(3) — objection taken to be lodged in time](https://www.legislation.gov.au/C1953A00001/latest/text#s14ZX)

[^10]:  [TAA 1953 s 14ZX(4) — ART review of refusal](https://www.legislation.gov.au/C1953A00001/latest/text#s14ZX)

[^11]:  [TAA 1953 s 14ZYB — deemed disallowance (failure-to-assess/rule objections only)](https://www.legislation.gov.au/C1953A00001/latest/text#s14ZYB)
