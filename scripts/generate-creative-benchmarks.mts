import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  SOCIAL_MEDIA_PLUGIN_CREATIVE_BRAND_VERSION,
  CANONICAL_HORIZONTAL_LOGO_SOURCE_SHA256,
  duplicateCreativeFingerprints,
  evaluateTechnicalCreativePreflight,
  fingerprintSvg,
  renderSocialSvg,
  type SocialSvgInput,
} from "../packages/engine/src/creative";

interface BenchmarkDefinition {
  id: string;
  filename: string;
  language: "ar" | "en";
  platform: "instagram" | "linkedin";
  audience: string;
  visualJob: string;
  creativeConcept: string;
  input: SocialSvgInput;
  designBrief: {
    layout: string;
    imagery: string;
    assetNeeds: string[];
  };
  productionChecklist: string[];
  testVariant: string;
}

const benchmarkDefinitions: BenchmarkDefinition[] = [
  {
    id: "ar-system-light",
    filename: "01-ar-system-light.svg",
    language: "ar",
    platform: "instagram",
    audience: "Iraqi and regional founders whose teams have accumulated disconnected tools.",
    visualJob: "Reframe the problem from buying another tool to designing a coherent operating system.",
    creativeConcept: "A calm, paper-light strategy card with a strong Arabic thesis and a single neon signal line.",
    input: {
      kicker: "منظومة لا أداة",
      headline: "لا تحتاج شركتك إلى أدوات أكثر",
      support: "تحتاج إلى منظومة رقمية تربط القرار بالتنفيذ، وتحول التعقيد إلى نمو يمكن قياسه.",
      footer: "اورندور · الحضارة الرقمية تبدأ من الوضوح",
      layout: "system_map",
      direction: "rtl",
      mode: "light",
      width: 1080,
      height: 1350,
    },
    designBrief: {
      layout: "4:5 asymmetric systems map; RTL hero copy on the right; decide–execute–measure operating loop on the left; compact action rail.",
      imagery: "No stock imagery. A functional three-node operating map replaces decorative geometry and fills the counter-field with meaning.",
      assetNeeds: ["Dh Ranclo", "Ghroob Arabic ITF", "FINAL 2026 green tokens"],
    },
    productionChecklist: [
      "Proof Arabic spelling and shaping in the final raster exporter.",
      "Embed or package the approved Dh Ranclo and Ghroob Arabic ITF font files.",
      "Run two independent visual critics and reconcile material disagreement.",
      "Bind the final raster hash to owner approval before scheduling.",
    ],
    testVariant: "Dark-field version with the same thesis and a shorter support line.",
  },
  {
    id: "ar-ai-dark",
    filename: "02-ar-ai-dark.svg",
    language: "ar",
    platform: "instagram",
    audience: "Business owners evaluating AI through features rather than operating impact.",
    visualJob: "Position AI as operating infrastructure whose value is proven through decision quality and execution speed.",
    creativeConcept: "A deep-green night field with a neon systems motif, designed to feel infrastructural rather than futuristic-cliché.",
    input: {
      kicker: "ذكاء يعمل داخل النظام",
      headline: "الذكاء الاصطناعي ليس طبقة تجميلية",
      support: "قيمته تظهر عندما يختصر زمن القرار، ويرفع جودة التنفيذ، ويترك أثرا يمكن إثباته.",
      footer: "اورندور · الذكاء قيمة تشغيلية لا استعراض",
      direction: "rtl",
      mode: "dark",
      width: 1080,
      height: 1350,
    },
    designBrief: {
      layout: "4:5 dark editorial field; assertive RTL headline; luminous system trace; compact evidence rail.",
      imagery: "No humanoid robots, glowing brains, or generic AI particles. Use only restrained systems geometry.",
      assetNeeds: ["Dh Ranclo", "Ghroob Arabic ITF", "FINAL 2026 dark and neon tokens"],
    },
    productionChecklist: [
      "Verify neon-on-deep-green contrast after platform compression.",
      "Proof Arabic glyph shaping, punctuation, and line breaks at 375 px preview width.",
      "Confirm no glow, gradient, or AI-stock cliché was introduced during raster export.",
      "Require signed owner approval for the exact copy and raster hash.",
    ],
    testVariant: "Evidence-led light version that replaces the abstract claim with one sourced operational metric.",
  },
  {
    id: "en-operating-system-light",
    filename: "03-en-operating-system-light.svg",
    language: "en",
    platform: "linkedin",
    audience: "Regional executives aligning strategy, product, data, and AI across fragmented delivery teams.",
    visualJob: "Name the missing connective layer between digital initiatives and measurable execution.",
    creativeConcept: "A clean English editorial cover whose grid and repeated system frame signal orchestration and compounding value.",
    input: {
      kicker: "FROM PROJECTS TO SYSTEMS",
      headline: "Digital growth needs an operating system",
      support: "Connect strategy, product, data, and AI around decisions your team can execute and measure.",
      footer: "SOCIAL_MEDIA_PLUGIN · Build what compounds",
      direction: "ltr",
      mode: "light",
      width: 1080,
      height: 1350,
    },
    designBrief: {
      layout: "4:5 left-aligned editorial cover; high-contrast thesis; modular system frame; generous whitespace.",
      imagery: "No stock photo. Nested linework acts as a visual model for connected operating layers.",
      assetNeeds: ["Dh Ranclo", "FINAL 2026 green tokens"],
    },
    productionChecklist: [
      "Check English line breaks using the production Dh Ranclo files.",
      "Preview at LinkedIn mobile feed width and verify the headline reads without expansion.",
      "Run independent brand and visual critics before owner review.",
      "Export a verified sRGB raster and bind its hash to the publication plan.",
    ],
    testVariant: "Executive proof variant with a sourced metric in place of the support sentence.",
  },
];

const outputDirectory = fileURLToPath(new URL("../artifacts/creative-benchmarks/", import.meta.url));
await mkdir(outputDirectory, { recursive: true });

const rendered = benchmarkDefinitions.map((definition) => {
  const svg = renderSocialSvg(definition.input);
  const evaluation = evaluateTechnicalCreativePreflight({ input: definition.input, svg, assetLicenseStatus: "NOT_REQUIRED" });
  if (evaluation.hardFails.length > 0) {
    throw new Error(`${definition.id} failed deterministic creative gates: ${evaluation.hardFails.map((failure) => failure.code).join(", ")}`);
  }
  return { definition, svg, evaluation };
});

const duplicates = duplicateCreativeFingerprints(rendered.map((creative) => creative.svg));
if (duplicates.length > 0) throw new Error(`Duplicate creative fingerprints detected: ${duplicates.join(", ")}`);

for (const creative of rendered) {
  await writeFile(new URL(creative.definition.filename, `file://${outputDirectory}/`), `${creative.svg}\n`, "utf8");
}

const sharedLimitations = [
  "The SVG masters use deterministic native-text line breaks; final font metrics can still shift across exporters and require raster inspection.",
  "Dh Ranclo and Ghroob Arabic ITF are referenced by family name but are not embedded in the benchmark SVG files.",
  "Automated checks cannot verify optical balance, glyph shaping in every exporter, unexpected raster clipping, originality, or final polish.",
  "No output is publication-ready until two independent visual critics, brand/compliance review, and signed owner approval are complete.",
];

const manifest = {
  schemaVersion: "1.0.0",
  generatorVersion: "1.0.0",
  brandVersion: SOCIAL_MEDIA_PLUGIN_CREATIVE_BRAND_VERSION,
  deterministic: true,
  canonicalLogo: {
    source: "SOCIAL_MEDIA_PLUGIN VISUAL IDENTITY/logo versions/horizontal logo/SVG/Asset 14.svg",
    sourceSha256: CANONICAL_HORIZONTAL_LOGO_SOURCE_SHA256,
    embedding: "Exact path geometry with mode-specific canonical fill.",
  },
  visualInspection: {
    status: "NOT_PERFORMED",
    publicationClaim: false,
    note: "The generator records only deterministic checks. A visual critic pass must be added as separate, evidenced review data.",
  },
  externalReviewEvidence: ["visual-review-2026-08-23.json"],
  releasePolicy: {
    automatedGate: "A hard fail rejects the creative.",
    visualGate: "A clean automated result remains VISUAL_REVIEW_REQUIRED.",
    publicationCandidateThreshold: 93,
    independentCriticsRequired: 2,
  },
  creatives: rendered.map(({ definition, svg, evaluation }) => ({
    id: definition.id,
    file: definition.filename,
    sha256: fingerprintSvg(`${svg}\n`),
    svgContentSha256: fingerprintSvg(svg),
    byteLength: Buffer.byteLength(`${svg}\n`, "utf8"),
    dimensions: { width: definition.input.width, height: definition.input.height, aspectRatio: "4:5" },
    format: "single-image SVG master",
    platform: definition.platform,
    language: definition.language,
    direction: definition.input.direction,
    mode: definition.input.mode,
    audience: definition.audience,
    visualJob: definition.visualJob,
    creativeConcept: definition.creativeConcept,
    copyOverlay: {
      kicker: definition.input.kicker,
      headline: definition.input.headline,
      support: definition.input.support,
      footer: definition.input.footer,
    },
    designBrief: definition.designBrief,
    assetLicenseStatus: "NOT_REQUIRED",
    productionChecklist: definition.productionChecklist,
    testVariant: definition.testVariant,
    knownLimitations: sharedLimitations,
    automatedEvaluation: evaluation,
  })),
};

await writeFile(new URL("manifest.json", `file://${outputDirectory}/`), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const readme = `# SOCIAL_MEDIA_PLUGIN creative benchmarks\n\nThese three deterministic SVG masters exercise Arabic RTL, light/dark contrast, English LTR rendering, the canonical horizontal logo, and one materially different system-map layout against the FINAL 2026 identity. The matching PNG files are inspected Chromium smoke-check previews, not publishing exports.\n\nThey are benchmark inputs, not approved social posts. The manifest records generator-level objective checks and intentionally leaves its own visual inspection as \`NOT_PERFORMED\`. A separate dated review artifact records one pre-revision independent critique plus a post-revision raster smoke check; because every asset hash changed during revision, it correctly leaves the current set at \`REVISE\` with two current-hash critics still required. Before publication, rasterize with the production fonts, inspect at mobile size, obtain two independent visual critiques, complete brand/compliance review, and bind the approved asset hash to the publication plan.\n`;
await writeFile(new URL("README.md", `file://${outputDirectory}/`), readme, "utf8");

console.log(`Generated ${rendered.length} SOCIAL_MEDIA_PLUGIN creative benchmarks in ${outputDirectory}`);
