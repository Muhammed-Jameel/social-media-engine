import { createHash, randomUUID } from "node:crypto";
import type { CapabilityState, DesignBrief } from "@social-media-plugin/schemas";

export const SOCIAL_MEDIA_PLUGIN_CREATIVE_BRAND_VERSION = "final-2026.1" as const;

export const SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS = {
  deep: "#003F35",
  neon: "#0EDB23",
  pale: "#77FF70",
  paper: "#F4F8F5",
  lightSecondary: "#3A5145",
} as const;

export const CANONICAL_HORIZONTAL_LOGO_SOURCE_SHA256 = "acf822a1f6f8038b8128639d76e3b9390a020a09eaa2a6188ce9123e08112e2a" as const;

export interface DesignCapabilities {
  create: CapabilityState;
  revise: CapabilityState;
  render: CapabilityState;
  editable: CapabilityState;
  reasons: string[];
}

export interface DesignDraft {
  id: string;
  provider: string;
  payload: Record<string, unknown>;
  editableUrl: string | null;
}

export interface DesignProvider {
  capabilities(): Promise<DesignCapabilities>;
  create(input: DesignBrief): Promise<DesignDraft[]>;
  revise(draftId: string, revision: { instructions: string[] }): Promise<DesignDraft>;
  render(draftId: string, format: "svg" | "png" | "jpg"): Promise<Array<{ mimeType: string; bytes: Uint8Array }>>;
  getEditableUrl(draftId: string): Promise<string | null>;
}

export interface SocialSvgInput {
  kicker: string;
  headline: string;
  support: string;
  footer?: string;
  layout?: "editorial" | "system_map";
  mode?: "light" | "dark";
  direction?: "rtl" | "ltr";
  width?: number;
  height?: number;
}

export type CreativeAssetLicenseStatus = "OWNED" | "LICENSED" | "UNKNOWN" | "NOT_REQUIRED";

export type CreativeHardFailCode =
  | "COPY_MISSING_FROM_RENDER"
  | "LOW_CONTRAST_PRIMARY"
  | "LOW_CONTRAST_SECONDARY"
  | "MISSING_ACCESSIBLE_LABELS"
  | "PLACEHOLDER_COPY"
  | "RTL_DIRECTION_MISMATCH"
  | "TEXT_CLIPPING_RISK"
  | "TEXT_DENSITY_EXCEEDED"
  | "UNAPPROVED_LICENSE"
  | "UNSUPPORTED_DIMENSIONS"
  | "WRONG_BRAND_COLOR"
  | "WRONG_LOGO";

export interface CreativeHardFail {
  code: CreativeHardFailCode;
  message: string;
}

export interface CreativeAutomationCheck {
  key: string;
  status: "PASS" | "FAIL" | "MANUAL_REVIEW";
  evidence: string;
}

export interface CreativeAutomationScore {
  conceptOriginality: number;
  hierarchy: number;
  typography: number;
  compositionGrid: number;
  brandDistinctiveness: number;
  messageClarity: number;
  readability: number;
  whitespace: number;
  graphicQuality: number;
  colorContrast: number;
  platformSuitability: number;
  polish: number;
}

export interface CreativeAutomationEvaluation {
  evaluatorVersion: "1.0.0";
  brandVersion: typeof SOCIAL_MEDIA_PLUGIN_CREATIVE_BRAND_VERSION;
  decision: "REJECTED_BY_AUTOMATION" | "AUTOMATED_CHECKS_PASSED_VISUAL_REVIEW_REQUIRED";
  hardFails: CreativeHardFail[];
  checks: CreativeAutomationCheck[];
  rubric: {
    scores: CreativeAutomationScore;
    diagnosticTotal: number;
    maximumPossibleWithoutVisualReview: 88.5;
    publicationCandidateThreshold: 93;
    cappedCategories: Array<"conceptOriginality" | "graphicQuality" | "polish">;
  };
  contrast: {
    primary: number;
    secondary: number;
    required: 4.5;
  };
  textDensity: {
    headlineCharacters: number;
    supportCharacters: number;
    totalCharacters: number;
    totalBudget: number;
  };
  visualInspection: {
    required: true;
    status: "NOT_PERFORMED";
    unresolvedChecks: string[];
  };
}

export interface TechnicalCreativePreflightEvaluation {
  evaluatorVersion: "2.0.0";
  brandVersion: typeof SOCIAL_MEDIA_PLUGIN_CREATIVE_BRAND_VERSION;
  decision: "REJECTED_BY_TECHNICAL_PREFLIGHT" | "TECHNICAL_PREFLIGHT_PASSED_PIXEL_REVIEW_REQUIRED";
  hardFails: CreativeHardFail[];
  checks: CreativeAutomationCheck[];
  contrast: CreativeAutomationEvaluation["contrast"];
  textDensity: CreativeAutomationEvaluation["textDensity"];
  aestheticEvaluation: {
    performed: false;
    score: null;
    reason: "Deterministic metadata and markup checks cannot establish visual quality.";
  };
  visualInspection: CreativeAutomationEvaluation["visualInspection"];
}

export interface EvaluateSocialCreativeInput {
  input: SocialSvgInput;
  svg: string;
  assetLicenseStatus: CreativeAssetLicenseStatus;
}

const SUPPORTED_SOCIAL_DIMENSIONS = new Set(["1080x1080", "1080x1350", "1080x1920", "1200x627"]);
const PLACEHOLDER_COPY = /\b(?:lorem|placeholder|tbd|todo)\b|ضع النص|نص تجريبي/iu;
const ARABIC_SCRIPT = /[\u0600-\u06FF]/u;

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

function expectedDirection(input: SocialSvgInput): "rtl" | "ltr" {
  return ARABIC_SCRIPT.test(`${input.headline} ${input.support} ${input.footer ?? ""}`) ? "rtl" : "ltr";
}

function paletteFor(mode: "light" | "dark") {
  return mode === "dark"
    ? {
        canvas: SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.deep,
        primary: SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.paper,
        secondary: SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.pale,
        card: "#00302A",
      }
    : {
        canvas: SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.paper,
        primary: SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.deep,
        secondary: SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.lightSecondary,
        card: "#FFFFFF",
      };
}

function typographyFor(input: SocialSvgInput) {
  const headlineCharacters = Array.from(input.headline.trim()).length;
  const headlineSize = headlineCharacters > 58 ? 56 : 64;
  return { headlineCharacters, headlineSize, supportSize: 35, footerSize: 31 };
}

function wrapText(value: string, maximumCharacters: number): string[] {
  const words = value.trim().split(/\s+/u);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (candidate.length <= maximumCharacters || current.length === 0) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

function renderTextLines(lines: string[], x: number, firstBaseline: number, lineHeight: number, direction: "rtl" | "ltr"): string {
  return lines
    .map(
      (line, index) =>
        `<text data-line-index="${index}" x="${x}" y="${firstBaseline + index * lineHeight}" text-anchor="${direction === "rtl" ? "middle" : "start"}" direction="${direction}" unicode-bidi="plaintext">${escapeXml(line)}</text>`,
    )
    .join("\n      ");
}

function copyBindingHash(input: SocialSvgInput, resolvedFooter: string): string {
  return createHash("sha256")
    .update(JSON.stringify({ kicker: input.kicker, headline: input.headline, support: input.support, footer: resolvedFooter }))
    .digest("hex");
}

/** Exact path geometry from FINAL 2026 horizontal logo Asset 14.svg. */
export function renderCanonicalHorizontalLogo(fill: string, x: number, y: number, width: number): string {
  const scale = width / 414.84;
  return `<g data-role="canonical-logo" data-source-sha256="${CANONICAL_HORIZONTAL_LOGO_SOURCE_SHA256}" fill="${fill}" transform="translate(${x} ${y}) scale(${scale})">
    <path d="M247.15,8.11v21.64h-10.82V8.11h-5.41v8.63l-5.41.44v-9.07h-27.05v5.41h21.64v4.1l-16.27,1.31-5.37.43h0v5.41h0v10.39h27.05v-12.82l5.41-.49v13.31h21.64V8.11h-5.41ZM220.1,29.74h-16.23v-5.46l16.23-1.46v6.92Z"/>
    <polygon points="263.38 13.51 274.2 13.51 274.2 8.1 257.97 8.1 257.97 35.15 263.38 35.15 263.38 13.51"/>
    <path d="M366.16,8.11v27.05h21.64V8.11h-21.64ZM382.39,29.74h-10.82V13.51h10.82v16.23Z"/>
    <path d="M402.77,8.1c-5.28,0-9.56,4.28-9.56,9.56v28.29l5.41.44v-28.73c0-2.29,1.86-4.15,4.15-4.15h12.08v-5.41h-12.07Z"/>
    <path d="M348.43,35.15c6.8,0,12.32-5.52,12.32-12.32v-9.31h-5.39v9.31c0,3.82-3.09,6.91-6.91,6.91h-3.9V13.52h10.8v-5.39h-16.21v27.03h9.31Z"/>
    <polygon points="328.29 8.1 312.07 8.1 312.07 45.76 317.47 46.21 317.47 13.51 328.29 13.51 328.29 35.15 333.7 35.15 333.7 5.62 328.29 5.62 328.29 8.1"/>
    <path d="M225.51,45.98v10.69h0v5.06h0l5.28.48,16.36,1.47v3.94h-32.46v5.41h37.87v-27.05h-27.05ZM247.15,58.42l-16.23-1.31v-5.72h16.23v7.03Z"/>
    <rect x="404.02" y="45.98" width="5.41" height="27.05"/>
    <path d="M355.34,60.76l5.41.48v-15.26h-16.23v16.32c0,2.94-2.38,5.32-5.32,5.32h-.09v5.41c5.97,0,10.82-4.84,10.82-10.82v-10.82h5.41v9.37Z"/>
    <polygon points="333.7 53.89 333.7 73.03 257.97 73.03 257.97 67.62 274.2 67.62 274.2 59.49 257.97 58.04 257.97 52.97 274.2 54.28 279.61 54.72 279.61 67.62 285.02 67.62 285.02 51.39 290.42 51.39 290.42 67.62 328.29 67.62 328.29 53.44 333.7 53.89"/>
    <path d="M387.8,58.42v-12.44h-21.64v15.75l5.29.48h0l10.94.99v4.42h-27.05v5.41h32.46v-9.35l10.82.98v-5.36l-10.82-.87ZM382.39,57.99l-10.82-.87v-5.72h10.82v6.6Z"/>
    <path d="M279.61,8.11v12.86l-10.82.87v5.41l10.82-.97v8.87h27.05v-5.41h-21.64v-3.95l16.23-1.46,5.41-.49v-15.74h-27.05ZM301.25,19.22l-16.23,1.31v-7.02h16.23v5.71Z"/>
    <polygon points="317.56 76.51 312.06 76.51 312.06 82 315.94 82 315.94 85.88 321.44 85.88 321.44 80.38 317.56 80.38 317.56 76.51"/>
    <rect x="290.42" y="45.89" width="5.5" height="5.5"/>
    <polygon points="318.38 58.11 310.89 57.21 310.89 58.84 318.38 59.75 318.38 58.11"/>
    <polygon points="402.98 41.22 410.48 42.13 410.48 40.5 402.98 39.59 402.98 41.22"/>
    <path d="M214.69,60.77l5.41.49v-15.27h-16.23v16.32c0,2.94-2.38,5.32-5.32,5.32h-.09v5.41c5.97,0,10.82-4.84,10.82-10.82v-10.82h5.41v9.38Z"/>
    <path d="M166.85,45.49l15.17-1.37V0h-75.84v36.06l-15.17,1.23v-13.77l-15.17,1.37V0H0v15.17h60.68v11.09l-45.51,4.09-15.17,1.37v44.12h75.84v-36.06l15.17-1.23v13.77l15.17-1.37v24.89h75.84v-15.17h-60.68v-11.09l45.51-4.09ZM121.34,15.17h45.51v16l-45.51,3.67V15.17ZM60.68,60.66H15.17v-16l45.51-3.67v19.67Z"/>
  </g>`;
}

/**
 * Renders a deterministic, editable social SVG using SOCIAL_MEDIA_PLUGIN's FINAL 2026 identity.
 * The output intentionally remains an SVG master. Social publishing should use a
 * separately verified raster export because font metrics vary by renderer.
 */
export function renderSocialSvg(input: SocialSvgInput): string {
  const width = input.width ?? 1080;
  const height = input.height ?? 1350;
  const mode = input.mode ?? "light";
  const direction = input.direction ?? expectedDirection(input);
  const rtl = direction === "rtl";
  const layout = input.layout ?? "editorial";
  const systemMap = layout === "system_map";
  const palette = paletteFor(mode);
  const typography = typographyFor(input);
  const frameInset = Math.max(32, Math.round(width * 0.037));
  const contentInset = Math.max(72, Math.round(width * 0.089));
  const contentWidth = width - contentInset * 2;
  const kickerY = Math.round(height * 0.16);
  const headlineY = Math.round(height * 0.215);
  const supportY = Math.round(height * (systemMap ? 0.5 : 0.515));
  const actionY = Math.round(height * 0.75);
  const actionHeight = Math.round(height * 0.13);
  const actionX = systemMap ? Math.round(width * 0.49) : contentInset;
  const actionWidth = width - actionX - contentInset;
  const actionIconX = systemMap ? 54 : 67;
  const footerText = input.footer ?? (rtl ? "اورندور · بنية رقمية ذكية" : "SOCIAL_MEDIA_PLUGIN · Digital Civilization");
  const textX = rtl ? width - contentInset - Math.round(contentWidth * 0.27) : contentInset;
  const kickerX = rtl ? width - contentInset - 72 : contentInset;
  const headlineLines = wrapText(input.headline, rtl ? 16 : 20);
  const supportLines = wrapText(input.support, rtl ? 25 : 32);
  const footerLines = wrapText(footerText, systemMap && rtl ? 22 : rtl ? 38 : 42);
  const headlineBaseline = headlineY + typography.headlineSize;
  const supportBaseline = supportY + typography.supportSize;
  const footerLineHeight = Math.round(typography.footerSize * 1.35);
  const footerBaseline = Math.round(actionHeight / 2 - ((footerLines.length - 1) * footerLineHeight) / 2 + typography.footerSize * 0.34);
  const copyHash = copyBindingHash(input, footerText);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc" data-social-brand-version="${SOCIAL_MEDIA_PLUGIN_CREATIVE_BRAND_VERSION}" data-social-mode="${mode}" data-social-direction="${direction}" data-social-layout="${layout}" data-social-background="${palette.canvas}" data-social-primary="${palette.primary}" data-social-secondary="${palette.secondary}" data-social-copy-hash="${copyHash}">
  <title id="title">${escapeXml(input.headline)}</title>
  <desc id="desc">${escapeXml(input.support)}</desc>
  <rect data-role="canvas" width="${width}" height="${height}" fill="${palette.canvas}"/>
  ${systemMap ? `<g aria-hidden="true" opacity="0.2" fill="${SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.neon}">
    <circle cx="118" cy="254" r="4"/><circle cx="158" cy="254" r="4"/><circle cx="198" cy="254" r="4"/><circle cx="238" cy="254" r="4"/>
    <circle cx="118" cy="294" r="4"/><circle cx="158" cy="294" r="4"/><circle cx="198" cy="294" r="4"/><circle cx="238" cy="294" r="4"/>
  </g>` : `<g aria-hidden="true" opacity="${mode === "dark" ? "0.14" : "0.07"}" fill="none" stroke="${SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.pale}" stroke-width="14">
    <path d="M${Math.round(width * 0.61)} -72h330q82 0 82 82v210q0 82-82 82H${Math.round(width * 0.61)}q-82 0-82-82V10q0-82 82-82Z"/>
    <path d="M${Math.round(width * 0.69)} 28h330q82 0 82 82v210q0 82-82 82H${Math.round(width * 0.69)}q-82 0-82-82V110q0-82 82-82Z"/>
    <path d="M${Math.round(width * 0.77)} 128h330q82 0 82 82v210q0 82-82 82H${Math.round(width * 0.77)}q-82 0-82-82V210q0-82 82-82Z"/>
  </g>`}
  <rect x="${frameInset}" y="${frameInset}" width="${width - frameInset * 2}" height="${height - frameInset * 2}" rx="6" fill="none" stroke="${mode === "dark" ? SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.neon : SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.deep}" stroke-width="2"/>
  ${renderCanonicalHorizontalLogo(palette.primary, contentInset, 49, 174)}
  <text x="${width - contentInset}" y="72" text-anchor="end" fill="${palette.secondary}" font-family="Dh Ranclo, Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="1.4">DIGITAL CIVILIZATION / 2026</text>
  <g data-role="content" direction="${direction}">
    <text x="${kickerX}" y="${kickerY}" text-anchor="${rtl ? "middle" : "start"}" direction="${direction}" unicode-bidi="plaintext" fill="${SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.neon}" font-family="Dh Ranclo, Ghroob Arabic ITF, Arial, sans-serif" font-size="25" font-weight="700" letter-spacing="1.8">${escapeXml(input.kicker.toUpperCase())}</text>
    <line x1="${rtl ? width - contentInset - 144 : contentInset}" y1="${kickerY + 27}" x2="${rtl ? width - contentInset : contentInset + 144}" y2="${kickerY + 27}" stroke="${SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.neon}" stroke-width="8"/>
    <g data-role="headline" fill="${palette.primary}" font-family="Ghroob Arabic ITF, Dh Ranclo, Arial, sans-serif" font-size="${typography.headlineSize}" font-weight="800">
      ${renderTextLines(headlineLines, textX, headlineBaseline, Math.round(typography.headlineSize * 1.27), direction)}
    </g>
    <g data-role="support" fill="${palette.secondary}" font-family="Ghroob Arabic ITF, Dh Ranclo, Arial, sans-serif" font-size="${typography.supportSize}" font-weight="500">
      ${renderTextLines(supportLines, textX, supportBaseline, Math.round(typography.supportSize * 1.55), direction)}
    </g>
  </g>
  ${systemMap ? `<g data-role="system-map" transform="translate(${contentInset} 565)" font-family="Ghroob Arabic ITF, Dh Ranclo, Arial, sans-serif">
    <text x="0" y="0" fill="${palette.secondary}" font-family="Dh Ranclo, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="1.4">OPERATING MAP / CLOSED LOOP</text>
    <line x1="42" y1="50" x2="42" y2="312" stroke="${SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.neon}" stroke-width="4"/>
    ${[
      { index: "01", ar: "قرار", en: "DECIDE", y: 42 },
      { index: "02", ar: "تنفيذ", en: "EXECUTE", y: 137 },
      { index: "03", ar: "قياس", en: "MEASURE", y: 232 },
    ].map((node) => `<g transform="translate(0 ${node.y})"><rect x="0" y="0" width="350" height="76" rx="18" fill="${palette.card}" stroke="${mode === "dark" ? SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.pale : "#CFDDD4"}" stroke-width="2"/><circle cx="42" cy="38" r="17" fill="${SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.neon}"/><text x="42" y="44" text-anchor="middle" fill="${SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.deep}" font-family="Dh Ranclo, Arial, sans-serif" font-size="13" font-weight="800">${node.index}</text><text x="216" y="49" text-anchor="middle" direction="${direction}" fill="${palette.primary}" font-size="30" font-weight="700">${rtl ? node.ar : node.en}</text></g>`).join("\n    ")}
    <path d="M350 270h32v-190h-32" fill="none" stroke="${palette.secondary}" stroke-width="2" stroke-dasharray="8 8"/>
  </g>` : ""}
  <g data-role="action" transform="translate(${actionX} ${actionY})">
    <rect width="${actionWidth}" height="${actionHeight}" rx="36" fill="${palette.card}" stroke="${mode === "dark" ? SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.neon : "#CFDDD4"}" stroke-width="2"/>
    <circle cx="${actionIconX}" cy="${Math.round(actionHeight / 2)}" r="31" fill="${SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.neon}"/>
    <path d="M${actionIconX - 14} ${Math.round(actionHeight / 2)}h28M${actionIconX} ${Math.round(actionHeight / 2) - 14}v28" stroke="${SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.deep}" stroke-width="7" stroke-linecap="round"/>
    <g fill="${palette.primary}" font-family="Ghroob Arabic ITF, Dh Ranclo, Arial, sans-serif" font-size="${typography.footerSize}" font-weight="650">
      ${renderTextLines(footerLines, rtl ? Math.round(actionWidth * (systemMap ? 0.64 : 0.62)) : systemMap ? 106 : 126, footerBaseline, footerLineHeight, direction)}
    </g>
  </g>
  <g font-family="Dh Ranclo, Ghroob Arabic ITF, Arial, sans-serif" font-size="21" font-weight="700" fill="${palette.secondary}">
    <text x="${contentInset}" y="${height - 55}">ESTD / BAGHDAD</text>
    <text x="${width - contentInset}" y="${height - 55}" text-anchor="end">CONTENT SYSTEM / 01</text>
  </g>
</svg>`;
}

function metadata(svg: string, key: string): string | null {
  const match = svg.match(new RegExp(`data-social-${key}="([^"]+)"`, "u"));
  return match?.[1] ?? null;
}

function normalizeHex(value: string | null): string | null {
  return value?.toUpperCase() ?? null;
}

function hexToLuminance(hex: string): number {
  const normalized = hex.replace("#", "");
  if (!/^[A-Fa-f0-9]{6}$/.test(normalized)) return 1;
  const channels = normalized.match(/.{2}/gu)?.map((channel) => Number.parseInt(channel, 16) / 255) ?? [1, 1, 1];
  const linear = channels.map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (linear[0] ?? 1) + 0.7152 * (linear[1] ?? 1) + 0.0722 * (linear[2] ?? 1);
}

export function contrastRatio(colorA: string, colorB: string): number {
  const luminanceA = hexToLuminance(colorA);
  const luminanceB = hexToLuminance(colorB);
  const ratio = (Math.max(luminanceA, luminanceB) + 0.05) / (Math.min(luminanceA, luminanceB) + 0.05);
  return Math.round(ratio * 100) / 100;
}

function scoreTotal(scores: CreativeAutomationScore): number {
  return Math.round(Object.values(scores).reduce((total, score) => total + score, 0) * 10) / 10;
}

/**
 * Performs only deterministic, offline checks. A clean result is deliberately
 * labelled as requiring visual review; it is never equivalent to a visual critic pass.
 */
/**
 * @deprecated Compatibility-only diagnostic. Its numeric rubric is not an
 * aesthetic score and must never be used for selection, approval, or release.
 * New code must call evaluateTechnicalCreativePreflight and a pixel critic.
 */
export function evaluateSocialCreative({ input, svg, assetLicenseStatus }: EvaluateSocialCreativeInput): CreativeAutomationEvaluation {
  const mode = input.mode ?? "light";
  const direction = input.direction ?? expectedDirection(input);
  const width = input.width ?? 1080;
  const height = input.height ?? 1350;
  const expectedPalette = paletteFor(mode);
  const background = metadata(svg, "background") ?? "#FFFFFF";
  const primary = metadata(svg, "primary") ?? "#FFFFFF";
  const secondary = metadata(svg, "secondary") ?? "#FFFFFF";
  const renderedDirection = metadata(svg, "direction");
  const primaryContrast = contrastRatio(background, primary);
  const secondaryContrast = contrastRatio(background, secondary);
  const headlineCharacters = Array.from(input.headline.trim()).length;
  const supportCharacters = Array.from(input.support.trim()).length;
  const totalCharacters = Array.from(`${input.kicker}${input.headline}${input.support}${input.footer ?? ""}`).length;
  const totalBudget = direction === "rtl" ? 250 : 280;
  const hardFails: CreativeHardFail[] = [];
  const checks: CreativeAutomationCheck[] = [];
  const fail = (code: CreativeHardFailCode, message: string) => hardFails.push({ code, message });

  const dimensionsSupported = SUPPORTED_SOCIAL_DIMENSIONS.has(`${width}x${height}`);
  if (!dimensionsSupported) fail("UNSUPPORTED_DIMENSIONS", `${width}x${height} is not an approved social canvas.`);
  checks.push({ key: "platform_dimensions", status: dimensionsSupported ? "PASS" : "FAIL", evidence: `${width}x${height}` });

  const paletteMatches =
    normalizeHex(background) === normalizeHex(expectedPalette.canvas) &&
    normalizeHex(primary) === normalizeHex(expectedPalette.primary) &&
    normalizeHex(secondary) === normalizeHex(expectedPalette.secondary) &&
    metadata(svg, "brand-version") === SOCIAL_MEDIA_PLUGIN_CREATIVE_BRAND_VERSION;
  if (!paletteMatches) fail("WRONG_BRAND_COLOR", "Rendered palette or brand version differs from FINAL 2026.");
  checks.push({ key: "canonical_brand_tokens", status: paletteMatches ? "PASS" : "FAIL", evidence: `${background} / ${primary} / ${secondary}` });

  const canonicalLogo = svg.includes('data-role="canonical-logo"') && svg.includes(`data-source-sha256="${CANONICAL_HORIZONTAL_LOGO_SOURCE_SHA256}"`);
  if (!canonicalLogo) fail("WRONG_LOGO", "Canonical FINAL 2026 horizontal logo geometry or its source fingerprint is missing.");
  checks.push({ key: "canonical_logo", status: canonicalLogo ? "PASS" : "FAIL", evidence: canonicalLogo ? CANONICAL_HORIZONTAL_LOGO_SOURCE_SHA256 : "missing or mismatched" });

  if (primaryContrast < 4.5) fail("LOW_CONTRAST_PRIMARY", `Primary text contrast ${primaryContrast}:1 is below 4.5:1.`);
  if (secondaryContrast < 4.5) fail("LOW_CONTRAST_SECONDARY", `Secondary text contrast ${secondaryContrast}:1 is below 4.5:1.`);
  checks.push({
    key: "wcag_text_contrast",
    status: primaryContrast >= 4.5 && secondaryContrast >= 4.5 ? "PASS" : "FAIL",
    evidence: `primary ${primaryContrast}:1; secondary ${secondaryContrast}:1`,
  });

  const rtlMatches = renderedDirection === direction && direction === expectedDirection(input);
  if (!rtlMatches) fail("RTL_DIRECTION_MISMATCH", `Copy requires ${expectedDirection(input)} but the creative declares ${renderedDirection ?? "no direction"}.`);
  checks.push({ key: "rtl_direction", status: rtlMatches ? "PASS" : "FAIL", evidence: `expected ${expectedDirection(input)}; rendered ${renderedDirection ?? "missing"}` });

  const headlineLimit = direction === "rtl" ? 68 : 78;
  const clippingRisk = headlineCharacters > headlineLimit || supportCharacters > 155;
  if (clippingRisk) fail("TEXT_CLIPPING_RISK", `Headline/support exceeds the safe offline wrapping limit (${headlineCharacters}/${supportCharacters} characters).`);
  checks.push({ key: "text_wrapping_budget", status: clippingRisk ? "FAIL" : "PASS", evidence: `headline ${headlineCharacters}/${headlineLimit}; support ${supportCharacters}/155` });

  const densityPasses = totalCharacters <= totalBudget;
  if (!densityPasses) fail("TEXT_DENSITY_EXCEEDED", `Copy density ${totalCharacters} exceeds the ${totalBudget}-character mobile budget.`);
  checks.push({ key: "mobile_text_density", status: densityPasses ? "PASS" : "FAIL", evidence: `${totalCharacters}/${totalBudget} characters` });

  const resolvedFooter = input.footer ?? (direction === "rtl" ? "اورندور · بنية رقمية ذكية" : "SOCIAL_MEDIA_PLUGIN · Digital Civilization");
  const allCopyRendered = metadata(svg, "copy-hash") === copyBindingHash(input, resolvedFooter);
  if (!allCopyRendered) fail("COPY_MISSING_FROM_RENDER", "At least one exact approved copy segment is missing from the SVG.");
  checks.push({ key: "exact_copy_binding", status: allCopyRendered ? "PASS" : "FAIL", evidence: allCopyRendered ? "All exact copy segments found." : "Copy mismatch found." });

  const accessible = svg.includes('role="img"') && svg.includes('aria-labelledby="title desc"') && svg.includes('<title id="title">') && svg.includes('<desc id="desc">');
  if (!accessible) fail("MISSING_ACCESSIBLE_LABELS", "SVG title/description semantics are incomplete.");
  checks.push({ key: "accessible_svg_semantics", status: accessible ? "PASS" : "FAIL", evidence: accessible ? "role, title, and description present." : "Required semantics missing." });

  const completeCopy = `${input.kicker} ${input.headline} ${input.support} ${input.footer ?? ""}`;
  const hasPlaceholder = PLACEHOLDER_COPY.test(completeCopy);
  if (hasPlaceholder) fail("PLACEHOLDER_COPY", "Placeholder copy was detected.");
  checks.push({ key: "placeholder_copy", status: hasPlaceholder ? "FAIL" : "PASS", evidence: hasPlaceholder ? "Placeholder token detected." : "No placeholder token detected." });

  const licenseApproved = assetLicenseStatus !== "UNKNOWN";
  if (!licenseApproved) fail("UNAPPROVED_LICENSE", "Asset license is UNKNOWN.");
  checks.push({ key: "asset_license", status: licenseApproved ? "PASS" : "FAIL", evidence: assetLicenseStatus });

  const usesCanonicalFonts = svg.includes("Ghroob Arabic ITF") && svg.includes("Dh Ranclo");
  checks.push({ key: "canonical_font_stack", status: usesCanonicalFonts ? "PASS" : "FAIL", evidence: usesCanonicalFonts ? "Ghroob Arabic ITF and Dh Ranclo declared." : "Canonical font stack incomplete." });
  checks.push({ key: "arabic_shaping", status: "MANUAL_REVIEW", evidence: "Browser/exporter shaping must be inspected at final raster size." });
  checks.push({ key: "concept_originality", status: "MANUAL_REVIEW", evidence: "Semantic originality is not reliably measurable by this deterministic evaluator." });
  checks.push({ key: "visual_polish", status: "MANUAL_REVIEW", evidence: "Optical balance, clipping, and finish require independent visual critics." });

  const contrastPasses = primaryContrast >= 4.5 && secondaryContrast >= 4.5;
  const scores: CreativeAutomationScore = {
    conceptOriginality: hasPlaceholder ? 0 : 7,
    hierarchy: svg.includes('data-role="headline"') && svg.includes('data-role="support"') && svg.includes('data-role="action"') ? 12 : 0,
    typography: usesCanonicalFonts && !clippingRisk ? 12 : usesCanonicalFonts ? 6 : 0,
    compositionGrid: dimensionsSupported && svg.includes('data-role="content"') ? 10 : 0,
    brandDistinctiveness: paletteMatches && canonicalLogo ? 10 : 0,
    messageClarity: !clippingRisk && !hasPlaceholder ? 10 : 3,
    readability: contrastPasses && !clippingRisk && densityPasses ? 8 : 0,
    whitespace: densityPasses ? 7 : 0,
    graphicQuality: 3,
    colorContrast: contrastPasses ? 5 : 0,
    platformSuitability: dimensionsSupported ? 3 : 0,
    polish: 1.5,
  };

  return {
    evaluatorVersion: "1.0.0",
    brandVersion: SOCIAL_MEDIA_PLUGIN_CREATIVE_BRAND_VERSION,
    decision: hardFails.length > 0 ? "REJECTED_BY_AUTOMATION" : "AUTOMATED_CHECKS_PASSED_VISUAL_REVIEW_REQUIRED",
    hardFails,
    checks,
    rubric: {
      scores,
      diagnosticTotal: scoreTotal(scores),
      maximumPossibleWithoutVisualReview: 88.5,
      publicationCandidateThreshold: 93,
      cappedCategories: ["conceptOriginality", "graphicQuality", "polish"],
    },
    contrast: { primary: primaryContrast, secondary: secondaryContrast, required: 4.5 },
    textDensity: { headlineCharacters, supportCharacters, totalCharacters, totalBudget },
    visualInspection: {
      required: true,
      status: "NOT_PERFORMED",
      unresolvedChecks: ["Arabic shaping and glyph substitution", "optical hierarchy and balance", "unexpected clipping after rasterization", "visual originality", "final production polish"],
    },
  };
}

/** Objective markup, copy, contrast, dimension, and rights checks only. */
export function evaluateTechnicalCreativePreflight(input: EvaluateSocialCreativeInput): TechnicalCreativePreflightEvaluation {
  const legacy = evaluateSocialCreative(input);
  return {
    evaluatorVersion: "2.0.0",
    brandVersion: legacy.brandVersion,
    decision: legacy.hardFails.length > 0
      ? "REJECTED_BY_TECHNICAL_PREFLIGHT"
      : "TECHNICAL_PREFLIGHT_PASSED_PIXEL_REVIEW_REQUIRED",
    hardFails: legacy.hardFails,
    checks: legacy.checks,
    contrast: legacy.contrast,
    textDensity: legacy.textDensity,
    aestheticEvaluation: {
      performed: false,
      score: null,
      reason: "Deterministic metadata and markup checks cannot establish visual quality.",
    },
    visualInspection: legacy.visualInspection,
  };
}

export function duplicateCreativeFingerprints(svgs: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const svg of svgs) {
    const fingerprint = fingerprintSvg(svg);
    if (seen.has(fingerprint)) duplicates.add(fingerprint);
    seen.add(fingerprint);
  }
  return [...duplicates].sort();
}

export class DeterministicSvgProvider implements DesignProvider {
  private readonly drafts = new Map<string, DesignDraft>();

  async capabilities(): Promise<DesignCapabilities> {
    return {
      create: "PREVIEW",
      revise: "MANUAL_HANDOFF_REQUIRED",
      render: "AVAILABLE",
      editable: "AVAILABLE",
      reasons: [
        "The deterministic SVG provider is a technical preview renderer, not the professional asset-first production system.",
        "Semantic revision cannot be claimed unless the rendered pixels change and receive a new hash.",
      ],
    };
  }

  async create(input: DesignBrief): Promise<DesignDraft[]> {
    const id = randomUUID();
    const exactText = input.exactText;
    const svg = renderSocialSvg({
      kicker: input.communicationGoal.slice(0, 32),
      headline: exactText[0] ?? input.focalPoint,
      support: exactText.slice(1).join(" ") || input.visualConcept,
      footer: "اورندور · بنية رقمية ذكية",
      direction: /[\u0600-\u06FF]/u.test(exactText.join(" ")) ? "rtl" : "ltr",
      mode: input.palette.includes(SOCIAL_MEDIA_PLUGIN_CREATIVE_COLORS.deep) && input.layoutFamily.includes("dark") ? "dark" : "light",
      width: input.canvas.width,
      height: input.canvas.height,
    });
    const draft: DesignDraft = { id, provider: "deterministic_svg", payload: { brief: input, svg }, editableUrl: null };
    this.drafts.set(id, draft);
    return [draft];
  }

  async revise(draftId: string, revision: { instructions: string[] }): Promise<DesignDraft> {
    if (!this.drafts.has(draftId)) throw new Error(`Design draft not found: ${draftId}`);
    throw new Error(
      `DeterministicSvgProvider cannot apply a truthful pixel revision (${revision.instructions.length} instruction(s)); return to professional production and render a new asset hash.`,
    );
  }

  async render(draftId: string, format: "svg" | "png" | "jpg"): Promise<Array<{ mimeType: string; bytes: Uint8Array }>> {
    if (format !== "svg") throw new Error("The deterministic provider renders SVG directly; PNG/JPG export is performed by the render worker/browser.");
    const draft = this.drafts.get(draftId);
    if (!draft) throw new Error(`Design draft not found: ${draftId}`);
    const svg = String(draft.payload.svg ?? "");
    return [{ mimeType: "image/svg+xml", bytes: new TextEncoder().encode(svg) }];
  }

  async getEditableUrl(): Promise<string | null> {
    return null;
  }
}

export function fingerprintSvg(svg: string): string {
  return createHash("sha256").update(svg).digest("hex");
}
