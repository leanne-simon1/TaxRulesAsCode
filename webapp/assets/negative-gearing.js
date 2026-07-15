/* Negative gearing focus page - four views over openfisca_rules/variables/
 * negative_gearing.py:
 *   1. grandfathering timeline  - where an acquisition falls against the two
 *      reform dates, with the engine's verdict for the chosen income year
 *   2. before/after comparison  - the same property facts run for a pre-reform
 *      and a post-reform income year in one batched /calculate
 *   3. portfolio waterfall      - one entity per property in a batched call,
 *      then the engine's s 26-155(6) waterfall over the aggregate
 *   4. chat panel               - a scripted slot-filler that collects the
 *      facts, calls the engine, and cites the rules' own references
 *
 * No tax logic lives here: every verdict, dollar figure and citation is an
 * engine output or rule metadata. Client-side arithmetic is limited to summing
 * per-property engine results for the ruleset's documented aggregate input and
 * laying out the waterfall bars. Uses the shared apiPost/el/aud/variableMeta/
 * referenceLinks/showError helpers from app.js.
 */

const ANNOUNCEMENT_ISO = '2026-05-12';   // Budget announcement (grandfathering cut-off)
const REFORM_START_ISO = '2027-07-01';   // first income year the quarantine applies to

const NG_ENTITY_KINDS = {
  individual: 'Individual',
  smsf: 'Self managed super fund',
  other_complying_super_fund: 'Other complying super fund',
  widely_held_trust: 'Widely held trust (e.g. MIT)',
  other_trust: 'Other trust',
  company: 'Company',
};

/* Income years offered everywhere on this page: value = 1 July start date. */
const INCOME_YEARS = [];
for (let y = 2025; y <= 2032; y++) {
  INCOME_YEARS.push({ start: `${y}-07-01`, label: `${y}-${String(y + 1).slice(2)}` });
}

function fillEntitySelect(id) {
  const sel = document.getElementById(id);
  for (const [value, label] of Object.entries(NG_ENTITY_KINDS)) {
    sel.appendChild(el('option', { value }, label));
  }
}

function fillYearSelect(id, defaultStart) {
  const sel = document.getElementById(id);
  for (const y of INCOME_YEARS) {
    sel.appendChild(el('option', { value: y.start }, `${y.label} income year`));
  }
  sel.value = defaultStart;
}

/* Period key for a YEAR-period variable: the calendar year of the 1 July start. */
function periodKey(incomeYearStart) { return incomeYearStart.slice(0, 4); }

/* Build one tax_entities entry from a facts object; null-request the outputs. */
function ngEntity(facts, outputs) {
  const y = periodKey(facts.ng_income_year_start_date);
  const entity = {};
  for (const [name, value] of Object.entries(facts)) entity[name] = { [y]: value };
  for (const name of outputs) entity[name] = { [y]: null };
  return entity;
}

function entityValue(res, key, name, incomeYearStart) {
  return res.tax_entities[key][name][periodKey(incomeYearStart)];
}

/* ====================================================== 1 · grandfathering timeline */

const TL_OUTPUTS = [
  'ng_reform_commenced_for_year', 'ng_grandfathered_by_acquisition_date',
  'ng_dwelling_exempt_from_quarantine', 'ng_exempt_from_quarantine',
  'ng_quarantine_applies',
];

function tlInit() {
  fillEntitySelect('tl-entity');
  fillYearSelect('tl-year', '2027-07-01');
  let timer;
  for (const id of ['tl-acquired', 'tl-year', 'tl-entity', 'tl-newbuild', 'tl-minister']) {
    document.getElementById(id).addEventListener('change', () => {
      clearTimeout(timer);
      timer = setTimeout(tlUpdate, 200);
    });
  }
  tlUpdate();
}

async function tlUpdate() {
  const acquired = document.getElementById('tl-acquired').value;
  const yearStart = document.getElementById('tl-year').value;
  tlDrawChart(acquired, yearStart);

  const verdictBox = document.getElementById('tl-verdict');
  if (!acquired) {
    verdictBox.replaceChildren(el('p', { class: 'muted' }, 'Enter the contract date to get a verdict.'));
    return;
  }
  verdictBox.replaceChildren(el('p', { class: 'loading' }, 'Asking the rules engine…'));

  const facts = {
    ng_entity_kind: document.getElementById('tl-entity').value,
    ng_ownership_interest_acquired_date: acquired,
    ng_income_year_start_date: yearStart,
    ng_is_new_residential_dwelling: document.getElementById('tl-newbuild').checked,
    ng_is_minister_determined_exempt: document.getElementById('tl-minister').checked,
  };
  try {
    const res = await apiPost('calculate', { tax_entities: { dwelling: ngEntity(facts, TL_OUTPUTS) } });
    const val = (name) => entityValue(res, 'dwelling', name, yearStart);
    verdictBox.replaceChildren(...tlVerdict(val, yearStart));
  } catch (err) {
    showError(verdictBox, err);
  }
}

function tlVerdict(val, yearStart) {
  const yearLabel = INCOME_YEARS.find((y) => y.start === yearStart)?.label || yearStart;
  const quarantined = val('ng_quarantine_applies');

  const reasons = [];
  if (!val('ng_reform_commenced_for_year')) {
    reasons.push(`The quarantine only applies from the 2027-28 income year — ${yearLabel} is before that.`);
  }
  if (val('ng_grandfathered_by_acquisition_date')) {
    reasons.push('Your interest was acquired before 7:30pm AEST 12 May 2026, so it is grandfathered — current rules keep applying for as long as you hold it.');
  } else if (val('ng_reform_commenced_for_year')) {
    reasons.push('Your interest was acquired on or after the 12 May 2026 announcement, so it is not grandfathered.');
  }
  if (val('ng_dwelling_exempt_from_quarantine') && !val('ng_grandfathered_by_acquisition_date')) {
    reasons.push('The dwelling itself is exempt (new residential dwelling or Minister-determined exemption).');
  }
  if (val('ng_exempt_from_quarantine')) {
    reasons.push('Your entity kind (super fund / widely held trust) is excepted from the quarantine.');
  }

  const stat = el('div', { class: `stat ${quarantined ? 'negative' : 'good'}`, style: 'margin-top:1rem' },
    el('div', { class: 'label' }, `Engine verdict for the ${yearLabel} income year`),
    el('div', { class: 'value' }, quarantined ? 'Quarantined' : 'Not quarantined'),
    el('div', { class: 'bas' }, quarantined
      ? 'A net rental loss this year cannot offset your salary or other income — it is worked down the s 26-155(6) waterfall instead.'
      : 'A net rental loss this year remains deductible against your other income (ordinary negative gearing).'));

  const why = el('div', { id: 'tl-why' });
  renderWhy(why, quarantined
    ? ['ng_quarantine_applies', 'ng_grandfathered_by_acquisition_date']
    : ['ng_grandfathered_by_acquisition_date', 'ng_negative_gearing_offset_available']);

  return [stat, el('ul', {}, reasons.map((r) => el('li', {}, r))),
    el('details', { class: 'help-section' }, el('summary', {}, 'Why? — the rules behind this verdict'),
      el('div', { class: 'help-body' }, why))];
}

/* The timeline itself is a schematic (dates are fixed by the Act), so it is drawn
 * client-side; only the verdict panel above consults the engine. */
function tlDrawChart(acquiredISO, yearStart) {
  const t0 = Date.parse('2025-01-01');
  const t1 = Date.parse('2032-06-30');
  const ann = Date.parse(ANNOUNCEMENT_ISO);
  const reform = Date.parse(REFORM_START_ISO);
  const W = 680, H = 132, padL = 12, padR = 12, axisY = 78;
  const x = (t) => padL + ((t - t0) / (t1 - t0)) * (W - padL - padR);

  const parts = [];
  // Era bands along the axis: grandfathered acquisitions vs quarantine candidates.
  parts.push(`<rect x="${x(t0)}" y="${axisY - 10}" width="${x(ann) - x(t0) - 1}" height="20" rx="4" class="tl-band tl-band-good"/>`);
  parts.push(`<rect x="${x(ann) + 1}" y="${axisY - 10}" width="${x(t1) - x(ann) - 1}" height="20" rx="4" class="tl-band tl-band-warn"/>`);
  parts.push(`<text x="${(x(t0) + x(ann)) / 2}" y="${axisY + 4}" class="tl-bandlab">acquired here → grandfathered</text>`);
  parts.push(`<text x="${(x(ann) + x(t1)) / 2}" y="${axisY + 4}" class="tl-bandlab">acquired here → quarantine candidate</text>`);

  // Milestones.
  parts.push(`<line x1="${x(ann)}" y1="20" x2="${x(ann)}" y2="${axisY + 14}" class="tl-milestone"/>`);
  parts.push(`<text x="${x(ann)}" y="14" class="tl-mslab">12 May 2026 · announcement</text>`);
  parts.push(`<line x1="${x(reform)}" y1="34" x2="${x(reform)}" y2="${axisY + 14}" class="tl-milestone"/>`);
  parts.push(`<text x="${x(reform)}" y="30" class="tl-mslab">1 Jul 2027 · quarantine commences</text>`);

  // Enquiry income year bracket under the axis.
  const ys = Date.parse(yearStart);
  const ye = Date.parse(`${Number(yearStart.slice(0, 4)) + 1}-06-30`);
  parts.push(`<rect x="${x(ys)}" y="${axisY + 18}" width="${x(ye) - x(ys)}" height="7" rx="3" class="tl-yearband"/>`);
  parts.push(`<text x="${(x(ys) + x(ye)) / 2}" y="${axisY + 38}" class="tl-yearlab">income year asked about</text>`);

  // Acquisition marker.
  if (acquiredISO) {
    const ta = Math.min(Math.max(Date.parse(acquiredISO), t0), t1);
    parts.push(`<circle cx="${x(ta)}" cy="${axisY}" r="7" class="tl-marker"/>`);
    parts.push(`<text x="${x(ta)}" y="${axisY - 18}" class="tl-marklab">you acquire</text>`);
  }

  // Year ticks.
  for (let y = 2025; y <= 2032; y++) {
    const t = Date.parse(`${y}-01-01`);
    parts.push(`<line x1="${x(t)}" y1="${axisY + 10}" x2="${x(t)}" y2="${axisY + 14}" class="tl-tick"/>`);
    parts.push(`<text x="${x(t)}" y="${axisY + 28}" class="tl-ticklab">${y}</text>`);
  }

  document.getElementById('tl-chart').innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" class="tl-svg" role="img" aria-label="Reform timeline">${parts.join('')}</svg>`;
}

/* ====================================================== 2 · before / after */

const BA_OUTPUTS = [
  'ng_total_deductible_expenses', 'ng_net_rental_result', 'ng_quarantine_applies',
  'ng_negative_gearing_offset_available', 'ng_current_year_quarantined_excess',
  'ng_quarantined_amount_carried_forward', 'ng_grandfathered_by_acquisition_date',
  'ng_dwelling_exempt_from_quarantine', 'ng_exempt_from_quarantine',
  'ng_capital_works_deduction',
];

function baInit() {
  fillEntitySelect('ba-entity');
  fillYearSelect('ba-year', '2027-07-01');
  document.getElementById('ba-btn').addEventListener('click', baCalculate);
}

function baFacts(incomeYearStart) {
  const num = (id) => Number(document.getElementById(id).value) || 0;
  return {
    ng_entity_kind: document.getElementById('ba-entity').value,
    ng_ownership_interest_acquired_date: document.getElementById('ba-acquired').value,
    ng_income_year_start_date: incomeYearStart,
    ng_is_new_residential_dwelling: document.getElementById('ba-newbuild').checked,
    ng_is_minister_determined_exempt: document.getElementById('ba-minister').checked,
    ng_ownership_percentage: num('ba-share') / 100,
    ng_rental_income: num('ba-rent'),
    ng_interest_and_ownership_expenses: num('ba-interest'),
    ng_repairs_expense: num('ba-repairs'),
    ng_borrowing_expense_this_year: num('ba-borrowing'),
    ng_construction_expenditure: num('ba-works'),
  };
}

async function baCalculate() {
  const errorBox = document.getElementById('error-box');
  errorBox.replaceChildren();
  const acquired = document.getElementById('ba-acquired').value;
  if (!acquired) { showError(errorBox, new Error('Please enter the acquisition contract date.')); return; }

  const beforeStart = '2026-07-01';
  const afterStart = document.getElementById('ba-year').value;
  try {
    const res = await apiPost('calculate', {
      tax_entities: {
        before: ngEntity(baFacts(beforeStart), BA_OUTPUTS),
        after: ngEntity(baFacts(afterStart), BA_OUTPUTS),
      },
    });
    baRender(res, beforeStart, afterStart);
    document.getElementById('ba-results').hidden = false;
    renderWhy(document.getElementById('ba-why'), [
      'ng_negative_gearing_offset_available', 'ng_quarantine_applies',
      'ng_grandfathered_by_acquisition_date', 'ng_current_year_quarantined_excess',
      'ng_quarantined_amount_carried_forward',
    ]);
  } catch (err) {
    showError(errorBox, err);
  }
}

function baRender(res, beforeStart, afterStart) {
  const b = (name) => entityValue(res, 'before', name, beforeStart);
  const a = (name) => entityValue(res, 'after', name, afterStart);
  const afterLabel = INCOME_YEARS.find((y) => y.start === afterStart)?.label || afterStart;

  const quarantined = a('ng_quarantine_applies');
  const cards = [
    el('div', { class: 'stat good' },
      el('div', { class: 'label' }, 'Before — 2026-27 income year'),
      el('div', { class: 'value' }, aud(b('ng_negative_gearing_offset_available'))),
      el('div', { class: 'bas' }, 'Rental loss deductible against salary and other income this year')),
    el('div', { class: `stat ${quarantined ? 'negative' : 'good'}` },
      el('div', { class: 'label' }, `After — ${afterLabel} income year`),
      el('div', { class: 'value' }, aud(a('ng_negative_gearing_offset_available'))),
      el('div', { class: 'bas' }, quarantined
        ? `Loss quarantined instead: ${aud(a('ng_current_year_quarantined_excess'))} enters the waterfall; ${aud(a('ng_quarantined_amount_carried_forward'))} carries forward`
        : 'Rental loss still deductible — the quarantine does not apply to this property')),
  ];
  document.getElementById('ba-cards').replaceChildren(...cards);

  const diff = b('ng_negative_gearing_offset_available') - a('ng_negative_gearing_offset_available');
  let line;
  if (!quarantined && diff === 0) {
    line = a('ng_grandfathered_by_acquisition_date')
      ? 'Identical columns: the engine grandfathers this acquisition (contract signed before 12 May 2026), so the reform never touches it.'
      : (a('ng_dwelling_exempt_from_quarantine') || a('ng_exempt_from_quarantine'))
        ? 'Identical columns: the engine finds this dwelling or entity exempt from the quarantine.'
        : 'Identical columns: no net rental loss arises on these facts, so there is nothing to quarantine.';
  } else {
    line = `The quarantine removes ${aud(diff)} of immediately-usable deductions in ${afterLabel} — that amount is not lost, it moves down the carry-forward waterfall.`;
  }
  document.getElementById('ba-line').textContent = line;
  document.getElementById('ba-after-col').textContent = `After (${afterLabel})`;

  const rows = [
    ['Total deductible expenses', aud(b('ng_total_deductible_expenses')), aud(a('ng_total_deductible_expenses'))],
    ['Division 43 capital works deduction', aud(b('ng_capital_works_deduction')), aud(a('ng_capital_works_deduction'))],
    ['Net rental result (your share)', aud(b('ng_net_rental_result')), aud(a('ng_net_rental_result'))],
    ['Quarantine applies?', b('ng_quarantine_applies') ? 'Yes' : 'No', a('ng_quarantine_applies') ? 'Yes' : 'No'],
    ['Loss deductible against other income', aud(b('ng_negative_gearing_offset_available')), aud(a('ng_negative_gearing_offset_available'))],
    ['Quarantined excess this year', aud(b('ng_current_year_quarantined_excess')), aud(a('ng_current_year_quarantined_excess'))],
    ['Quarantined amount carried forward', aud(b('ng_quarantined_amount_carried_forward')), aud(a('ng_quarantined_amount_carried_forward'))],
  ];
  document.querySelector('#ba-table tbody').replaceChildren(...rows.map(([k, bv, av]) =>
    el('tr', {}, el('th', { scope: 'row' }, k),
      el('td', { class: 'num' }, bv), el('td', { class: 'num' }, av))));
}

/* ====================================================== 3 · portfolio waterfall */

const PF_PROP_OUTPUTS = [
  'ng_net_rental_result', 'ng_quarantine_applies',
  'ng_negative_gearing_offset_available', 'ng_current_year_quarantined_excess',
];
const PF_WATERFALL_OUTPUTS = [
  'ng_quarantine_applies', 'ng_reform_commenced_for_year',
  'ng_current_year_quarantined_excess', 'ng_quarantined_excess_after_dwelling_offset',
  'ng_quarantined_amount_applied_to_capital_gains', 'ng_quarantined_amount_carried_forward',
  'ng_residential_capital_gain_after_offset',
];

let PROPERTIES = [];

function pfInit() {
  fillEntitySelect('pf-entity');
  fillYearSelect('pf-year', '2027-07-01');
  try { PROPERTIES = JSON.parse(localStorage.getItem('ng-portfolio')) || []; } catch { PROPERTIES = []; }
  document.getElementById('pf-add').addEventListener('click', pfAdd);
  document.getElementById('pf-demo').addEventListener('click', pfDemo);
  document.getElementById('pf-btn').addEventListener('click', pfCalculate);
  pfRenderTable();
}

function pfSave() { localStorage.setItem('ng-portfolio', JSON.stringify(PROPERTIES)); }

function pfAdd() {
  const errorBox = document.getElementById('error-box');
  errorBox.replaceChildren();
  const acquired = document.getElementById('pf-acquired').value;
  if (!acquired) { showError(errorBox, new Error('Enter the property’s acquisition contract date.')); return; }
  PROPERTIES.push({
    name: document.getElementById('pf-name').value.trim() || `Property ${PROPERTIES.length + 1}`,
    acquired,
    rent: Number(document.getElementById('pf-rent').value) || 0,
    expenses: Number(document.getElementById('pf-expenses').value) || 0,
    newbuild: document.getElementById('pf-newbuild').checked,
  });
  document.getElementById('pf-name').value = '';
  pfSave();
  pfRenderTable();
}

function pfDemo() {
  PROPERTIES = [
    { name: 'Pre-announcement unit', acquired: '2019-03-15', rent: 24000, expenses: 31000, newbuild: false },
    { name: 'Post-announcement house', acquired: '2026-11-02', rent: 30000, expenses: 47000, newbuild: false },
    { name: 'New build townhouse', acquired: '2027-02-10', rent: 28000, expenses: 36000, newbuild: true },
    { name: 'Paid-off flat', acquired: '2027-08-01', rent: 22000, expenses: 9000, newbuild: false },
  ];
  pfSave();
  pfRenderTable();
}

function pfRenderTable(statusByIndex) {
  const table = document.getElementById('pf-table');
  const body = table.querySelector('tbody');
  table.hidden = PROPERTIES.length === 0;
  body.replaceChildren(...PROPERTIES.map((p, i) => {
    const remove = el('button', { type: 'button', class: 'secondary', style: 'padding:0.2rem 0.7rem;font-size:0.8rem' }, 'Remove');
    remove.addEventListener('click', () => { PROPERTIES.splice(i, 1); pfSave(); pfRenderTable(); });
    const s = statusByIndex && statusByIndex[i];
    return el('tr', {},
      el('td', {}, p.name),
      el('td', {}, p.acquired),
      el('td', { class: 'num' }, aud(p.rent)),
      el('td', { class: 'num' }, aud(p.expenses)),
      el('td', {}, s
        ? el('span', { class: `pill ${s.quarantined && s.net < 0 ? 'no' : 'yes'}` },
            s.quarantined
              ? (s.net < 0 ? 'loss quarantined' : 'quarantine scope — no loss')
              : (p.newbuild ? 'exempt (new build)' : 'not quarantined'))
        : el('span', { class: 'muted' }, '—')),
      el('td', { class: 'num' }, s ? aud(s.net) : '—'),
      el('td', {}, remove));
  }));
}

async function pfCalculate() {
  const errorBox = document.getElementById('error-box');
  errorBox.replaceChildren();
  if (!PROPERTIES.length) { showError(errorBox, new Error('Add at least one property (or load the demo portfolio).')); return; }

  const yearStart = document.getElementById('pf-year').value;
  const entityKind = document.getElementById('pf-entity').value;
  const carriedIn = Number(document.getElementById('pf-carried').value) || 0;
  const gain = Number(document.getElementById('pf-gain').value) || 0;

  // One engine call, one entity per property.
  const entities = {};
  PROPERTIES.forEach((p, i) => {
    entities[`prop_${i}`] = ngEntity({
      ng_entity_kind: entityKind,
      ng_ownership_interest_acquired_date: p.acquired,
      ng_income_year_start_date: yearStart,
      ng_is_new_residential_dwelling: p.newbuild,
      ng_rental_income: p.rent,
      ng_interest_and_ownership_expenses: p.expenses,
    }, PF_PROP_OUTPUTS);
  });

  try {
    const res = await apiPost('calculate', { tax_entities: entities });
    const perProp = PROPERTIES.map((p, i) => {
      const val = (name) => entityValue(res, `prop_${i}`, name, yearStart);
      return {
        quarantined: val('ng_quarantine_applies'),
        net: val('ng_net_rental_result'),
        offset: val('ng_negative_gearing_offset_available'),
        quarantinedExcess: val('ng_current_year_quarantined_excess'),
      };
    });
    pfRenderTable(perProp);

    // The ruleset's documented aggregate inputs: summed per-property engine
    // results feed one waterfall entity (see ruleset section 5 scope notes).
    const quarantinedLosses = perProp.reduce((n, s) => n + s.quarantinedExcess, 0);
    const otherNet = perProp.filter((s) => !s.quarantined).reduce((n, s) => n + s.net, 0);
    const otherIncome = Math.max(0, otherNet);

    let wf = null;
    if (quarantinedLosses > 0 || carriedIn > 0) {
      const wfRes = await apiPost('calculate', {
        tax_entities: {
          portfolio: ngEntity({
            ng_entity_kind: entityKind,
            ng_ownership_interest_acquired_date: '2026-09-01',  // representative post-announcement interest
            ng_income_year_start_date: yearStart,
            ng_rental_income: 0,
            ng_interest_and_ownership_expenses: quarantinedLosses,
            ng_other_non_quarantined_dwellings_net_income: otherIncome,
            ng_residential_capital_gain_available: gain,
            ng_prior_year_quarantined_carried_forward: carriedIn,
          }, PF_WATERFALL_OUTPUTS),
        },
      });
      const val = (name) => entityValue(wfRes, 'portfolio', name, yearStart);
      wf = {
        current: val('ng_current_year_quarantined_excess'),
        afterDwellings: val('ng_quarantined_excess_after_dwelling_offset'),
        appliedToGains: val('ng_quarantined_amount_applied_to_capital_gains'),
        carriedOut: val('ng_quarantined_amount_carried_forward'),
        gainAfter: val('ng_residential_capital_gain_after_offset'),
        commenced: val('ng_reform_commenced_for_year'),
      };
    }
    pfRender(perProp, { quarantinedLosses, otherNet, otherIncome, carriedIn, gain }, wf, yearStart);
    document.getElementById('pf-results').hidden = false;
  } catch (err) {
    showError(errorBox, err);
  }
}

function pfRender(perProp, agg, wf, yearStart) {
  const yearLabel = INCOME_YEARS.find((y) => y.start === yearStart)?.label || yearStart;
  const deductibleNow = Math.max(0, -agg.otherNet);
  const cards = [
    el('div', { class: `stat ${deductibleNow > 0 ? 'good' : ''}` },
      el('div', { class: 'label' }, 'Non-quarantined properties, netted'),
      el('div', { class: 'value' }, aud(agg.otherNet)),
      el('div', { class: 'bas' }, agg.otherNet < 0
        ? 'Net loss — deductible against salary and other income (ordinary negative gearing)'
        : 'Net rental income — available to soak up quarantined losses')),
    el('div', { class: `stat ${agg.quarantinedLosses > 0 ? 'negative' : ''}` },
      el('div', { class: 'label' }, `Quarantined losses in ${yearLabel}`),
      el('div', { class: 'value' }, aud(agg.quarantinedLosses)),
      el('div', { class: 'bas' }, `${perProp.filter((s) => s.quarantined).length} of ${perProp.length} properties quarantined`)),
    el('div', { class: 'stat' },
      el('div', { class: 'label' }, 'Applied to residential capital gains'),
      el('div', { class: 'value' }, aud(wf ? wf.appliedToGains : 0)),
      el('div', { class: 'bas' }, wf && wf.appliedToGains > 0 ? `Capital gain remaining after offset: ${aud(wf.gainAfter)}` : 'No quarantined amount met a capital gain this year')),
    el('div', { class: 'stat' },
      el('div', { class: 'label' }, 'Carried forward to next year'),
      el('div', { class: 'value' }, aud(wf ? wf.carriedOut : 0)),
      el('div', { class: 'bas' }, 'Feeds next year’s calculation as the carried-forward input')),
  ];
  document.getElementById('pf-cards').replaceChildren(...cards);

  const wfBox = document.getElementById('pf-waterfall');
  const note = document.getElementById('pf-waterfall-note');
  if (!wf) {
    wfBox.replaceChildren(el('p', { class: 'muted' }, 'No quarantined losses and nothing carried forward — there is no waterfall to show for this year.'));
    note.textContent = '';
    return;
  }
  if (!wf.commenced) {
    wfBox.replaceChildren(el('p', { class: 'muted' },
      `The quarantine has not commenced for ${yearLabel} — losses remain ordinarily deductible and the waterfall is empty.`));
    note.textContent = '';
    return;
  }

  const totalIn = wf.current + agg.carriedIn;
  const usedByOther = Math.max(0, totalIn - wf.afterDwellings);
  const steps = [
    { label: 'Quarantined losses this year', value: wf.current, x0: 0, cls: 'warn', sign: '' },
    { label: 'Carried in from last year', value: agg.carriedIn, x0: wf.current, cls: 'warn', sign: '+' },
    { label: 'Offset by non-quarantined rental income', value: usedByOther, x0: totalIn - usedByOther, cls: 'good', sign: '−' },
    { label: 'Applied to residential capital gains', value: wf.appliedToGains, x0: wf.carriedOut, cls: 'accent', sign: '−' },
    { label: 'Carried forward to next year', value: wf.carriedOut, x0: 0, cls: 'final', sign: '=' },
  ].filter((s) => s.value > 0 || s.sign === '' || s.sign === '=');

  const max = Math.max(totalIn, 1);
  wfBox.replaceChildren(el('div', { class: 'wf' }, ...steps.map((s) => {
    const left = (s.x0 / max) * 100;
    const width = Math.max((s.value / max) * 100, s.value > 0 ? 1.2 : 0);
    const end = left + width;
    // Value label: after the bar if there is room, otherwise flip to before it
    // (or inside it when the bar spans nearly the whole track).
    let labelClass = 'wf-value';
    let labelLeft = end;
    if (end > 85) {
      if (left >= 15) { labelClass += ' before'; labelLeft = left; }
      else { labelClass += ' inside'; labelLeft = end; }
    }
    return el('div', { class: 'wf-row' },
      el('div', { class: 'wf-label' }, s.sign ? `${s.sign} ${s.label}` : s.label),
      el('div', { class: 'wf-track' },
        el('div', { class: `wf-bar wf-${s.cls}`, style: `left:${left}%;width:${width}%` }),
        el('span', { class: labelClass, style: `left:${labelLeft}%` }, aud(s.value))),
    );
  })));
  note.textContent = 'Every dollar figure is an engine output (new s 26-155(6) ITAA 1997); the bars only draw them.';
}

/* ====================================================== 4 · chat panel */

/* A deterministic slot-filling conversation. The script owns the wording; the
 * engine owns the outcome. Each answer fills one input variable from
 * `Negative Gearing Form Questions.md`; the finale is a /calculate call and a
 * reply whose numbers and citations are engine outputs and rule metadata. */

const CHAT_STEPS = [
  {
    id: 'entity', var: 'ng_entity_kind', type: 'enum',
    prompt: 'Who holds the rental property?',
    options: Object.entries(NG_ENTITY_KINDS).map(([value, label]) => ({ value, label })),
  },
  {
    id: 'acquired', var: 'ng_ownership_interest_acquired_date', type: 'date',
    prompt: 'What date did you sign the contract to buy it? (contract date, not settlement — e.g. 2026-09-01 or 1/9/2026)',
  },
  {
    id: 'year', var: 'ng_income_year_start_date', type: 'enum',
    prompt: 'Which income year are you asking about?',
    options: INCOME_YEARS.map((y) => ({ value: y.start, label: y.label })),
  },
  {
    id: 'newbuild', var: 'ng_is_new_residential_dwelling', type: 'bool',
    prompt: 'Is it a new residential dwelling — are you the first to hold it since construction?',
    when: (slots) => slots.ng_ownership_interest_acquired_date >= ANNOUNCEMENT_ISO,
  },
  {
    id: 'share', var: 'ng_ownership_percentage', type: 'percent',
    prompt: 'What is your legal ownership share, as a percentage? (100 if it is all yours — set by the title, not by who pays the bills)',
  },
  {
    id: 'rent', var: 'ng_rental_income', type: 'money',
    prompt: 'Total rent received for the property that year?',
  },
  {
    id: 'expenses', var: 'ng_interest_and_ownership_expenses', type: 'money',
    prompt: 'Loan interest, council rates, insurance and agent fees for the year, all together?',
  },
  {
    id: 'repairs', var: 'ng_repairs_expense', type: 'money',
    prompt: 'Repairs for the year (not improvements)? Say 0 if none.',
  },
  {
    id: 'othernet', var: 'ng_other_non_quarantined_dwellings_net_income', type: 'money',
    prompt: 'Net rental income this year from your OTHER, non-quarantined properties? Say 0 if none.',
    when: chatQuarantinePossible,
  },
  {
    id: 'gain', var: 'ng_residential_capital_gain_available', type: 'money',
    prompt: 'Any capital gain this year from selling a residential dwelling? Say 0 if none.',
    when: chatQuarantinePossible,
  },
  {
    id: 'carried', var: 'ng_prior_year_quarantined_carried_forward', type: 'money',
    prompt: 'Any quarantined amount carried forward from last year? Say 0 if none.',
    when: chatQuarantinePossible,
  },
];

function chatQuarantinePossible(slots) {
  return slots.ng_ownership_interest_acquired_date >= ANNOUNCEMENT_ISO
    && slots.ng_income_year_start_date >= REFORM_START_ISO
    && !slots.ng_is_new_residential_dwelling;
}

const CHAT_OUTPUTS = [
  'ng_net_rental_result', 'ng_quarantine_applies', 'ng_negative_gearing_offset_available',
  'ng_grandfathered_by_acquisition_date', 'ng_dwelling_exempt_from_quarantine',
  'ng_exempt_from_quarantine', 'ng_current_year_quarantined_excess',
  'ng_quarantined_excess_after_dwelling_offset', 'ng_quarantined_amount_applied_to_capital_gains',
  'ng_quarantined_amount_carried_forward',
];

const chat = { stepIndex: -1, slots: {}, done: false };

function chatInit() {
  document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-text');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    chatHandle(text);
  });
  chatRestart();
}

function chatRestart() {
  chat.stepIndex = -1;
  chat.slots = {};
  chat.done = false;
  document.getElementById('chat-log').replaceChildren();
  chatBot('G’day — I can tell you whether a rental loss is still deductible against your other income, or quarantined under the 2027 reform. I only collect the facts; the rules engine decides.');
  chatNext();
}

function chatBot(...children) {
  const log = document.getElementById('chat-log');
  log.appendChild(el('div', { class: 'msg bot' }, ...children));
  log.scrollTop = log.scrollHeight;
}

function chatUser(text) {
  const log = document.getElementById('chat-log');
  log.appendChild(el('div', { class: 'msg user' }, text));
  log.scrollTop = log.scrollHeight;
}

function chatQuick(options) {
  const box = document.getElementById('chat-quick');
  box.replaceChildren(...options.map((o) => {
    const b = el('button', { type: 'button', class: 'chat-chip' }, o.label);
    b.addEventListener('click', () => chatHandle(o.label, o.value));
    return b;
  }));
}

function chatStep() { return CHAT_STEPS[chat.stepIndex]; }

function chatNext() {
  chat.stepIndex += 1;
  while (chat.stepIndex < CHAT_STEPS.length) {
    const step = CHAT_STEPS[chat.stepIndex];
    if (!step.when || step.when(chat.slots)) break;
    chat.stepIndex += 1;
  }
  if (chat.stepIndex >= CHAT_STEPS.length) { chatFinish(); return; }
  const step = chatStep();
  chatBot(step.prompt);
  if (step.type === 'enum') chatQuick(step.options);
  else if (step.type === 'bool') chatQuick([{ label: 'Yes', value: true }, { label: 'No', value: false }]);
  else chatQuick([]);
}

function chatHandle(text, value) {
  if (/^restart$/i.test(text)) { chatUser(text); chatRestart(); return; }
  if (chat.done) {
    chatUser(text);
    if (value === 'restart') chatRestart();
    else chatBot('That calculation is done — press "Start again" (or type restart) to run another scenario.');
    return;
  }
  const step = chatStep();
  if (!step) return;
  chatUser(text);
  let parsed = value;
  if (parsed === undefined) {
    try { parsed = chatParse(step, text); } catch (err) {
      chatBot(String(err.message || err));
      return;
    }
  }
  chat.slots[step.var] = parsed;
  chatNext();
}

function chatParse(step, text) {
  const t = text.trim().toLowerCase();
  if (step.type === 'bool') {
    if (/^(y|yes|yep|true)$/.test(t)) return true;
    if (/^(n|no|nope|false)$/.test(t)) return false;
    throw new Error('A yes or no will do — or tap one of the buttons.');
  }
  if (step.type === 'enum') {
    const hit = step.options.find((o) => o.value.toLowerCase() === t || o.label.toLowerCase().includes(t));
    if (hit) return hit.value;
    throw new Error('I didn’t catch that — tap one of the buttons, or type part of an option.');
  }
  if (step.type === 'date') {
    let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) {
      const dm = t.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
      if (dm) m = [null, dm[3], dm[2], dm[1]];
    }
    if (!m) throw new Error('Please give the date as YYYY-MM-DD (e.g. 2026-09-01) or DD/MM/YYYY.');
    const iso = `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
    if (Number.isNaN(Date.parse(iso))) throw new Error('That doesn’t look like a real date — try again?');
    return iso;
  }
  if (step.type === 'percent') {
    const n = Number(t.replace(/[%\s,]/g, ''));
    if (Number.isNaN(n) || n <= 0 || n > 100) throw new Error('A percentage between 0 and 100, please.');
    return n / 100;
  }
  // money
  let s = t.replace(/[$,\s]/g, '');
  let mult = 1;
  if (s.endsWith('k')) { mult = 1000; s = s.slice(0, -1); }
  const n = Number(s);
  if (Number.isNaN(n) || n < 0) throw new Error('A dollar amount, please — like 38000, $38,000 or 38k. Say 0 for none.');
  return n * mult;
}

async function chatFinish() {
  chat.done = true;
  chatQuick([]);
  chatBot('Thanks — asking the rules engine now…');
  try {
    const res = await apiPost('calculate', {
      tax_entities: { dwelling: ngEntity(chat.slots, CHAT_OUTPUTS) },
    });
    const yearStart = chat.slots.ng_income_year_start_date;
    const val = (name) => entityValue(res, 'dwelling', name, yearStart);
    await chatAnswer(val, yearStart);
  } catch (err) {
    chatBot('The rules engine returned an error: ' + String(err.message || err));
  }
  chatQuick([{ label: 'Start again', value: 'restart' }]);
}

async function chatAnswer(val, yearStart) {
  const yearLabel = INCOME_YEARS.find((y) => y.start === yearStart)?.label || yearStart;
  const net = val('ng_net_rental_result');
  const quarantined = val('ng_quarantine_applies');

  if (net >= 0) {
    chatBot(`The engine says your share of the net rental result for ${yearLabel} is ${aud(net)} — the property is positively geared, so there is no loss to deduct or quarantine. The net income is assessable as usual.`);
  } else if (!quarantined) {
    let why = 'the quarantine does not apply to it';
    if (val('ng_grandfathered_by_acquisition_date')) why = 'your contract predates 7:30pm AEST 12 May 2026, so the interest is grandfathered';
    else if (val('ng_dwelling_exempt_from_quarantine')) why = 'the dwelling is exempt (new residential dwelling or Minister-determined exemption)';
    else if (val('ng_exempt_from_quarantine')) why = 'your entity kind is excepted from the quarantine';
    else if (yearStart < REFORM_START_ISO) why = `the quarantine only starts in the 2027-28 income year, after ${yearLabel}`;
    chatBot(`Good news: the engine finds a rental loss of ${aud(-net)} for ${yearLabel}, and ${why} — so the full ${aud(val('ng_negative_gearing_offset_available'))} is deductible against your salary and other income. Ordinary negative gearing applies.`);
  } else {
    chatBot(`The engine quarantines this loss. Your ${aud(val('ng_current_year_quarantined_excess'))} rental loss for ${yearLabel} cannot offset salary or other income. Down the s 26-155(6) waterfall: after netting against your other non-quarantined rental income it is ${aud(val('ng_quarantined_excess_after_dwelling_offset'))}; ${aud(val('ng_quarantined_amount_applied_to_capital_gains'))} is applied against your residential capital gain; and ${aud(val('ng_quarantined_amount_carried_forward'))} carries forward to next year.`);
  }

  // Citations come from the engine's own rule metadata - the Phase 4 grounding.
  const citeVars = quarantined
    ? ['ng_quarantine_applies', 'ng_quarantined_amount_carried_forward']
    : ['ng_negative_gearing_offset_available', 'ng_grandfathered_by_acquisition_date'];
  try {
    const metas = await Promise.all(citeVars.map(variableMeta));
    const cites = el('div', {});
    metas.forEach((meta) => {
      cites.appendChild(el('div', { class: 'refs', style: 'margin-top:0.3rem' },
        el('code', {}, meta.id), ' — ', referenceLinks(meta.references || [])));
    });
    chatBot('Sources (from the rules’ own metadata): ', cites,
      el('p', { class: 'help', style: 'margin:0.4rem 0 0' },
        'Guidance for exploring Rules as Code, not tax advice. See the full rule set in the ',
        el('a', { href: 'model.html#/negative_gearing' }, 'rules browser'), '.'));
  } catch {
    /* citations are decoration; the verdict already stands */
  }
}

/* ---------------------------------------------------------------- shared "why" */

async function renderWhy(box, names) {
  box.replaceChildren(el('p', { class: 'loading' }, 'Loading rule references…'));
  try {
    const metas = await Promise.all(names.map(variableMeta));
    box.replaceChildren(...metas.map((meta) => el('div', { class: 'why-item' },
      el('div', {}, el('strong', {}, meta.description || meta.id), ' ', el('code', {}, meta.id)),
      meta.documentation ? el('p', { class: 'doc' }, meta.documentation.trim()) : null,
      meta.references?.length
        ? el('div', { class: 'refs' }, 'Reference: ', referenceLinks(meta.references))
        : null)));
  } catch (err) {
    showError(box, err);
  }
}

/* ---------------------------------------------------------------------- boot */

tlInit();
baInit();
pfInit();
chatInit();
