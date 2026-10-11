# -*- coding: utf-8 -*-
"""项目全局配置：路径、省级行政区清单、区域划分。

说明：
- 省级清单采用**国家统计局**统计用区划口径（31 个省级行政区，不含港澳台）。
- 港澳台因缺少可比的博物馆统计公开数据，**不纳入**本项目的省级分析；
  地图上仍会绘制其边界，但数值显示"暂无数据"。
- 区域划分（东部/中部/西部/东北）采用**国家统计局**的四大区域划分标准。
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------- 目录
DATA = ROOT / "data"
RAW = DATA / "raw"
CLEAN = DATA / "clean"
PROCESSED = DATA / "processed"
METADATA = DATA / "metadata"
DOCS = ROOT / "docs"
WEB = ROOT / "web"
WEB_DATA = WEB / "data"
TESTS = ROOT / "tests"
FIXTURES = TESTS / "fixtures"

RAW_STAT = RAW / "museum_statistics"
RAW_POP = RAW / "population"
RAW_INTL = RAW / "international"
RAW_CASES = RAW / "museum_cases"

for _d in (RAW_STAT, RAW_POP, RAW_INTL, RAW_CASES, CLEAN, PROCESSED, METADATA,
           DOCS, WEB_DATA, FIXTURES):
    _d.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------- 省份
# 国家统计局四大区域划分
REGION_EAST = ["北京", "天津", "河北", "上海", "江苏", "浙江", "福建", "山东", "广东", "海南"]
REGION_CENTRAL = ["山西", "安徽", "江西", "河南", "湖北", "湖南"]
REGION_WEST = ["内蒙古", "广西", "重庆", "四川", "贵州", "云南", "西藏",
               "陕西", "甘肃", "青海", "宁夏", "新疆"]
REGION_NORTHEAST = ["辽宁", "吉林", "黑龙江"]

REGION_OF = {}
for _r, _ps in (("东部", REGION_EAST), ("中部", REGION_CENTRAL),
                ("西部", REGION_WEST), ("东北", REGION_NORTHEAST)):
    for _p in _ps:
        REGION_OF[_p] = _r

PROVINCES = REGION_EAST + REGION_CENTRAL + REGION_WEST + REGION_NORTHEAST
assert len(PROVINCES) == 31, f"省级行政区应为 31 个，实际 {len(PROVINCES)}"

REGIONS = ["东部", "中部", "西部", "东北"]

# 前端筛选用的地域（地图中也存在但本项目无统计数据，统一展示"暂无数据"）
NO_DATA_REGIONS = ["香港", "澳门", "台湾"]

# ---------------------------------------------------------------- 口径
# 两套博物馆统计口径，全项目严格区分，禁止混用
CALIBER_REGISTERED = "NCHA_REGISTERED"   # 国家文物局：备案博物馆
CALIBER_MCT = "MCT_MUSEUM"               # 文化和旅游部公报：文物机构/博物馆口径

CALIBER_LABEL = {
    CALIBER_REGISTERED: "国家文物局备案博物馆口径",
    CALIBER_MCT: "文化和旅游部统计公报口径（文物机构/博物馆）",
}

# ---------------------------------------------------------------- 颜色主题
# 与 web/css/theme.css 中的 CSS 变量保持一致
PALETTE = {
    "bg": "#0a1420",
    "panel": "#101f30",
    "accent": "#3ec9d6",      # 青
    "accent2": "#4a90d9",     # 蓝
    "warm": "#d9a441",        # 暖金（文化强调色）
    "warm2": "#c9705a",
    "text": "#e6eef5",
    "muted": "#7f95a8",
    "region": {
        "东部": "#3ec9d6",
        "中部": "#4a90d9",
        "西部": "#d9a441",
        "东北": "#c9705a",
    },
}

# 缺测统一展示文案
NO_DATA_LABEL = "暂无数据"
