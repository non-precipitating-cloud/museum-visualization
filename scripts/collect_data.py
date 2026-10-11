#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
collect_data.py — 数据来源核验与留证（Phase 3-7）

职责：
  1. 读取 data/metadata/source_registry.csv（人工登记的官方来源清单）
  2. 逐个访问来源 URL，记录 HTTP 状态、内容长度、抓取时间
  3. 将页面快照保存到 data/raw/_cache/<source_id>.<html|pdf> 作为留证
  4. 输出 data/metadata/source_verification.csv —— 每一行都是**程序实际探测的结果**

重要：本脚本**不生成任何业务数据**。所有业务数值均来自人工从官方页面
     逐条转录到 data/raw/ 的原始文件，本脚本只负责核验来源链接是否真实可访问。

用法：
    python scripts/collect_data.py             # 核验 + 留证
    python scripts/collect_data.py --no-cache  # 只核验，不保存快照
"""
from __future__ import annotations

import argparse
import csv
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src import config as C  # noqa: E402

CACHE = C.RAW / "_cache"
REGISTRY = C.METADATA / "source_registry.csv"
REPORT = C.METADATA / "source_verification.csv"

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
TIMEOUT = 45


def fetch(url: str, attempts: int = 5):
    """返回 (http_code, content_bytes, error)。

    带重试的原因：本机网络对部分境外站点（UNESCO、IMLS、TEA/AECOM 等）的
    TLS 握手会**偶发**中断（curl 返回 HTTP 000 / schannel handshake failed），
    或对方返回 429 限流。这两种情况重试若干次通常即可成功。
    """
    import time

    last = ""
    for i in range(attempts):
        if i:
            time.sleep(2.0 * i)          # 递增退避：429 限流与 TLS 偶发中断都需要等一下
        proc = subprocess.run(
            ["curl", "-sSL", "--max-time", str(TIMEOUT), "-A", UA,
             "-w", "\n__HTTP_CODE__%{http_code}", "-o", "-", url],
            capture_output=True,
        )
        out = proc.stdout
        marker = b"\n__HTTP_CODE__"
        if marker in out:
            body, _, code = out.rpartition(marker)
            code_s = code.decode("ascii", "ignore").strip()
            if code_s.startswith("2"):
                return int(code_s), body, ""
            last = f"HTTP {code_s}"
        else:
            last = proc.stderr.decode("utf-8", "ignore").strip()[:160] or f"exit={proc.returncode}"
    return 0, b"", last


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-cache", action="store_true", help="不保存页面快照")
    args = ap.parse_args()

    if not REGISTRY.exists():
        sys.exit(f"缺少来源登记表：{REGISTRY}")

    with REGISTRY.open(encoding="utf-8-sig", newline="") as fh:
        rows = list(csv.DictReader(fh))

    CACHE.mkdir(parents=True, exist_ok=True)
    results = []
    ok = fail = 0

    print(f"开始核验 {len(rows)} 条来源 ……\n")
    for i, row in enumerate(rows, 1):
        sid = row["source_id"]
        url = row["source_url"]
        code, body, err = fetch(url)
        status = "OK" if code and body else "FAIL"
        if status == "OK":
            ok += 1
        else:
            fail += 1

        saved = ""
        if status == "OK" and not args.no_cache:
            ext = "pdf" if url.lower().endswith(".pdf") else "html"
            p = CACHE / f"{sid}.{ext}"
            p.write_bytes(body)
            saved = str(p.relative_to(ROOT))

        print(f"[{i:>2}/{len(rows)}] {status:<4} {sid:<16} "
              f"{code or '-':>4} {len(body):>8,}B  {row['source_organization']}")

        results.append({
            "source_id": sid,
            "source_organization": row["source_organization"],
            "source_title": row["source_title"],
            "source_url": url,
            "verify_status": status,
            "http_status": code or "",
            "content_bytes": len(body),
            "verified_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ"),
            "snapshot_path": saved,
            "error": err,
        })

    with REPORT.open("w", encoding="utf-8-sig", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(results[0].keys()))
        w.writeheader()
        w.writerows(results)

    print(f"\n{'=' * 56}")
    print(f"来源核验完成：可访问 {ok} 条，不可访问 {fail} 条")
    print(f"核验结果：{REPORT.relative_to(ROOT)}")
    if not args.no_cache:
        print(f"页面快照：{CACHE.relative_to(ROOT)}/")
    print("=" * 56)
    print("\n提示：不可访问的来源不会影响已转录的原始数据，但需在文档中如实说明。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
