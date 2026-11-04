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

// The standalone ITS plugin follows the OS appearance; inside the pack every
// theme follows .markdown-body[data-theme-pack-tone] instead, so that exporting
// freezes the tone the user is actually looking at. Rewrite the single dark
// media block into an attribute selector on the same wrapper.
itsCss = unwrapItsDarkAppearance(itsCss);

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

/**
 * Turn the ITS plugin's appearance media block
 *
 *   @media (prefers-color-scheme: dark) {
 *     .markdown-body[data-preview-theme="its"] { …vars… }
 *   }
 *
 * into a plain tone-attribute rule, so the pack has exactly one source of truth
 * for light/dark: .markdown-body[data-theme-pack-tone].
 */
function unwrapItsDarkAppearance(css) {
  const open = "@media (prefers-color-scheme: dark) {";
  const count = css.split(open).length - 1;
  if (count === 0) {
    throw new Error("ITS dark appearance block not found");
  }
  if (count > 1) {
    throw new Error(`Expected one ITS dark appearance block, found ${count}`);
  }

  const start = css.indexOf(open);
  const end = css.indexOf("\n}", start + open.length);
  if (end < 0) {
    throw new Error("ITS dark appearance block is not closed");
  }

  const selector = '.markdown-body[data-preview-theme="its"] {';
  const inner = css.slice(start + open.length, end);
  if (!inner.includes(selector)) {
    throw new Error("ITS dark appearance block does not target the preview wrapper");
  }

  const toneSelector = '.markdown-body[data-preview-theme="its"][data-theme-pack-tone="dark"] {';
  return (
    css.slice(0, start)
    + inner.replace(selector, toneSelector).trim()
    + css.slice(end + 2)
  );
}
