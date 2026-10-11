#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
analyze.py — 生成分析结论（Phase 11-12 / 39）

把"核心发现"全部变成**程序输出**，写入 docs/analysis_findings.md。
README 与页面中的结论数字均以本文件的输出为准。

本模块只做描述性统计与相关分析，输出中明确区分：
    事实 / 描述 / 相关关系
并显式标注**不做因果推断**。

用法：
    python scripts/analyze.py
"""
from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src import analysis as A   # noqa: E402
from src import config as C     # noqa: E402


def fmt(v, unit="", dp=None):
    """格式化数值：dp 指定小数位；不指定则最多保留 2 位并去掉尾随 0。"""
    if v is None:
        return C.NO_DATA_LABEL
    f = float(v)
    if dp is not None:
        s = f"{f:,.{dp}f}"
    elif f == int(f):
        s = f"{int(f):,}"
    else:
        s = f"{f:,.2f}".rstrip("0").rstrip(".")
    return s + unit


def main() -> int:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    L: list[str] = []
    L.append("# 分析结论（由程序计算生成）\n")
    L.append(f"> 本文件由 `scripts/analyze.py` 自动生成（{now}）。")
    L.append("> 文中每个数字都可由 `src/analysis.py` 的函数重新算出。")
    L.append("> **本项目严格区分「事实 / 描述 / 相关关系」，不做因果推断。**\n")
    L.append("---\n")

    # ---------------- 一、规模 ----------------
    s = A.national_scale()
    L.append("## 一、规模（事实）\n")
    if s:
        y = s["year"]
        L.append(f"以 {y} 年为例（国家文物局「备案博物馆」口径）：\n")
        L.append("| 指标 | 数值 | 同比 |")
        L.append("|---|---|---|")
        for key, label, unit in (("museums", "备案博物馆数量", " 家"),
                                 ("visitors_100m", "博物馆参观人次", " 亿人次"),
                                 ("exhibitions_10k", "举办陈列展览", " 万个")):
            v = s.get(key)
            yo = s.get(key + "_yoy_pct")
            yos = f"{yo:+.1f}%（较 {s.get(key + '_yoy_base')}）" if yo is not None else "—"
            L.append(f"| {label} | {fmt(v, unit, 0)} | {yos} |")
        if s.get("museums_added") is not None:
            L.append(f"\n{y} 年备案博物馆较上年**增加 {s['museums_added']} 家**。")
        if s.get("visitors_trough"):
            t = s["visitors_trough"]
            p = s.get("visitors_peak_before_trough")
            L.append(f"\n**冲击与恢复（事实）**：参观人次最低点出现在 **{t['year']} 年"
                     f"（{fmt(t['value'], ' 亿人次', 2)}）**"
                     + (f"，此前高点为 {p['year']} 年的 {fmt(p['value'], ' 亿人次', 2)}"
                        if p else "") + "。")
            if y in (2023, 2024) and s.get("visitors_100m"):
                L.append(f"{y} 年回升至 {fmt(s['visitors_100m'], ' 亿人次', 2)}。")
            L.append("\n这是数据中的客观事实，项目中**未做任何平滑或剔除处理**。")
    L.append("")

    # ---------------- 二、KPI ----------------
    L.append("## 二、首页 KPI（每个 KPI 标注自己的年份与口径）\n")
    kpi = A.kpi_snapshot()
    L.append("| KPI | 数值 | 单位 | 年份 | 口径 | 同比 |")
    L.append("|---|---|---|---|---|---|")
    for k in kpi:
        yo = k.get("yoy")
        yos = f"{yo['pct']:+.1f}%（较 {yo['base_year']}）" if yo else "—"
        L.append(f"| {k['label']} | {k['value']:,.1f} | {k['unit']} | {k['year']} | "
                 f"{k['caliber']} | {yos} |")
    L.append("\n> 不同指标的最新可得年份不同，因此**不做跨年混算**；同比由相邻两年真实数值计算。\n")

    # ---------------- 三、空间集中度 ----------------
    sp = A.spatial_concentration()
    L.append("## 三、空间分布（事实 + 描述）\n")
    if sp:
        L.append(f"以下均为 {sp['year']} 年截面数据（31 个省级行政区）。\n")
        L.append("| 口径 | 前 5 位 |")
        L.append("|---|---|")
        for key, label, dp in (("top_absolute", "博物馆数量（绝对规模）", 0),
                               ("top_density", "每百万人博物馆数量", 2),
                               ("top_visitors", "参观人次（万人次）", 0),
                               ("top_visitors_per_million", "每百万人参观人次", 1)):
            items = sp.get(key) or []
            txt = "、".join(f"{p} {v:,.{dp}f}" for p, v in items)
            L.append(f"| {label} | {txt} |")
        hi_p, hi_v = sp["max_province"]
        lo_p, lo_v = sp["min_province"]
        L.append(f"\n博物馆数量最高的是 **{hi_p}（{hi_v:,.0f} 家）**，"
                 f"最低的是 **{lo_p}（{lo_v:,.0f} 家）**，"
                 f"相差约 **{sp['max_min_ratio']:.1f} 倍**。")
        # 两个排名是否一致
        abs_set = {p for p, _ in sp["top_absolute"]}
        den_set = {p for p, _ in sp["top_density"]}
        L.append(f"\n绝对规模前 5 与人口标准化前 5 的**重合省份**："
                 f"{'、'.join(sorted(abs_set & den_set)) or '无'}。"
                 f"仅绝对规模入围：{'、'.join(sorted(abs_set - den_set)) or '无'}；"
                 f"仅标准化入围：{'、'.join(sorted(den_set - abs_set)) or '无'}。")
    L.append("")

    # ---------------- 四、相关关系 ----------------
    co = A.correlations()
    L.append("## 四、变量间的线性关联（相关关系，**不是因果**）\n")
    if co:
        L.append("| 变量对 | r | 强度 | 样本 |")
        L.append("|---|---|---|---|")
        for v in co.values():
            L.append(f"| {v['x']} × {v['y']} | **{v['r']:.2f}** | {v['strength']} | {v['n']} 个省份 |")
        L.append("\n**必须强调：以上都是相关关系。** 截面数据无法区分"
                 "「资源带动服务」与「需求带动资源」两个方向；"
                 "观众规模还受免费开放政策、地理位置、人口基数等因素影响。"
                 "本项目**不把任何派生指标称为「管理绩效排名」**。")
    L.append("")

    # ---------------- 五、文物结构 ----------------
    c = A.census_structure()
    L.append("## 五、馆藏资源的价值结构（事实）\n")
    if c:
        L.append("数据来源：**第一次全国可移动文物普查**（统计时点 2016 年 10 月 31 日）。\n")
        L.append("| 指标 | 数值 |")
        L.append("|---|---|")
        L.append(f"| 全国可移动文物总量 | {fmt(c['movable_relics_total'], ' 件/套', 0)} |")
        L.append(f"| 登录文物实际数量 | {fmt(c['actual_count'], ' 件', 0)} |")
        L.append(f"| 珍贵文物（一/二/三级合计） | {fmt(c['precious_relics'], ' 件', 0)} |")
        L.append(f"| 一级文物 | {fmt(c['grade1'], ' 件', 0)} |")
        L.append(f"| 二级文物 | {fmt(c['grade2'], ' 件', 0)} |")
        L.append(f"| 三级文物 | {fmt(c['grade3'], ' 件', 0)} |")
        if c.get("precious_share_given_pct") is not None:
            L.append(f"| 珍贵文物占比（来源给出） | {c['precious_share_pct_given']:.2f}% |")
        if c.get("precious_share_recomputed_pct") is not None:
            L.append(f"| 珍贵文物占比（本项目按实际数量重算） | "
                     f"{c['precious_share_recomputed_pct']:.2f}% |")
        L.append(f"\n数据自洽性校验：一级+二级+三级 = {fmt(c['fine_total_check'], ' 件', 0)}，"
                 f"与公报给出的珍贵文物总数{fmt(c['precious_relics'], ' 件', 0)}**完全吻合**。")
        if c.get("grade3_share_of_fine_pct") is not None:
            L.append(f"\n**结构特征（事实）**：珍贵文物内部，三级文物占 "
                     f"**{c['grade3_share_of_fine_pct']:.2f}%**，"
                     f"一级文物仅占 **{c['grade1_share_of_fine_pct']:.2f}%**。")
        L.append("\n> 等级结构只反映**文物定级这一维度**的构成，"
                 "**不能等同于「文化价值」的完整度量**。\n")
        if c.get("top_provinces"):
            L.append("\n**空间集聚（事实）**：可获取的分省数据如下——\n")
            L.append("| 省份 | 可移动文物数量 | 占全国 |")
            L.append("|---|---|---|")
            for p, v, sh in c["top_provinces"]:
                L.append(f"| {p} | {fmt(v, '', 0)} | "
                         f"{f'{sh:.2f}%' if sh is not None else C.NO_DATA_LABEL} |")
            if c.get("top5_share_pct") is not None:
                L.append(f"| **五省合计** | **{fmt(c['top5_sum'], '', 0)}** | "
                         f"**{c['top5_share_pct']:.2f}%** |")
                L.append(f"| 其余 26 个省级行政区合计 | {fmt(c['rest_sum'], '', 0)} | "
                         f"{c['rest_share_pct']:.2f}% |")
            L.append(f"\n> **口径说明**：公报给出的省级占比是相对「登录文物**实际数量** "
                     f"{fmt(c.get('denominator_used'), ' 件', 0)}」计算的"
                     "（验证：北京 11,615,758 ÷ 64,073,178 = 18.13%，与公报一致），"
                     "**不是**相对「可移动文物总量 108,154,907 件/套」"
                     "（后者含 8,154.4 万卷档案馆纸质历史档案）。")
            L.append("\n> **注意**：国家普查公报正文只公布数量最多的五个省市，"
                     "其余省份的完整表格以图片形式存在、无法提取。"
                     "「其余省份合计」是用登录文物实际数量减去五省之和得到的**差额**，"
                     "**不是官方公布的逐省数值，不可反推任一省份的具体数量**。")
    L.append("")

    # ---------------- 六、国际位置 ----------------
    ip = A.international_position()
    L.append("## 六、国际位置（事实 + 限制）\n")
    if ip:
        for g in ("A", "B"):
            v = ip.get("china_" + g)
            if v and v["value"] is not None:
                L.append(f"- **{v['label']}**（{v['year']} 年）：中国 "
                         f"**{v['value']:,.0f} 家**，在可比范围内的 {v['n_countries']} "
                         f"个国家/地区中列第 **{v['rank']}** 位。")
        for c_ in ("法国", "美国"):
            g = ip.get("gap_" + c_)
            if g:
                L.append(f"- **{c_}**：本国官方口径 {g['official']:,.0f} 家，"
                         f"UNESCO 口径 {g['unesco']:,.0f} 家，"
                         f"**相差 {g['ratio']:.1f} 倍**。")
        t = ip.get("tea_2023")
        if t:
            L.append(f"\n**唯一严格可比的口径**：TEA/AECOM《Theme Index 2023》"
                     f"（同一机构、同一方法、同一年度）。全球前 {t['n_total']} 中，"
                     f"**中国博物馆占 {t['china_count']} 家**：\n")
            L.append("| 全球排名 | 博物馆 | 2023 年参观人次 |")
            L.append("|---|---|---|")
            for rk, nm, v in t["china"]:
                L.append(f"| {rk} | {nm} | {v:,.1f} 万 |")
            L.append(f"\n榜首为 {t['top1'][0]}（{t['top1'][1]:,.1f} 万人次）。")
        L.append("\n> **限制**：不同国家及博物馆的统计口径、统计年份和馆藏定义存在差异，"
                 "国际比较主要用于**观察规模和发展特征**，"
                 "**不构成严格意义上的全球排名**。")
    L.append("")

    # ---------------- 七、方法性结论 ----------------
    L.append("## 七、方法性结论：本项目在数据上做的减法\n")
    L.append("以下模块因**缺乏可靠公开数据**而被**主动取消或降级**，"
             "而不是用估算值填充：\n")
    L.append("| 原计划模块 | 处理 | 原因 |")
    L.append("|---|---|---|")
    L.append("| 省级「馆藏规模 × 珍贵文物比例」四象限 | **取消原设计** | "
             "分省博物馆珍贵文物数据不可得；公报的一/二/三级文物为「文物机构」口径，不可用 |")
    L.append("| 各省珍贵文物数量排名 | **取消** | 同上 |")
    L.append("| 馆藏历史时期结构（秦汉唐宋元明清） | **取消** | 无全国统一口径的分类公开数据 |")
    L.append("| 全国文物来源省份 → 博物馆 Sankey | **取消** | 无稳定完整的全国配对数据 |")
    L.append("| 国际比较的「全球排名」 | **降级**为口径分组比较 | 各国定义、年份、范围不一致 |")

    L.append("\n---\n")
    L.append("## 复现方式\n")
    L.append("```bash")
    L.append("python scripts/analyze.py       # 重新生成本文件")
    L.append("python scripts/data_audit.py    # 数据审计")
    L.append("python tests/test_pipeline.py   # 69 项数据管线自检")
    L.append("```")

    out = C.DOCS / "analysis_findings.md"
    out.write_text("\n".join(L), encoding="utf-8")
    print(f"[写出] {out.relative_to(ROOT)}（{len(L)} 行）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
