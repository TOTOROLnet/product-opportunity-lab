#!/usr/bin/env python3
"""Validate that a daily/<date>/ output folder is complete and consistent.

Required files depend on status.json.status:
- always: status.json (parseable, status in {PASS,PARTIAL,FAIL}), run-log.md
- PASS:    opportunity.md, demo-spec.md, evaluation.md, demo/package.json
- PARTIAL(below-threshold): opportunity.md
- PARTIAL(no-input):        insufficient-input.md

Usage:
  python3 scripts/validate_daily_output.py --date latest
  python3 scripts/validate_daily_output.py --date 2026-07-02
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASE = REPO_ROOT / "daily"
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
VALID_STATUS = {"PASS", "PARTIAL", "FAIL"}


def _resolve_date_dir(base: Path, date: str) -> Path | None:
    if date == "latest":
        dirs = [p for p in base.iterdir() if p.is_dir() and DATE_RE.match(p.name)]
        if not dirs:
            return None
        return sorted(dirs, key=lambda p: p.name, reverse=True)[0]
    candidate = base / date
    return candidate if candidate.is_dir() else None


def _check(day_dir: Path) -> tuple[bool, list[str]]:
    errors: list[str] = []

    def require(rel: str) -> None:
        p = day_dir / rel
        if not p.exists():
            errors.append(f"missing: {rel}")
        elif p.is_file() and p.stat().st_size == 0:
            errors.append(f"empty: {rel}")

    # Always required
    require("run-log.md")
    status_path = day_dir / "status.json"
    if not status_path.exists():
        errors.append("missing: status.json")
        return False, errors

    try:
        status = json.loads(status_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"status.json not valid JSON: {exc}")
        return False, errors

    st = status.get("status")
    if st not in VALID_STATUS:
        errors.append(f"status.json.status must be one of {sorted(VALID_STATUS)}, got: {st!r}")
    reason = status.get("reason", "")

    if st == "PASS":
        for rel in ("opportunity.md", "demo-spec.md", "evaluation.md"):
            require(rel)
        pkg = day_dir / "demo" / "package.json"
        if not pkg.exists():
            errors.append("missing: demo/package.json (PASS requires a demo)")
    elif st == "FAIL":
        require("opportunity.md")
        # FAIL keeps failed artifacts; run-log must explain (checked above for existence).
    elif st == "PARTIAL":
        if reason == "no-input":
            require("insufficient-input.md")
        else:  # below-threshold or other partial
            require("opportunity.md")

    return len(errors) == 0, errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate a daily/<date>/ output folder.")
    parser.add_argument("--date", default="latest", help="'latest' or a YYYY-MM-DD date.")
    parser.add_argument("--base", default=str(DEFAULT_BASE), help="Base daily/ dir.")
    args = parser.parse_args()

    base = Path(args.base).expanduser().resolve()
    if not base.is_dir():
        print(f"[validate] base dir not found: {base}", file=sys.stderr)
        return 2

    day_dir = _resolve_date_dir(base, args.date)
    if day_dir is None:
        print(f"[validate] no matching day dir for --date {args.date} under {base}", file=sys.stderr)
        return 2

    ok, errors = _check(day_dir)
    if ok:
        print(f"[validate] OK: {day_dir.name} output is complete.")
        return 0

    print(f"[validate] FAILED: {day_dir.name} has issues:")
    for e in errors:
        print(f"  - {e}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
