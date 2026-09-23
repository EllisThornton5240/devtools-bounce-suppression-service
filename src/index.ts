import { notifyRelease } from "./suppression_service.js";

const channel = process.env.RELEASE_CHANNEL;
if (!channel) throw new Error("RELEASE_CHANNEL is required");
const result = await notifyRelease({ build_id: "build-local", release_id: "release-local", channel, artifact_name: "creator-dashboard" });
console.log(JSON.stringify(result, null, 2));
