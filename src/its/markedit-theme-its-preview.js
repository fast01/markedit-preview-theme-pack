/**
 * MarkEdit ITS Preview
 *
 * A preview-only theme for MarkEdit + MarkEdit-preview.
 * It styles the rendered `.markdown-body` pane; it does not touch the editor.
 *
 * Install / rebuild
 *   This file is kept as the build-time ITS CSS source for the unified theme pack.
 *   Normal install: ../../scripts/install-theme-pack.sh (from the project root).
 *   Standalone legacy: ../../archive/install-legacy-its.sh --force.
 *   Or manually:
 *   1. Put this file in:
 *      ~/Library/Containers/app.cyan.markedit/Data/Documents/scripts/
 *   2. Add an entry to extensions.json (order matters; put it after markedit-preview):
 *      { "id": "markedit-theme-its-preview",
 *        "file": "markedit-theme-its-preview.js",
 *        "version": "0.1.0",
 *        "enabled": true }
 *   3. Relaunch MarkEdit.
 *
 * Development
 *   - This single file is the source; there is no bundler. The theme is the CSS
 *     template string below; the behavior is the plain JS after it.
 *   - For live CSS iteration:
 *       python3 -m http.server 8766
 *       open http://localhost:8766/archive/harness.html
 *     The archived harness loads this file, applies the GitHub base CSS, and supports re-render.
 *
 * Settings (optional, in settings.json):
 *   "extension.markeditThemeIts": {
 *     "enabled": true,
 *     "autoFold": true,
 *     "autoFoldLevel": 3,
 *     "listFolding": true,
 *     "debug": false
 *   }
 *
 * autoFoldLevel: 3 means H3, H4, H5 and H6 sections start folded.
 */

const SETTINGS_KEY = "extension.markeditThemeIts";
const VERSION = "0.1.0";
const STYLE_ID = "markedit-theme-its-preview-style";
const MARKER_CLASS = "its-decorated-marker";

const DEFAULTS = {
  enabled: true,
  autoFold: true,
  autoFoldLevel: 3,
  listFolding: true,
  debug: false,
};

const CSS = `
.markdown-body[data-its-preview] {
  --its-text: #6f7780;
  --its-muted: #8a929b;
  --its-heading: #8a282c;
  --its-accent: #8a282c;
  --its-link: #6f9bcf;
  --its-rule: #c9d8ee;
  --its-guide: #7e2425;
  --its-collapse: #aeb4cf;
  --its-collapse-hover: #8a282c;
  --its-active: #9db0cd;
  --its-check: #3f7fd1;
  --its-hr-line: #d7dde5;
  --its-heading-font: "Palatino", "Iowan Old Style", "Book Antiqua", Georgia, serif;
  --its-list-indent: 3.2em;
  --its-nested-indent: 4.6em;
  --its-rail-offset: 1.1em;
  --its-rail-width: 3px;
  --its-bullet-offset: 2.15em;
  --its-triangle-offset: 1.1em;
  --its-bullet-size: 0.62em;
  --its-h1-size: 34px;
  --its-h2-size: 30px;
  --its-h3-size: 26px;
  --its-h4-size: 22px;
  --its-h5-size: 20px;
  --its-h6-size: 18px;
  color: var(--its-text);
  font-size: 16px;
  line-height: 1.7;
}

@media (prefers-color-scheme: dark) {
  .markdown-body[data-its-preview] {
    --its-text: #c8ced8;
    --its-muted: #8e99a8;
    --its-heading: #e07a7a;
    --its-accent: #d05a5a;
    --its-link: #7aa7d6;
    --its-rule: #3a4b66;
    --its-guide: #d05a5a;
    --its-collapse: #8090a8;
    --its-collapse-hover: #e07a7a;
    --its-active: #8fa8c8;
    --its-check: #4f8bd6;
    --its-hr-line: #2c333d;
  }
}

.markdown-body[data-its-preview] p {
  margin: 0.55em 0 0.9em;
}

.markdown-body[data-its-preview] a {
  color: var(--its-link);
  text-decoration: none;
}

.markdown-body[data-its-preview] a:hover {
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

/* Headings: serif face, no text underline, one decorative rule below. */
.markdown-body[data-its-preview] :is(h1, h2, h3, h4, h5, h6) {
  position: relative;
  margin: 0;
  padding: 0 !important;
  border-bottom: 0 !important;
  font-family: var(--its-heading-font);
  font-weight: 700;
  line-height: 1.18;
  letter-spacing: 0.005em;
  color: var(--its-heading);
  text-decoration: none;
}

.markdown-body[data-its-preview] h1 { font-size: clamp(28px, 4vw, var(--its-h1-size)); margin-top: 0.15em; margin-bottom: 0.55em; }
.markdown-body[data-its-preview] h2 { font-size: clamp(24px, 3.2vw, var(--its-h2-size)); margin-top: 2.1em; margin-bottom: 0.55em; }
.markdown-body[data-its-preview] h3 { font-size: clamp(21px, 2.7vw, var(--its-h3-size)); margin-top: 1.65em; margin-bottom: 0.45em; }
.markdown-body[data-its-preview] h4 { font-size: var(--its-h4-size); margin-top: 1.5em; margin-bottom: 0.4em; }
.markdown-body[data-its-preview] h5 { font-size: var(--its-h5-size); margin-top: 1.35em; margin-bottom: 0.35em; }
.markdown-body[data-its-preview] h6 { font-size: var(--its-h6-size); margin-top: 1.25em; margin-bottom: 0.3em; }

.markdown-body[data-its-preview] :is(h1, h2, h3, h4, h5, h6)::after {
  content: "";
  display: block;
  width: 100%;
  height: 4px;
  margin-top: 0.16em;
  border-radius: 1px;
  background: var(--its-rule);
}

.markdown-body[data-its-preview] :is(h1, h2, h3, h4, h5, h6) > .its-heading-fold {
  position: absolute;
  left: -22px;
  top: calc(0.59em - 8px);
  font-size: inherit;
}

/* Lists: one continuous rail for the first level, one short rail per nested item. */
.markdown-body[data-its-preview] ul {
  position: relative;
  margin: 0.55em 0 0.9em;
  padding-left: var(--its-list-indent);
  list-style: none;
  --its-current-indent: var(--its-list-indent);
}

.markdown-body[data-its-preview] ul ul {
  margin: 0.18em 0 0.25em;
  padding-left: var(--its-nested-indent);
  --its-current-indent: var(--its-nested-indent);
}

.markdown-body[data-its-preview] ul::before {
  content: "";
  position: absolute;
  left: calc(var(--its-current-indent) - var(--its-rail-offset) - var(--its-rail-width) / 2);
  top: 0.15em;
  bottom: 0.15em;
  width: var(--its-rail-width);
  border-radius: 1px;
  background: var(--its-guide);
}

.markdown-body[data-its-preview] ul.its-nested-list::before {
  display: none;
}

.markdown-body[data-its-preview] li {
  position: relative;
  margin: 0.12em 0;
  padding-left: 0;
}

.markdown-body[data-its-preview] ul > li:not(.task-list-item)::before {
  content: "";
  position: absolute;
  z-index: 1;
  left: calc(-1 * var(--its-bullet-offset) - var(--its-bullet-size) / 2);
  top: calc(0.85em - var(--its-bullet-size) / 2);
  width: var(--its-bullet-size);
  height: var(--its-bullet-size);
  border-radius: 1px;
  background: var(--its-accent);
  transform: rotate(45deg);
  transform-origin: center;
}

.markdown-body[data-its-preview] ul.its-nested-list > li:not(.task-list-item)::before {
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
}

.markdown-body[data-its-preview] ul.its-nested-list > li::after {
  content: "";
  position: absolute;
  left: calc(-1 * var(--its-rail-offset) - var(--its-rail-width) / 2);
  top: 0;
  bottom: 0;
  width: var(--its-rail-width);
  border-radius: 1px;
  background: var(--its-guide);
  pointer-events: none;
}

.markdown-body[data-its-preview] .its-fold {
  position: absolute;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--its-collapse);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.markdown-body[data-its-preview] .its-fold::before {
  content: "";
  width: 0;
  height: 0;
  border-left: 8px solid currentColor;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  transform-origin: 35% 50%;
  transition: transform 0.15s ease;
}

.markdown-body[data-its-preview] .its-fold[aria-expanded="true"]::before {
  transform: rotate(90deg);
}

.markdown-body[data-its-preview] .its-fold:hover {
  color: var(--its-collapse-hover);
  background: color-mix(in srgb, var(--its-accent) 10%, transparent);
}

.markdown-body[data-its-preview] .its-fold:focus-visible {
  outline: 2px solid var(--its-collapse-hover);
  outline-offset: 1px;
}

.markdown-body[data-its-preview] .its-fold:disabled {
  opacity: 0;
  pointer-events: none;
}

.markdown-body[data-its-preview] li > .its-list-fold {
  position: absolute;
  left: calc(-1 * (var(--its-bullet-offset) + var(--its-triangle-offset)) - 8px);
  top: calc(0.85em - 8px);
  font-size: inherit;
}

.markdown-body[data-its-preview] ul.its-nested-list > li > .its-list-fold {
  top: 50%;
  transform: translateY(-50%);
}

.markdown-body[data-its-preview] ul:not(.its-nested-list) > li:hover:not(:has(li:hover))::after {
  content: "";
  position: absolute;
  left: calc(-1 * var(--its-rail-offset) - var(--its-rail-width) / 2);
  top: 0.08em;
  width: var(--its-rail-width);
  height: 1.55em;
  border-radius: 1px;
  background: var(--its-active);
  pointer-events: none;
}

.markdown-body[data-its-preview] ul.its-nested-list > li:hover:not(:has(li:hover))::after {
  background: var(--its-active);
}

.markdown-body[data-its-preview] ul > li:hover:not(:has(li:hover))::before {
  background: var(--its-active);
}

.markdown-body[data-its-preview] li:hover:not(:has(li:hover)) > .its-list-fold {
  color: var(--its-active);
}

.markdown-body[data-its-preview] li.is-collapsed > ul,
.markdown-body[data-its-preview] li.is-collapsed > p:not(:first-of-type),
.markdown-body[data-its-preview] li.is-collapsed > blockquote,
.markdown-body[data-its-preview] li.is-collapsed > pre,
.markdown-body[data-its-preview] li.is-collapsed > table {
  display: none;
}

/* Task items: the checkbox is the marker, kept to the right of the rail. */
.markdown-body[data-its-preview] .task-list-item .task-list-item-checkbox {
  position: absolute;
  z-index: 1;
  left: calc(-1 * var(--its-bullet-offset) - 0.45em);
  top: calc(0.85em - 0.45em);
  -webkit-appearance: none;
  appearance: none;
  box-sizing: border-box;
  width: 0.9em;
  height: 0.9em;
  margin: 0;
  border: 1.5px solid var(--its-collapse);
  border-radius: 2px;
  background-color: transparent;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 0.72em 0.72em;
  cursor: pointer;
}

.markdown-body[data-its-preview] ul.its-nested-list > li.task-list-item .task-list-item-checkbox {
  top: 50%;
  transform: translateY(-50%);
}

.markdown-body[data-its-preview] .task-list-item .task-list-item-checkbox:checked {
  border-color: var(--its-check);
  background-color: var(--its-check);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3.2 8.4 6.4 11.6 12.8 4.8' fill='none' stroke='%23fff' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.markdown-body[data-its-preview] .task-list-item .task-list-item-checkbox:focus-visible {
  outline: 2px solid var(--its-check);
  outline-offset: 1px;
}

.markdown-body[data-its-preview] li.task-list-item > label {
  position: static;
  margin-left: 0;
}

.markdown-body[data-its-preview] li.task-list-item:has(> label > input.task-list-item-checkbox:checked) > label,
.markdown-body[data-its-preview] li.task-list-item:has(> p > label > input.task-list-item-checkbox:checked) > p > label {
  color: var(--its-muted);
  text-decoration: line-through;
}

/* Horizontal rule with the lightning mark. */
.markdown-body[data-its-preview] hr {
  position: relative;
  height: 20px;
  margin: 2.3em 0;
  border: 0;
  background: linear-gradient(var(--its-hr-line), var(--its-hr-line)) center / 100% 1px no-repeat;
}

.markdown-body[data-its-preview] hr::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 22px;
  height: 22px;
  transform: translate(-50%, -50%);
  background: var(--its-accent);
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M13 2 4 14h6l-1 8 10-12h-6l1-8z'/%3E%3C/svg%3E") center / 20px 20px no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M13 2 4 14h6l-1 8 10-12h-6l1-8z'/%3E%3C/svg%3E") center / 20px 20px no-repeat;
}

@media (max-width: 640px) {
  .markdown-body[data-its-preview] {
    --its-list-indent: 2.8em;
    --its-nested-indent: 4em;
    --its-rail-offset: 1em;
    --its-rail-width: 2px;
    --its-bullet-offset: 1.9em;
    --its-triangle-offset: 1em;
    --its-bullet-size: 0.6em;
  }

  .markdown-body[data-its-preview] :is(h1, h2, h3, h4, h5, h6) > .its-heading-fold {
    left: -16px;
  }
}
`;

const settings = Object.assign({}, DEFAULTS, readSettings());
if (settings.enabled === false) {
  return;
}

settings.autoFold = settings.autoFold !== false;
const configuredFoldLevel = Number(settings.autoFoldLevel);
settings.autoFoldLevel = Number.isFinite(configuredFoldLevel) && configuredFoldLevel > 0
  ? configuredFoldLevel
  : DEFAULTS.autoFoldLevel;
settings.listFolding = settings.listFolding !== false;
settings.debug = settings.debug === true;

const headingState = new Map();
const listState = new Map();
let previewPane = null;
let paneObserver = null;
let bodyObserver = null;
let decorateTimer = null;
let decorating = false;
let decorateSerial = 0;

injectStyle();

if (typeof MarkEdit.onEditorReady === "function") {
  MarkEdit.onEditorReady(() => {
    headingState.clear();
    listState.clear();
    setupPane();
  });
}

// The editor-ready callback can fire before this script is evaluated in some hosts.
setTimeout(setupPane, 300);

function readSettings() {
  try {
    const value = MarkEdit.userSettings && MarkEdit.userSettings[SETTINGS_KEY];
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function injectStyle() {
  let style = document.getElementById(STYLE_ID);
  if (style === null) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = CSS;
}

function findPane() {
  return document.querySelector('body > .markdown-body:not([aria-hidden="true"])');
}

function setupPane() {
  const pane = findPane();
  if (pane === null) {
    observeBody();
    return;
  }

  previewPane = pane;
  pane.setAttribute("data-its-preview", "true");

  if (pane.dataset.itsClickBound !== "true") {
    pane.dataset.itsClickBound = "true";
    pane.addEventListener("click", handleClick);
  }

  observePane(pane);
  scheduleDecorate(0);
}

function observeBody() {
  if (bodyObserver !== null) {
    return;
  }

  bodyObserver = new MutationObserver(() => {
    if (findPane() !== null) {
      bodyObserver.disconnect();
      bodyObserver = null;
      setupPane();
    }
  });

  bodyObserver.observe(document.body, { childList: true, subtree: true });
}

function observePane(pane) {
  if (paneObserver !== null) {
    paneObserver.disconnect();
  }

  paneObserver = new MutationObserver(() => {
    if (pane.querySelector("." + MARKER_CLASS) !== null) {
      return;
    }
    scheduleDecorate(30);
  });

  paneObserver.observe(pane, { childList: true, subtree: true });
}

function scheduleDecorate(delay) {
  clearTimeout(decorateTimer);
  decorateTimer = setTimeout(() => {
    decorate().catch((error) => {
      console.error("[MarkEdit ITS Preview]", error);
    });
  }, delay);
}

async function decorate() {
  if (decorating) {
    return;
  }

  const pane = previewPane || findPane();
  if (pane === null || pane.querySelector("." + MARKER_CLASS) !== null) {
    return;
  }

  decorating = true;
  try {
    pane.setAttribute("data-its-preview", "true");
    const serial = ++decorateSerial;
    const headings = getTopLevelHeadings(pane);

    // Compute stable keys before moving nodes around.
    const headingKeys = createHeadingKeys(headings);
    const records = headings.map((heading, index) => ({
      heading,
      index,
      level: headingLevel(heading),
      key: headingKeys[index],
    }));

    // Walk backwards so wrapping a deeper section never invalidates earlier siblings.
    for (let i = records.length - 1; i >= 0; i -= 1) {
      const { heading, index, level, key } = records[i];
      const content = [];
      let node = heading.nextElementSibling;

      while (node !== null) {
        if (isHeading(node) && headingLevel(node) <= level) {
          break;
        }
        content.push(node);
        node = node.nextElementSibling;
      }

      const button = createFoldButton("heading");
      button.dataset.itsKey = key;
      heading.prepend(button);

      if (content.length === 0) {
        button.disabled = true;
        button.setAttribute("aria-label", "No content to fold");
        continue;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "its-section-content";
      wrapper.id = "its-section-" + serial + "-" + index;
      heading.after(wrapper);
      content.forEach((element) => wrapper.appendChild(element));

      button.dataset.itsSection = wrapper.id;
      button.setAttribute("aria-controls", wrapper.id);

      if (!headingState.has(key)) {
        headingState.set(key, settings.autoFold && level >= settings.autoFoldLevel);
      }
      applyHeadingState(button, wrapper, headingState.get(key));
    }

    if (settings.listFolding !== false) {
      decorateLists(pane);
    }

    const marker = document.createElement("span");
    marker.className = MARKER_CLASS;
    marker.hidden = true;
    pane.appendChild(marker);

    if (settings.debug === true) {
      writeDebug(pane);
    }
  } finally {
    decorating = false;
  }
}

function getTopLevelHeadings(pane) {
  return [...pane.querySelectorAll(":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6")];
}

function createHeadingKeys(headings) {
  const seen = new Map();
  return headings.map((heading) => {
    if (heading.id) {
      return "h:" + heading.id;
    }

    const label = headingLabel(heading);
    const base = "h:" + headingLevel(heading) + ":" + label;
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    return base + "#" + count;
  });
}

function headingLabel(heading) {
  const clone = heading.cloneNode(true);
  clone.querySelectorAll(".anchor, .header-anchor, .its-heading-fold").forEach((node) => node.remove());
  return clone.textContent.trim().replace(/\s+/g, " ");
}

function decorateLists(pane) {
  const items = [...pane.querySelectorAll("li")];
  const seen = new Map();

  items.forEach((item) => {
    const nested = item.querySelector(":scope > ul");
    if (nested === null) {
      return;
    }

    nested.classList.add("its-nested-list");
    const key = createListKey(item, seen);
    const button = createFoldButton("list");
    button.dataset.itsKey = key;
    item.prepend(button);

    if (!listState.has(key)) {
      listState.set(key, false);
    }
    applyListState(item, button, listState.get(key));
  });
}

function createListKey(item, seen) {
  const clone = item.cloneNode(true);
  clone.querySelectorAll(":scope > ul, .its-list-fold").forEach((node) => node.remove());
  const label = clone.textContent.trim().replace(/\s+/g, " ").slice(0, 80);
  const count = (seen.get(label) || 0) + 1;
  seen.set(label, count);
  return "l:" + label + "#" + count;
}

function createFoldButton(kind) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "its-fold its-" + kind + "-fold";
  button.setAttribute("aria-expanded", "true");
  button.setAttribute("aria-label", kind === "heading" ? "Collapse section" : "Collapse list");
  return button;
}

function applyHeadingState(button, wrapper, collapsed) {
  wrapper.hidden = collapsed;
  button.setAttribute("aria-expanded", String(!collapsed));
  button.setAttribute("aria-label", collapsed ? "Expand section" : "Collapse section");
}

function applyListState(item, button, collapsed) {
  item.classList.toggle("is-collapsed", collapsed);
  button.setAttribute("aria-expanded", String(!collapsed));
  button.setAttribute("aria-label", collapsed ? "Expand list" : "Collapse list");
}

function handleClick(event) {
  if (!(event.target instanceof Element)) {
    return;
  }

  const button = event.target.closest(".its-fold");
  if (button === null || button.disabled) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (button.classList.contains("its-heading-fold")) {
    const heading = button.closest("h1, h2, h3, h4, h5, h6");
    const section = button.dataset.itsSection
      ? document.getElementById(button.dataset.itsSection)
      : null;

    if (heading === null || section === null) {
      return;
    }

    const collapsed = !section.hidden;
    section.hidden = collapsed;
    button.setAttribute("aria-expanded", String(!collapsed));
    button.setAttribute("aria-label", collapsed ? "Expand section" : "Collapse section");
    headingState.set(button.dataset.itsKey, collapsed);
  } else {
    const item = button.closest("li");
    if (item === null) {
      return;
    }

    const collapsed = !item.classList.contains("is-collapsed");
    item.classList.toggle("is-collapsed", collapsed);
    button.setAttribute("aria-expanded", String(!collapsed));
    button.setAttribute("aria-label", collapsed ? "Expand list" : "Collapse list");
    listState.set(button.dataset.itsKey, collapsed);
  }
}

function isHeading(node) {
  return node instanceof Element && /^H[1-6]$/.test(node.tagName);
}

function headingLevel(heading) {
  return Number(heading.tagName.slice(1));
}

async function writeDebug(pane) {
  try {
    const base = typeof MarkEdit.getDirectoryPath === "function"
      ? MarkEdit.getDirectoryPath("documents")
      : undefined;
    if (base === undefined) {
      return;
    }

    const info = typeof MarkEdit.getFileInfo === "function"
      ? await MarkEdit.getFileInfo().catch(() => undefined)
      : undefined;
    const headings = [...pane.querySelectorAll("h1, h2, h3, h4, h5, h6")];
    const h1 = pane.querySelector("h1");
    const firstList = pane.querySelector("ul");
    const h1Style = h1 ? getComputedStyle(h1) : undefined;
    const h1After = h1 ? getComputedStyle(h1, "::after") : undefined;
    const rail = firstList ? getComputedStyle(firstList, "::before") : undefined;

    const data = {
      plugin: "markedit-theme-its-preview",
      version: VERSION,
      filePath: info?.filePath ?? null,
      mode: pane.classList.contains("overlay")
        ? "preview"
        : document.body.classList.contains("markdown-container") ? "side-by-side" : "other",
      headingCount: headings.length,
      collapsedHeadings: headings.filter((heading) => heading.nextElementSibling?.hidden === true).length,
      h3State: headings
        .filter((heading) => heading.tagName === "H3")
        .map((heading) => ({
          text: heading.textContent.trim().slice(0, 48),
          expanded: heading.querySelector(":scope > .its-heading-fold")?.getAttribute("aria-expanded") ?? null,
        })),
      headingDetails: headings.map((heading) => {
        const button = heading.querySelector(":scope > .its-heading-fold");
        const section = button?.dataset.itsSection
          ? document.getElementById(button.dataset.itsSection)
          : null;
        const next = heading.nextElementSibling;
        return {
          tag: heading.tagName,
          id: heading.id || null,
          key: button?.dataset.itsKey || null,
          sectionId: button?.dataset.itsSection || null,
          sectionHidden: section?.hidden ?? null,
          aria: button?.getAttribute("aria-expanded") ?? null,
          nextTag: next?.tagName || null,
          nextClass: next?.className || null,
          nextHidden: next?.hidden ?? null,
        };
      }),
      headingState: [...headingState.entries()],
      listState: [...listState.entries()],
      listCount: pane.querySelectorAll("li > .its-list-fold").length,
      h1: h1Style && h1After ? {
        fontFamily: h1Style.fontFamily,
        textDecoration: h1Style.textDecorationLine,
        borderBottom: h1Style.borderBottomWidth,
        afterContent: h1After.content,
        afterWidth: h1After.width,
        afterBackground: h1After.backgroundColor,
        color: h1Style.color,
      } : null,
      firstRail: rail ? {
        width: rail.width,
        background: rail.backgroundColor,
        left: rail.left,
      } : null,
      previewClass: pane.className,
    };

    const path = base.replace(/\/$/, "") + "/debug/its-preview-debug.json";
    await MarkEdit.createFile({
      path,
      string: JSON.stringify(data, null, 2),
      overwrites: true,
    });
  } catch (error) {
    console.error("[MarkEdit ITS Preview] debug write failed", error);
  }
}
