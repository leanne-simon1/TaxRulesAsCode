/* Ruleset & parameters editor - the "markdown contract" non-coder tool.
 *
 * Top half: every rule (calculated variable) shown in plain language, read live
 * from the engine's metadata. Bottom half: the dated policy parameters, editable
 * through a form that generates the exact YAML file change (with a link to the
 * current file served from this server) - nothing here writes to the engine; it
 * produces a change for review by whoever maintains the repository.
 *
 * Uses the shared apiGet/el/referenceLinks/variableMeta/showError helpers from
 * app.js.
 */

/* Where "view the current file" links point: the engine source mirrored under
 * webapp/files/ on this server by deploy.sh (sync_sources). */
const FILES_BASE = 'files/';

let PARAMS = [];  // [{id, idPath, leaf, ...}]

load().catch((err) => showError(document.getElementById('error-box'), err));

async function load() {
  const listing = await apiGet('parameters');
  const idPaths = Object.values(listing).map((p) => {
    const href = p.href || '';
    return href.substring(href.lastIndexOf('/parameter/') + '/parameter/'.length);
  }).filter(Boolean);

  const params = await Promise.all(idPaths.map(async (idPath) => {
    const p = await apiGet(`parameter/${idPath}`);
    return { ...p, idPath, leaf: p.id.split('.').pop() };
  }));
  PARAMS = params;

  await loadRules();          // needs PARAMS to cross-link rules -> values
  renderParameters(params);
}

/* ------------------------------------------------------- rules (plain language) */

async function loadRules() {
  const listing = await apiGet('variables');
  const metas = await Promise.all(Object.keys(listing).sort().map(variableMeta));
  const rules = metas.filter((m) => m.formulas && Object.keys(m.formulas).length > 0);

  const box = document.getElementById('rules');
  box.replaceChildren(...rules.map(renderRule));

  const filter = document.getElementById('rule-filter');
  filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    for (const card of box.children) {
      card.hidden = q && !card.dataset.text.includes(q);
    }
  });
}

function formulaText(meta) {
  return Object.values(meta.formulas || {}).map((f) => (f && f.content) || '').join('\n');
}

function renderRule(meta) {
  const text = formulaText(meta);
  const related = PARAMS.filter((p) => new RegExp(`\\b${p.leaf}\\b`).test(text));

  const card = el('div', { class: 'card', id: `rule-${meta.id}` });
  card.dataset.text = `${meta.description || ''} ${meta.id} ${meta.documentation || ''}`.toLowerCase();
  card.appendChild(el('h3', {}, meta.description || meta.id, ' ', el('code', {}, meta.id)));
  if (meta.documentation) {
    card.appendChild(el('p', { class: 'doc', style: 'white-space: pre-line' }, meta.documentation.trim()));
  }
  if (meta.references && meta.references.length) {
    card.appendChild(el('p', { class: 'refs' }, 'Reference: ', referenceLinks(meta.references)));
  }
  if (related.length) {
    const links = el('span', {});
    related.forEach((p, i) => {
      if (i > 0) links.appendChild(document.createTextNode(' · '));
      links.appendChild(el('a', { href: `#param-${p.id}` }, el('code', {}, p.id)));
    });
    card.appendChild(el('p', { class: 'refs' }, 'Uses policy value: ', links));
  }
  return card;
}

/* --------------------------------------------------------------- parameters */

function safeId(id) { return id.replace(/[^\w]/g, '_'); }

function filePath(p) {
  const marker = 'openfisca_rules/';
  const i = (p.source || '').indexOf(marker);
  return i >= 0 ? p.source.slice(i) : `openfisca_rules/parameters/${p.idPath}.yaml`;
}

function sortedDates(values) {
  return Object.keys(values).sort();
}

function fmtNum(v) {
  return Number.isInteger(v) ? String(v) : String(v);
}

function renderParameters(params) {
  const box = document.getElementById('parameters');
  box.replaceChildren(...params.map(renderParamCard));
  // If arrived via a #param-... link, reveal it.
  if (location.hash.startsWith('#param-')) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
  }
}

function renderParamCard(p) {
  const safe = safeId(p.id);
  const card = el('div', { class: 'card', id: `param-${p.id}` });

  const unit = p.metadata && p.metadata.unit;
  card.appendChild(el('h3', {},
    p.description || p.id, ' ', el('code', {}, p.id),
    unit ? el('span', { class: 'pill' }, `unit: ${unit}`) : null));
  card.appendChild(el('p', { class: 'muted' }, 'File: ', el('code', {}, filePath(p))));
  if (p.metadata && p.metadata.reference) {
    card.appendChild(el('p', { class: 'refs' }, 'Reference: ', referenceLinks([p.metadata.reference])));
  }

  // Editable existing values.
  const rows = sortedDates(p.values).map((date) => {
    const input = el('input', {
      type: 'number', step: 'any', id: `${safe}__val__${date}`,
      value: fmtNum(p.values[date]),
    });
    return el('div', { class: 'field', style: 'margin:0' },
      el('label', { for: input.id }, `Value effective ${date}`), input);
  });

  const newDate = el('input', { type: 'date', id: `${safe}__newdate` });
  const newVal = el('input', { type: 'number', step: 'any', id: `${safe}__newval`, placeholder: 'new value' });
  const addRow = el('div', { class: 'field', style: 'margin:0' },
    el('label', {}, 'Add a value from a new effective date'),
    el('div', { style: 'display:flex;gap:0.6rem;flex-wrap:wrap' }, newDate, newVal));

  const grid = el('div', {
    style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:0.8rem;margin:0.6rem 0',
  }, ...rows, addRow);
  card.appendChild(grid);

  const preview = el('div', { id: `${safe}__preview`, hidden: 'hidden' });
  const btn = el('button', { type: 'button' }, 'Preview YAML change');
  btn.addEventListener('click', () => previewChange(p, safe, preview));
  card.appendChild(el('div', { class: 'actions' }, btn));
  card.appendChild(preview);
  return card;
}

function previewChange(p, safe, preview) {
  const values = {};
  let bad = null;
  for (const date of sortedDates(p.values)) {
    const raw = document.getElementById(`${safe}__val__${date}`).value;
    const n = Number(raw);
    if (raw === '' || Number.isNaN(n)) { bad = `Value effective ${date} must be a number.`; break; }
    values[date] = n;
  }

  const nd = document.getElementById(`${safe}__newdate`).value;
  const nv = document.getElementById(`${safe}__newval`).value;
  if (!bad && (nd || nv)) {
    if (!nd || !nv) bad = 'To add a value, enter both a date and a number.';
    else if (values[nd] !== undefined) bad = `There is already a value effective ${nd}; edit it above instead.`;
    else {
      const n = Number(nv);
      if (Number.isNaN(n)) bad = 'The new value must be a number.';
      else values[nd] = n;
    }
  }

  if (bad) {
    preview.hidden = false;
    preview.replaceChildren(el('div', { class: 'error' }, bad));
    return;
  }

  // What changed vs the current parameter.
  const changes = [];
  for (const date of sortedDates(values)) {
    if (!(date in p.values)) changes.push(`Add value effective ${date}: ${fmtNum(values[date])}`);
    else if (values[date] !== p.values[date]) {
      changes.push(`Change value effective ${date}: ${fmtNum(p.values[date])} → ${fmtNum(values[date])}`);
    }
  }

  const yaml = buildYaml(p, values);
  const path = filePath(p);
  const viewUrl = FILES_BASE + path;

  preview.hidden = false;
  const copyBtn = el('button', { type: 'button', class: 'secondary' }, 'Copy YAML');
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(yaml).then(() => { copyBtn.textContent = 'Copied ✓'; });
  });

  preview.replaceChildren(
    el('h4', { style: 'margin-bottom:0.3rem' }, 'Change summary'),
    changes.length
      ? el('ul', {}, changes.map((c) => el('li', {}, c)))
      : el('p', { class: 'muted' }, 'No change yet — edit a value or add a new dated value above.'),
    el('h4', { style: 'margin-bottom:0.3rem' }, 'New content for ', el('code', {}, path)),
    el('pre', { class: 'table-scroll' }, el('code', {}, yaml)),
    el('div', { class: 'actions' },
      changes.length ? el('a', { class: 'button secondary', href: viewUrl, target: '_blank', rel: 'noopener' }, 'View the current file on this server') : null,
      copyBtn),
    el('p', { class: 'muted' },
      'Copy the YAML above and send it to whoever maintains the rules repository — it is the ' +
      'complete new content for the file shown. CI runs the ruleset’s tests before the change ' +
      'can affect any answer, and the next deploy refreshes this page and the served copy.'),
  );
}

function buildYaml(p, values) {
  const lines = [`description: ${p.description || ''}`];
  const md = p.metadata || {};
  const mdKeys = ['unit', 'reference'].filter((k) => md[k] != null)
    .concat(Object.keys(md).filter((k) => k !== 'unit' && k !== 'reference' && md[k] != null));
  if (mdKeys.length) {
    lines.push('metadata:');
    for (const k of mdKeys) lines.push(`  ${k}: ${md[k]}`);
  }
  lines.push('values:');
  for (const date of sortedDates(values)) {
    lines.push(`  ${date}:`);
    lines.push(`    value: ${fmtNum(values[date])}`);
  }
  return lines.join('\n') + '\n';
}
