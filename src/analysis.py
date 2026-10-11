# -*- coding: utf-8 -*-
"""分析计算：把"核心发现"变成可复现的程序输出。

本项目的一条纪律是：**没有真实计算的数据不写结论**。
因此所有写进 README / 页面「数据洞察」里的数字，
都应当能由本模块的函数重新算出来。

本模块只做**描述性统计与相关分析**，不做因果推断，
输出中一律区分"事实 / 描述 / 相关关系"。
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from . import data_loader as DL


def pearson(xs, ys) -> tuple[float, int] | None:
    """计算 Pearson 相关系数。样本不足 3 或某侧无变异时返回 None。"""
    x = pd.to_numeric(pd.Series(xs), errors="coerce")
    y = pd.to_numeric(pd.Series(ys), errors="coerce")
    m = x.notna() & y.notna()
    x, y = x[m], y[m]
    if len(x) < 3 or x.std() == 0 or y.std() == 0:
        return None
    return float(np.corrcoef(x, y)[0, 1]), int(len(x))


def strength(r: float) -> str:
    """把相关系数翻译成中文强度描述（仅描述线性关联强度）。"""
    a = abs(r)
    if a >= 0.8:
        return "强相关"
    if a >= 0.5:
        return "中等相关"
    if a >= 0.3:
        return "弱相关"
    return "几乎无线性相关"


def national_scale() -> dict:
    """规模类事实：最新年份的备案口径全国数，以及真实计算的同比。"""
    df = DL.registered_series()
    if not len(df):
        return {}
    y = int(df["year"].max())
    cur = df[df["year"] == y].iloc[0]
    prev = df[df["year"] == y - 1]
    out = {"year": y}
    for col, key in (("museums", "museums"), ("visitors_100m", "visitors_100m"),
                     ("exhibitions_10k", "exhibitions_10k")):
        v = cur.get(col)
        out[key] = None if pd.isna(v) else float(v)
        p = prev.iloc[0].get(col) if len(prev) else np.nan
        if out[key] is not None and pd.notna(p) and float(p) != 0:
            out[key + "_yoy_pct"] = (out[key] - float(p)) / float(p) * 100
            out[key + "_yoy_base"] = y - 1
        else:
            out[key + "_yoy_pct"] = None
    # 博物馆数量增量
    p = prev.iloc[0].get("museums") if len(prev) else np.nan
    out["museums_added"] = (int(out["museums"] - float(p))
                            if out["museums"] is not None and pd.notna(p) else None)

    # 冲击与恢复：参观人次的最低点与恢复情况
    vis = df[["year", "visitors_100m"]].dropna()
    if len(vis) >= 3:
        lo = vis.loc[vis["visitors_100m"].idxmin()]
        out["visitors_trough"] = {"year": int(lo["year"]),
                                 "value": float(lo["visitors_100m"])}
        pre = vis[vis["year"] < lo["year"]]
        if len(pre):
            pk = pre.loc[pre["visitors_100m"].idxmax()]
            out["visitors_peak_before_trough"] = {
                "year": int(pk["year"]), "value": float(pk["visitors_100m"])}
    return out


def spatial_concentration() -> dict:
    """空间集中度：绝对规模排名、标准化排名、极值倍数。"""
    df = DL.province_latest()
    if not len(df):
        return {}
    y = int(df["year"].max())
    top_abs = df.nlargest(5, "museum_count")[["province", "museum_count"]]
    top_den = df.nlargest(5, "museums_per_million_population")[
        ["province", "museums_per_million_population"]]
    top_vis = df.nlargest(5, "visitors_wan")[["province", "visitors_wan"]]
    top_vpm = df.nlargest(5, "visitors_per_million_population")[
        ["province", "visitors_per_million_population"]]

    mn, mx = df["museum_count"].min(), df["museum_count"].max()
    lo = df.loc[df["museum_count"].idxmin(), "province"]
    hi = df.loc[df["museum_count"].idxmax(), "province"]
    return {
        "year": y,
        "top_absolute": [(r["province"], float(r["museum_count"])) for _, r in top_abs.iterrows()],
        "top_density": [(r["province"], float(r["museums_per_million_population"]))
                        for _, r in top_den.iterrows()],
        "top_visitors": [(r["province"], float(r["visitors_wan"])) for _, r in top_vis.iterrows()],
        "top_visitors_per_million": [
            (r["province"], float(r["visitors_per_million_population"]))
            for _, r in top_vpm.iterrows()],
        "max_province": (hi, float(mx)), "min_province": (lo, float(mn)),
        "max_min_ratio": float(mx / mn) if mn else None,
    }


def correlations() -> dict:
    """变量间的线性关联强度（**只描述相关，不推断因果**）。"""
    df = DL.province_latest()
    if not len(df):
        return {}
    pairs = [
        ("exhibition_count", "visitors_wan", "展览数量", "参观人次"),
        ("museum_count", "visitors_wan", "博物馆数量", "参观人次"),
        ("collection_count", "visitors_wan", "馆藏数量", "参观人次"),
        ("museum_count", "museums_per_million_population", "博物馆数量", "每百万人博物馆数量"),
        ("visitors_wan", "visitors_per_million_population", "参观人次", "每百万人参观人次"),
    ]
    out = {}
    for x, y, xn, yn in pairs:
        if x in df.columns and y in df.columns:
            res = pearson(df[x], df[y])
            if res:
                out[f"{x}~{y}"] = {"x": xn, "y": yn, "r": res[0], "n": res[1],
                                   "strength": strength(res[0])}
    return out


def census_structure() -> dict:
    """第一次全国可移动文物普查的等级结构。"""
    df = DL.census()
    if not len(df):
        return {}
    nat = df[df["scope"] == "national"]
    m = {r["metric"]: r["value"] for _, r in nat.iterrows()}
    sh = {r["metric"]: r["share_pct"] for _, r in nat.iterrows()}
    g1, g2, g3 = m.get("fine_relics_grade1"), m.get("fine_relics_grade2"), m.get("fine_relics_grade3")
    total_fine = None
    if g1 is not None and g2 is not None and g3 is not None:
        total_fine = g1 + g2 + g3
    pv = df[(df["scope"] == "province") & (df["metric"] == "movable_relics_total")]
    pv = pv.sort_values("value", ascending=False)

    # ------------------------------------------------------------------
    # 重要：分省数量的**分母不是 movable_relics_total（108,154,907 件/套）**！
    #
    # 公报原文：全国可移动文物共计 108,154,907 件/套，其中
    #   按普查统一标准登录文物完整信息的为 26,610,907 件/套，**实际数量 64,073,178 件**；
    #   各级综合档案馆馆藏纸质历史档案 81,544,000 卷/件。
    #   （26,610,907 + 81,544,000 = 108,154,907，口径闭合）
    #
    # 公报给出的省级占比是相对「**登录文物实际数量 64,073,178 件**」计算的：
    #   北京 11,615,758 / 64,073,178 = 18.13%  ✓（与公报一致）
    #   若误用 108,154,907 作分母，北京只有 10.74%，与公报不符。
    # 本项目按公报口径，分母使用"登录文物实际数量"。
    # ------------------------------------------------------------------
    denom = m.get("movable_relics_actual_count")
    top5 = float(pv["value"].sum())
    denom_note = "登录文物实际数量（64,073,178 件），与公报给出的省级占比口径一致"
    return {
        "movable_relics_total": m.get("movable_relics_total"),
        "archives_paper_files": m.get("archives_paper_files"),
        "precious_relics": m.get("precious_relics"),
        "precious_share_pct_given": sh.get("precious_relics"),
        "actual_count": denom,
        "denominator_used": denom,
        "denominator_note": denom_note,
        "grade1": g1, "grade2": g2, "grade3": g3,
        "fine_total_check": total_fine,
        "grade3_share_of_fine_pct": (100 * g3 / total_fine) if total_fine else None,
        "grade1_share_of_fine_pct": (100 * g1 / total_fine) if total_fine else None,
        "precious_share_recomputed_pct": (
            100 * m.get("precious_relics") / denom
            if m.get("precious_relics") and denom else None),
        "top_provinces": [(r["area"], float(r["value"]), float(r["share_pct"])
                           if pd.notna(r["share_pct"]) else None)
                          for _, r in pv.iterrows()],
        "top5_sum": top5,
        "top5_share_pct": (100 * top5 / denom) if denom else None,
        "rest_sum": (denom - top5) if denom else None,
        "rest_share_pct": (100 * (denom - top5) / denom) if denom else None,
    }


def international_position() -> dict:
    """国际比较：两套口径下的中国位置，以及严格可比的 TEA 榜单。"""
    df = DL.international()
    out = {}
    if len(df):
        for g, label in (("A", "各国自报官方口径"), ("B", "UNESCO 统一口径")):
            sub = df[df["caliber_group"] == g]
            cn = sub[sub["country"] == "中国"]
            out["china_" + g] = {
                "label": label,
                "value": float(cn["museum_count"].iloc[0]) if len(cn) else None,
                "year": int(cn["year"].iloc[0]) if len(cn) else None,
                "n_countries": int(len(sub)),
                "rank": int((sub["museum_count"] > cn["museum_count"].iloc[0]).sum() + 1)
                if len(cn) else None,
            }
        for c in ("法国", "美国"):
            a = df[(df.country == c) & (df.caliber_group == "A")]["museum_count"]
            b = df[(df.country == c) & (df.caliber_group == "B")]["museum_count"]
            if len(a) and len(b):
                lo, hi = sorted([float(a.iloc[0]), float(b.iloc[0])])
                out[f"gap_{c}"] = {"official": float(a.iloc[0]), "unesco": float(b.iloc[0]),
                                   "ratio": hi / lo if lo else None}

    cs = DL.museum_cases(official=False)
    if len(cs):
        cn = cs[cs["country"] == "中国"].sort_values("rank_2023")
        out["tea_2023"] = {
            "n_total": int(len(cs)),
            "china_count": int(len(cn)),
            "china": [(int(r["rank_2023"]), r["museum_cn"], float(r["annual_visitors_wan"]))
                      for _, r in cn.iterrows()],
            "top1": (cs.loc[cs["rank_2023"].idxmin(), "museum_cn"],
                     float(cs["annual_visitors_wan"].max())),
        }
    return out


def kpi_snapshot() -> list[dict]:
    """直接从 KPI 文件读取（该文件由 build_dataset.py 真实计算生成）。"""
    import json
    from . import config as C
    p = C.METADATA / "kpi.json"
    if not p.exists():
        return []
    return json.loads(p.read_text(encoding="utf-8"))
