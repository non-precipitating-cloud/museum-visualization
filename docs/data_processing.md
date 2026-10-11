# 数据处理日志

> 本文件由 `scripts/build_docs.py` 自动生成（2026-10-08 14:40 UTC）。
> 所有条数与字段数来自 `data/metadata/clean_log.json` 与 `data/metadata/data_audit.csv`，**非人工填写**。

## 一、数据链条

```
官方公开来源  →  data/raw/  →  data/clean/  →  data/processed/  →  web/data/  →  图表
              人工转录      clean_data.py   build_dataset.py   build_web_data.py
```

**原始数据（data/raw/）永不覆盖。** 每个原始文件开头都用 `#` 注释写明：数据集 ID、名称、**统计口径**、缺失值含义、单位，以及最重要的——该口径与其他口径不可混用的警告。

## 二、原始数据清单

| 文件 | 记录数 | 字段数 |
|---|---|---|
| `data/raw/international/country_museums.csv` | 18 | 9 |
| `data/raw/museum_cases/museum_cases.csv` | 20 | 9 |
| `data/raw/museum_cases/museum_cases_official.csv` | 16 | 10 |
| `data/raw/museum_statistics/national_movable_relics_census.csv` | 18 | 7 |
| `data/raw/museum_statistics/national_registered_museums.csv` | 10 | 7 |
| `data/raw/museum_statistics/national_relief_institutions.csv` | 12 | 12 |
| `data/raw/museum_statistics/province_museums.csv` | 93 | 8 |
| `data/raw/population/province_population.csv` | 93 | 4 |
| **合计** | **280** | 66（含重复列名） |

## 三、清洗动作（逐数据集）

### national_registered_museums.csv

| 动作 | 说明 | 影响条数 |
|---|---|---|
| 删除完全重复记录 | 整行内容完全相同 | 0 |
| 清洗后记录数 | 原始 10 条 | 10 |

### national_relief_institutions.csv

| 动作 | 说明 | 影响条数 |
|---|---|---|
| 删除完全重复记录 | 整行内容完全相同 | 0 |
| 清洗后记录数 | 原始 12 条 | 12 |

### national_movable_relics_census.csv

| 动作 | 说明 | 影响条数 |
|---|---|---|
| 删除完全重复记录 | 整行内容完全相同 | 0 |
| 标准化省份名称 | `area` 统一为简称 | 0 |
| 清洗后记录数 | 原始 18 条 | 18 |

### province_population.csv

| 动作 | 说明 | 影响条数 |
|---|---|---|
| 删除完全重复记录 | 整行内容完全相同 | 0 |
| 标准化省份名称 | `province` 统一为简称 | 0 |
| 清洗后记录数 | 原始 93 条 | 93 |

### province_museums.csv

| 动作 | 说明 | 影响条数 |
|---|---|---|
| 删除完全重复记录 | 整行内容完全相同 | 0 |
| 标准化省份名称 | `province` 统一为简称 | 0 |
| 清洗后记录数 | 原始 93 条 | 93 |

### country_museums.csv

| 动作 | 说明 | 影响条数 |
|---|---|---|
| 删除完全重复记录 | 整行内容完全相同 | 0 |
| 清洗后记录数 | 原始 18 条 | 18 |

### museum_cases.csv

| 动作 | 说明 | 影响条数 |
|---|---|---|
| 删除完全重复记录 | 整行内容完全相同 | 0 |
| 清洗后记录数 | 原始 20 条 | 20 |

### museum_cases_official.csv

| 动作 | 说明 | 影响条数 |
|---|---|---|
| 删除完全重复记录 | 整行内容完全相同 | 0 |
| 清洗后记录数 | 原始 16 条 | 16 |

## 四、清洗后的数据量

| 层 | 数据集数 | 记录数 | 字段数 | 缺失单元格 | 重复记录 |
|---|---|---|---|---|---|
| 原始数据 raw | 8 | 280 | 66 | 205 | 0 |
| 清洗后 clean | 8 | 280 | 66 | 205 | 0 |
| 分析数据 processed | 6 | 187 | 65 | 345 | 0 |

## 五、字段转换与单位统一

- **单位统一**：`visitors_100m` 统一为**亿人次**、`visitors_wan` 统一为**万人次**、`collections_*_wan` 统一为**万件(套)**、`population_wan` 统一为**万人**；
- **数值解析**：清洗脚本可识别 `1,234.5`、`12.9亿`、`3.0万` 等写法并转为数值；
- **无法转换的值**：一律保持为空（NaN），**绝不填 0**；
- **省份名称**：统一为简称（北京、内蒙古、广西、新疆…），与国家统计局区划及地图边界名称对齐；
- **区域字段**：按国家统计局四大区域划分新增 `region` 列。

## 六、新增的衍生指标

| 指标 | 单位 | 公式 | 新增条数 |
|---|---|---|---|
| `museums_per_million_population` | 家/百万人 | `museum_count / (population_wan / 100)` | 见 processed 逐数据集行数 |
| `visitors_per_million_population` | 万人次/百万人 | `visitors_wan / (population_wan / 100)` | 见 processed 逐数据集行数 |
| `average_collections_per_museum` | 件(套)/家 | `collection_count / museum_count` | 见 processed 逐数据集行数 |
| `average_visitors_per_museum` | 万人次/家 | `visitors_wan / museum_count` | 见 processed 逐数据集行数 |
| `visitors_per_exhibition` | 万人次/个 | `visitors_wan / exhibition_count` | 见 processed 逐数据集行数 |
| `visitors_per_100k_collections` | 万人次/10万件 | `visitors_wan / (collection_count / 100000)` | 见 processed 逐数据集行数 |
| `precious_ratio` | % | `precious_count / collection_count * 100` | 见 processed 逐数据集行数 |
| `museums_per_million` | 家/百万人 | `museum_count / population_million` | 见 processed 逐数据集行数 |

衍生指标字段共 **8** 个。

## 七、未使用的数据与原因

| 数据 | 处理 | 原因 |
|---|---|---|
| 分省「博物馆珍贵文物数量」 | **未使用**（仅广东一省可得） | 《中国统计年鉴》表 23-28 无此字段，无法形成分省序列，不推算 |
| 一/二/三级文物（2013、2014、2016） | **未作为博物馆珍贵文物使用** | 公报原文核实为「文物机构」口径（含文物保护管理机构、文物商店等），不是博物馆口径 |
| 分省可移动文物（其余省份） | **未使用** | 国家普查公报正文只公布前五名，其余以图片形式存在、无法提取 |
| `visitors_per_100k_collections` | **已定义未成图** | 与「每十万件藏品参观人次」同义的图表已由其他指标覆盖，避免重复图 |
| `precious_ratio` | **已定义未成图** | 分省珍贵文物数据不可得，该指标仅在广东等个别省份有值，不足以支撑图表 |
| 国家文物局分省年报家数接口 | **未并入主表** | 该接口口径为「提交年报的博物馆家数」，与年鉴「机构数」口径不同 |

## 八、KPI 与其统计年份

不同指标的最新可得年份不同，因此**每个 KPI 各自标注年份与口径**，不做跨年混算：

| KPI | 数值 | 单位 | 年份 | 口径 | 同比 |
|---|---|---|---|---|---|
| 备案博物馆数量 | 7,046.0 | 家 | 2024 | 国家文物局备案博物馆口径 | +3.1%（较 2023） |
| 博物馆文物藏品 | 4,691.6 | 万件(套) | 2022 | 文化和旅游部公报·博物馆口径 | — |
| 珍贵文物 | 385.6 | 万件 | 2016 | 第一次全国可移动文物普查·国有单位口径 | — |
| 博物馆参观人次 | 14.9 | 亿人次 | 2024 | 国家文物局博物馆口径 | +15.5%（较 2023） |
| 举办陈列展览 | 4.3 | 万个 | 2024 | 国家文物局博物馆口径 | +7.5%（较 2023） |

> 同比由 `scripts/build_dataset.py` 用相邻两年**真实数值**计算；基期缺测或为 0 时返回空，页面显示「—」，**不做任何估算**。
