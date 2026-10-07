#!/usr/bin/env node
// Single source of truth for the app version is package.json. Tauri reads it directly
// (tauri.conf.json → "version": "../package.json"); Cargo.toml / Cargo.lock are kept in sync here.
//
//   node scripts/version.mjs check                 # fail if versions disagree (used in CI)
//   node scripts/version.mjs bump patch|minor|major
//   node scripts/version.mjs bump 2.1.0-beta.1
//
// Pushing a changed version to main triggers the release workflow.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const files = {
  pkg: `${root}package.json`,
  cargo: `${root}src-tauri/Cargo.toml`,
  lock: `${root}src-tauri/Cargo.lock`,
};
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

const read = (f) => readFileSync(f, "utf8");
const pkgVersion = () => JSON.parse(read(files.pkg)).version;
const cargoVersion = () => read(files.cargo).match(/^\[package\][\s\S]*?^version\s*=\s*"([^"]+)"/m)?.[1];
const lockVersion = () => read(files.lock).match(/name = "ba-draft-tool"\r?\nversion = "([^"]+)"/)?.[1];

function next(current, kind) {
  if (SEMVER.test(kind)) return kind;
  const [major, minor, patch] = current.split("-")[0].split(".").map(Number);
  if (kind === "major") return `${major + 1}.0.0`;
  if (kind === "minor") return `${major}.${minor + 1}.0`;
  if (kind === "patch") return `${major}.${minor}.${patch + 1}`;
  throw new Error(`Unknown bump "${kind}". Use patch, minor, major or an explicit x.y.z version.`);
}

function write(version) {
  const pkg = read(files.pkg).replace(/("version":\s*")[^"]+(")/, `$1${version}$2`);
  writeFileSync(files.pkg, pkg);
  const cargo = read(files.cargo).replace(
    /^(\[package\][\s\S]*?^version\s*=\s*")[^"]+(")/m,
    `$1${version}$2`,
  );
  writeFileSync(files.cargo, cargo);
  const lock = read(files.lock).replace(/(name = "ba-draft-tool"\r?\nversion = ")[^"]+(")/, `$1${version}$2`);
  writeFileSync(files.lock, lock);
}

const [command, arg] = process.argv.slice(2);
if (command === "check") {
  const versions = {
    "package.json": pkgVersion(),
    "Cargo.toml": cargoVersion(),
    "Cargo.lock": lockVersion(),
  };
  const unique = new Set(Object.values(versions));
  if (unique.size !== 1 || !SEMVER.test(pkgVersion())) {
    console.error("Version mismatch:", versions, "\nRun: pnpm version:bump <version>");
    process.exit(1);
  }
  console.log(`Version ${pkgVersion()} is consistent.`);
} else if (command === "bump" && arg) {
  const version = next(pkgVersion(), arg);
  write(version);
  console.log(`Bumped to ${version}. Commit and push to main to publish a release.`);
} else {
  console.error("Usage: node scripts/version.mjs check | bump <patch|minor|major|x.y.z>");
  process.exit(1);
}
