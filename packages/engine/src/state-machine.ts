import type { ContentStatus, WorkflowRun } from "@aurendor/schemas";

const contentTransitions: Readonly<Record<ContentStatus, readonly ContentStatus[]>> = {
  DRAFT: ["NEEDS_REVIEW", "CANCELLED"],
  NEEDS_REVIEW: ["APPROVED", "REVISION_REQUESTED", "BLOCKED", "CANCELLED"],
  REVISION_REQUESTED: ["NEEDS_REVIEW", "CANCELLED"],
  APPROVED: ["SCHEDULED", "REVISION_REQUESTED", "CANCELLED"],
  SCHEDULED: ["PUBLISHING", "APPROVED", "CANCELLED", "BLOCKED"],
  PUBLISHING: ["PUBLISHED", "FAILED", "BLOCKED"],
  PUBLISHED: [],
  FAILED: ["SCHEDULED", "BLOCKED", "CANCELLED"],
  BLOCKED: ["NEEDS_REVIEW", "CANCELLED"],
  CANCELLED: [],
};

export function canTransitionContent(from: ContentStatus, to: ContentStatus): boolean {
  return contentTransitions[from].includes(to);
}

export function assertContentTransition(from: ContentStatus, to: ContentStatus): void {
  if (!canTransitionContent(from, to)) throw new Error(`Invalid content transition: ${from} -> ${to}`);
}

export function planningDateForMonth(month: string, leadDays = 5): string {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error(`Invalid month: ${month}`);
  const [yearString, monthString] = month.split("-");
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;
  if (!Number.isInteger(year) || monthIndex < 0 || monthIndex > 11) throw new Error(`Invalid month: ${month}`);
  const date = new Date(Date.UTC(year, monthIndex, 1 - leadDays));
  return date.toISOString().slice(0, 10);
}

export function nextMonth(month: string): string {
  const [yearString, monthString] = month.split("-");
  const date = new Date(Date.UTC(Number(yearString), Number(monthString), 1));
  return date.toISOString().slice(0, 7);
}

export function nextWorkflowStep(run: Pick<WorkflowRun, "steps" | "currentStep">): string | null {
  const currentIndex = run.steps.findIndex((step) => step.name === run.currentStep);
  if (currentIndex < 0) throw new Error(`Workflow current step is missing: ${run.currentStep}`);
  return run.steps[currentIndex + 1]?.name ?? null;
}

