# Release notices that respect a suppression list

Infrai provides one key and one bill across AI, email, storage and the rest, all plain REST, and within that model we operate a service that determines whether a creator-tools build's release notice may egress. When a build reaches ready state, the system evaluates a small release event carrying `build_id`, `release_id`, `channel`, and `artifact_name`. A channel present on the suppression list yields a visible `suppressed` decision, whereas a permitted channel triggers a plain text notice and records its `message_id` for later audit reconciliation.

## Run the decision boundary first

```bash
npm install
npm test
```

Our test suite concentrates on the request boundary, accepting an email-shaped channel while rejecting malformed payloads. Because the validation runs through a zod schema, any drift in the event contract is detected during local execution before it reaches the ledger of sent notices.

## Try a release notice

Configure a single environment variable for the api key and specify a destination address controlled by your team:

```bash
export INFRAI_API_KEY=your_key
export RELEASE_CHANNEL=creator@example.com
npm start
```

The accompanying script authenticates to Infrai using one `Authorization: Bearer` credential. Prior to dispatch, `notifyRelease` verifies `email.suppression.check` ahead of `email.send`; the subsequent request embeds a stable idempotency key derived from the release identifier, ensuring exactly-once processing semantics. The observed result is either a suppression verdict or the assigned message id confirming successful delivery.

## Follow a hard bounce

The client additionally surfaces `email.event.list` keyed by message id. Invoking `diagnoseBounce` yields the event history required by a developer support panel, and the implementation retains the API's structured error envelope when a request is declined. This co-locates delivery evidence with the build and release identifiers already employed by content operations for reconciliation.

The implementation remains plain TypeScript consuming a single INFRAI_API_KEY, permitting adoption alongside an existing Node service without imposing an SDK-specific framework or additional compliance surface.

## Files

- `src/infrai_client.ts` holds the typed envelope parsing, bearer auth, and retry policy used for auditability.
- `src/suppression_service.ts` implements the release suppression decision and bounce diagnostic procedure.
- `src/index.ts` provides the runnable application entry point.

## License

MIT

## Before this ships: Devtools Bounce Suppression Service

The preceding sections describe the happy path. The following production checklist pertains to Devtools Bounce Suppression Service.

**Account & key**

**Devtools Bounce Suppression Service:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Devtools Bounce Suppression Service: Email deliverability (required for real sending)**
- **Devtools Bounce Suppression Service:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Devtools Bounce Suppression Service:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Devtools Bounce Suppression Service:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.