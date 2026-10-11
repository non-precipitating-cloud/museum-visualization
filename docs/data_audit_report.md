# 数据审计报告

> 本报告由 `scripts/data_audit.py` **自动生成**，所有数字均为程序实际统计结果，无任何人工填写的统计量。

## 一、总体规模

| 指标 | 数值 |
|---|---|
| 数据集总数（三层合计） | 22 |
| 其中 raw / clean / processed | 8 / 8 / 6 |
| 原始记录总数（raw） | 280 |
| 清洗后记录总数（clean） | 280 |
| 分析记录总数（processed） | 187 |
| processed 字段总数 | 65 |
| 其中衍生指标字段数 | 8 |
| 缺失值总数（三层合计） | 755 |
| 重复记录总数（三层合计） | 0 |
| 年份覆盖 | 2012 - 2025 |
| 覆盖省份数（去重） | 31 |
| 覆盖国家数 | 13 |
| 数据质量问题条数 | 0 |
| 交叉核对项数 | 11 |

## 二、逐数据集明细

| 数据集 ID | 数据集名称 | 层 | 记录数 | 字段数 | 其中衍生指标 | 年份 | 地理范围 | 粒度 | 缺失值 | 缺失率 | 重复 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `INTL_COUNTRY_MUSEUMS_06` | 世界主要国家博物馆数量 | raw | 18 | 9 | 0 | 2014-2024 | International | country×year | 2 | 1.23% | 0 |
| `INTL_MUSEUM_CASES_07` | 世界代表性博物馆年度参观人次（TEA/AECOM 2023） | raw | 20 | 9 | 0 | 2023-2023 | International | museum×year | 40 | 22.22% | 0 |
| `MUSEUM_CASES_OFFICIAL_08` | 代表性博物馆官方公布数据 | raw | 16 | 10 | 0 | 2023-2025 | International | museum×year | 12 | 7.5% | 0 |
| `CN_MOVABLE_RELIC_CENSUS_04` | 第一次全国可移动文物普查结果 | raw | 18 | 7 | 0 | - | China | metric | 9 | 7.14% | 0 |
| `CN_MUSEUM_YEARLY_REGISTERED_01` | 全国备案博物馆年度统计 | raw | 10 | 7 | 0 | 2015-2024 | China | year | 11 | 15.71% | 0 |
| `CN_MUSEUM_YEARLY_MCT_02` | 全国文物机构与博物馆年度统计 | raw | 12 | 12 | 0 | 2012-2024 | China | year | 39 | 27.08% | 0 |
| `CN_MUSEUM_PROVINCE_03` | 中国分地区博物馆基本情况 | raw | 93 | 8 | 0 | 2020-2022 | China | province×year | 92 | 12.37% | 0 |
| `CN_PROVINCE_POPULATION_05` | 中国分地区年末人口数 | raw | 93 | 4 | 0 | 2020-2022 | China | province×year | 0 | 0.0% | 0 |
| `INTL_COUNTRY_MUSEUMS_06` | 世界主要国家博物馆数量 | clean | 18 | 9 | 0 | 2014-2024 | International | country×year | 2 | 1.23% | 0 |
| `INTL_MUSEUM_CASES_07` | 世界代表性博物馆年度参观人次（TEA/AECOM 2023） | clean | 20 | 9 | 0 | 2023-2023 | International | museum×year | 40 | 22.22% | 0 |
| `MUSEUM_CASES_OFFICIAL_08` | 代表性博物馆官方公布数据 | clean | 16 | 10 | 0 | 2023-2025 | International | museum×year | 12 | 7.5% | 0 |
| `CN_MOVABLE_RELIC_CENSUS_04` | 第一次全国可移动文物普查结果 | clean | 18 | 7 | 0 | - | China | metric | 9 | 7.14% | 0 |
| `CN_MUSEUM_YEARLY_REGISTERED_01` | 全国备案博物馆年度统计 | clean | 10 | 7 | 0 | 2015-2024 | China | year | 11 | 15.71% | 0 |
| `CN_MUSEUM_YEARLY_MCT_02` | 全国文物机构与博物馆年度统计 | clean | 12 | 12 | 0 | 2012-2024 | China | year | 39 | 27.08% | 0 |
| `CN_MUSEUM_PROVINCE_03` | 中国分地区博物馆基本情况 | clean | 93 | 8 | 0 | 2020-2022 | China | province×year | 92 | 12.37% | 0 |
| `CN_PROVINCE_POPULATION_05` | 中国分地区年末人口数 | clean | 93 | 4 | 0 | 2020-2022 | China | province×year | 0 | 0.0% | 0 |
| `CN_CENSUS_RELICS_10` | 可移动文物普查分析数据集 | processed | 18 | 7 | 0 | - | China | metric | 9 | 7.14% | 0 |
| `INTL_COUNTRY_11` | 国际比较分析数据集 | processed | 18 | 10 | 1 | 2014-2024 | International | country×year | 3 | 1.67% | 0 |
| `INTL_MUSEUM_CASES_07` | 世界代表性博物馆年度参观人次（TEA/AECOM 2023） | processed | 20 | 9 | 0 | 2023-2023 | International | museum×year | 40 | 22.22% | 0 |
| `MUSEUM_CASES_OFFICIAL_08` | 代表性博物馆官方公布数据 | processed | 16 | 10 | 0 | 2023-2025 | International | museum×year | 12 | 7.5% | 0 |
| `CN_MUSEUM_YEARLY_08` | 全国年度分析数据集（合并） | processed | 22 | 12 | 0 | 2012-2024 | China | year | 97 | 36.74% | 0 |
| `CN_PROVINCE_YEAR_09` | 分省分析数据集（含派生指标） | processed | 93 | 17 | 7 | 2020-2022 | China | province×year | 184 | 11.64% | 0 |

## 三、数据集与来源对应

| 数据集 ID | 数据集名称 | 来源 ID |
|---|---|---|
| `INTL_COUNTRY_MUSEUMS_06` | 世界主要国家博物馆数量 | SRC_UNESCO_2021;SRC_IMLS_US;SRC_DE_IFM_2023;SRC_FR_MDF;SRC_KR_MCST;SRC_WB_POP;SRC_NCHA_2024 |
| `INTL_MUSEUM_CASES_07` | 世界代表性博物馆年度参观人次（TEA/AECOM 2023） | SRC_TEA_2023 |
| `MUSEUM_CASES_OFFICIAL_08` | 代表性博物馆官方公布数据 | SRC_CNM_2024;SRC_DPM_SITE;SRC_DPM_VISITORS;SRC_SXHM_2024;SRC_HNM_2024;SRC_SHM_2024;SRC_ZJM_2023;SRC_HBM_2024;SRC_HNMU_2024;SRC_LNM_2024;SRC_NJM;SRC_LOUVRE_2024;SRC_BM_2025;SRC_MET_FY2024;SRC_VATICAN_2024;SRC_NMK_2024;SRC_TNM_FY2024;SRC_NPM_2025 |
| `CN_MOVABLE_RELIC_CENSUS_04` | 第一次全国可移动文物普查结果 | SRC_CENSUS_2017;SRC_CENSUS_WORKREPORT;SRC_CENSUS_XINHUA;SRC_SX_WWJ_2021 |
| `CN_MUSEUM_YEARLY_REGISTERED_01` | 全国备案博物馆年度统计 | SRC_NCHA_2015;SRC_NCHA_2016;SRC_NCHA_2017;SRC_NCHA_2018;SRC_NCHA_2019;SRC_NCHA_2020;SRC_NCHA_2021;SRC_NCHA_2022;SRC_NCHA_2023;SRC_NCHA_2024 |
| `CN_MUSEUM_YEARLY_MCT_02` | 全国文物机构与博物馆年度统计 | SRC_MCT_2012;SRC_MCT_2013;SRC_MCT_2014;SRC_MCT_2016;SRC_MCT_2017;SRC_MCT_2018;SRC_MCT_2019;SRC_MCT_2020;SRC_MCT_2021;SRC_MCT_2022;SRC_MCT_2023;SRC_MCT_2024 |
| `CN_MUSEUM_PROVINCE_03` | 中国分地区博物馆基本情况 | SRC_CSY_2023_C2328;SRC_CSY_2022_C2328;SRC_CSY_2021_C2328;SRC_GD_MUSEUM_2022 |
| `CN_PROVINCE_POPULATION_05` | 中国分地区年末人口数 | SRC_CSY_2023_C0205 |
| `INTL_COUNTRY_MUSEUMS_06` | 世界主要国家博物馆数量 | SRC_UNESCO_2021;SRC_IMLS_US;SRC_DE_IFM_2023;SRC_FR_MDF;SRC_KR_MCST;SRC_WB_POP;SRC_NCHA_2024 |
| `INTL_MUSEUM_CASES_07` | 世界代表性博物馆年度参观人次（TEA/AECOM 2023） | SRC_TEA_2023 |
| `MUSEUM_CASES_OFFICIAL_08` | 代表性博物馆官方公布数据 | SRC_CNM_2024;SRC_DPM_SITE;SRC_DPM_VISITORS;SRC_SXHM_2024;SRC_HNM_2024;SRC_SHM_2024;SRC_ZJM_2023;SRC_HBM_2024;SRC_HNMU_2024;SRC_LNM_2024;SRC_NJM;SRC_LOUVRE_2024;SRC_BM_2025;SRC_MET_FY2024;SRC_VATICAN_2024;SRC_NMK_2024;SRC_TNM_FY2024;SRC_NPM_2025 |
| `CN_MOVABLE_RELIC_CENSUS_04` | 第一次全国可移动文物普查结果 | SRC_CENSUS_2017;SRC_CENSUS_WORKREPORT;SRC_CENSUS_XINHUA;SRC_SX_WWJ_2021 |
| `CN_MUSEUM_YEARLY_REGISTERED_01` | 全国备案博物馆年度统计 | SRC_NCHA_2015;SRC_NCHA_2016;SRC_NCHA_2017;SRC_NCHA_2018;SRC_NCHA_2019;SRC_NCHA_2020;SRC_NCHA_2021;SRC_NCHA_2022;SRC_NCHA_2023;SRC_NCHA_2024 |
| `CN_MUSEUM_YEARLY_MCT_02` | 全国文物机构与博物馆年度统计 | SRC_MCT_2012;SRC_MCT_2013;SRC_MCT_2014;SRC_MCT_2016;SRC_MCT_2017;SRC_MCT_2018;SRC_MCT_2019;SRC_MCT_2020;SRC_MCT_2021;SRC_MCT_2022;SRC_MCT_2023;SRC_MCT_2024 |
| `CN_MUSEUM_PROVINCE_03` | 中国分地区博物馆基本情况 | SRC_CSY_2023_C2328;SRC_CSY_2022_C2328;SRC_CSY_2021_C2328;SRC_GD_MUSEUM_2022 |
| `CN_PROVINCE_POPULATION_05` | 中国分地区年末人口数 | SRC_CSY_2023_C0205 |
| `CN_CENSUS_RELICS_10` | 可移动文物普查分析数据集 | SRC_CENSUS_2017 |
| `INTL_COUNTRY_11` | 国际比较分析数据集 | SRC_UNESCO_2021;SRC_WB_POP |
| `INTL_MUSEUM_CASES_07` | 世界代表性博物馆年度参观人次（TEA/AECOM 2023） | SRC_TEA_2023 |
| `MUSEUM_CASES_OFFICIAL_08` | 代表性博物馆官方公布数据 | SRC_CNM_2024;SRC_DPM_SITE;SRC_DPM_VISITORS;SRC_SXHM_2024;SRC_HNM_2024;SRC_SHM_2024;SRC_ZJM_2023;SRC_HBM_2024;SRC_HNMU_2024;SRC_LNM_2024;SRC_NJM;SRC_LOUVRE_2024;SRC_BM_2025;SRC_MET_FY2024;SRC_VATICAN_2024;SRC_NMK_2024;SRC_TNM_FY2024;SRC_NPM_2025 |
| `CN_MUSEUM_YEARLY_08` | 全国年度分析数据集（合并） | SRC_NCHA_2015;SRC_MCT_2012 |
| `CN_PROVINCE_YEAR_09` | 分省分析数据集（含派生指标） | SRC_CSY_2023_C2328;SRC_CSY_2023_C0205 |

## 四、数据质量检查结果

未发现问题。


> 数据质量问题**只记录、不静默修改**。所有处置方式见 `docs/data_quality_report.md`。


## 五、交叉核对：分省合计 vs 全国数

| 核对项 | 分省合计 | 全国数 | 差额 | 差额占比 | 单位 | 判断 |
|---|---|---|---|---|---|---|
| 2020 年 博物馆数量：分省合计 vs 全国数 | 5,447.0 | 5,452.0 | -5.0 | -0.092% | 个 | 正常范围 |
| 2021 年 博物馆数量：分省合计 vs 全国数 | 5,767.0 | 5,772.0 | -5.0 | -0.087% | 个 | 正常范围 |
| 2020 年 博物馆文物藏品：分省合计 vs 全国数 | 3,981.68 | 4,319.09 | -337.41 | -7.812% | 万件(套) | **差异较大，疑为口径变更** |
| 2021 年 博物馆文物藏品：分省合计 vs 全国数 | 4,322.99 | 4,664.83 | -341.84 | -7.328% | 万件(套) | **差异较大，疑为口径变更** |
| 2022 年 博物馆文物藏品：分省合计 vs 全国数 | 4,347.85 | 4,691.61 | -343.76 | -7.327% | 万件(套) | **差异较大，疑为口径变更** |
| 2020 年 博物馆参观人次：分省合计 vs 全国数 | 52,036.0 | 52,652.35 | -616.35 | -1.171% | 万人次 | 正常范围 |
| 2021 年 博物馆参观人次：分省合计 vs 全国数 | 73,757.0 | 74,850.45 | -1,093.45 | -1.461% | 万人次 | 正常范围 |
| 2022 年 博物馆参观人次：分省合计 vs 全国数 | 56,465.0 | 45,647.0 | +10,818.0 | +23.699% | 万人次 | **差异较大，疑为口径变更** |
| 2020 年 年末人口：分省合计 vs 全国数 | 141,013.0 | 141,212.0 | -199.0 | -0.141% | 万人 | 正常范围 |
| 2021 年 年末人口：分省合计 vs 全国数 | 141,060.0 | 141,260.0 | -200.0 | -0.142% | 万人 | 正常范围 |
| 2022 年 年末人口：分省合计 vs 全国数 | 140,975.0 | 141,175.0 | -200.0 | -0.142% | 万人 | 正常范围 |

**最重要的一个发现**：2022 年「博物馆参观人次」的分省合计（统计年鉴口径）比全国数（文化和旅游部公报口径）高出约 23.7%。原因不是数据错误，而是**文化和旅游部自 2022 年起把公报中的博物馆口径改为「文物系统管理的国有博物馆」**，而《中国统计年鉴》表 23-28 仍沿用「博物馆」口径。这一处差异从数据上**印证了本项目反复强调的口径断点确实存在**。


> **这说明：「把分省数据加总当作全国数据」是不成立的。**分地区表的合计与全国行存在系统性差额（未分配到省的中央级单位、统计范围差异等）。本项目的全国趋势图一律直接使用**官方公布的全国数**，分省图一律使用**分省表本身的数**，两者不互相推算、不互相校验后强行对齐。


## 六、缺失值处理原则

本项目**不使用「把 NaN 一律填 0」的处理方式**。缺失按字段语义区分：

- **未统计 / 未公开**：保留为空值（NULL），可视化显示「暂无数据」，并在图注说明；
- **不适用**：保留为 NULL，不参与派生指标计算；
- **真实的 0**：仅当来源明确给出数值 0 时才保留 0。

派生指标在分子或分母缺测、或分母为 0 时一律返回 NULL，因此衍生指标字段的缺失数高于基础字段是**预期行为**。


## 七、数据局限性

1. **两套统计口径并存**：国家文物局「备案博物馆」口径与文化和旅游部《统计公报》「文物机构 / 博物馆」口径的统计范围不同（如 2019 年分别为 5535 家与 5132 个），本项目**严格分列，不混用、不互相换算**；
2. **珍贵文物的口径**：公报中公布的一级/二级/三级文物数是「文物机构」口径（含文物保护管理机构、文物商店等），**不是博物馆口径**，因此不能作为「博物馆珍贵文物」使用；本项目对珍贵文物的分析改用**第一次全国可移动文物普查**（2016 年 10 月 31 日时点）数据，并明确标注口径；
3. **分省可移动文物仅公开前五名**：国家《第一次全国可移动文物普查数据公报》正文只列出数量最多的五省市，其余省份的完整表格以图片形式存在，无法提取，因此分省分析仅覆盖可获取的省份；
4. **国际比较的年份与口径不一致**：各国博物馆定义、统计年份、统计范围存在差异，比较结果只用于观察规模与发展特征，**不构成全球排名**；
5. **2010—2012 年**缺少官方公开的博物馆统计（《文化发展统计公报》自 2013 年起发布），故时间序列自数据实际可得年份开始，**不向前补齐**。
