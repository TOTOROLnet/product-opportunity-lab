#!/usr/bin/env python3
"""Validate consumer-track daily output (separate from B2B demo loop).

Usage:
  python3 scripts/validate_consumer_output.py --date latest
  python3 scripts/validate_consumer_output.py --date 2026-07-07
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
VALID_STATUS = {"OK", "PARTIAL"}


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

    require("consumer-run-log.md")
    status_path = day_dir / "consumer-status.json"
    if not status_path.exists():
        errors.append("missing: consumer-status.json")
        return False, errors

    try:
        status = json.loads(status_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"consumer-status.json not valid JSON: {exc}")
        return False, errors

    st = status.get("status")
    if st not in VALID_STATUS:
        errors.append(f"consumer-status.json.status must be one of {sorted(VALID_STATUS)}, got: {st!r}")

    reason = status.get("reason", "")
    if reason == "no-input":
        require("consumer-insufficient-input.md")
    else:
        require("consumer-opportunity.md")
        require("consumer-source-report.md")

    if status.get("track") != "consumer":
        errors.append("consumer-status.json.track should be 'consumer'")

    return len(errors) == 0, errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate consumer-track daily output.")
    parser.add_argument("--date", default="latest", help="'latest' or YYYY-MM-DD.")
    parser.add_argument("--base", default=str(DEFAULT_BASE), help="Base daily/ dir.")
    args = parser.parse_args()

    base = Path(args.base).expanduser().resolve()
    if not base.is_dir():
        print(f"[validate-consumer] base dir not found: {base}", file=sys.stderr)
        return 2

    day_dir = _resolve_date_dir(base, args.date)
    if day_dir is None:
        print(f"[validate-consumer] no matching day dir for --date {args.date}", file=sys.stderr)
        return 2

    ok, errors = _check(day_dir)
    if ok:
        print(f"[validate-consumer] OK: {day_dir.name} consumer output is complete.")
        return 0

    print(f"[validate-consumer] FAILED: {day_dir.name}:")
    for e in errors:
        print(f"  - {e}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
