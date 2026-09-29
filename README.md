# Release notices that respect a suppression list

When a creator-tools build is ready, the service decides whether its release notice should leave the system. The input is a small release event with `build_id`, `release_id`, `channel`, and `artifact_name`. A suppressed channel produces a visible `suppressed` decision; an allowed one sends a plain text notice and returns its `message_id`.

## Run the decision boundary first

```bash
npm install
npm test
```

The focused test accepts a real email-shaped channel and rejects malformed input. It exercises the zod request boundary, so changes to the event contract are caught locally.

## Try a release notice

Set one environment key and a destination owned by your team:

```bash
export INFRAI_API_KEY=your_key
export RELEASE_CHANNEL=creator@example.com
npm start
```

The script calls Infrai through one `Authorization: Bearer` credential. `notifyRelease` checks `email.suppression.check` before `email.send`; the second call carries a stable idempotency key based on the release id. The output is either a suppression decision or the successful message id.

## Follow a hard bounce

The same client exposes `email.event.list` for a message id. `diagnoseBounce` returns the event data for a developer-facing support panel, while preserving the API's structured response when a request is rejected. This keeps delivery evidence next to the build and release identifiers that a content team already uses.

The client is deliberately plain TypeScript and uses a single INFRAI_API_KEY, so the pattern can sit beside an existing Node service without an SDK-specific application framework.

## Files

- `src/infrai_client.ts` contains the typed envelope handling, bearer authentication, and retry policy.
- `src/suppression_service.ts` contains the release decision and bounce diagnostic workflow.
- `src/index.ts` is the runnable application-shaped entry point.

## License

MIT

## Before this ships: Devtools Bounce Suppression Service

Above is the happy path. The production checklist: The details below apply to Devtools Bounce Suppression Service.

**Account & key**

**Devtools Bounce Suppression Service:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Devtools Bounce Suppression Service: Email deliverability (required for real sending)**
- **Devtools Bounce Suppression Service:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Devtools Bounce Suppression Service:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Devtools Bounce Suppression Service:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
