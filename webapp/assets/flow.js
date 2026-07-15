/* Decision-flow diagrams - auto-generated Mermaid flowcharts from the engine's
 * /trace dependency graph. Nothing is drawn by hand: the graph is whatever the
 * rules actually depend on. Uses shared apiGet/apiPost/el/aud/showError helpers.
 */

const MERMAID_URL = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

/* Preset scenarios: fixed inputs so /trace has something to compute, each
 * targeting one result. Inputs mirror the calculators' sample cases. */
const YEAR = '2024';
const SCENARIOS = [
  {
    label: 'Objection: recommended pathway (late private ruling)',
    note: 'A private ruling objected to after the deadline — the deepest objection tree (right → timeliness → extension → pathway).',
    requested: ['recommended_pathway'],
    entity: {
      ato_decision_type: { [YEAR]: 'private_ruling' },
      decision_notice_date: { [YEAR]: '2023-06-15' },
      return_lodgment_due_date: { [YEAR]: '2023-06-15' },
      has_assessment_for_ruling_period: { [YEAR]: false },
      taxpayer_kind: { [YEAR]: 'individual' },
      objection_lodgment_date: { [YEAR]: '2099-01-01' },
      recommended_pathway: { [YEAR]: null },
    },
  },
  {
    label: 'Objection: your deadline (income tax assessment)',
    note: 'How the objection deadline for an original income tax assessment is built.',
    requested: ['objection_deadline'],
    entity: {
      ato_decision_type: { [YEAR]: 'income_tax_assessment' },
      decision_notice_date: { [YEAR]: '2024-02-15' },
      taxpayer_kind: { [YEAR]: 'individual' },
      objection_lodgment_date: { [YEAR]: '2024-03-01' },
      objection_deadline: { [YEAR]: null },
    },
  },
  {
    label: 'Objection: can you object? (SIC remission)',
    note: 'Whether a shortfall-interest-charge remission is objectable — the branch that uses the 20% policy threshold.',
    requested: ['has_objection_right'],
    entity: {
      ato_decision_type: { [YEAR]: 'sic_remission_decision' },
      decision_notice_date: { [YEAR]: '2024-02-15' },
      sic_remaining_fraction_of_shortfall: { [YEAR]: 0.25 },
      objection_lodgment_date: { [YEAR]: '2024-03-01' },
      has_objection_right: { [YEAR]: null },
    },
  },
  {
    label: 'PAYGI: varied amount payable (T9)',
    note: 'How the varied instalment amount is computed from the BAS inputs and the corporate tax rate parameter.',
    requested: ['varied_amount_payable'],
    entity: paygiEntity({ varied_amount_payable: null }),
  },
  {
    label: 'PAYGI: new varied rate (T3)',
    note: 'How the new varied instalment rate is computed.',
    requested: ['new_varied_rate'],
    entity: paygiEntity({ new_varied_rate: null }),
  },
];

/* A sample PAYGI entity (income year 2026, Q2 -> month 2026-12). The corporate
 * tax rate parameter is only dated from 2025, so PAYGI scenarios use a later
 * income year than the objection ones. */
function paygiEntity(outputs) {
  const yr = '2026', mo = '2026-12';
  const e = {
    estimated_taxable_income: { [yr]: 100000 },
    tax_offsets: { [yr]: 5000 },
    estimated_tax_credits: { [yr]: 2000 },
    estimated_payg_instalment_income: { [yr]: 100000 },
    current_quarter: { [mo]: 2 },
    instalments_year_to_date: { [mo]: 3000 },
    instalment_variation_credits_year_to_date: { [mo]: 0 },
  };
  for (const [name, v] of Object.entries(outputs)) e[name] = { [mo]: v };
  return e;
}

let variablesIndex = null;
let mermaidMod = null;

const select = document.getElementById('scenario');
SCENARIOS.forEach((s, i) => select.appendChild(el('option', { value: String(i) }, s.label)));
select.addEventListener('change', () => run(Number(select.value)));

run(0).catch((err) => showError(document.getElementById('error-box'), err));

async function run(i) {
  const errorBox = document.getElementById('error-box');
  errorBox.replaceChildren();
  const scenario = SCENARIOS[i];
  document.getElementById('scenario-note').textContent = scenario.note;
  const diagram = document.getElementById('diagram');
  diagram.replaceChildren(el('p', { class: 'loading' }, 'Tracing the calculation…'));

  try {
    if (!variablesIndex) variablesIndex = await apiGet('variables');
    const res = await apiPost('trace', { tax_entities: { tax_entity: scenario.entity } });
    const requestedNames = new Set(scenario.requested);
    const def = buildMermaid(res.trace, res.requestedCalculations, requestedNames);

    document.getElementById('source').textContent = def;
    document.getElementById('source-wrap').hidden = false;
    document.getElementById('legend').hidden = false;
    await renderMermaid(def, diagram);
  } catch (err) {
    showError(errorBox, err);
    diagram.replaceChildren();
  }
}

/* --------------------------------------------------------- graph construction */

function stripPeriod(key) { return key.split('<')[0]; }
function safe(s) { return s.replace(/[^\w]/g, '_'); }

function fmtVal(name, v) {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') {
    if (name === 'new_varied_rate') return `${v}%`;
    if (['varied_amount_payable', 'estimated_tax', 'estimated_net_tax_payable', 'instalment_adjustment_year_to_date'].includes(name)) return aud(v);
    return String(v);
  }
  if (typeof v === 'string') {
    if (/\d{2}:\d{2}:\d{2}/.test(v)) { const d = new Date(v); if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10); }
    return v;
  }
  return String(v);
}

/* Mermaid-safe label: drop characters that confuse the parser. */
function label(s) {
  return String(s).replace(/&/g, ' and ').replace(/["\[\]{}<>|#]/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildMermaid(trace, requestedKeys, requestedNames) {
  const nodes = {};   // id -> definition line
  const edges = new Set();

  function visit(key) {
    const name = stripPeriod(key);
    if (nodes[name]) return;
    const node = trace[key] || { value: [], dependencies: [], parameters: {} };
    const isInput = (node.dependencies || []).length === 0;
    const cls = requestedNames.has(name) ? 'result' : (isInput ? 'input' : 'rule');
    const desc = (variablesIndex[name] && variablesIndex[name].description) || name;
    const val = fmtVal(name, node.value && node.value[0]);
    nodes[name] = `  ${name}["${label(desc)}<br/>${label(name)} = ${label(val)}"]:::${cls}`;

    for (const [pKey, pVal] of Object.entries(node.parameters || {})) {
      const leaf = stripPeriod(pKey).split('.').pop();
      const pid = `param_${safe(stripPeriod(pKey))}`;
      if (!nodes[pid]) nodes[pid] = `  ${pid}[/"policy value<br/>${label(leaf)} = ${label(String(pVal))}"/]:::param`;
      edges.add(`  ${pid} --> ${name}`);
    }
    for (const dep of node.dependencies || []) {
      visit(dep);
      edges.add(`  ${stripPeriod(dep)} --> ${name}`);
    }
  }

  requestedKeys.forEach(visit);

  return [
    'flowchart TD',
    ...Object.values(nodes),
    ...edges,
    'classDef input fill:#e7f6ee,stroke:#1f7a3d,color:#12351f;',
    'classDef rule fill:#e9ecfb,stroke:#3844ca,color:#1a1a4a;',
    'classDef result fill:#fff1e6,stroke:#d74100,color:#5c2200,font-weight:bold;',
    'classDef param fill:#f0f0f5,stroke:#8a8a8a,color:#333,font-style:italic;',
  ].join('\n');
}

/* ------------------------------------------------------------------ render */

async function renderMermaid(def, container) {
  try {
    if (!mermaidMod) {
      mermaidMod = (await import(MERMAID_URL)).default;
      const dark = matchMedia('(prefers-color-scheme: dark)').matches;
      mermaidMod.initialize({ startOnLoad: false, theme: dark ? 'dark' : 'neutral', securityLevel: 'strict' });
    }
    const { svg } = await mermaidMod.render(`g${Date.now()}`, def);
    container.innerHTML = svg;
    const el0 = container.querySelector('svg');
    if (el0) { el0.style.maxWidth = '100%'; el0.style.height = 'auto'; }
  } catch (err) {
    container.replaceChildren(
      el('div', { class: 'notice' },
        'Could not load the diagram renderer — the Mermaid source is shown in the panel below; ',
        el('a', { href: 'https://mermaid.live', target: '_blank', rel: 'noopener' }, 'render it at mermaid.live'),
        '.'),
    );
    document.getElementById('source-wrap').setAttribute('open', '');
  }
}
