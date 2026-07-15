/* Shared helpers for the PAYGI rules-engine showcase.
 *
 * All API calls use the relative path "api/..." so the app works unchanged
 * behind a reverse proxy that mounts it under a path prefix (e.g. /paygi/).
 * nginx proxies "api/" to the OpenFisca web API container.
 */

const API_BASE = 'api';

async function apiGet(path) {
  const res = await fetch(`${API_BASE}/${path}`);
  if (!res.ok) throw new Error(`API error ${res.status} for ${path}`);
  return res.json();
}

async function apiPost(path, payload) {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body ? Object.values(body).join('\n') : res.statusText;
    throw new Error(`The rules engine rejected the request (${res.status}): ${detail}`);
  }
  return body;
}

/* ---------------------------------------------------------------- periods */

/* BAS quarter -> OpenFisca period keys, per the PAYG OpenFisca API
 * Integration Guide: Q1 = Sep and Q2 = Dec of the selected calendar year;
 * Q3 = Mar and Q4 = Jun of the following calendar year. Year-level variables
 * use the calendar year that contains the BAS month.
 */
function basPeriods(incomeYearStart, quarter) {
  const map = { 1: [0, '09'], 2: [0, '12'], 3: [1, '03'], 4: [1, '06'] };
  const [offset, month] = map[quarter];
  const calYear = Number(incomeYearStart) + offset;
  return { month: `${calYear}-${month}`, year: String(calYear) };
}

/* ------------------------------------------------------------------ forms */

const INPUT_FIELDS = [
  { id: 'incomeYearStart', label: 'Income year', kind: 'year' },
  { id: 'quarter', label: 'Which quarter is this BAS for?', kind: 'quarter' },
  { id: 'income', label: 'Estimated taxable income for the year (A$)', kind: 'money', value: 100000,
    help: 'Your best estimate of taxable income for the full income year.' },
  { id: 'offsets', label: 'Tax offsets for the year (A$)', kind: 'money', value: 5000,
    help: 'Non-refundable tax offsets. Enter 0 if none.' },
  { id: 'credits', label: 'Estimated tax credits for the year (A$)', kind: 'money', value: 2000,
    help: 'Enter 0 if none.' },
  { id: 'ytd5A', label: 'PAYG instalments year-to-date (BAS label 5A) (A$)', kind: 'money', value: 3000,
    help: 'Total instalments reported on earlier BAS this income year.' },
  { id: 'ytd5B', label: 'Instalment variation credits year-to-date (BAS label 5B) (A$)', kind: 'money', value: 0,
    help: 'Variation credits already claimed this income year. Enter 0 if none.' },
  { id: 'instalmentIncome', label: 'Estimated PAYG instalment income for the year (T1 basis) (A$)', kind: 'money', value: 100000,
    help: 'Estimated ordinary business and investment income for the whole year, excluding GST. Used for the varied rate (T3).' },
];

function renderInputForm(container, saved) {
  const currentYear = new Date().getFullYear();
  for (const f of INPUT_FIELDS) {
    const field = el('div', { class: 'field' });
    field.appendChild(el('label', { for: f.id }, f.label));
    let input;
    if (f.kind === 'year') {
      input = el('select', { id: f.id });
      for (let y = currentYear - 2; y <= currentYear + 1; y++) {
        input.appendChild(el('option', { value: String(y) }, `${y} (BAS quarters Sep ${y} – Jun ${y + 1})`));
      }
      input.value = saved?.[f.id] ?? String(currentYear);
    } else if (f.kind === 'quarter') {
      input = el('select', { id: f.id });
      const labels = { 1: 'Quarter 1 (Jul–Sep)', 2: 'Quarter 2 (Oct–Dec)', 3: 'Quarter 3 (Jan–Mar)', 4: 'Quarter 4 (Apr–Jun)' };
      for (const q of [1, 2, 3, 4]) input.appendChild(el('option', { value: String(q) }, labels[q]));
      input.value = saved?.[f.id] ?? '2';
    } else {
      input = el('input', { id: f.id, type: 'number', min: '0', step: '0.01' });
      input.value = saved?.[f.id] ?? f.value;
    }
    field.appendChild(input);
    if (f.help) field.appendChild(el('p', { class: 'help' }, f.help));
    container.appendChild(field);
  }
}

function readInputForm() {
  const v = {};
  for (const f of INPUT_FIELDS) {
    const raw = document.getElementById(f.id).value;
    if (f.kind === 'money') {
      const n = Number(raw);
      if (raw === '' || Number.isNaN(n) || n < 0) {
        throw new Error(`Please enter a non-negative number for “${f.label}”.`);
      }
      v[f.id] = n;
    } else {
      v[f.id] = Number(raw);
    }
  }
  localStorage.setItem('paygi-inputs', JSON.stringify(v));
  return v;
}

function savedInputs() {
  try { return JSON.parse(localStorage.getItem('paygi-inputs')); } catch { return null; }
}

/* Build a /calculate or /trace payload for one entity's input values.
 * `outputs` is a list of [variable_name, 'year'|'month'] pairs to request.
 */
function buildEntity(v, outputs) {
  const p = basPeriods(v.incomeYearStart, v.quarter);
  const entity = {
    estimated_taxable_income: { [p.year]: v.income },
    tax_offsets: { [p.year]: v.offsets },
    estimated_tax_credits: { [p.year]: v.credits },
    estimated_payg_instalment_income: { [p.year]: v.instalmentIncome },
    current_quarter: { [p.month]: v.quarter },
    instalments_year_to_date: { [p.month]: v.ytd5A },
    instalment_variation_credits_year_to_date: { [p.month]: v.ytd5B },
  };
  for (const [name, level] of outputs) {
    entity[name] = { [level === 'year' ? p.year : p.month]: null };
  }
  return { entity, periods: p };
}

/* -------------------------------------------------------------- metadata */

const variableCache = {};

async function variableMeta(name) {
  if (!variableCache[name]) variableCache[name] = apiGet(`variable/${name}`);
  return variableCache[name];
}

function referenceLinks(references) {
  const wrap = el('span', {});
  (references || []).forEach((ref, i) => {
    if (i > 0) wrap.appendChild(document.createTextNode(' · '));
    if (/^https?:\/\//.test(ref)) {
      let text = ref;
      try { text = new URL(ref).hostname.replace(/^www\./, ''); } catch { /* keep full ref */ }
      wrap.appendChild(el('a', { href: ref, target: '_blank', rel: 'noopener' }, text));
    } else {
      wrap.appendChild(el('span', {}, ref));
    }
  });
  return wrap;
}

/* ------------------------------------------------------------- rendering */

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, val] of Object.entries(attrs)) node.setAttribute(k, val);
  for (const child of children.flat()) {
    if (child == null) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

const audFmt = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
function aud(n) { return audFmt.format(n); }
function pct(n) { return `${Number(n).toLocaleString('en-AU', { maximumFractionDigits: 2 })}%`; }

function showError(container, err) {
  container.replaceChildren(el('div', { class: 'error' }, String(err.message || err)));
}

/* Highlight the current page in the shared nav. */
document.addEventListener('DOMContentLoaded', () => {
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach((a) => {
    if (a.getAttribute('href') === here) a.classList.add('active');
  });
});
