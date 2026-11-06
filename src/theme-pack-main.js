/**
 * MarkEdit Preview Theme Pack
 *
 * One plugin for five preview themes:
 *   ITS · Maple Light · Maple Dark · Obsidianite · Obsidianite Brackets
 *
 * Selection
 *   Extensions (扩展功能) > Preview Theme > pick a theme.
 *   The first entry, 默认（不套用）, removes every pack attribute so the
 *   preview is styled only by MarkEdit-preview's GitHub base and by any other
 *   installed theme extension; folding keeps working in that mode.
 *   The choice is remembered in Documents/.markedit-theme-pack.json.
 *   settings.json can set the initial theme when that state file is absent:
 *
 *     "extension.markeditThemePack": {
 *       "theme": "its",
 *       "autoFold": true,
 *       "autoFoldLevel": 3,
 *       "listFolding": true,
 *       "stickyTableHeader": true,
 *       "debug": false
 *     }
 *
 *   autoFold/autoFoldLevel apply to the ITS theme only (matching the original
 *   ITS plugin). List folding applies to every theme.
 *
 * Sticky table headers
 *   Long tables keep their header row while the preview scrolls. This is
 *   behavior, not theming: it is keyed on its own attribute
 *   [data-theme-pack-table-sticky] and takes its colors from MarkEdit-preview's
 *   GitHub variables, so it also works in 默认（不套用） mode and under other
 *   themes. Set "stickyTableHeader": false in settings.json to switch it off
 *   (restart MarkEdit afterwards).
 *
 * Fold Levels
 *   Extensions > 折叠层级: 全部折叠 / 全部打开 / 折叠到 H1..H6.
 *   Works in preview and in Markdown source mode. In source mode it drives
 *   CodeMirror's own fold state, so the gutter triangles and the menu stay in
 *   sync. "全部折叠" folds every heading level as nested folds, so unfolding
 *   one level reveals the next level still collapsed. "折叠到 Hx" does the
 *   same for Hx and deeper; H1..H(x-1) keep their content expanded, and the
 *   Hx heading row itself stays visible. Level options are disabled when the
 *   document has no headings at that level or deeper.
 *   Non-ITS themes keep their preview heading triangles hidden.
 *   The installer registers a pinnable toolbar menu item via
 *   settings.editor.customToolbarItems[].menuName = "折叠层级".
 *
 * Export
 *   Extensions > Preview Theme > 导出当前主题 HTML…
 *   Saves a standalone HTML that embeds the active theme CSS, the preview
 *   HTML and (local) images as data URLs. The file includes print CSS, so
 *   opening it in a browser and choosing Print / Save as PDF produces a
 *   themed PDF. MarkEdit's own PDF exports do not read the preview theme.
 *   The export freezes the tone you are looking at, so the file keeps its
 *   colors whatever appearance the reader's system uses.
 *
 * Tone
 *   Each theme declares a tone: "light", "dark", or "auto" (ITS, which follows
 *   the system appearance). The resolved value is written to
 *   .markdown-body[data-theme-pack-tone], and the derived palettes — fenced-code
 *   syntax tokens, mermaid diagrams, the ITS palette itself — read CSS custom
 *   properties keyed on it. Adding a theme therefore means adding a tone, not
 *   hand-picking token colors. Mermaid follows the same idea but needs one more
 *   bit: MarkEdit-preview initializes it from the OS appearance, so the plugin
 *   also sets [data-theme-pack-mermaid-paint] when the diagram palette and the
 *   theme disagree (or whenever the theme is dark).
 *
 * Install / rebuild
 *   ./scripts/install-theme-pack.sh   (run from the project root)
 *   The installer builds this file, copies it into MarkEdit's scripts folder,
 *   enables the pack, and removes the standalone ITS plugin entry/file
 *   (backed up to /tmp). The project copy src/its/markedit-theme-its-preview.js
 *   is still the build-time source for the ITS CSS; keep it.
 *   Quit and relaunch MarkEdit afterwards.
 *
 * Theme CSS lives in src/theme-pack-themes.css; build-theme-pack.js inlines both
 * CSS sources here. Do not hand-edit CSS in this file or in dist/.
 */

const VERSION = "1.6.1";
const SETTINGS_KEY = "extension.markeditThemePack";
const STYLE_ID = "markedit-theme-pack-style";
const MARKER_CLASS = "theme-pack-decorated-marker";
const THEME_ATTR = "data-preview-theme";
const TONE_ATTR = "data-theme-pack-tone";
const MERMAID_PAINT_ATTR = "data-theme-pack-mermaid-paint";
const STICKY_ATTR = "data-theme-pack-table-sticky";
const STICKY_TOP_VAR = "--theme-pack-sticky-top";
const SURFACE_ATTR = "data-theme-pack-surface";
const STATE_FILE = ".markedit-theme-pack.json";
const FOLD_MENU_TITLE = "折叠层级";

// tone: how bright the theme itself is. "auto" follows the system appearance,
// which is what ITS does; the resolved value is written to TONE_ATTR and every
// derived palette (code tokens, mermaid) reads its colors from it, so a new
// theme only needs a tone, not a hand-written token list.
// "none" is not a theme: it strips every pack attribute so MarkEdit-preview's
// GitHub base — and any other installed theme extension — styles the preview.
const THEMES = [
  { id: "none", label: "默认（不套用）", tone: "auto" },
  { id: "its", label: "ITS", tone: "auto" },
  { id: "maple-light", label: "Maple Light", tone: "light" },
  { id: "maple-dark", label: "Maple Dark", tone: "dark" },
  { id: "obsidianite", label: "Obsidianite", tone: "dark" },
  { id: "obsidianite-bracket", label: "Obsidianite Brackets", tone: "dark" },
];
const NO_THEME = "none";
const THEME_IDS = new Set(THEMES.map((theme) => theme.id));
const TONE_BY_THEME = new Map(THEMES.map((theme) => [theme.id, theme.tone]));
const DEFAULT_THEME = "its";
const THEME_BACKGROUNDS = {
  its: { light: "#ffffff", dark: "#101418" },
  "maple-light": { light: "#fbf8f3", dark: "#fbf8f3" },
  "maple-dark": { light: "#0d0f11", dark: "#0d0f11" },
  obsidianite: { light: "#100e17", dark: "#100e17" },
  "obsidianite-bracket": { light: "#100e17", dark: "#100e17" },
};

const DEFAULTS = {
  theme: DEFAULT_THEME,
  autoFold: true,
  autoFoldLevel: 3,
  listFolding: true,
  stickyTableHeader: true,
  debug: false,
};

const settings = readSettings();
settings.theme = normalizeTheme(settings.theme);
settings.autoFold = settings.autoFold !== false;
const configuredFoldLevel = Number(settings.autoFoldLevel);
settings.autoFoldLevel = Number.isFinite(configuredFoldLevel) && configuredFoldLevel > 0
  ? configuredFoldLevel
  : DEFAULTS.autoFoldLevel;
settings.listFolding = settings.listFolding !== false;
settings.stickyTableHeader = settings.stickyTableHeader !== false;
settings.debug = settings.debug === true;

let currentTheme = settings.theme;
let statePath = null;
let previewPane = null;
let paneObserver = null;
let bodyObserver = null;
let decorateTimer = null;
let decorating = false;
let decorateSerial = 0;
let currentBranch = null;
let persistTimer = null;
let persistChain = Promise.resolve();
let paneVisible = null;
let pendingPreviewLine = null;
let previewScrollTimer = null;
let previewScrollToken = 0;
let editorSnapshotState = null;
let editorSnapshotView = null;
let editorSnapshot = null;

const headingState = new Map();
const listState = new Map();

// MarkEdit exposes its bundled CodeMirror modules through the extension
// wrapper's require(). The browser harness passes a stub, so treat source-mode
// folding as optional rather than failing the whole preview theme pack.
let cmFold = null;
try {
  const language = require("@codemirror/language");
  if (
    language
    && language.foldEffect
    && language.unfoldEffect
    && language.foldedRanges
    && language.foldState
    && language.foldable
    && language.syntaxTree
  ) {
    cmFold = language;
  }
} catch {
  // Preview-only environments do not provide CodeMirror.
}

injectStyle();
registerMenu();
watchSystemTone();
loadPersistedTheme();

if (typeof MarkEdit.onEditorReady === "function") {
  MarkEdit.onEditorReady(() => {
    headingState.clear();
    listState.clear();
    clearBranch();
    setupPane();
  });
}

// The editor-ready callback can fire before this script is evaluated.
setTimeout(setupPane, 300);

function readSettings() {
  try {
    const value = MarkEdit.userSettings && MarkEdit.userSettings[SETTINGS_KEY];
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function normalizeTheme(value) {
  return THEME_IDS.has(value) ? value : DEFAULT_THEME;
}

function toneOf(theme) {
  return TONE_BY_THEME.get(theme) || "light";
}

function systemIsDark() {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches === true;
  } catch {
    return false;
  }
}

function resolveTone(theme) {
  const tone = toneOf(theme);
  return tone === "auto" ? (systemIsDark() ? "dark" : "light") : tone;
}

function currentTone() {
  return resolveTone(currentTheme);
}

// MarkEdit-preview initializes mermaid from the OS appearance, so a dark theme
// on a light host gets light-lavender diagrams that read as black-on-black.
// Only dark themes are repainted: mermaid's own default palette (lavender
// actors, yellow notes) is the look people expect from a light theme, so a
// light theme keeps it even when the host is dark and the diagram turns into
// mermaid's dark variant. Repainting light themes flattened classDef fills and
// washed the diagrams into the page background.
function shouldPaintMermaid(tone) {
  return tone === "dark";
}

function themeMenuItem(theme) {
  return {
    title: theme.label,
    action: () => selectTheme(theme.id),
    state: () => ({ isSelected: currentTheme === theme.id }),
  };
}

function registerMenu() {
  if (typeof MarkEdit.addMainMenuItem !== "function") {
    return;
  }

  MarkEdit.addMainMenuItem([
    {
      title: "Preview Theme",
      children: [
        // The "不套用" entry first, then the five built-in themes.
        themeMenuItem(THEMES[0]),
        { separator: true },
        ...THEMES.slice(1).map(themeMenuItem),
        { separator: true },
        {
          title: "导出当前主题 HTML…",
          action: () => {
            void exportThemedHtml();
          },
        },
      ],
    },
    {
      title: FOLD_MENU_TITLE,
      icon: "chevron.up.chevron.down",
      children: [
        {
          title: "全部折叠",
          action: () => applyHeadingFold(0),
          state: () => headingFoldState(0),
        },
        {
          title: "全部打开",
          action: () => applyHeadingFold(-1),
          state: () => headingFoldState(-1),
        },
        { separator: true },
        ...[1, 2, 3, 4, 5, 6].map((level) => ({
          title: "折叠到 H" + level,
          action: () => applyHeadingFold(level),
          state: () => headingFoldState(level),
        })),
      ],
    },
  ]);
}

function selectTheme(theme, options = {}) {
  const next = normalizeTheme(theme);
  const changed = next !== currentTheme;
  currentTheme = next;

  const pane = previewPane || findPane();
  if (pane !== null) {
    applyThemeToPane(pane);
    if (changed) {
      clearBranch();
      resetDecorations(pane);
      scheduleDecorate(0);
    }
  }

  if (options.persist !== false) {
    persistTheme();
  }
}

async function exportThemedHtml() {
  try {
    const getHtml = window.MarkEditGetHtml;
    if (typeof getHtml !== "function") {
      throw new Error("未找到 MarkEdit-preview 的 MarkEditGetHtml，请先安装并启用 MarkEdit-preview。");
    }

    const html = await getHtml(true);
    if (typeof html !== "string" || !html.includes("markdown-body")) {
      throw new Error("MarkEdit-preview 没有返回可用的 HTML。");
    }

    const doc = new DOMParser().parseFromString(html, "text/html");
    const wrapper = doc.body.querySelector(".markdown-body");
    if (wrapper === null) {
      throw new Error("导出的 HTML 中找不到 .markdown-body。");
    }

    // The exported SVG/CSS palette has to match what the user was looking at, so
    // the attributes are copied exactly as the live pane has them.
    const tone = currentTheme === NO_THEME ? (systemIsDark() ? "dark" : "light") : currentTone();
    if (currentTheme !== NO_THEME) {
      wrapper.setAttribute(THEME_ATTR, currentTheme);
      wrapper.setAttribute(TONE_ATTR, tone);
      if (shouldPaintMermaid(tone)) {
        wrapper.setAttribute(MERMAID_PAINT_ATTR, "true");
      }
      doc.documentElement.setAttribute(SURFACE_ATTR, currentTheme);
      doc.body.setAttribute(SURFACE_ATTR, currentTheme);
    }
    if (settings.stickyTableHeader) {
      wrapper.setAttribute(STICKY_ATTR, "true");
      // The live pane's inline style is copied along by MarkEditGetHtml, and its
      // negative sticky offset only makes sense while the pane itself scrolls.
      // In the exported file the document scrolls, so pin at 0.
      wrapper.style.setProperty(STICKY_TOP_VAR, "0px");
    }

    const info = typeof MarkEdit.getFileInfo === "function"
      ? await MarkEdit.getFileInfo()
      : undefined;
    await inlineExportImages(doc, info?.parentPath);

    const pane = previewPane || findPane();
    const background = exportBackground(pane, tone);
    const style = doc.createElement("style");
    style.textContent = CSS + "\n" + exportPageCss(background, tone);
    doc.body.appendChild(style);

    const finalHtml = "<!doctype html>\n" + doc.documentElement.outerHTML;
    const fileName = exportFileBaseName(info?.filePath)
      + "-" + (currentTheme === NO_THEME ? "default" : currentTheme)
      + ".html";

    if (typeof MarkEdit.showSavePanel !== "function") {
      await navigator.clipboard.writeText(finalHtml);
      showAlert("已复制 HTML", "当前 MarkEdit 不支持保存面板，主题 HTML 已复制到剪贴板。");
      return;
    }

    MarkEdit.showSavePanel({ fileName, string: finalHtml });
  } catch (error) {
    console.error("[MarkEdit Theme Pack] export HTML failed", error);
    showAlert("导出失败", error instanceof Error ? error.message : String(error));
  }
}

function exportBackground(pane, tone) {
  if (pane !== null) {
    const color = getComputedStyle(pane).backgroundColor;
    if (color && color !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(color)) {
      return color;
    }
  }

  const backgrounds = THEME_BACKGROUNDS[currentTheme];
  if (!backgrounds) {
    // "不套用" has no page color of its own: fall back to the host canvas.
    return systemIsDark() ? "#0d1117" : "#ffffff";
  }
  return tone === "dark" ? backgrounds.dark : backgrounds.light;
}

function exportPageCss(background, tone) {
  return `
html,
body {
  background: ${background} !important;
  color-scheme: ${tone === "dark" ? "dark" : "light"};
}

body {
  margin: 0;
}

.markdown-body[data-preview-theme] {
  max-width: 900px;
  margin: 0 auto;
  min-height: 100vh;
}

@media print {
  @page {
    size: A4;
    margin: 0;
  }

  html,
  body {
    background: ${background} !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .markdown-body[data-preview-theme] {
    max-width: none;
    min-height: 0;
    margin: 0;
    padding: 16mm 14mm !important;
  }

  .markdown-body[data-preview-theme] pre,
  .markdown-body[data-preview-theme] pre code {
    overflow: visible !important;
    white-space: pre-wrap !important;
    overflow-wrap: break-word;
  }

  table,
  blockquote,
  img,
  .katex-display {
    break-inside: avoid;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    break-after: avoid;
  }
}
`;
}

function exportFileBaseName(filePath) {
  if (typeof filePath !== "string" || filePath.length === 0) {
    return "untitled";
  }
  const leaf = filePath.split("/").pop() || "untitled";
  return leaf.replace(/\.(md|markdown|txt|mmd|mermaid|tex)$/i, "") || "untitled";
}

async function inlineExportImages(doc, basePath) {
  if (!basePath || typeof MarkEdit.getFileObject !== "function") {
    return;
  }

  const images = [...doc.querySelectorAll(".markdown-body img[src]")];
  await Promise.all(images.map(async (image) => {
    const src = image.getAttribute("src") || "";
    if (!src || src.startsWith("data:") || /^(?:https?:)?\/\//i.test(src)) {
      return;
    }

    const resolved = resolveExportPath(basePath, src);
    if (resolved === null) {
      return;
    }

    try {
      const file = await MarkEdit.getFileObject(resolved);
      if (!file || typeof file.data !== "string" || file.data.length === 0) {
        return;
      }
      const mime = typeof file.mimeType === "string" && file.mimeType.startsWith("image/")
        ? file.mimeType
        : "image/png";
      image.setAttribute("src", `data:${mime};base64,${file.data}`);
    } catch {
      // Leave the original relative URL if the file cannot be read.
    }
  }));
}

function resolveExportPath(basePath, src) {
  let path = src.split("#")[0].split("?")[0];
  if (!path) {
    return null;
  }
  try {
    path = decodeURIComponent(path);
  } catch {
    // Keep the original path if it is not valid percent-encoding.
  }
  path = path.replace(/^file:\/\//i, "");

  const combined = path.startsWith("/")
    ? path
    : basePath.replace(/\/+$/, "") + "/" + path;
  const parts = [];
  for (const part of combined.split("/")) {
    if (!part || part === ".") {
      continue;
    }
    if (part === "..") {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return "/" + parts.join("/");
}

function showAlert(title, message) {
  if (typeof MarkEdit.showAlert === "function") {
    MarkEdit.showAlert({ title, message });
  } else {
    console.error("[MarkEdit Theme Pack] " + title + ": " + message);
  }
}

async function loadPersistedTheme() {
  try {
    const base = getDocumentsPath();
    if (base === undefined) {
      return;
    }

    statePath = base.replace(/\/$/, "") + "/" + STATE_FILE;
    if (typeof MarkEdit.getFileContent !== "function") {
      return;
    }

    const raw = await MarkEdit.getFileContent(statePath);
    if (raw === undefined || raw === null || raw === "") {
      return;
    }

    const data = JSON.parse(raw);
    if (data && THEME_IDS.has(data.theme) && data.theme !== currentTheme) {
      selectTheme(data.theme, { persist: false });
    }
  } catch {
    // Missing state file is the normal first-run case.
  }
}

function persistTheme() {
  // Debounce and serialize writes so rapid menu switches cannot land out of order.
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    const theme = currentTheme;
    persistChain = persistChain
      .catch(() => {})
      .then(() => writePersistedTheme(theme));
  }, 120);
}

async function writePersistedTheme(theme) {
  try {
    const base = getDocumentsPath();
    if (base === undefined || typeof MarkEdit.createFile !== "function") {
      return;
    }

    statePath = base.replace(/\/$/, "") + "/" + STATE_FILE;
    await MarkEdit.createFile({
      path: statePath,
      string: JSON.stringify({ theme }, null, 2) + "\n",
      overwrites: true,
    });
  } catch (error) {
    console.error("[MarkEdit Theme Pack] failed to persist theme", error);
  }
}

function getDocumentsPath() {
  try {
    return typeof MarkEdit.getDirectoryPath === "function"
      ? MarkEdit.getDirectoryPath("documents")
      : undefined;
  } catch {
    return undefined;
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

function applyThemeToPane(pane) {
  if (currentTheme === NO_THEME) {
    // Every pack rule is scoped to [data-preview-theme], so dropping the
    // attributes hands the preview back to GitHub base / other theme plugins.
    pane.removeAttribute(THEME_ATTR);
    pane.removeAttribute(TONE_ATTR);
    pane.removeAttribute(MERMAID_PAINT_ATTR);
    pane.style.colorScheme = "";
  } else {
    const tone = currentTone();
    pane.setAttribute(THEME_ATTR, currentTheme);
    pane.setAttribute(TONE_ATTR, tone);
    if (shouldPaintMermaid(tone)) {
      pane.setAttribute(MERMAID_PAINT_ATTR, "true");
    } else {
      pane.removeAttribute(MERMAID_PAINT_ATTR);
    }
    pane.style.colorScheme = tone;
  }

  applyStickyTables(pane);
  syncSurface();
}

// Sticky headers are behavior rather than theming, so the switch has its own
// attribute and its CSS reads MarkEdit-preview's GitHub variables. That keeps it
// working in the "不套用" mode and under other people's themes, while our own
// themes still win on the header colors through their more specific rules.
function applyStickyTables(pane) {
  if (!settings.stickyTableHeader) {
    pane.removeAttribute(STICKY_ATTR);
    pane.style.removeProperty(STICKY_TOP_VAR);
    return;
  }
  pane.setAttribute(STICKY_ATTR, "true");
  syncStickyOffset(pane);
}

// WebKit pins a sticky cell against the scroll container's *content* box, and
// the container's padding-top scrolls away with the content. MarkEdit-preview
// makes the pane itself the scroller (overflow:scroll) and every theme gives it
// a top padding, so a plain top:0 leaves a gap exactly as tall as that padding
// (measured in WKWebView: padding 36 -> stuck 36, 25 -> 25, 0 -> 0). Offsetting
// by the negative padding puts the header flush with the visible top.
function syncStickyOffset(pane) {
  const style = getComputedStyle(pane);
  const paneScrolls = /auto|scroll/.test(style.overflowY);
  const paddingTop = paneScrolls ? Number.parseFloat(style.paddingTop) : 0;
  pane.style.setProperty(STICKY_TOP_VAR, (Number.isFinite(paddingTop) ? -paddingTop : 0) + "px");
}

// The palette keys on the resolved tone and on the host appearance, so flipping
// the system appearance has to re-apply every theme, not only the auto ones.
function watchSystemTone() {
  if (typeof window.matchMedia !== "function") {
    return;
  }

  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    const pane = previewPane || findPane();
    if (pane !== null) {
      applyThemeToPane(pane);
    }
  };

  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", onChange);
  } else if (typeof query.addListener === "function") {
    query.addListener(onChange);
  }
}

function syncSurface() {
  const pane = previewPane || findPane();
  const isOverlay = pane !== null
    && pane.classList.contains("overlay")
    && getComputedStyle(pane).display !== "none";
  const surface = isOverlay && currentTheme !== "its" && currentTheme !== NO_THEME ? currentTheme : "";
  for (const element of [document.documentElement, document.body]) {
    if (surface === "") {
      element.removeAttribute(SURFACE_ATTR);
    } else {
      element.setAttribute(SURFACE_ATTR, surface);
    }
  }

  const visible = pane !== null && isElementVisible(pane);
  if (pane !== null) {
    if (paneVisible === false && visible) {
      queuePreviewScroll(pane);
    }
    if (!visible) {
      pendingPreviewLine = null;
      clearTimeout(previewScrollTimer);
      previewScrollTimer = null;
    }
    paneVisible = visible;
  } else {
    paneVisible = null;
  }
}

function queuePreviewScroll(pane) {
  const line = sourceLineIndex();
  if (line === null) {
    return;
  }

  pendingPreviewLine = line;
  const token = ++previewScrollToken;
  clearTimeout(previewScrollTimer);
  previewScrollTimer = setTimeout(() => {
    if (token !== previewScrollToken) {
      return;
    }
    applyPendingPreviewScroll(pane, 0);
  }, 80);
}

function applyPendingPreviewScroll(pane, attempt) {
  if (pendingPreviewLine === null || !pane.isConnected || !isElementVisible(pane)) {
    return;
  }

  const target = findPreviewLine(pane, pendingPreviewLine);
  if (target === null) {
    if (attempt < 10) {
      previewScrollTimer = setTimeout(() => applyPendingPreviewScroll(pane, attempt + 1), 60);
    }
    return;
  }

  const paneRect = pane.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  if (targetRect.width === 0 && targetRect.height === 0) {
    if (attempt < 10) {
      previewScrollTimer = setTimeout(() => applyPendingPreviewScroll(pane, attempt + 1), 60);
    }
    return;
  }

  const sync = window.__markeditBidirectionalPreviewSync__;
  if (sync && sync.isActive !== false && typeof sync.beginPreviewScroll === "function") {
    sync.beginPreviewScroll({ animated: false });
  }
  pane.scrollTop = Math.max(0, pane.scrollTop + targetRect.top - paneRect.top - 10);
  pendingPreviewLine = null;
}

function findPreviewLine(pane, line) {
  const nodes = [...pane.querySelectorAll("[data-line-from][data-line-to]")];
  let best = null;
  for (const node of nodes) {
    if (node.getClientRects().length === 0) {
      continue;
    }
    const from = Number(node.getAttribute("data-line-from"));
    const to = Number(node.getAttribute("data-line-to"));
    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      continue;
    }
    if (line < from || line > to) {
      continue;
    }
    const span = to - from;
    const bestSpan = best === null
      ? Infinity
      : Number(best.getAttribute("data-line-to")) - Number(best.getAttribute("data-line-from"));
    if (span < bestSpan) {
      best = node;
    }
  }
  if (best !== null) {
    return best;
  }

  let fallback = null;
  for (const node of nodes) {
    if (node.getClientRects().length === 0) {
      continue;
    }
    const from = Number(node.getAttribute("data-line-from"));
    if (Number.isFinite(from) && from <= line) {
      if (fallback === null || from > Number(fallback.getAttribute("data-line-from"))) {
        fallback = node;
      }
    }
  }
  return fallback;
}

function sourceLineIndex() {
  try {
    const view = MarkEdit.editorView;
    if (!view || !view.state || !view.state.doc) {
      return null;
    }

    const selection = view.state.selection.main;
    const lineNumber = view.state.doc.lineAt(selection.head).number - 1;
    const scrollDOM = view.scrollDOM;
    if (!scrollDOM) {
      return lineNumber;
    }

    const viewport = scrollDOM.getBoundingClientRect();
    if (viewport.width === 0 || viewport.height === 0) {
      return lineNumber;
    }

    if (typeof view.coordsAtPos === "function") {
      const coords = view.coordsAtPos(selection.head);
      if (coords && coords.top >= viewport.top && coords.bottom <= viewport.bottom) {
        return lineNumber;
      }
    }

    if (typeof view.posAtCoords === "function") {
      const topPos = view.posAtCoords({ x: viewport.left + 40, y: viewport.top + 8 });
      if (topPos !== null && topPos !== undefined) {
        return view.state.doc.lineAt(topPos).number - 1;
      }
    }

    return lineNumber;
  } catch {
    return null;
  }
}

function setupPane() {
  const pane = findPane();
  if (pane === null) {
    observeBody();
    return;
  }

  previewPane = pane;
  applyThemeToPane(pane);
  syncSurface();

  if (pane.dataset.themePackBound !== "true") {
    pane.dataset.themePackBound = "true";
    pane.addEventListener("click", handleClick);
    pane.addEventListener("mouseover", handlePointerOver);
    pane.addEventListener("mouseleave", clearBranch);
    new MutationObserver(syncSurface).observe(pane, {
      attributes: true,
      attributeFilter: ["class", "style", "aria-hidden"],
    });
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
      console.error("[MarkEdit Theme Pack]", error);
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
    applyThemeToPane(pane);
    decorateHeadings(pane);
    if (settings.listFolding !== false) {
      decorateLists(pane);
    }

    const marker = document.createElement("span");
    marker.className = MARKER_CLASS;
    marker.hidden = true;
    pane.appendChild(marker);

    syncSurface();

    if (pendingPreviewLine !== null) {
      clearTimeout(previewScrollTimer);
      previewScrollTimer = null;
      applyPendingPreviewScroll(pane, 0);
    }

    if (settings.debug === true) {
      writeDebug(pane);
    }
  } finally {
    decorating = false;
  }
}

function decorateHeadings(pane) {
  const headings = getTopLevelHeadings(pane);
  const headingKeys = createHeadingKeys(headings);
  const serial = ++decorateSerial;
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
    wrapper.id = "theme-pack-section-" + serial + "-" + index;
    heading.after(wrapper);
    content.forEach((element) => wrapper.appendChild(element));

    button.dataset.itsSection = wrapper.id;
    button.setAttribute("aria-controls", wrapper.id);

    if (!headingState.has(key)) {
      const autoFold = currentTheme === "its" && settings.autoFold;
      headingState.set(key, autoFold && level >= settings.autoFoldLevel);
    }
    applyHeadingState(button, wrapper, headingState.get(key));
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

function getHeadingFoldEntries(pane) {
  const entries = [];
  for (const heading of pane.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
    const button = heading.querySelector(":scope > .its-heading-fold");
    if (button === null || !button.dataset.itsSection) {
      continue;
    }
    const wrapper = document.getElementById(button.dataset.itsSection);
    if (wrapper === null) {
      continue;
    }
    entries.push({
      level: headingLevel(heading),
      button,
      wrapper,
      key: button.dataset.itsKey,
    });
  }
  return entries;
}

function isElementVisible(element) {
  if (element === null || !element.isConnected) {
    return false;
  }
  const style = getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }
  return element.getClientRects().length > 0;
}

function visiblePreviewPane() {
  const pane = previewPane && previewPane.isConnected ? previewPane : findPane();
  return pane !== null && isElementVisible(pane) ? pane : null;
}

function visibleEditorView() {
  if (cmFold === null) {
    return null;
  }
  try {
    const view = MarkEdit.editorView;
    if (view && view.state && view.dispatch && isElementVisible(view.dom)) {
      return view;
    }
  } catch {
    // No editor in this host.
  }
  return null;
}

function activeFoldTarget() {
  const pane = visiblePreviewPane();
  if (pane !== null) {
    return { kind: "preview", pane };
  }
  const view = visibleEditorView();
  if (view !== null) {
    return { kind: "editor", view };
  }
  return null;
}

function headingFoldState(mode) {
  const target = activeFoldTarget();
  if (target === null) {
    return { isEnabled: false };
  }
  if (target.kind === "preview") {
    return previewHeadingFoldState(target.pane, mode);
  }
  return editorHeadingFoldState(target.view, mode);
}

function applyHeadingFold(mode) {
  const target = activeFoldTarget();
  if (target === null) {
    return;
  }
  if (target.kind === "preview") {
    applyPreviewHeadingFold(target.pane, mode);
  } else {
    applyEditorHeadingFold(target.view, mode);
  }
}

function sectionEffectivelyHidden(wrapper) {
  return wrapper.closest(".its-section-content[hidden]") !== null;
}

function previewHeadingFoldState(pane, mode) {
  const entries = getHeadingFoldEntries(pane);
  if (entries.length === 0) {
    return { isEnabled: false };
  }

  let isSelected = false;
  if (mode === 0) {
    isSelected = entries.every((entry) => sectionEffectivelyHidden(entry.wrapper));
  } else if (mode === -1) {
    isSelected = entries.every((entry) => !sectionEffectivelyHidden(entry.wrapper));
  } else {
    const target = entries.filter((entry) => entry.level >= mode);
    if (target.length === 0) {
      return { isEnabled: false };
    }
    isSelected = target.every((entry) => sectionEffectivelyHidden(entry.wrapper))
      && entries.filter((entry) => entry.level < mode)
        .every((entry) => !sectionEffectivelyHidden(entry.wrapper));
  }

  return { isEnabled: true, isSelected };
}

function applyPreviewHeadingFold(pane, mode) {
  const entries = getHeadingFoldEntries(pane);
  entries.forEach(({ level, button, wrapper, key }) => {
    const collapsed = mode === 0 ? true : mode === -1 ? false : level >= mode;
    applyHeadingState(button, wrapper, collapsed);
    if (key) {
      headingState.set(key, collapsed);
    }
  });
}

function editorHeadingLevel(name) {
  const match = /^(?:ATX|Setext)Heading([1-6])$/.exec(name);
  return match === null ? null : Number(match[1]);
}

function getEditorFoldSnapshot(view) {
  if (cmFold === null) {
    return null;
  }
  if (editorSnapshot !== null
    && editorSnapshotState === view.state
    && editorSnapshotView === view) {
    return editorSnapshot;
  }

  let entries = [];
  const folded = new Map();
  try {
    const state = view.state;
    if (!state.field(cmFold.foldState, false)) {
      return null;
    }

    const tree = cmFold.ensureSyntaxTree
      ? cmFold.ensureSyntaxTree(state, state.doc.length, 250) || cmFold.syntaxTree(state)
      : cmFold.syntaxTree(state);
    const seen = new Set();
    tree.iterate({
      enter(node) {
        const level = editorHeadingLevel(node.name);
        if (level === null) {
          return;
        }
        const line = state.doc.lineAt(node.from);
        const fold = cmFold.foldable(state, line.from, line.to);
        if (fold === null || fold.to <= fold.from || seen.has(fold.from)) {
          return;
        }
        seen.add(fold.from);
        entries.push({ level, lineFrom: line.from, lineTo: line.to, fold });
      },
    });
    entries.sort((a, b) => a.fold.from - b.fold.from);

    const foldedSet = cmFold.foldedRanges(state);
    if (foldedSet) {
      foldedSet.between(0, state.doc.length, (from, to) => {
        folded.set(from, to);
      });
    }
  } catch (error) {
    console.debug("[MarkEdit Theme Pack] source fold scan failed", error);
    entries = [];
  }

  editorSnapshotState = view.state;
  editorSnapshotView = view;
  editorSnapshot = { entries, folded };
  return editorSnapshot;
}

function desiredEditorFolds(entries, mode) {
  if (mode === -1) {
    return [];
  }
  // 全部折叠 folds every heading level (nested folds), so unfolding one level
  // reveals the next level still collapsed. Hx does the same for Hx and deeper.
  if (mode === 0) {
    return entries;
  }
  return entries.filter((entry) => entry.level >= mode);
}

function editorHeadingFoldState(view, mode) {
  const snapshot = getEditorFoldSnapshot(view);
  if (snapshot === null || snapshot.entries.length === 0) {
    return { isEnabled: false };
  }
  if (mode > 0 && !snapshot.entries.some((entry) => entry.level >= mode)) {
    return { isEnabled: false };
  }

  const headingStarts = new Set(snapshot.entries.map((entry) => entry.fold.from));
  const current = new Set(
    [...snapshot.folded.keys()].filter((from) => headingStarts.has(from))
  );
  const desired = new Set(
    desiredEditorFolds(snapshot.entries, mode).map((entry) => entry.fold.from)
  );
  const isSelected = current.size === desired.size
    && [...current].every((from) => desired.has(from));
  return { isEnabled: true, isSelected };
}

function applyEditorHeadingFold(view, mode) {
  const snapshot = getEditorFoldSnapshot(view);
  if (snapshot === null || snapshot.entries.length === 0) {
    return;
  }

  const desired = new Map(
    desiredEditorFolds(snapshot.entries, mode).map((entry) => [entry.fold.from, entry.fold])
  );
  const headingStarts = new Set(snapshot.entries.map((entry) => entry.fold.from));
  const effects = [];

  for (const [from, to] of snapshot.folded) {
    if (!headingStarts.has(from)) {
      continue;
    }
    const wanted = desired.get(from);
    if (wanted === undefined || wanted.to !== to) {
      effects.push(cmFold.unfoldEffect.of({ from, to }));
    }
  }

  for (const [from, fold] of desired) {
    if (snapshot.folded.get(from) !== fold.to) {
      effects.push(cmFold.foldEffect.of(fold));
    }
  }

  if (effects.length > 0) {
    view.dispatch({ effects });
  }
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

function resetDecorations(pane) {
  pane.querySelectorAll("." + MARKER_CLASS).forEach((node) => node.remove());
  pane.querySelectorAll(".its-fold").forEach((node) => node.remove());

  pane.querySelectorAll(".its-section-content").forEach((wrapper) => {
    const parent = wrapper.parentNode;
    if (parent === null) {
      return;
    }
    while (wrapper.firstChild !== null) {
      parent.insertBefore(wrapper.firstChild, wrapper);
    }
    wrapper.remove();
  });

  pane.querySelectorAll("ul.its-nested-list").forEach((node) => {
    node.classList.remove("its-nested-list");
  });
  pane.querySelectorAll("li.is-collapsed").forEach((node) => {
    node.classList.remove("is-collapsed");
  });
  pane.querySelectorAll(".is-branch, .is-hovered").forEach((node) => {
    node.classList.remove("is-branch", "is-hovered");
  });
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

function handlePointerOver(event) {
  if (!(event.target instanceof Element)) {
    return;
  }

  if (!currentTheme.startsWith("maple")) {
    clearBranch();
    return;
  }

  const item = event.target.closest("li");
  if (item === null) {
    clearBranch();
    return;
  }
  if (item === currentBranch) {
    return;
  }

  activateBranch(item);
}

function clearBranch() {
  currentBranch = null;
  const pane = previewPane || findPane();
  if (pane === null) {
    return;
  }
  pane.querySelectorAll(".is-branch, .is-hovered").forEach((node) => {
    node.classList.remove("is-branch", "is-hovered");
  });
}

function activateBranch(item) {
  clearBranch();
  const pane = previewPane || findPane();
  if (pane === null || item === null) {
    return;
  }

  currentBranch = item;
  item.classList.add("is-branch", "is-hovered");

  let node = item.parentElement;
  while (node !== null && node !== pane) {
    if (node.tagName === "LI") {
      node.classList.add("is-branch");
    }
    node = node.parentElement;
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
    const base = getDocumentsPath();
    if (base === undefined || typeof MarkEdit.createFile !== "function") {
      return;
    }

    const firstList = pane.querySelector("ul");
    const firstItem = firstList ? firstList.querySelector("li") : null;
    const firstCheckbox = pane.querySelector(".task-list-item-checkbox");
    const firstTaskLabel = firstCheckbox ? firstCheckbox.closest("label") : null;
    const checkboxRect = firstCheckbox ? firstCheckbox.getBoundingClientRect() : null;
    const labelRect = firstTaskLabel ? firstTaskLabel.getBoundingClientRect() : null;
    const marker = firstItem ? getComputedStyle(firstItem, "::before") : null;
    const braceItem = pane.querySelector("li");
    const brace = braceItem ? getComputedStyle(braceItem, "::after") : null;
    const h1 = pane.querySelector("h1");
    const h1Style = h1 ? getComputedStyle(h1) : null;
    const h1After = h1 ? getComputedStyle(h1, "::after") : null;
    const listStyle = firstList ? getComputedStyle(firstList) : null;

    const data = {
      plugin: "markedit-theme-pack",
      version: VERSION,
      theme: currentTheme,
      themes: THEMES.map((theme) => theme.id),
      previewMode: pane.classList.contains("overlay") ? "preview" : "other",
      surface: document.body.getAttribute(SURFACE_ATTR),
      pane: {
        position: getComputedStyle(pane).position,
        display: getComputedStyle(pane).display,
        inset: getComputedStyle(pane).inset,
        background: getComputedStyle(pane).backgroundColor,
        color: getComputedStyle(pane).color,
        padding: getComputedStyle(pane).padding,
        dataTheme: pane.getAttribute(THEME_ATTR),
      },
      headingCount: pane.querySelectorAll("h1, h2, h3, h4, h5, h6").length,
      sectionCount: pane.querySelectorAll(".its-section-content").length,
      listFoldCount: pane.querySelectorAll("li > .its-list-fold").length,
      headingFoldCount: pane.querySelectorAll("h1 > .its-heading-fold, h2 > .its-heading-fold, h3 > .its-heading-fold, h4 > .its-heading-fold, h5 > .its-heading-fold, h6 > .its-heading-fold").length,
      collapsedLists: pane.querySelectorAll("li.is-collapsed").length,
      h1: h1Style ? {
        fontFamily: h1Style.fontFamily,
        color: h1Style.color,
        borderBottom: h1Style.borderBottomWidth,
        afterContent: h1After ? h1After.content : null,
        afterWidth: h1After ? h1After.width : null,
      } : null,
      list: listStyle ? {
        paddingLeft: listStyle.paddingLeft,
        listStyle: listStyle.listStyleType,
      } : null,
      marker: marker ? {
        width: marker.width,
        height: marker.height,
        background: marker.backgroundColor,
        border: marker.borderTopWidth,
        borderRadius: marker.borderRadius,
        left: marker.left,
        top: marker.top,
      } : null,
      brace: brace ? {
        borderLeft: brace.borderLeftWidth,
        borderTop: brace.borderTopWidth,
        borderColor: brace.borderTopColor,
        borderRadius: brace.borderRadius,
        left: brace.left,
        width: brace.width,
      } : null,
      taskCheckbox: checkboxRect && labelRect ? {
        centerDeltaY: Math.round((checkboxRect.top + checkboxRect.height / 2 - (labelRect.top + labelRect.height / 2)) * 100) / 100,
        top: getComputedStyle(firstCheckbox).top,
        left: getComputedStyle(firstCheckbox).left,
        width: getComputedStyle(firstCheckbox).width,
        height: getComputedStyle(firstCheckbox).height,
      } : null,
      headingState: [...headingState.entries()],
      listState: [...listState.entries()],
    };

    const path = base.replace(/\/$/, "") + "/debug/theme-pack-debug.json";
    await MarkEdit.createFile({
      path,
      string: JSON.stringify(data, null, 2),
      overwrites: true,
    });
  } catch (error) {
    console.error("[MarkEdit Theme Pack] debug write failed", error);
  }
}
