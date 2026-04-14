import fs from "node:fs/promises";
import path from "node:path";

export async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

export async function removeDir(targetPath) {
  await fs.rm(targetPath, { recursive: true, force: true });
}

export async function readJson(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (fallback !== null) {
      return fallback;
    }
    throw error;
  }
}

export async function writeJson(filePath, payload) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

export async function writeText(filePath, payload) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, payload, "utf8");
}

export async function copyFile(sourcePath, destinationPath) {
  await ensureDir(path.dirname(destinationPath));
  await fs.copyFile(sourcePath, destinationPath);
}

export async function copyDirectory(sourcePath, destinationPath) {
  const entries = await fs.readdir(sourcePath, { withFileTypes: true });
  await ensureDir(destinationPath);

  for (const entry of entries) {
    const sourceEntry = path.join(sourcePath, entry.name);
    const destinationEntry = path.join(destinationPath, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(sourceEntry, destinationEntry);
      continue;
    }
    await copyFile(sourceEntry, destinationEntry);
  }
}

export function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
