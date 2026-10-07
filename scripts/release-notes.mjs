#!/usr/bin/env node
// Prints release notes for a version: a bilingual download table plus the matching
// CHANGELOG.md section (if any). GitHub's auto-generated notes are appended by `gh`.
//
//   node scripts/release-notes.mjs 2.0.0 > notes.md
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const version = process.argv[2];
if (!version) {
  console.error("Usage: node scripts/release-notes.mjs <version>");
  process.exit(1);
}
const root = fileURLToPath(new URL("..", import.meta.url));
const changelogPath = `${root}CHANGELOG.md`;

let section = "";
if (existsSync(changelogPath)) {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = readFileSync(changelogPath, "utf8").match(
    new RegExp(`^## \\[?v?${escaped}\\]?[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m"),
  );
  section = match?.[1]?.trim() ?? "";
}

const file = (kind) => `BA-Draft-Tool_${version}_x64-${kind}.exe`;
console.log(`## Downloads / 下载

| | |
|---|---|
| **Installer / 安装版** | \`${file("setup")}\` |
| **Portable / 便携版** | \`${file("portable")}\` (no install, needs WebView2 — built into Windows 10/11 · 免安装，需要 WebView2，Win10/11 已自带) |
| **Web / 网页版** | https://kazeshima.github.io/BA-BP/ |

Verify downloads with \`SHA256SUMS.txt\`. · 可使用 \`SHA256SUMS.txt\` 校验文件完整性。
${section ? `\n## Highlights / 更新内容\n\n${section}\n` : ""}`);
