/* Rules model browser — a hierarchical, breadcrumb-driven view over every rule and
 * policy parameter in the engine, modelled on PolicyEngine's /model/rules page.
 *
 * Unlike the flat Legislation Explorer, this navigates a folder tree:
 *   Rules model → <ruleset> → Policy parameters / Inputs / Calculations → leaf
 * with the parameter sub-tree nested by its dotted id (e.g. cgt → discount_percentage
 * → individual). Each leaf shows its detail; parameters get a value-over-time chart.
 *
 * Everything is read live from the engine's metadata API via the shared apiGet/el/
 * referenceLinks/showError helpers in app.js — nothing here is hard-coded.
 */

const V = {};          // variable name -> meta
const P = {};          // dotted id -> parameter
let VAR_NAMES = [];
let PARAM_IDS = [];
const DEPS = {};       // name -> [dependency variable names]
const USED_BY = {};    // name -> [names that depend on it]
const NODES = {};      // path -> tree node (containers and leaves)
let ROOT;

/* The engine's source files are mirrored under webapp/files/ on this server by
 * deploy.sh (sync_sources), so "view source" links never leave the home server. */
const FILES = 'files/';

/* Top-level rulesets, in reading order. Keys match the variable module names
 * (openfisca_rules/variables/<key>.py) and the parameter id prefixes. */
const RULESETS = {
  payg: {
    label: 'PAYG instalments',
    blurb: 'The PAYG instalment variation calculation — estimated tax (T8), varied amount ' +
           'payable (T9) and the new varied rate (T3), from the plain-language PAYG Ruleset.',
  },
  objections: {
    label: 'Objection rights',
    blurb: 'Whether an ATO decision carries an objection (review) right and by when — the ' +
           'Part IVC TAA 1953 framework encoded from the Objection Rights Ruleset.',
  },
  extension_of_time: {
    label: 'Extension of time (s 14ZX)',
    blurb: 'The s 14ZX sense-check: deterministic gatekeepers, delay-band arithmetic and a ' +
           'structured factor record for the extension-of-time discretion — the discretionary ' +
           'outcome itself is deliberately not encoded. From the Extension of Time Ruleset.',
  },
  cgt: {
    label: 'Capital gains tax',
    blurb: 'CGT on a disposal under current law and the enacted 1 July 2027 reform ' +
           '(indexation, 30% minimum tax, grandfathering), from the Capital Gains Tax Ruleset.',
  },
  negative_gearing: {
    label: 'Negative gearing',
    blurb: 'Deductibility of rental losses under current law, and the enacted quarantine ' +
           'from the 2027-28 income year (grandfathering, exemptions, carry-forward waterfall), ' +
           'from the Negative Gearing Ruleset.',
  },
  wato: {
    label: 'Working Australians Tax Offset',
    blurb: 'The $250 WATO enacted for the 2027-28 income year and later - entitlement gates, ' +
           'net labour income and the 14c/$ phase-in (new Subdivision 61-E ITAA 1997), from the ' +
           'Working Australians Tax Offset Ruleset.',
  },
};

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
  const params = await Promise.all(idPaths.map((idPath) => apiGet(`parameter/${idPath}`)));
  params.forEach((p) => { P[p.id] = p; });
  PARAM_IDS = params.map((p) => p.id).sort();

  buildDependencies();
  buildTree();
  renderTree();
  window.addEventListener('hashchange', route);
  route();
}

/* -------------------------------------------------------------- classification */

function isRule(name) {
  const m = V[name];
  return m && m.formulas && Object.keys(m.formulas).length > 0;
}

function rulesetOfVar(name) {
  const src = (V[name] && V[name].source) || '';
  const m = src.match(/variables\/(\w+)\.py/);
  return m && RULESETS[m[1]] ? m[1] : 'payg';
}

/* Parameter id prefixes that don't match their variable module's filename. */
const PARAM_PREFIX_ALIAS = { eot: 'extension_of_time' };

function rulesetOfParam(id) {
  const key = PARAM_PREFIX_ALIAS[id.split('.')[0]] || id.split('.')[0];
  return RULESETS[key] ? key : 'payg';   // unprefixed params (corporate_tax_rate) belong to PAYG
}

/* Segments of a parameter id below its ruleset, e.g.
 *   cgt.discount_percentage.individual -> ['discount_percentage','individual']
 *   eot.long_delay_min_days            -> ['long_delay_min_days']  (aliased prefix)
 *   corporate_tax_rate                 -> ['corporate_tax_rate'] */
function paramSegments(key, id) {
  const prefix = id.split('.')[0];
  const prefixMapsToKey = prefix === key || PARAM_PREFIX_ALIAS[prefix] === key;
  return prefixMapsToKey ? id.slice(prefix.length + 1).split('.') : [id];
}

function formulaText(m) {
  return Object.values((m && m.formulas) || {}).map((f) => (f && f.content) || '').join('\n');
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

/* ---------------------------------------------------------------------- tree */

function humanize(seg) {
  const s = seg.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function register(node) { NODES[node.path] = node; return node; }

function buildTree() {
  ROOT = register({ type: 'root', label: 'Rules model', path: '', children: [] });

  for (const key of Object.keys(RULESETS)) {
    const rs = register({ type: 'ruleset', key, label: RULESETS[key].label,
                          blurb: RULESETS[key].blurb, path: key, children: [] });
    ROOT.children.push(rs);

    // Policy parameters (nested by dotted id)
    const paramIds = PARAM_IDS.filter((id) => rulesetOfParam(id) === key);
    if (paramIds.length) {
      const group = register({ type: 'group', label: 'Policy parameters', path: `${key}/parameters`,
                               blurb: 'Dated policy values (rates, thresholds, time limits) — ' +
                                      'edited without touching a formula.', children: [] });
      rs.children.push(group);
      for (const id of paramIds) insertParam(group, paramSegments(key, id), id);
    }

    // Inputs and Calculations
    addVarGroup(rs, key, 'inputs', 'Inputs',
      'Facts supplied by the user or software.', (n) => !isRule(n));
    addVarGroup(rs, key, 'calculations', 'Calculations',
      'Rules — small formulas that each compute one thing from other variables.', isRule);
  }
}

function insertParam(group, segs, id) {
  let node = group;
  for (let i = 0; i < segs.length - 1; i++) {
    const path = `${node.path}/${segs[i]}`;
    let folder = NODES[path];
    if (!folder) {
      folder = register({ type: 'folder', label: humanize(segs[i]), path, children: [] });
      node.children.push(folder);
    }
    node = folder;
  }
  const seg = segs[segs.length - 1];
  node.children.push(register({ type: 'param', id, label: humanize(seg), path: `${node.path}/${seg}` }));
}

function addVarGroup(rs, key, slug, label, blurb, pred) {
  const names = VAR_NAMES.filter((n) => rulesetOfVar(n) === key && pred(n));
  if (!names.length) return;
  const group = register({ type: 'group', label, path: `${key}/${slug}`, blurb, children: [] });
  rs.children.push(group);
  for (const n of names) {
    group.children.push(register({ type: 'variable', name: n,
      label: V[n].description || n, path: `${group.path}/${n}` }));
  }
}

/* --------------------------------------------------------------- tree sidebar */

function renderTree() {
  const box = document.getElementById('tree');
  const search = el('input', { type: 'search', id: 'model-search', placeholder: 'Search rules, values…' });
  const field = el('div', { class: 'field' }, el('label', { for: 'model-search' }, 'Search'), search);
  const treeRoot = el('div', { class: 'model-tree' }, ...ROOT.children.map(treeNode));
  box.replaceChildren(field, treeRoot);

  search.addEventListener('input', () => filterTree(search.value.trim().toLowerCase(), box));
}

function treeNode(node) {
  if (node.type === 'param' || node.type === 'variable') {
    const a = el('a', { href: `#/${node.path}`, class: 'tree-leaf' },
      el('span', { class: `dot ${node.type === 'variable' ? (isRule(node.name) ? 'rule' : 'input') : 'param'}` }),
      node.label);
    a.dataset.text = `${node.label} ${node.name || node.id}`.toLowerCase();
    a.dataset.path = node.path;
    return a;
  }
  const summary = el('summary', {}, el('a', { href: `#/${node.path}`, class: 'tree-branch-label' }, node.label));
  const details = el('details', { class: 'tree-branch' }, summary, ...node.children.map(treeNode));
  details.dataset.path = node.path;
  return details;
}

function filterTree(q, box) {
  box.querySelectorAll('a.tree-leaf').forEach((a) => {
    a.hidden = q && !a.dataset.text.includes(q);
  });
  // Show a branch only if it has a visible leaf; open branches while searching.
  box.querySelectorAll('details.tree-branch').forEach((d) => {
    const anyVisible = [...d.querySelectorAll('a.tree-leaf')].some((a) => !a.hidden);
    d.hidden = q && !anyVisible;
    if (q) d.open = anyVisible;
  });
}

function syncTree(path) {
  document.querySelectorAll('#tree a').forEach((a) => a.classList.remove('active'));
  const active = document.querySelector(`#tree a[data-path="${CSS.escape(path)}"]`);
  if (active) {
    active.classList.add('active');
    // Open every ancestor <details> so the active node is visible.
    let node = active.closest('details.tree-branch');
    while (node) { node.open = true; node = node.parentElement.closest('details.tree-branch'); }
    active.scrollIntoView({ block: 'nearest' });
  }
}

/* -------------------------------------------------------------------- routing */

function route() {
  const path = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const node = NODES[path] || ROOT;
  syncTree(node.path);
  const main = document.getElementById('detail');
  main.replaceChildren(breadcrumb(node.path));
  if (node.type === 'param') main.append(...paramDetail(P[node.id]));
  else if (node.type === 'variable') main.append(...variableDetail(V[node.name]));
  else main.append(...folderView(node));
  main.scrollTop = 0;
}

function breadcrumb(path) {
  const nav = el('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' });
  const parts = path ? path.split('/') : [];
  let acc = '';
  nav.appendChild(crumb('', 'Rules model', parts.length === 0));
  parts.forEach((seg, i) => {
    acc = acc ? `${acc}/${seg}` : seg;
    nav.appendChild(el('span', { class: 'sep' }, '/'));
    nav.appendChild(crumb(acc, (NODES[acc] && NODES[acc].label) || humanize(seg), i === parts.length - 1));
  });
  return nav;
}

function crumb(path, label, current) {
  return current ? el('span', { class: 'crumb current', 'aria-current': 'page' }, label)
                 : el('a', { class: 'crumb', href: `#/${path}` }, label);
}

/* ---------------------------------------------------------------- folder view */

function folderView(node) {
  const out = [el('h1', {}, node.label)];
  if (node.blurb) out.push(el('p', { class: 'lede' }, node.blurb));

  const cards = node.children.map((child) => {
    const card = el('a', { class: 'model-card', href: `#/${child.path}` });
    card.appendChild(el('div', { class: 'model-card-head' },
      el('span', { class: `tag ${childTag(child).cls}` }, childTag(child).text),
      el('h3', {}, child.label)));
    card.appendChild(el('p', { class: 'muted' }, childSub(child)));
    return card;
  });
  out.push(el('div', { class: 'model-grid' }, ...cards));
  return out;
}

function childTag(child) {
  if (child.type === 'ruleset') return { text: 'Ruleset', cls: '' };
  if (child.type === 'group') return { text: 'Folder', cls: '' };
  if (child.type === 'folder') return { text: 'Folder', cls: '' };
  if (child.type === 'param') return { text: 'Parameter', cls: 'param' };
  return isRule(child.name) ? { text: 'Rule', cls: 'rule' } : { text: 'Input', cls: 'input' };
}

function childSub(child) {
  if (child.type === 'ruleset' || child.type === 'group' || child.type === 'folder') {
    const leaves = countLeaves(child);
    return `${leaves} item${leaves === 1 ? '' : 's'}`;
  }
  if (child.type === 'param') {
    const p = P[child.id];
    return `Current value ${currentValue(p)} · ${p.description ? trim(p.description, 90) : ''}`;
  }
  const m = V[child.name];
  return `${m.valueType} · ${m.documentation ? trim(m.documentation, 90) : (m.description || '')}`;
}

function countLeaves(node) {
  if (node.type === 'param' || node.type === 'variable') return 1;
  return (node.children || []).reduce((n, c) => n + countLeaves(c), 0);
}

function trim(s, n) { s = s.trim().replace(/\s+/g, ' '); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

/* ------------------------------------------------------------- value helpers */

function paramUnit(p) { return (p.metadata && p.metadata.unit) || ''; }

function fmtValue(v, unit) {
  if (typeof v === 'number') {
    if (unit === '/1') return `${(v * 100).toLocaleString('en-AU', { maximumFractionDigits: 2 })}%`;
    let s = v.toLocaleString('en-AU', { maximumFractionDigits: 4 });
    if (unit && unit !== '/1') {
      const u = ['day', 'week', 'month', 'year'].includes(unit) && v !== 1 ? `${unit}s` : unit;
      s += ` ${u}`;
    }
    return s;
  }
  return String(v);
}

function sortedValues(p) {
  return Object.entries(p.values).sort((a, b) => a[0].localeCompare(b[0]));   // ascending by date
}

function currentValue(p) {
  const vals = sortedValues(p);
  return vals.length ? fmtValue(vals[vals.length - 1][1], paramUnit(p)) : '—';
}

/* Value-over-time step chart (inline SVG). Parameters are step functions: a value
 * holds from its effective date until the next one. Most have a single value, which
 * reads as "constant since <date>". Built as a string (data is engine-sourced). */
function paramChart(p) {
  const unit = paramUnit(p);
  const vals = sortedValues(p).map(([d, v]) => [Date.parse(d), Number(v), d, v]);
  const W = 620, H = 150, padL = 56, padR = 16, padT = 16, padB = 30;
  const today = Date.now();
  const xs = vals.map((r) => r[0]);
  let tMin = Math.min(...xs), tMax = Math.max(Math.max(...xs), today);
  if (tMin === tMax) { tMin -= 31536000000; tMax += 31536000000; }   // ±1yr for a single point
  const ys = vals.map((r) => r[1]);
  let yMin = Math.min(0, ...ys), yMax = Math.max(...ys);
  if (yMin === yMax) yMax = yMin + 1;
  const yPad = (yMax - yMin) * 0.15;
  yMax += yPad;
  const x = (t) => padL + ((t - tMin) / (tMax - tMin)) * (W - padL - padR);
  const y = (val) => H - padB - ((val - yMin) / (yMax - yMin)) * (H - padT - padB);

  // Step path: horizontal to next date, then vertical to next value; final segment to "today".
  let d = `M ${x(vals[0][0]).toFixed(1)} ${y(vals[0][1]).toFixed(1)}`;
  for (let i = 1; i < vals.length; i++) {
    d += ` L ${x(vals[i][0]).toFixed(1)} ${y(vals[i - 1][1]).toFixed(1)}`;
    d += ` L ${x(vals[i][0]).toFixed(1)} ${y(vals[i][1]).toFixed(1)}`;
  }
  d += ` L ${x(tMax).toFixed(1)} ${y(vals[vals.length - 1][1]).toFixed(1)}`;

  const yTicks = [yMin, (yMin + yMax) / 2, yMax].map((val) => `
      <line x1="${padL}" y1="${y(val).toFixed(1)}" x2="${W - padR}" y2="${y(val).toFixed(1)}" class="grid"/>
      <text x="${padL - 8}" y="${(y(val) + 4).toFixed(1)}" class="ylab">${fmtValue(val, unit)}</text>`).join('');

  const dots = vals.map((r) => `
      <circle cx="${x(r[0]).toFixed(1)}" cy="${y(r[1]).toFixed(1)}" r="4" class="pt"/>
      <text x="${x(r[0]).toFixed(1)}" y="${(y(r[1]) - 10).toFixed(1)}" class="ptlab">${fmtValue(r[3], unit)}</text>
      <text x="${x(r[0]).toFixed(1)}" y="${H - padB + 18}" class="xlab">${r[2]}</text>`).join('');

  return `<svg class="param-chart" viewBox="0 0 ${W} ${H}" role="img"
      aria-label="Value over time for ${p.id}">${yTicks}
      <path d="${d}" class="line"/>${dots}</svg>`;
}

/* -------------------------------------------------------------------- detail */

function chip(text, cls) { return el('span', { class: `pill ${cls || ''}` }, text); }

function leafLinks(entries) {   // entries: [{path,label}]
  const wrap = el('div', { class: 'chips' });
  entries.forEach((e) => wrap.appendChild(
    el('a', { class: 'pill', href: `#/${e.path}`, style: 'text-decoration:none' }, e.label)));
  return wrap;
}

function varEntry(name) {
  const node = Object.values(NODES).find((n) => n.type === 'variable' && n.name === name);
  return { path: node ? node.path : '', label: V[name].description || name };
}
function paramEntry(id) {
  const node = Object.values(NODES).find((n) => n.type === 'param' && n.id === id);
  return { path: node ? node.path : '', label: humanize(id.split('.').pop()) };
}

function sourceLink(source) {
  if (!source) return null;
  // The engine reports source as a repo-style URL with an optional #Lnn anchor;
  // keep the path from openfisca_rules/ down and serve it from this server.
  const i = source.indexOf('openfisca_rules/');
  if (i < 0) return null;
  const rel = source.slice(i).replace(/#.*$/, '');
  return el('p', { class: 'muted', style: 'margin-top:1rem' },
    el('a', { href: FILES + rel, target: '_blank', rel: 'noopener' }, 'View the source file ↗'));
}

function variableDetail(m) {
  const rule = isRule(m.id);
  const out = [
    el('h1', {}, m.description || m.id),
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
    out.push(el('h3', {}, 'Possible values'));
    out.push(el('ul', {}, Object.entries(m.possibleValues).map(([k, v]) =>
      el('li', {}, el('code', {}, k), ` — ${v}`))));
  }

  const deps = (DEPS[m.id] || []);
  const pu = paramsUsedBy(m.id);
  const users = (USED_BY[m.id] || []);
  if (deps.length) { out.push(el('h3', {}, 'Depends on')); out.push(leafLinks(deps.map(varEntry))); }
  if (pu.length) { out.push(el('h3', {}, 'Uses these policy values')); out.push(leafLinks(pu.map(paramEntry))); }
  if (users.length) { out.push(el('h3', {}, 'Used by')); out.push(leafLinks(users.map(varEntry))); }

  if (rule) {
    for (const [since, f] of Object.entries(m.formulas)) {
      if (!f || !f.content) continue;
      const lbl = since === '0001-01-01' ? 'Formula (Python)' : `Formula from ${since} (Python)`;
      out.push(el('details', { class: 'formula' }, el('summary', {}, lbl),
        el('pre', { class: 'table-scroll' }, el('code', {}, f.content))));
    }
  }
  const src = sourceLink(m.source);
  if (src) out.push(src);
  return out;
}

function paramDetail(p) {
  const unit = paramUnit(p);
  const out = [
    el('h1', {}, humanize(p.id.split('.').pop())),
    el('div', { class: 'chips' },
      chip(p.id, 'param'),
      chip('policy parameter'),
      unit ? chip(`unit: ${unit === '/1' ? 'rate (0–1)' : unit}`) : null),
    el('div', { class: 'stat', style: 'border-left-color:var(--accent);max-width:22rem' },
      el('div', { class: 'label' }, 'Current value'),
      el('div', { class: 'value' }, currentValue(p))),
  ];
  if (p.description) out.push(el('p', { class: 'doc' }, p.description.trim()));
  if (p.metadata && p.metadata.reference) out.push(el('p', { class: 'refs' }, 'Reference: ', referenceLinks([p.metadata.reference])));

  out.push(el('h3', {}, 'Value over time'));
  const chart = el('div', { class: 'card', style: 'padding:1rem' });
  chart.innerHTML = paramChart(p);
  out.push(chart);

  const vals = sortedValues(p).reverse();
  out.push(el('div', { class: 'table-scroll' }, el('table', {},
    el('thead', {}, el('tr', {}, el('th', {}, 'Effective from'), el('th', { class: 'num' }, 'Value'))),
    el('tbody', {}, vals.map(([d, v]) =>
      el('tr', {}, el('td', {}, d), el('td', { class: 'num' }, fmtValue(v, unit))))))));

  const users = VAR_NAMES.filter((n) => paramsUsedBy(n).includes(p.id));
  if (users.length) { out.push(el('h3', {}, 'Used by')); out.push(leafLinks(users.map(varEntry))); }

  out.push(el('p', { class: 'muted', style: 'margin-top:1rem' },
    'Change this value with the ', el('a', { href: `ruleset-editor.html#param-${p.id}` }, 'ruleset editor'), '.'));
  const src = sourceLink(p.source);
  if (src) out.push(src);
  return out;
}
