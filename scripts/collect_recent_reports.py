#!/usr/bin/env python3
"""Collect the most recent product-hunt-radar report(s) into inputs/.

By default it shallow-clones the PUBLIC radar repo at run time (no token needed),
selects the N most recent `reports/YYYY-MM-DD.md` files, and copies them into
`inputs/product-hunt-reports/`. You can also point `--source` at a local reports dir.

Never fails just because there are no reports: it prints a NOTE and returns 0,
so the daily loop can degrade gracefully to `insufficient-input.md`.
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
    """Return report files named YYYY-MM-DD.md, sorted newest first."""
    if not reports_dir.is_dir():
        return []
    files = [p for p in reports_dir.glob("*.md") if DATE_RE.match(p.stem)]
    return sorted(files, key=lambda p: p.stem, reverse=True)


def _resolve_source(source: str | None, repo: str) -> tuple[Path, tempfile.TemporaryDirectory | None]:
    """Resolve a reports directory, cloning the public repo if needed."""
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
    parser = argparse.ArgumentParser(description="Collect recent radar reports into inputs/.")
    parser.add_argument("--source", help="Local path to a radar reports/ dir. If omitted, clone the public repo.")
    parser.add_argument("--repo", default=DEFAULT_REPO, help="Radar repo URL to clone when --source is not given.")
    parser.add_argument("--days", type=int, default=1, help="Number of most-recent reports to collect (default 1).")
    parser.add_argument("--dest", default=str(DEFAULT_DEST), help="Destination dir for collected reports.")
    args = parser.parse_args()

    dest = Path(args.dest).expanduser().resolve()
    dest.mkdir(parents=True, exist_ok=True)

    # Clear previously collected transient reports (keep .gitkeep).
    for old in dest.glob("*.md"):
        old.unlink()

    reports_dir, tmp = _resolve_source(args.source, args.repo)
    try:
        reports = _date_reports(reports_dir)
        selected = reports[: max(args.days, 0)]

        if not selected:
            print("[collect] NOTE: no reports found. The daily loop should write insufficient-input.md.")
            print(f"[collect] collected 0 report(s) into {dest}")
            return 0

        for src_file in selected:
            shutil.copy2(src_file, dest / src_file.name)
            print(f"[collect] + {src_file.name}")

        latest = selected[0].name
        print(f"[collect] collected {len(selected)} report(s) into {dest}")
        print(f"[collect] latest = {latest}")
        return 0
    finally:
        if tmp is not None:
            tmp.cleanup()


if __name__ == "__main__":
    raise SystemExit(main())
