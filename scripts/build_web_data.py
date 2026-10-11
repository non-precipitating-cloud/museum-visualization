#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
build_web_data.py — 生成前端数据（processed -> web/data/museum-data.js）

把 data/processed/ 中的数据打包成一个 JS 文件，通过
        echarts.registerMap(...) 同级的 window.MUSEUM_DATA = {...}
暴露给前端。这样浏览器以 file:// 直接打开 index.html 即可运行，
不需要任何后端服务（本项目定位是数据可视化作品，不引入服务端）。

数值中的 NaN 一律写成 null，前端据此显示"暂无数据"。

用法：
    python scripts/build_web_data.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src import config as C  # noqa: E402


def rd(name: str) -> pd.DataFrame | None:
    p = C.PROCESSED / name
    if not p.exists():
        return None
    return pd.read_csv(p, comment="#", encoding="utf-8-sig")


def jclean(obj):
    """把 numpy / pandas 类型转换为原生 JSON 可序列化类型；NaN -> None。"""
    if isinstance(obj, dict):
        return {k: jclean(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [jclean(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating, float)):
        f = float(obj)
        return None if (np.isnan(f) or np.isinf(f)) else round(f, 6)
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    if obj is None or (isinstance(obj, float) and np.isnan(obj)):
        return None
    if pd.isna(obj) if not isinstance(obj, (list, dict)) else False:
        return None
    return obj


def records(df: pd.DataFrame | None) -> list[dict]:
    if df is None:
        return []
    return jclean(df.replace({np.nan: None}).to_dict(orient="records"))


def main() -> int:
    print("=" * 62)
    print("生成前端数据 web/data/museum-data.js")
    print("=" * 62)

    universe: dict = {}

    # ---------------- meta ----------------
    nat = rd("national_yearly.csv")
    prov = rd("province_year.csv")
    latest_year = None
    if prov is not None and len(prov):
        latest_year = int(pd.to_numeric(prov["year"], errors="coerce").max())

    # ---------------- 全国年度序列 ----------------
    series = {}
    calibers = []
    if nat is not None and len(nat):
        for cal, label in ((C.CALIBER_REGISTERED, "国家文物局·备案博物馆口径"),
                           (C.CALIBER_MCT, "文化和旅游部公报·文物机构/博物馆口径")):
            sub = nat[nat["caliber"] == cal].sort_values("year")
            if not len(sub):
                continue
            cols = [c for c in ("year", "museums", "collections_museum_wan", "visitors_100m",
                                "exhibitions_10k", "relic_institutions",
                                "collections_all_wan", "visitors_relic_wan") if c in sub.columns]
            series[cal] = records(sub[cols])
            calibers.append({"key": cal, "label": label,
                             "note": C.CALIBER_LABEL.get(cal, "")})

    # ---------------- 分省 ----------------
    prov_rows = records(prov)

    # ---------------- 普查 ----------------
    census = rd("census_relics.csv")
    census_block = {"national": {}, "top_provinces": [], "rows": records(census)}
    if census is not None and len(census):
        n = census[census["scope"] == "national"]
        census_block["national"] = {r["metric"]: jclean(r["value"]) for _, r in n.iterrows()}
        census_block["national_share"] = {
            r["metric"]: jclean(r["share_pct"]) for _, r in n.iterrows()}
        pv = census[(census["scope"] == "province") & (census["metric"] == "movable_relics_total")]
        census_block["top_provinces"] = records(
            pv[["area", "value", "share_pct"]].rename(columns={"area": "province"}))

    # ---------------- 国际 ----------------
    intl = rd("international_country.csv")

    # ---------------- 案例 ----------------
    cases = rd("museum_cases.csv")            # TEA/AECOM 2023 全球前20
    cases_off = rd("museum_cases_official.csv")  # 各馆官方公布数据

    # ---------------- 来源台账 ----------------
    src_reg = C.METADATA / "source_registry.csv"
    sources = []
    if src_reg.exists():
        sources = records(pd.read_csv(src_reg, encoding="utf-8-sig"))

    # ---------------- 审计摘要 ----------------
    audit = {}
    ap = C.METADATA / "data_audit.csv"
    if ap.exists():
        adf = pd.read_csv(ap, encoding="utf-8-sig")
        proc = adf[adf["layer"] == "processed"]
        raw = adf[adf["layer"] == "raw"]
        cln = adf[adf["layer"] == "clean"]

        def cnt(sub):
            return int(sub["file_name"].nunique())

        audit = {
            "dataset_count": cnt(raw) + cnt(cln) + cnt(proc),
            "raw_datasets": cnt(raw), "clean_datasets": cnt(cln),
            "processed_datasets": cnt(proc),
            "raw_records": int(raw["records"].sum()) if len(raw) else 0,
            "clean_records": int(cln["records"].sum()) if len(cln) else 0,
            "processed_records": int(proc["records"].sum()) if len(proc) else 0,
            "processed_fields": int(proc["fields"].sum()) if len(proc) else 0,
            "derived_fields": int(proc["derived_metric_fields"].sum()) if len(proc) else 0,
            "missing_values": int(adf["missing_values"].sum()),
            "duplicate_records": int(adf["duplicate_records"].sum()),
            "datasets": records(proc),
        }

    # ---------------- KPI ----------------
    kp = C.METADATA / "kpi.json"
    kpi = json.loads(kp.read_text(encoding="utf-8")) if kp.exists() else []

    # ---------------- 图表-数据集映射 ----------------
    mp = C.METADATA / "chart_data_mapping.csv"
    mapping = records(pd.read_csv(mp, encoding="utf-8-sig")) if mp.exists() else []

    universe = {
        "meta": {
            "title": "中国博物馆文化资源与公共文化服务的多维可视化分析",
            "latest_year": latest_year,
            "generated_from": "data/processed/",
            "caliber_warning": (
                "国家文物局「备案博物馆」口径与文化和旅游部《文化和旅游发展统计公报》"
                "「文物机构 / 博物馆」口径统计范围不同，本项目中两者分列展示，不混用、不换算。"
            ),
            "disclaimer": (
                "注：不同国家及博物馆的统计口径、统计年份和馆藏定义可能存在差异，"
                "国际比较主要用于观察规模和发展特征，不构成严格意义上的全球排名。"
            ),
        },
        "kpi": kpi,
        "national": {"series": series, "calibers": calibers},
        "province": {"rows": prov_rows, "latest_year": latest_year},
        "census": census_block,
        "international": {"rows": records(intl)},
        "cases": {"rows": records(cases), "official": records(cases_off)},
        "sources": sources,
        "chartMapping": mapping,
        "audit": audit,
    }

    C.WEB_DATA.mkdir(parents=True, exist_ok=True)
    out = C.WEB_DATA / "museum-data.js"
    payload = json.dumps(universe, ensure_ascii=False, separators=(",", ":"))
    out.write_text(
        "/* 本文件由 scripts/build_web_data.py 自动生成，请勿手工编辑。\n"
        " * 数据源：data/processed/*.csv（其上游为 data/raw/ 的官方数据转录）\n"
        f" * 生成命令：python scripts/build_web_data.py\n"
        " */\n"
        "window.MUSEUM_DATA = " + payload + ";\n",
        encoding="utf-8")

    print(f"\n[写出] {out.relative_to(ROOT)}  ({out.stat().st_size:,} bytes)")
    print(f"  · KPI                 : {len(kpi)}")
    print(f"  · 全国序列口径         : {len(calibers)}")
    print(f"  · 分省记录             : {len(prov_rows)}  (最新年份 {latest_year})")
    print(f"  · 普查记录             : {len(census_block['rows'])}")
    print(f"  · 国际记录             : {len(universe['international']['rows'])}")
    print(f"  · 案例记录             : {len(universe['cases']['rows'])}")
    print(f"  · 来源条数             : {len(sources)}")
    if not prov_rows:
        print("\n[提示] 分省数据为空 —— 首页地图将显示「暂无数据」。")
        print("       请先补齐 data/raw/museum_statistics/province_museums.csv 与 "
              "data/raw/population/province_population.csv")
    print("=" * 62)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
