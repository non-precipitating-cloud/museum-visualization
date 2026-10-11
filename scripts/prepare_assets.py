#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
prepare_assets.py — 准备前端静态资源（本地化，使项目可离线双击运行）

下载两类**真实公开**资源并保存到 web/assets/：
  1. Apache ECharts 运行库（jsDelivr CDN，npm 包 echarts@5.5.1）
  2. 中国省级行政区边界 GeoJSON（阿里云 DataV 公开边界服务 geo.datav.aliyun.com，
     该服务提供的是真实行政区划边界数据，adcode 采用国家标准行政区划代码）

生成 web/assets/geo/china.js —— 把 GeoJSON 包装成
    echarts.registerMap('china', <geojson>)
这样浏览器直接以 file:// 打开 index.html 也能加载地图（避免 fetch 本地 JSON 的 CORS 限制）。

用法：
    python scripts/prepare_assets.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "web" / "assets"
GEO_DIR = ASSETS / "geo"

ECHARTS_URL = "https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"
GEO_URL = "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json"

# GeoJSON 中的省级名称 -> 本项目统一使用的简称（与统计口径中的省份名对齐）
SHORT_NAME = {
    "北京市": "北京", "天津市": "天津", "河北省": "河北", "山西省": "山西",
    "内蒙古自治区": "内蒙古", "辽宁省": "辽宁", "吉林省": "吉林", "黑龙江省": "黑龙江",
    "上海市": "上海", "江苏省": "江苏", "浙江省": "浙江", "安徽省": "安徽",
    "福建省": "福建", "江西省": "江西", "山东省": "山东", "河南省": "河南",
    "湖北省": "湖北", "湖南省": "湖南", "广东省": "广东",
    "广西壮族自治区": "广西", "海南省": "海南", "重庆市": "重庆", "四川省": "四川",
    "贵州省": "贵州", "云南省": "云南", "西藏自治区": "西藏", "陕西省": "陕西",
    "甘肃省": "甘肃", "青海省": "青海", "宁夏回族自治区": "宁夏",
    "新疆维吾尔自治区": "新疆", "台湾省": "台湾",
    "香港特别行政区": "香港", "澳门特别行政区": "澳门",
}


def _get(url: str, attempts: int = 6) -> bytes:
    """下载 URL 内容，带重试。

    本机网络对境外 CDN 的 TLS 握手偶发中断（schannel SSL/TLS handshake failed），
    重试若干次通常即可成功；因此这里以 curl 为主并循环重试，requests 作为备选。
    """
    import shutil
    import subprocess
    import time

    have_curl = shutil.which("curl") is not None
    try:
        import requests
    except ImportError:
        requests = None  # type: ignore[assignment]

    last_err = ""
    for n in range(1, attempts + 1):
        if have_curl:
            proc = subprocess.run(
                ["curl", "-sSL", "--max-time", "60", "-o", "-", url],
                capture_output=True,
            )
            if proc.returncode == 0 and proc.stdout:
                return proc.stdout
            last_err = f"curl exit={proc.returncode}: " \
                       f"{proc.stderr.decode('utf-8', 'ignore').strip()[:160]}"
        elif requests is not None:
            try:
                resp = requests.get(url, timeout=60, headers={"User-Agent": "Mozilla/5.0"})
                resp.raise_for_status()
                return resp.content
            except Exception as exc:  # noqa: BLE001
                last_err = f"{type(exc).__name__}: {exc}"
        else:
            sys.exit("系统既无 curl 也无 requests，无法下载。请先 pip install -r requirements.txt")
        print(f"  [retry {n}/{attempts}] {last_err}")
        time.sleep(1.5)

    sys.exit(f"下载多次失败：{url}\n最后一次错误：{last_err}")


def main() -> int:
    ASSETS.mkdir(parents=True, exist_ok=True)
    GEO_DIR.mkdir(parents=True, exist_ok=True)

    # ---------- 1. ECharts ----------
    target = ASSETS / "echarts.min.js"
    if target.exists() and target.stat().st_size > 500_000:
        print(f"[skip] {target.relative_to(ROOT)} 已存在 ({target.stat().st_size:,} bytes)")
    else:
        data = _get(ECHARTS_URL)
        target.write_bytes(data)
        print(f"[ok]   ECharts -> {target.relative_to(ROOT)} ({len(data):,} bytes)")

    # ---------- 2. 中国省级边界 GeoJSON ----------
    raw_geo = GEO_DIR / "china_raw_datav.json"
    if not raw_geo.exists():
        raw_geo.write_bytes(_get(GEO_URL))
        print(f"[ok]   中国边界 GeoJSON -> {raw_geo.relative_to(ROOT)} "
              f"({raw_geo.stat().st_size:,} bytes)")
    else:
        print(f"[skip] {raw_geo.relative_to(ROOT)} 已存在")

    geo = json.loads(raw_geo.read_text(encoding="utf-8"))

    # 统一省级名称，便于与统计数据连接；同时保留 adcode 与原始名称
    for feat in geo["features"]:
        props = feat.setdefault("properties", {})
        original = props.get("name")
        props["original_name"] = original
        props["name"] = SHORT_NAME.get(original, original)

    # 写出为 JS，供 file:// 直接加载
    js_path = GEO_DIR / "china.js"
    payload = json.dumps(geo, ensure_ascii=False, separators=(",", ":"))
    js_path.write_text(
        "/* 中国省级行政区边界（真实数据）\n"
        f" * 来源：阿里云 DataV 公开边界服务 {GEO_URL}\n"
        " * 处理：scripts/prepare_assets.py 仅做省级名称统一，几何数据未修改\n"
        " */\n"
        f"echarts.registerMap('china', {payload});\n",
        encoding="utf-8",
    )
    n = len(geo["features"])
    print(f"[ok]   echarts.registerMap('china', ...) -> {js_path.relative_to(ROOT)} "
          f"（{n} 个省级要素）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
