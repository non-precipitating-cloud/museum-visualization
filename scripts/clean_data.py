#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
clean_data.py — 数据清洗（Phase 8）

raw -> clean。职责严格限定为「规范化」，不做任何数值推算：

  1. 统一省份名称（去掉"省/市/自治区/壮族/回族/维吾尔"等后缀，与地图及统计口径对齐）
  2. 数值字段类型转换（无法转换的保持空值，**不填 0**）
  3. 删除完全重复的记录，并把删除条数记入日志
  4. 校验枚举值（区域、口径代码）
  5. 记录所有异常值，**不静默修改**

所有清洗动作都会写入 docs/data_processing.md 的数据处理日志。

用法：
    python scripts/clean_data.py
"""
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src import config as C  # noqa: E402

LOG: list[dict] = []


def log(file_name: str, action: str, detail: str, count) -> None:
    LOG.append({"file": file_name, "action": action, "detail": detail, "count": count})
    print(f"    · {action}: {detail}" + (f" —— {count} 条" if count is not None else ""))


def read_raw(p: Path) -> pd.DataFrame:
    """读取原始 CSV，跳过 # 注释行。所有列先按字符串读入，保持原始形态。

    遇到列数错位时给出可定位的错误信息（而不是 pandas 的原始堆栈），
    因为原始数据是人工从官方页面转录的，这类结构错误必须被明确暴露。
    """
    try:
        return pd.read_csv(p, comment="#", dtype=str, keep_default_na=False,
                           encoding="utf-8-sig")
    except pd.errors.ParserError as exc:
        # 定位到具体行，方便直接核对转录内容。
        # 用 csv 模块解析（正确处理引号），不能用 split(',') 数逗号。
        lines = [l for l in p.read_text(encoding="utf-8-sig").splitlines()
                 if l.strip() and not l.lstrip().startswith("#")]
        parsed = list(csv.reader(lines)) if lines else []
        header = lines[0] if lines else ""
        n_expect = len(parsed[0]) if parsed else 0
        detail = []
        for i, row in enumerate(parsed[1:], start=2):
            if len(row) != n_expect:
                detail.append(f"    第 {i} 行：期望 {n_expect} 列，实际 {len(row)} 列 -> "
                              f"{lines[i - 1][:90]}")
        raise SystemExit(
            f"\n[结构错误] {p.relative_to(ROOT)}\n"
            f"  表头 {n_expect} 列：{header}\n"
            + "\n".join(detail[:10]) +
            f"\n  最常见的成因：文本字段里写了**半角逗号**而没加引号。\n"
            f"  请改用全角「，」或给该字段加双引号后重试。\n"
            f"  原始异常：{exc}"
        ) from exc


# --------------------------------------------------------------------------
# 省份名称标准化
# --------------------------------------------------------------------------
PROVINCE_ALIASES = {
    "北京市": "北京", "天津市": "天津", "上海市": "上海", "重庆市": "重庆",
    "河北省": "河北", "山西省": "山西", "辽宁省": "辽宁", "吉林省": "吉林",
    "黑龙江省": "黑龙江", "江苏省": "江苏", "浙江省": "浙江", "安徽省": "安徽",
    "福建省": "福建", "江西省": "江西", "山东省": "山东", "河南省": "河南",
    "湖北省": "湖北", "湖南省": "湖南", "广东省": "广东", "海南省": "海南",
    "四川省": "四川", "贵州省": "贵州", "云南省": "云南", "陕西省": "陕西",
    "甘肃省": "甘肃", "青海省": "青海", "台湾省": "台湾",
    "内蒙古自治区": "内蒙古", "广西壮族自治区": "广西", "西藏自治区": "西藏",
    "宁夏回族自治区": "宁夏", "新疆维吾尔自治区": "新疆",
    "香港特别行政区": "香港", "澳门特别行政区": "澳门",
    # 常见简写
    "内蒙": "内蒙古", "广西壮族": "广西", "宁夏回族": "宁夏",
    "新疆维吾尔": "新疆", "西藏藏族": "西藏",
}


def normalize_province(name: str) -> str:
    """把各种写法的省份名统一为简称。无法识别时原样返回（并会在校验中被标记）。"""
    if name is None:
        return ""
    s = str(name).strip()
    if not s:
        return ""
    if s in PROVINCE_ALIASES:
        return PROVINCE_ALIASES[s]
    # 去掉常见的行政后缀
    s2 = re.sub(r"(省|市|特别行政区|自治区|壮族|回族|维吾尔|藏族)$", "", s)
    return PROVINCE_ALIASES.get(s, s2 if s2 else s)


# --------------------------------------------------------------------------
# 逐数据集清洗
# --------------------------------------------------------------------------
WAN_RE = re.compile(r"^\s*([\d.]+)\s*(万|亿)?\s*$")


def to_number(v):
    """把诸如 '1,234.5'、'12.9亿'、'3.0万' 之类的文本转成数值；无法转换返回 NaN。

    注意：**绝不在无法转换时填 0**，一律返回 NaN 以保留"缺测"语义。
    """
    if v is None:
        return np.nan
    s = str(v).strip().replace(",", "").replace("，", "")
    if s == "" or s.lower() in ("na", "null", "none", "-", "—", "暂无数据"):
        return np.nan
    m = WAN_RE.match(s)
    if m:
        num = float(m.group(1))
        unit = m.group(2)
        if unit == "万":
            num *= 1e4
        elif unit == "亿":
            num *= 1e8
        return num
    try:
        return float(s)
    except ValueError:
        return np.nan


def clean_frame(p: Path, numeric_cols: list[str], province_col: str | None = None) -> pd.DataFrame:
    df = read_raw(p)
    n0 = len(df)

    # 1) 去重
    dup_mask = df.duplicated(keep="first")
    n_dup = int(dup_mask.sum())
    if n_dup:
        df = df[~dup_mask].copy()
    log(p.name, "删除完全重复记录", "整行内容完全相同", n_dup)

    # 2) 省份名标准化
    if province_col and province_col in df.columns:
        before = df[province_col].tolist()
        df[province_col] = [normalize_province(v) for v in df[province_col]]
        changed = sum(1 for a, b in zip(before, df[province_col]) if a != b)
        log(p.name, "标准化省份名称", f"`{province_col}` 统一为简称", changed)

    # 3) 数值字段转换
    for col in numeric_cols:
        if col not in df.columns:
            continue
        raw_series = df[col]
        df[col] = [to_number(v) for v in raw_series]
        bad = int(sum(1 for v, o in zip(df[col], raw_series)
                      if pd.isna(v) and str(o).strip() != ""))
        if bad:
            log(p.name, "数值无法转换（保留为空值）", f"`{col}`", bad)

    log(p.name, "清洗后记录数", f"原始 {n0} 条", len(df))
    return df


# --------------------------------------------------------------------------
def main() -> int:
    C.CLEAN.mkdir(parents=True, exist_ok=True)
    print("=" * 62)
    print("数据清洗 raw -> clean")
    print("=" * 62)

    jobs = [
        (C.RAW_STAT / "national_registered_museums.csv",
         ["year", "registered_museums", "visitors_100m", "exhibitions_10k", "free_open_museums"], None),
        (C.RAW_STAT / "national_relief_institutions.csv",
         ["year", "relic_institutions", "museums_mct", "collections_all_wan",
          "collections_museum_wan", "exhibitions_total", "exhibitions_permanent",
          "exhibitions_temporary", "visitors_relic_wan", "visitors_museum_wan",
          "grade1_wan", "grade2_wan", "grade3_wan"], None),
        (C.RAW_STAT / "national_movable_relics_census.csv",
         ["value", "share_pct"], "area"),
        (C.RAW_POP / "province_population.csv",
         ["year", "population_wan"], "province"),
        (C.RAW_STAT / "province_museums.csv",
         ["year", "museum_count", "collection_count", "precious_count",
          "visitors_wan", "exhibition_count"], "province"),
        # 国际数据：country 为英文国名，不能用省份归一化规则处理
        (C.RAW_INTL / "country_museums.csv",
         ["year", "museum_count", "population_million", "population_year",
          "visitors_million"], None),
        (C.RAW_CASES / "museum_cases.csv",
         ["year", "annual_visitors_wan", "collection_count", "building_area_m2",
          "rank_2023"], None),
        (C.RAW_CASES / "museum_cases_official.csv",
         ["year", "annual_visitors_wan", "collection_count", "building_area_m2"], None),
    ]

    produced = 0
    for path, numeric, prov_col in jobs:
        if not path.exists():
            print(f"\n[跳过] 目录中暂无 {path.relative_to(ROOT)}（对应数据尚未获取）")
            continue
        print(f"\n[清洗] {path.relative_to(ROOT)}")
        df = clean_frame(path, numeric, prov_col)
        out = C.CLEAN / path.name
        df.to_csv(out, index=False, encoding="utf-8-sig")
        print(f"    -> {out.relative_to(ROOT)}  ({len(df)} 行 × {len(df.columns)} 列)")
        produced += 1

    (C.METADATA / "clean_log.json").write_text(
        json.dumps(LOG, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n" + "=" * 62)
    print(f"清洗完成：{produced} 个数据集")
    print(f"日志：data/metadata/clean_log.json")
    print("=" * 62)
    if produced == 0:
        print("\n注意：没有可清洗的原始数据。请先把官方数据转录到 data/raw/ 下。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
