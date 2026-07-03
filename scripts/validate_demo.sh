#!/usr/bin/env bash
# Validate a demo: install deps, build, and run smoke checks on the output.
# Usage: bash scripts/validate_demo.sh daily/<date>/demo
#        bash scripts/validate_demo.sh daily/latest/demo

set -u

DEMO_DIR="${1:-}"
if [ -z "$DEMO_DIR" ]; then
  echo "[validate-demo] usage: bash scripts/validate_demo.sh <demo-dir>" >&2
  exit 2
fi

# Resolve daily/latest/... to the newest dated dir.
case "$DEMO_DIR" in
  daily/latest/*|daily/latest)
    REST="${DEMO_DIR#daily/latest}"
    LATEST="$(ls -1d daily/*/ 2>/dev/null | grep -E 'daily/[0-9]{4}-[0-9]{2}-[0-9]{2}/' | sort | tail -n1)"
    if [ -z "$LATEST" ]; then
      echo "[validate-demo] no dated daily/ dir found for 'latest'" >&2
      exit 2
    fi
    DEMO_DIR="${LATEST%/}${REST}"
    ;;
esac

if [ ! -d "$DEMO_DIR" ]; then
  echo "[validate-demo] demo dir not found: $DEMO_DIR" >&2
  exit 2
fi

echo "[validate-demo] target: $DEMO_DIR"

if [ ! -f "$DEMO_DIR/package.json" ]; then
  echo "[validate-demo] FAIL: missing package.json" >&2
  exit 1
fi
if [ ! -f "$DEMO_DIR/README.md" ]; then
  echo "[validate-demo] FAIL: missing README.md" >&2
  exit 1
fi

cd "$DEMO_DIR" || exit 2

echo "[validate-demo] npm install ..."
if [ -f package-lock.json ]; then
  npm ci || npm install || { echo "[validate-demo] FAIL: npm install failed" >&2; exit 1; }
else
  npm install || { echo "[validate-demo] FAIL: npm install failed" >&2; exit 1; }
fi

echo "[validate-demo] npm run build ..."
npm run build || { echo "[validate-demo] FAIL: npm run build failed" >&2; exit 1; }

# Smoke checks on dist/
if [ ! -f dist/index.html ]; then
  echo "[validate-demo] FAIL: dist/index.html not produced" >&2
  exit 1
fi
if [ ! -s dist/index.html ]; then
  echo "[validate-demo] FAIL: dist/index.html is empty" >&2
  exit 1
fi
if ! grep -q 'id="root"' dist/index.html; then
  echo "[validate-demo] WARN: dist/index.html has no id=\"root\" mount node"
fi

JS_COUNT="$(ls -1 dist/assets/*.js 2>/dev/null | wc -l | tr -d ' ')"
if [ "${JS_COUNT:-0}" -lt 1 ]; then
  echo "[validate-demo] FAIL: no JS bundle in dist/assets" >&2
  exit 1
fi

echo "[validate-demo] OK: build succeeded and smoke checks passed ($JS_COUNT JS bundle(s))."
exit 0
