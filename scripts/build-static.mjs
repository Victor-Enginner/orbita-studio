import { mkdir, copyFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
export const STATIC_FILES = [
  "index.html",
  "src/app.js",
  "src/state.js",
  "src/icons.js",
  "src/neural-background.js",
  "src/styles.css",
  "src/production/styles.css",
  "src/production/board-polish.css",
  "src/production/catalog.js",
  "src/production/engine.js",
  "src/production/ui.js",
];

export async function buildStatic(output = path.join(root, "dist")) {
  const allowed = new Set([...STATIC_FILES, ".nojekyll"]);
  async function inspect(dir, prefix = "") {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const relative = prefix + entry.name;
      if (entry.isDirectory() && STATIC_FILES.some(file => file.startsWith(relative + "/"))) {
        await inspect(path.join(dir, entry.name), relative + "/");
      } else if (!entry.isFile() || !allowed.has(relative)) {
        throw new Error(`Arquivo inesperado no pacote público: ${relative}. Use um diretório de saída vazio.`);
      }
    }
  }
  await mkdir(output, { recursive: true });
  await inspect(output);
  for (const file of STATIC_FILES) {
    const destination = path.join(output, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(path.join(root, file), destination);
  }
  await writeFile(path.join(output, ".nojekyll"), "");
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Site estático preparado em ${await buildStatic()}`);
}
