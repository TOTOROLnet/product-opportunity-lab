#!/usr/bin/env python3
"""Collect the most recent product-hunt-radar report(s) into inputs/.

Radar publishes a **single merged** daily file: reports/YYYY-MM-DD.md
(Track A B2B + Track B 2C, merged by scripts/merge_daily_report.py on radar side).

Lab B2B / 2C Automations both pull this same file; each loop reads its own section.

Never fails when no reports: prints NOTE and returns 0.
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DEST = REPO_ROOT / "inputs" / "product-hunt-reports"
DEFAULT_REPO = "https://github.com/TOTOROLnet/product-hunt-radar"
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _date_reports(reports_dir: Path) -> list[Path]:
    if not reports_dir.is_dir():
        return []
    files = [p for p in reports_dir.glob("*.md") if DATE_RE.match(p.stem)]
    return sorted(files, key=lambda p: p.stem, reverse=True)


def _resolve_source(source: str | None, repo: str) -> tuple[Path, tempfile.TemporaryDirectory | None]:
    if source:
        src = Path(source).expanduser().resolve()
        if not src.is_dir():
            print(f"[collect] --source not found: {src}", file=sys.stderr)
        return src, None

    tmp = tempfile.TemporaryDirectory(prefix="radar-clone-")
    clone_path = Path(tmp.name) / "radar"
    print(f"[collect] shallow cloning {repo} ...")
    result = subprocess.run(
        ["git", "clone", "--depth", "1", "--filter=blob:none", repo, str(clone_path)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"[collect] git clone failed:\n{result.stderr}", file=sys.stderr)
        tmp.cleanup()
        return Path("/nonexistent"), None
    return clone_path / "reports", tmp


def main() -> int:
    parser = argparse.ArgumentParser(description="Collect recent merged radar reports into inputs/.")
    parser.add_argument("--source", help="Local path to a radar reports/ dir.")
    parser.add_argument("--repo", default=DEFAULT_REPO, help="Radar repo URL when --source omitted.")
    parser.add_argument("--days", type=int, default=1, help="Number of most-recent reports (default 1).")
    parser.add_argument("--dest", default=str(DEFAULT_DEST), help="Destination dir.")
    args = parser.parse_args()

    dest = Path(args.dest).expanduser().resolve()
    dest.mkdir(parents=True, exist_ok=True)

    for old in dest.glob("*.md"):
        old.unlink()

    reports_dir, tmp = _resolve_source(args.source, args.repo)
    try:
        reports = _date_reports(reports_dir)
        selected = reports[: max(args.days, 0)]

        if not selected:
            print("[collect] NOTE: no reports found. Loop should write insufficient-input.")
            print(f"[collect] collected 0 report(s) into {dest}")
            return 0

        for src_file in selected:
            shutil.copy2(src_file, dest / src_file.name)
            print(f"[collect] + {src_file.name}")

        print(f"[collect] collected {len(selected)} merged report(s) into {dest}")
        print(f"[collect] latest = {selected[0].name}")
        return 0
    finally:
        if tmp is not None:
            tmp.cleanup()


if __name__ == "__main__":
    raise SystemExit(main())
