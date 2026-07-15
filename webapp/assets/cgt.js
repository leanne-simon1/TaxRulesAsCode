/* CGT calculator - a thin view over openfisca_rules/variables/cgt.py. Sends one
 * /calculate with the disposal facts and shows the CGT cost under current rules,
 * the amended (1 July 2027) rules, and the actual grandfathered outcome. Uses the
 * shared apiPost/el/aud/pct/variableMeta/referenceLinks/showError helpers.
 */

const REFORM_ISO = '2027-07-01';

const ENTITY_LABELS = {
  individual: 'Individual',
  trust: 'Trust (individual beneficiary)',
  complying_super_fund: 'Complying super fund',
  company: 'Company',
};

const REGIME_LABELS = {
  current_only: 'Current rules only — disposed before 1 July 2027',
  transitional: 'Transitional — the gain straddles 1 July 2027, so it is grandfathered (split)',
  amended_only: 'Amended rules only — acquired on or after 1 July 2027',
};

const OUTPUTS = [
  'cgt_affected_by_reform', 'cgt_holding_period_days', 'cgt_is_long_term',
  'cgt_gross_capital_gain', 'cgt_gain_after_losses', 'cgt_discount_percentage',
  'cgt_indexation_relief', 'cgt_current_rules_taxable_gain', 'cgt_current_rules_tax',
  'cgt_amended_rules_taxable_gain', 'cgt_amended_rules_rate', 'cgt_amended_rules_tax',
  'cgt_transition_pre_fraction', 'cgt_actual_regime', 'cgt_actual_tax',
  'cgt_amended_vs_current_difference', 'cgt_actual_vs_current_difference',
];

/* Sensible demo defaults: bought before the reform, sold after -> transitional,
 * so all three columns differ and the grandfathering is visible. */
document.getElementById('acquisitionDate').value = '2020-01-01';
document.getElementById('disposalDate').value = '2028-07-01';

const straddleInputs = ['acquisitionDate', 'disposalDate', 'transitionMethod'];
straddleInputs.forEach((id) =>
  document.getElementById(id).addEventListener('change', updateVisibleFields));
updateVisibleFields();

document.getElementById('calc-btn').addEventListener('click', calculate);
document.getElementById('input-form').addEventListener('submit', (e) => {
  e.preventDefault();
  calculate();
});

/* Show the grandfathering controls only when the holding period spans the reform. */
function updateVisibleFields() {
  const acq = document.getElementById('acquisitionDate').value;
  const disp = document.getElementById('disposalDate').value;
  const straddles = acq && disp && acq < REFORM_ISO && disp >= REFORM_ISO;
  document.getElementById('f-transitionMethod').hidden = !straddles;
  const method = document.getElementById('transitionMethod').value;
  document.getElementById('f-marketValue').hidden = !(straddles && method === 'market_value');
}

function readForm() {
  const v = {
    entityKind: document.getElementById('entityKind').value,
    acquisitionDate: document.getElementById('acquisitionDate').value,
    disposalDate: document.getElementById('disposalDate').value,
    costBase: Number(document.getElementById('costBase').value),
    proceeds: Number(document.getElementById('proceeds').value),
    losses: Number(document.getElementById('losses').value) || 0,
    marginalRate: Number(document.getElementById('marginalRate').value),
    inflation: Number(document.getElementById('inflation').value),
    transitionMethod: document.getElementById('transitionMethod').value,
    marketValue: Number(document.getElementById('marketValue').value) || 0,
  };
  if (!v.acquisitionDate) throw new Error('Please enter the acquisition date.');
  if (!v.disposalDate) throw new Error('Please enter the disposal (CGT event) date.');
  if (v.disposalDate < v.acquisitionDate) {
    throw new Error('The disposal date cannot be before the acquisition date.');
  }
  if (Number.isNaN(v.costBase) || v.costBase < 0) throw new Error('Enter a valid cost base.');
  if (Number.isNaN(v.proceeds) || v.proceeds < 0) throw new Error('Enter valid sale proceeds.');
  return v;
}

function buildEntity(v, y) {
  const e = {
    cgt_entity_kind: { [y]: v.entityKind },
    cgt_acquisition_date: { [y]: v.acquisitionDate },
    cgt_disposal_date: { [y]: v.disposalDate },
    cgt_cost_base: { [y]: v.costBase },
    cgt_capital_proceeds: { [y]: v.proceeds },
    cgt_capital_losses_applied: { [y]: v.losses },
    cgt_marginal_rate: { [y]: v.marginalRate / 100 },
    cgt_assumed_annual_inflation: { [y]: v.inflation / 100 },
    cgt_transition_method: { [y]: v.transitionMethod },
    cgt_market_value_at_reform: { [y]: v.marketValue },
  };
  for (const name of OUTPUTS) e[name] = { [y]: null };
  return e;
}

async function calculate() {
  const errorBox = document.getElementById('error-box');
  errorBox.replaceChildren();
  let v;
  try { v = readForm(); } catch (err) { showError(errorBox, err); return; }

  const y = String(new Date(v.disposalDate).getFullYear());
  try {
    const res = await apiPost('calculate', { tax_entities: { asset: buildEntity(v, y) } });
    const out = res.tax_entities.asset;
    const val = (name) => out[name][y];
    renderResult(v, val);
    document.getElementById('results').hidden = false;
    await renderWhy();
  } catch (err) {
    showError(errorBox, err);
  }
}

function signed(n) {
  const s = aud(Math.abs(n));
  if (Math.round(n) === 0) return 'the same';
  return n > 0 ? `${s} more` : `${s} less`;
}

function renderResult(v, val) {
  const current = val('cgt_current_rules_tax');
  const amended = val('cgt_amended_rules_tax');
  const actual = val('cgt_actual_tax');
  const regime = val('cgt_actual_regime');
  const affected = val('cgt_affected_by_reform');

  document.getElementById('regime-line').textContent =
    `${REGIME_LABELS[regime] || regime}. ` +
    (affected
      ? `Under the amended rules this disposal would cost ${signed(val('cgt_amended_vs_current_difference'))} than under today's rules; your actual (grandfathered) cost is ${signed(val('cgt_actual_vs_current_difference'))} than today.`
      : `${ENTITY_LABELS[v.entityKind]} entities are not affected by the 2027 reform, so all three are the same.`);

  const cards = [
    ['stat', 'Current rules (today)', aud(current),
      `50% discount world — ${pct(val('cgt_discount_percentage') * 100)} discount applied`],
    ['stat ' + (val('cgt_amended_vs_current_difference') > 0 ? 'negative' : 'good'),
      'Amended rules (from 1 Jul 2027)', aud(amended),
      'Indexation of the cost base + 30% minimum tax'],
    ['stat good', 'Your actual cost (grandfathered)', aud(actual),
      REGIME_LABELS[regime]?.split(' — ')[0] || ''],
  ];
  document.getElementById('stat-cards').replaceChildren(...cards.map(([cls, label, value, sub]) =>
    el('div', { class: cls },
      el('div', { class: 'label' }, label),
      el('div', { class: 'value' }, value),
      el('div', { class: 'bas' }, sub))));

  const rows = [
    ['Entity', ENTITY_LABELS[v.entityKind]],
    ['Affected by the 2027 reform?', affected ? 'Yes' : 'No'],
    ['Holding period', `${val('cgt_holding_period_days').toLocaleString('en-AU')} days` +
      (val('cgt_is_long_term') ? ' (over 12 months — long-term)' : ' (under 12 months — no discount or indexation)')],
    ['Gross capital gain', aud(val('cgt_gross_capital_gain'))],
    ['Gain after losses', aud(val('cgt_gain_after_losses'))],
    ['Discount % (current rules)', pct(val('cgt_discount_percentage') * 100)],
    ['Indexation relief (amended rules)', aud(val('cgt_indexation_relief'))],
    ['Taxable gain — current rules', aud(val('cgt_current_rules_taxable_gain'))],
    ['Taxable gain — amended rules', aud(val('cgt_amended_rules_taxable_gain'))],
    ['Effective rate — amended rules', pct(val('cgt_amended_rules_rate') * 100)],
  ];
  if (regime === 'transitional') {
    rows.push(['Gain accruing before 1 Jul 2027',
      `${pct(val('cgt_transition_pre_fraction') * 100)} (grandfathered under current rules); the rest under amended rules`]);
  }
  rows.push(['Regime applied', REGIME_LABELS[regime] || regime]);

  document.querySelector('#breakdown tbody').replaceChildren(...rows.map(([k, val2]) =>
    el('tr', {}, el('th', { scope: 'row' }, k), el('td', {}, String(val2)))));
}

async function renderWhy() {
  const box = document.getElementById('why');
  box.replaceChildren(el('p', { class: 'loading' }, 'Loading rule references…'));
  const names = [
    'cgt_current_rules_tax', 'cgt_amended_rules_tax', 'cgt_indexation_relief',
    'cgt_actual_tax', 'cgt_transition_pre_fraction',
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
