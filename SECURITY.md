# Security

## Reporting a vulnerability

If you believe you have found a security issue, please **do not** open a public GitHub issue with exploit details.

Instead, report it privately to the maintainer via the contact link on [chinmaykabi.com](https://chinmaykabi.com) (or the email listed in your fork’s maintainer metadata once published).

Include:

- A clear description of the issue
- Steps to reproduce
- Impact assessment (if known)
- Any suggested fix (optional)

We will acknowledge receipt and work on a fix as soon as practical.

## Secrets and credentials

This project expects secrets only in environment variables (see `.env.example`). Never commit `.env`, `.env.local`, API keys, or service-role keys.

If you accidentally expose credentials in a fork or PR, rotate them immediately in the relevant provider dashboards (Supabase, Vercel AI Gateway, Dodo Payments, etc.).

## Security audit

A pre-open-source scan report lives in [docs/security-audit.md](./docs/security-audit.md).
