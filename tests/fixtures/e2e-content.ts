export interface E2EContentFixture {
  externalKey: string;
  title: string;
  platforms: readonly string[];
  format: string;
}

/**
 * Metadata-only content used by Playwright. Keep this fixture independent of
 * the private AURENDOR source library so a clean checkout can exercise the
 * owner console without copying creative files or credentials.
 */
export const e2eContentFixtures = [
  { externalKey: "W1-P1", title: "Operational intelligence begins with the process", platforms: ["instagram", "linkedin"], format: "carousel" },
  { externalKey: "W1-P2", title: "Automation should remove friction, not judgment", platforms: ["instagram", "facebook"], format: "single_static" },
  { externalKey: "W1-P3", title: "A practical map for an AI-ready operation", platforms: ["linkedin"], format: "document_post" },
  { externalKey: "W1-P4", title: "From scattered tasks to one operating rhythm", platforms: ["instagram", "facebook"], format: "carousel" },
  { externalKey: "W1-P5", title: "The hidden cost of disconnected workflows", platforms: ["linkedin", "facebook"], format: "single_static" },
  { externalKey: "W1-P6", title: "Three signals your process is ready to automate", platforms: ["instagram", "tiktok"], format: "short_video" },
  { externalKey: "W1-P7", title: "Digital civilization is built through operating choices", platforms: ["instagram", "linkedin"], format: "carousel" },
  { externalKey: "W2-P1", title: "Design the decision before choosing the tool", platforms: ["linkedin"], format: "single_static" },
  { externalKey: "W2-P2", title: "What a reliable automation handoff looks like", platforms: ["instagram", "facebook"], format: "carousel" },
  { externalKey: "W2-P3", title: "AI agents need boundaries as much as prompts", platforms: ["instagram", "linkedin"], format: "carousel" },
  { externalKey: "W2-P4", title: "A system should show its evidence", platforms: ["linkedin", "facebook"], format: "document_post" },
  { externalKey: "W2-P5", title: "The owner remains the final authority", platforms: ["instagram", "facebook"], format: "single_static" },
  { externalKey: "W2-P6", title: "A sixty-second workflow health check", platforms: ["instagram", "tiktok"], format: "short_video" },
  { externalKey: "W2-P7", title: "Good automation knows when to stop", platforms: ["instagram", "linkedin"], format: "carousel" },
  { externalKey: "W3-P1", title: "Build proof into the operating layer", platforms: ["instagram", "linkedin"], format: "carousel" },
  { externalKey: "W3-P2", title: "Why approvals must bind exact artifacts", platforms: ["linkedin"], format: "document_post" },
  { externalKey: "W3-P3", title: "One payload, one durable publication intent", platforms: ["instagram", "facebook"], format: "single_static" },
  { externalKey: "W3-P4", title: "Retries should never create duplicate posts", platforms: ["instagram", "linkedin"], format: "carousel" },
  { externalKey: "W3-P5", title: "High-risk creative requires deliberate review", platforms: ["instagram", "facebook", "linkedin"], format: "carousel" },
  { externalKey: "W3-P6", title: "A visible audit trail builds operational trust", platforms: ["instagram", "tiktok"], format: "short_video" },
  { externalKey: "W3-P7", title: "Capability checks before connection optimism", platforms: ["linkedin", "facebook"], format: "single_static" },
  { externalKey: "W4-P1", title: "Measure qualified attention, not empty reach", platforms: ["instagram", "linkedin"], format: "carousel" },
  { externalKey: "W4-P2", title: "Learning requires comparable evidence", platforms: ["linkedin"], format: "document_post" },
  { externalKey: "W4-P3", title: "A useful experiment changes one thing", platforms: ["instagram", "facebook"], format: "single_static" },
  { externalKey: "W4-P4", title: "When a metric is directional, label it", platforms: ["instagram", "linkedin"], format: "carousel" },
  { externalKey: "W4-P5", title: "Turn monthly results into next-month decisions", platforms: ["linkedin", "facebook"], format: "carousel" },
  { externalKey: "W4-P6", title: "The difference between activity and learning", platforms: ["instagram", "tiktok"], format: "short_video" },
  { externalKey: "W4-P7", title: "Retrospectives protect the system from repetition", platforms: ["instagram", "linkedin"], format: "single_static" },
  { externalKey: "W5-P1", title: "What structured intelligence looks like in practice", platforms: ["instagram", "linkedin"], format: "carousel" },
  { externalKey: "W5-P2", title: "A safer path from draft to publication", platforms: ["instagram", "facebook"], format: "carousel" },
  { externalKey: "W5-P3", title: "Operational clarity compounds", platforms: ["linkedin"], format: "single_static" },
  { externalKey: "W5-P4", title: "The system pauses when confidence is low", platforms: ["instagram", "facebook"], format: "single_static" },
  { externalKey: "W5-P5", title: "September closes with an evidence checkpoint", platforms: ["instagram", "linkedin"], format: "carousel" },
] as const satisfies readonly E2EContentFixture[];

