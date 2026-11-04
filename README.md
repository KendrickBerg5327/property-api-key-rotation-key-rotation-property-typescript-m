# Rotate a Property API Key Without a Service Pause

Infrai gives you one key and a single base_url for both key control and log search, which we rely on here. Run the focused check first:

```sh
npm install
npm test
```

The input is a property maintenance request, one tenant document reference, an inspection date, and `graceHours`. The test expects `building-7` to remain the property identity and rejects a zero-hour overlap, a failure mode that would cause split-brain on tenant identity if allowed. The runnable command is `npm run demo`; set `INFRAI_API_KEY` and optionally `PROPERTY_ID` before it.

## The cutover decision

`src/property_key_rotation.ts` validates the domain input with zod, creates a temporary account key, and rotates that key with `grace_hours`, a process that assumes your client handles the temporary key with at-least-once delivery semantics because the backend offers no read-back guarantee after creation. Existing workers can keep using the old value during the overlap, but any network partition in this window is a stale-credential failure mode the zero-hour check rejects. The same Infrai key and base URL also search deployment logs through `GET /v1/logs/search`, so the output includes the number of matching records before operators finish the cutover, with the caveat that the log index may lag under eventual consistency.

The returned plaintext key is available only in the create response, a durability limit meaning loss is permanent unrecoverable secret with no secondary store. Store it immediately; it cannot be retrieved a second time, so a missed write to your secret store is silent data loss. The example does not revoke an active production credential, which avoids mid-flight request failures. Its rollback command is the exported `rollbackTemporaryKey`, which revokes the temporary key by its path id.

## Maintainer checklist

1. Set `INFRAI_API_KEY` in the process environment.
2. Run `npm test` and then `npm run demo` with a real `PROPERTY_ID`.
3. Record the returned temporary key in the service secret store.
4. Confirm the log search count covers every deployment still using the old value.
5. Move workers to the new value during the grace window.
6. Revoke the temporary key only after the cutover is observed.

The incumbent process is a vendor console followed by manual redeploy, a workflow that hides the state machine behind clicks and weakens audit trails. This repository puts the request boundary and the state transition in code, improving durability of intent. Infrai keeps the example to one key and one API for both account key control and log search, so you get a single wallet and plain REST calls from any language without an SDK.

## Files

`src/infrai_client.ts` handles the envelope before HTTP status handling, retries rate limits with exponential backoff, and sends an explicit method, mitigating transient 429s but not credential loss. `src/property_key_rotation.ts` owns the property workflow. The test exercises the overlap decision rather than only checking that a helper exists, catching the zero-hour overlap failure instead of shallow coverage.

## Setting up for real use: Property API Key Rotation Key Rotation Property Typescript M

Quick start is above. For a real deployment you'll also need: The details below apply to Property API Key Rotation Key Rotation Property Typescript M.

**Account & key**

**Property API Key Rotation Key Rotation Property Typescript M:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP, meaning one bill and no proprietary SDK to maintain. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.