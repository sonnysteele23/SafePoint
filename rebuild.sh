#!/usr/bin/env bash
# rebuild.sh — rebuild the clickable preview from dev/ source.
# Run from the SafePoint root: ./rebuild.sh

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/dev"

echo "==> Installing dev dependencies (if needed)…"
[ -d node_modules ] || npm install

echo "==> Building Vite bundle…"
npm run build

echo "==> Inlining JS + CSS into root index.html…"
python3 - "$ROOT" << 'PYEOF'
import re, sys
from pathlib import Path

root = Path(sys.argv[1])
dist = root / "dev" / "dist"

# Find the produced asset files
js_file = next(dist.glob("assets/index-*.js"))
css_file = next(dist.glob("assets/index-*.css"))
dist_html = dist / "index.html"

orig = dist_html.read_text()
js = js_file.read_text()
css = css_file.read_text()

# Replace external script and stylesheet with inline versions
out = re.sub(
    r'<script type="module" crossorigin src="\./assets/[^"]+"></script>',
    lambda m: f'<script type="module">{js}</script>',
    orig,
)
out = re.sub(
    r'<link rel="stylesheet" crossorigin href="\./assets/[^"]+">',
    lambda m: f'<style>{css}</style>',
    out,
)

(root / "index.html").write_text(out)
(root / "favicon.svg").write_bytes((dist / "favicon.svg").read_bytes())
print(f"   index.html: {len(out):,} bytes (was {len(orig):,} before inlining)")
PYEOF

echo ""
echo "==> Done. Open SafePoint/index.html in a browser to preview."
echo "    To publish: cd .. && git add . && git commit -m 'Rebuild' && git push"
