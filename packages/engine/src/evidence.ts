import { createHash } from "node:crypto";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

export function canonicalSha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

export interface PostProductionApprovalBindingInput {
  renderedAssetSha256: string;
  pixelEvidenceSha256: string;
  policyEvidenceSha256: string;
}

/**
 * Domain-separated binding for the exact render, two-scale pixel manifest,
 * and self-hashed policy decision presented for owner approval.
 */
export function computePostProductionApprovalBinding(input: PostProductionApprovalBindingInput): string {
  return canonicalSha256({
    schemaVersion: "1.0.0",
    kind: "POST_PRODUCTION_OWNER_APPROVAL_BINDING",
    renderedAssetSha256: input.renderedAssetSha256,
    pixelEvidenceSha256: input.pixelEvidenceSha256,
    policyEvidenceSha256: input.policyEvidenceSha256,
  });
}
