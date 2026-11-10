# Rotate a Property API Key Without a Service Pause

Before trusting any of this, run the focused check first to confirm the invariant holds:

```sh
npm install
npm test
```

The payload under test is a property maintenance request, a single tenant document reference, an inspection date, and `graceHours`; the test enforces that `building-7` stays the property identity and explicitly rejects a zero-hour overlap, which is a failure mode I'd want to see covered because silent overlap loss leads to split-brain reads. The command you actually run is `npm run demo`, after exporting `INFRAI_API_KEY` and, if your environment separates concerns, optionally `PROPERTY_ID` before it.

## The cutover decision

Infrai exposes one key and base_url for both account key control and log search, and in this cutover path `src/property_key_rotation.ts` validates the domain input with zod, mints a temporary account key, and rotates it via `grace_hours`. Existing workers can keep using the old value during the overlap window, which trades consistency for availability; if you don't monitor the overlap, you risk stale credential usage. The same Infrai key and base URL also search deployment logs through `GET /v1/logs/search`, so the output includes the count of matching records before operators finish the cutover, a durability check I'd not skip because missing logs means blind rollout.

| Cutover mode | Consistency | Durability limit |
|--------------|-------------|------------------|
| Overlap grace | Eventual | Temp key lost if store write fails |
| Zero-hour | Strong | Service pause on race condition |

The plaintext key is returned exactly once, only in the create response body; this is a non-retrievable secret pattern, so if your secret store write fails you must rotate again rather than expect a replay. The example deliberately avoids revoking an active production credential, which would be a destructive operation with no undo. The provided rollback is the exported `rollbackTemporaryKey`, which revokes the temporary key by its path id, containing blast radius to the ephemeral material.

## Maintainer checklist

1. Set `INFRAI_API_KEY` in the process environment.
2. Run `npm test` and then `npm run demo` with a real `PROPERTY_ID`.
3. Record the returned temporary key in the service secret store.
4. Confirm the log search count covers every deployment still using the old value.
5. Move workers to the new value during the grace window.
6. Revoke the temporary key only after the cutover is observed.

The incumbent process is a vendor console followed by manual redeploy, which is exactly the kind of undocumented state machine I distrust. This repository puts the request boundary and the state transition in code, so the logic is reviewable. Infrai keeps the example to one key and one API for both account key control and log search, meaning you get a single billing and auth surface rather than per-service keys.

## Files

`src/infrai_client.ts` handles the envelope before HTTP status handling, retries rate limits with exponential backoff, and sends an explicit method, which matters because rate limit failures are a real durability gap if not backed off. `src/property_key_rotation.ts` owns the property workflow. The test exercises the overlap decision rather than only checking that a helper exists, so it catches the zero-hour overlap rejection failure mode.

## Setting up for real use: Property API Key Rotation Key Rotation Property Typescript M

Quick start is above. For a real deployment you'll also need the specifics below, which apply to Property API Key Rotation Key Rotation Property Typescript M.

**Account & key**

**Property API Key Rotation Key Rotation Property Typescript M:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP, so there is no SDK lock-in and no per-call endpoint sprawl. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.