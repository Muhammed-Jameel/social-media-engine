import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AURENDOR_OWNER_ID,
  createDatabase,
  migrateDatabase,
  seedCoreData,
  type DatabaseClient,
  type SqlRow,
} from "@aurendor/db";
import type { CreativeConceptCandidate, ImageryMode, ProfessionalCritique, VisualFamily } from "@aurendor/schemas";
import {
  FixtureAgentGateway,
  type StructuredAgentGateway,
  type StructuredAgentRequest,
  type StructuredAgentResult,
} from "./agents";
import { ProfessionalCreativeOrchestrator, ProfessionalPixelCriticPanel } from "./creative-orchestrator";
import { DesignKnowledgeRetriever } from "./design-intelligence";
import {
  createProfessionalPostProductionExecutor,
  enqueueProfessionalPostProduction,
  exactTextSha256,
  ProfessionalFeedCoherenceReviewSchema,
  ProfessionalPostProductionInputSchema,
  ProfessionalRenderPackageSchema,
  type ProfessionalPostProductionInput,
} from "./production-executor";
import { enqueueWorkflow, resumeWorkflowAfterApproval, runWorkerOnce } from "./workflows";

const ORIGINAL_PIXEL_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGUExURQA/Nf///0FduBkAAAABYktHRAH/Ai3eAAAAB3RJTUUH6ggfCwIT+dxS8QAAAAxJREFUCNdjYGBgAAAABAABJzQnCgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNi0wOC0zMVQxMTowMjoxOSswMDowMJdgRmEAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjYtMDgtMzFUMTE6MDI6MTkrMDA6MDDmPf7dAAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDI2LTA4LTMxVDExOjAyOjE5KzAwOjAwsSjfAgAAAABJRU5ErkJggg==";
const MOBILE_PIXEL_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGUExURQ7bI////9NxsDUAAAABYktHRAH/Ai3eAAAAB3RJTUUH6ggfCwIT+dxS8QAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjYtMDgtMzFUMTE6MDI6MTkrMDA6MDCXYEZhAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDI2LTA4LTMxVDExOjAyOjE5KzAwOjAw5j3+3QAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyNi0wOC0zMVQxMTowMjoxOSswMDowMLEo3wIAAAAASUVORK5CYII=";
const ORIGINAL_PIXEL_SHA256 = "698c6f3bf85f2bd8ecbb9be32b0fbc661000375937b792d29b246f030ba4c651";
const MOBILE_PIXEL_SHA256 = "aec1e7e9d89ab88c53af605f5f1253b9e119e81c680c07fc0fb9d072e14dc7a5";
const RECENT_FEED_SHA256 = "c".repeat(64);

function validInput(): ProfessionalPostProductionInput {
  const exactText = ["السياق يبقى داخل العمل", "تسليم واضح، ومسؤولية يمكن تتبعها"];
  return ProfessionalPostProductionInputSchema.parse({
    schemaVersion: "1.0.0",
    contentItemId: "00000000-0000-4000-8000-000000000101",
    communicationGoal: "Explain how AURENDOR preserves context through an operational handoff.",
    purpose: "education",
    audience: "Regional operations leaders",
    audienceTension: "Important context disappears when responsibility changes hands.",
    desiredFeeling: "calm control",
    twoSecondTakeaway: "Context remains attached to the work.",
    language: "ar",
    exactText,
    visualFamily: "conceptual-hero",
    imageryMode: "conceptual-photomanipulation",
    anthropomorphismLevel: 1,
    informationDensity: "low",
    canvas: { width: 2, height: 2 },
    recentFeed: {
      comparedPostIds: ["previous-post-01"],
      comparedAssetSha256ByPostId: { "previous-post-01": RECENT_FEED_SHA256 },
      prohibitedRepeatedStructures: ["dark object centered on a plain field"],
      targetRhythmRole: "anchor",
    },
    research: {
      disposition: "NOT_REQUIRED",
      rationale: "This educational claim describes the owned AURENDOR operating model and makes no external factual claim.",
      sources: [],
    },
    editorialApproval: {
      status: "APPROVED",
      reviewerRef: "editorial-fixture",
      approvedAt: "2026-08-25T07:00:00.000Z",
      unsupportedClaimCount: 0,
      exactTextSha256: exactTextSha256(exactText),
      notes: [],
    },
    envelope: {
      schemaVersion: "1.0.0",
      modelVersion: "fixture-v1",
      promptVersion: "post-production-v1",
      skillVersions: ["aurendor-art-direction@2.0.0", "aurendor-design-critique@2.0.0"],
      templateVersion: null,
      traceId: "00000000-0000-4000-8000-000000000102",
      createdAt: "2026-08-25T07:00:00.000Z",
      sources: [],
    },
  });
}

function gatewayConcept(
  index: number,
  referenceIds: string[],
  principleIds: string[],
  visualFamily: VisualFamily,
  imageryMode: ImageryMode,
): CreativeConceptCandidate {
  return {
    candidateId: `runtime-route-${index}`,
    title: `Runtime professional route ${index}`,
    purpose: "education",
    audienceTension: "Important context disappears when responsibility changes hands.",
    desiredFeeling: "calm control",
    twoSecondTakeaway: "Context remains attached to the work.",
    singleVisualIdea: `A materially distinct handoff mechanism preserves one visible context thread in route ${index}.`,
    textlessComprehension: "A broken operating path becomes one continuous accountable path.",
    visualMetaphor: `A specific manufactured continuity joint for route ${index}.`,
    storytellingMechanism: "The scene changes from disconnected ownership into a verified transfer.",
    verbalVisualRelationship: "The image proves continuity while the words name its operational consequence.",
    visualFamily,
    anthropomorphism: {
      level: 1,
      behaviorHumanized: "handoff",
      comprehensionBenefit: "Responsibility becomes legible without a mascot.",
      faceRequired: false,
      faceTestResult: "The transfer remains clear after every facial cue is removed.",
      emotionalRegister: "assured",
      capabilityBoundary: "The object transfers a known state and never implies autonomous judgment.",
      childishnessRisk: "low",
    },
    composition: {
      focalPoint: "The verified continuity joint",
      focalWeight: 0.58,
      centerOfGravity: index % 2 === 0 ? "left" : "right",
      eyePath: ["Arabic thesis", "continuity joint", "verified receiving state"],
      grid: { columns: 8, baseUnit: 12, intentionalBreak: "The joint crosses one column to make the state change visible." },
      zones: [
        { name: "joint", role: "focal", x: 0.12, y: 0.28, width: 0.5, height: 0.38 },
        { name: "thesis", role: "support", x: 0.56, y: 0.08, width: 0.34, height: 0.22 },
        { name: "signature", role: "brand", x: 0.72, y: 0.88, width: 0.18, height: 0.05 },
      ],
      foreground: "One sharply resolved contact edge",
      middleGround: "The source and receiving states",
      background: "A quiet mineral field without decorative technology texture",
      negativeSpacePurpose: "Protect the RTL headline and isolate the causal transfer.",
    },
    typography: {
      language: "ar",
      direction: "rtl",
      headlineLines: ["السياق يبقى", "داخل العمل"],
      displayScaleRatio: 4.2,
      alignment: "start",
      interactionWithImagery: "The RTL type hands attention into the continuity joint.",
      arabicSpecificDecision: "The semantic phrase break preserves joining and balances the two line masses.",
    },
    imagery: {
      mode: imageryMode,
      subject: `Original manufactured handoff mechanism ${index}`,
      crop: "Macro crop with both contact edges visible",
      perspective: "Shallow three-quarter material view",
      lighting: "Directional soft light with one charged green state",
      material: "Dark mineral composite and clear resin",
      texture: "Controlled tactile grain without synthetic haze",
      relationToTypography: "The contact event counterbalances the Arabic type rather than sitting behind it.",
      assetPlan: [{ asset: "bespoke focal scene", source: "generated-bespoke", licenseEvidence: "Original AURENDOR fixture generation" }],
    },
    referenceUses: referenceIds.slice(0, 3).map((referenceId, referenceIndex) => ({
      referenceId,
      principleId: principleIds[referenceIndex]!,
      learnedPrinciple: "Use one dominant material action and subordinate every supporting detail.",
      whyRelevant: "The brief needs immediate comprehension without a reusable card template.",
      mustNotCopy: "Do not reuse the source subject, composition, silhouette, character, palette recipe, or campaign prop.",
      rightsState: "REFERENCE_ONLY",
    })),
    forbiddenAdditions: ["floating UI cards", "generic robot", "decorative gradient"],
    originalityRationale: `Route ${index} combines an original behavior, material, crop, and RTL composition not present together in a reference.`,
    professionalChoiceRationale: "The route makes the operating behavior inspectable and gives every visible element one communication job.",
    risks: ["Contact edges must remain credible in the original and mobile raster."],
  };
}

function gatewayCritique(input: Record<string, unknown>): ProfessionalCritique {
  const criticRole = input["criticRole"] as ProfessionalCritique["criticRole"];
  const anchors = input["professionalAnchors"] as Array<{ referenceId: string }>;
  return {
    critiqueId: `runtime-${criticRole}`,
    renderedAssetId: String(input["renderedAssetId"]),
    renderedAssetSha256: String(input["renderedAssetSha256"]),
    criticRole,
    actualPixelsInspected: true,
    viewingScales: ["original", "mobile"],
    scores: { concept: 19, composition: 18, typography: 18, visualCraft: 18, brand: 18, communication: 19, professionalPolish: 18, distinctiveness: 18 },
    total: 146,
    evidenceObservations: [
      { dimension: "concept", region: "central continuity joint", observation: "The current pixels show one specific and immediate operational state change.", impact: "positive" },
      { dimension: "composition", region: "RTL thesis into lower material action", observation: "The original and mobile views retain one controlled eye path and focal point.", impact: "positive" },
      { dimension: "typography", region: "two-line Arabic headline", observation: "The semantic phrase and joined letterforms remain readable in the supplied mobile pixels.", impact: "positive" },
      { dimension: "visualCraft", region: "resin and mineral contact edge", observation: "Contact shadow, insertion depth, and refraction establish a credible manufactured junction.", impact: "positive" },
    ],
    hardFails: [],
    professionalAnchorComparison: {
      referenceIds: anchors.slice(0, 2).map((anchor) => anchor.referenceId),
      verdict: "comparable",
      observableDifferences: ["The candidate has equally decisive focal hierarchy.", "Its Arabic-mobile hierarchy is stronger while its material contact is comparably resolved."],
    },
    strengths: ["The communication mechanism survives without supporting copy."],
    weaknesses: ["One secondary contact highlight could be quieter."],
    revisionInstructions: ["Preserve the current concept and reduce only the secondary contact highlight if another iteration is required."],
    restartConcept: false,
    decision: "PROFESSIONAL_CANDIDATE",
  };
}

class DynamicProfessionalGateway implements StructuredAgentGateway {
  async run<T>(request: StructuredAgentRequest<T>): Promise<StructuredAgentResult<T>> {
    let fixture: unknown;
    if (request.taskName === "aurendor_professional_art_direction_v2") {
      const knowledge = request.input["designKnowledge"] as {
        references: Array<{ referenceId: string }>;
        principles: Array<{ principleId: string }>;
      };
      const referenceIds = knowledge.references.map((reference) => reference.referenceId);
      const principleIds = knowledge.principles.map((principle) => principle.principleId);
      const families: VisualFamily[] = ["conceptual-hero", "editorial-statement", "process-explainer", "character-narrative"];
      const modes: ImageryMode[] = ["conceptual-photomanipulation", "typography-led", "bespoke-3d", "conceptual-illustration"];
      const candidates = families.map((family, index) => gatewayConcept(index + 1, referenceIds, principleIds, family, modes[index]!));
      fixture = {
        answers: {
          communicationJob: "Make continuity of operational context immediately legible.",
          audienceTension: "Leaders cannot see which context survived a handoff.",
          desiredFeeling: "Calm confidence in a controlled operating flow.",
          twoSecondMeaning: "Context stays attached while responsibility changes.",
          singleVisualIdea: "A broken material path seals itself only at an explicit handoff.",
          textlessComprehension: "The discontinuity visibly becomes one connected accountable path.",
          materialMetaphor: "A clear manufactured joint preserves state across unlike materials.",
          storyChange: "Disconnected states become one inspectable sequence with a clear receiver.",
          verbalVisualRelationship: "The image proves continuity while the words name retained context.",
          focalPointAndEyePath: "The eye enters at the Arabic thesis, follows the seal, and exits at the receiver.",
          negativeSpacePurpose: "The quiet field protects the RTL entry and isolates the transfer.",
          languageCompositionDecision: "The RTL headline begins upper right and hands attention into the leftward action.",
          assetCraftDecision: "A bespoke macro material scene requires credible contacts, directional light, and restrained texture.",
          anthropomorphismDecision: "Humanize the handoff through behavior; a face would reduce authority.",
          aurendorDistinctiveness: "A charged green state travels through a dark mineral operating world unique to the brief.",
        },
        tournament: {
          candidates,
          pairwiseComparisons: [
            { candidateAId: "runtime-route-1", candidateBId: "runtime-route-2", winnerId: "runtime-route-1", conceptReason: "The material state change is more singular.", communicationReason: "It reads faster without labels.", executionRisk: "Contact craft needs inspection." },
            { candidateAId: "runtime-route-1", candidateBId: "runtime-route-3", winnerId: "runtime-route-1", conceptReason: "The metaphor is less generic.", communicationReason: "The operational consequence remains clearer.", executionRisk: "Arabic mass needs optical balance." },
          ],
          selectedCandidateIds: ["runtime-route-1"],
          rejectedCandidates: [{ candidateId: "runtime-route-2", reason: "The typography-led route carries less message-specific operating evidence." }],
        },
      };
    } else if (request.taskName.startsWith("aurendor_pixel_critique_")) {
      fixture = gatewayCritique(request.input);
    } else {
      throw new Error(`Unexpected dynamic gateway task: ${request.taskName}`);
    }
    return {
      value: request.schema.parse(fixture),
      model: "dynamic-fixture-v1",
      responseId: null,
      traceId: request.traceId ?? "00000000-0000-4000-8000-000000000999",
      mode: "fixture",
    };
  }
}

async function releaseCreativeGate(database: DatabaseClient): Promise<void> {
  await database.query(
    `UPDATE engine_settings
     SET creative_production_paused = false,
         creative_gate_state = 'RELEASED',
         creative_gate_evidence = '{"decision":"executor-test-only"}'::jsonb`,
  );
}

describe("professional post-production runtime", () => {
  let database: DatabaseClient;
  let retriever: DesignKnowledgeRetriever;

  beforeEach(async () => {
    database = await createDatabase({ memory: true });
    await migrateDatabase(database);
    await seedCoreData(database);
    await releaseCreativeGate(database);
    retriever = await DesignKnowledgeRetriever.fromDirectory(join(process.cwd(), "design-intelligence"));
  });

  afterEach(async () => {
    await database.close();
  });

  it("rejects partial generic payloads at the brief stage", async () => {
    const workflowId = await enqueueWorkflow(database, {
      type: "POST_PRODUCTION",
      idempotencyKey: "invalid-professional-input-1",
      payload: { contentItemId: "fixture" },
    });
    const executor = createProfessionalPostProductionExecutor({ retriever });
    await expect(runWorkerOnce(database, "test-worker", executor)).resolves.toMatchObject({ status: "DEAD_LETTER" });

    const stored = await database.query<SqlRow & { current_step: string; output: unknown }>(
      "SELECT current_step, output FROM workflow_runs WHERE id = $1",
      [workflowId],
    );
    expect(stored.rows[0]?.current_step).toBe("brief");
    expect(stored.rows[0]?.output).toMatchObject({ brief: { errorCode: "POLICY_BLOCKED" } });
  });

  it("persists safe prerequisite evidence and fails closed when the live art-direction gateway is unavailable", async () => {
    const workflowId = await enqueueProfessionalPostProduction(database, {
      idempotencyKey: "professional-prerequisites-1",
      payload: validInput(),
    });
    const offlineOrchestrator = new ProfessionalCreativeOrchestrator(retriever, new FixtureAgentGateway());
    const executor = createProfessionalPostProductionExecutor({ retriever, orchestrator: offlineOrchestrator });

    for (let completedStages = 0; completedStages < 5; completedStages += 1) {
      await expect(runWorkerOnce(database, "test-worker", executor)).resolves.toMatchObject({ status: "PENDING" });
    }
    await expect(runWorkerOnce(database, "test-worker", executor)).resolves.toMatchObject({
      status: "DEAD_LETTER",
      workflowId,
    });

    const stored = await database.query<SqlRow & { current_step: string; output: Record<string, unknown> }>(
      "SELECT current_step, output FROM workflow_runs WHERE id = $1",
      [workflowId],
    );
    expect(stored.rows[0]?.current_step).toBe("concept-tournament");
    expect(stored.rows[0]?.output).toMatchObject({
      brief: { contentItemId: validInput().contentItemId },
      research: { disposition: "NOT_REQUIRED" },
      copy: { exactTextSha256: validInput().editorialApproval.exactTextSha256 },
      "editorial-qa": { status: "APPROVED" },
      "design-intelligence-retrieval": {
        status: "READY",
        rawReferencePixelsIncluded: false,
        sourcePathsRestrictedToPixelCritics: true,
      },
      "concept-tournament": {
        errorCode: "CAPABILITY_UNAVAILABLE",
        ownerActionRequired: true,
      },
    });
    const retrieval = stored.rows[0]?.output["design-intelligence-retrieval"] as Record<string, unknown>;
    expect(JSON.stringify(retrieval["principleInstructions"])).not.toContain("/Users/");
  });

  it("reaches audited owner review with complete fixture evidence and schedules only after approval", async () => {
    const workflowId = await enqueueProfessionalPostProduction(database, {
      idempotencyKey: "professional-fixture-happy-path-1",
      payload: validInput(),
    });
    const gateway = new DynamicProfessionalGateway();
    const renderedAssetSha256 = ORIGINAL_PIXEL_SHA256;
    let scheduleCalls = 0;
    const executor = createProfessionalPostProductionExecutor({
      retriever,
      orchestrator: new ProfessionalCreativeOrchestrator(retriever, gateway),
      criticPanel: new ProfessionalPixelCriticPanel(gateway),
      anchorLoader: {
        async load(anchors) {
          return anchors.slice(0, 2).map((anchor, index) => ({
            imageUrl: `data:image/webp;base64,ANCHOR${index}`,
            referenceId: anchor.referenceId,
            compareFor: anchor.compareFor,
          }));
        },
      },
      assetProducer: {
        async produce({ brief, generationHandoffSha256 }) {
          return {
            draftId: "professional-draft-01",
            designBriefId: brief.id,
            provider: "fixture-professional-producer",
            editableUrl: null,
            generationHandoffSha256,
            productionEvidence: { originalAssetPlanExecuted: true },
          };
        },
      },
      renderer: {
        async render({ brief, draft }) {
          return {
            renderedAssetId: "professional-render-01",
            renderedAssetSha256,
            designBriefId: brief.id,
            draftId: draft.draftId,
            licenseStatus: "OWNED",
            original: {
              scale: "original",
              imageUrl: `data:image/png;base64,${ORIGINAL_PIXEL_BASE64}`,
              mimeType: "image/png",
              width: 2,
              height: 2,
              sha256: renderedAssetSha256,
              sourceAssetSha256: renderedAssetSha256,
            },
            mobile: {
              scale: "mobile",
              imageUrl: `data:image/png;base64,${MOBILE_PIXEL_BASE64}`,
              mimeType: "image/png",
              width: 1,
              height: 1,
              sha256: MOBILE_PIXEL_SHA256,
              sourceAssetSha256: renderedAssetSha256,
            },
          };
        },
      },
      technicalPreflight: {
        async inspect({ renderPackage }) {
          return {
            preflightId: "runtime-preflight-01",
            renderedAssetSha256,
            pixelEvidenceSha256: renderPackage.pixelEvidenceSha256,
            actualBytesVerified: true,
            dimensionsVerified: true,
            exactCopyBindingVerified: true,
            licenseVerified: true,
            hardFails: [],
            decision: "PASS",
            notes: ["Objective technical fixture checks passed; no aesthetic score was assigned."],
          };
        },
      },
      originalityReviewer: {
        async review({ renderPackage, knowledgeHash, corpusVersion, retrievalReferences, retrievedReferenceIds }) {
          return {
            reviewId: "runtime-originality-01",
            renderedAssetSha256,
            pixelEvidenceSha256: renderPackage.pixelEvidenceSha256,
            knowledgeHash,
            corpusVersion,
            retrievalReferences,
            candidatePoolCount: 1296,
            actualPixelsInspected: true,
            reviewerRef: "runtime-originality-reviewer",
            reviewedAt: "2026-08-25T07:00:00.000Z",
            inspectedNeighborIds: retrievedReferenceIds.slice(0, 3),
            referenceDistanceChecked: true,
            selfRepetitionChecked: true,
            decision: "CLEAR",
            observations: ["The material handoff mechanism is structurally distinct from inspected neighbors.", "The recent-feed topology does not repeat the current candidate shell."],
            revisionInstructions: [],
          };
        },
      },
      feedReviewer: {
        async review({ renderPackage, comparedPostIds, comparedAssetSha256ByPostId }) {
          return {
            reviewId: "runtime-feed-01",
            renderedAssetSha256,
            pixelEvidenceSha256: renderPackage.pixelEvidenceSha256,
            actualPixelsInspected: true,
            reviewerRef: "runtime-feed-reviewer",
            reviewedAt: "2026-08-25T07:00:00.000Z",
            comparedPostIds,
            comparedAssetSha256ByPostId,
            simulatedViews: ["3-post", "9-post"],
            repeatedStructures: [],
            observations: ["The candidate changes field polarity and focal geometry within the recent feed.", "Typography and evidence placement create a deliberate rhythm role rather than a repeated shell."],
            decision: "PASS",
          };
        },
      },
      scheduler: {
        async schedule({ renderPackage, policyEvidence, approval }) {
          scheduleCalls += 1;
          return {
            renderedAssetSha256,
            pixelEvidenceSha256: renderPackage.pixelEvidenceSha256,
            policyEvidenceSha256: policyEvidence.policyEvidenceSha256,
            approvalBindingSha256: approval.approvalBindingSha256,
            status: "PUBLISH_WORKFLOW_ENQUEUED",
            scheduleRef: "runtime-schedule-01",
            scheduledAt: "2026-09-01T08:00:00.000Z",
            externalMutation: false,
          };
        },
      },
    });

    let waitingForApproval = false;
    for (let cycle = 0; cycle < 20; cycle += 1) {
      const result = await runWorkerOnce(database, "test-worker", executor);
      if (result.status === "WAITING_FOR_APPROVAL") {
        waitingForApproval = true;
        break;
      }
      expect(result.status).toBe("PENDING");
      expect(scheduleCalls).toBe(0);
    }
    expect(waitingForApproval).toBe(true);
    expect(scheduleCalls).toBe(0);

    const beforeApproval = await database.query<SqlRow & { current_step: string; output: unknown }>(
      "SELECT current_step, output FROM workflow_runs WHERE id = $1",
      [workflowId],
    );
    expect(beforeApproval.rows[0]?.current_step).toBe("owner-review");
    expect(beforeApproval.rows[0]?.output).toMatchObject({
      "policy-check": { status: "READY_FOR_OWNER_REVIEW", renderedAssetSha256 },
    });

    const evidence = beforeApproval.rows[0]?.output as Record<string, Record<string, unknown>>;
    const renderEvidence = evidence["render-original-and-mobile"] as Record<string, unknown>;
    const policyEvidence = evidence["policy-check"] as Record<string, unknown>;
    await resumeWorkflowAfterApproval(database, {
      workflowId,
      actorId: AURENDOR_OWNER_ID,
      approvalRef: "runtime-owner-approval-01",
      renderedAssetSha256: renderEvidence["renderedAssetSha256"] as string,
      pixelEvidenceSha256: renderEvidence["pixelEvidenceSha256"] as string,
      policyEvidenceSha256: policyEvidence["policyEvidenceSha256"] as string,
    });
    await expect(runWorkerOnce(database, "test-worker", executor)).resolves.toMatchObject({ status: "SUCCEEDED" });
    expect(scheduleCalls).toBe(1);

    const complete = await database.query<SqlRow & { status: string; output: unknown }>(
      "SELECT status, output FROM workflow_runs WHERE id = $1",
      [workflowId],
    );
    expect(complete.rows[0]).toMatchObject({ status: "SUCCEEDED" });
    expect(complete.rows[0]?.output).toMatchObject({
      "owner-review": { approved: true, approvalRef: "runtime-owner-approval-01" },
      schedule: { schedule: { renderedAssetSha256, status: "PUBLISH_WORKFLOW_ENQUEUED", externalMutation: false } },
    });
  });

  it("binds editorial approval to the exact current copy", () => {
    const input = validInput();
    const stale = {
      ...input,
      exactText: ["Copy changed after approval"],
    };
    expect(ProfessionalPostProductionInputSchema.safeParse(stale).success).toBe(false);
  });

  it("does not admit test fixtures or unknown control fields into production input", () => {
    expect(ProfessionalPostProductionInputSchema.safeParse({ ...validInput(), fixture: { bypass: true } }).success).toBe(false);
  });
});

describe("professional pixel evidence contracts", () => {
  it("rejects a mobile render that is not derived from the canonical original hash", () => {
    const originalSha256 = "a".repeat(64);
    const result = ProfessionalRenderPackageSchema.safeParse({
      renderedAssetId: "asset-01",
      renderedAssetSha256: originalSha256,
      designBriefId: "00000000-0000-4000-8000-000000000201",
      draftId: "draft-01",
      licenseStatus: "OWNED",
      original: {
        scale: "original",
        imageUrl: "data:image/png;base64,AAAA",
        mimeType: "image/png",
        width: 1080,
        height: 1350,
        sha256: originalSha256,
        sourceAssetSha256: originalSha256,
      },
      mobile: {
        scale: "mobile",
        imageUrl: "data:image/png;base64,BBBB",
        mimeType: "image/png",
        width: 324,
        height: 405,
        sha256: "b".repeat(64),
        sourceAssetSha256: "c".repeat(64),
      },
    });
    expect(result.success).toBe(false);
  });

  it("requires feed decisions to come from actual pixels and a non-empty comparison set", () => {
    expect(ProfessionalFeedCoherenceReviewSchema.safeParse({
      reviewId: "feed-review-01",
      renderedAssetSha256: "a".repeat(64),
      actualPixelsInspected: false,
      reviewerRef: "fixture-reviewer",
      reviewedAt: "2026-08-25T07:00:00.000Z",
      comparedPostIds: [],
      simulatedViews: ["9-post"],
      repeatedStructures: [],
      observations: ["The focal topology changes across the sequence.", "The field polarity creates a deliberate rhythm break."],
      decision: "PASS",
    }).success).toBe(false);
  });
});
