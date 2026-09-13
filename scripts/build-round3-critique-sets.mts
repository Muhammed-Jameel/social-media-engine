import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  PairwiseCreativeComparisonSchema,
  ProfessionalCritiqueSchema,
  ProfessionalCritiqueSetSchema,
  type ProfessionalCritique,
  type ProfessionalCritiqueSet,
} from "../packages/schemas/src/index";

const root = process.cwd();
const manifestPath = "artifacts/creative-rebuild/benchmarks-v2-round3/manifest.json";
const outputPath = "artifacts/creative-rebuild/reviews/round3-critique-sets.json";
const reportPath = "artifacts/creative-rebuild/reviews/ROUND3_INTEGRATED_CRITIQUE_REPORT.md";
const goldenSetPath = "design-intelligence/reports/GOLDEN_SET.md";
const expectedManifestSha256 = "d30681670a5f3ac6703896e55fe5fe700c97b6ab5bce15838cc99bf196941b36";
const historicalGoldenSetSha256 = "9f5c1bf70d9d491e2c0ca4a25cddf653bda48375d77c6c570f9dfb5e66bbc36e";

const reviewInputs = [
  { role: "SENIOR_ART_DIRECTOR", path: "artifacts/creative-rebuild/reviews/senior-art-director-round3.json" },
  { role: "SENIOR_GRAPHIC_DESIGNER", path: "artifacts/creative-rebuild/reviews/senior-graphic-designer-round3.json" },
  { role: "SOCIAL_PERFORMANCE_STRATEGIST", path: "artifacts/creative-rebuild/reviews/social-performance-strategist-round3.json" },
  { role: "ARABIC_DESIGN_REVIEWER", path: "artifacts/creative-rebuild/reviews/arabic-design-reviewer-round3.json" },
] as const;
const originalityPath = "artifacts/creative-rebuild/originality/round3-originality-review.json";
const blindReviewPath = "artifacts/creative-rebuild/blind-pairwise/round3-old-vs-new/blind-review.json";
const blindAssignmentPath = "artifacts/creative-rebuild/blind-pairwise/round3-old-vs-new/assignment-manifest.json";

interface ReviewFile {
  criticRole: ProfessionalCritique["criticRole"];
  reviewId: string;
  reviewedAt: string;
  critiques: unknown[];
  pairwiseComparisons?: unknown[];
}

interface ManifestCreative {
  id: string;
  language: "ar" | "en";
  sha256: string;
}

interface Manifest {
  iteration: number;
  generatedAt: string;
  creatives: ManifestCreative[];
}

interface OriginalityCandidate {
  id: string;
  renderedAssetSha256: string;
  decision: "CLEAR" | "REVISE_DISTANCE" | "REFERENCE_TOO_CLOSE" | "SELF_REPETITION";
  sanitizedNextAction: string;
}

interface OriginalityReview {
  reviewedAt: string;
  overallFeedDecision: { decision: string; blockingCandidateIds: string[]; rationale: string; sanitizedNextAction: string };
  candidates: OriginalityCandidate[];
}

interface BlindAssignment {
  assignmentWithheldFromReviewer: boolean;
  candidateA: { identity: string; originalFile: string; originalSha256: string; mobileFile: string; mobileSha256: string };
  candidateB: { identity: string; originalFile: string; originalSha256: string; mobileFile: string; mobileSha256: string };
  review: { file: string; sha256: string; winner: "A" | "B" | "tie-neither-professional"; decisiveWinner: boolean; identityAfterUnblinding: string };
}

async function bytes(relativePath: string): Promise<Buffer> {
  return readFile(join(root, relativePath));
}

async function sha256(relativePath: string): Promise<string> {
  return createHash("sha256").update(await bytes(relativePath)).digest("hex");
}

async function json<T>(relativePath: string): Promise<T> {
  return JSON.parse((await bytes(relativePath)).toString("utf8")) as T;
}

function requiredRoles(language: "ar" | "en"): ProfessionalCritique["criticRole"][] {
  const roles: ProfessionalCritique["criticRole"][] = [
    "SENIOR_ART_DIRECTOR",
    "SENIOR_GRAPHIC_DESIGNER",
    "SOCIAL_PERFORMANCE_STRATEGIST",
  ];
  if (language === "ar") roles.push("ARABIC_DESIGN_REVIEWER");
  return roles;
}

function finalDecision(critiques: ProfessionalCritique[]): ProfessionalCritiqueSet["finalDecision"] {
  if (critiques.some((critique) => critique.hardFails.length > 0 || critique.restartConcept || critique.decision === "REJECT")) return "REJECT";
  if (critiques.every((critique) => critique.total >= 152 && critique.decision === "EXCELLENT" && ["comparable", "above"].includes(critique.professionalAnchorComparison.verdict))) return "EXCELLENT";
  if (critiques.every((critique) => critique.total >= 145 && ["PROFESSIONAL_CANDIDATE", "EXCELLENT"].includes(critique.decision) && ["comparable", "above"].includes(critique.professionalAnchorComparison.verdict))) return "PROFESSIONAL_CANDIDATE";
  return "MAJOR_REVISION";
}

const manifestBuffer = await bytes(manifestPath);
const manifestSha256 = createHash("sha256").update(manifestBuffer).digest("hex");
if (manifestSha256 !== expectedManifestSha256) throw new Error(`Round-three manifest changed: ${manifestSha256}`);
const manifest = JSON.parse(manifestBuffer.toString("utf8")) as Manifest;
if (manifest.iteration !== 3 || manifest.creatives.length !== 12) throw new Error("Expected the hash-anchored twelve-asset round-three manifest.");

const reviewFiles = await Promise.all(reviewInputs.map(async (input) => {
  const review = await json<ReviewFile>(input.path);
  if (review.criticRole !== input.role) throw new Error(`${input.path} has unexpected role ${review.criticRole}`);
  const critiques = review.critiques.map((critique) => ProfessionalCritiqueSchema.parse(critique));
  const pairwiseComparisons = (review.pairwiseComparisons ?? []).map((comparison) => PairwiseCreativeComparisonSchema.parse(comparison));
  return {
    ...input,
    reviewId: review.reviewId,
    reviewedAt: review.reviewedAt,
    sha256: await sha256(input.path),
    critiques,
    pairwiseComparisons,
  };
}));

const originality = await json<OriginalityReview>(originalityPath);
const originalitySha256 = await sha256(originalityPath);
const originalityByAsset = new Map(originality.candidates.map((candidate) => [candidate.id, candidate]));
const blindReviewDocument = await json<unknown>(blindReviewPath);
const blindComparison = PairwiseCreativeComparisonSchema.parse(blindReviewDocument);
const blindReviewSha256 = await sha256(blindReviewPath);
const blindAssignment = await json<BlindAssignment>(blindAssignmentPath);
const blindAssignmentSha256 = await sha256(blindAssignmentPath);
const currentGoldenSetSha256 = await sha256(goldenSetPath);
const blindDirectory = "artifacts/creative-rebuild/blind-pairwise/round3-old-vs-new";
if (!blindAssignment.assignmentWithheldFromReviewer || !blindComparison.blindLabelsUsed || blindAssignment.review.sha256 !== blindReviewSha256) {
  throw new Error("Blind comparison assignment/review boundary is invalid.");
}
if (blindAssignment.review.winner !== blindComparison.winner || blindAssignment.review.identityAfterUnblinding !== "round-three professional rebuild output") {
  throw new Error("Blind comparison unblinding result is inconsistent.");
}
for (const candidate of [blindAssignment.candidateA, blindAssignment.candidateB]) {
  if (await sha256(`${blindDirectory}/${candidate.originalFile}`) !== candidate.originalSha256) throw new Error(`Blind original changed: ${candidate.originalFile}`);
  if (await sha256(`${blindDirectory}/${candidate.mobileFile}`) !== candidate.mobileSha256) throw new Error(`Blind mobile changed: ${candidate.mobileFile}`);
}
const blindRound3Candidate = manifest.creatives.find((candidate) => candidate.sha256 === blindAssignment.candidateB.originalSha256);
if (!blindRound3Candidate) throw new Error("Blind candidate B is not bound to a round-three manifest candidate.");
const critiqueSets: ProfessionalCritiqueSet[] = [];

for (const creative of manifest.creatives) {
  const critiques = requiredRoles(creative.language).map((role) => {
    const review = reviewFiles.find((candidate) => candidate.role === role);
    const critique = review?.critiques.find((candidate) => candidate.renderedAssetId === creative.id);
    if (!critique) throw new Error(`Missing ${role} critique for ${creative.id}`);
    if (critique.renderedAssetSha256 !== creative.sha256) throw new Error(`${role} reviewed a stale hash for ${creative.id}`);
    return critique;
  });
  const decision = finalDecision(critiques);
  const distinctDecisions = [...new Set(critiques.map((critique) => critique.decision))];
  const critiqueSet = ProfessionalCritiqueSetSchema.parse({
    setId: `round3-current-hash-${creative.id}`,
    renderedAssetId: creative.id,
    renderedAssetSha256: creative.sha256,
    language: creative.language,
    critiques,
    pairwiseComparisons: [],
    finalDecision: decision,
    disagreementReasons: distinctDecisions.length > 1
      ? [`Role decisions differ: ${critiques.map((critique) => `${critique.criticRole}=${critique.decision}/${critique.total}`).join(", ")}.`]
      : [],
    nextAction: decision === "REJECT"
      ? "Return to art direction or repair the hard failure, rerender, hash, and restart every required independent review."
      : decision === "MAJOR_REVISION"
        ? "Apply only the observed candidate-level revisions, rerender, hash, and restart every required independent review."
        : "Preserve this exact hash as a professional candidate while originality, feed, owner, and release gates are completed.",
  });
  critiqueSets.push(critiqueSet);
}

for (const candidate of originality.candidates) {
  const creative = manifest.creatives.find((item) => item.id === candidate.id);
  if (!creative || creative.sha256 !== candidate.renderedAssetSha256) throw new Error(`Originality review has stale or unknown candidate ${candidate.id}`);
}

const professionalCandidateIds = critiqueSets
  .filter((set) => ["PROFESSIONAL_CANDIDATE", "EXCELLENT"].includes(set.finalDecision))
  .map((set) => set.renderedAssetId);
const originalityClearedProfessionalCandidateIds = professionalCandidateIds.filter((id) => originalityByAsset.get(id)?.decision === "CLEAR");
const originalityBlockedProfessionalCandidateIds = professionalCandidateIds.filter((id) => originalityByAsset.get(id)?.decision !== "CLEAR");
const belowProfessionalBarIds = critiqueSets.filter((set) => !["PROFESSIONAL_CANDIDATE", "EXCELLENT"].includes(set.finalDecision)).map((set) => set.renderedAssetId);
const blindPairwiseComparisonCount = reviewFiles.flatMap((review) => review.pairwiseComparisons).filter((comparison) => comparison.blindLabelsUsed).length
  + (blindComparison.blindLabelsUsed ? 1 : 0);
const hardFailAssetIds = critiqueSets.filter((set) => set.critiques.some((critique) => critique.hardFails.length > 0)).map((set) => set.renderedAssetId);

const integrated = {
  schemaVersion: "1.0.0",
  assembly: "AURENDOR round-three exact-current-hash professional critique sets",
  assembledAt: new Date().toISOString(),
  benchmark: {
    iteration: manifest.iteration,
    generatedAt: manifest.generatedAt,
    manifestPath,
    manifestSha256,
    archiveState: {
      status: "HASH_ANCHORED_TAMPER_EVIDENT",
      filesystemImmutable: false,
      note: "Exact hashes make changes detectable, but the working-tree archive is not represented as OS-level or storage-level immutable.",
    },
  },
  sourceReviews: [
    ...reviewFiles.map((review) => ({ role: review.role, reviewId: review.reviewId, reviewedAt: review.reviewedAt, path: review.path, sha256: review.sha256 })),
    { role: "ORIGINALITY_REVIEWER", reviewedAt: originality.reviewedAt, path: originalityPath, sha256: originalitySha256 },
    { role: "INDEPENDENT_BLIND_ADJUDICATOR", path: blindReviewPath, sha256: blindReviewSha256 },
    { role: "BLIND_ASSIGNMENT_PROVENANCE", path: blindAssignmentPath, sha256: blindAssignmentSha256 },
  ],
  evidenceCaveats: [
    {
      code: "HISTORICAL_GOLDEN_SET_BYTES_NOT_RETAINED_AT_MUTABLE_PATH",
      path: goldenSetPath,
      reviewedSha256: historicalGoldenSetSha256,
      currentDocumentSha256: currentGoldenSetSha256,
      affectedReviewRoles: ["SENIOR_ART_DIRECTOR", "SENIOR_GRAPHIC_DESIGNER", "SOCIAL_PERFORMANCE_STRATEGIST"],
      note: "Those independent reviews correctly retain the SHA-256 they used, but the named GOLDEN_SET.md path now contains a later governance revision. The historical bytes are not reproducible from that mutable path; the independent review files remain unchanged to preserve their exact hashes.",
    },
  ],
  critiqueSets,
  originality: {
    overallFeedDecision: originality.overallFeedDecision,
    candidates: originality.candidates.map((candidate) => ({
      renderedAssetId: candidate.id,
      renderedAssetSha256: candidate.renderedAssetSha256,
      decision: candidate.decision,
      sanitizedNextAction: candidate.sanitizedNextAction,
    })),
  },
  summary: {
    professionalCandidateIds,
    originalityClearedProfessionalCandidateIds,
    originalityBlockedProfessionalCandidateIds,
    belowProfessionalBarIds,
    hardFailAssetIds,
    blindPairwiseComparisonCount,
    blindPairwiseDecision: {
      comparisonScope: "ONE_CONTROLLED_NEUTRAL_LABEL_IDENTICAL_BRIEF",
      round3CandidateId: blindRound3Candidate.id,
      winner: blindComparison.winner,
      winnerAfterUnblinding: blindAssignment.review.identityAfterUnblinding,
      decisiveWinner: blindAssignment.review.decisiveWinner,
      supportsSuiteWideOldVsNewConclusion: false,
    },
    approvedGoldenSetIds: [],
    releaseDecision: "KEEP_CREATIVE_PRODUCTION_BLOCKED",
    releaseBlockers: [
      `${belowProfessionalBarIds.length} of 12 exact-current-hash critique sets remain below the unanimous professional bar.`,
      `The feed originality gate is ${originality.overallFeedDecision.decision}; blocked candidates: ${originality.overallFeedDecision.blockingCandidateIds.join(", ")}.`,
      hardFailAssetIds.length ? `Current hard-fail assets: ${hardFailAssetIds.join(", ")}.` : "No round-three hard fail remains.",
      ...(blindPairwiseComparisonCount === 0 ? ["A neutral-label independent old-versus-new comparison is still required."] : []),
      `The only controlled neutral-label identical-brief comparison covers ${blindRound3Candidate.id}; it does not establish suite-wide old-versus-new superiority.`,
      "No owner approval or production release authorization has been recorded for these benchmark hashes.",
    ],
  },
};

await writeFile(join(root, outputPath), `${JSON.stringify(integrated, null, 2)}\n`, "utf8");

const roleOrder: ProfessionalCritique["criticRole"][] = ["SENIOR_ART_DIRECTOR", "SENIOR_GRAPHIC_DESIGNER", "SOCIAL_PERFORMANCE_STRATEGIST", "ARABIC_DESIGN_REVIEWER"];
const tableRows = critiqueSets.map((set) => {
  const scores = roleOrder.map((role) => set.critiques.find((critique) => critique.criticRole === role)?.total ?? "—");
  const originalityDecision = originalityByAsset.get(set.renderedAssetId)?.decision ?? "MISSING";
  return `| ${set.renderedAssetId} | ${scores.join(" | ")} | ${set.finalDecision} | ${originalityDecision} |`;
});
const report = `# Round 3 integrated critique report

Status: **KEEP_CREATIVE_PRODUCTION_BLOCKED**  
Manifest: \`${manifestSha256}\`

Every critique below was validated against the shared \`ProfessionalCritiqueSchema\` and the exact original-pixel hash in the hash-anchored, tamper-evident round-three manifest. The working-tree archive is not represented as filesystem-immutable. Arabic candidates include the fourth Arabic design reviewer; English candidates include the three required independent roles.

| Candidate | Art director | Graphic designer | Social strategist | Arabic reviewer | Integrated critique | Originality |
|---|---:|---:|---:|---:|---|---|
${tableRows.join("\n")}

## Evidence-backed outcome

- Unanimous professional critique candidates: ${professionalCandidateIds.join(", ")}.
- Professional critique plus candidate-level originality clear: ${originalityClearedProfessionalCandidateIds.join(", ")}.
- Professional critique but blocked by feed self-repetition: ${originalityBlockedProfessionalCandidateIds.join(", ")}.
- Below the unanimous professional bar: ${belowProfessionalBarIds.join(", ")}.
- Current hard-fail assets: ${hardFailAssetIds.join(", ") || "none"}.
- Controlled neutral-label identical-brief comparisons: ${blindPairwiseComparisonCount}.
- Candidate ${blindRound3Candidate.id} decisively won that single matched comparison after unblinding (${blindComparison.winner}: ${blindAssignment.review.identityAfterUnblinding}).
- Comparison scope: this one candidate-level result does not establish suite-wide old-versus-new superiority.
- Approved golden-set assets: none; owner approval and the remaining release gates are absent.

## Historical input reproducibility caveat

The Senior Art Director, Senior Graphic Designer, and Social Performance Strategist reviews retain the historical GOLDEN_SET.md SHA-256 \`${historicalGoldenSetSha256}\`. The mutable path now contains the later governance revision \`${currentGoldenSetSha256}\`; the historical bytes are no longer reproducible from that path. The independent review files were intentionally left unchanged so their exact review hashes remain valid. Future reviewed governance inputs should be retained under content-addressed snapshot paths.

Candidate ${blindRound3Candidate.id} decisively improves on its matched legacy output in one controlled comparison. The quality gate remains in benchmarking because that result is not suite-wide proof, the repeated 07/12 feed shell remains unresolved, below-bar pixels require revision and re-review, and the owner has not approved release.
`;
await writeFile(join(root, reportPath), report, "utf8");

console.log(JSON.stringify({ outputPath, reportPath, professionalCandidateIds, originalityClearedProfessionalCandidateIds, releaseDecision: integrated.summary.releaseDecision }, null, 2));
