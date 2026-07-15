/* Objection-rights calculator - a thin view over openfisca_rules/variables/objections.py.
 * Uses the shared apiGet/apiPost/el/referenceLinks/variableMeta/showError helpers from app.js.
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
  ['objection_extension_refusal', 'Refusal of a request for more time to object'],
];
const DECISION_LABELS = Object.fromEntries(DECISION_TYPES);

const TAXPAYER_LABELS = {
  individual: 'Individual',
  small_business_entity: 'Small business entity',
  other: 'Other (company, trust, partnership outside the SBE rules, super fund, ...)',
};

const PATHWAY_LABELS = {
  lodge_objection: 'Lodge an objection (within time)',
  objection_with_extension_request: 'Lodge an objection together with a written request for an extension of time',
  object_to_assessment_instead: 'Object against the relevant assessment instead',
  art_review: 'Apply to the Administrative Review Tribunal (ART) for review',
  complaint_or_judicial_review: 'No objection right - complaint (Tax Ombudsman) or judicial review',
};

const NO_DATE_TYPES = new Set(['gic_remission_decision', 'objection_extension_refusal']);
const TAXPAYER_KIND_TYPES = new Set([
  'income_tax_assessment', 'income_tax_amended_assessment',
  'private_ruling', 'excess_concessional_contributions_determination',
]);

const NOTICE_HELP = {
  income_tax_amended_assessment: 'The date on the AMENDED notice.',
  private_ruling: 'The date the ruling was given.',
  excess_concessional_contributions_determination: 'The date the DETERMINATION was given - not the related income tax assessment (asked separately below).',
};

const OUTPUTS = [
  'has_objection_right', 'objection_deadline', 'objection_in_time',
  'can_request_extension', 'recommended_pathway', 'has_standard_amendment_period',
];

const decisionSelect = document.getElementById('decisionType');
DECISION_TYPES.forEach(([value, label]) => decisionSelect.appendChild(el('option', { value }, label)));
decisionSelect.addEventListener('change', updateVisibleFields);

document.getElementById('lodgmentDate').value = new Date().toISOString().slice(0, 10);

updateVisibleFields();
document.getElementById('calc-btn').addEventListener('click', calculate);
document.getElementById('input-form').addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

function updateVisibleFields() {
  const type = decisionSelect.value;
  document.getElementById('f-noticeDate').hidden = NO_DATE_TYPES.has(type);
  document.getElementById('noticeDate-help').textContent =
    NOTICE_HELP[type] || 'The date the notice was given to you.';
  document.getElementById('f-taxpayerKind').hidden = !TAXPAYER_KIND_TYPES.has(type);
  document.getElementById('f-originalNoticeDate').hidden = type !== 'income_tax_amended_assessment';
  document.getElementById('f-hasAssessment').hidden = type !== 'private_ruling';
  document.getElementById('f-returnDueDate').hidden = type !== 'private_ruling';
  document.getElementById('f-relatedNoticeDate').hidden = type !== 'excess_concessional_contributions_determination';
  document.getElementById('f-sicFraction').hidden = type !== 'sic_remission_decision';
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

  if (TAXPAYER_KIND_TYPES.has(decisionType)) {
    v.taxpayerKind = document.getElementById('taxpayerKind').value;
  }
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
  for (const name of OUTPUTS) entity[name] = { [periodYear]: null };
  return entity;
}

async function calculate() {
  const errorBox = document.getElementById('error-box');
  errorBox.replaceChildren();
  let v;
  try { v = readForm(); } catch (err) { showError(errorBox, err); return; }

  const periodYear = String(new Date(v.noticeDate || v.lodgmentDate).getFullYear());
  const entity = buildEntity(v, periodYear);

  try {
    const res = await apiPost('calculate', { tax_entities: { tax_entity: entity } });
    const out = res.tax_entities.tax_entity;
    const val = (name) => out[name][periodYear];

    renderStats(val);
    renderPath(v, val);
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
  const hasRight = val('has_objection_right');
  const inTime = val('objection_in_time');
  const cards = document.getElementById('stat-cards');
  const nodes = [
    el('div', { class: hasRight ? 'stat good' : 'stat no-right' },
      el('div', { class: 'label' }, 'Objection right'),
      el('div', { class: 'value' }, hasRight ? 'Yes' : 'No')),
  ];
  if (hasRight) {
    nodes.push(el('div', { class: inTime ? 'stat good' : 'stat negative' },
      el('div', { class: 'label' }, 'Deadline'),
      el('div', { class: 'value' }, formatDate(val('objection_deadline'))),
      el('div', { class: 'bas' }, inTime ? 'You are in time' : 'This date has passed')));
  }
  nodes.push(el('div', { class: 'stat' },
    el('div', { class: 'label' }, 'Recommended pathway'),
    el('div', { class: 'value', style: 'font-size:1.1rem' }, PATHWAY_LABELS[val('recommended_pathway')] || val('recommended_pathway'))));
  cards.replaceChildren(...nodes);
}

function renderPath(v, val) {
  const items = [];
  items.push(['Decision type', DECISION_LABELS[v.decisionType]]);
  if (v.noticeDate) items.push(['Notice date', formatDate(v.noticeDate)]);
  if (v.taxpayerKind) items.push(['Taxpayer kind', TAXPAYER_LABELS[v.taxpayerKind]]);
  if (v.originalNoticeDate) items.push(['Original assessment notice date', formatDate(v.originalNoticeDate)]);
  if (v.hasAssessment !== undefined) items.push(['Assessment already made for the ruling period?', v.hasAssessment ? 'Yes' : 'No']);
  if (v.returnDueDate) items.push(['Return lodgment due date', formatDate(v.returnDueDate)]);
  if (v.relatedNoticeDate) items.push(['Related income tax assessment notice date', formatDate(v.relatedNoticeDate)]);
  if (v.sicFraction !== undefined) items.push(['Unremitted SIC (% of shortfall)', pct(v.sicFraction * 100)]);
  items.push(['Objection lodgment date', formatDate(v.lodgmentDate)]);

  const hasRight = val('has_objection_right');
  items.push(['Has objection right?', hasRight ? 'Yes' : 'No']);
  if (hasRight) {
    items.push(['Objection deadline', formatDate(val('objection_deadline'))]);
    const inTime = val('objection_in_time');
    items.push(['In time?', inTime ? 'Yes' : 'No']);
    if (!inTime) items.push(['Can request an extension?', val('can_request_extension') ? 'Yes' : 'No']);
  }
  items.push(['Recommended pathway', PATHWAY_LABELS[val('recommended_pathway')] || val('recommended_pathway')]);

  const tree = document.getElementById('path-tree');
  tree.replaceChildren(...items.map(([label, value]) => {
    const cls = value === 'Yes' ? 'outcome-yes' : value === 'No' ? 'outcome-no' : 'question';
    return el('li', {}, el('span', { class: `node ${cls}` },
      el('span', { class: 'tag' }, label), String(value)));
  }));
}

async function renderWhy() {
  const box = document.getElementById('why');
  box.replaceChildren(el('p', { class: 'loading' }, 'Loading rule references…'));
  const names = ['has_objection_right', 'objection_deadline', 'can_request_extension', 'recommended_pathway'];
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

/* ---------------------------------------------------------------------------
 * Eligibility help panel — a short "which decisions can I object to, and by
 * when?" summary generated live from the engine, the same way the standalone
 * eligibility page used to be. Reuses DECISION_TYPES / DECISION_LABELS /
 * PATHWAY_LABELS above. One batched /calculate across every decision type,
 * loaded lazily the first time the <details> is opened so the calculator's
 * own first paint isn't slowed by it.
 * ------------------------------------------------------------------------- */

/* Which conditional inputs each decision type needs (mirrors the form spec). */
const HELP_TYPE_INPUTS = {
  income_tax_assessment: { kind: true },
  income_tax_amended_assessment: { kind: true, original: true },
  private_ruling: { kind: true, returnDue: true, hasAssessment: false },
  gst_assessment: {},
  fbt_assessment: {},
  penalty_assessment: {},
  super_guarantee_assessment: {},
  excess_concessional_contributions_determination: { kind: true, related: true },
  sic_remission_decision: { sic: 0.25 },
  gic_remission_decision: { noNotice: true },
  objection_extension_refusal: { noNotice: true },
};

const HELP_Y = '2024';                 // enquiry period (only date-resolves parameters)
const HELP_REF_NOTICE = '2023-06-15';  // representative notice date
const HELP_LATE = '2099-01-01';        // a lodgment date guaranteed to be out of time
const HELP_OUTPUTS = [
  'has_objection_right', 'objection_deadline', 'recommended_pathway',
];

let HELP_PARAMS = { sixty: 60, shortYears: 2, fullYears: 4, sicThreshold: 0.2 };
let helpLoaded = false;

const helpDetails = document.getElementById('eligibility-help');
if (helpDetails) {
  helpDetails.addEventListener('toggle', () => {
    if (helpDetails.open && !helpLoaded) {
      helpLoaded = true;
      loadHelp().catch((err) => {
        helpLoaded = false;
        document.getElementById('help-note').hidden = true;
        showError(document.getElementById('error-box'), err);
      });
    }
  });
}

function helpToISO(raw) {
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? String(raw) : d.toISOString().slice(0, 10);
}

/* Same calendar day N years later; a 29 Feb anniversary falls back to 28 Feb —
 * matches _add_calendar_years in objections.py. */
function helpAddCalendarYears(iso, n) {
  const [y, m, day] = iso.split('-').map(Number);
  const probe = new Date(Date.UTC(y + n, m - 1, day));
  const dd = probe.getUTCMonth() === m - 1 ? day : 28;
  return `${y + n}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

/* Classify the span between a notice date and an engine-computed deadline as a
 * round number of years or days (the flat time limits). */
function helpHumanSpan(noticeISO, deadlineISO) {
  for (const y of [1, 2, 3, 4, 5]) {
    if (helpAddCalendarYears(noticeISO, y) === deadlineISO) return `${y} year${y > 1 ? 's' : ''}`;
  }
  const days = Math.round((new Date(deadlineISO) - new Date(noticeISO)) / 86400000);
  return `${days} days`;
}

function buildHelpInputs(type, lodgment, kind) {
  const c = HELP_TYPE_INPUTS[type];
  const e = { ato_decision_type: { [HELP_Y]: type }, objection_lodgment_date: { [HELP_Y]: lodgment } };
  if (!c.noNotice) e.decision_notice_date = { [HELP_Y]: HELP_REF_NOTICE };
  if (c.kind) e.taxpayer_kind = { [HELP_Y]: kind || 'individual' };
  if (c.original) e.original_assessment_notice_date = { [HELP_Y]: HELP_REF_NOTICE };
  if (c.returnDue) e.return_lodgment_due_date = { [HELP_Y]: HELP_REF_NOTICE };
  if ('hasAssessment' in c) e.has_assessment_for_ruling_period = { [HELP_Y]: c.hasAssessment };
  if (c.related) e.related_assessment_notice_date = { [HELP_Y]: HELP_REF_NOTICE };
  if ('sic' in c) e.sic_remaining_fraction_of_shortfall = { [HELP_Y]: c.sic };
  for (const o of HELP_OUTPUTS) e[o] = { [HELP_Y]: null };
  return e;
}

async function loadHelpParams() {
  const get = async (id, fallback) => {
    try {
      const p = await apiGet(`parameter/objections/${id}`);
      const dates = Object.keys(p.values).sort();
      return p.values[dates[dates.length - 1]];
    } catch { return fallback; }
  };
  const [sixty, shortY, fullY, sic] = await Promise.all([
    get('standard_period_days', 60),
    get('shortened_review_period_years', 2),
    get('full_review_period_years', 4),
    get('sic_remission_objection_threshold', 0.2),
  ]);
  HELP_PARAMS = { sixty, shortYears: shortY, fullYears: fullY, sicThreshold: sic };
}

/* Time-limit description. Flat limits are derived straight from the engine's
 * computed deadline; the three composite ("later of") limits are described with
 * the live parameter values, since a single span can't express them. */
function helpTimeLimitLabel(type, now, out) {
  const { sixty, shortYears, fullYears } = HELP_PARAMS;
  const dl = helpToISO(now.objection_deadline[HELP_Y]);
  switch (type) {
    case 'income_tax_assessment': {
      const ind = helpHumanSpan(HELP_REF_NOTICE, dl);
      const oth = helpHumanSpan(HELP_REF_NOTICE, helpToISO(out['income_tax_assessment|other'].objection_deadline[HELP_Y]));
      return `${ind} (individuals & small business entities) or ${oth} (other entities), from the date of the notice`;
    }
    case 'income_tax_amended_assessment':
      return `The later of: the original assessment's ${shortYears}-year (individuals & small business) or ${fullYears}-year period, or ${sixty} days after the amended notice`;
    case 'private_ruling':
      return `The later of: ${sixty} days after the ruling, or your ${shortYears}/${fullYears}-year period after the return's lodgment due date`;
    case 'excess_concessional_contributions_determination':
      return `The same ${shortYears}/${fullYears}-year period as objecting to your income tax assessment for that year`;
    case 'sic_remission_decision':
      return `${helpHumanSpan(HELP_REF_NOTICE, dl)} from the date of the notice (only when the unremitted SIC exceeds ${Math.round(HELP_PARAMS.sicThreshold * 100)}% of the shortfall)`;
    default:
      return `${helpHumanSpan(HELP_REF_NOTICE, dl)} from the date of the notice`;
  }
}

async function loadHelp() {
  await loadHelpParams();

  const entities = {};
  for (const [type] of DECISION_TYPES) {
    entities[`${type}|now`] = buildHelpInputs(type, HELP_REF_NOTICE);   // lodged on notice date -> in time
    entities[`${type}|late`] = buildHelpInputs(type, HELP_LATE);        // out of time
  }
  // Extra probe: the 4-year limb of income tax (other entities).
  entities['income_tax_assessment|other'] = buildHelpInputs('income_tax_assessment', HELP_REF_NOTICE, 'other');
  // A below-threshold SIC case (the conditional "no" branch).
  const sicBelow = buildHelpInputs('sic_remission_decision', HELP_REF_NOTICE);
  sicBelow.sic_remaining_fraction_of_shortfall = { [HELP_Y]: 0.1 };
  entities['sic_remission_decision|below'] = sicBelow;

  const res = await apiPost('calculate', { tax_entities: entities });
  const out = res.tax_entities;

  const records = {};
  for (const [type] of DECISION_TYPES) {
    const now = out[`${type}|now`];
    const late = out[`${type}|late`];
    const hasRight = now.has_objection_right[HELP_Y];
    records[type] = {
      hasRight,
      timeLimit: hasRight ? helpTimeLimitLabel(type, now, out) : null,
      pathway: PATHWAY_LABELS[now.recommended_pathway[HELP_Y]] || now.recommended_pathway[HELP_Y],
    };
  }
  const sicBelowPathway = out['sic_remission_decision|below'].recommended_pathway[HELP_Y];

  document.getElementById('help-note').textContent =
    'Every answer below was generated by the rules engine just now.';
  renderHelpCan(records);
  renderHelpCannot(records, sicBelowPathway);
  renderHelpLimits();
}

function renderHelpCan(records) {
  const body = document.querySelector('#help-can tbody');
  const rows = [];
  for (const [type] of DECISION_TYPES) {
    if (!records[type].hasRight) continue;
    rows.push(el('tr', {},
      el('td', {}, DECISION_LABELS[type]),
      el('td', {}, records[type].timeLimit)));
  }
  body.replaceChildren(...rows);
}

function renderHelpCannot(records, sicBelowPathway) {
  const body = document.querySelector('#help-cannot tbody');
  const rows = [];
  for (const [type] of DECISION_TYPES) {
    if (records[type].hasRight) continue;
    rows.push(el('tr', {},
      el('td', {}, DECISION_LABELS[type]),
      el('td', { class: 'muted' }, records[type].pathway)));
  }
  // The conditional SIC "no" branch: objectable only above the threshold.
  rows.push(el('tr', {},
    el('td', {}, `Refusal to remit SIC — when unremitted SIC is ${Math.round(HELP_PARAMS.sicThreshold * 100)}% of the shortfall or less`),
    el('td', { class: 'muted' }, PATHWAY_LABELS[sicBelowPathway] || sicBelowPathway)));
  body.replaceChildren(...rows);
}

function renderHelpLimits() {
  const box = document.getElementById('help-limits');
  const cards = [
    ['60 days', `${HELP_PARAMS.sixty} days`, 'Penalty & super guarantee assessments, objectable SIC remissions, and the short limb of the "later of" rules — from the date of the notice.'],
    ['Individuals & small business', `${HELP_PARAMS.shortYears} years`, 'The shortened review period for income tax and related decisions where the s 170(1) standard amendment period applies.'],
    ['Other entities', `${HELP_PARAMS.fullYears} years`, 'The full review period — income tax for other entities, and GST and FBT assessments, from the date of the notice.'],
    ['Out of time?', 's 14ZX', 'For most objectable decisions you can lodge late with a written request for more time. Private rulings are the exception.'],
  ];
  box.replaceChildren(...cards.map(([label, value, note]) =>
    el('div', { class: 'stat' },
      el('div', { class: 'label' }, label),
      el('div', { class: 'value' }, value),
      el('div', { class: 'bas' }, note))));
}
