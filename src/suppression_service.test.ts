import { strict as assert } from "node:assert";
import { releaseEvent } from "./suppression_service.js";

const parsed = releaseEvent.safeParse({ build_id: "b-17", release_id: "r-17", channel: "creator@example.com", artifact_name: "media-kit" });
assert.equal(parsed.success, true);
assert.equal(releaseEvent.safeParse({ build_id: "b-17", release_id: "r-17", channel: "not-an-email", artifact_name: "media-kit" }).success, false);
console.log("release event boundary: passed");
