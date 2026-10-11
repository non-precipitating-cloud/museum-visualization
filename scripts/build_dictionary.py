#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
build_dictionary.py — 生成数据字典（Phase 6）

输出 data/metadata/data_dictionary.xlsx，每个字段一行，包含：
    field_name / Chinese_name / dataset_id / definition / unit / year /
    geographic_scope / source / original_field / processing_method /
    formula / missing_value_rule / used_in_chart

字段的**业务含义**（定义、单位、缺失规则、公式）来自 src/metrics.py 与本文件
下方的 FIELD_DICT —— 这些是人工登记的知识，无法由程序推导；
而**字段所属数据集、数据年份、地理范围**等由程序读取数据实际计算。

用法：
    python scripts/build_dictionary.py
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src import config as C            # noqa: E402
from src import metrics as M           # noqa: E402

# --------------------------------------------------------------------------
# 字段定义（人工登记）
# --------------------------------------------------------------------------
# key: field_name -> (中文名, 定义, 单位, 缺失处理规则, 公式, 用于哪张图)
FIELD_DICT: dict[str, tuple] = {
    # ---- 通用维度 ----
    "year": ("年份", "统计年份", "年", "必填", "", "全部时间序列图"),
    "caliber": ("统计口径", "标识该行数据属于哪一套统计口径", "枚举", "必填", "",
                "发展趋势各图（两套口径分列）"),
    "province": ("省级行政区", "省级行政区名称（简称，国家统计局区划口径）", "文本", "必填", "",
                 "全部分省图表"),
    "region": ("区域", "按国家统计局四大区域划分：东部/中部/西部/东北", "枚举", "必填",
               "国家统计局区域划分标准", "地图、四象限、排名图的颜色编码"),
    "country": ("国家/地区", "国家或地区名称", "文本", "必填", "", "国际比较各图"),
    "country_en": ("国家英文名", "国家的英文名称，便于与国际来源核对", "文本", "可为空", "",
                   "数据核对"),
    "scope": ("统计层级", "标识该行是全国值、分省值还是汇总值", "枚举", "必填", "",
              "可移动文物等级结构与集聚图"),
    "area": ("地区", "普查数据中的地区名称", "文本", "必填", "", "可移动文物集聚图"),
    "metric": ("指标代码", "普查数据长表中的指标标识", "枚举", "必填", "", "可移动文物各图"),
    "unit": ("单位", "该行数值的计量单位", "文本", "必填", "", "数据核对"),
    "source_id": ("来源ID", "指向 data/metadata/source_registry.csv 的来源标识", "文本", "必填",
                  "", "数据说明页的来源台账"),
    "caliber_note": ("口径说明", "该行数值的统计口径文字说明", "文本", "可为空", "",
                     "国际比较的 tooltip 与口径差异表"),
    "year_note": ("年份口径说明", "该行数值所属年份的特殊口径（如财年、民国年度）", "文本",
                  "可为空", "", "代表性博物馆图的 tooltip"),
    "rank_2023": ("2023年排名", "TEA/AECOM 报告中的全球排名", "名次", "可为空", "",
                  "全球代表性博物馆图"),

    # ---- 全国年度（备案口径） ----
    "registered_museums": ("备案博物馆数量", "在国家文物局登记备案的博物馆数量（含国有与非国有）",
                           "家", "未公开则为空", "", "KPI、全国博物馆数量趋势"),
    "museums": ("博物馆数量", "口径由 caliber 字段决定：备案口径或公报口径", "家/个",
                "未公开则为空", "", "全国博物馆数量趋势、KPI"),
    "visitors_100m": ("博物馆参观人次", "博物馆接待观众人次（亿人次）", "亿人次",
                      "未公开则为空", "原文值", "KPI、全国参观人次趋势"),
    "exhibitions_10k": ("举办陈列展览数", "博物馆举办的陈列展览数量（万个）", "万个",
                        "未公开则为空", "", "KPI、全国陈列展览趋势"),
    "free_open_museums": ("免费开放博物馆数", "向社会免费开放的博物馆数量", "家",
                          "未公开则为空", "", "核验用（当前未单独成图）"),

    # ---- 全国年度（文旅部公报口径） ----
    "relic_institutions": ("文物机构数", "文物保护管理机构+博物馆+文物商店+其他文物机构",
                           "个", "未公开则为空", "", "全国博物馆数量趋势（对照）"),
    "collections_all_wan": ("文物机构藏品", "全部文物机构拥有的藏品数量", "万件(套)",
                            "未公开则为空", "", "全国馆藏文物趋势（文物机构口径）"),
    "collections_museum_wan": ("博物馆文物藏品", "博物馆拥有的文物藏品数量（公报口径）",
                               "万件(套)", "未公开则为空", "",
                               "KPI、全国馆藏文物趋势（博物馆口径）"),
    "exhibitions_total": ("文物机构陈列展览数", "全部文物机构举办的陈列展览数量", "个",
                          "未公开则为空", "", "核验用"),
    "visitors_relic_wan": ("文物机构接待观众", "全部文物机构接待观众人次", "万人次",
                           "未公开则为空", "", "全国参观人次趋势（文物机构口径）"),
    "visitors_museum_wan": ("博物馆接待观众", "公报口径博物馆接待观众人次", "万人次",
                            "未公开则为空", "", "数据核对（与备案口径互为印证）"),

    # ---- 分省 ----
    "museum_count": ("博物馆数量", "该省博物馆机构数（中国统计年鉴表23-28口径）", "家",
                     "未获取到则为空，不填 0", "", "地图、四象限、分省排名"),
    "collection_count": ("馆藏数量", "该省博物馆藏品/文物藏品数量", "件(套)",
                         "未获取到则为空", "", "分省馆藏排名、四象限、散点图"),
    "precious_count": ("珍贵文物数量", "该省博物馆珍贵文物数量。**统计年鉴该表无此字段**，"
                      "仅广东一省可得，其余省份为空", "件(套)",
                      "除广东外全部未获取到，保持为空", "",
                      "数据字典登记（当前未成图，避免以个别省份代表全国）"),
    "visitors_wan": ("参观人次", "该省博物馆接待观众人次", "万人次", "未获取到则为空", "",
                     "分省参观排名、散点图、地图"),
    "exhibition_count": ("基本陈列展览数", "该省博物馆基本陈列展览数量，**不含临时展览**",
                         "个", "未获取到则为空", "", "分省展览供需图（口径已在文中标注）"),
    "population_wan": ("年末常住人口", "该省年末常住人口", "万人", "未获取到则为空", "",
                       "全部人口标准化派生指标"),

    # ---- 普查 ----
    "value": ("数值", "普查数据长表中的指标数值", "见 unit 字段", "未获取到则为空", "",
              "可移动文物等级结构与集聚图"),
    "share_pct": ("占比", "该指标占全国总量的百分比", "%", "来源未给出则为空", "",
                  "可移动文物集聚图"),
    "movable_relics_total": ("可移动文物总量", "普查登录的可移动文物数量（含档案馆纸质历史档案）",
                             "件/套", "未获取到则为空", "", "可移动文物空间集聚图"),
    "fine_relics_grade1": ("一级文物", "普查登录的一级文物数量", "件", "未获取到则为空", "",
                           "全国可移动文物等级结构图"),
    "fine_relics_grade2": ("二级文物", "普查登录的二级文物数量", "件", "未获取到则为空", "",
                           "全国可移动文物等级结构图"),
    "fine_relics_grade3": ("三级文物", "普查登录的三级文物数量", "件", "未获取到则为空", "",
                           "全国可移动文物等级结构图"),
    "general_relics": ("一般文物", "普查登录的一般文物数量", "件", "未获取到则为空", "",
                       "等级结构图的文字洞察"),
    "ungraded_relics": ("未定级文物", "普查登录的尚未定级文物数量", "件", "未获取到则为空",
                        "", "等级结构图的文字洞察"),
    "precious_relics": ("珍贵文物数量", "普查登录的珍贵文物（一/二/三级合计）数量", "件",
                        "未获取到则为空", "", "KPI、等级结构图"),

    # ---- 国际 ----
    "caliber_group": ("口径分组", "A=各国自报官方口径；B=UNESCO统一口径(2019)", "枚举",
                      "必填", "", "国际比较的口径切换"),
    "population_million": ("人口", "该国人口（B组为UNESCO报告同表数值，A组为世界银行2024年）",
                           "百万人", "未获取到则为空", "", "每百万人博物馆数量（国际）"),
    "population_year": ("人口年份", "population_million 所属年份", "年", "可为空", "",
                        "国际比较的口径说明"),

    # ---- 博物馆案例 ----
    "museum": ("博物馆英文名", "博物馆的英文名称（TEA/AECOM 报告原名）", "文本", "必填", "",
               "全球代表性博物馆图"),
    "museum_cn": ("博物馆中文名", "博物馆的中文名称", "文本", "必填", "",
                  "代表性博物馆各图"),
    "museum_en": ("博物馆英文名", "博物馆的英文名称", "文本", "可为空", "", "数据核对"),
    "annual_visitors_wan": ("年参观人次", "该馆当年参观人次", "万人次", "未获取到则为空", "",
                            "代表性博物馆各图"),
    "building_area_m2": ("建筑面积", "该馆建筑面积（或报告给出的楼板面积）", "平方米",
                         "官方未披露则为空", "", "代表性博物馆数据表"),
}

# 派生指标的定义直接来自 src/metrics.py，保证与实现代码一致
DERIVED = M.METRIC_DEFINITIONS

DERIVED_USED_IN = {
    "museums_per_million_population": "每百万人博物馆数量地图与排名、四象限",
    "visitors_per_million_population": "每百万人参观人次排名、首页公共文化服务图",
    "average_collections_per_museum": "平均每家博物馆馆藏排名",
    "average_visitors_per_museum": "平均每家博物馆参观人次排名",
    "visitors_per_exhibition": "平均每个展览参观人次排名",
    "visitors_per_100k_collections": "（已定义，当前未单独成图）",
    "precious_ratio": "珍贵文物比例（因分省数据不可得，当前未成图）",
    "museums_per_million": "每百万人博物馆数量（国际比较）",
}


def field_year_scope(df: pd.DataFrame) -> str:
    if "year" in df.columns:
        y = pd.to_numeric(df["year"], errors="coerce").dropna()
        if len(y):
            a, b = int(y.min()), int(y.max())
            return str(a) if a == b else f"{a}-{b}"
    return "-"


def field_geo(df: pd.DataFrame, meta: dict) -> str:
    if "province" in df.columns:
        return "China（分省）"
    if "country" in df.columns:
        return "International"
    return meta.get("geographic_scope", "China")


def main() -> int:
    reg = {}
    rp = C.METADATA / "dataset_registry.csv"
    if rp.exists():
        with rp.open(encoding="utf-8-sig", newline="") as fh:
            for row in csv.DictReader(fh):
                reg[row["file_name"]] = row

    rows = []
    for p in sorted(C.PROCESSED.glob("*.csv")):
        df = pd.read_csv(p, comment="#", encoding="utf-8-sig")
        meta = reg.get(p.name, {})
        ds_id = meta.get("dataset_id", f"UNREGISTERED_{p.stem}")
        ds_name = meta.get("dataset_name", p.stem)
        yr = field_year_scope(df)
        geo = field_geo(df, meta)

        for col in df.columns:
            if col in DERIVED:
                d = DERIVED[col]
                rows.append({
                    "field_name": col, "Chinese_name": d["chinese_name"],
                    "dataset_id": ds_id, "dataset_name": ds_name,
                    "definition": f"派生指标：{d['chinese_name']}",
                    "unit": d["unit"], "year": yr, "geographic_scope": geo,
                    "source": meta.get("source_ids", "本项目计算"),
                    "original_field": d["fields"],
                    "processing_method": "由 build_dataset.py 调用 src/metrics.py 计算",
                    "formula": d["formula"],
                    "missing_value_rule": d["missing_rule"],
                    "used_in_chart": DERIVED_USED_IN.get(col, "-"),
                })
            else:
                info = FIELD_DICT.get(col)
                if info:
                    cn, definition, unit, miss, formula, used = info
                else:
                    cn, definition, unit, miss, formula, used = (
                        col, "（未登记的字段，请补充字典）", "-", "-", "-", "-")
                rows.append({
                    "field_name": col, "Chinese_name": cn, "dataset_id": ds_id,
                    "dataset_name": ds_name, "definition": definition, "unit": unit,
                    "year": yr, "geographic_scope": geo,
                    "source": meta.get("source_ids", "-"),
                    "original_field": col,
                    "processing_method": "原始转录 / 清洗规范化（clean_data.py）",
                    "formula": formula, "missing_value_rule": miss,
                    "used_in_chart": used,
                })

    out = pd.DataFrame(rows)
    xlsx = C.METADATA / "data_dictionary.xlsx"
    try:
        out.to_excel(xlsx, index=False, sheet_name="data_dictionary")
        print(f"[写出] {xlsx.relative_to(ROOT)}  ({len(out)} 个字段)")
    except Exception as exc:  # noqa: BLE001 - openpyxl 缺失时退回 CSV
        csvp = C.METADATA / "data_dictionary.csv"
        out.to_csv(csvp, index=False, encoding="utf-8-sig")
        print(f"[warn] 写 xlsx 失败（{exc}），已改为 CSV：{csvp.relative_to(ROOT)}")

    # 同时保留一份 CSV，便于程序读取与 git diff
    out.to_csv(C.METADATA / "data_dictionary.csv", index=False, encoding="utf-8-sig")

    print(f"  数据集 {out['dataset_id'].nunique()} 个，字段 {len(out)} 个，"
          f"其中衍生指标 {int((out['processing_method'].str.contains('metrics.py')).sum())} 个")
    unregistered = out[out["Chinese_name"].str.contains("未登记", na=False)]
    if len(unregistered):
        print(f"  [!] 有 {len(unregistered)} 个字段未登记中文名："
              f"{sorted(set(unregistered['field_name']))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
