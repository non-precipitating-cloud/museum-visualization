# -*- coding: utf-8 -*-
"""派生指标计算。

设计原则（派生指标必须记录公式、来源字段、单位、数据来源）：
- 每个指标函数都写明：公式、单位、来源字段、缺测处理规则。
- **缺测一律返回 NULL，绝不填 0**。分母为 0 或缺失时返回 NULL。
- 指标一律标注为"描述性指标"，不做绩效/排名推断。
"""
from __future__ import annotations

import numpy as np
import pandas as pd

# 缺测判定：None、NaN、pd.NA 均视为缺测；0 是有效值，需区分对待
def _is_missing(v) -> bool:
    return v is None or (isinstance(v, float) and np.isnan(v)) or pd.isna(v)


def _safe_div(numer, denom):
    """安全除法：分子/分母任一缺测、或分母为 0 时返回 NaN（不是 0）。"""
    if _is_missing(numer) or _is_missing(denom):
        return np.nan
    if float(denom) == 0:
        return np.nan
    return float(numer) / float(denom)


# --------------------------------------------------------------------------
# 1. museums_per_million_population —— 每百万人博物馆数量
#    公式：museum_count / (population_wan / 100)
#    单位：家/百万人
#    来源字段：museum_count, population_wan（年末常住人口，万人）
#    缺测规则：任一字段缺测，或人口为 0 -> NULL
# --------------------------------------------------------------------------
def museums_per_million_population(museum_count, population_wan):
    return _safe_div(museum_count, _safe_div(population_wan, 100.0))


# --------------------------------------------------------------------------
# 2. visitors_per_million_population —— 每百万人参观人次
#    公式：visitors_wan / (population_wan / 100)
#    单位：万人次/百万人
#    来源字段：visitors_wan（参观人次，万人次）, population_wan
#    缺测规则：任一字段缺测，或人口为 0 -> NULL
# --------------------------------------------------------------------------
def visitors_per_million_population(visitors_wan, population_wan):
    return _safe_div(visitors_wan, _safe_div(population_wan, 100.0))


# --------------------------------------------------------------------------
# 3. visitors_per_capita —— 人均参观次数（次/人）
#    公式：visitors_wan * 10000 / (population_wan * 10000) = visitors_wan / population_wan
#    单位：次/人
#    说明：与"每百万人参观人次"互为同一信息的不同量纲表达，二者只保留一个用于展示，
#          本项目采用"每百万人参观人次"。
# --------------------------------------------------------------------------
def visitors_per_capita(visitors_wan, population_wan):
    return _safe_div(visitors_wan, population_wan)


# --------------------------------------------------------------------------
# 4. average_collections_per_museum —— 平均每家博物馆馆藏数量
#    公式：collection_count / museum_count
#    单位：件(套)/家
#    来源字段：collection_count（馆藏数量，件/套）, museum_count
#    缺测规则：任一字段缺测，或博物馆数为 0 -> NULL
# --------------------------------------------------------------------------
def average_collections_per_museum(collection_count, museum_count):
    return _safe_div(collection_count, museum_count)


# --------------------------------------------------------------------------
# 5. average_visitors_per_museum —— 平均每家博物馆参观人次
#    公式：visitors_wan / museum_count
#    单位：万人次/家
#    来源字段：visitors_wan, museum_count
#    缺测规则：任一字段缺测，或博物馆数为 0 -> NULL
# --------------------------------------------------------------------------
def average_visitors_per_museum(visitors_wan, museum_count):
    return _safe_div(visitors_wan, museum_count)


# --------------------------------------------------------------------------
# 6. visitors_per_exhibition —— 平均每个展览吸引的参观人次
#    公式：visitors_wan / exhibition_count
#    单位：万人次/个
#    来源字段：visitors_wan, exhibition_count（展览数量，个）
#    口径注意：分子为**全部参观人次**、分母为**当年举办展览数**，二者并非
#              严格分子分母对应关系（观众也可能来自未计入的常设陈列之外的活动），
#              因此仅作描述性参考，页面需注明。
# --------------------------------------------------------------------------
def visitors_per_exhibition(visitors_wan, exhibition_count):
    return _safe_div(visitors_wan, exhibition_count)


# --------------------------------------------------------------------------
# 7. visitors_per_100k_collections —— 每 10 万件藏品对应的参观人次
#    公式：visitors_wan / (collection_count / 100000)
#    单位：万人次/10万件
#    来源字段：visitors_wan, collection_count（件/套）
# --------------------------------------------------------------------------
def visitors_per_100k_collections(visitors_wan, collection_count):
    return _safe_div(visitors_wan, _safe_div(collection_count, 100_000.0))


# --------------------------------------------------------------------------
# 8. precious_ratio —— 珍贵文物比例
#    公式：precious_count / collection_count * 100
#    单位：%
#    来源字段：precious_count（珍贵文物数量，件/套）, collection_count
#    缺测规则：collection_count 缺测或为 0 -> NULL（不是 0%）
#    语义警告：本指标只反映"馆藏的数量结构"，**不能**解释为"文化价值高低"。
# --------------------------------------------------------------------------
def precious_ratio(precious_count, collection_count, as_percent: bool = True):
    r = _safe_div(precious_count, collection_count)
    if _is_missing(r):
        return np.nan
    return r * 100.0 if as_percent else r


# --------------------------------------------------------------------------
# 批量计算：对 DataFrame 逐行应用
# --------------------------------------------------------------------------
def add_province_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """为分省 DataFrame 追加全部派生指标列。

    要求的输入列（缺失列会导致对应指标为 NULL，不报错）：
        museum_count, collection_count, precious_count,
        visitors_wan, exhibition_count, population_wan
    """
    out = df.copy()

    def col(name):
        return out[name] if name in out.columns else pd.Series([np.nan] * len(out), index=out.index)

    out["museums_per_million_population"] = [
        museums_per_million_population(m, p) for m, p in zip(col("museum_count"), col("population_wan"))
    ]
    out["visitors_per_million_population"] = [
        visitors_per_million_population(v, p) for v, p in zip(col("visitors_wan"), col("population_wan"))
    ]
    out["average_collections_per_museum"] = [
        average_collections_per_museum(c, m) for c, m in zip(col("collection_count"), col("museum_count"))
    ]
    out["average_visitors_per_museum"] = [
        average_visitors_per_museum(v, m) for v, m in zip(col("visitors_wan"), col("museum_count"))
    ]
    out["visitors_per_exhibition"] = [
        visitors_per_exhibition(v, e) for v, e in zip(col("visitors_wan"), col("exhibition_count"))
    ]
    out["visitors_per_100k_collections"] = [
        visitors_per_100k_collections(v, c) for v, c in zip(col("visitors_wan"), col("collection_count"))
    ]
    out["precious_ratio"] = [
        precious_ratio(pc, c) for pc, c in zip(col("precious_count"), col("collection_count"))
    ]

    # 数值列为 NaN 时统一保留为 NaN，导出时写为空串（CSV 中即"缺测"）
    metric_cols = [c for c in out.columns if c not in df.columns]
    for c in metric_cols:
        out[c] = pd.to_numeric(out[c], errors="coerce")
    return out


METRIC_DEFINITIONS = {
    "museums_per_million_population": {
        "chinese_name": "每百万人博物馆数量", "unit": "家/百万人",
        "formula": "museum_count / (population_wan / 100)",
        "fields": "museum_count, population_wan",
        "missing_rule": "任一字段缺测或人口为 0 时为 NULL",
    },
    "visitors_per_million_population": {
        "chinese_name": "每百万人参观人次", "unit": "万人次/百万人",
        "formula": "visitors_wan / (population_wan / 100)",
        "fields": "visitors_wan, population_wan",
        "missing_rule": "任一字段缺测或人口为 0 时为 NULL",
    },
    "average_collections_per_museum": {
        "chinese_name": "平均每家博物馆馆藏数量", "unit": "件(套)/家",
        "formula": "collection_count / museum_count",
        "fields": "collection_count, museum_count",
        "missing_rule": "任一字段缺测或博物馆数为 0 时为 NULL",
    },
    "average_visitors_per_museum": {
        "chinese_name": "平均每家博物馆参观人次", "unit": "万人次/家",
        "formula": "visitors_wan / museum_count",
        "fields": "visitors_wan, museum_count",
        "missing_rule": "任一字段缺测或博物馆数为 0 时为 NULL",
    },
    "visitors_per_exhibition": {
        "chinese_name": "平均每个展览参观人次", "unit": "万人次/个",
        "formula": "visitors_wan / exhibition_count",
        "fields": "visitors_wan, exhibition_count",
        "missing_rule": "任一字段缺测或展览数为 0 时为 NULL",
    },
    "visitors_per_100k_collections": {
        "chinese_name": "每十万件藏品参观人次", "unit": "万人次/10万件",
        "formula": "visitors_wan / (collection_count / 100000)",
        "fields": "visitors_wan, collection_count",
        "missing_rule": "任一字段缺测或藏品数为 0 时为 NULL",
    },
    "precious_ratio": {
        "chinese_name": "珍贵文物比例", "unit": "%",
        "formula": "precious_count / collection_count * 100",
        "fields": "precious_count, collection_count",
        "missing_rule": "collection_count 缺测或为 0 时为 NULL",
    },
    # ------------------------------------------------------------------
    # 国际数据集的密度指标。注意它与上面的 museums_per_million_population
    # **不是同一个字段**：前者用于国际比较（分母单位是百万人，字段本身就叫
    # museums_per_million），后者用于分省比较（分母是人口万人换算）。两者
    # 数值含义相同、来源不同，刻意使用不同字段名以免在数据集中混淆。
    # ------------------------------------------------------------------
    "museums_per_million": {
        "chinese_name": "每百万人博物馆数量（国际）", "unit": "家/百万人",
        "formula": "museum_count / population_million",
        "fields": "museum_count, population_million",
        "missing_rule": "任一字段缺测或人口为 0 时为 NULL",
    },
}
