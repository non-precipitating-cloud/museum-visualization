#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
test_pipeline.py — 数据管线自检

检查的是**数据正确性与项目纪律**，不是界面：
  1. 派生指标公式与实现一致（含手工验算的对照值）
  2. 缺测 / 除零 / 比例为 0 的边界情形一律返回 NULL，而不是 0
  3. clean_data 的省份名归一化规则
  4. 所有原始与清洗数据的 CSV 结构（列数）完整，无半角逗号导致的错位
  5. 前端数据文件中不存在 NaN / Infinity（必须是合法 JSON）
  6. 口径纪律：国际数据的两套口径分组没有被混用；provenance 一致
  7. 关键数值与来源可交叉印证（分省合计 vs 全国数）

用法：
    python tests/test_pipeline.py
"""
from __future__ import annotations

import csv
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src import config as C          # noqa: E402
from src import metrics as M         # noqa: E402

PASS, FAIL = 0, 0
FAILURES: list[str] = []


def check(cond, label, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  [PASS] {label}")
    else:
        FAIL += 1
        FAILURES.append(f"{label} —— {detail}")
        print(f"  [FAIL] {label}  {detail}")


def approx(a, b, tol=1e-6):
    if a is None or b is None:
        return False
    if isinstance(a, float) and math.isnan(a):
        return False
    return abs(float(a) - float(b)) <= tol


# ---------------------------------------------------------------- 1. 指标公式
def t_metrics():
    print("\n[1] 派生指标：公式、边界情形")
    # 手工验算：江苏 2022：博物馆 373、藏品 1,984,968、参观 5,425 万人次、人口 8,515 万
    check(approx(M.museums_per_million_population(373, 8515), 373 / 85.15, 1e-9),
          "每百万人博物馆数量 = 373/(8515/100)")
    check(approx(M.visitors_per_million_population(5425, 8515), 5425 / 85.15, 1e-9),
          "每百万人参观人次 = 5425/(8515/100)")
    check(approx(M.average_collections_per_museum(1984968, 373), 1984968 / 373, 1e-9),
          "平均每家博物馆馆藏 = 1984968/373")
    check(approx(M.average_visitors_per_museum(5425, 373), 5425 / 373, 1e-9),
          "平均每家博物馆参观人次 = 5425/373")
    check(approx(M.precious_ratio(100, 1000), 10.0, 1e-9), "珍贵文物比例 = 100/1000 = 10%")

    # 边界：除零必须返回 NULL，不能返回 0
    check(math.isnan(M.museums_per_million_population(373, 0)),
          "人口为 0 → NULL（不是 0）")
    check(math.isnan(M.average_visitors_per_museum(100, 0)),
          "博物馆数为 0 → NULL（不是 0）")
    check(math.isnan(M.precious_ratio(50, 0)), "馆藏为 0 → NULL（不是 0）")
    check(math.isnan(M.visitors_per_exhibition(100, 0)), "展览数为 0 → NULL（不是 0）")
    # 边界：任一字段缺测 → NULL
    check(math.isnan(M.museums_per_million_population(None, 8515)), "分子缺测 → NULL")
    check(math.isnan(M.museums_per_million_population(373, None)), "分母缺测 → NULL")
    check(math.isnan(M.precious_ratio(10, None)), "馆藏缺测 → NULL")
    # 缺测绝不能被当成 0 参与运算
    check(not approx(M.average_visitors_per_museum(None, 10), 0.0),
          "缺测不被当作 0 参与计算")
    # 真实的 0 是有效值：0 件珍贵文物 / 1000 件馆藏 = 0%
    check(approx(M.precious_ratio(0, 1000), 0.0), "真实的 0 保持为 0.0（与缺测区分）")


# ---------------------------------------------------------------- 2. 省份归一化
def t_province_norm():
    print("\n[2] 省份名称归一化")
    sys.path.insert(0, str(ROOT / "scripts"))
    import clean_data as cd  # noqa: E402
    cases = {
        "北京市": "北京", "内蒙古自治区": "内蒙古", "广西壮族自治区": "广西",
        "新疆维吾尔自治区": "新疆", "宁夏回族自治区": "宁夏", "西藏自治区": "西藏",
        "黑龙江省": "黑龙江", "香港特别行政区": "香港", "上海": "上海",
    }
    for raw, want in cases.items():
        got = cd.normalize_province(raw)
        check(got == want, f"'{raw}' → '{want}'", f"实际得到 '{got}'")
    # 数值解析
    check(approx(cd.to_number("1,234.5"), 1234.5), "解析 '1,234.5'")
    check(approx(cd.to_number("12.9亿"), 1.29e9), "解析 '12.9亿'")
    check(approx(cd.to_number("3.0万"), 3.0e4), "解析 '3.0万'")
    check(math.isnan(cd.to_number("暂无数据")), "'暂无数据' 解析为 NaN（不是 0）")
    check(math.isnan(cd.to_number("")), "空串解析为 NaN（不是 0）")


# ---------------------------------------------------------------- 3. CSV 结构
def csv_rows(p: Path):
    """用 csv 模块解析（正确处理带引号的字段）。

    注意：**不能用 line.split(',') 数逗号** —— pandas 写出的 CSV 会给含逗号的
    字段自动加引号，那是合法 CSV；用 split 计数会把它们误判为结构错误。
    """
    lines = [l for l in p.read_text(encoding="utf-8-sig").splitlines()
             if l.strip() and not l.lstrip().startswith("#")]
    if not lines:
        return []
    return list(csv.reader(lines))


def t_csv_structure():
    print("\n[3] CSV 结构完整性（列数一致，防半角逗号错位）")
    bad = []
    n_files = 0
    for p in sorted(C.DATA.rglob("*.csv")):
        if "_cache" in str(p):
            continue
        rows = csv_rows(p)
        if not rows:
            continue
        n_files += 1
        n = len(rows[0])
        for i, r in enumerate(rows[1:], 2):
            if len(r) != n:
                bad.append(f"{p.name}:{i} 期望{n}列实际{len(r)}列")
    check(not bad, f"{n_files} 个 CSV 文件列数全部一致", "; ".join(bad[:5]))
    check(n_files >= 15, f"扫描到足够多的 CSV（{n_files} 个）")

    # 原始数据文件（人工转录）**不允许出现带引号的字段**：
    # 一旦出现，说明转录时把半角逗号写进了文本字段，是潜在的结构隐患。
    quoted = []
    for p in sorted(C.RAW.rglob("*.csv")):
        if "_cache" in str(p):
            continue
        txt = "\n".join(l for l in p.read_text(encoding="utf-8-sig").splitlines()
                        if not l.lstrip().startswith("#"))
        if '"' in txt:
            quoted.append(p.name)
    check(not quoted,
          "原始转录文件不含带引号字段（说明没有半角逗号混入文本列）",
          f"含引号：{quoted}")


# ---------------------------------------------------------------- 4. 前端数据合法
def t_web_data():
    print("\n[4] 前端数据文件合法性")
    p = C.WEB_DATA / "museum-data.js"
    check(p.exists(), "web/data/museum-data.js 存在")
    if not p.exists():
        return
    txt = p.read_text(encoding="utf-8")
    check("window.MUSEUM_DATA" in txt, "包含 window.MUSEUM_DATA 赋值")
    check("NaN" not in txt, "文件中不含 NaN 字面量")
    check("Infinity" not in txt, "文件中不含 Infinity 字面量")
    check("-Infinity" not in txt, "文件中不含 -Infinity 字面量")

    m = re.search(r"window\.MUSEUM_DATA\s*=\s*(\{.*\});\s*$", txt, re.S)
    check(bool(m), "能提取出 JSON 主体")
    if not m:
        return
    try:
        data = json.loads(m.group(1).replace("undefined", "null"))
    except Exception as exc:  # noqa: BLE001
        check(False, "JSON 可解析", str(exc))
        return
    check(True, "JSON 可解析")

    # 关键结构
    check(len(data.get("kpi", [])) >= 5, f"KPI 数量 ≥ 5（实际 {len(data.get('kpi', []))}）")
    prov = data.get("province", {}).get("rows", [])
    check(len(prov) > 0, f"分省记录非空（{len(prov)} 条）")
    years = sorted({r["year"] for r in prov}) if prov else []
    check(len(prov) == len({(r["province"], r["year"]) for r in prov}),
          "分省记录无 (省份,年份) 重复")

    # 缺测必须是 null，不能是 0
    n_null = sum(1 for r in prov if r.get("precious_count") is None)
    check(n_null > 0, f"未获取到的字段以 null 保留（precious_count 有 {n_null} 条 null）")
    zeros = [r for r in prov if r.get("precious_count") == 0]
    check(len(zeros) == 0,
          "未获取到的珍贵文物没有被填成 0",
          f"发现 {len(zeros)} 条被填成 0")

    # 派生指标一致性：随机抽一条手工验算
    ok = True
    for r in prov:
        if (r.get("museum_count") and r.get("population_wan")
                and r.get("museums_per_million_population") is not None):
            want = r["museum_count"] / (r["population_wan"] / 100)
            if abs(want - r["museums_per_million_population"]) > 1e-4:
                ok = False
                break
    check(ok, "前端数据中的每百万人博物馆数量与公式一致")


# ---------------------------------------------------------------- 5. 口径纪律
def t_caliber_discipline():
    print("\n[5] 口径纪律")
    # 全国序列必须两套口径分列，且不互相污染
    nat = C.PROCESSED / "national_yearly.csv"
    if nat.exists():
        import pandas as pd
        df = pd.read_csv(nat, encoding="utf-8-sig")
        cals = set(df["caliber"].unique())
        check(C.CALIBER_REGISTERED in cals and C.CALIBER_MCT in cals,
              "全国序列同时包含两套口径且分列")
        # 备案口径行不应该带文物机构藏品
        reg = df[df["caliber"] == C.CALIBER_REGISTERED]
        check(reg["collections_all_wan"].isna().all(),
              "备案口径行不含文物机构藏品字段（未跨口径填充）")

        # 2021 年两套口径的博物馆数必须不同（说明确实分列而非合并）
        y21 = df[df["year"] == 2021]
        vals = sorted({v for v in y21["museums"].dropna()})
        check(len(vals) == 2,
              f"2021 年两套口径博物馆数各自保留（{vals}）")

    # 国际数据：两组口径不混用
    itl = C.PROCESSED / "international_country.csv"
    if itl.exists():
        import pandas as pd
        df = pd.read_csv(itl, encoding="utf-8-sig")
        g = set(df["caliber_group"].dropna().unique())
        check(g == {"A", "B"}, f"国际数据口径分组为 A/B（实际 {g}）")
        # 同一国家在两组中的数值不应相同（否则说明被复制粘贴）
        dup = 0
        for c in df["country"].unique():
            a = df[(df.country == c) & (df.caliber_group == "A")]["museum_count"].tolist()
            b = df[(df.country == c) & (df.caliber_group == "B")]["museum_count"].tolist()
            if a and b and a[0] == b[0]:
                dup += 1
        check(dup == 0, "同一国家在两套口径下的数值未被复制（差异被保留）")


# ---------------------------------------------------------------- 6. 交叉印证
def t_cross_evidence():
    print("\n[6] 关键数值与来源交叉印证")
    import pandas as pd
    prov = C.PROCESSED / "province_year.csv"
    if not prov.exists():
        check(False, "province_year.csv 存在")
        return
    df = pd.read_csv(prov, encoding="utf-8-sig")
    # 与独立来源交叉印证：
    #   文化和旅游部 2021 年公报：博物馆 5772 个
    #   《中国统计年鉴 2022》表 23-28 全国行：5772 个
    #   本项目分省合计数：5767（差 5，为未分配到省的中央级单位）
    # 这条断言的意义在于：**两个独立来源互相印证了转录的正确性**。
    s21 = int(df[df.year == 2021]["museum_count"].sum())
    check(s21 == 5767, f"2021 年分省合计 = 5767（实际 {s21}）")
    check(abs(s21 - 5772) <= 10,
          f"与独立来源（文旅部公报 & 年鉴全国行 = 5772）差额在已知范围内（差 {5772 - s21}）")

    # 2020 年同样印证：文旅部公报 2020 年博物馆 5452 个
    s20 = int(df[df.year == 2020]["museum_count"].sum())
    check(abs(s20 - 5452) <= 10, f"2020 年分省合计 {s20} 与公报 5452 吻合")
    # 省份数量
    check(df["province"].nunique() == 31, f"覆盖 31 个省级行政区（{df['province'].nunique()}）")
    # 区域映射完整
    missing = [p for p in df["province"].unique() if p not in C.REGION_OF]
    check(not missing, "每个省份都映射到区域", str(missing))
    # 派生指标无除零产生的 0
    bad = df[(df.museum_count == 0) & df["average_visitors_per_museum"].notna()]
    check(len(bad) == 0, "没有因除零而被填成 0 的派生指标")


# ---------------------------------------------------------------- 7. 真实数据底线
def t_no_fabrication():
    print("\n[7] 反虚构数据底线")
    # 每个 raw 文件都必须带 # 说明头（口径说明），这是人工转录的纪律标志
    missing_header = []
    for p in sorted(C.RAW.rglob("*.csv")):
        if "_cache" in str(p):
            continue
        head = p.read_text(encoding="utf-8-sig").splitlines()
        if not head or not head[0].lstrip().startswith("#"):
            missing_header.append(p.name)
    check(not missing_header,
          "全部原始数据文件都带口径说明头（# 注释）",
          f"缺少说明：{missing_header}")

    # 每个经清洗的数据集都必须在来源台账中登记
    reg = C.METADATA / "dataset_registry.csv"
    check(reg.exists(), "数据集台账 dataset_registry.csv 存在")
    if reg.exists():
        with reg.open(encoding="utf-8-sig", newline="") as fh:
            ids = [r["source_ids"] for r in csv.DictReader(fh)]
        check(all(x.strip() for x in ids), "每个数据集都登记了来源 ID")

    # 来源台账里不允许出现示例域名
    sr = C.METADATA / "source_registry.csv"
    if sr.exists():
        txt = sr.read_text(encoding="utf-8-sig")
        for bad in ("example.com", "localhost", "TODO", "待补", "xxx.com", "placeholder"):
            check(bad not in txt, f"来源台账中不含占位符 '{bad}'")

    # 前端数据不得包含"演示/示例/mock/demo"字样
    wd = C.WEB_DATA / "museum-data.js"
    if wd.exists():
        low = wd.read_text(encoding="utf-8").lower()
        for bad in ("mock", "dummy", "sample data", "test only", "演示数据"):
            check(bad not in low, f"前端数据中不含 '{bad}'")


# ---------------------------------------------------------------- main
def main() -> int:
    print("=" * 70)
    print("数据管线自检")
    print("=" * 70)
    for fn in (t_metrics, t_province_norm, t_csv_structure, t_web_data,
               t_caliber_discipline, t_cross_evidence, t_no_fabrication):
        try:
            fn()
        except Exception as exc:  # noqa: BLE001
            check(False, f"{fn.__name__} 执行异常", f"{type(exc).__name__}: {exc}")

    print("\n" + "=" * 70)
    print(f"结果：通过 {PASS} 项，失败 {FAIL} 项")
    print("=" * 70)
    if FAILURES:
        print("\n失败清单：")
        for f in FAILURES:
            print(f"  · {f}")
        return 1
    print("\n全部通过。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
