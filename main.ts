// Entry point for the gta6-meme-x-01 submission.
//
// The whole job of this program is deliberately small: it takes the
// POST.json that sits in the bot directory and republishes it into the
// output directory, so the grader can read which X post this entry
// points at. It runs on Node 22 using only the standard library and it
// never touches the network.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Where the harness mounts this repository and where it expects the
// result. Both locations can be overridden through the environment,
// which is also how the local test runs below point the program at
// scratch directories instead of the real mounts.
const botDir: string = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const outputDir: string = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Read POST.json from the bot directory and make sure it really is the
// document the contract promises: a JSON object whose "url" field is a
// non-empty string. Anything else is a packaging mistake, so we stop
// with a clear message rather than copying a broken file downstream.
function loadPostFile(): { sourcePath: string; raw: string } {
  const sourcePath = join(botDir, "POST.json");
  if (!existsSync(sourcePath)) {
    throw new Error(`POST.json not found in bot directory: ${sourcePath}`);
  }
  const raw = readFileSync(sourcePath, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`POST.json is not valid JSON: ${sourcePath}`);
  }
  const url = (parsed as { url?: unknown } | null)?.url;
  if (typeof url !== "string" || url.length === 0) {
    throw new Error('POST.json must be a JSON object with a non-empty string "url"');
  }
  return { sourcePath, raw };
}

// Publish the validated document into the output directory. The output
// directory is created when it does not exist yet, and the bytes are
// written exactly as they were read, so the published POST.json is
// byte-identical to the one in the bot directory.
import { mkdirSync, writeFileSync } from "node:fs";

function publishPostFile(raw: string): string {
  mkdirSync(outputDir, { recursive: true });
  const targetPath = join(outputDir, "POST.json");
  writeFileSync(targetPath, raw);
  return targetPath;
}

function main(): void {
  const { raw } = loadPostFile();
  const targetPath = publishPostFile(raw);
  console.log(`POST.json published to ${targetPath}`);
}

try {
  main();
} catch (err) {
  console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
