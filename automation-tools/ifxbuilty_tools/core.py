from __future__ import annotations

import json
import os
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


class AutomationStore:
    """Small durable state machine used by the MCP transport.

    This first version intentionally records deterministic trigger results.
    Real research, image, website and X adapters can replace the placeholder
    result builders without changing the MCP schemas Hermes learns.
    """

    def __init__(self, state_path: str | os.PathLike[str]) -> None:
        self.state_path = Path(state_path)
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.state_path.exists():
            self._write(
                {
                    "schema_version": 1,
                    "candidates": {},
                    "research": {},
                    "drafts": {},
                    "tweets": {},
                    "jobs": {},
                    "idempotency": {},
                    "events": [],
                }
            )

    def _read(self) -> dict[str, Any]:
        return json.loads(self.state_path.read_text(encoding="utf-8"))

    def _write(self, state: dict[str, Any]) -> None:
        fd, temporary_path = tempfile.mkstemp(
            dir=self.state_path.parent,
            prefix=f".{self.state_path.name}.",
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(state, handle, indent=2, sort_keys=True)
                handle.write("\n")
            os.replace(temporary_path, self.state_path)
        finally:
            if os.path.exists(temporary_path):
                os.unlink(temporary_path)

    def _run(
        self,
        tool: str,
        idempotency_key: str,
        operation: Callable[[dict[str, Any], str], dict[str, Any]],
    ) -> dict[str, Any]:
        state = self._read()
        lookup = f"{tool}:{idempotency_key}"
        existing_job_id = state["idempotency"].get(lookup)
        if existing_job_id:
            existing = state["jobs"][existing_job_id]
            return {**existing["result"], "job_id": existing_job_id, "replayed": True}

        job_id = _id("job")
        result = operation(state, job_id)
        state["jobs"][job_id] = {
            "id": job_id,
            "tool": tool,
            "status": "completed",
            "created_at": _now(),
            "result": result,
        }
        state["idempotency"][lookup] = job_id
        state["events"].append(
            {
                "at": _now(),
                "job_id": job_id,
                "tool": tool,
                "summary": result.get("message", "completed"),
            }
        )
        state["events"] = state["events"][-200:]
        self._write(state)
        return {**result, "job_id": job_id, "replayed": False}

    def discover_candidates(
        self,
        query: str,
        sources: list[str],
        limit: int,
        idempotency_key: str,
    ) -> dict[str, Any]:
        limit = max(1, min(limit, 10))

        def operation(state: dict[str, Any], _job_id: str) -> dict[str, Any]:
            candidates = []
            source_names = sources or ["web"]
            for index in range(limit):
                candidate_id = _id("candidate")
                candidate = {
                    "id": candidate_id,
                    "name": f"{query.strip() or 'company'} candidate {index + 1}",
                    "sources": source_names,
                    "status": "discovered",
                    "created_at": _now(),
                }
                state["candidates"][candidate_id] = candidate
                candidates.append(candidate)
            return {
                "message": f"Discovered {len(candidates)} candidate triggers",
                "candidates": candidates,
            }

        return self._run("discover_candidates", idempotency_key, operation)

    def research_candidate(
        self,
        candidate_id: str,
        depth: str,
        idempotency_key: str,
    ) -> dict[str, Any]:
        def operation(state: dict[str, Any], _job_id: str) -> dict[str, Any]:
            candidate = state["candidates"].get(candidate_id)
            if candidate is None:
                candidate = {
                    "id": candidate_id,
                    "name": candidate_id,
                    "sources": ["direct-request"],
                    "status": "discovered",
                    "created_at": _now(),
                }
                state["candidates"][candidate_id] = candidate
            research_id = _id("research")
            research = {
                "id": research_id,
                "candidate_id": candidate_id,
                "candidate_name": candidate["name"],
                "depth": depth,
                "status": "completed",
                "summary": f"Trigger-only research summary for {candidate['name']}.",
                "sources": candidate["sources"],
                "created_at": _now(),
            }
            state["research"][research_id] = research
            candidate["status"] = "researched"
            return {
                "message": f"Research trigger completed for {candidate['name']}",
                "research": research,
            }

        return self._run("research_candidate", idempotency_key, operation)

    def create_entry_draft(
        self,
        research_id: str,
        idempotency_key: str,
    ) -> dict[str, Any]:
        def operation(state: dict[str, Any], _job_id: str) -> dict[str, Any]:
            research = state["research"].get(research_id)
            if research is None:
                raise ValueError(f"Unknown research_id: {research_id}")
            draft_id = _id("draft")
            draft = {
                "id": draft_id,
                "research_id": research_id,
                "title": f"What if {research['candidate_name']} built a new product?",
                "body": research["summary"],
                "status": "drafted",
                "images": [],
                "approval_id": None,
                "publication": None,
                "created_at": _now(),
            }
            state["drafts"][draft_id] = draft
            return {
                "message": f"Created entry draft {draft_id}",
                "draft": draft,
            }

        return self._run("create_entry_draft", idempotency_key, operation)

    def generate_image_variants(
        self,
        draft_id: str,
        count: int,
        idempotency_key: str,
    ) -> dict[str, Any]:
        count = max(1, min(count, 4))

        def operation(state: dict[str, Any], _job_id: str) -> dict[str, Any]:
            draft = state["drafts"].get(draft_id)
            if draft is None:
                raise ValueError(f"Unknown draft_id: {draft_id}")
            images = [
                {
                    "id": _id("image"),
                    "status": "placeholder_generated",
                    "url": f"ifxbuilty-placeholder://{draft_id}/{index + 1}",
                }
                for index in range(count)
            ]
            draft["images"] = images
            draft["status"] = "images_ready"
            return {
                "message": f"Generated {len(images)} placeholder image triggers",
                "draft_id": draft_id,
                "images": images,
            }

        return self._run("generate_image_variants", idempotency_key, operation)

    def get_entry_preview(self, draft_id: str) -> dict[str, Any]:
        state = self._read()
        draft = state["drafts"].get(draft_id)
        if draft is None:
            raise ValueError(f"Unknown draft_id: {draft_id}")
        return {
            "message": f"Preview for {draft_id}",
            "draft": draft,
        }

    def approve_entry(
        self,
        draft_id: str,
        approval_note: str,
        idempotency_key: str,
    ) -> dict[str, Any]:
        def operation(state: dict[str, Any], _job_id: str) -> dict[str, Any]:
            draft = state["drafts"].get(draft_id)
            if draft is None:
                raise ValueError(f"Unknown draft_id: {draft_id}")
            approval_id = _id("entry-approval")
            draft["approval_id"] = approval_id
            draft["approval_note"] = approval_note
            draft["status"] = "approved"
            return {
                "message": f"Approved entry draft {draft_id}",
                "draft_id": draft_id,
                "approval_id": approval_id,
            }

        return self._run("approve_entry", idempotency_key, operation)

    def publish_entry(
        self,
        draft_id: str,
        approval_id: str,
        dry_run: bool,
        idempotency_key: str,
    ) -> dict[str, Any]:
        def operation(state: dict[str, Any], _job_id: str) -> dict[str, Any]:
            draft = state["drafts"].get(draft_id)
            if draft is None:
                raise ValueError(f"Unknown draft_id: {draft_id}")
            if draft.get("approval_id") != approval_id:
                raise ValueError("approval_id does not match the approved entry")
            publication_id = _id("publication")
            publication = {
                "id": publication_id,
                "mode": "dry_run" if dry_run else "trigger_only",
                "status": "verified_trigger" if dry_run else "queued_for_site_adapter",
                "created_at": _now(),
            }
            draft["publication"] = publication
            draft["status"] = "publish_verified" if dry_run else "publish_queued"
            return {
                "message": f"Entry publish trigger accepted for {draft_id}",
                "draft_id": draft_id,
                "publication": publication,
            }

        return self._run("publish_entry", idempotency_key, operation)

    def draft_tweet(
        self,
        draft_id: str,
        idempotency_key: str,
    ) -> dict[str, Any]:
        def operation(state: dict[str, Any], _job_id: str) -> dict[str, Any]:
            draft = state["drafts"].get(draft_id)
            if draft is None:
                raise ValueError(f"Unknown draft_id: {draft_id}")
            tweet_id = _id("tweet")
            tweet = {
                "id": tweet_id,
                "draft_id": draft_id,
                "text": f"{draft['title']} See the experiment on ifXBuiltY.",
                "status": "drafted",
                "approval_id": None,
                "publication": None,
                "created_at": _now(),
            }
            state["tweets"][tweet_id] = tweet
            return {
                "message": f"Created tweet draft {tweet_id}",
                "tweet": tweet,
            }

        return self._run("draft_tweet", idempotency_key, operation)

    def approve_tweet(
        self,
        tweet_id: str,
        approval_note: str,
        idempotency_key: str,
    ) -> dict[str, Any]:
        def operation(state: dict[str, Any], _job_id: str) -> dict[str, Any]:
            tweet = state["tweets"].get(tweet_id)
            if tweet is None:
                raise ValueError(f"Unknown tweet_id: {tweet_id}")
            approval_id = _id("tweet-approval")
            tweet["approval_id"] = approval_id
            tweet["approval_note"] = approval_note
            tweet["status"] = "approved"
            return {
                "message": f"Approved tweet {tweet_id}",
                "tweet_id": tweet_id,
                "approval_id": approval_id,
            }

        return self._run("approve_tweet", idempotency_key, operation)

    def publish_tweet(
        self,
        tweet_id: str,
        approval_id: str,
        dry_run: bool,
        idempotency_key: str,
    ) -> dict[str, Any]:
        def operation(state: dict[str, Any], _job_id: str) -> dict[str, Any]:
            tweet = state["tweets"].get(tweet_id)
            if tweet is None:
                raise ValueError(f"Unknown tweet_id: {tweet_id}")
            if tweet.get("approval_id") != approval_id:
                raise ValueError("approval_id does not match the approved tweet")
            publication_id = _id("social-publication")
            publication = {
                "id": publication_id,
                "mode": "dry_run" if dry_run else "trigger_only",
                "status": "verified_trigger" if dry_run else "queued_for_x_adapter",
                "created_at": _now(),
            }
            tweet["publication"] = publication
            tweet["status"] = "publish_verified" if dry_run else "publish_queued"
            return {
                "message": f"Tweet publish trigger accepted for {tweet_id}",
                "tweet_id": tweet_id,
                "publication": publication,
            }

        return self._run("publish_tweet", idempotency_key, operation)

    def get_job_status(self, job_id: str) -> dict[str, Any]:
        state = self._read()
        job = state["jobs"].get(job_id)
        if job is None:
            raise ValueError(f"Unknown job_id: {job_id}")
        return {"message": f"Job {job_id} is {job['status']}", "job": job}

    def list_recent_activity(self, limit: int = 20) -> dict[str, Any]:
        state = self._read()
        limit = max(1, min(limit, 100))
        return {
            "message": f"Returning {min(limit, len(state['events']))} recent events",
            "events": state["events"][-limit:],
        }
