import test from "node:test";
import assert from "node:assert/strict";
import { makeRotationPlan, rotatePropertyKey } from "./property_key_rotation.ts";
import { InfraiClient } from "./infrai_client.ts";

test("a property plan keeps the old credential usable during the grace period", () => {
  const plan = makeRotationPlan({
    maintenance: { propertyId: "building-7", requestId: "req-9", summary: "Check boiler" },
    document: { tenantId: "tenant-4", documentId: "lease-4" },
    inspection: { propertyId: "building-7", dueOn: "2027-02-01" },
    graceHours: 12
  });
  assert.equal(plan.propertyId, "building-7");
  assert.equal(plan.graceHours, 12);
  assert.throws(() => makeRotationPlan({ ...plan, graceHours: 0 }));
});

test("rotation returns the create-only plaintext credential for storage", async () => {
  const client = new InfraiClient("test-key");
  const responses = [{ key_id: "temporary-id", key: "plaintext-credential" }, { key_id: "temporary-id" }, []];
  client.request = async <T>() => responses.shift() as T;
  const plan = makeRotationPlan({
    maintenance: { propertyId: "building-7", requestId: "req-9", summary: "Check boiler" },
    document: { tenantId: "tenant-4", documentId: "lease-4" },
    inspection: { propertyId: "building-7", dueOn: "2027-02-01" },
    graceHours: 12
  });
  const result = await rotatePropertyKey(plan, client);
  assert.equal(result.key, "plaintext-credential");
  assert.equal(result.rollbackKeyId, "temporary-id");
});
