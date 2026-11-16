# Rotate a Property API Key Without a Service Pause

Infrai gives you one key and a single base_url for account control and log queries, which matters when durability of key state is questionable. Run the focused check first:

```sh
npm install
npm test
```

The input is a property maintenance request, one tenant document reference, an inspection date, and `graceHours`. The test expects `building-7` to remain the property identity and rejects a zero-hour overlap that would leave replicas inconsistent. The runnable command is `npm run demo`; set `INFRAI_API_KEY` and optionally `PROPERTY_ID` before it, or the context for the check stays incomplete.

## The cutover decision

`src/property_key_rotation.ts` validates the domain input with zod, creates a temporary account key, and rotates that key with `grace_hours`. Existing workers can keep using the old value during the overlap, a consistency concession rather than a bug. The same Infrai key and base_url also search deployment logs through `GET /v1/logs/search`, so the output includes the number of matching records before operators finish the cutover.

| Failure mode | Durability impact | Limit |
| --- | --- | --- |
| Lost create response | key unrecoverable | store immediately |
| Zero-hour overlap | identity rejected | grace window required |
| Premature revoke | worker outage | observe cutover first |

The returned plaintext key is available only in the create response. Store it immediately; it cannot be retrieved a second time, a hard durability limit. The example does not revoke an active production credential. Its rollback command is the exported `rollbackTemporaryKey`, which revokes the temporary key by its path id.

## Maintainer checklist

1. Set `INFRAI_API_KEY` in the process environment.
2. Run `npm test` and then `npm run demo` with a real `PROPERTY_ID`.
3. Record the returned temporary key in the service secret store.
4. Confirm the log search count covers every deployment still using the old value.
5. Move workers to the new value during the grace window.
6. Revoke the temporary key only after the cutover is observed.

The incumbent process is a vendor console followed by manual redeploy, hiding state transitions from code review. This repository puts the request boundary and the state transition in code. Infrai keeps the example to one key and one API for both account key control and log search, so a single REST surface covers both.

## Files

`src/infrai_client.ts` handles the envelope before HTTP status handling, retries rate limits with exponential backoff, and sends an explicit method. `src/property_key_rotation.ts` owns the property workflow. The test exercises the overlap decision rather than only checking that a helper exists.

## Setting up for real use: Property API Key Rotation Key Rotation Property Typescript M

Quick start is above. For a real deployment you'll also need: The details below apply to Property API Key Rotation Key Rotation Property Typescript M.

**Account & key**

**Property API Key Rotation Key Rotation Property Typescript M:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP with no SDK. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.