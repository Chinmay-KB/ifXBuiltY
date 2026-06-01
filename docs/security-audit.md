# Security audit (pre–public release)

**Date:** 2026-06-01  
**Repository:** ifXbuiltY  
**Mode:** Report-only (no history rewrite)  
**Commits scanned:** 65 (`d86a0bd` at time of audit)

## Scope

| Area | Included |
|------|----------|
| Working tree (tracked + ignored paths scanned on disk where readable) | Yes |
| Full git history (`git log --all -p`) | Yes |
| All objects ever committed (`git rev-list --objects --all`) | Yes |
| `node_modules/`, `.next/` | Excluded from tree scan (not source of truth) |

## Methodology

1. **Filename history** — Listed every path ever committed; searched for `.env`, keys, credentials, PEMs.
2. **Pattern scan (tree)** — `rg` for common secret formats: AWS keys, GitHub tokens, Slack tokens, Google API keys, Stripe-style `sk_*`, JWT blobs, private key headers, Supabase/Dodo/AI Gateway env assignments with non-empty values, DB URLs with embedded passwords.
3. **Pattern scan (history)** — Same patterns over full patch history.
4. **Assignment scan (history)** — `API_KEY=`, `SECRET=`, `TOKEN=`, `PASSWORD=`, `PRIVATE_KEY=` with non-placeholder values.
5. **Code review** — Server/client env usage in `src/`; confirmed secrets read from `process.env` only.
6. **PII / public-surface review** — Hardcoded emails, personal domains in tracked files.

Tools: ripgrep (`rg`), git CLI. `gitleaks` was not installed locally; patterns above cover its common rulesets at a high level.

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| **Confirmed credential leak in git** | 0 | None required |
| **Likely false positives** | 1 | See below |
| **Informational (PII / ops)** | 2 | Optional hardening before/after going public |

**Verdict:** No API keys, tokens, or private keys were found in committed history. Local `.env`, `.env.local`, and `.env.production` exist on disk but are **not tracked** (`.gitignore` blocks `.env*` except `.env.example`).

---

## Findings

### 1. Test fixture password (false positive) — Low

| Field | Value |
|-------|--------|
| **Location** | `src/components/__tests__/email-password-sign-in-form.test.tsx` |
| **Match** | `password: "Passw0rd-test"` |
| **Confidence** | False positive — unit test only |
| **Rotation** | Not applicable |

### 2. Superadmin email in source and migration (informational) — Low

| Field | Value |
|-------|--------|
| **Locations** | `src/lib/admin-constants.ts`, `supabase/migrations/20260528160000_admin_model_test.sql` |
| **Value** | `chinmaykabi@gmail.com` |
| **Also in history** | Yes (introduced in prior commits; visible in `git log -p`) |
| **Risk** | Not a rotatable secret; exposes maintainer email and admin gate identifier to anyone cloning the repo |
| **Recommendation** | Optional: move to `SUPERADMIN_EMAIL` env var and use `auth.jwt() ->> 'email' = current_setting('app.superadmin_email')` or RLS based on a `admin_users` table. Footer link to chinmaykabi.com is intentional public attribution. |

### 3. Public footer / site URL (informational) — None

| Field | Value |
|-------|--------|
| **Location** | `src/app/layout.tsx` |
| **Value** | Link to https://chinmaykabi.com |
| **Note** | Expected for a personal OSS project; not a secret. |

---

## Negative results (checks that passed)

- **`.env` / `.env.local` / `.env.production` in git history:** Never committed (`git log --full-history` empty for those paths).
- **Only env file in history:** `.env.example` (placeholders empty).
- **Private keys / PEMs in history:** None found.
- **AWS `AKIA*`, GitHub `ghp_*` / `github_pat_*`, Slack `xox*`, Google `AIza*`:** None in tree or history.
- **Hardcoded `SUPABASE_SERVICE_ROLE_KEY`, `AI_GATEWAY_API_KEY`, `DODO_PAYMENTS_*` values:** None in tree or history (only references in `.env.example` and `process.env` reads).
- **Connection strings with passwords:** None in tree or history.
- **URLs with `?token=` / `?api_key=`:** None in tree.

## Local-only files (not in git; do not publish)

These exist on the maintainer machine and must stay untracked:

- `.env`
- `.env.local`
- `.env.production`

Confirm they remain ignored before `git push` to a public remote.

## Rotation checklist (if you ever find a leak later)

Use this if a future scan or incident exposes real credentials:

| Secret | Where to rotate |
|--------|------------------|
| Supabase **service_role** | Supabase Dashboard → Project Settings → API → reset service role key |
| Supabase **anon/publishable** | Same; update env in Vercel/local |
| **AI Gateway** | Vercel → AI Gateway / regenerate `AI_GATEWAY_API_KEY` |
| **Dodo Payments** | Dodo Dashboard → Developers → API Keys & webhook secret |
| **Google OAuth** (Supabase provider) | Google Cloud Console → Credentials |
| **Vercel OIDC** | `vercel env pull` after rotation |

After rotation: update Vercel env vars, local `.env.local`, and redeploy. History rewrite (`git filter-repo` / BFG) only if the secret was **committed**; not needed for this audit’s outcome.

## Optional hygiene (not required for “no leaks”)

- Remove or relocate internal planning artifacts if you want a cleaner public tree: `DESIGN_PLAN.md`, `TECHNICAL_PLAN.md`, `.kiro/`, `agent.md` (still useful for contributors; README no longer links them).
- Add `license` field to `package.json`: `"MIT"` (metadata only).
- Run [gitleaks](https://github.com/gitleaks/gitleaks) in CI on push for ongoing protection.

## Re-scan command

From repo root (after any doc/code changes):

```bash
rg -n --hidden --glob '!.git/**' --glob '!node_modules/**' --glob '!.next/**' \
  "(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36,}|sk_(live|test|proj)_[A-Za-z0-9]{20,}|-----BEGIN .*PRIVATE KEY-----)" .

git log --all -p | rg -n "(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36,}|sk_(live|test|proj)_[A-Za-z0-9]{20,})"
```

Empty output on both commands is the expected healthy state.
