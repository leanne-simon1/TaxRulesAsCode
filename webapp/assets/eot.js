/* Extension of time (s 14ZX) sense check - a thin view over
 * openfisca_rules/variables/extension_of_time.py (plus the objections module it
 * builds on). Uses the shared apiGet/apiPost/el/referenceLinks/variableMeta/
 * showError helpers from app.js. The engine never computes the s 14ZX outcome;
 * this page never displays one - only gatekeepers, the factor record and flags.
 */

const DECISION_TYPES = [
  ['income_tax_assessment', 'Income tax assessment (original)'],
  ['income_tax_amended_assessment', 'Amended income tax assessment'],
  ['private_ruling', 'Private ruling'],
  ['gst_assessment', 'GST assessment (net amount)'],
  ['fbt_assessment', 'Fringe benefits tax assessment'],
  ['penalty_assessment', 'Administrative penalty assessment'],
  ['super_guarantee_assessment', 'Superannuation guarantee charge assessment'],
  ['excess_concessional_contributions_determination', 'Excess concessional contributions determination'],
  ['sic_remission_decision', 'Refusal to remit shortfall interest charge (SIC)'],
  ['gic_remission_decision', 'Refusal to remit general interest charge (GIC)'],
];
const DECISION_LABELS = Object.fromEntries(DECISION_TYPES);

const NO_DATE_TYPES = new Set(['gic_remission_decision']);
const TAXPAYER_KIND_TYPES = new Set([
  'income_tax_assessment', 'income_tax_amended_assessment',
  'private_ruling', 'excess_concessional_contributions_determination',
]);

const BAND_LABELS = {
  not_late: 'In time — no delay',
  short: 'Short (descriptive band)',
  moderate: 'Moderate (descriptive band)',
  long: 'Long (descriptive band)',
};

const OUTPUTS = [
  'has_objection_right', 'objection_deadline', 'objection_in_time',
  'can_request_extension', 'eot_days_late', 'eot_delay_band',
  'eot_discretion_engaged', 'eot_art_review_available_if_refused',
  'eot_prompt_seek_further_information',
  'eot_flag_discretion_not_engaged', 'eot_flag_atypical_refusal',
  'eot_flag_atypical_grant',
];

/* The PS LA 2003/7 factor record: form field -> engine variable + display label. */
const FACTORS = [
  ['fExplains', 'eot_explanation_covers_whole_period', 'Explanation accounts for the whole period of delay'],
  ['fArguable', 'eot_objection_arguable', 'Arguable case (low bar — no merits trial)'],
  ['fPrejudice', 'eot_concrete_prejudice_to_commissioner', 'Concrete prejudice to the Commissioner identified'],
  ['fAtoConduct', 'eot_ato_conduct_contributed', 'ATO conduct contributed to the delay'],
  ['fRested', 'eot_taxpayer_rested_on_rights', 'Taxpayer rested on their rights'],
];

/* The three worked examples (mirrors tests/eot/*.yaml, which are the ground truth). */
const EXAMPLES = {
  a: {
    decisionType: 'penalty_assessment', noticeDate: '2025-01-01', lodgmentDate: '2025-02-14',
    reqWriting: 'true', reqFully: 'true',
    fExplains: 'true', fArguable: 'true', fPrejudice: 'false', fAtoConduct: 'false', fRested: 'false',
    proposedOutcome: 'refuse',
  },
  b: {
    decisionType: 'penalty_assessment', noticeDate: '2025-01-01', lodgmentDate: '2025-03-23',
    reqWriting: 'true', reqFully: 'true',
    fExplains: 'true', fArguable: 'true', fPrejudice: 'false', fAtoConduct: 'false', fRested: 'false',
    proposedOutcome: 'refuse',
  },
  c: {
    decisionType: 'income_tax_assessment', taxpayerKind: 'individual',
    noticeDate: '2021-06-01', lodgmentDate: '2025-06-10',
    reqWriting: 'true', reqFully: 'true',
    fExplains: 'false', fArguable: 'true', fPrejudice: 'false', fAtoConduct: 'false', fRested: 'true',
    proposedOutcome: 'agree',
  },
};

const decisionSelect = document.getElementById('decisionType');
DECISION_TYPES.forEach(([value, label]) => decisionSelect.appendChild(el('option', { value }, label)));
decisionSelect.addEventListener('change', updateVisibleFields);
updateVisibleFields();

document.getElementById('calc-btn').addEventListener('click', calculate);
document.getElementById('input-form').addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
document.querySelectorAll('[data-example]').forEach((btn) =>
  btn.addEventListener('click', () => loadExample(btn.dataset.example)));

function updateVisibleFields() {
  const type = decisionSelect.value;
  document.getElementById('f-noticeDate').hidden = NO_DATE_TYPES.has(type);
  document.getElementById('f-taxpayerKind').hidden = !TAXPAYER_KIND_TYPES.has(type);
  document.getElementById('f-originalNoticeDate').hidden = type !== 'income_tax_amended_assessment';
  document.getElementById('f-hasAssessment').hidden = type !== 'private_ruling';
  document.getElementById('f-returnDueDate').hidden = type !== 'private_ruling';
  document.getElementById('f-relatedNoticeDate').hidden = type !== 'excess_concessional_contributions_determination';
  document.getElementById('f-sicFraction').hidden = type !== 'sic_remission_decision';
}

function loadExample(key) {
  const ex = EXAMPLES[key];
  for (const [id, value] of Object.entries(ex)) {
    const field = document.getElementById(id);
    if (field) field.value = value;
  }
  updateVisibleFields();
  calculate();
  document.getElementById('input-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function readForm() {
  const decisionType = decisionSelect.value;
  const v = { decisionType };

  if (!NO_DATE_TYPES.has(decisionType)) {
    const nd = document.getElementById('noticeDate').value;
    if (!nd) throw new Error('Please enter the date on the notice of the decision.');
    v.noticeDate = nd;
  }
  const ld = document.getElementById('lodgmentDate').value;
  if (!ld) throw new Error('Please enter the objection lodgment date.');
  v.lodgmentDate = ld;

  if (TAXPAYER_KIND_TYPES.has(decisionType)) v.taxpayerKind = document.getElementById('taxpayerKind').value;
  if (decisionType === 'income_tax_amended_assessment') {
    const on = document.getElementById('originalNoticeDate').value;
    if (!on) throw new Error('Please enter the date on the notice of the original assessment.');
    v.originalNoticeDate = on;
  }
  if (decisionType === 'private_ruling') {
    v.hasAssessment = document.getElementById('hasAssessment').value === 'true';
    const rd = document.getElementById('returnDueDate').value;
    if (!rd) throw new Error('Please enter the return lodgment due date.');
    v.returnDueDate = rd;
  }
  if (decisionType === 'excess_concessional_contributions_determination') {
    const rn = document.getElementById('relatedNoticeDate').value;
    if (!rn) throw new Error('Please enter the date on the notice of the related income tax assessment.');
    v.relatedNoticeDate = rn;
  }
  if (decisionType === 'sic_remission_decision') {
    const pctVal = Number(document.getElementById('sicFraction').value);
    if (Number.isNaN(pctVal) || pctVal < 0) throw new Error('Please enter a non-negative percentage.');
    v.sicFraction = pctVal / 100;
  }

  v.reqWriting = document.getElementById('reqWriting').value === 'true';
  v.reqFully = document.getElementById('reqFully').value === 'true';
  for (const [id] of FACTORS) v[id] = document.getElementById(id).value === 'true';
  v.proposedOutcome = document.getElementById('proposedOutcome').value;
  return v;
}

function buildEntity(v, periodYear) {
  const entity = { ato_decision_type: { [periodYear]: v.decisionType } };
  if (v.noticeDate) entity.decision_notice_date = { [periodYear]: v.noticeDate };
  entity.objection_lodgment_date = { [periodYear]: v.lodgmentDate };
  if (v.taxpayerKind) entity.taxpayer_kind = { [periodYear]: v.taxpayerKind };
  if (v.originalNoticeDate) entity.original_assessment_notice_date = { [periodYear]: v.originalNoticeDate };
  if (v.hasAssessment !== undefined) entity.has_assessment_for_ruling_period = { [periodYear]: v.hasAssessment };
  if (v.returnDueDate) entity.return_lodgment_due_date = { [periodYear]: v.returnDueDate };
  if (v.relatedNoticeDate) entity.related_assessment_notice_date = { [periodYear]: v.relatedNoticeDate };
  if (v.sicFraction !== undefined) entity.sic_remaining_fraction_of_shortfall = { [periodYear]: v.sicFraction };

  entity.eot_request_in_writing = { [periodYear]: v.reqWriting };
  entity.eot_request_states_circumstances_fully = { [periodYear]: v.reqFully };
  for (const [id, variable] of FACTORS) entity[variable] = { [periodYear]: v[id] };
  entity.eot_proposed_outcome = { [periodYear]: v.proposedOutcome };

  for (const name of OUTPUTS) entity[name] = { [periodYear]: null };
  return entity;
}

async function calculate() {
  const errorBox = document.getElementById('error-box');
  errorBox.replaceChildren();
  let v;
  try { v = readForm(); } catch (err) { showError(errorBox, err); return; }

  const periodYear = String(new Date(v.lodgmentDate).getFullYear());
  const entity = buildEntity(v, periodYear);
  const payload = { tax_entities: { tax_entity: entity } };

  try {
    const res = await apiPost('calculate', payload);
    const out = res.tax_entities.tax_entity;
    const val = (name) => out[name][periodYear];

    renderStats(val);
    renderFlags(v, val);
    renderFactorTable(v, val);
    renderCopilot(payload, out, periodYear);
    document.getElementById('results').hidden = false;
    await renderWhy();
  } catch (err) {
    showError(errorBox, err);
  }
}

function formatDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function renderStats(val) {
  const engaged = val('eot_discretion_engaged');
  const days = val('eot_days_late');
  const band = val('eot_delay_band');
  const cards = [
    el('div', { class: engaged ? 'stat good' : 'stat no-right' },
      el('div', { class: 'label' }, 's 14ZX discretion engaged?'),
      el('div', { class: 'value' }, engaged ? 'Yes' : 'No'),
      el('div', { class: 'bas' }, engaged
        ? 'A valid request is before the Commissioner — a human must now decide it'
        : 'No valid extension request is before the Commissioner')),
    el('div', { class: 'stat' },
      el('div', { class: 'label' }, 'Objection deadline / days late'),
      el('div', { class: 'value' }, `${days} day${days === 1 ? '' : 's'}`),
      el('div', { class: 'bas' }, `Deadline ${formatDate(val('objection_deadline'))} · ${BAND_LABELS[band] || band}`)),
  ];
  if (engaged) {
    cards.push(el('div', { class: 'stat' },
      el('div', { class: 'label' }, 'If refused (s 14ZX(4))'),
      el('div', { class: 'value', style: 'font-size:1.1rem' }, 'ART review available'),
      el('div', { class: 'bas' }, 'The refusal itself cannot be objected to')));
  }
  document.getElementById('stat-cards').replaceChildren(...cards);
}

function renderFlags(v, val) {
  const box = document.getElementById('flag-box');
  const flags = [];

  if (val('eot_flag_discretion_not_engaged')) {
    const why = !val('has_objection_right') ? 'the decision carries no objection right — there is nothing to extend'
      : val('objection_in_time') ? 'the objection was lodged IN TIME — there is nothing to extend'
      : !val('can_request_extension') ? 'the extension mechanism is not available for this decision type'
      : 'no WRITTEN extension request was lodged with the objection (s 14ZW(2))';
    flags.push(el('div', { class: 'notice flag-danger' },
      el('strong', {}, '⛔ Jurisdictional flag: the discretion is not engaged. '),
      `An outcome is proposed, but ${why}. Deciding this "request" would be an error regardless of the merits (rule 1.5.1).`));
  }
  if (val('eot_flag_atypical_refusal')) {
    flags.push(el('div', { class: 'notice flag-warn' },
      el('strong', {}, '⚠️ Atypical refusal: '),
      'every recorded factor points the applicant’s way (short delay, whole-period explanation, arguable case, no concrete prejudice, no resting on rights). Decided cases treat this profile as strongly favourable — Brown v FCT [1999] FCA 563 (the balancing), Windshuttle (1993) 46 FCR 235 (arguable case is a low bar). The reasons should articulate what outweighs it (rule 1.5.2). The engine does not overrule the proposal.'));
  }
  if (val('eot_flag_atypical_grant')) {
    flags.push(el('div', { class: 'notice flag-warn' },
      el('strong', {}, '⚠️ Atypical grant: '),
      'the profile matches the recurring refusal pattern (long delay, resting on rights or an explanation gap, no contributing ATO conduct) — Hunter Valley Developments v Cohen (1984) 3 FCR 344 on resting on rights. The reasons should articulate what displaces that pattern (rule 1.5.3). The engine does not overrule the proposal.'));
  }
  if (!flags.length) {
    flags.push(el('div', { class: 'notice flag-ok' },
      el('strong', {}, '✓ No flags. '),
      v.proposedOutcome === 'undecided'
        ? 'No outcome was proposed, so no sense check ran. The weighing of the factors is the decision maker’s (rule 1.4.1).'
        : 'The proposal raises no jurisdictional issue and is not atypical against the decided-case patterns. The decision — and its articulation — remain the decision maker’s (rules 1.4.1, 1.5.5).'));
  }
  if (val('eot_prompt_seek_further_information')) {
    flags.push(el('div', { class: 'notice' },
      el('strong', {}, 'ℹ️ Before deciding (PS LA 2003/7 [6]): '),
      'the request does not state the circumstances of the lateness fully and in detail (s 14ZW(3)). Give the taxpayer the opportunity to provide further information or a better explanation — the absence of a detailed explanation must not be the sole reason for refusing (rule 1.5.4).'));
  }
  box.replaceChildren(...flags);
}

function renderFactorTable(v, val) {
  const body = document.querySelector('#factor-table tbody');
  const rows = [
    el('tr', {},
      el('td', {}, 'Written request lodged with the objection'),
      el('td', {}, yesNo(v.reqWriting)),
      el('td', { class: 'muted' }, 's 14ZW(2) TAA 1953')),
    el('tr', {},
      el('td', {}, 'Circumstances stated fully and in detail'),
      el('td', {}, yesNo(v.reqFully)),
      el('td', { class: 'muted' }, 's 14ZW(3) TAA 1953; PS LA 2003/7 [6] — if not, invite further information (never a sole refusal ground)')),
    el('tr', {},
      el('td', {}, 'Length of delay (calculated by the engine)'),
      el('td', {}, `${val('eot_days_late')} days — ${BAND_LABELS[val('eot_delay_band')] || val('eot_delay_band')}`),
      el('td', { class: 'muted' }, 's 14ZW(1) TAA 1953; bands: PS LA 2003/7 patterns (never determinative)')),
    ...FACTORS.map(([id, variable, label]) => el('tr', {},
      el('td', {}, label),
      el('td', {}, yesNo(v[id])),
      el('td', { class: 'muted' }, 'PS LA 2003/7 — decision maker’s finding, recorded not inferred')),
    ),
  ];
  body.replaceChildren(...rows);
}

function yesNo(b) {
  return el('span', { class: `pill ${b ? 'yes' : 'no'}` }, b ? 'Yes' : 'No');
}

function renderCopilot(payload, out, periodYear) {
  document.getElementById('copilot-request').textContent = JSON.stringify(payload, null, 2);
  const computed = {};
  for (const name of OUTPUTS) computed[name] = out[name][periodYear];
  document.getElementById('copilot-response').textContent = JSON.stringify(computed, null, 2);
}

async function renderWhy() {
  const box = document.getElementById('why');
  box.replaceChildren(el('p', { class: 'loading' }, 'Loading rule references…'));
  const names = [
    'eot_discretion_engaged', 'eot_days_late', 'eot_delay_band',
    'eot_flag_discretion_not_engaged', 'eot_flag_atypical_refusal',
    'eot_flag_atypical_grant', 'eot_prompt_seek_further_information',
    'eot_art_review_available_if_refused',
  ];
  const metas = await Promise.all(names.map(variableMeta));
  box.replaceChildren(...metas.map((meta) => el('div', { class: 'why-item' },
    el('div', {},
      el('strong', {}, meta.description || meta.id), ' ',
      el('code', {}, meta.id)),
    meta.documentation ? el('p', { class: 'doc' }, meta.documentation.trim()) : null,
    meta.references?.length
      ? el('div', { class: 'refs' }, 'Reference: ', referenceLinks(meta.references))
      : null,
  )));
}
