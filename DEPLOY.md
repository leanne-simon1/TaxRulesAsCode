# Deploying to a home server

Runs the OpenFisca rules engine (PAYGI + objection-rights rulesets) plus the
showcase web tools (PAYGI calculator/trace/rules explorer, objection calculator/
decision tree) as two containers behind one host port (**8850**). Designed for
the rsync -> `docker compose up` -> HAProxy path-prefix pattern (same as the
`/karate/` app).

## Quick path: `./deploy.sh`

```bash
./deploy.sh              # rsync + remote docker compose up --build + sanity check
./deploy.sh --sync-only  # rsync only, skip the remote build/restart
./deploy.sh --dry-run    # show what rsync would transfer, change nothing
```

Defaults to `deploy@192.168.1.50:/home/deploy/apps/taxrules/`; override with
`REMOTE_HOST=user@host REMOTE_DIR=/path ./deploy.sh` if needed. The script prints
the one-off HAProxy setup (below) at the end - only needed the first time.

Before rsyncing, the script also refreshes `webapp/rulesets/` with the current
plain-language rulesets and question specs from the repo root (the *Maintain
rules* page serves these for view/download), so the published copies never drift
from the authoritative originals. Edit the root `*.md` files, not the copies.

## Manual steps (what the script does)

### 1. Copy the code to the server

```bash
rsync -av --exclude .git --exclude .venv --exclude .devcontainer \
  --exclude .pytest_cache --exclude __pycache__ --exclude '*.egg-info' \
  /path/to/TaxRulesAsCode/ \
  deploy@192.168.1.50:/home/deploy/apps/taxrules/
```

### 2. Build and start

```bash
ssh deploy@192.168.1.50
cd /home/deploy/apps/taxrules && docker compose -f docker-compose.home.yml up -d --build
```

Sanity check from the server:

```bash
curl -s http://localhost:8850/api/entities | head -c 100   # engine responding
curl -s http://localhost:8850/ | head -c 100                # webapp responding
```

> Note: use `docker-compose.home.yml`, not the default `docker-compose.yml` -
> the default file is the original PoC's Lagoon/amazee.io dev setup and won't
> run on a plain Docker host.

### 3. Route it through HAProxy under `/taxrules/`

Run these one at a time (adjust the anchor line to taste - it just inserts the
`use_backend` rule inside your existing frontend):

Add to frontend:

```bash
sed -i '/use_backend jellyfin/a\  use_backend taxrules if { path_beg /taxrules/ } || { path /taxrules }' /etc/haproxy/haproxy.cfg
```

Add backend at end of file:

```bash
cat >> /etc/haproxy/haproxy.cfg << 'EOF'

backend taxrules
  http-request redirect code 301 location /taxrules/ if { path /taxrules }
  http-request replace-path /taxrules/?(.*) /\1
  server s1 192.168.1.50:8850 check maxconn 30
EOF
```

Validate and reload:

```bash
haproxy -c -f /etc/haproxy/haproxy.cfg && systemctl reload haproxy
```

Then browse to `https://home.simo.id.au/taxrules/`.

The redirect line matters: the webapp uses only relative URLs (so it works
under any prefix), but that requires the browser to be at `/taxrules/` (trailing
slash), not `/taxrules`.

This is a one-off step - both the PAYGI and objection-rights tools already
share the same container/port/path prefix, so adding new pages under `webapp/`
(as happened for the objection calculator and decision tree) never requires
touching HAProxy again.

> Renamed from `/paygi/` to `/taxrules/` on 2026-07-07 to reflect the project's
> broader scope beyond the original PAYGI ruleset. If you have an existing
> `/paygi/` HAProxy rule from a prior deploy, replace it with the `/taxrules/`
> version above (or keep both during a transition window).

## How it fits together

```
browser -- https://home.simo.id.au/taxrules/ --> HAProxy (strips /taxrules)
                                                 |
                                       host port 8850
                                                 |
                                   +-- nginx (web container) --+
                                   |  /            static webapp (webapp/)
                                   |  /api/...  -> proxy -> api container :5000
                                   +----------------------------+
                                                        OpenFisca web API
                                                        (openfisca_rules package:
                                                         PAYGI + objections variables)
```

- One origin, so no CORS config needed.
- The API is also reachable directly at `/taxrules/api/...` (e.g. `/taxrules/api/spec`)
  if you later want other software - or an AI chatbot - to call the engine.

## Updating rules later

1. Edit rules/parameters/tests, run tests locally
   (`openfisca test --country-package openfisca_rules openfisca_rules/tests`).
2. `./deploy.sh` again (or rsync + `docker compose -f docker-compose.home.yml up -d --build`
   manually) - the `api` image bakes the rules in; `webapp/` is a live volume, so
   front-end-only changes just need the rsync (`./deploy.sh --sync-only`).
