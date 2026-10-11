# -*- coding: utf-8 -*-
"""数据加载：统一读取 processed 层的数据集。

所有加载函数都保持一个约定：
- 数值列用 pandas 的 numeric 转换，**无法解析的值保持 NaN**，绝不填 0；
- 空字符串按缺失处理；
- 缺列时返回空 DataFrame 而不是抛异常，以便分析脚本优雅降级。
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from . import config as C


def load(name: str, layer: Path | None = None) -> pd.DataFrame:
    """按文件名读取数据集（默认从 data/processed/ 读）。"""
    base = layer or C.PROCESSED
    p = Path(base) / name
    if not p.exists():
        return pd.DataFrame()
    df = pd.read_csv(p, comment="#", encoding="utf-8-sig")
    # 空字符串 → NaN（保持"缺测"语义，不填 0）
    return df.replace(r"^\s*$", np.nan, regex=True)


def national_yearly() -> pd.DataFrame:
    """全国年度序列（两套口径分列）。"""
    df = load("national_yearly.csv")
    if not len(df):
        return df
    for c in ("year", "museums", "visitors_100m", "exhibitions_10k",
              "collections_museum_wan", "collections_all_wan",
              "visitors_relic_wan", "relic_institutions"):
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")
    return df


def registered_series() -> pd.DataFrame:
    """仅国家文物局「备案博物馆」口径，按年份升序。"""
    df = national_yearly()
    if not len(df):
        return df
    return df[df["caliber"] == C.CALIBER_REGISTERED].sort_values("year").reset_index(drop=True)


def mct_series() -> pd.DataFrame:
    """仅文化和旅游部公报口径，按年份升序。"""
    df = national_yearly()
    if not len(df):
        return df
    return df[df["caliber"] == C.CALIBER_MCT].sort_values("year").reset_index(drop=True)


def province_year() -> pd.DataFrame:
    """分省数据集（含派生指标）。"""
    df = load("province_year.csv")
    if not len(df):
        return df
    for c in df.columns:
        if c in ("province", "region"):
            continue
        df[c] = pd.to_numeric(df[c], errors="coerce")
    return df


def province_latest() -> pd.DataFrame:
    """分省数据集的最新一年截面。"""
    df = province_year()
    if not len(df):
        return df
    return df[df["year"] == df["year"].max()].reset_index(drop=True)


def census() -> pd.DataFrame:
    df = load("census_relics.csv")
    if len(df) and "value" in df.columns:
        df["value"] = pd.to_numeric(df["value"], errors="coerce")
        df["share_pct"] = pd.to_numeric(df["share_pct"], errors="coerce")
    return df


def international() -> pd.DataFrame:
    df = load("international_country.csv")
    if len(df):
        for c in ("year", "museum_count", "population_million", "museums_per_million"):
            if c in df.columns:
                df[c] = pd.to_numeric(df[c], errors="coerce")
    return df


def museum_cases(official: bool = False) -> pd.DataFrame:
    name = "museum_cases_official.csv" if official else "museum_cases.csv"
    df = load(name)
    if len(df):
        for c in ("year", "annual_visitors_wan", "collection_count",
                  "building_area_m2", "rank_2023"):
            if c in df.columns:
                df[c] = pd.to_numeric(df[c], errors="coerce")
    return df
