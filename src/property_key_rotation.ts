import { randomUUID } from "node:crypto";
import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const maintenanceRequest = z.object({
  propertyId: z.string().min(1),
  requestId: z.string().min(1),
  summary: z.string().min(1)
});
export const tenantDocument = z.object({ tenantId: z.string().min(1), documentId: z.string().min(1) });
export const inspectionReminder = z.object({ propertyId: z.string().min(1), dueOn: z.string().date() });

export type RotationPlan = {
  propertyId: string;
  maintenance: z.infer<typeof maintenanceRequest>;
  document: z.infer<typeof tenantDocument>;
  inspection: z.infer<typeof inspectionReminder>;
  graceHours: number;
};

export function makeRotationPlan(input: unknown): RotationPlan {
  const value = z.object({ maintenance: maintenanceRequest, document: tenantDocument, inspection: inspectionReminder, graceHours: z.number().int().positive() }).parse(input);
  return {
    propertyId: value.maintenance.propertyId,
    maintenance: value.maintenance,
    document: value.document,
    inspection: value.inspection,
    graceHours: value.graceHours
  };
}

export async function rotatePropertyKey(plan: RotationPlan, client = new InfraiClient()): Promise<{ keyId: string; key: string; logMatches: number; rollbackKeyId: string }> {
  const created = await client.request<{ key_id: string; key?: string }>("/v1/account/keys/create", "POST", {
    name: `property-${plan.propertyId}-rotation-${randomUUID()}`,
    scopes: ["account"]
  });
  if (!created.key_id) throw new Error("The temporary key response did not include a key_id");
  if (!created.key) throw new Error("The temporary key response did not include a plaintext key");
  const rotated = await client.request<{ key_id: string }>(`/v1/account/keys/rotate/${created.key_id}`, "POST", {
    grace_hours: plan.graceHours,
    idempotency_key: `rotate-${plan.propertyId}-${plan.maintenance.requestId}`
  });
  const logs = await client.request<unknown[]>("/v1/logs/search", "GET", undefined, { q: `property=${plan.propertyId}` });
  return { keyId: rotated.key_id, key: created.key, logMatches: Array.isArray(logs) ? logs.length : 0, rollbackKeyId: created.key_id };
}

export async function rollbackTemporaryKey(keyId: string, client = new InfraiClient()): Promise<void> {
  await client.request(`/v1/account/keys/revoke/${keyId}`, "DELETE");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const plan = makeRotationPlan({
    maintenance: { propertyId: process.env.PROPERTY_ID ?? "demo-property", requestId: "maintenance-001", summary: "Repair lift sensor" },
    document: { tenantId: "tenant-001", documentId: "lease-001" },
    inspection: { propertyId: process.env.PROPERTY_ID ?? "demo-property", dueOn: "2027-01-15" },
    graceHours: 24
  });
  const result = await rotatePropertyKey(plan);
  console.log(JSON.stringify({ ...result, status: "overlap-active" }, null, 2));
}
