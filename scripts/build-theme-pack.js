#!/usr/bin/env node
/**
 * Build markedit-theme-pack.js from:
 *   - src/its/markedit-theme-its-preview.js (ITS CSS, re-scoped)
 *   - src/theme-pack-themes.css (Maple / Obsidianite / Brackets)
 *   - src/theme-pack-main.js (behavior, menu, persistence)
 *   -> dist/markedit-theme-pack.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const itsSource = fs.readFileSync(path.join(root, "src/its/markedit-theme-its-preview.js"), "utf8");
const mainSource = fs.readFileSync(path.join(root, "src/theme-pack-main.js"), "utf8");
const themesCss = fs.readFileSync(path.join(root, "src/theme-pack-themes.css"), "utf8");

const cssStartToken = "const CSS = `";
const cssStart = itsSource.indexOf(cssStartToken);
if (cssStart < 0) {
  throw new Error("ITS CSS template not found");
}
const bodyStart = cssStart + cssStartToken.length;
const cssEnd = itsSource.indexOf("`;", bodyStart);
if (cssEnd < 0) {
  throw new Error("ITS CSS template end not found");
}

let itsCss = itsSource.slice(bodyStart, cssEnd);
itsCss = itsCss.replaceAll(
  ".markdown-body[data-its-preview]",
  '.markdown-body[data-preview-theme="its"]'
);

for (const css of [itsCss, themesCss]) {
  if (css.includes("`")) {
    throw new Error("CSS contains a backtick, cannot embed in template literal");
  }
  if (css.includes("${")) {
    throw new Error("CSS contains ${, cannot embed in template literal");
  }
}

const marker = "const VERSION";
const versionIndex = mainSource.indexOf(marker);
if (versionIndex < 0) {
  throw new Error("main source is missing const VERSION");
}

const header = mainSource.slice(0, versionIndex);
const rest = mainSource.slice(versionIndex);
const output = [
  header.trimEnd(),
  "",
  "const CSS = `",
  itsCss.trimEnd(),
  "",
  "/* ---------- Maple / Obsidianite themes ---------- */",
  themesCss.trimEnd(),
  "`;",
  "",
  rest.trimStart(),
].join("\n");

const target = path.join(root, "dist/markedit-theme-pack.js");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, output);

// MarkEdit wraps scripts as (MarkEdit, require) => { ... }; compile-check it.
new vm.Script(`(function (MarkEdit, require) {\n${output}\n})`, { filename: target });
console.log(`Built ${target} (${(Buffer.byteLength(output) / 1024).toFixed(1)} KiB)`);
