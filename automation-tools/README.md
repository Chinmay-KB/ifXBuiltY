# ifXBuiltY Hermes tools

This directory contains the first trigger-focused MCP server for the
Railway-hosted Hermes agent. It intentionally prioritizes stable tool schemas,
approval gates, idempotency and auditable state over content quality.

## Tools

- `discover_candidates`
- `research_candidate`
- `create_entry_draft`
- `generate_image_variants`
- `get_entry_preview`
- `approve_entry`
- `publish_entry`
- `draft_tweet`
- `approve_tweet`
- `publish_tweet`
- `get_job_status`
- `list_recent_activity`

`publish_entry` and `publish_tweet` default to `dry_run=true`. In the trigger
phase, `dry_run=false` records a queued adapter action but does not yet modify
the live website or post to X.

The stable MCP schemas are the contract. Later adapters will replace the
placeholder research, image, website and X implementations without changing
how Hermes invokes the tools.

## Local core tests

```bash
cd automation-tools
PYTHONPATH=. python3 -m unittest discover -s tests -v
```

## Hermes deployment

The persistent Railway installation lives at:

```text
/data/.hermes/ifxbuilty-tools
```

Hermes connects to `server.py` as a local stdio MCP server. State is stored at
`/data/.hermes/ifxbuilty-tools/state.json`.

The server is registered in Hermes as `ifxbuilty`, with all tools enabled for
both CLI and Telegram sessions.

## Trigger verification

The initial live verification completed on 2026-07-26:

- Hermes discovered all 12 MCP tools.
- A Hermes chat called all 12 tools in dependency order.
- Entry and tweet publication both returned `verified_trigger` in dry-run mode.
- A Telegram-sourced Hermes chat called `list_recent_activity` and read the
  persisted tweet trigger jobs.

This verifies routing and state transitions only. It intentionally does not
claim that research or image content is production quality, nor that the live
website or X adapters are connected.
