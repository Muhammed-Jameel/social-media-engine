import { execFile } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const outputRoot = `${root}artifacts/creative-rebuild/professional-learning-path-2026-08-30/`;
const runs = [
  {
    id: "arabic-learning-loop-2026-08-29",
    directory: `${root}artifacts/creative-rebuild/arabic-learning-loop-2026-08-29/`,
  },
  {
    id: "arabic-learning-loop-continuation-2026-08-30",
    directory: `${root}artifacts/creative-rebuild/arabic-learning-loop-continuation-2026-08-30/`,
  },
];

const qualityResetByCandidate = new Map<string, Record<string, unknown>>();
for (const decisionFile of ["quality-reset-round-1.jsonl", "quality-reset-rebuilds.jsonl"]) {
  try {
    const decisionLines = (await readFile(`${outputRoot}${decisionFile}`, "utf8"))
      .trim()
      .split(/\n+/)
      .filter(Boolean);
    for (const line of decisionLines) {
      const decision = JSON.parse(line);
      qualityResetByCandidate.set(decision.candidateId, decision);
    }
  } catch {
    // The feature dataset can be built before either human-label round exists.
  }
}

interface ImageMetrics {
  width: number;
  height: number;
  luminanceMean: number;
  luminanceStandardDeviation: number;
  entropy: number;
  edgeDensity: number;
}

async function metrics(path: string): Promise<ImageMetrics> {
  const { stdout: base } = await execFileAsync("magick", [
    path,
    "-colorspace",
    "Gray",
    "-format",
    "%w,%h,%[fx:mean],%[fx:standard_deviation],%[entropy]",
    "info:",
  ]);
  const { stdout: edge } = await execFileAsync("magick", [
    path,
    "-colorspace",
    "Gray",
    "-morphology",
    "Convolve",
    "Laplacian:0",
    "-threshold",
    "8%",
    "-format",
    "%[fx:mean]",
    "info:",
  ]);
  const [width, height, luminanceMean, luminanceStandardDeviation, entropy] = base.trim().split(",").map(Number);
  return { width, height, luminanceMean, luminanceStandardDeviation, entropy, edgeDensity: Number(edge.trim()) };
}

const records = [];
for (const run of runs) {
  const entries = (await readdir(run.directory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^iteration-\d+$/.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const iterationRoot = `${run.directory}${entry.name}/`;
    const manifest = JSON.parse(await readFile(`${iterationRoot}manifest.json`, "utf8"));
    const candidate = manifest.candidate;
    const qualityReset = qualityResetByCandidate.get(candidate.id);
    let review = "";
    try {
      review = await readFile(`${iterationRoot}REVIEW.md`, "utf8");
    } catch {
      // Pending or intentionally unreviewed candidates remain valid dataset rows.
    }
    const legacyScoreMatch = review.match(/Integrated score:\s*\*\*(\d+)\/160\*\*/);
    const oldRunRejected = run.id === "arabic-learning-loop-2026-08-29" && [1, 3].includes(manifest.iteration);
    const pending = run.id === "arabic-learning-loop-continuation-2026-08-30" && manifest.iteration === 35;
    const originalPath = `${iterationRoot}${candidate.file}`;
    const mobilePath = `${iterationRoot}${candidate.mobileFile}`;
    records.push({
      datasetVersion: "quality-reset-1",
      runId: run.id,
      iteration: manifest.iteration,
      candidateId: candidate.id,
      title: candidate.title,
      language: candidate.language,
      exactCopy: candidate.exactCopy,
      sourcePromptSummary: candidate.sourcePromptSummary,
      rawProfessionalReferencePixelsSuppliedToGeneration: candidate.rawProfessionalReferencePixelsSuppliedToGeneration,
      publicationEligible: manifest.publicationEligible,
      legacy: {
        status: oldRunRejected ? "rejected" : pending ? "pending" : "provisional",
        integratedScoreOutOf160: legacyScoreMatch ? Number(legacyScoreMatch[1]) : null,
      },
      qualityReset: {
        status: qualityReset?.reviewRound === "rebuild" ? "rebuild-graded" : qualityReset ? "round-1-graded" : pending ? "pending" : "ungraded",
        replacesCandidateId: qualityReset?.replacesCandidateId ?? null,
        scoreOutOf100: qualityReset?.scoreOutOf100 ?? null,
        dimensionScores: qualityReset?.dimensions ?? null,
        failureCodes: qualityReset?.failureCodes ?? [],
        decision: qualityReset?.decision ?? null,
        rationale: qualityReset?.rationale ?? null,
      },
      original: {
        relativePath: originalPath.slice(root.length),
        sha256: candidate.sha256,
        byteLength: candidate.byteLength,
        metrics: await metrics(originalPath),
      },
      mobile: {
        relativePath: mobilePath.slice(root.length),
        sha256: candidate.mobileSha256,
        metrics: await metrics(mobilePath),
      },
      sourceImage: candidate.sourceImage
        ? { relativePath: `${iterationRoot}${candidate.sourceImage}`.slice(root.length), sha256: candidate.sourceImageSha256 }
        : null,
      technicalPreflight: candidate.technicalPreflight,
    });
  }
}

await mkdir(outputRoot, { recursive: true });
await writeFile(`${outputRoot}social-output-dataset.json`, `${JSON.stringify({
  schemaVersion: "1.0.0",
  generatedAt: new Date().toISOString(),
  purpose: "Strict professional-quality recalibration; legacy passes are provisional.",
  records,
}, null, 2)}\n`, "utf8");

const roundOneRecords = records.filter((record) => record.qualityReset.status === "round-1-graded");
const successfulReplacements = records.filter((record) => record.qualityReset.status === "rebuild-graded" && record.qualityReset.decision === "retain");
const activeRebuildsRemaining = roundOneRecords.filter((record) => record.qualityReset.decision === "rebuild").length - successfulReplacements.length;
const summary = `# SOCIAL_MEDIA_PLUGIN Output Dataset Summary\n\n- Records: ${records.length}.\n- Original renders: ${records.length}.\n- Mobile renders: ${records.length}.\n- Legacy rejections: ${records.filter((record) => record.legacy.status === "rejected").length}.\n- Former passes reset to provisional before regrade: ${records.filter((record) => record.legacy.status === "provisional").length}.\n- Round-1 retained: ${roundOneRecords.filter((record) => record.qualityReset.decision === "retain").length}.\n- Successful professional replacements: ${successfulReplacements.length}.\n- Active retained set: ${roundOneRecords.filter((record) => record.qualityReset.decision === "retain").length + successfulReplacements.length}.\n- Active rebuild queue remaining: ${activeRebuildsRemaining}.\n- Round-1 retired: ${roundOneRecords.filter((record) => record.qualityReset.decision === "retire").length}.\n- Extraordinary tier (93+): ${records.filter((record) => (record.qualityReset.scoreOutOf100 ?? 0) >= 93).length}.\n- Publication eligible: ${records.filter((record) => record.publicationEligible).length}.\n\nHistorical failed originals remain in the dataset for supervised comparison, but a successful replacement removes its predecessor from the active rebuild queue. Objective metrics are diagnostic features only. Retain/rebuild/retire decisions require exact-pixel human review under \`EXTRAORDINARY-RUBRIC.md\`.\n`;
await writeFile(`${outputRoot}OUTPUT-DATASET-SUMMARY.md`, summary, "utf8");

const decisionRows = roundOneRecords
  .filter((record) => record.qualityReset.decision)
  .sort((a, b) => (a.qualityReset.scoreOutOf100 ?? 0) - (b.qualityReset.scoreOutOf100 ?? 0));
const renderDecisionTable = (decision: string) => decisionRows
  .filter((record) => record.qualityReset.decision === decision)
  .map((record) => `| ${record.iteration} | \`${record.candidateId}\` | ${record.qualityReset.scoreOutOf100} | ${(record.qualityReset.failureCodes as string[]).join(", ") || "—"} | ${record.qualityReset.rationale} |`)
  .join("\n");
const roundOneReport = `# Quality Reset — Round 1 Blind Regrade\n\n## Result\n\n- Retain: ${roundOneRecords.filter((record) => record.qualityReset.decision === "retain").length}.\n- Rebuild: ${roundOneRecords.filter((record) => record.qualityReset.decision === "rebuild").length}.\n- Retire: ${roundOneRecords.filter((record) => record.qualityReset.decision === "retire").length}.\n- Extraordinary tier: ${roundOneRecords.filter((record) => (record.qualityReset.scoreOutOf100 ?? 0) >= 93).length}.\n- Publication eligible: 0.\n\nAll old scores were hidden during mobile cohort, desktop borderline, and tentative-top feed review. Scores below are the first human labels under the 100-point extraordinary rubric. Later replacement labels are intentionally stored separately in \`quality-reset-rebuilds.jsonl\`.\n\n## Rebuild queue — lowest score first\n\n| Iteration | Candidate | Score | Failure codes | Reason |\n|---:|---|---:|---|---|\n${renderDecisionTable("rebuild")}\n\n## Retire\n\n| Iteration | Candidate | Score | Failure codes | Reason |\n|---:|---|---:|---|---|\n${renderDecisionTable("retire")}\n\n## Retain\n\n| Iteration | Candidate | Score | Failure codes | Reason |\n|---:|---|---:|---|---|\n${renderDecisionTable("retain")}\n\n## Next action\n\nRebuild the lowest-score cohort by replacing the concept mechanism rather than polishing the existing layout. Re-run individual, mobile, retained-feed, and full technical gates after each replacement.\n`;
await writeFile(`${outputRoot}ROUND-1-REGRADE.md`, roundOneReport, "utf8");

console.log(`Built quality-reset dataset with ${records.length} record(s).`);
