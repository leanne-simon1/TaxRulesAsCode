/* Legislation Explorer - a searchable, cross-linked browser over every variable
 * and parameter, modelled on OpenFisca's Legislation Explorer. Read live from
 * metadata. Uses shared apiGet/el/referenceLinks/showError helpers from app.js.
 */

const V = {};        // name -> variable meta
const P = {};        // dotted id -> parameter (with idPath)
let VAR_NAMES = [];
let PARAM_IDS = [];
const DEPS = {};     // name -> [dependency names]
const USED_BY = {};  // name -> [names that depend on it]

load().catch((err) => showError(document.getElementById('error-box'), err));

async function load() {
  const [varListing, paramListing] = await Promise.all([apiGet('variables'), apiGet('parameters')]);

  const names = Object.keys(varListing).sort();
  const metas = await Promise.all(names.map((n) => apiGet(`variable/${n}`)));
  metas.forEach((m) => { V[m.id] = m; });
  VAR_NAMES = names;

  const idPaths = Object.values(paramListing).map((p) => {
    const href = p.href || '';
    return href.substring(href.lastIndexOf('/parameter/') + '/parameter/'.length);
  }).filter(Boolean);
  const params = await Promise.all(idPaths.map(async (idPath) => ({ ...(await apiGet(`parameter/${idPath}`)), idPath })));
  params.forEach((p) => { P[p.id] = p; });
  PARAM_IDS = params.map((p) => p.id).sort();

  buildDependencies();
  renderIndex();
  window.addEventListener('hashchange', renderDetail);
  if (!location.hash) location.hash = `#variable/${firstRuleName() || VAR_NAMES[0]}`;
  else renderDetail();
}

function firstRuleName() {
  return VAR_NAMES.find((n) => V[n].formulas && Object.keys(V[n].formulas).length);
}

function formulaText(meta) {
  return Object.values(meta.formulas || {}).map((f) => (f && f.content) || '').join('\n');
}

function buildDependencies() {
  for (const name of VAR_NAMES) {
    const text = formulaText(V[name]);
    const deps = new Set();
    for (const m of text.matchAll(/entities\(\s*["']([a-z0-9_]+)["']/g)) {
      if (V[m[1]] && m[1] !== name) deps.add(m[1]);
    }
    DEPS[name] = [...deps];
    for (const d of deps) (USED_BY[d] = USED_BY[d] || []).push(name);
  }
}

function paramsUsedBy(name) {
  const text = formulaText(V[name]);
  return PARAM_IDS.filter((id) => new RegExp(`\\b${id.split('.').pop()}\\b`).test(text));
}

/* --------------------------------------------------------------------- index */

function isRule(name) { return V[name].formulas && Object.keys(V[name].formulas).length > 0; }

function renderIndex() {
  const box = document.getElementById('index');
  const search = el('input', { type: 'search', id: 'ex-search', placeholder: 'Search rules, values…' });
  const field = el('div', { class: 'field' }, el('label', { for: 'ex-search' }, 'Search'), search);

  const inputs = VAR_NAMES.filter((n) => !isRule(n));
  const rules = VAR_NAMES.filter(isRule);

  const groups = [
    section('Rules', rules.map((n) => link(`#variable/${n}`, V[n].description || n, n))),
    section('Inputs', inputs.map((n) => link(`#variable/${n}`, V[n].description || n, n))),
    section('Policy parameters', PARAM_IDS.map((id) => link(`#parameter/${id}`, P[id].description || id, id))),
  ];
  box.replaceChildren(field, ...groups);

  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    box.querySelectorAll('a').forEach((a) => { a.hidden = q && !a.dataset.text.includes(q); });
    box.querySelectorAll('h4').forEach((h) => {
      let sib = h.nextElementSibling, any = false;
      while (sib && sib.tagName === 'A') { if (!sib.hidden) any = true; sib = sib.nextElementSibling; }
      h.hidden = !any;
    });
  });
  highlightActive();
}

function section(title, links) {
  const frag = el('div', {}, el('h4', {}, title), ...links);
  return frag;
}

function link(href, text, id) {
  const a = el('a', { href }, text);
  a.dataset.text = `${text} ${id}`.toLowerCase();
  a.dataset.href = href;
  return a;
}

function highlightActive() {
  document.querySelectorAll('#index a').forEach((a) => {
    a.classList.toggle('active', a.dataset.href === location.hash);
  });
}

/* -------------------------------------------------------------------- detail */

function renderDetail() {
  highlightActive();
  const detail = document.getElementById('detail');
  const [kind, ...rest] = location.hash.replace(/^#/, '').split('/');
  const id = rest.join('/');
  if (kind === 'parameter' && P[id]) return detail.replaceChildren(...paramDetail(P[id]));
  if (kind === 'variable' && V[id]) return detail.replaceChildren(...variableDetail(V[id]));
  detail.replaceChildren(el('p', { class: 'muted' }, 'Select an item from the list.'));
}

function chip(text, cls) { return el('span', { class: `pill ${cls || ''}` }, text); }

function nameLinks(names, kind) {
  const wrap = el('div', { class: 'chips' });
  names.forEach((n) => {
    const label = kind === 'parameter' ? n : (V[n].description || n);
    wrap.appendChild(el('a', { class: 'pill', href: `#${kind}/${n}`, style: 'text-decoration:none' }, label));
  });
  return wrap;
}

function variableDetail(m) {
  const rule = isRule(m.id);
  const out = [
    el('h2', {}, m.description || m.id),
    el('div', { class: 'chips' },
      chip(m.id),
      chip(rule ? 'rule' : 'input', rule ? 'formula' : 'input'),
      chip(String(m.valueType)),
      chip(`per ${String(m.definitionPeriod).toLowerCase()}`),
      chip(`entity: ${m.entity}`)),
  ];
  if (m.documentation) out.push(el('p', { class: 'doc', style: 'white-space:pre-line' }, m.documentation.trim()));
  if (m.references && m.references.length) out.push(el('p', { class: 'refs' }, 'Reference: ', referenceLinks(m.references)));

  if (m.possibleValues) {
    out.push(el('h4', {}, 'Possible values'));
    out.push(el('ul', {}, Object.entries(m.possibleValues).map(([k, v]) => el('li', {}, el('code', {}, k), ` — ${v}`))));
  }

  const deps = DEPS[m.id] || [];
  const pu = paramsUsedBy(m.id);
  if (deps.length) { out.push(el('h4', {}, 'Depends on these rules / inputs')); out.push(nameLinks(deps, 'variable')); }
  if (pu.length) { out.push(el('h4', {}, 'Uses these policy values')); out.push(nameLinks(pu, 'parameter')); }
  const users = USED_BY[m.id] || [];
  if (users.length) { out.push(el('h4', {}, 'Used by these rules')); out.push(nameLinks(users, 'variable')); }

  if (rule) {
    for (const [since, f] of Object.entries(m.formulas)) {
      if (!f || !f.content) continue;
      const lbl = since === '0001-01-01' ? 'Formula (Python)' : `Formula from ${since} (Python)`;
      out.push(el('details', {}, el('summary', {}, lbl), el('pre', { class: 'table-scroll' }, el('code', {}, f.content))));
    }
  }
  return out;
}

function paramDetail(p) {
  const out = [
    el('h2', {}, p.description || p.id),
    el('div', { class: 'chips' },
      chip(p.id),
      chip('policy parameter'),
      p.metadata && p.metadata.unit ? chip(`unit: ${p.metadata.unit}`) : null),
  ];
  if (p.metadata && p.metadata.reference) out.push(el('p', { class: 'refs' }, 'Reference: ', referenceLinks([p.metadata.reference])));

  const dates = Object.keys(p.values).sort((a, b) => b.localeCompare(a));
  out.push(el('h4', {}, 'Values over time'));
  out.push(el('div', { class: 'table-scroll' }, el('table', {},
    el('thead', {}, el('tr', {}, el('th', {}, 'Effective from'), el('th', { class: 'num' }, 'Value'))),
    el('tbody', {}, dates.map((d) => el('tr', {}, el('td', {}, d), el('td', { class: 'num' }, String(p.values[d]))))))));

  const users = VAR_NAMES.filter((n) => paramsUsedBy(n).includes(p.id));
  if (users.length) { out.push(el('h4', {}, 'Used by these rules')); out.push(nameLinks(users, 'variable')); }

  out.push(el('p', { class: 'muted', style: 'margin-top:1rem' },
    'Change this value with the ', el('a', { href: `ruleset-editor.html#param-${p.id}` }, 'ruleset editor'), '.'));
  return out;
}
