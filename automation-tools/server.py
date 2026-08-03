from __future__ import annotations

import os
from typing import Annotated

from mcp.server.fastmcp import FastMCP
from pydantic import Field

from ifxbuilty_tools import AutomationStore


STATE_PATH = os.environ.get(
    "IFXBUILTY_STATE_PATH",
    "/data/.hermes/ifxbuilty-tools/state.json",
)

mcp = FastMCP(
    "ifxbuilty",
    instructions=(
        "Use these tools for all ifXBuiltY discovery, research, entry, image, "
        "approval, website publication and X/Twitter publication requests. "
        "Never invent IDs: pass IDs returned by the preceding tool. Publication "
        "tools require the exact approval_id returned by the approval tool."
    ),
)
store = AutomationStore(STATE_PATH)


@mcp.tool()
def discover_candidates(
    query: Annotated[str, Field(description="Theme, market, company or product to scout")],
    sources: Annotated[
        list[str],
        Field(description="Source names such as web, reddit, producthunt or news"),
    ] = ["web"],
    limit: Annotated[int, Field(ge=1, le=10)] = 3,
    idempotency_key: Annotated[
        str,
        Field(description="Unique caller-provided key; reuse it to safely retry"),
    ] = "discover-default",
) -> dict:
    """Discover company or product candidates and persist them."""
    return store.discover_candidates(query, sources, limit, idempotency_key)


@mcp.tool()
def research_candidate(
    candidate_id: Annotated[str, Field(description="Candidate ID or direct company name")],
    depth: Annotated[str, Field(description="Research depth: quick, standard or deep")] = "quick",
    idempotency_key: str = "research-default",
) -> dict:
    """Run the research trigger for one candidate."""
    return store.research_candidate(candidate_id, depth, idempotency_key)


@mcp.tool()
def create_entry_draft(
    research_id: Annotated[str, Field(description="Research ID returned by research_candidate")],
    idempotency_key: str = "entry-draft-default",
) -> dict:
    """Create a website-entry draft from completed research."""
    return store.create_entry_draft(research_id, idempotency_key)


@mcp.tool()
def generate_image_variants(
    draft_id: Annotated[str, Field(description="Entry draft ID")],
    count: Annotated[int, Field(ge=1, le=4)] = 2,
    idempotency_key: str = "images-default",
) -> dict:
    """Trigger image variants for an entry draft."""
    return store.generate_image_variants(draft_id, count, idempotency_key)


@mcp.tool()
def get_entry_preview(
    draft_id: Annotated[str, Field(description="Entry draft ID")],
) -> dict:
    """Return the complete current entry preview and state."""
    return store.get_entry_preview(draft_id)


@mcp.tool()
def approve_entry(
    draft_id: Annotated[str, Field(description="Entry draft ID")],
    approval_note: str = "Approved by user",
    idempotency_key: str = "entry-approval-default",
) -> dict:
    """Approve one entry and return the approval token required for publishing."""
    return store.approve_entry(draft_id, approval_note, idempotency_key)


@mcp.tool()
def publish_entry(
    draft_id: Annotated[str, Field(description="Approved entry draft ID")],
    approval_id: Annotated[str, Field(description="Exact token returned by approve_entry")],
    dry_run: Annotated[
        bool,
        Field(description="True verifies the trigger without touching the live website"),
    ] = True,
    idempotency_key: str = "entry-publish-default",
) -> dict:
    """Publish an approved entry; dry-run is the safe default."""
    return store.publish_entry(draft_id, approval_id, dry_run, idempotency_key)


@mcp.tool()
def draft_tweet(
    draft_id: Annotated[str, Field(description="Entry draft ID")],
    idempotency_key: str = "tweet-draft-default",
) -> dict:
    """Create an X/Twitter post draft for an entry."""
    return store.draft_tweet(draft_id, idempotency_key)


@mcp.tool()
def approve_tweet(
    tweet_id: Annotated[str, Field(description="Tweet draft ID")],
    approval_note: str = "Approved by user",
    idempotency_key: str = "tweet-approval-default",
) -> dict:
    """Approve a tweet and return the token required for publishing."""
    return store.approve_tweet(tweet_id, approval_note, idempotency_key)


@mcp.tool()
def publish_tweet(
    tweet_id: Annotated[str, Field(description="Approved tweet draft ID")],
    approval_id: Annotated[str, Field(description="Exact token returned by approve_tweet")],
    dry_run: Annotated[
        bool,
        Field(description="True verifies the trigger without posting to X"),
    ] = True,
    idempotency_key: str = "tweet-publish-default",
) -> dict:
    """Publish an approved tweet; dry-run is the safe default."""
    return store.publish_tweet(tweet_id, approval_id, dry_run, idempotency_key)


@mcp.tool()
def get_job_status(
    job_id: Annotated[str, Field(description="Job ID returned by a mutating tool")],
) -> dict:
    """Return authoritative status and result for one tool job."""
    return store.get_job_status(job_id)


@mcp.tool()
def list_recent_activity(
    limit: Annotated[int, Field(ge=1, le=100)] = 20,
) -> dict:
    """List recent tool triggers for auditing and verification."""
    return store.list_recent_activity(limit)


def main() -> None:
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
