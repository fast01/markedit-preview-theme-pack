#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src/its/markedit-theme-its-preview.js"
DOCS="$HOME/Library/Containers/app.cyan.markedit/Data/Documents"
DEST_DIR="$DOCS/scripts"
DEST="$DEST_DIR/markedit-theme-its-preview.js"
EXT="$DOCS/extensions.json"

if [[ "${1:-}" != "--force" ]]; then
  echo "Legacy standalone ITS installer (archived)." >&2
  echo "The unified theme pack already includes ITS; running both causes duplicate ITS CSS." >&2
  echo "Use scripts/install-theme-pack.sh instead, or re-run with --force." >&2
  exit 1
fi

if [[ ! -f "$SRC" ]]; then
  echo "source not found: $SRC" >&2
  exit 1
fi

if [[ ! -d "$DEST_DIR" ]]; then
  echo "MarkEdit scripts directory not found: $DEST_DIR" >&2
  exit 1
fi

# Parse the plugin as a function body, matching MarkEdit's (MarkEdit, require) wrapper.
if command -v node >/dev/null 2>&1; then
  node -e 'const fs = require("fs"); new Function("MarkEdit", "require", fs.readFileSync(process.argv[1], "utf8"));' "$SRC"
  echo "syntax: ok"
else
  echo "node not found; skipping syntax check"
fi

if [[ -f "$EXT" ]]; then
  BACKUP="/tmp/extensions.json.before-its-preview.$(date +%Y%m%d-%H%M%S)"
  cp "$EXT" "$BACKUP"
  echo "backup: $BACKUP"
fi

cp "$SRC" "$DEST"

python3 - "$EXT" "$DEST" <<'PY'
import datetime
import hashlib
import json
import sys
from pathlib import Path

ext_path = Path(sys.argv[1])
plugin_path = Path(sys.argv[2])
entry_id = "markedit-theme-its-preview"
file_name = "markedit-theme-its-preview.js"
sha = hashlib.sha256(plugin_path.read_bytes()).hexdigest()
now = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

data = json.loads(ext_path.read_text()) if ext_path.exists() else {"installed": []}
installed = data.get("installed") or []
entry = next((item for item in installed if item.get("id") == entry_id), None)

if entry is None:
    entry = {
        "id": entry_id,
        "file": file_name,
        "version": "0.1.0",
        "installDate": now,
        "enabled": True,
    }
    installed.append(entry)

entry["file"] = file_name
entry["sha256"] = sha
entry["enabled"] = True
entry.setdefault("version", "0.1.0")
data["installed"] = installed
ext_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

print(f"installed: {plugin_path}")
print(f"sha256: {sha}")
PY

echo "done."
echo "Quit/reopen MarkEdit (or close/reopen the document) to load the new script."
