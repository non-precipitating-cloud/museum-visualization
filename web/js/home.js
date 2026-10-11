/* ==========================================================================
   home.js —— 首页大屏图表
   所有数值都来自 window.MUSEUM_DATA（由 scripts/build_web_data.py 生成）
   缺测一律展示"暂无数据"，绝不显示为 0
   ========================================================================== */
(function () {
  'use strict';

  const D = window.MUSEUM_DATA || {};
  const C = MV.C, NF = MV.NF, row = MV.row, isNum = MV.isNum;

  /* ======================================================================
     0. KPI
     ====================================================================== */
  function renderKPI() {
    const box = document.getElementById('kpi-row');
    const kpis = D.kpi || [];
    if (!kpis.length) {
      box.innerHTML = '<div class="nodata-hint">KPI 数据尚未生成</div>';
      return;
    }
    box.innerHTML = kpis.map(k => {
      const has = isNum(k.value);
      const yo = k.yoy;
      let deltaHtml = '<span class="kpi-delta flat">—</span>';
      if (yo && isNum(yo.pct)) {
        const dir = yo.pct > 0 ? 'up' : (yo.pct < 0 ? 'down' : 'flat');
        const arrow = dir === 'up' ? '▲' : (dir === 'down' ? '▼' : '—');
        deltaHtml = '<span class="kpi-delta ' + dir + '">' + arrow + ' ' +
          Math.abs(yo.pct).toFixed(1) + '% <span style="color:var(--ink-muted)">较' +
          yo.base_year + '</span></span>';
      }
      const valueHtml = has
        ? '<span class="kpi-value">' + NF.big(k.value) +
          '<span class="unit">' + (k.unit || '') + '</span></span>'
        : '<span class="kpi-value" style="font-size:17px;color:var(--ink-muted)">' +
          C.NO_DATA_LABEL + '</span>';

      return '<div class="kpi" style="--kpi-accent:' + (k.color || 'var(--accent)') + '">' +
        '<div class="kpi-top">' +
          '<span class="kpi-label">' + k.label + '</span>' +
          valueHtml +
        '</div>' +
        '<div class="kpi-foot">' +
          '<span>' + (k.year ? k.year + '年 · ' : '') + (k.caliber || '') + '</span>' +
          deltaHtml +
        '</div>' +
        '</div>';
    }).join('');
  }

  /* ======================================================================
     1. 中国地图（第一主视觉）
     ====================================================================== */
  const MAP_METRICS = [
    { key: 'museum_count',     label: '博物馆数量',      q: '博物馆资源主要分布在哪里？' },
    { key: 'collection_count', label: '馆藏数量',        q: '馆藏资源的空间格局如何？' },
    { key: 'visitors_wan',     label: '参观人次',        q: '公众使用在空间上如何分布？' },
    { key: 'museums_per_million_population', label: '每百万人博物馆数', q: '考虑人口后，空间格局是否发生变化？' },
    { key: 'visitors_per_million_population', label: '每百万人参观人次', q: '人口标准化后的公共服务水平如何？' }
  ];
  let mapMetric = MAP_METRICS[0].key;

  function provincesForYear() {
    const P = D.province || {};
    const year = MV.state.year || P.latest_year;
    return (P.rows || []).filter(r => r.year === year);
  }

  function renderMapTabs() {
    const box = document.getElementById('map-metric-tabs');
    box.innerHTML = MAP_METRICS.map(m =>
      '<button class="tab' + (m.key === mapMetric ? ' active' : '') + '" data-k="' + m.key + '">' +
      m.label + '</button>').join('');
    box.querySelectorAll('.tab').forEach(b => {
      b.onclick = () => { mapMetric = b.dataset.k; renderMapTabs(); renderMap(); };
    });
  }

  function renderMap() {
    const rows = provincesForYear();
    const metric = MAP_METRICS.find(m => m.key === mapMetric);
    document.getElementById('map-question').textContent = metric.q;

    if (!rows.length) {
      MV.showEmpty('chart-map', '省级数据尚未生成 —— 见 data/raw/museum_statistics/province_museums.csv');
      return;
    }

    const vals = rows.map(r => (isNum(r[mapMetric]) ? Number(r[mapMetric]) : null));
    const present = vals.filter(v => v !== null);
    const useLog = metric.key.includes('per_million') || metric.key === 'visitors_wan';

    const data = rows.map(r => ({
      name: r.province,
      value: isNum(r[mapMetric]) ? Number(r[mapMetric]) : null,
      __row: r
    }));

    // 未在本项目统计范围内的地区（港澳台），显式给 null，地图上显示"暂无数据"
    ['香港', '澳门', '台湾'].forEach(p => {
      if (!rows.some(r => r.province === p)) data.push({ name: p, value: null });
    });

    const unit = metric.key === 'museum_count' ? '家'
      : metric.key === 'visitors_wan' ? '万人次'
      : metric.key === 'collection_count' ? '件(套)'
      : metric.key.startsWith('museums_per') ? '家/百万人' : '万人次/百万人';

    const inst = MV.chart('chart-map', {
      tooltip: {
        trigger: 'item',
        formatter: p => {
          const r = p.data && p.data.__row;
          if (!r) {
            return '<b>' + p.name + '</b><br/><span style="color:' + C.INK_MUTED +
              '">本项目统计范围内无此地区数据<br/>（' + C.NO_DATA_LABEL + '）</span>';
          }
          return '<div style="font-size:13px;font-weight:600;margin-bottom:5px">' + r.province +
            ' <span style="color:' + C.INK_MUTED + ';font-weight:400;font-size:11px">' + r.region + '</span></div>' +
            row(C.REGION[r.region], metric.label, isNum(r[mapMetric]) ? NF.big(r[mapMetric]) + ' ' + unit : null) +
            row(C.REGION[r.region], '博物馆数量', isNum(r.museum_count) ? NF.int(r.museum_count) + ' 家' : null) +
            row(C.REGION[r.region], '馆藏文物', isNum(r.collection_count) ? NF.big(r.collection_count) + ' 件(套)' : null) +
            row(C.REGION[r.region], '参观人次', isNum(r.visitors_wan) ? NF.big(r.visitors_wan) + ' 万人次' : null) +
            row(C.REGION[r.region], '每百万人博物馆数',
                isNum(r.museums_per_million_population) ? NF.f(r.museums_per_million_population, 2) : null) +
            row(C.REGION[r.region], '平均每馆参观人次',
                isNum(r.average_visitors_per_museum) ? NF.f(r.average_visitors_per_museum, 1) + ' 万人次' : null) +
            '<div style="margin-top:6px;color:' + C.INK_MUTED + ';font-size:11px">点击可联动其他模块</div>';
        }
      },
      visualMap: {
        type: 'continuous',
        left: 18, bottom: 26,
        min: useLog ? Math.log10(Math.max(1, Math.min.apply(null, present))) : Math.min.apply(null, present),
        max: useLog ? Math.log10(Math.max.apply(null, present)) : Math.max.apply(null, present),
        calculable: false,
        itemWidth: 12, itemHeight: 150,
        text: ['高', '低'],
        textGap: 6,
        textStyle: { color: C.INK_MUTED, fontSize: 11 },
        inRange: { color: C.SEQ },
        formatter: v => useLog ? NF.big(Math.pow(10, v)) : NF.big(v)
      },
      series: [{
        type: 'map',
        map: 'china',
        roam: false,
        zoom: 1,
        /* 只给上下边距、不给左右：同时给 left/right 时 ECharts 会把地图拉伸
           铺满整个矩形，容器多宽地图就多宽（实测宽 1740 的容器把地图拉成
           2.72 的宽高比）。只给上下时它保持真实宽高比（≈1.0）适配并水平居中，
           地图不会被压扁。 */
        top: 14, bottom: 14,
        /* 省份名称直接标在图上：中栏是本页面积最大的图形，如果不标名，
           读者无法把色块与省份对应起来，只能依赖悬停——大屏是「一眼看懂」
           的场景，悬停不算数。
           地图底色从深蓝 #184f95 渐变到近白 #cde2fb，单一字色无法在两端都
           保持对比，因此采用制图学的「白色文字 + 深色描边」halo：白色在深色
           省份上清晰，深色描边在近白省份上提供轮廓，两端都可读。
           东部省份面积小、名称密（京/津/冀/沪），用 labelLayout.hideOverlap
           自动抑制压盖——被隐藏的名称仍可通过悬停查看。 */
        label: {
          show: true, color: '#ffffff', fontSize: 9,
          textBorderColor: 'rgba(6,16,26,.9)', textBorderWidth: 3
        },
        labelLayout: { hideOverlap: true },
        itemStyle: {
          areaColor: C.NO_DATA,
          borderColor: '#0d1a28',
          borderWidth: 0.8
        },
        emphasis: {
          label: {
            show: true, color: '#ffffff', fontSize: 11, fontWeight: 600,
            textBorderColor: 'rgba(6,14,22,.9)', textBorderWidth: 3
          },
          itemStyle: { areaColor: '#ffffff', borderColor: '#ffffff', borderWidth: 1.6, opacity: .92 }
        },
        select: {
          label: {
            show: true, color: '#ffffff', fontSize: 11,
            textBorderColor: 'rgba(6,14,22,.9)', textBorderWidth: 3
          },
          itemStyle: { areaColor: '#ffffff', borderColor: '#ffffff' }
        },
        selectedMode: 'single',
        data: data.map(d => ({
          name: d.name,
          value: d.value === null ? NaN : (useLog ? Math.log10(Math.max(1, d.value)) : d.value),
          __row: d.__row,
          __raw: d.value
        }))
      }]
    });

    inst.off('click');
    inst.on('click', p => {
      const r = p.data && p.data.__row;
      if (r) MV.setProvince(r.province === MV.state.province ? null : r.province);
      else MV.setProvince(null);
    });
  }

  /* ======================================================================
     2. 全国发展趋势（2×2 小型趋势图，单序列 —— 不使用双 Y 轴）
     ====================================================================== */
  /* 每张小趋势图标注它实际取自哪套口径：
     「备案博物馆」口径不公布馆藏数，若强行跟随口径切换会显示"暂无数据"，
     因此馆藏一张固定使用文化和旅游部公报的「博物馆文物藏品」序列，并在图注中标明。 */
  const SPARKS = [
    { id: 'chart-sp-museum',     cap: 'sp-museum',     unit: '家',     acc: '#3987e5',
      follow: true,  key: 'museums',      label: '博物馆数量' },
    { id: 'chart-sp-collection', cap: 'sp-collection', unit: '万件',   acc: '#199e70',
      follow: false, key: 'collections_museum_wan', fixedCaliber: 'MCT_MUSEUM',
      label: '博物馆文物藏品', note: '固定采用文化和旅游部公报·博物馆文物藏品口径' },
    { id: 'chart-sp-visitors',   cap: 'sp-visitors',   unit: '亿人次', acc: '#c98500',
      follow: true,  key: 'visitors_100m', label: '参观人次' },
    { id: 'chart-sp-exhibition', cap: 'sp-exhibition', unit: '万个',   acc: '#e66767',
      follow: true,  key: 'exhibitions_10k', label: '陈列展览' }
  ];
  /* 默认口径取构建脚本给出的第一个（国家文物局备案博物馆口径） */
  let trendCaliber = ((D.national && D.national.calibers && D.national.calibers[0]) || {}).key || null;

  function trendSeries() {
    const N = D.national || {};
    if (!trendCaliber) return [];
    return (N.series && N.series[trendCaliber]) ? N.series[trendCaliber] : [];
  }

  function renderTrendCaliber() {
    const sel = document.getElementById('trend-caliber');
    const opts = (D.national && D.national.calibers) || [];
    if (!opts.length) { sel.style.display = 'none'; return; }
    if (!trendCaliber) trendCaliber = opts[0].key;
    sel.innerHTML = opts.map(o =>
      '<option value="' + o.key + '"' + (o.key === trendCaliber ? ' selected' : '') + '>' +
      o.label + '</option>').join('');
    sel.onchange = () => { trendCaliber = sel.value; renderSparks(); };
  }

  function renderSparks() {
    const N = D.national || {};

    SPARKS.forEach((cfg) => {
      const series = cfg.follow
        ? trendSeries()
        : ((N.series && N.series[cfg.fixedCaliber]) || []);
      const k = cfg.key;
      const pts = series.map(s => [s.year, isNum(s[k]) ? Number(s[k]) : null]);
      const valid = series.filter(s => isNum(s[k]));

      const capEl = document.getElementById(cfg.cap);
      capEl.textContent = valid.length
        ? NF.big(valid[valid.length - 1][k]) + ' ' + cfg.unit
        : C.NO_DATA_LABEL;

      if (!valid.length) {
        MV.showEmpty(cfg.id, C.NO_DATA_LABEL);
        return;
      }

      MV.chart(cfg.id, {
        grid: { left: 44, right: 14, top: 26, bottom: 20 },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'line', lineStyle: { color: 'rgba(255,255,255,.22)', width: 1 } },
          /* 取值方式必须与序列 data 的形态一致：这几张小图用的是
             category 轴 + 纯数值序列（data: [4700, 4873, …]），
             此时 p.value 就是**这个数字本身**，不是 [年份, 数值]。
             原先写 p.value[0] / p.value[1] 会双双取到 undefined，
             tooltip 显示成「undefined年 / 暂无数据」——正是「悬停看不到数据」
             的成因。年份取 p.name（类目名），数值取 p.value。 */
          formatter: ps => {
            const p = ps[0];
            const v = p.value;
            return '<b>' + p.name + '年</b>' +
              row(cfg.acc, cfg.label, isNum(v) ? NF.big(v) + ' ' + cfg.unit : null) +
              (cfg.note ? '<div style="color:' + C.INK_MUTED + ';font-size:11px;margin-top:3px">' +
                cfg.note + '</div>' : '');
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: pts.map(p => p[0]),
          axisLabel: {
            color: C.INK_MUTED, fontSize: 10,
            interval: Math.max(0, Math.ceil(pts.length / 5) - 1),
            formatter: v => String(v).slice(2)
          },
          axisLine: { lineStyle: { color: C.AXIS } }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: C.INK_MUTED, fontSize: 10, formatter: v => NF.big(v) },
          splitLine: { lineStyle: { color: C.GRID } }
        },
        series: [{
          type: 'line',
          smooth: 0.28,
          symbol: 'circle',
          symbolSize: 5,
          showSymbol: pts.length <= 12,
          connectNulls: false,
          data: pts.map(p => p[1]),
          lineStyle: { width: 2, color: cfg.acc },
          itemStyle: { color: cfg.acc, borderColor: C.SURFACE, borderWidth: 1.5 },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: cfg.acc + '4d' },
                { offset: 1, color: cfg.acc + '00' }
              ]
            }
          }
        }]
      });
    });
  }

  /* ======================================================================
     3. 核心四象限
     ====================================================================== */
  /* label 用于坐标轴名称（可以长），short 用于下拉框（必须短，否则面板标题被挤换行） */
  const QUAD_DIMS = [
    { key: 'museum_count',   label: '博物馆数量',           short: '博物馆数量',    unit: '家' },
    { key: 'collection_count', label: '馆藏数量',           short: '馆藏数量',      unit: '件(套)' },
    { key: 'visitors_wan',   label: '参观人次',             short: '参观人次',      unit: '万人次' },
    { key: 'museums_per_million_population', label: '每百万人博物馆数量', short: '每百万人馆数', unit: '家/百万人' },
    { key: 'visitors_per_million_population', label: '每百万人参观人次', short: '每百万人参观', unit: '万人次/百万人' },
    { key: 'average_visitors_per_museum', label: '平均每家博物馆参观人次', short: '平均每馆参观', unit: '万人次/家' },
    { key: 'average_collections_per_museum', label: '平均每家博物馆馆藏', short: '平均每馆馆藏', unit: '件(套)/家' }
  ];
  let quadX = 'museum_count';
  let quadY = 'museums_per_million_population';
  const activeRegions = new Set(C.REGIONS);

  function renderQuadSelects() {
    const mk = (el, val) => {
      el.innerHTML = QUAD_DIMS.map(d =>
        '<option value="' + d.key + '"' + (d.key === val ? ' selected' : '') + '>' +
        (d.short || d.label) + '</option>').join('');
    };
    mk(document.getElementById('quad-x'), quadX);
    mk(document.getElementById('quad-y'), quadY);
    document.getElementById('quad-x').onchange = e => { quadX = e.target.value; renderQuadrant(); };
    document.getElementById('quad-y').onchange = e => { quadY = e.target.value; renderQuadrant(); };
  }

  /* 图例芯片的色块必须与散点的标记形状一致（圆/三角/菱形/方）。
     散点把「区域」同时编码为颜色与形状，若图例只画统一的小方块，
     读者就无从知道形状也在承载信息——图例与标记不一致是明确的误导。 */
  function renderRegionChips() {
    const box = document.getElementById('quad-region-chips');
    box.innerHTML = C.REGIONS.map(r =>
      '<span class="chip' + (activeRegions.has(r) ? '' : ' off') + '" data-r="' + r + '">' +
      '<span class="swatch sym-' + C.REGION_SYMBOL[r] +
      '" style="background:' + C.REGION[r] + '"></span>' + r + '</span>').join('');
    box.querySelectorAll('.chip').forEach(ch => {
      ch.onclick = () => {
        const r = ch.dataset.r;
        if (activeRegions.has(r)) activeRegions.delete(r); else activeRegions.add(r);
        if (!activeRegions.size) activeRegions.add(r);   // 至少保留一个
        renderRegionChips(); renderQuadrant();
      };
    });
  }

  /* 网格边距同时被 grid 与轴名称的定位用到，抽成常量避免两处漂移。
     bottom 要容下两行（刻度数字 + 轴名称），但也不能过大——
     多出来的部分会变成图表下方的空白，把洞察框推远。 */
  const QUAD_GRID = { left: 112, right: 62, top: 30, bottom: 48 };

  function renderQuadrant() {
    const rows = provincesForYear().filter(r => activeRegions.has(r.region));
    const xd = QUAD_DIMS.find(d => d.key === quadX);
    const yd = QUAD_DIMS.find(d => d.key === quadY);

    const usable = rows.filter(r => isNum(r[quadX]) && isNum(r[quadY]));
    if (usable.length < 3) {
      MV.showEmpty('chart-quadrant', '可用省份不足，无法绘制四象限（当前组合：' +
        xd.label + ' × ' + yd.label + '）');
      document.getElementById('quad-insight').innerHTML = '';
      return;
    }

    /* 轴范围先算出来，并**显式写进 axis 配置**：
       参考线的标注要按「值 → 像素」自己换算，如果轴范围交给 ECharts 自动
       决定，浮点取整的细节一旦和这里不一致，标注就会与参考线错位。
       显式指定后两边共用同一个 xb / yb，物理上不可能漂移。 */
    const xb = axisBounds(usable.map(r => Number(r[quadX])));
    const yb = axisBounds(usable.map(r => Number(r[quadY])));

    const mx = usable.reduce((s, r) => s + Number(r[quadX]), 0) / usable.length;
    const my = usable.reduce((s, r) => s + Number(r[quadY]), 0) / usable.length;

    /* ------------------------------------------------------------------
       只给「值得注意」的省份加标签。
       31 个省份全部标注在任何合理尺寸下都会糊成一团，而且读者其实只需要
       抓住离群点。规则：两轴各自的前 5 名与后 3 名取并集，
       其余省份通过 tooltip 查看（这样标签数量通常落在 10—14 个）。
       ------------------------------------------------------------------ */
    const bx = usable.slice().sort((a, b) => Number(b[quadX]) - Number(a[quadX]));
    const by = usable.slice().sort((a, b) => Number(b[quadY]) - Number(a[quadY]));
    const names = arr => arr.map(r => r.province);   // 必须先分别取名字再合并，
                                                     // 否则数组里会混入对象、map 出 undefined
    const notable = new Set([
      ...names(bx.slice(0, 4)), ...names(bx.slice(-2)),
      ...names(by.slice(0, 4)), ...names(by.slice(-2))
    ]);

    const vmax = Math.max.apply(null, usable.map(u => Number(u.visitors_wan) || 0));

    /* 为什么用「单一系列 + 逐点样式」而不是「每个区域一个系列」：
       ECharts 的 labelLayout.hideOverlap 只在**单个系列内部**消除标签压盖，
       拆成 4 个系列时，分属不同区域的标签（例如江苏与河南）即使完全重合也不会被隐藏。
       合并成一个系列后，全局的去重叠才能生效；区域身份改由逐点的
       symbol（形状）与 itemStyle.color（颜色）承载，编码信息不丢失。 */
    const points = usable.filter(r => activeRegions.has(r.region)).map(r => ({
      value: [Number(r[quadX]), Number(r[quadY])],
      __name: r.province, __row: r,
      symbol: C.REGION_SYMBOL[r.region],
      symbolSize: isNum(r.visitors_wan) && vmax
        ? 8 + 20 * Math.sqrt(Math.max(0, Number(r.visitors_wan)) / vmax)
        : 10,
      itemStyle: {
        color: C.REGION[r.region], opacity: .9,
        borderColor: C.SURFACE, borderWidth: 1.5
      }
    }));

    const groups = [{
      name: '省级行政区',
      type: 'scatter',
      data: points,
      label: {
        show: true, position: 'right', color: C.INK_2, fontSize: 11,
        formatter: p => notable.has(p.data.__name) ? p.data.__name : '', distance: 5
      },
      labelLayout: { hideOverlap: true },
      emphasis: {
        label: { show: true, color: C.INK, fontWeight: 'bold', fontSize: 12 },
        itemStyle: { borderColor: '#fff', borderWidth: 2, opacity: 1 }
      }
    }];

    const quadChart = MV.chart('chart-quadrant', {
      /* left 要同时容纳轴刻度数字与**旋转的纵轴名称**。名称比数字宽得多，
         原来给 76px 时「每百万人博物馆数量（家/百万人）」会被左边缘截断，
         因此放到 92px；bottom 同理为横轴名称留出一行。 */
      grid: QUAD_GRID,
      tooltip: {
        trigger: 'item',
        formatter: p => {
          const r = p.data.__row;
          if (!r) return '';
          return '<div style="font-size:13px;font-weight:600;margin-bottom:5px">' + r.province +
            ' <span style="color:' + C.INK_MUTED + ';font-weight:400;font-size:11px">' + r.region + '</span></div>' +
            row(C.REGION[r.region], xd.label, NF.big(Number(r[quadX])) + ' ' + xd.unit) +
            row(C.REGION[r.region], yd.label, NF.f(Number(r[quadY]), 2) + ' ' + yd.unit) +
            row(C.REGION[r.region], '博物馆数量', isNum(r.museum_count) ? NF.int(r.museum_count) + ' 家' : null) +
            row(C.REGION[r.region], '馆藏数量', isNum(r.collection_count) ? NF.big(r.collection_count) + ' 件(套)' : null) +
            row(C.REGION[r.region], '参观人次', isNum(r.visitors_wan) ? NF.big(r.visitors_wan) + ' 万人次' : null) +
            row(C.REGION[r.region], '珍贵文物比例', isNum(r.precious_ratio) ? NF.pct(r.precious_ratio, 2) : null);
        }
      },
      xAxis: {
        type: 'value', min: xb.min, max: xb.max,
        /* 不在图内写轴名称：面板很矮（约 330px），而轴名称比绘图区还长，
           会把纵轴名称顶进上方「横轴 / 纵轴」选择器里。轴的身份由面板头部
           的选择器承载，图内的说明文字统一交给 graphic（见 meanLabels）。 */
        name: '',
        nameTextStyle: { color: C.INK_MUTED, fontSize: 11 },
        axisLabel: { color: C.INK_MUTED, fontSize: 10.5, formatter: v => NF.big(v) },
        splitLine: { lineStyle: { color: C.GRID } },
        axisLine: { lineStyle: { color: C.AXIS } }
      },
      yAxis: {
        type: 'value', min: yb.min, max: yb.max, name: '',
        axisLabel: { color: C.INK_MUTED, fontSize: 10.5, formatter: v => NF.big(v) },
        splitLine: { lineStyle: { color: C.GRID } }
      },
      series: groups.concat([{
        /* 均值参考线：用一条不可见序列承载 markLine，避免污染分组数据 */
        type: 'scatter', data: [], silent: true,
        markLine: {
          silent: true, symbol: 'none',
          /* 均值线的标签交给 graphic 图层画（见下方 meanLabels）：
             markLine 的 label 只能贴着线的端点，纵向均值的标签会被主轴自动
             旋转 90°，而且无论放哪一头都压在点上或轴名上。 */
          label: { show: false },
          lineStyle: { color: 'rgba(255,255,255,.30)', type: 'dashed', width: 1 },
          data: [{ xAxis: mx }, { yAxis: my }]
        }
      }]),
      legend: { show: false }
    });

    meanLabels(quadChart, mx, my, xd, yd, xb, yb);

    renderInsight(usable, mx, my, xd, yd);
  }

  /** 把 val 向上取到 1/2/3/5×10ⁿ 中最接近的一档（ECharts nice() 的复刻）。 */
  function niceCeil(val) {
    const exp = Math.floor(Math.log(val) / Math.LN10);
    const base = Math.pow(10, exp);
    const f = val / base;
    return base * (f <= 1 ? 1 : f <= 2 ? 2 : f <= 3 ? 3 : f <= 5 ? 5 : 10);
  }

  /** value 轴应使用的区间（下限固定为 0，上限取整到 1/2/5×10ⁿ）。
   *  之所以自己算而不交给自动：参考线的标注要按「值 → 像素」换算，
   *  必须与轴实际使用的区间完全一致，否则标注与参考线会错位。
   *  非空数据实测：博物馆数量 [0,1000]、每百万人馆数 [0,10]。 */
  function axisBounds(values) {
    const lo = 0;                                   // 两个轴都从 0 起
    const hi = Math.max.apply(null, values);
    const splitNumber = 5;                          // ECharts 默认
    const step = niceCeil((hi - lo) / splitNumber);
    return { min: lo, max: niceCeil(Math.ceil(hi / step)) * step };
  }

  /* 均值参考线的文字标注。
     为什么不用 markLine 自带的 label：
       纵向均值的标签会被 ECharts 跟随主轴自动旋转 90° 显示，而且只能贴在
       线的某一端——绘图区左下角点很密，贴哪端都会压住数据点或轴名称。
     改为用 graphic 图层把「轴名称 + 均值」合成一行写在绘图区外侧，
       位置由 grid 边距推出，与网格同源。
     显式带 id，setOption 的同 id 元素会被整块替换，重复渲染不会累积。 */
  function meanLabels(chart, mx, my, xd, yd, xb, yb) {
    if (!chart) return;

    /* 坐标换算不调用 chart.convertToPixel：实测调用返回 null，会把整段标注
       静默跳过、一个字都画不出来（已经踩过一次）。
       这里改为自己按「轴范围 → 像素」线性映射：输入只有轴区间（xb/yb，
       与 axis 配置同源）和 grid 边距，结果可预测、不依赖 ECharts 内部状态。 */
    const W = chart.getWidth(), H = chart.getHeight();
    const L = QUAD_GRID.left, R = W - QUAD_GRID.right;
    const T = QUAD_GRID.top, B = H - QUAD_GRID.bottom;
    const CY = (T + B) / 2;

    const xPix = L + ((mx - xb.min) / (xb.max - xb.min)) * (R - L);
    /* 纵轴从下往上：值越大，像素 y 越小 */
    const yPix = B - ((my - yb.min) / (yb.max - yb.min)) * (B - T);

    chart.setOption({
      graphic: [
        /* 轴名称直接带上均值，不再单独写两条「xx均值」浮标——
           浮标无论放哪都要和刻度或数据点抢位置，合并进轴名称后，
           整张图只剩两条说明文字，位置固定、互不干扰。 */
        /* 横轴名居中放在绘图区正下方（bottom 已为它留出一行）。
           不能靠右对齐：绘图区右边界不是画布右边界，右对齐的文字会溢出到
           画布外被裁掉（已踩过）。居中则左右都有富余，最长的组合也放得下。 */
        {
          id: 'mv-axname-x', type: 'text', silent: true, z: 3,
          left: (L + R) / 2, top: B + 21,
          style: {
            text: xd.short + '（' + xd.unit + '）　均值 ' + NF.big(mx),
            fill: C.INK_MUTED, fontSize: 10,
            align: 'center'
          }
        },
        {
          /* 纵轴名竖排。ECharts graphic 的文字旋转在本项目所用的打包版本里
             两种写法（元素 rotation / style.rotate）都不生效，横排的
             「每百万人馆数」有 60px 宽，会越过左边距顶进绘图区。
             这里改用「逐字换行」实现竖排：每字一行，效果等价于旋转 90°，
             且不依赖任何旋转 API。名称本身也缩到最短的维度名。 */
          id: 'mv-axname-y', type: 'text', silent: true, z: 3,
          left: L - 48, top: T + 2,
          style: {
            text: yd.short.split('').join('\n'),
            fill: C.INK_MUTED, fontSize: 10, lineHeight: 11,
            align: 'center'
          }
        },
        {
          /* 纵轴均值单独成一行，压在横线右端上方；横线左端是点最密的地方 */
          id: 'mv-mean-y', type: 'text', silent: true, z: 3,
          left: xPix + 6, top: yPix - 13,
          style: {
            text: '纵轴均值 ' + NF.big(my),
            fill: C.INK_MUTED, fontSize: 10
          }
        }
      ]
    });
  }

  /* 数据洞察：全部由真实数据计算，不做因果推断。
     控制在 4 条以内，避免撑爆右栏（这一栏是滚动的，但仍以少而准为好）。 */
  function renderInsight(rows, mx, my, xd, yd) {
    const box = document.getElementById('quad-insight');

    const hxhy = rows.filter(r => Number(r[quadX]) >= mx && Number(r[quadY]) >= my);
    const lxhy = rows.filter(r => Number(r[quadX]) < mx && Number(r[quadY]) >= my);

    const totalMuseums = rows.reduce((s, r) => s + (Number(r.museum_count) || 0), 0);
    const hxhyMuseums = hxhy.reduce((s, r) => s + (Number(r.museum_count) || 0), 0);
    const share = totalMuseums ? 100 * hxhyMuseums / totalMuseums : null;

    const vv = rows.filter(r => isNum(r[quadX]) && isNum(r[quadY]));
    const rho = vv.length >= 4
      ? pearson(vv.map(r => Number(r[quadX])), vv.map(r => Number(r[quadY]))) : null;

    /* 控制在 3 条：右栏纵向空间有限，洞察以少而准为先。
       均值线的数值已经标在图上，这里不重复。 */
    const items = [];

    if (rho !== null) {
      items.push('两个指标的 Pearson 相关系数 <b>r = ' + rho.toFixed(2) + '</b>（' +
        strength(rho) + '，n=' + vv.length + '）。<b>相关不代表因果</b>。');
    }

    if (hxhy.length) {
      items.push('「双高」象限 <b>' + hxhy.length + '</b> 个（' +
        hxhy.map(r => r.province).join('、') + '），占博物馆总数 <b>' +
        (isNum(share) ? share.toFixed(1) + '%' : C.NO_DATA_LABEL) + '</b>。');
    }

    if (lxhy.length) {
      items.push('有 <b>' + lxhy.length + '</b> 个省份绝对规模低于均值、人口标准化却高于均值（' +
        lxhy.map(r => r.province).join('、') + '）——<b>只看总量会掩盖人口因素</b>。');
    }

    items.push('<span style="color:var(--ink-muted)">点大小＝参观人次，颜色＋形状＝区域；' +
      '仅标注两轴前 4 / 后 2 名，其余悬停查看。</span>');

    box.innerHTML = items.map(t =>
      '<div class="insight-item"><span class="marker"></span><span>' + t + '</span></div>').join('');
  }

  function pearson(xs, ys) {
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) {
      const a = xs[i] - mx, b = ys[i] - my;
      num += a * b; dx += a * a; dy += b * b;
    }
    return (dx && dy) ? num / Math.sqrt(dx * dy) : 0;
  }
  function strength(r) {
    const a = Math.abs(r);
    if (a >= 0.8) return '强相关';
    if (a >= 0.5) return '中等相关';
    if (a >= 0.3) return '弱相关';
    return '几乎无线性相关';
  }

  /* ======================================================================
     4. 公共文化服务
     ====================================================================== */
  function renderService() {
    const rows = provincesForYear();
    const key = 'visitors_per_million_population';
    const usable = rows.filter(r => isNum(r[key])).sort((a, b) => Number(b[key]) - Number(a[key]));
    const scope = document.getElementById('service-scope');

    if (!usable.length) {
      MV.showEmpty('chart-service', '公共文化服务指标尚未生成');
      return;
    }
    scope.textContent = '全国 · ' + (D.province && D.province.latest_year) + '年 · 每百万人参观人次';

    const top = usable.slice(0, 8);
    MV.chart('chart-service', {
      grid: { left: 56, right: 66, top: 10, bottom: 22 },
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,.05)' } },
        formatter: ps => {
          const r = usable.find(x => x.province === ps[0].name);
          return '<div style="font-weight:600;margin-bottom:5px">' + r.province +
            ' <span style="color:' + C.INK_MUTED + ';font-weight:400;font-size:11px">' + r.region + '</span></div>' +
            row(C.REGION[r.region], '每百万人参观人次', NF.f(r[key], 1) + ' 万人次') +
            row(C.REGION[r.region], '参观人次', isNum(r.visitors_wan) ? NF.big(r.visitors_wan) + ' 万人次' : null) +
            row(C.REGION[r.region], '常住人口', isNum(r.population_wan) ? NF.big(r.population_wan) + ' 万人' : null) +
            row(C.REGION[r.region], '平均每家博物馆参观人次',
                isNum(r.average_visitors_per_museum) ? NF.f(r.average_visitors_per_museum, 1) : null) +
            '<div style="color:' + C.INK_MUTED + ';font-size:11px;margin-top:5px">' +
            '描述性指标，不构成管理绩效评价</div>';
        }
      },
      xAxis: {
        type: 'value', axisLabel: { color: C.INK_MUTED, fontSize: 10.5, formatter: v => NF.big(v) },
        splitLine: { lineStyle: { color: C.GRID } }
      },
      yAxis: {
        type: 'category', inverse: true,
        data: top.map(r => r.province),
        axisLabel: { color: C.INK_2, fontSize: 11, interval: 0 },
        axisLine: { lineStyle: { color: C.AXIS } }, axisTick: { show: false }
      },
      series: [{
        type: 'bar',
        barWidth: '62%',
        data: top.map(r => ({
          value: Number(r[key]),
          itemStyle: {
            color: C.REGION[r.region],
            borderRadius: [0, 4, 4, 0]
          }
        })),
        label: {
          show: true, position: 'right', color: C.INK_2, fontSize: 10.5,
          formatter: p => NF.f(p.value, 1)
        }
      }]
    });
  }

  /* ======================================================================
     5. 国际比较
     ====================================================================== */
  function renderIntl() {
    const intl = D.international || {};
    /* 首页只展示 UNESCO 统一口径（同一年份、同一来源，可比性最好）。
       各国自报口径（年份与定义都不一致）放在「国际比较」页的切换里，
       避免在大屏上做不可比的横向比较。 */
    const rows = (intl.rows || []).filter(r => isNum(r.museum_count) && r.caliber_group === 'B');
    const note = document.getElementById('intl-note');

    if (!rows.length) {
      MV.showEmpty('chart-intl', '国际比较数据尚未获取到稳定公开数据');
      if (note) note.textContent = '';
      return;
    }

    /* 首页空间有限，只展示数量最多的前 10 个国家；
       但**必须强制包含中国** —— 否则"中国在世界什么位置"这个问题就无法回答
       （UNESCO 口径下中国的 1,030 家排在前十之外）。完整名单见「国际比较」页。 */
    const byCount = rows.slice().sort((a, b) => Number(b.museum_count) - Number(a.museum_count));
    const picked = byCount.slice(0, 10);
    const cn = byCount.find(r => r.country === '中国');
    if (cn && !picked.includes(cn)) picked.push(cn);
    const sorted = picked.sort((a, b) => Number(a.museum_count) - Number(b.museum_count));
    if (note) note.textContent = 'UNESCO 统一口径 2019 · 前10国 + 中国';

    MV.chart('chart-intl', {
      grid: { left: 58, right: 92, top: 8, bottom: 22 },
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,.05)' } },
        formatter: ps => {
          const r = sorted.find(x => x.country === ps[0].name);
          if (!r) return '';
          return '<div style="font-weight:600;margin-bottom:5px">' + r.country + '</div>' +
            row('#3987e5', '博物馆数量', NF.int(r.museum_count) + ' 家') +
            row('#3987e5', '统计年份', r.year + ' 年') +
            row('#3987e5', '每百万人博物馆数', isNum(r.museums_per_million) ? NF.f(r.museums_per_million, 1) : null) +
            '<div style="color:' + C.INK_MUTED + ';font-size:11px;margin-top:5px;max-width:250px;line-height:1.5">' +
            (r.caliber_note || '') + '</div>';
        }
      },
      xAxis: {
        type: 'value', axisLabel: { color: C.INK_MUTED, fontSize: 10.5, formatter: v => NF.big(v) },
        splitLine: { lineStyle: { color: C.GRID } }
      },
      yAxis: {
        type: 'category',
        data: sorted.map(r => r.country),
        axisLabel: { color: C.INK_2, fontSize: 11, interval: 0 },
        axisLine: { lineStyle: { color: C.AXIS } }, axisTick: { show: false }
      },
      series: [{
        type: 'bar', barWidth: '56%',
        data: sorted.map(r => ({
          value: Number(r.museum_count),
          itemStyle: {
            color: r.country === '中国' ? '#c98500' : '#3987e5',
            borderRadius: [0, 4, 4, 0]
          }
        })),
        label: {
          show: true, position: 'right', color: C.INK_2, fontSize: 10.5,
          formatter: p => {
            const r = sorted.find(x => x.country === p.name);
            return NF.int(p.value) + (r ? '（' + r.year + '）' : '');
          }
        }
      }]
    });
  }

  /* ======================================================================
     联动
     ====================================================================== */
  /* 地图选中项的变化。
     这里只更新**地图面板自己**的范围角标。
     原实现会把页头的「当前范围」改成省份名，并重新渲染公共文化服务与国际比较——
     但那两张图根本不读 MV.state.province，重渲染出来的内容一模一样。
     结果就是角标写着「当前范围 山东」，下面的图却还是全国数据 —— 角标在说谎。
     现在改为：角标归属地图面板，并显示该省的真实数值，状态与含义对得上。 */
  function applyProvinceFilter(p) {
    const el = document.getElementById('map-scope');
    const yr = (D.province && D.province.latest_year) || '';
    if (el) {
      if (!p) {
        el.innerHTML = yr + ' 年 · 全国 31 省';
      } else {
        const r = provincesForYear().find(x => x.province === p);
        el.innerHTML = '<b>' + p + '</b> · ' + (r && isNum(r.museum_count)
          ? NF.int(r.museum_count) + ' 家' : C.NO_DATA_LABEL);
      }
    }
    MV.bus.emit('provinceChanged', p);
  }

  /* ======================================================================
     启动
     ====================================================================== */
  function boot() {
    /* 各面板自己标注年份与口径，不再在页头挂全局「数据年份」——
       本屏的 KPI 是 2024、地图与四象限是 2022、国际比较是 2019，
       挂一个全局年份必然误导。这里把各自的年份分别写进对应面板。 */
    const qy = document.getElementById('quad-year');
    if (qy && D.province && D.province.latest_year) qy.textContent = D.province.latest_year + ' 年 · 分省';
    const ts = document.getElementById('trend-span');
    if (ts) {
      const s = trendSeries();
      const ys = s.map(x => x.year).filter(isNum);
      if (ys.length) ts.textContent = Math.min.apply(null, ys) + '–' + Math.max.apply(null, ys) + ' 年';
    }

    renderKPI();
    renderMapTabs();
    renderMap();
    renderTrendCaliber();
    renderSparks();
    renderQuadSelects();
    renderRegionChips();
    renderQuadrant();
    renderService();
    renderIntl();
    applyProvinceFilter(MV.state.province);

    document.getElementById('btn-reset-province').onclick = () => MV.setProvince(null);
    MV.bus.on('province', applyProvinceFilter);

    // 首次进入后重新适配一次，确保字体/布局稳定后再缩放
    setTimeout(() => { MV.resizeAll(); }, 60);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})();
