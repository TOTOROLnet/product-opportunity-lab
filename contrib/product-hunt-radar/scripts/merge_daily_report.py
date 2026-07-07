#!/usr/bin/env python3
"""Merge B2B + 2C partials into one daily report for downstream lab.

Two independent Agent runs write:
  reports/partials/b2b-YYYY-MM-DD.md
  reports/partials/consumer-YYYY-MM-DD.md

This script produces the single canonical file:
  reports/YYYY-MM-DD.md

Lab pulls only reports/YYYY-MM-DD.md; B2B / 2C loops read different sections.
"""

from __future__ import annotations

import argparse
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
PARTIALS = REPO_ROOT / "reports" / "partials"
REPORTS = REPO_ROOT / "reports"
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

TRACK_A = "## Track A：B2B / 基础设施 / AI 产品经理"
TRACK_B = "## Track B：2C 消费应用观察"

PLACEHOLDER_B = """> 2C 独立 Agent 尚未产出当日 partial。请由 2C Automation 运行后再次执行本合并脚本。"""

PLACEHOLDER_A = """> B2B 独立 Agent 尚未产出当日 partial。"""


def _beijing_today() -> str:
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz).strftime("%Y-%m-%d")


def _read_partial(path: Path) -> str | None:
    if not path.is_file():
        return None
    text = path.read_text(encoding="utf-8").strip()
    return text or None


def _extract_data_source(*parts: str | None) -> str:
    for part in parts:
        if not part:
            continue
        idx = part.find("## 数据源与限制")
        if idx >= 0:
            return part[idx:].strip()
    return (
        "## 数据源与限制\n\n"
        "主数据源为 Product Hunt RSS（`scripts/fetch_producthunt.py`）。"
        "Track A 与 Track B 由两次独立 Agent 任务生成后合并；未核实的信息已在各轨正文中标注。"
    )


def _strip_data_source(body: str) -> str:
    idx = body.find("## 数据源与限制")
    if idx >= 0:
        return body[:idx].strip()
    return body.strip()


def merge(date: str) -> Path:
    if not DATE_RE.match(date):
        raise ValueError(f"invalid date: {date}")

    b2b = _read_partial(PARTIALS / f"b2b-{date}.md")
    consumer = _read_partial(PARTIALS / f"consumer-{date}.md")

    b2b_body = _strip_data_source(b2b) if b2b else PLACEHOLDER_A
    consumer_body = _strip_data_source(consumer) if consumer else PLACEHOLDER_B
    data_section = _extract_data_source(b2b, consumer)

    doc = f"""# Product Hunt 新品监测报告 - {date}

> 本报告由**两次独立 Agent 任务**（Track A B2B、Track B 2C）分别推理后，由 `scripts/merge_daily_report.py` 合并为**单一文件**，供 product-opportunity-lab 一次拉取、分节消费。

---

{TRACK_A}

{b2b_body}

---

{TRACK_B}

{consumer_body}

---

{data_section}
"""
    REPORTS.mkdir(parents=True, exist_ok=True)
    out = REPORTS / f"{date}.md"
    out.write_text(doc, encoding="utf-8")
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="Merge B2B + 2C partials into reports/YYYY-MM-DD.md")
    parser.add_argument("--date", default=_beijing_today(), help="Beijing date YYYY-MM-DD")
    args = parser.parse_args()
    out = merge(args.date)
    print(f"Merged report → {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
