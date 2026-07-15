/* Working Australians Tax Offset (WATO) page - three ways to use one ruleset,
 * wato.py:
 *   1. an eligibility QUESTIONNAIRE (one question at a time, engine verdict),
 *   2. an offset CALCULATOR with the phase-in curve drawn from a single batched
 *      /calculate sweep,
 *   3. SHOW THE WORKING - the /trace tree for the current facts, with citations.
 * No tax logic lives here: every verdict, amount and boundary comes from the
 * engine. Uses the shared apiGet/apiPost/el/aud/referenceLinks/variableMeta/
 * showError helpers from app.js.
 */

const OUTPUTS = [
  'wato_commenced_for_year', 'wato_labour_amounts', 'wato_net_labour_income',
  'wato_exceeds_tax_free_threshold', 'wato_entitled',
  'wato_tax_on_net_labour_income', 'wato_amount', 'wato_receives_full_amount',
];

/* Variables whose references the "why" panels cite, in reading order. */
const WHY_VARIABLES = [
  'wato_entitled', 'wato_commenced_for_year', 'wato_net_labour_income',
  'wato_exceeds_tax_free_threshold', 'wato_tax_on_net_labour_income', 'wato_amount',
];

const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const yearLabel = (y) => `${y}-${String(y + 1).slice(2)}`;

const errorBox = document.getElementById('error-box');

/* The facts shared by all three tools. The questionnaire and the calculator both
 * write here; the trace reads whatever was calculated last. */
const facts = {
  startYear: 2027, individual: true, resident: true,
  salary: 0, soleTrader: 0, psi: 0, ess: 0, labourHire: 0, deductions: 0,
};

function watoEntity(f, outputs) {
  const y = String(f.startYear);
  const entity = {
    wato_income_year_start_date: { [y]: `${f.startYear}-07-01` },
    wato_is_individual: { [y]: f.individual },
    wato_is_australian_resident: { [y]: f.resident },
    wato_salary_and_wages: { [y]: f.salary },
    wato_sole_trader_business_income: { [y]: f.soleTrader },
    wato_personal_services_income: { [y]: f.psi },
    wato_ess_discounts: { [y]: f.ess },
    wato_labour_hire_payments: { [y]: f.labourHire },
    wato_labour_deductions: { [y]: f.deductions },
  };
  for (const name of outputs) entity[name] = { [y]: null };
  return entity;
}

async function calculateFacts(f) {
  const y = String(f.startYear);
  const res = await apiPost('calculate', { tax_entities: { tax_entity: watoEntity(f, OUTPUTS) } });
  const out = res.tax_entities.tax_entity;
  return (name) => out[name][y];
}

/* ===================================================== 1 - eligibility questionnaire */

/* Question flow mirrors `Working Australians Tax Offset Form Questions.md` (Q1-Q5).
 * Every step only COLLECTS a fact; the verdict is one engine call at the end. */
const STEPS = [
  {
    id: 'year',
    ask: 'Which income year are you asking about?',
    help: 'The offset is legislated for the 2027-28 income year and later — but answer for any year and the engine will apply the commencement rule itself.',
    kind: 'year',
  },
  {
    id: 'individual',
    ask: 'Are you asking about a person (including a sole trader)?',
    help: 'Only an individual can be entitled — a company, trust or partnership cannot (ruleset rule 1.1.1).',
    kind: 'yesno',
    yes: 'Yes — a person', no: 'No — a company, trust or partnership',
  },
  {
    id: 'resident',
    ask: 'Were you an Australian resident for tax purposes at any time during that year?',
    help: 'Part-year residency is enough (ruleset rule 1.1.2).',
    kind: 'yesno',
    yes: 'Yes — for at least part of the year', no: 'No — non-resident all year',
  },
  {
    id: 'income',
    ask: 'What income from work do you expect for that year?',
    help: 'Enter 0 for any that don’t apply. Super pensions, rent, dividends, interest and partnership or trust distributions are NOT income from work — leave them out.',
    kind: 'money',
    fields: [
      ['salary', 'Salary, wages and allowances (A$)'],
      ['soleTrader', 'Sole-trader business income (A$)'],
      ['psi', 'Personal services income (A$)'],
      ['ess', 'Employee share scheme discounts (A$)'],
      ['labourHire', 'Labour-hire arrangement payments (A$)'],
    ],
  },
  {
    id: 'deductions',
    ask: 'What deductions relate to that work income?',
    help: 'Work-related expenses (including the $1,000 instant deduction if you use it), sole-trader business outgoings and work-use depreciation. Enter 0 if none.',
    kind: 'money',
    fields: [['deductions', 'Deductions attributable to work income (A$)']],
  },
];

let stepIndex = 0;

function renderStep() {
  const box = document.getElementById('quiz');
  const step = STEPS[stepIndex];
  const children = [
    el('p', { class: 'muted', style: 'margin:0' }, `Question ${stepIndex + 1} of ${STEPS.length}`),
    el('h3', { style: 'margin:0.35rem 0 0.3rem' }, step.ask),
    el('p', { class: 'help', style: 'margin:0 0 0.8rem' }, step.help),
  ];

  if (step.kind === 'year') {
    const select = el('select', { id: 'quiz-year', style: 'max-width:16rem' });
    for (const y of YEARS) {
      select.appendChild(el('option', { value: String(y) }, `${yearLabel(y)} (starts 1 July ${y})`));
    }
    select.value = String(facts.startYear);
    children.push(el('div', { class: 'field' }, select));
    children.push(el('div', { class: 'actions' },
      quizButton('Next', () => { facts.startYear = Number(select.value); advance(); })));
  } else if (step.kind === 'yesno') {
    children.push(el('div', { class: 'actions' },
      quizButton(step.yes, () => { facts[step.id] = true; advance(); }),
      quizButton(step.no, () => { facts[step.id] = false; advance(); }, true)));
  } else {
    const form = el('form', { class: 'inputs' });
    for (const [key, label] of step.fields) {
      const input = el('input', { id: `quiz-${key}`, type: 'number', min: '0', step: '1', value: String(facts[key]) });
      form.appendChild(el('div', { class: 'field' }, el('label', { for: `quiz-${key}` }, label), input));
    }
    children.push(form);
    children.push(el('div', { class: 'actions' }, quizButton('Next', () => {
      for (const [key] of step.fields) {
        const n = Number(document.getElementById(`quiz-${key}`).value);
        facts[key] = Number.isFinite(n) && n > 0 ? n : 0;
      }
      advance();
    })));
  }

  if (stepIndex > 0) {
    children.at(-1).appendChild(el('button', {
      type: 'button', class: 'secondary', id: 'quiz-back',
    }, 'Back'));
  }
  box.replaceChildren(...children);
  document.getElementById('quiz-back')?.addEventListener('click', () => {
    stepIndex -= 1;
    renderStep();
  });
}

function quizButton(label, onClick, secondary = false) {
  const b = el('button', { type: 'button', class: secondary ? 'secondary' : '' }, label);
  b.addEventListener('click', onClick);
  return b;
}

function advance() {
  if (stepIndex < STEPS.length - 1) {
    stepIndex += 1;
    renderStep();
  } else {
    renderVerdict();
  }
}

async function renderVerdict() {
  const box = document.getElementById('quiz');
  box.replaceChildren(el('p', { class: 'loading' }, 'Asking the rules engine…'));
  try {
    const val = await calculateFacts(facts);
    const entitled = val('wato_entitled');
    const amount = val('wato_amount');
    const full = val('wato_receives_full_amount');

    const gate = (ok, text) => el('li', {},
      el('span', { class: `pill ${ok ? 'yes' : 'no'}` }, ok ? 'met' : 'not met'), ' ', text);
    const gates = el('ul', { style: 'list-style:none;padding:0;margin:0.4rem 0;display:grid;gap:0.35rem' },
      gate(val('wato_commenced_for_year'), `Income year ${yearLabel(facts.startYear)} is 2027-28 or later (rule 1.1.4)`),
      gate(facts.individual, 'You are an individual (rule 1.1.1)'),
      gate(facts.resident, 'Australian resident at some time in the year (rule 1.1.2)'),
      gate(val('wato_exceeds_tax_free_threshold'),
        `Net labour income of ${aud(val('wato_net_labour_income'))} exceeds the $18,200 tax-free threshold (rule 1.1.3)`));

    const headline = entitled
      ? `Yes — you are entitled to a ${aud(amount)} offset for ${yearLabel(facts.startYear)}`
      : `No — you are not entitled to the offset for ${yearLabel(facts.startYear)}`;
    const detail = !entitled
      ? 'Every condition below must be met. The ones marked "not met" are why the engine says no.'
      : full
        ? 'That is the full offset — your net labour income is past the phase-in band, like about 97% of eligible workers.'
        : `That is a partial offset: the amount is capped at the basic tax on your net labour income alone — 14 cents per dollar above $18,200 (${aud(val('wato_tax_on_net_labour_income'))}).`;

    box.replaceChildren(
      el('div', { class: `stat ${entitled ? 'good' : 'no-right'}`, style: 'margin-bottom:0.9rem' },
        el('div', { class: 'label' }, 'The engine’s verdict'),
        el('div', { class: 'value' }, headline),
        el('div', { class: 'bas' }, detail)),
      el('h3', { style: 'margin:0.6rem 0 0' }, 'The four entitlement gates (s 61-155(1))'),
      gates,
      el('p', { class: 'muted', style: 'margin:0.6rem 0' },
        'The offset is non-refundable and applied automatically when your return is assessed — there is nothing to claim (rules 1.3.3-1.3.4).'),
      el('div', { class: 'actions' },
        quizButton('Start again', () => { stepIndex = 0; renderStep(); }, true),
        quizButton('Show the working for these answers', () => {
          document.getElementById('trace-section').scrollIntoView({ behavior: 'smooth' });
          renderTrace();
        }, true)),
      whyPanel('quiz-why'),
    );
    fillWhy('quiz-why');
  } catch (err) {
    showError(errorBox, err);
    box.replaceChildren(quizButton('Start again', () => { stepIndex = 0; renderStep(); }, true));
  }
}

/* ---------------- shared "why" citations panel (rule metadata, not page text) */

function whyPanel(id) {
  return el('details', { class: 'help-section', style: 'margin:1rem 0 0' },
    el('summary', {}, 'Why? — the rules behind this answer'),
    el('div', { class: 'help-body', id }, el('p', { class: 'loading' }, 'Loading rule references…')));
}

async function fillWhy(id) {
  try {
    const metas = await Promise.all(WHY_VARIABLES.map((n) => variableMeta(n)));
    document.getElementById(id).replaceChildren(...metas.map((m) => el('div', { class: 'why-item' },
      el('strong', {}, m.description || m.id), ' ', el('code', {}, m.id),
      el('div', { class: 'doc' }, (m.documentation || '').trim()),
      el('div', { class: 'refs' }, 'Reference: ', referenceLinks(m.reference)))));
  } catch (err) {
    document.getElementById(id).replaceChildren(el('p', { class: 'muted' }, String(err.message || err)));
  }
}

/* ===================================================== 2 - calculator + phase-in chart */

const SWEEP_FROM = 15000;
const SWEEP_TO = 25000;
const SWEEP_STEP = 250;

function readCalcForm() {
  facts.startYear = Number(document.getElementById('calc-year').value);
  facts.salary = Number(document.getElementById('calc-income').value) || 0;
  facts.soleTrader = 0; facts.psi = 0; facts.ess = 0; facts.labourHire = 0;
  facts.deductions = Number(document.getElementById('calc-deductions').value) || 0;
  facts.individual = true; facts.resident = true;
}

async function runCalculator() {
  readCalcForm();
  errorBox.replaceChildren();
  const results = document.getElementById('calc-results');
  results.hidden = false;
  document.getElementById('calc-cards').replaceChildren(el('p', { class: 'loading' }, 'Calculating…'));
  try {
    /* One batched /calculate: the user's facts plus the whole phase-in sweep.
     * The sweep always uses a commenced year, so for a pre-commencement enquiry
     * the curve still shows the legislated settings (the note says so). */
    const y = String(facts.startYear);
    const sweepYear = Math.max(facts.startYear, 2027);
    const entities = { me: watoEntity(facts, OUTPUTS) };
    for (let inc = SWEEP_FROM; inc <= SWEEP_TO; inc += SWEEP_STEP) {
      entities[`s${inc}`] = watoEntity(
        { ...facts, startYear: sweepYear, salary: inc, soleTrader: 0, psi: 0, ess: 0, labourHire: 0, deductions: 0 },
        ['wato_amount']);
    }
    const res = await apiPost('calculate', { tax_entities: entities });
    const me = res.tax_entities.me;
    const val = (name) => me[name][y];

    const entitled = val('wato_entitled');
    const full = val('wato_receives_full_amount');
    document.getElementById('calc-cards').replaceChildren(
      el('div', { class: 'stat' },
        el('div', { class: 'label' }, 'Net labour income'),
        el('div', { class: 'value' }, aud(val('wato_net_labour_income'))),
        el('div', { class: 'bas' }, 'labour amounts minus labour deductions (rule 1.2.3)')),
      el('div', { class: `stat ${entitled ? 'good' : 'no-right'}` },
        el('div', { class: 'label' }, `WATO for ${yearLabel(facts.startYear)}`),
        el('div', { class: 'value' }, aud(val('wato_amount'))),
        el('div', { class: 'bas' }, entitled
          ? (full ? 'the full offset' : 'partial — inside the phase-in band')
          : 'not entitled (see the questionnaire for the four gates)')),
      el('div', { class: 'stat' },
        el('div', { class: 'label' }, 'Basic tax on net labour income alone'),
        el('div', { class: 'value' }, aud(val('wato_tax_on_net_labour_income'))),
        el('div', { class: 'bas' }, 'the s 61-160(b) cap the offset can never exceed')),
    );

    const points = [];
    for (let inc = SWEEP_FROM; inc <= SWEEP_TO; inc += SWEEP_STEP) {
      points.push({ income: inc, offset: res.tax_entities[`s${inc}`].wato_amount[String(sweepYear)] });
    }
    drawPhaseChart(points, { income: val('wato_net_labour_income'), offset: val('wato_amount') },
      val('wato_commenced_for_year'));
    fillWhy('calc-why');
  } catch (err) {
    results.hidden = true;
    showError(errorBox, err);
  }
}

/* The phase-in curve. Single series in the site accent; the two legislated
 * boundaries are direct-labelled; hover shows income -> offset; the table view
 * underneath carries the same points for non-visual reading. */
function drawPhaseChart(points, user, commenced) {
  const box = document.getElementById('phase-chart');
  const W = 720, H = 280, M = { top: 28, right: 24, bottom: 40, left: 56 };
  const maxY = 275;
  const x = (inc) => M.left + ((inc - SWEEP_FROM) / (SWEEP_TO - SWEEP_FROM)) * (W - M.left - M.right);
  const yPos = (v) => H - M.bottom - (v / maxY) * (H - M.top - M.bottom);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'phase-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label',
    'Line chart of the offset amount against net labour income: nil to $18,200, rising at 14 cents per dollar to the full $250 at about $19,986, flat after that.');
  const S = 'http://www.w3.org/2000/svg';
  const sEl = (tag, attrs, text) => {
    const n = document.createElementNS(S, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text != null) n.textContent = text;
    svg.appendChild(n);
    return n;
  };

  for (let v = 0; v <= 250; v += 50) {
    sEl('line', { x1: M.left, y1: yPos(v), x2: W - M.right, y2: yPos(v), class: 'grid' });
    sEl('text', { x: M.left - 8, y: yPos(v) + 4, class: 'ylab' }, `$${v}`);
  }
  for (let inc = 16000; inc <= 24000; inc += 2000) {
    sEl('text', { x: x(inc), y: H - M.bottom + 18, class: 'xlab' }, `$${(inc / 1000)}k`);
  }
  sEl('text', { x: (M.left + W - M.right) / 2, y: H - 6, class: 'xlab' }, 'Net labour income (A$)');

  const lineD = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.income).toFixed(1)},${yPos(p.offset).toFixed(1)}`).join(' ');
  sEl('path', {
    d: `${lineD} L${x(SWEEP_TO)},${yPos(0)} L${x(SWEEP_FROM)},${yPos(0)} Z`, class: 'area',
  });
  sEl('path', { d: lineD, class: 'line' });

  /* the two legislated boundaries, direct-labelled. The full-offset boundary is
   * derived from the engine's own points: extend the last two uncapped points'
   * slope to where it meets the cap (the sweep grid is coarser than the kink). */
  sEl('line', { x1: x(18200), y1: yPos(0), x2: x(18200), y2: M.top, class: 'boundary' });
  sEl('text', { x: x(18200), y: M.top - 10, class: 'blab' }, 'tax-free threshold $18,200');
  const cap = Math.max(...points.map((p) => p.offset));
  const uncapped = points.filter((p) => p.offset > 0 && p.offset < cap - 0.005);
  const capped = cap > 0 ? points.find((p) => p.offset >= cap - 0.005) : null;
  let fullFrom = capped ? capped.income : null;
  if (uncapped.length >= 2 && capped) {
    const [p0, p1] = uncapped.slice(-2);
    const slope = (p1.offset - p0.offset) / (p1.income - p0.income);
    if (slope > 0) fullFrom = Math.round(p1.income + (cap - p1.offset) / slope);
  }
  if (fullFrom != null) {
    sEl('line', { x1: x(fullFrom), y1: yPos(0), x2: x(fullFrom), y2: M.top + 14, class: 'boundary' });
    sEl('text', { x: x(fullFrom) + 4, y: M.top + 10, class: 'blab', 'text-anchor': 'start' },
      `full $${cap.toFixed(0)} from ≈$${fullFrom.toLocaleString('en-AU')}`);
  }

  /* the user's own position */
  if (commenced && user.income >= SWEEP_FROM && user.income <= SWEEP_TO) {
    sEl('circle', { cx: x(user.income), cy: yPos(user.offset), r: 6, class: 'you' });
    sEl('text', {
      x: x(user.income), y: yPos(user.offset) - 12, class: 'youlab',
      'text-anchor': user.income > SWEEP_TO - 1500 ? 'end' : 'middle',
    }, `you: ${aud(user.offset)}`);
  }

  /* hover crosshair + tooltip */
  const cross = sEl('line', { x1: 0, y1: M.top, x2: 0, y2: yPos(0), class: 'boundary', visibility: 'hidden' });
  const dot = sEl('circle', { r: 4.5, class: 'hoverpt', visibility: 'hidden' });
  const tip = el('div', { class: 'phase-tip', hidden: '' });
  svg.addEventListener('pointermove', (ev) => {
    const rect = svg.getBoundingClientRect();
    const frac = (ev.clientX - rect.left) / rect.width;
    const inc = Math.round((SWEEP_FROM + frac * (SWEEP_TO - SWEEP_FROM)) / SWEEP_STEP) * SWEEP_STEP;
    const p = points.find((q) => q.income === Math.min(SWEEP_TO, Math.max(SWEEP_FROM, inc)));
    if (!p) return;
    cross.setAttribute('x1', x(p.income)); cross.setAttribute('x2', x(p.income));
    cross.setAttribute('visibility', 'visible');
    dot.setAttribute('cx', x(p.income)); dot.setAttribute('cy', yPos(p.offset));
    dot.setAttribute('visibility', 'visible');
    tip.hidden = false;
    tip.textContent = `net labour income $${p.income.toLocaleString('en-AU')} → offset ${aud(p.offset)}`;
    tip.style.left = `${Math.min(85, Math.max(0, frac * 100))}%`;
  });
  svg.addEventListener('pointerleave', () => {
    cross.setAttribute('visibility', 'hidden');
    dot.setAttribute('visibility', 'hidden');
    tip.hidden = true;
  });

  const note = commenced ? null : el('p', { class: 'muted' },
    `Note: for ${yearLabel(facts.startYear)} the offset has not commenced, so YOUR amount is nil regardless of income — the curve shows the legislated 2027-28 settings.`);

  const rows = points.filter((p) => p.income % 1000 === 0);
  const table = el('details', { class: 'help-section', style: 'margin:0.6rem 0 0' },
    el('summary', {}, 'The same curve as a table'),
    el('div', { class: 'table-scroll' }, el('table', {},
      el('thead', {}, el('tr', {}, el('th', {}, 'Net labour income'), el('th', { class: 'num' }, 'WATO'))),
      el('tbody', {}, rows.map((p) => el('tr', {},
        el('td', {}, aud(p.income)), el('td', { class: 'num' }, aud(p.offset))))))));

  box.replaceChildren(...[el('div', { class: 'phase-wrap' }, svg, tip), note, table].filter(Boolean));
}

/* ===================================================== 3 - show the working (/trace) */

let variablesIndex = null;

async function renderTrace() {
  const box = document.getElementById('trace');
  box.replaceChildren(el('p', { class: 'loading' }, 'Tracing the calculation…'));
  try {
    const y = String(facts.startYear);
    if (!variablesIndex) variablesIndex = await apiGet('variables');
    const entity = watoEntity(facts, ['wato_entitled', 'wato_amount']);
    const res = await apiPost('trace', { tax_entities: { tax_entity: entity } });
    box.replaceChildren(
      el('p', { class: 'muted' },
        `Tracing wato_amount for ${yearLabel(facts.startYear)} with the facts entered above ` +
        '(from whichever of the two tools you used last).'),
      ...res.requestedCalculations
        .filter((key) => key.startsWith('wato_amount') || key.startsWith('wato_entitled'))
        .map((key) => renderNode(key, res.trace, true)));
  } catch (err) {
    showError(errorBox, err);
    box.replaceChildren();
  }
}

function renderNode(key, trace, open) {
  const m = key.match(/^(.*)<(.*)>$/);
  const name = m ? m[1] : key;
  const period = m ? m[2] : '';
  const node = trace[key] || { value: ['?'], dependencies: [], parameters: {} };
  const label = variablesIndex?.[name]?.description || '';
  const isInput = (node.dependencies || []).length === 0;

  const summary = el('summary', {},
    el('code', {}, name), ` ⟨${period}⟩ = `,
    el('span', { class: 'val' }, formatTraceValue(name, node.value?.[0])),
    label ? el('span', { class: 'meta' }, ` — ${label}`) : null,
    el('span', { class: isInput ? 'pill input' : 'pill formula' }, isInput ? 'your input' : 'rule'));

  const children = [];
  for (const [pKey, pVal] of Object.entries(node.parameters || {})) {
    const pm = pKey.match(/^\.?(.*)<(.*)>$/);
    children.push(el('div', { class: 'meta' },
      el('span', { class: 'pill' }, 'parameter'), ' ',
      el('code', {}, pm ? pm[1] : pKey), ` (as at ${pm ? pm[2] : '?'}) = `,
      el('strong', {}, String(pVal))));
  }
  for (const dep of node.dependencies || []) children.push(renderNode(dep, trace, false));

  const details = el('details', {}, summary, ...children);
  if (open) details.setAttribute('open', '');
  return details;
}

function formatTraceValue(name, value) {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value !== 'number') return String(value);
  return aud(value);
}

/* ===================================================== boot */

document.addEventListener('DOMContentLoaded', () => {
  const calcYear = document.getElementById('calc-year');
  for (const y of YEARS) calcYear.appendChild(el('option', { value: String(y) }, yearLabel(y)));
  calcYear.value = '2027';
  document.getElementById('calc-btn').addEventListener('click', runCalculator);
  document.getElementById('trace-btn').addEventListener('click', renderTrace);
  renderStep();
});
