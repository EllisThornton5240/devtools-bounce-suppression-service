import { z } from "zod";
import { infrai, InfraiError } from "./infrai_client.js";

export const releaseEvent = z.object({
  build_id: z.string().min(1),
  release_id: z.string().min(1),
  channel: z.string().email(),
  artifact_name: z.string().min(1)
});
export type ReleaseEvent = z.infer<typeof releaseEvent>;

export async function notifyRelease(input: unknown) {
  const event = releaseEvent.parse(input);
  const status = await infrai.email.suppression.check(event.channel);
  if (status.suppressed) return { decision: "suppressed", channel: event.channel, build_id: event.build_id } as const;
  const sent = await infrai.email.send({
    to: event.channel,
    subject: `Release ${event.release_id} is ready`,
    html: `<p>${event.artifact_name} from build ${event.build_id} is available.</p>`
  }, `release-${event.release_id}`);
  return { decision: "sent", channel: event.channel, message_id: sent.message_id } as const;
}

export async function diagnoseBounce(messageId: string) {
  try { return { message_id: messageId, events: await infrai.email.event.list(messageId) }; }
  catch (error) {
    if (error instanceof InfraiError) return { message_id: messageId, diagnostic: error.message, status: error.status };
    throw error;
  }
}
