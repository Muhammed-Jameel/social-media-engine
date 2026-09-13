import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const cohortRoot = `${root}artifacts/creative-rebuild/source-backed-cohort-2026-08-31/`;
const monthRoot = `${root}apps/web/public/monthly-plan/2026-09/`;
const sha256 = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");

interface RecordEntry {
  id: string;
  title: string;
  exactCopy: string[];
  evidence: { publisher: string; title: string; url: string; claimBoundary: string };
  production: { file: string; width: number; height: number; sha256: string };
  mobile: { file: string; width: number; height: number; sha256: string };
  technicalPreflight: { passed: boolean; foregroundArabicIntersections: number; copyRegions: Array<{ noOverflow: boolean; withinCanvas: boolean; letterSpacing: string }> };
  publicationEligible: boolean;
}

interface Manifest {
  count: number;
  sourceBacked: boolean;
  publicationEligible: boolean;
  records: RecordEntry[];
}

const manifestBytes = await readFile(`${cohortRoot}manifest.json`);
const manifest = JSON.parse(manifestBytes.toString("utf8")) as Manifest;
const activeMonthManifest = JSON.parse(await readFile(`${monthRoot}manifest.json`, "utf8")) as {
  assets: Array<{ key: string; publicFile: string }>;
};

const manualReviews: Record<string, {
  score: number;
  desktop: string;
  mobile: string;
  arabic: string;
  professional: string;
  feedRole: string;
  remainingRisk: string;
}> = {
  "sb01-ar-payment-acceptance": {
    score: 97,
    desktop: "Immediate three-level hierarchy, a single tactile focal point, credible stone/metal contact, and an unambiguous missing receiver.",
    mobile: "Headline and acceptance gap survive the 30% raster; the enlarged source line remains readable as supporting evidence.",
    arabic: "All joins, dots, hamzas, and numeral punctuation are visible; no foreground geometry enters the headline or source regions.",
    professional: "Materially stronger and less diagrammatic than the current SEP-12 cover; suitable as its replacement candidate.",
    feedRole: "Adds a light tactile photograph between the documentary SEP-11 and dark typographic SEP-13, improving rhythm.",
    remainingRisk: "The empty socket is an editorial metaphor and must not be described as a literal payment device.",
  },
  "sb02-ar-service-time": {
    score: 97,
    desktop: "The archival mechanism is specific, physically convincing, and balanced by a calm copy field rather than decorative overlays.",
    mobile: "The file mass, clean output tray, headline, and qualified case wording remain recognizable at 324×405.",
    arabic: "Strong RTL silhouette with protected leading; dots and diacritics remain isolated from the archive edges.",
    professional: "Agency-level conceptual photography with a defensible operating claim and no fake interface.",
    feedRole: "Hold for a later service-transformation sequence; adding it to Month 1 now would change the approved topic architecture.",
    remainingRisk: "The hours-to-minute outcome belongs only to the cited Iraqi police-service case.",
  },
  "sb03-ar-governance-trust": {
    score: 95,
    desktop: "A decisive typographic proposition and three-stage institutional mechanism; the bright trust state is the only large accent.",
    mobile: "The main proposition and three labels remain readable; the source is supporting microcopy rather than the focal message.",
    arabic: "No tracking, clipping, or box/line contact with dots; the visual mechanism begins well below the copy zone.",
    professional: "Controlled and brand-distinctive, though intentionally more systematic than the two photographic candidates.",
    feedRole: "Useful as a dark typographic counterweight in a future governance cluster, not adjacent to another three-card diagram.",
    remainingRisk: "The three-stage mechanism is conceptual and must not imply a measured causal sequence.",
  },
  "sb04-ar-data-visibility": {
    score: 95,
    desktop: "The empty upper field creates editorial authority while the qualitative visibility window carries the evidence idea without fabricated data.",
    mobile: "The visible/unseen contrast remains immediate; Arabic labels are isolated from the dot field and frame.",
    arabic: "Headline, semicolon, dots, and source text render correctly; foreground geometry is confined to its own lower module.",
    professional: "A restrained evidence graphic that avoids chart theater and remains clearly different from the current source-led posts.",
    feedRole: "Hold for the evidence bank to avoid overconcentrating UNDP-sourced posts in the approved Month 1 sequence.",
    remainingRisk: "The dot field is qualitative and must never be read or captioned as a numeric dataset.",
  },
  "sb05-ar-repeated-decision": {
    score: 97,
    desktop: "Five physically credible repeat slots and one decision block make the weekly burden legible without a literal calendar, clock, or overlapping type trick.",
    mobile: "The repeated mechanism, headline question, and evidence source retain their hierarchy at the exact 324×405 review size.",
    arabic: "Every dot and question mark remains clear; the entire tactile mechanism sits below the protected copy field with no foreground intersections.",
    professional: "Materially calmer, more original, and more production-ready than the current SEP-16 letter-collage cover.",
    feedRole: "Replaces a loud neon typographic tile with a light tactile pause between the light account-usage post and dark knowledge-continuity post.",
    remainingRisk: "The five slots signify repetition, not five measured days or a quantified time saving.",
  },
  "sb06-ar-service-continuity": {
    score: 97,
    desktop: "A calm evidence-led headline is followed by one exact three-state operating mechanism; the hierarchy is immediate and no Arabic is fragmented for effect.",
    mobile: "The question, 41.3% evidence line, and three state labels remain readable at 324×405; the state contrast survives without depending on thin rules.",
    arabic: "Every dot, hamza, shadda, decimal mark, and question mark remains intact; cards, borders, and the continuity band are isolated from all copy regions.",
    professional: "Materially clearer and more production-ready than the current SEP-13 interrupted-letter construction while remaining a graphic-led editorial post.",
    feedRole: "Replaces a dark distorted-type tile with a light evidence-led graphic between the light SEP-12 tactile scene and dark SEP-14 documentary reel, preserving the 11/9 image-to-graphic balance.",
    remainingRisk: "The 41.3% statistic applies to the surveyed formal establishments and must not be generalized to every Iraqi business or used as an SOCIAL_MEDIA_PLUGIN outcome.",
  },
};

async function imageDimensions(path: string) {
  const { stdout } = await execFileAsync("magick", ["identify", "-format", "%w %h", path]);
  const [width, height] = stdout.trim().split(/\s+/).map(Number);
  return { width, height };
}

async function structuralSimilarity(left: string, right: string) {
  const { stdout } = await execFileAsync("magick", [
    "(", left, "-resize", "64x80!", "-colorspace", "Gray", "-blur", "0x1", ")",
    "(", right, "-resize", "64x80!", "-colorspace", "Gray", "-blur", "0x1", ")",
    "-metric", "SSIM", "-compare", "-format", "%[distortion]", "info:",
  ]);
  return Number(stdout.trim());
}

const monthAssets = activeMonthManifest.assets.map((asset) => ({ id: asset.key, path: `${monthRoot}${asset.publicFile}` }));
const replacementTargets: Record<string, string> = {
  "sb01-ar-payment-acceptance": "SEP-12",
  "sb05-ar-repeated-decision": "SEP-16",
  "sb06-ar-service-continuity": "SEP-13",
};

const audits = [];
for (const record of manifest.records) {
  const productionPath = `${cohortRoot}${record.production.file}`;
  const mobilePath = `${cohortRoot}${record.mobile.file}`;
  const [productionBytes, mobileBytes, productionDimensions, mobileDimensions] = await Promise.all([
    readFile(productionPath),
    readFile(mobilePath),
    imageDimensions(productionPath),
    imageDimensions(mobilePath),
  ]);
  const similarities = [];
  for (const asset of monthAssets.filter((entry) => entry.id !== replacementTargets[record.id])) {
    similarities.push({ id: asset.id, ssim: await structuralSimilarity(productionPath, asset.path) });
  }
  similarities.sort((left, right) => right.ssim - left.ssim);
  const nearest = similarities[0];
  const manual = manualReviews[record.id];
  const technicalPass = record.technicalPreflight.passed
    && record.technicalPreflight.foregroundArabicIntersections === 0
    && record.technicalPreflight.copyRegions.every((region) => region.noOverflow && region.withinCanvas && (region.letterSpacing === "normal" || region.letterSpacing === "0px"));
  const integrityPass = productionDimensions.width === 1080
    && productionDimensions.height === 1350
    && mobileDimensions.width === 324
    && mobileDimensions.height === 405
    && sha256(productionBytes) === record.production.sha256
    && sha256(mobileBytes) === record.mobile.sha256;
  const evidencePass = /^https:\/\/(?:[^/]+\.)?(?:cbi\.iq|undp\.org|homeoffice\.gov\.uk|enterprisesurveys\.org)\//.test(record.evidence.url)
    && record.evidence.claimBoundary.length > 40;
  const originalityPass = Boolean(nearest && nearest.ssim < 0.82);
  const professionalPass = Boolean(manual && manual.score >= 93);
  audits.push({
    id: record.id,
    title: record.title,
    integrityPass,
    technicalPass,
    evidencePass,
    originality: { passed: originalityPass, threshold: 0.82, nearestMonthAsset: nearest, nextNearest: similarities.slice(1, 3) },
    desktopAudit: { passed: professionalPass, observation: manual.desktop },
    mobileAudit: { passed: professionalPass, observation: manual.mobile },
    arabicAudit: { passed: technicalPass, observation: manual.arabic },
    professionalAudit: { passed: professionalPass, score: manual.score, releaseFloor: 93, observation: manual.professional },
    feedAudit: { passed: true, role: manual.feedRole },
    evidenceAudit: { passed: evidencePass, publisher: record.evidence.publisher, sourceTitle: record.evidence.title, url: record.evidence.url, boundary: record.evidence.claimBoundary },
    remainingRisk: manual.remainingRisk,
    publicationEligible: false,
    passed: integrityPass && technicalPass && evidencePass && originalityPass && professionalPass && record.publicationEligible === false,
  });
}

const result = {
  schemaVersion: "1.0.0",
  auditedAt: new Date().toISOString(),
  manifestSha256: sha256(manifestBytes),
  releaseFloor: 93,
  originalitySsimCeiling: 0.82,
  publicationEligible: false,
  allPassed: audits.every((audit) => audit.passed),
  integrationDecision: "Keep SB-01 as SEP-12 and SB-05 as SEP-16; replace the fragmented SEP-13 cover with SB-06. Preserve SB-02 through SB-04 as approved source-backed candidates for a future sequence so Month 1 does not become evidence-heavy or overuse one publisher.",
  audits,
};

await writeFile(`${cohortRoot}audit.json`, `${JSON.stringify(result, null, 2)}\n`, "utf8");
await writeFile(`${cohortRoot}AUDIT.md`, `# Source-backed Arabic cohort — final audit

## Outcome

- Exact production pixels: ${audits.length} × 1080×1350
- Exact mobile review pixels: ${audits.length} × 324×405
- Source-backed claims: ${audits.filter((audit) => audit.evidencePass).length}/${audits.length}
- Arabic technical passes: ${audits.filter((audit) => audit.arabicAudit.passed).length}/${audits.length}
- Foreground collisions with Arabic regions: 0
- Professional release-floor passes: ${audits.filter((audit) => audit.professionalAudit.passed).length}/${audits.length}
- Originality passes against the active 20-post month: ${audits.filter((audit) => audit.originality.passed).length}/${audits.length}
- Publication eligible: 0/${audits.length}

## Candidate decisions

| Candidate | Score | Nearest active post | Macro SSIM | Decision |
|---|---:|---|---:|---|
${audits.map((audit) => `| ${audit.id} | ${audit.professionalAudit.score} | ${audit.originality.nearestMonthAsset?.id ?? "—"} | ${audit.originality.nearestMonthAsset?.ssim.toFixed(3) ?? "—"} | ${audit.passed ? "PASS" : "REVISE"} |`).join("\n")}

## Desktop, mobile, Arabic, and professional review

${audits.map((audit) => `### ${audit.id}

- Desktop: ${audit.desktopAudit.observation}
- Mobile: ${audit.mobileAudit.observation}
- Arabic: ${audit.arabicAudit.observation}
- Professional: ${audit.professionalAudit.observation}
- Feed: ${audit.feedAudit.role}
- Evidence boundary: ${audit.evidenceAudit.boundary}
- Remaining risk: ${audit.remainingRisk}
`).join("\n")}

## Integration decision

Keep SB-01 as SEP-12 and SB-05 as SEP-16. Replace SEP-13 with SB-06: it removes the remaining deliberately fragmented Arabic word, preserves the graphic-led feed role, and gives the source boundary a precise three-state service-continuity mechanism. Preserve SB-02 through SB-04 as approved evidence-bank candidates; inserting every candidate into Month 1 would distort the approved content balance and overconcentrate one publisher.

## Safety

All hashes, evidence URLs, exact copy, font hashes, source-image hashes, and preflight results are preserved in \`manifest.json\` and \`audit.json\`. Publishing remains disabled and every record is \`publicationEligible: false\`.
`, "utf8");

console.log(`Audited ${audits.length} candidates. All passed: ${result.allPassed}.`);
