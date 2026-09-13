import "server-only";

import { getDatabase, type SqlRow } from "@social-media-plugin/db/runtime";

export interface RunView {
  id: string;
  type: string;
  status: string;
  currentStep: string;
  traceId: string;
  createdAt: string;
  updatedAt: string;
}

export async function listRuns(): Promise<RunView[]> {
  const database = await getDatabase();
  const result = await database.query<SqlRow & {
    id: string;
    type: string;
    status: string;
    current_step: string;
    trace_id: string;
    created_at: unknown;
    updated_at: unknown;
  }>(`SELECT id, type, status, current_step, trace_id, created_at, updated_at
      FROM workflow_runs ORDER BY created_at DESC LIMIT 40`);
  return result.rows.map((row) => ({
    id: row.id,
    type: row.type,
    status: row.status,
    currentStep: row.current_step,
    traceId: row.trace_id,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  }));
}

export interface SetupItem {
  label: string;
  description: string;
  configured: boolean;
  requiredFor: string;
}

function present(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export function getSetupChecklist(): SetupItem[] {
  return [
    { label: "Owner authentication", description: "A signed owner session protects approvals and controls.", configured: present("OWNER_EMAIL") && present("OWNER_PASSWORD_HASH") && (process.env.OWNER_SESSION_SECRET?.length ?? 0) >= 32, requiredFor: "Production console" },
    { label: "Postiz publishing bridge", description: "One self-hosted gateway for the five active social channels.", configured: present("POSTIZ_API_URL") && present("POSTIZ_API_KEY"), requiredFor: "Central publishing" },
    { label: "OpenAI model gateway", description: "Structured generation and evaluation through the Responses API.", configured: present("OPENAI_API_KEY"), requiredFor: "Live agent runs" },
    { label: "Canva Connect", description: "Editable production drafts and export handoff.", configured: present("CANVA_CLIENT_ID") && present("CANVA_CLIENT_SECRET"), requiredFor: "Canva workflow" },
    { label: "Meta", description: "Instagram and Facebook account connection.", configured: present("META_APP_ID") && present("META_APP_SECRET"), requiredFor: "Meta publishing" },
    { label: "LinkedIn", description: "Organization post publishing and analytics.", configured: present("LINKEDIN_CLIENT_ID") && present("LINKEDIN_CLIENT_SECRET"), requiredFor: "LinkedIn publishing" },
    { label: "TikTok", description: "Draft upload only under the current internal-tool policy.", configured: present("TIKTOK_CLIENT_KEY") && present("TIKTOK_CLIENT_SECRET"), requiredFor: "Manual draft handoff" },
    { label: "Object storage", description: "Durable approved assets and provider payloads.", configured: present("S3_BUCKET") && present("S3_ACCESS_KEY_ID") && present("S3_SECRET_ACCESS_KEY"), requiredFor: "Production assets" },
    { label: "Owner notifications", description: "Email delivery for approvals, failures, and ambiguity.", configured: present("RESEND_API_KEY") && present("OWNER_NOTIFICATION_EMAIL"), requiredFor: "Production alerts" },
  ];
}
