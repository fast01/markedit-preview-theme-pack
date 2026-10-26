#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DOCS="$HOME/Library/Containers/app.cyan.markedit/Data/Documents"
SCRIPTS="$DOCS/scripts"
TARGET="$SCRIPTS/markedit-theme-pack.js"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="/tmp/markedit-theme-pack-backup-$STAMP"

if [ ! -d "$SCRIPTS" ]; then
  echo "MarkEdit scripts directory not found: $SCRIPTS" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
cp "$DOCS/extensions.json" "$BACKUP_DIR/extensions.json"
cp "$DOCS/settings.json" "$BACKUP_DIR/settings.json"
if [ -f "$SCRIPTS/markedit-theme-its-preview.js" ]; then
  cp "$SCRIPTS/markedit-theme-its-preview.js" "$BACKUP_DIR/markedit-theme-its-preview.js"
fi

echo "Building theme pack..."
node scripts/build-theme-pack.js

echo "Installing $TARGET ..."
cp dist/markedit-theme-pack.js "$TARGET"

if [ -f "$SCRIPTS/markedit-theme-its-preview.js" ]; then
  /bin/rm -f "$SCRIPTS/markedit-theme-its-preview.js"
  echo "Removed legacy scripts/markedit-theme-its-preview.js (backed up)"
fi

HASH="$(shasum -a 256 "$TARGET" | awk '{print $1}')"
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

python3 - "$DOCS" "$HASH" "$NOW" <<'PY'
import json
import sys

docs, sha, now = sys.argv[1:4]
ext_path = f"{docs}/extensions.json"
settings_path = f"{docs}/settings.json"

with open(ext_path) as fh:
    data = json.load(fh)

installed = data.setdefault("installed", [])

# The pack replaces the standalone ITS plugin, which would fight over .markdown-body.
installed[:] = [entry for entry in installed if entry.get("id") != "markedit-theme-its-preview"]

pack = next((entry for entry in installed if entry.get("id") == "markedit-theme-pack"), None)
if pack is None:
    pack = {"id": "markedit-theme-pack", "installDate": now}
    installed.append(pack)

pack.update(
    {
        "enabled": True,
        "file": "markedit-theme-pack.js",
        "id": "markedit-theme-pack",
        "sha256": sha,
        "version": "1.3.1",
    }
)

with open(ext_path, "w") as fh:
    json.dump(data, fh, ensure_ascii=False, indent=2)
    fh.write("\n")

with open(settings_path) as fh:
    settings = json.load(fh)

key = "extension.markeditThemePack"
defaults = {
    "theme": "its",
    "autoFold": True,
    "autoFoldLevel": 3,
    "listFolding": True,
    "debug": False,
}
if not isinstance(settings.get(key), dict):
    settings[key] = defaults
else:
    for name, value in defaults.items():
        settings[key].setdefault(name, value)

# Register the Fold Levels submenu as a pinnable toolbar item. MarkEdit has no
# extension toolbar API; editor.customToolbarItems with menuName is the official
# way. The user may still need to drag it into the toolbar via Customize Toolbar.
fold_toolbar_item = {
    "title": "折叠层级",
    "icon": "chevron.up.chevron.down",
    "menuName": "折叠层级",
}
toolbar_items = settings.get("editor.customToolbarItems")
if toolbar_items is None:
    settings["editor.customToolbarItems"] = [fold_toolbar_item]
elif isinstance(toolbar_items, list):
    if not any(isinstance(item, dict) and item.get("menuName") == "折叠层级" for item in toolbar_items):
        toolbar_items.append(fold_toolbar_item)

with open(settings_path, "w") as fh:
    json.dump(settings, fh, ensure_ascii=False, indent=2)
    fh.write("\n")

print("extensions.json: markedit-theme-pack enabled, legacy ITS entry removed")
print("settings.json: extension.markeditThemePack ensured; 折叠层级 toolbar item registered")
PY

echo
echo "Backups: $BACKUP_DIR"
echo "SHA-256: $HASH"
echo
echo "Installed. Quit and relaunch MarkEdit, then choose:"
echo "  扩展功能 / Extensions > Preview Theme > ITS | Maple Light | Maple Dark | Obsidianite | Obsidianite Brackets"
