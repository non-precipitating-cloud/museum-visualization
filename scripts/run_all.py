#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
run_all.py — 一键跑通全流程（Phase 8—10、26）

按依赖顺序执行：资源准备 → 来源核验 → 清洗 → 构建 → 前端数据 → 数据字典 → 审计。

用法：
    python scripts/run_all.py               # 全流程（含联网核验来源）
    python scripts/run_all.py --offline     # 跳过联网步骤（资源与来源核验）
    python scripts/run_all.py --skip-audit  # 跳过审计
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "scripts"

STEPS = [
    ("prepare_assets.py", "准备前端资源", "下载并本地化 ECharts 与中国省级边界 GeoJSON", True),
    ("collect_data.py", "核验数据来源", "逐条访问来源 URL、记录状态并留证页面快照", True),
    ("clean_data.py", "清洗数据", "raw → clean：省份名统一、类型转换、去重", False),
    ("build_dataset.py", "构建分析数据集", "clean → processed：合并 + 派生指标 + KPI 同比", False),
    ("build_web_data.py", "生成前端数据", "processed → web/data/museum-data.js", False),
    ("build_dictionary.py", "生成数据字典", "data/metadata/data_dictionary.xlsx", False),
    ("data_audit.py", "数据审计", "统计 + 质量检查 + 交叉核对 → 审计报告", False),
    ("analyze.py", "生成分析结论", "docs/analysis_findings.md（所有结论由程序计算）", False),
    ("build_docs.py", "生成来源与处理文档", "docs/data_sources.md、docs/data_processing.md", False),
]


def run(script: str) -> tuple[bool, float, str]:
    t0 = time.time()
    proc = subprocess.run(
        [sys.executable, str(SCRIPTS / script)],
        capture_output=True, cwd=str(ROOT),
        env={**__import__("os").environ, "PYTHONIOENCODING": "utf-8"},
    )
    dt = time.time() - t0
    out = (proc.stdout.decode("utf-8", "ignore") + proc.stderr.decode("utf-8", "ignore")).strip()
    return proc.returncode == 0, dt, out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--offline", action="store_true", help="跳过需要联网的步骤")
    ap.add_argument("--skip-audit", action="store_true", help="跳过数据审计")
    args = ap.parse_args()

    print("=" * 70)
    print("《中国博物馆文化资源与公共文化服务的多维可视化分析》")
    print("数据流水线 · 全流程执行")
    print("=" * 70)
    print(f"项目目录：{ROOT}")
    print()

    ok_count = skip_count = fail_count = 0
    failures = []

    for i, (script, name, desc, needs_net) in enumerate(STEPS, 1):
        if args.offline and needs_net:
            print(f"[{i}/{len(STEPS)}] {name:<14} —— 跳过（--offline）")
            skip_count += 1
            continue
        if args.skip_audit and script == "data_audit.py":
            print(f"[{i}/{len(STEPS)}] {name:<14} —— 跳过（--skip-audit）")
            skip_count += 1
            continue

        print(f"[{i}/{len(STEPS)}] {name:<14} {desc}")
        ok, dt, out = run(script)
        tail = "\n".join(out.splitlines()[-6:]) if out else ""
        if ok:
            ok_count += 1
            print(f"        ✓ 完成（{dt:.1f}s）")
        else:
            fail_count += 1
            failures.append((script, out))
            print(f"        ✗ 失败（{dt:.1f}s）")
        if tail:
            for line in tail.splitlines():
                print(f"        │ {line}")
        print()

    print("=" * 70)
    print(f"执行完毕：成功 {ok_count} · 失败 {fail_count} · 跳过 {skip_count}")
    print("=" * 70)

    if failures:
        print("\n失败详情：")
        for script, out in failures:
            print(f"\n--- {script} ---")
            print("\n".join(out.splitlines()[-25:]))
        return 1

    print("\n下一步：双击打开 web/index.html 查看可视化大屏（无需启动服务）。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
