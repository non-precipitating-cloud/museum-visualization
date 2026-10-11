#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
build_dataset.py — 构建分析数据集与派生指标（Phase 9 / 11）

clean -> processed。职责：
  1. 汇总全国年度序列（两套口径分列，各自带口径说明）
  2. 合并分省博物馆统计与分省人口，计算派生指标
  3. 关联可移动文物普查数据
  4. 生成 KPI 所需的同比（真实计算，非人工填写）

原则：任何分子/分母缺测或为 0 的派生指标一律保持 NULL，**绝不填 0**。

用法：
    python scripts/build_dataset.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src import config as C          # noqa: E402
from src import metrics as M         # noqa: E402

REPORT: dict = {}


def rd(p: Path) -> pd.DataFrame | None:
    if not p.exists():
        print(f"  [缺] {p.relative_to(ROOT)}")
        return None
    df = pd.read_csv(p, comment="#", encoding="utf-8-sig")
    print(f"  [读] {p.relative_to(ROOT)}  {df.shape[0]} 行 × {df.shape[1]} 列")
    return df


# --------------------------------------------------------------------------
# 1. 全国年度序列（两套口径分列）
# --------------------------------------------------------------------------
def build_national() -> pd.DataFrame | None:
    print("\n[1] 全国年度序列")
    reg = rd(C.CLEAN / "national_registered_museums.csv")
    mct = rd(C.CLEAN / "national_relief_institutions.csv")

    frames = []
    if reg is not None:
        d = reg.rename(columns={
            "registered_museums": "museums",
            "visitors_100m": "visitors_100m",
            "exhibitions_10k": "exhibitions_10k",
        })[["year", "museums", "visitors_100m", "exhibitions_10k", "free_open_museums"]]
        d["caliber"] = C.CALIBER_REGISTERED
        d["collections_museum_wan"] = np.nan
        frames.append(d)

    if mct is not None:
        d = mct[["year", "relic_institutions", "museums_mct", "collections_all_wan",
                 "collections_museum_wan", "exhibitions_total",
                 "visitors_relic_wan", "visitors_museum_wan"]].copy()
        d = d.rename(columns={"museums_mct": "museums"})
        d["caliber"] = C.CALIBER_MCT
        d["visitors_100m"] = d["visitors_relic_wan"] / 1e4
        d["exhibitions_10k"] = d["exhibitions_total"] / 1e4
        d["free_open_museums"] = np.nan
        frames.append(d)

    if not frames:
        return None

    out = pd.concat(frames, ignore_index=True, sort=False)
    out = out.sort_values(["caliber", "year"]).reset_index(drop=True)
    print(f"  -> 全国序列 {len(out)} 行")
    return out


# --------------------------------------------------------------------------
# 2. 分省数据集 + 派生指标
# --------------------------------------------------------------------------
def build_province() -> pd.DataFrame | None:
    print("\n[2] 分省数据集与派生指标")
    prov = rd(C.CLEAN / "province_museums.csv")
    if prov is None:
        return None
    pop = rd(C.CLEAN / "province_population.csv")

    prov["year"] = pd.to_numeric(prov["year"], errors="coerce")
    if pop is not None:
        pop["year"] = pd.to_numeric(pop["year"], errors="coerce")
        # 只取人口值列，避免与博物馆表的 source_id 撞名
        prov = prov.merge(pop[["province", "year", "population_wan"]],
                          on=["province", "year"], how="left")
    else:
        prov["population_wan"] = np.nan

    prov["region"] = prov["province"].map(C.REGION_OF)

    unknown = sorted({p for p in prov["province"].unique() if p not in C.REGION_OF})
    if unknown:
        print(f"  [!] 未匹配到区域的省份：{unknown}")

    prov = M.add_province_metrics(prov)
    prov = prov.sort_values(["year", "province"]).reset_index(drop=True)
    REPORT["province_rows"] = len(prov)
    print(f"  -> 分省数据集 {len(prov)} 行，{prov['province'].nunique()} 个省份，"
          f"年份 {int(prov['year'].min())}-{int(prov['year'].max())}")
    return prov


# --------------------------------------------------------------------------
# 3. 可移动文物普查
# --------------------------------------------------------------------------
def build_census() -> pd.DataFrame | None:
    print("\n[3] 第一次全国可移动文物普查")
    df = rd(C.CLEAN / "national_movable_relics_census.csv")
    if df is None:
        return None
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    df["share_pct"] = pd.to_numeric(df["share_pct"], errors="coerce")
    print(f"  -> 普查数据 {len(df)} 行")
    return df


# --------------------------------------------------------------------------
# 4. 国际比较
# --------------------------------------------------------------------------
def build_international() -> pd.DataFrame | None:
    print("\n[4] 国际比较")
    df = rd(C.CLEAN / "country_museums.csv")
    if df is None:
        return None
    df["year"] = pd.to_numeric(df["year"], errors="coerce")
    for c in ("museum_count", "population_million", "visitors_million"):
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")
    if "population_million" in df.columns:
        df["museums_per_million"] = df.apply(
            lambda r: (r["museum_count"] / r["population_million"])
            if pd.notna(r.get("museum_count")) and pd.notna(r.get("population_million"))
            and r["population_million"] else np.nan, axis=1)
    print(f"  -> 国际数据 {len(df)} 行，{df['country'].nunique()} 个国家")
    return df


# --------------------------------------------------------------------------
# 5. KPI（含真实同比）
# --------------------------------------------------------------------------
def build_kpi(national: pd.DataFrame | None, census: pd.DataFrame | None) -> list[dict]:
    """构建首页 KPI。每个 KPI 独立标注**自己的统计年份与口径**，
    因为不同指标的最新可得年份不同 —— 不做跨年混算。"""
    print("\n[5] KPI")
    kpis: list[dict] = []

    def yoy(series: pd.DataFrame, col: str, year: int, base: int):
        """真实计算同比，分子分母缺一即返回 None。"""
        a = series.loc[series["year"] == year, col]
        b = series.loc[series["year"] == base, col]
        if len(a) and len(b) and pd.notna(a.iloc[0]) and pd.notna(b.iloc[0]) and float(b.iloc[0]) != 0:
            return {"pct": (float(a.iloc[0]) - float(b.iloc[0])) / float(b.iloc[0]) * 100,
                    "base_year": int(base)}
        return None

    if national is not None:
        reg = national[national["caliber"] == C.CALIBER_REGISTERED].sort_values("year")
        mct = national[national["caliber"] == C.CALIBER_MCT].sort_values("year")

        if len(reg):
            y = int(reg["year"].max())
            kpis.append({
                "id": "museums", "label": "备案博物馆数量", "unit": "家",
                "value": float(reg.loc[reg["year"] == y, "museums"].iloc[0]),
                "year": y, "caliber": "国家文物局备案博物馆口径",
                "color": "#3987e5", "yoy": yoy(reg, "museums", y, y - 1),
                "source_ids": f"SRC_NCHA_{y}",
            })
            kpis.append({
                "id": "visitors", "label": "博物馆参观人次", "unit": "亿人次",
                "value": float(reg.loc[reg["year"] == y, "visitors_100m"].iloc[0]),
                "year": y, "caliber": "国家文物局博物馆口径",
                "color": "#c98500", "yoy": yoy(reg, "visitors_100m", y, y - 1),
                "source_ids": f"SRC_NCHA_{y}",
            })
            if reg.loc[reg["year"] == y, "exhibitions_10k"].notna().any():
                kpis.append({
                    "id": "exhibitions", "label": "举办陈列展览", "unit": "万个",
                    "value": float(reg.loc[reg["year"] == y, "exhibitions_10k"].iloc[0]),
                    "year": y, "caliber": "国家文物局博物馆口径",
                    "color": "#e66767", "yoy": yoy(reg, "exhibitions_10k", y, y - 1),
                    "source_ids": f"SRC_NCHA_{y}",
                })

        muse_col = mct[mct["collections_museum_wan"].notna()]
        if len(muse_col):
            y = int(muse_col["year"].max())
            kpis.append({
                "id": "collections", "label": "博物馆文物藏品", "unit": "万件(套)",
                "value": float(muse_col.loc[muse_col["year"] == y, "collections_museum_wan"].iloc[0]),
                "year": y, "caliber": "文化和旅游部公报·博物馆口径",
                "color": "#199e70", "yoy": None, "source_ids": f"SRC_MCT_{y}",
            })

    if census is not None:
        n = census[(census["scope"] == "national")]
        pr = n[n["metric"] == "precious_relics"]
        if len(pr):
            kpis.append({
                "id": "precious", "label": "珍贵文物", "unit": "万件",
                "value": float(pr.iloc[0]["value"]) / 1e4,
                "year": 2016, "caliber": "第一次全国可移动文物普查·国有单位口径",
                "color": "#c98500", "yoy": None, "source_ids": "SRC_CENSUS_2017",
            })

    # 按学校大屏的阅读顺序固定排列
    order = ["museums", "collections", "precious", "visitors", "exhibitions"]
    kpis.sort(key=lambda k: order.index(k["id"]) if k["id"] in order else 99)
    for k in kpis:
        print(f"  · {k['label']}: {k['value']:,.1f} {k['unit']} ({k['year']}年) 同比={k['yoy']}")
    REPORT["kpi_count"] = len(kpis)
    return kpis


# --------------------------------------------------------------------------
def main() -> int:
    C.PROCESSED.mkdir(parents=True, exist_ok=True)
    print("=" * 62)
    print("构建分析数据集 clean -> processed")
    print("=" * 62)

    national = build_national()
    province = build_province()
    census = build_census()
    intl = build_international()

    kpis = build_kpi(national, census)

    cases = rd(C.CLEAN / "museum_cases.csv")
    cases_off = rd(C.CLEAN / "museum_cases_official.csv")

    written = []
    def wr(df, name):
        if df is None:
            return
        p = C.PROCESSED / name
        df.to_csv(p, index=False, encoding="utf-8-sig")
        written.append((name, df.shape))
        print(f"  -> {p.relative_to(ROOT)}  ({df.shape[0]} 行 × {df.shape[1]} 列)")

    print("\n[6] 写出 processed 数据集")
    wr(national, "national_yearly.csv")
    wr(province, "province_year.csv")
    wr(census, "census_relics.csv")
    wr(intl, "international_country.csv")
    wr(cases, "museum_cases.csv")
    wr(cases_off, "museum_cases_official.csv")

    (C.METADATA / "kpi.json").write_text(
        json.dumps(kpis, ensure_ascii=False, indent=2), encoding="utf-8")

    REPORT["datasets"] = [{"file": n, "rows": int(s[0]), "cols": int(s[1])} for n, s in written]
    (C.METADATA / "build_report.json").write_text(
        json.dumps(REPORT, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n" + "=" * 62)
    print(f"构建完成：{len(written)} 个 processed 数据集，{len(kpis)} 个 KPI")
    print("=" * 62)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
