from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from ifxbuilty_tools import AutomationStore


class AutomationStoreTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.store = AutomationStore(Path(self.temp_dir.name) / "state.json")

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_complete_approval_gated_trigger_flow(self) -> None:
        discovered = self.store.discover_candidates(
            "payments", ["web", "reddit"], 1, "discover-1"
        )
        candidate_id = discovered["candidates"][0]["id"]

        researched = self.store.research_candidate(
            candidate_id, "quick", "research-1"
        )
        research_id = researched["research"]["id"]

        drafted = self.store.create_entry_draft(research_id, "draft-1")
        draft_id = drafted["draft"]["id"]

        images = self.store.generate_image_variants(draft_id, 2, "images-1")
        self.assertEqual(len(images["images"]), 2)

        approval = self.store.approve_entry(draft_id, "looks fine", "approve-1")
        published = self.store.publish_entry(
            draft_id, approval["approval_id"], True, "publish-1"
        )
        self.assertEqual(published["publication"]["status"], "verified_trigger")

        tweet = self.store.draft_tweet(draft_id, "tweet-1")
        tweet_id = tweet["tweet"]["id"]
        tweet_approval = self.store.approve_tweet(
            tweet_id, "looks fine", "tweet-approve-1"
        )
        tweet_published = self.store.publish_tweet(
            tweet_id,
            tweet_approval["approval_id"],
            True,
            "tweet-publish-1",
        )
        self.assertEqual(
            tweet_published["publication"]["status"], "verified_trigger"
        )

        preview = self.store.get_entry_preview(draft_id)
        self.assertEqual(preview["draft"]["status"], "publish_verified")
        status = self.store.get_job_status(published["job_id"])
        self.assertEqual(status["job"]["status"], "completed")
        self.assertEqual(len(self.store.list_recent_activity()["events"]), 9)

    def test_idempotency_replays_the_original_result(self) -> None:
        first = self.store.discover_candidates("design", ["web"], 1, "same-key")
        second = self.store.discover_candidates("ignored", ["news"], 5, "same-key")
        self.assertFalse(first["replayed"])
        self.assertTrue(second["replayed"])
        self.assertEqual(first["job_id"], second["job_id"])
        self.assertEqual(first["candidates"], second["candidates"])

    def test_publish_rejects_wrong_approval_token(self) -> None:
        discovered = self.store.discover_candidates("devtools", ["web"], 1, "d")
        researched = self.store.research_candidate(
            discovered["candidates"][0]["id"], "quick", "r"
        )
        drafted = self.store.create_entry_draft(researched["research"]["id"], "e")
        with self.assertRaisesRegex(ValueError, "approval_id"):
            self.store.publish_entry(
                drafted["draft"]["id"], "wrong", True, "publish"
            )


if __name__ == "__main__":
    unittest.main()
