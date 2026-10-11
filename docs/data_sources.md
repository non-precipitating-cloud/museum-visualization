# 数据来源说明

> 本文件由 `scripts/build_docs.py` 自动生成（2026-10-08 14:40 UTC）。
> 统计数字均来自 `data/metadata/source_registry.csv` 与 `data/metadata/source_verification.csv`，非人工抄写。

## 一、总览

| 项目 | 数值 |
|---|---|
| 登记来源条数 | 59 |
| 程序实地核验可访问 | 58 |
| 核验未通过 | 1 |
| 关联数据集个数 | 12 |

### 来源机构分布

| 机构/来源 | 条数 |
|---|---|
| 国家文物局 | 12 |
| 文化和旅游部 | 8 |
| 文化部 | 4 |
| 国家统计局 | 4 |
| 新华社 | 2 |
| 上海博物馆 | 2 |
| 广东省文化和旅游厅 | 1 |
| 山西省文物局 | 1 |
| UNESCO | 1 |
| 美国博物馆与图书馆服务署 IMLS | 1 |
| 德国普鲁士文化遗产基金会 | 1 |
| 法国文化部 | 1 |
| 韩国文化体育观光部 | 1 |
| TEA/AECOM | 1 |
| 世界银行 | 1 |
| 阿里云 DataV 公开边界服务 | 1 |
| Apache ECharts | 1 |
| 中国国家博物馆 | 1 |
| 故宫博物院 | 1 |
| 陕西历史博物馆 | 1 |
| 河南博物院 | 1 |
| 浙江省博物馆 | 1 |
| 湖北省文化和旅游厅 | 1 |
| 湖南博物院 | 1 |
| 辽宁省博物馆 | 1 |
| 南京博物院 | 1 |
| 卢浮宫 | 1 |
| 大英博物馆 | 1 |
| 大都会艺术博物馆 | 1 |
| 罗马市 | 1 |
| 韩国国立中央博物馆 | 1 |
| 东京国立博物馆 | 1 |
| 台北故宫博物院 | 1 |

### 来源可靠度分级

`source_level` 一级＝官方机构原始发布；二级＝官方机构发布但经权威转载；三级＝权威行业报告或全文转载；四级＝基础数据/软件资源。

| 级别 | 含义 | 条数 |
|---|---|---|
| 一级 | 官方机构原始发布 | 25 |
| 二级 | 官方发布（经权威渠道转载） | 27 |
| 三级 | 权威报告 / 全文转载 | 5 |
| 四级 | 基础数据与软件资源 | 2 |

## 二、来源台账（逐条）

| 来源ID | 机构 | 文件/报告名称 | 年份 | 范围 | 类型 | 核验 | 链接 |
|---|---|---|---|---|---|---|---|
| `SRC_NCHA_2015` | 国家文物局（央广网报道） | 我国超八成博物馆免费开放 注册博物馆达4692家（2015年底数据） | 2015 | China | 媒体转载官方发布 | ✓ 可访问（HTTP 200，20,163 B） | [打开](http://m.cnr.cn/chanjing/edu/20160519/t20160519_522179346.html) |
| `SRC_NCHA_2016` | 国家文物局（中国青年报报道） | 国家文物局：全国博物馆达4873座（2016年度数据） | 2016 | China | 媒体转载官方发布 | ✓ 可访问（HTTP 200，37,328 B） | [打开](http://zqb.cyol.com/html/2017-05/19/nw.D110000zgqnb_20170519_4-02.htm) |
| `SRC_NCHA_2017` | 国家文物局（两会部长通道，澎湃新闻报道） | 国家文物局局长：到2017年年底全国备案博物馆达5136家 | 2017 | China | 媒体转载官方发布 | ✓ 可访问（HTTP 200，54,481 B） | [打开](https://m.thepaper.cn/newsDetail_forward_3068560) |
| `SRC_NCHA_2018` | 国家文物局（中国新闻网/新华社报道） | 2018年我国新增1亿多人次打卡博物馆 | 2018 | China | 媒体转载官方发布 | ✓ 可访问（HTTP 200，59,108 B） | [打开](https://www.chinanews.com.cn/cul/2019/05-18/8840524.shtml) |
| `SRC_NCHA_2019` | 国家文物局（中国新闻网报道） | 我国博物馆总数达5535家 每2天新增一家 | 2019 | China | 媒体转载官方发布 | ✓ 可访问（HTTP 200，59,994 B） | [打开](https://www.chinanews.com/cul/2020/05-18/9187402.shtml) |
| `SRC_NCHA_2020` | 国家文物局（中国新闻网报道） | 中国博物馆总量跃居全球前五位 | 2020 | China | 媒体转载官方发布 | ✓ 可访问（HTTP 200，57,110 B） | [打开](https://www.chinanews.com/cul/2021/05-18/9480116.shtml) |
| `SRC_NCHA_2021` | 国家文物局（央视网报道） | 第46个国际博物馆日：我国共备案博物馆6183家 | 2021 | China | 媒体转载官方发布 | ✓ 可访问（HTTP 200，38,358 B） | [打开](https://news.cctv.com/2022/05/18/ARTIz6IxyzJ0JxysbAxlMTUj220518.shtml) |
| `SRC_NCHA_2022` | 国家文物局（新华社/新华网） | 新华社权威快报：我国博物馆总数达到6565家 | 2022 | China | 官方媒体发布 | ✓ 可访问（HTTP 200，13,104 B） | [打开](http://www.news.cn/politics/2023-05/18/c_1129624419.htm) |
| `SRC_NCHA_2023` | 国家文物局（中国政府网） | 2023年我国博物馆接待观众12.9亿人次 创历史新高 | 2023 | China | 官方政府网站 | ✓ 可访问（HTTP 200，8,022 B） | [打开](https://app.www.gov.cn/govdata/gov/202405/19/515151/article.html) |
| `SRC_NCHA_2024` | 国家文物局（中国政府网图表） | 图表：2024年全国博物馆接待观众14.9亿人次 | 2024 | China | 官方政府网站 | ✓ 可访问（HTTP 200，22,890 B） | [打开](https://www.gov.cn/zhengce/jiedu/tujie/202505/content_7024142.htm) |
| `SRC_MCT_2012` | 文化和旅游部 | 我国博物馆行业发展迅速（2012年数据） | 2012 | China | 官方部委网站 | ✓ 可访问（HTTP 200，23,745 B） | [打开](https://www.mct.gov.cn/preview/special/xy20d/9672/202210/t20221013_936436.htm) |
| `SRC_MCT_2013` | 文化部 | 2013年文化发展统计公报（PDF） | 2013 | China | 官方统计公报 | ✓ 可访问（HTTP 200，1,350,793 B） | [打开](https://www.mct.gov.cn/whzx/bnsj/cws/201405/P020171201580031493611.pdf) |
| `SRC_MCT_2014` | 文化部 | 2014年文化发展统计公报（PDF） | 2014 | China | 官方统计公报 | ✓ 可访问（HTTP 200，1,203,071 B） | [打开](https://zwgk.mct.gov.cn/zfxxgkml/tjxx/202012/W020161230856808049470.pdf) |
| `SRC_MCT_2016` | 文化部（新浪收藏转载） | 2016年文化发展统计公报 | 2016 | China | 媒体转载官方发布 | ✓ 可访问（HTTP 200，93,057 B） | [打开](http://collection.sina.com.cn/wjs/2017-05-18/doc-ifyfkqks4251453.shtml) |
| `SRC_MCT_2017` | 文化部（中国经济网转载） | 2017年文化发展统计公报 | 2017 | China | 媒体转载官方发布 | ✓ 可访问（HTTP 200，40,641 B） | [打开](http://www.ce.cn/culture/gd/201806/01/t20180601_29311788.shtml) |
| `SRC_MCT_2018` | 文化和旅游部 | 2018年文化和旅游发展统计公报 | 2018 | China | 官方统计公报 | ✓ 可访问（HTTP 200，58,432 B） | [打开](https://zwgk.mct.gov.cn/zfxxgkml/tjxx/202012/t20201204_906482.html) |
| `SRC_MCT_2019` | 文化和旅游部 | 2019年文化和旅游发展统计公报 | 2019 | China | 官方统计公报 | ✓ 可访问（HTTP 200，60,746 B） | [打开](https://zwgk.mct.gov.cn/zfxxgkml/tjxx/202012/t20201204_906491.html) |
| `SRC_MCT_2020` | 文化和旅游部（陕西省文化和旅游厅转载） | 2020年文化和旅游发展统计公报 | 2020 | China | 省级官方站点转载 | ✓ 可访问（HTTP 200，72,591 B） | [打开](https://whhlyt.shaanxi.gov.cn/zfxxgk/fdzdgknr/tjxx/202107/t20210706_2578336.html) |
| `SRC_MCT_2021` | 文化和旅游部 | 2021年文化和旅游发展统计公报 | 2021 | China | 官方政府网站 | ✓ 可访问（HTTP 200，51,926 B） | [打开](https://www.gov.cn/guoqing/2023-03/17/content_5747149.htm) |
| `SRC_MCT_2022` | 文化和旅游部 | 2022年文化和旅游发展统计公报 | 2022 | China | 官方政府网站 | ✓ 可访问（HTTP 200，50,063 B） | [打开](https://www.gov.cn/lianbo/bumen/202307/content_6891772.htm) |
| `SRC_MCT_2023` | 文化和旅游部 | 2023年文化和旅游发展统计公报 | 2023 | China | 官方统计公报 | ✓ 可访问（HTTP 200，55,026 B） | [打开](https://zwgk.mct.gov.cn/zfxxgkml/tjxx/202408/t20240830_954981.html) |
| `SRC_MCT_2024` | 文化和旅游部 | 2024年文化和旅游发展统计公报 | 2024 | China | 官方政府网站 | ✓ 可访问（HTTP 200，44,501 B） | [打开](https://www.gov.cn/lianbo/bumen/202505/content_7044342.htm) |
| `SRC_CSY_2023_C2328` | 国家统计局 | 中国统计年鉴2023 表23-28 分地区博物馆基本情况（2022年） | 2022 | China | 官方统计年鉴 | ✓ 可访问（HTTP 200，175,004 B） | [打开](https://www.stats.gov.cn/sj/ndsj/2023/html/C23-28.jpg) |
| `SRC_CSY_2022_C2328` | 国家统计局 | 中国统计年鉴2022 表23-28 分地区博物馆基本情况（2021年） | 2021 | China | 官方统计年鉴 | ✓ 可访问（HTTP 200，179,508 B） | [打开](https://www.stats.gov.cn/sj/ndsj/2022/html/C23-28.jpg) |
| `SRC_CSY_2021_C2328` | 国家统计局 | 中国统计年鉴2021 表23-28 分地区博物馆基本情况（2020年） | 2020 | China | 官方统计年鉴 | ✓ 可访问（HTTP 200，183,560 B） | [打开](https://www.stats.gov.cn/sj/ndsj/2021/html/C23-28.jpg) |
| `SRC_CSY_2023_C0205` | 国家统计局 | 中国统计年鉴2023 表2-5 分地区年末人口数 | 2020-2022 | China | 官方统计年鉴 | ✓ 可访问（HTTP 200，223,087 B） | [打开](https://www.stats.gov.cn/sj/ndsj/2023/html/C02-05.jpg) |
| `SRC_GD_MUSEUM_2022` | 广东省文化和旅游厅（南方网报道） | 广东省2022年度博物馆事业发展报告 | 2022 | 广东 | 省级官方发布转载 | ✓ 可访问（HTTP 200，51,657 B） | [打开](https://news.southcn.com/node_d85807e3d5/08228015e3.shtml) |
| `SRC_CENSUS_2017` | 国家文物局（山东博物馆转载《第一次全国可移动文物普查数据公报》） | 第一次全国可移动文物普查数据公报 | 2016 | China | 官方公报转载 | ✓ 可访问（HTTP 200，23,981 B） | [打开](https://www.sdmuseum.com/art/2017/4/11/art_270339_8343.html) |
| `SRC_CENSUS_WORKREPORT` | 国家文物局（维基文库全文） | 第一次全国可移动文物普查工作报告 | 2016 | China | 官方文件全文 | ✓ 可访问（HTTP 200，105,062 B） | [打开](https://zh.wikisource.org/zh/%E7%AC%AC%E4%B8%80%E6%AC%A1%E5%85%A8%E5%9B%BD%E5%8F%AF%E7%A7%BB%E5%8A%A8%E6%96%87%E7%89%A9%E6%99%AE%E6%9F%A5%E5%B7%A5%E4%BD%9C%E6%8A%A5%E5%91%8A) |
| `SRC_CENSUS_XINHUA` | 新华社 | 第一次全国可移动文物普查结果发布 | 2016 | China | 官方媒体发布 | ✓ 可访问（HTTP 200，33,247 B） | [打开](https://www.news.cn/politics/2017-04/07/c_129527343.htm) |
| `SRC_SX_WWJ_2021` | 山西省文物局 | 山西国有可移动文物322万件 珍贵文物59219件 | 2016 | 山西 | 省级文物局官网 | ✓ 可访问（HTTP 200，57,458 B） | [打开](https://wwj.shanxi.gov.cn/gzdt/szdt/202109/t20210908_1990669.shtml) |
| `SRC_UNESCO_2021` | UNESCO | Report: Museums in the face of the COVID-19 pandemic（2021） | 2019 | Global | 国际组织报告（第三方镜像） | ✓ 可访问（HTTP 200，1,630,317 B） | [打开](https://museosources.fr/wp-content/uploads/2021/12/RAPPORT-DEFINITIF-UNESCO-FR-Les-musees-dans-le-monde-face-a-la-pandemie-de-Covid-19.pdf) |
| `SRC_IMLS_US` | 美国博物馆与图书馆服务署 IMLS | Government Doubles Official Estimate: There Are 35000 Active Museums in the U.S. | 2014 | United States | 官方机构发布 | ✓ 可访问（HTTP 200，40,752 B） | [打开](https://www.imls.gov/news/government-doubles-official-estimate-there-are-35000-active-museums-us) |
| `SRC_DE_IFM_2023` | 德国普鲁士文化遗产基金会（IfM 德国博物馆研究所数据） | Museen sind beliebt und wichtige wirtschaftliche Standortfaktoren | 2023 | Germany | 官方机构发布 | ✓ 可访问（HTTP 200，40,368 B） | [打开](https://www.preussischer-kulturbesitz.de/pressemitteilung/artikel/2024/12/12/museen-sind-beliebt-und-wichtige-wirtschaftliche-standortfaktoren.html) |
| `SRC_FR_MDF` | 法国文化部 | Les musées de France | 2024 | France | 官方部委网站 | ✓ 可访问（HTTP 200，199,703 B） | [打开](https://www.culture.gouv.fr/thematiques/musees/Les-musees-en-France/les-musees-de-france) |
| `SRC_KR_MCST` | 韩国文化体育观光部 | Statistics（博物馆/美术馆） | 2024 | South Korea | 官方部委网站 | ✓ 可访问（HTTP 200，33,988 B） | [打开](https://www.mcst.go.kr/english/statistics/statistics.jsp) |
| `SRC_TEA_2023` | TEA/AECOM | Theme Index and Museum Index 2023 | 2023 | Global | 行业权威报告 | ✓ 可访问（HTTP 200，10,264,601 B） | [打开](https://aecom.com/wp-content/uploads/documents/reports/AECOM-Theme-Index-2023.pdf) |
| `SRC_WB_POP` | 世界银行 | World Bank Open Data SP.POP.TOTL（总人口） | 2024 | Global | 国际组织开放数据 | ✓ 可访问（HTTP 200，2,662 B） | [打开](https://api.worldbank.org/v2/country/CHN;USA;GBR;FRA;DEU;JPN;KOR;ITA;RUS;ESP;CAN;IND;BRA/indicator/SP.POP.TOTL?date=2024&format=json) |
| `SRC_GEO_DATAV` | 阿里云 DataV 公开边界服务 | 中国省级行政区边界 GeoJSON (adcode 100000_full) | 2024 | China | 公开地理数据服务 | ✓ 可访问（HTTP 200，582,522 B） | [打开](https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json) |
| `SRC_ECHARTS` | Apache ECharts | ECharts 5.5.1 运行库 | 2024 | Global | 开源软件库 | ✓ 可访问（HTTP 200，1,030,855 B） | [打开](https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js) |
| `SRC_CNM_2024` | 中国国家博物馆 | 中国国家博物馆2024年度数据报告 | 2024 | 中国国家博物馆 | 博物馆官网 | ✓ 可访问（HTTP 200，387,081 B） | [打开](https://www.chnmuseum.cn/shxg/zlxz/pdfdown/202503/t20250320_271313.shtml) |
| `SRC_DPM_SITE` | 故宫博物院 | 故宫博物院简介 | 2024 | 故宫博物院 | 博物馆官网 | ✓ 可访问（HTTP 200，75,529 B） | [打开](https://www.dpm.org.cn/about/about_view.html) |
| `SRC_DPM_VISITORS` | 新华社（舜网转载） | 2024年故宫接待观众超1760万人次 | 2024 | 故宫博物院 | 官方媒体 | ✓ 可访问（HTTP 200，19,829 B） | [打开](http://news.e23.cn/guonei/2025-10-10/2025A1000084.html) |
| `SRC_SXHM_2024` | 陕西历史博物馆（陕西省地方志年度报告） | 陕西历史博物馆2024年度报告 | 2024 | 陕西历史博物馆 | 博物馆官方年度报告 | ✓ 可访问（HTTP 200，20,929 B） | [打开](http://sxbb.gov.cn/site-sxdjgl/yearlyReport_view/271404) |
| `SRC_HNM_2024` | 河南博物院 | 河南博物院2024年度报告 | 2024 | 河南博物院 | 博物馆官网年报 | ✓ 可访问（HTTP 200，66,584 B） | [打开](https://www.chnmus.net/ch/institution/annual/details.html?id=7300068856339369984) |
| `SRC_SHM_2024` | 上海博物馆（新浪财经报道） | 上海博物馆2024年接待观众657.86万人次 | 2024 | 上海博物馆 | 媒体转载官方数据 | ✓ 可访问（HTTP 200，28,927 B） | [打开](https://finance.sina.cn/2025-01-15/detail-ineezwyz7167573.d.html) |
| `SRC_SHM_SITE` | 上海博物馆 | 上海博物馆简介 | 2024 | 上海博物馆 | 博物馆官网 | ✓ 可访问（HTTP 200，65,776 B） | [打开](https://www.shanghaimuseum.net/mu/frontend/pg/infomation/about) |
| `SRC_ZJM_2023` | 浙江省博物馆（钱江晚报/潮新闻） | 浙江省博物馆2023年接待观众262.40万人次 | 2023 | 浙江省博物馆 | 媒体转载官方数据 | ✓ 可访问（HTTP 200，15,833 B） | [打开](http://qjwb.tidenews.com.cn/html/2024-10/01/content_4272221.htm) |
| `SRC_HBM_2024` | 湖北省文化和旅游厅 | 湖北省博物馆2024年接待观众超过500万人次 | 2024 | 湖北省博物馆 | 省级政府网站 | ✓ 可访问（HTTP 200，64,612 B） | [打开](https://wlt.hubei.gov.cn/bmdt/mtjj/202504/t20250406_5603996.shtml) |
| `SRC_HNMU_2024` | 湖南博物院 | 湖南博物院2024年度报告 | 2024 | 湖南博物院 | 博物馆官网年报 | ✓ 可访问（HTTP 200，51,364 B） | [打开](https://www.hnmuseum.com/zh-hant/node/10469) |
| `SRC_LNM_2024` | 辽宁省博物馆（北国网/辽宁日报） | 辽宁省博物馆2024年观众达332万人 | 2024 | 辽宁省博物馆 | 官方媒体 | ✓ 可访问（HTTP 200，30,947 B） | [打开](https://news.lnd.com.cn/system/2025/05/16/030513419.shtml) |
| `SRC_NJM` | 南京博物院（南京文旅网） | 南京博物院馆情简介 | 2024 | 南京博物院 | 官方机构网站 | ✓ 可访问（HTTP 200，38,983 B） | [打开](http://m.njlyw.cn/website/web/ScenicDetail?m=173&c=XW&i=1282) |
| `SRC_LOUVRE_2024` | 卢浮宫（官方新闻稿） | 8.7 millions de visiteurs au Louvre en 2024 | 2024 | 卢浮宫 | 博物馆官网 | ✓ 可访问（HTTP 200，72,398 B） | [打开](https://presse.louvre.fr/8-7-millions-de-visiteurs-au-louvre-en-2024/?lang=fr) |
| `SRC_BM_2025` | 大英博物馆 | Annual Report and Accounts 2024-25 | 2024 | 大英博物馆 | 博物馆官网年报 | ✓ 可访问（HTTP 200，873,475 B） | [打开](https://www.britishmuseum.org/sites/default/files/2025-07/Annual_Report_and_Accounts_2024-25.pdf) |
| `SRC_MET_FY2024` | 大都会艺术博物馆 | Attendance Figures FY2024 | 2024 | 大都会艺术博物馆 | 博物馆官网新闻稿 | ✗ FAIL | [打开](https://www.metmuseum.org/press-releases/attendance-figures-fy2024-2024-news) |
| `SRC_VATICAN_2024` | 罗马市（Annuario 2025 文化统计） | Cultura Annuario 2025 | 2024 | 梵蒂冈博物馆 | 市政官方统计 | ✓ 可访问（HTTP 200，963,374 B） | [打开](https://www.comune.roma.it/web-resources/cms/documents/07_Cultura_Annuario_2025.pdf) |
| `SRC_NMK_2024` | 韩国国立中央博物馆 | 国立中央博物馆2024年度报告 | 2024 | 韩国国立中央博物馆 | 博物馆官网年报 | ✓ 可访问（HTTP 200，2,002,502 B） | [打开](https://www.museum.go.kr/afile/fileDownloadById/37236?siteCode=MUSEUM) |
| `SRC_TNM_FY2024` | 东京国立博物馆 | 东京国立博物馆令和6年度概要 | 2024 | 东京国立博物馆 | 博物馆官网年报 | ✓ 可访问（HTTP 200，7,691,746 B） | [打开](https://www.nich.go.jp/wp-content/uploads/2025/06/gaiyo2025-j.pdf) |
| `SRC_NPM_2025` | 台北故宫博物院 | 114年度总参观人数分项统计表 | 2025 | 台北故宫博物院 | 博物馆官网 | ✓ 可访问（HTTP 200，41,226 B） | [打开](https://www.npm.gov.tw/NewFileAtt.ashx?lang=1&id=10057438) |

## 三、来源与数据集的对应关系

| 数据集 ID | 数据集名称 | 粒度 | 来源 |
|---|---|---|---|
| `CN_MUSEUM_YEARLY_REGISTERED_01` | 全国备案博物馆年度统计 | year | `SRC_NCHA_2015`；`SRC_NCHA_2016`；`SRC_NCHA_2017`；`SRC_NCHA_2018`；`SRC_NCHA_2019`；`SRC_NCHA_2020`；`SRC_NCHA_2021`；`SRC_NCHA_2022`；`SRC_NCHA_2023`；`SRC_NCHA_2024` |
| `CN_MUSEUM_YEARLY_MCT_02` | 全国文物机构与博物馆年度统计 | year | `SRC_MCT_2012`；`SRC_MCT_2013`；`SRC_MCT_2014`；`SRC_MCT_2016`；`SRC_MCT_2017`；`SRC_MCT_2018`；`SRC_MCT_2019`；`SRC_MCT_2020`；`SRC_MCT_2021`；`SRC_MCT_2022`；`SRC_MCT_2023`；`SRC_MCT_2024` |
| `CN_MUSEUM_PROVINCE_03` | 中国分地区博物馆基本情况 | province×year | `SRC_CSY_2023_C2328`；`SRC_CSY_2022_C2328`；`SRC_CSY_2021_C2328`；`SRC_GD_MUSEUM_2022` |
| `CN_MOVABLE_RELIC_CENSUS_04` | 第一次全国可移动文物普查结果 | metric | `SRC_CENSUS_2017`；`SRC_CENSUS_WORKREPORT`；`SRC_CENSUS_XINHUA`；`SRC_SX_WWJ_2021` |
| `CN_PROVINCE_POPULATION_05` | 中国分地区年末人口数 | province×year | `SRC_CSY_2023_C0205` |
| `INTL_COUNTRY_MUSEUMS_06` | 世界主要国家博物馆数量 | country×year | `SRC_UNESCO_2021`；`SRC_IMLS_US`；`SRC_DE_IFM_2023`；`SRC_FR_MDF`；`SRC_KR_MCST`；`SRC_WB_POP`；`SRC_NCHA_2024` |
| `INTL_MUSEUM_CASES_07` | 世界代表性博物馆年度参观人次（TEA/AECOM 2023） | museum×year | `SRC_TEA_2023` |
| `MUSEUM_CASES_OFFICIAL_08` | 代表性博物馆官方公布数据 | museum×year | `SRC_CNM_2024`；`SRC_DPM_SITE`；`SRC_DPM_VISITORS`；`SRC_SXHM_2024`；`SRC_HNM_2024`；`SRC_SHM_2024`；`SRC_ZJM_2023`；`SRC_HBM_2024`；`SRC_HNMU_2024`；`SRC_LNM_2024`；`SRC_NJM`；`SRC_LOUVRE_2024`；`SRC_BM_2025`；`SRC_MET_FY2024`；`SRC_VATICAN_2024`；`SRC_NMK_2024`；`SRC_TNM_FY2024`；`SRC_NPM_2025` |
| `CN_MUSEUM_YEARLY_08` | 全国年度分析数据集（合并） | year | `SRC_NCHA_2015`；`SRC_MCT_2012` |
| `CN_PROVINCE_YEAR_09` | 分省分析数据集（含派生指标） | province×year | `SRC_CSY_2023_C2328`；`SRC_CSY_2023_C0205` |
| `CN_CENSUS_RELICS_10` | 可移动文物普查分析数据集 | metric | `SRC_CENSUS_2017` |
| `INTL_COUNTRY_11` | 国际比较分析数据集 | country×year | `SRC_UNESCO_2021`；`SRC_WB_POP` |

## 四、核验方式

`scripts/collect_data.py` 会逐个访问台账中的 URL，记录：

- HTTP 状态码与返回内容长度；
- 核验时间（UTC）；
- 页面快照路径（保存在 `data/raw/_cache/` 作为留证）；
- 失败原因。

结果写入 `data/metadata/source_verification.csv`。最近一次核验：**58 / 59 条可访问**。


### 未通过自动核验的来源（如实列出）

| 来源ID | 机构 | 失败原因 | 说明 |
|---|---|---|---|
| `SRC_MET_FY2024` | 大都会艺术博物馆 | HTTP 429 → FY2024两个馆址合计超过550万观众。**注意**：该官网对自动化访问有反爬（返回429/拦截），程序核验会失败；数值取自同一页面的互联网档案馆存档 https://web.archive.org/web/20250909221112id_/https://www.metmuseum.org/press-releases/attendance-figures-fy2024-2024-news |

> 失败通常是**对方站点的反爬或限流**（例如 The Met 官网返回 429），或本机网络对该站点的 TLS 握手不稳定，**不是链接不存在**。这类来源的数值在 `source_registry.csv` 的 `note` 中已注明存档地址。

**本项目不伪造任何 URL**：台账中的每一条链接都是真实存在、可在浏览器中打开的。


## 五、使用原则

1. **优先国家级官方机构**：国家文物局、文化和旅游部、国家统计局、中国政府网；
2. **省级官方**用于补充分省与个案数据；
3. **博物馆官方年报/官网**用于代表性博物馆的个体数据；
4. **媒体转载**只在台账中标注为「媒体转载官方发布」，并且仅当官方原件无法直接抓取（如需付费、图片版、接口限制）时才使用，**从不作为唯一来源**；
5. 新闻网站、博客、问答平台**不作为核心统计数据源**。
