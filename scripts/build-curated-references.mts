import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

// YAML is an engine dependency, while this script intentionally runs from the
// workspace root. Resolve it from the owning package instead of relying on a
// hoisted node_modules layout.
const engineRequire = createRequire(new URL("../packages/engine/package.json", import.meta.url));
const { parse: parseYaml } = await import(pathToFileURL(engineRequire.resolve("yaml")).href) as {
  parse: (source: string) => unknown;
};

const root = fileURLToPath(new URL("../", import.meta.url));
const corpusDirectory = fileURLToPath(new URL("../design-intelligence/corpus/", import.meta.url));
const filesDocument = JSON.parse(await readFile(`${corpusDirectory}files.json`, "utf8")) as {
  files: Array<{ referenceId: string; sourcePath: string; sha256: string; clusterId?: string; sourceStratum: string }>;
};
const annotationsDocument = parseYaml(await readFile(`${corpusDirectory}reference-annotations.yaml`, "utf8")) as {
  schemaVersion: string;
  corpusVersion: string;
  references: Array<Record<string, unknown> & { referenceId: string }>;
};

const primaryById = new Map(
  filesDocument.files
    .filter((file) => file.sourceStratum === "primary-top-level")
    .map((file) => [file.referenceId, file]),
);
const seen = new Set<string>();
const references = annotationsDocument.references.map((annotation) => {
  if (seen.has(annotation.referenceId)) throw new Error(`Duplicate reference annotation: ${annotation.referenceId}`);
  seen.add(annotation.referenceId);
  const file = primaryById.get(annotation.referenceId);
  if (!file) throw new Error(`Curated reference is missing from the primary corpus: ${annotation.referenceId}`);
  if (!file.clusterId) throw new Error(`Curated reference has not been assigned a computational cluster: ${annotation.referenceId}`);
  return {
    ...annotation,
    sourcePath: file.sourcePath,
    sha256: file.sha256,
    clusterId: file.clusterId,
    rightsState: "REFERENCE_ONLY",
  };
});

await writeFile(
  `${corpusDirectory}references.json`,
  `${JSON.stringify({ schemaVersion: annotationsDocument.schemaVersion, corpusVersion: annotationsDocument.corpusVersion, generatedFrom: "reference-annotations.yaml + files.json", sourceRoot: root, references }, null, 2)}\n`,
  "utf8",
);
console.log(`Built ${references.length} curated reference records.`);
