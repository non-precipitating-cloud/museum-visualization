/* ==========================================================================
   pages.js —— 五个辅助分析页 + 数据说明页 的渲染器
   所有数值来自 window.MUSEUM_DATA；缺测显示"暂无数据"，绝不显示为 0
   ========================================================================== */
(function (global) {
  'use strict';

  const D = global.MUSEUM_DATA || {};
  const C = MV.C, NF = MV.NF, row = MV.row, isNum = MV.isNum;

  /* ---------------------------------------------------------------- 通用 */
  const NAV = [
    ['../index.html', '综合大屏'],
    ['trend.html', '发展趋势'],
    ['space.html', '空间分布'],
    ['region.html', '区域结构'],
    ['collection.html', '馆藏与价值'],
    ['service.html', '公共文化服务'],
    ['international.html', '国际比较'],
    ['data.html', '数据说明']
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function header(title, sub, active) {
    return '<div class="doc-head">' +
      '<h1 class="doc-title">' + esc(title) + '</h1>' +
      '<p class="doc-sub">' + sub + '</p>' +
      '<nav class="main-nav" style="margin-top:14px">' +
      NAV.map(([h, t]) => '<a class="nav-link' + (t === active ? ' active' : '') +
        '" href="' + h + '">' + t + '</a>').join('') +
      '</nav></div>';
  }

  function card(title, question, inner, opt) {
    opt = opt || {};
    return '<div class="card"' + (opt.id ? ' id="' + opt.id + '"' : '') + '>' +
      (title ? '<h2 class="sec">' + esc(title) +
        (question ? ' <span class="panel-question">' + question + '</span>' : '') + '</h2>' : '') +
      inner + '</div>';
  }

  function chartBox(id, h) {
    return '<div class="chart-box" style="height:' + (h || 380) + 'px"><div id="' + id +
      '" style="width:100%;height:100%"></div></div>';
  }

  function empty(msg) {
    return '<div class="nodata-hint" style="height:200px">' + esc(msg || '暂无数据') + '</div>';
  }

  const NO_PROV = '分省数据尚未生成 —— 请运行 scripts/build_dataset.py 并补齐 province_museums.csv / province_population.csv';

  function provRows() {
    return (D.province && D.province.rows) || [];
  }
  function latestProv() {
    return provRows().filter(r => r.year === (D.province && D.province.latest_year));
  }

  /** 各省横向排名条形图（nominal 分类 —— 全部使用同一 slot-1 颜色，不按数值着色） */
  function rankBar(id, rows, key, unit, title, color) {
    const usable = rows.filter(r => isNum(r[key])).sort((a, b) => Number(b[key]) - Number(a[key]));
    if (!usable.length) { MV.showEmpty(id, '暂无数据'); return; }
    const top = usable.slice(0, 20);
    MV.chart(id, {
      title: { text: title, left: 'center', top: 2, textStyle: { color: C.INK_2, fontSize: 12.5, fontWeight: 600 } },
      grid: { left: 62, right: 74, top: 34, bottom: 22 },
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,.05)' } },
        formatter: ps => {
          const r = usable.find(x => x.province === ps[0].name);
          return '<div style="font-weight:600;margin-bottom:5px">' + r.province +
            ' <span style="color:' + C.INK_MUTED + ';font-weight:400;font-size:11px">' + r.region + '</span></div>' +
            row(C.REGION[r.region], title, NF.f(Number(r[key]), 2) + ' ' + unit) +
            row(C.REGION[r.region], '博物馆数量', isNum(r.museum_count) ? NF.int(r.museum_count) + ' 家' : null) +
            row(C.REGION[r.region], '馆藏数量', isNum(r.collection_count) ? NF.big(r.collection_count) + ' 件(套)' : null) +
            row(C.REGION[r.region], '参观人次', isNum(r.visitors_wan) ? NF.big(r.visitors_wan) + ' 万人次' : null);
        }
      },
      xAxis: {
        type: 'value',
        axisLabel: { color: C.INK_MUTED, fontSize: 10.5, formatter: v => NF.big(v) },
        splitLine: { lineStyle: { color: C.GRID } }
      },
      yAxis: {
        type: 'category', inverse: true, data: top.map(r => r.province),
        axisLabel: { color: C.INK_2, fontSize: 11 },
        axisLine: { lineStyle: { color: C.AXIS } }, axisTick: { show: false }
      },
      series: [{
        type: 'bar', barWidth: '62%',
        data: top.map(r => ({
          value: Number(r[key]),
          /* 颜色表示区域身份（不是数值），与四象限、地图图例保持一致 */
          itemStyle: { color: C.REGION[r.region] || color || '#3987e5', borderRadius: [0, 4, 4, 0] }
        })),
        label: {
          show: true, position: 'right', color: C.INK_2, fontSize: 10.5,
          formatter: p => NF.f(p.value, p.value >= 1000 ? 0 : 1)
        }
      }]
    });
  }

  /** 多序列趋势折线（同一张图内**只有一个数值轴**，多个指标共用 0—100 归一化时另作图） */
  function trendLine(id, points, unit, color, opts) {
    opts = opts || {};
    if (!points.length) { MV.showEmpty(id, '暂无数据'); return; }
    MV.chart(id, {
      title: { text: opts.title || '', left: 12, top: 2, textStyle: { color: C.INK_2, fontSize: 12.5, fontWeight: 600 } },
      /* top 要同时容下左上角的图表标题与绘图区顶端那条刻度标签。
         刻度标签以绘图区上边界为中心，向上溢出约半个行高（≈6px）。
         取 34 时标签与标题只隔几像素，看起来几乎贴在一起（A/B 实测两者
         都完整、并没有被裁掉）；放到 46 拉开视觉层次，读起来更清爽。 */
      grid: { left: 62, right: 26, top: opts.title ? 46 : 22, bottom: 34 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: 'rgba(255,255,255,.22)' } },
        /* 与 sparkline 同理：category 轴 + 纯数值序列时 p.value 是数字本身，
           不是 [年份, 数值]。年份取 p.name，数值取 p.value。 */
        formatter: ps => {
          const p = ps[0];
          const v = p.value;
          return '<b>' + p.name + '年</b>' +
            row(color, opts.name || '数值', isNum(v) ? NF.f(v, Number(v) >= 1000 ? 0 : 2) + ' ' + unit : null) +
            (opts.note ? '<div style="color:' + C.INK_MUTED + ';font-size:11px;margin-top:4px;max-width:280px;line-height:1.5">' + opts.note + '</div>' : '');
        }
      },
      xAxis: {
        type: 'category', boundaryGap: false, data: points.map(p => p[0]),
        axisLabel: { color: C.INK_MUTED, fontSize: 10.5, interval: Math.max(0, Math.ceil(points.length / 14) - 1) },
        axisLine: { lineStyle: { color: C.AXIS } }
      },
      yAxis: {
        type: 'value', scale: !!opts.scale,
        axisLabel: { color: C.INK_MUTED, fontSize: 10.5, formatter: v => NF.big(v) },
        splitLine: { lineStyle: { color: C.GRID } }
      },
      series: [{
        type: 'line', smooth: 0.25, symbol: 'circle', symbolSize: 6,
        showSymbol: points.length <= 16,
        connectNulls: false,
        data: points.map(p => p[1]),
        lineStyle: { width: 2, color: color },
        itemStyle: { color: color, borderColor: C.SURFACE, borderWidth: 1.5 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: color + '40' }, { offset: 1, color: color + '00' }]
          }
        },
        markPoint: opts.markLast && points.length ? {
          symbol: 'circle', symbolSize: 1,
          label: {
            show: true, color: color, fontSize: 12, fontWeight: 700,
            formatter: () => NF.big(points[points.length - 1][1]) + ' ' + unit,
            offset: [0, -14]
          },
          data: [{ coord: points[points.length - 1] }]
        } : undefined
      }]
    });
  }

  /** 两指标散点 —— 带均值参考线与真实相关系数 */
  function scatterTwo(id, rows, kx, ky, labelX, labelY, unitX, unitY) {
    const usable = rows.filter(r => isNum(r[kx]) && isNum(r[ky]));
    if (usable.length < 3) { MV.showEmpty(id, '可用数据不足，无法绘制'); return null; }
    const mx = usable.reduce((s, r) => s + Number(r[kx]), 0) / usable.length;
    const my = usable.reduce((s, r) => s + Number(r[ky]), 0) / usable.length;

    const groups = C.REGIONS.map(reg => ({
      name: reg, type: 'scatter', symbol: C.REGION_SYMBOL[reg], symbolSize: 11,
      itemStyle: { color: C.REGION[reg], opacity: .9, borderColor: C.SURFACE, borderWidth: 1.5 },
      label: {
        show: true, position: 'right', color: C.INK_2, fontSize: 10.5,
        formatter: p => p.data.__name, distance: 4
      },
      emphasis: { label: { show: true, color: C.INK, fontSize: 11.5, fontWeight: 'bold' } },
      data: usable.filter(r => r.region === reg).map(r => ({
        value: [Number(r[kx]), Number(r[ky])], __name: r.province, __row: r
      }))
    }));

    MV.chart(id, {
      grid: { left: 68, right: 44, top: 26, bottom: 52 },
      tooltip: {
        trigger: 'item',
        formatter: p => {
          const r = p.data.__row; if (!r) return '';
          return '<div style="font-weight:600;margin-bottom:5px">' + r.province +
            ' <span style="color:' + C.INK_MUTED + ';font-weight:400;font-size:11px">' + r.region + '</span></div>' +
            row(C.REGION[r.region], labelX, NF.f(Number(r[kx]), 2) + ' ' + unitX) +
            row(C.REGION[r.region], labelY, NF.f(Number(r[ky]), 2) + ' ' + unitY);
        }
      },
      xAxis: {
        type: 'value', name: labelX, nameLocation: 'middle', nameGap: 28,
        nameTextStyle: { color: C.INK_MUTED, fontSize: 11 },
        axisLabel: { color: C.INK_MUTED, fontSize: 10.5, formatter: v => NF.big(v) },
        splitLine: { lineStyle: { color: C.GRID } }, axisLine: { lineStyle: { color: C.AXIS } }
      },
      yAxis: {
        type: 'value', name: labelY, nameTextStyle: { color: C.INK_MUTED, fontSize: 11 },
        axisLabel: { color: C.INK_MUTED, fontSize: 10.5, formatter: v => NF.big(v) },
        splitLine: { lineStyle: { color: C.GRID } }
      },
      series: groups.concat([{
        type: 'scatter', data: [], silent: true,
        markLine: {
          silent: true, symbol: 'none',
          lineStyle: { color: 'rgba(255,255,255,.30)', type: 'dashed', width: 1 },
          label: { color: C.INK_MUTED, fontSize: 10, formatter: p => '均值 ' + NF.big(p.value) },
          data: [{ xAxis: mx }, { yAxis: my }]
        }
      }]),
      legend: { show: false }
    });

    const xs = usable.map(r => Number(r[kx])), ys = usable.map(r => Number(r[ky]));
    return { n: usable.length, r: pearson(xs, ys) };
  }

  function pearson(xs, ys) {
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) { const a = xs[i] - mx, b = ys[i] - my; num += a * b; dx += a * a; dy += b * b; }
    return (dx && dy) ? num / Math.sqrt(dx * dy) : 0;
  }
  function strength(r) {
    const a = Math.abs(r);
    if (a >= 0.8) return '强相关'; if (a >= 0.5) return '中等相关';
    if (a >= 0.3) return '弱相关'; return '几乎无线性相关';
  }

  /** 数据表。列的 raw:true 表示该列的值是**已经构造好的受控 HTML**（如链接），不再转义。 */
  function table(headers, rows, opt) {
    opt = opt || {};
    /* 整列都是空的字段直接不显示。
       动机：一列全空时，它既没有信息量，又会把有数据的列挤窄，整张表看起来
       「到处都是暂无数据」。这里只是**不渲染**这一列，不做任何填充、推算或
       删改原始数据；被省略的列名会写在表下，读者仍能知道哪些字段存在但缺测。 */
    const val = (h, r) => (h.get ? h.get(r) : r[h.key]);
    const filled = h => rows.some(r => {
      const v = val(h, r);
      return !(v === null || v === undefined || v === '');
    });
    const omitted = headers.filter(h => !filled(h));
    const cols = omitted.length === headers.length ? headers : headers.filter(filled);

    return '<div class="table-wrap"' + (opt.maxH ? ' style="max-height:' + opt.maxH + 'px"' : '') + '>' +
      '<table class="data-table"><thead><tr>' +
      cols.map(h => '<th>' + esc(h.label) + '</th>').join('') +
      '</tr></thead><tbody>' +
      rows.map(r => '<tr>' + cols.map(h => {
        const v = val(h, r);
        if (v === null || v === undefined || v === '') return '<td>' + C.NO_DATA_LABEL + '</td>';
        return '<td>' + (h.raw ? String(v) : esc(v)) + '</td>';
      }).join('') + '</tr>').join('') +
      '</tbody></table></div>' +
      (omitted.length && omitted.length < headers.length
        ? '<p class="note" style="margin-top:8px;color:var(--ink-muted)">' +
          '已省略<strong>整列缺测</strong>的字段：' +
          omitted.map(h => esc(h.label)).join('、') +
          '（这些字段在本表对应范围内没有可核对的公开数值，故不显示，也不做任何推算）。</p>'
        : '');
  }

  /* ======================================================================
     1. 全国发展趋势
     ====================================================================== */
  function pageTrend() {
    const N = D.national || {};
    const series = N.series || {};
    const reg = series.NCHA_REGISTERED || [];
    const mct = series.MCT_MUSEUM || [];

    const p = (arr, key) => arr.filter(x => isNum(x[key])).map(x => [x.year, Number(x[key])]);

    let html = header('全国发展趋势', '—— 中国博物馆发展到了什么规模？各项指标随时间如何变化？', '发展趋势');

    if (!reg.length && !mct.length) {
      html += card('', '', empty('全国年度序列尚未生成'));
      document.getElementById('page-root').innerHTML = html; return;
    }

    html += card('一、博物馆数量趋势', '博物馆总量增长的时间特征？',
      '<div class="grid-2">' +
      '<div>' + chartBox('t-museum-reg', 330) + '</div>' +
      '<div>' + chartBox('t-museum-mct', 330) + '</div>' +
      '</div>' +
      '<p class="note disclaimer" style="margin-top:12px">' +
      '<strong>两套口径必须分开看：</strong>左图为国家文物局「<strong>备案博物馆</strong>」口径' +
      '（含国有与非国有）；右图为文化和旅游部《统计公报》「<strong>文物机构 / 博物馆</strong>」口径。' +
      '两者统计范围不同（例如 2019 年分别为 5535 家与 5132 个），<strong>不得混用或互相换算</strong>。' +
      '</p>');

    html += card('二、馆藏文物趋势', '馆藏资源的积累速度如何？',
      '<div class="grid-2">' +
      '<div>' + chartBox('t-coll-mus', 330) + '</div>' +
      '<div>' + chartBox('t-coll-all', 330) + '</div>' +
      '</div>' +
      '<p class="note disclaimer" style="margin-top:12px">' +
      '左图为「<strong>博物馆文物藏品</strong>」口径；右图为「<strong>全部文物机构</strong>藏品」口径' +
      '（后者包含文物保护管理机构、文物商店等，范围更大）。' +
      '2022 年起公报改用「文物系统管理的国有博物馆」口径，与之前年度<strong>不可直接比较</strong>，' +
      '因此曲线上存在<strong>口径断点</strong>，本项目不做跨口径连线。' +
      '</p>');

    html += card('三、参观人次趋势', '公众参观规模如何变化？',
      '<div class="grid-2">' +
      '<div>' + chartBox('t-vis-reg', 330) + '</div>' +
      '<div>' + chartBox('t-vis-mus', 330) + '</div>' +
      '</div>' +
      '<p class="note disclaimer" style="margin-top:12px">' +
      '2020 年参观人次出现<strong>断崖式下降</strong>，与公共卫生事件导致的闭馆直接相关，' +
      '这是数据中的客观事实，图中<strong>不做任何平滑或剔除处理</strong>。' +
      '</p>');

    html += card('四、陈列展览趋势', '展览供给能力如何变化？',
      chartBox('t-exh', 320, '') +
      '<p class="note disclaimer" style="margin-top:10px">' +
      '展览数在 2020 年降幅明显小于参观人次降幅，说明<strong>供给端的收缩幅度小于需求端</strong>。' +
      '注意：本项目不对该现象做因果解释，仅陈述数据事实。</p>');

    /* 数据表按口径拆成两张。
       原先是把两个序列拼成一个数组（reg.concat(mct)），于是每个年份出现两次，
       且每行都有一半的列属于另一口径、必然是空——表里因此大片「暂无数据」。
       更根本的问题是：两套口径的 museums / visitors_100m / exhibitions_10k
       **字段同名而含义不同**（备案数 vs 公报口径数），并排放在同一行会诱导
       读者横向比较。拆开既消除空列，也重申了「两套口径不混用」的原则。 */
    const regCols = [
      { label: '年份', key: 'year', get: r => isNum(r.year) ? String(r.year) : null },
      { label: '备案博物馆(家)', key: 'museums' },
      { label: '博物馆参观(亿人次)', key: 'visitors_100m' },
      { label: '举办陈列展览(万个)', key: 'exhibitions_10k' }
    ];
    const mctCols = [
      { label: '年份', key: 'year', get: r => isNum(r.year) ? String(r.year) : null },
      { label: '文物机构(个)', key: 'relic_institutions' },
      { label: '博物馆(个)', key: 'museums' },
      { label: '文物机构藏品(万件套)', key: 'collections_all_wan' },
      { label: '博物馆藏品(万件套)', key: 'collections_museum_wan' },
      { label: '文物机构接待(万人次)', key: 'visitors_relic_wan' }
    ];
    const srt = a => a.slice().sort((x, y) => y.year - x.year);

    html += card('五、原始数据表（可逐条核对）', '每个数字都能追溯到 data/processed/national_yearly.csv',
      '<p class="tbl-cap">国家文物局「备案博物馆」口径</p>' +
      table(regCols, srt(reg), { maxH: 300 }) +
      '<p class="tbl-cap" style="margin-top:20px">文化和旅游部《统计公报》「文物机构 / 博物馆」口径</p>' +
      table(mctCols, srt(mct), { maxH: 400 }) +
      '<p class="note disclaimer" style="margin-top:14px">' +
      '两张表<strong>分开列出、不做换算、不合并</strong>：两套口径的统计范围与指标定义都不同' +
      '（例如 2019 年两口径分别为 5,535 家与 5,132 个），并排比较会得出错误结论。' +
      '表中「暂无数据」表示该口径在该年份未公布对应指标，本项目<strong>不做任何推算填补</strong>。</p>');

    document.getElementById('page-root').innerHTML = html;

    // ---- 绘图 ----
    trendLine('t-museum-reg', p(reg, 'museums'), '家', '#3987e5',
      { title: '国家文物局 · 备案博物馆数量', name: '备案博物馆', markLast: true, scale: true });
    trendLine('t-museum-mct', p(mct, 'museums'), '个', '#199e70',
      { title: '文旅部公报 · 博物馆数量', name: '博物馆', markLast: true, scale: true });
    trendLine('t-coll-mus', p(mct, 'collections_museum_wan'), '万件(套)', '#199e70',
      { title: '文旅部公报 · 博物馆文物藏品', name: '博物馆藏品', markLast: true, scale: true });
    trendLine('t-coll-all', p(mct, 'collections_all_wan'), '万件(套)', '#c98500',
      { title: '文旅部公报 · 全部文物机构藏品', name: '文物机构藏品', markLast: true, scale: true });
    trendLine('t-vis-reg', p(reg, 'visitors_100m'), '亿人次', '#c98500',
      { title: '国家文物局 · 博物馆参观人次', name: '参观人次', markLast: true, scale: true });
    trendLine('t-vis-mus', p(mct, 'visitors_relic_wan'), '万人次', '#e66767',
      { title: '文旅部公报 · 文物机构接待观众', name: '接待观众', markLast: true, scale: true });
    trendLine('t-exh', p(reg, 'exhibitions_10k'), '万个', '#e66767',
      { title: '国家文物局 · 博物馆举办陈列展览', name: '展览数', markLast: true, scale: true });
  }

  /* ======================================================================
     2. 空间分布
     ====================================================================== */
  function pageSpace() {
    const rows = latestProv();
    let html = header('空间分布', '—— 博物馆文化资源主要分布在哪里？考虑人口后格局是否改变？', '空间分布');

    if (!rows.length) {
      html += card('', '', '<p class="note disclaimer">' + NO_PROV + '</p>' + empty('分省数据尚未生成'));
      document.getElementById('page-root').innerHTML = html; return;
    }

    const year = D.province.latest_year;
    html += card('一、' + year + ' 年博物馆数量空间分布', '博物馆资源主要在哪里？',
      '<div class="map-2col">' +
      '<div>' + chartBox('s-map', 620) + '</div>' +
      '<div class="note disclaimer" style="margin:0">' +
      '地图使用<strong>单一蓝色顺序色阶</strong>编码数量级（浅→深表示由少到多），未使用彩虹色；' +
      '港澳台因本项目未获得可比的博物馆统计公开数据，显示为「暂无数据」的中性填充，' +
      '<strong>不参与任何统计</strong>。' +
      '<br/><br/>' +
      '说明：地图按中国疆域的真实宽高比绘制，<strong>不做横向拉伸</strong>以迁就容器形状——' +
      '拉扁的地图会系统性地低估南北向的差异，是空间分布图上最常见的失真。' +
      '</div></div>');

    html += card('二、绝对规模排名', '哪些地区博物馆数量更多？',
      '<div class="grid-2">' +
      '<div>' + chartBox('s-rank-museum', 470) + '</div>' +
      '<div>' + chartBox('s-rank-visitors', 470) + '</div>' +
      '</div>');

    html += card('三、人口标准化后排名', '考虑人口规模后，空间格局是否发生变化？',
      '<div class="grid-2">' +
      '<div>' + chartBox('s-rank-mpm', 470) + '</div>' +
      '<div>' + chartBox('s-rank-vpm', 470) + '</div>' +
      '</div>' +
      '<p class="note disclaimer" style="margin-top:12px">' +
      '标准化指标＝原始值 ÷ (年末常住人口 ÷ 100)，单位为「每百万人」。' +
      '对比上下两组排名可以观察到：<strong>绝对规模领先的地区与人口标准化后领先的地区并不一致</strong>，' +
      '这说明仅看总量会掩盖人口因素的影响。</p>');

    html += card('四、分省明细数据表', '可逐条核对',
      table([
        { label: '省份', key: 'province' },
        { label: '区域', key: 'region' },
        { label: '博物馆(家)', key: 'museum_count', get: r => isNum(r.museum_count) ? NF.int(r.museum_count) : null },
        { label: '馆藏(件/套)', key: 'collection_count', get: r => isNum(r.collection_count) ? NF.int(r.collection_count) : null },
        { label: '参观(万人次)', key: 'visitors_wan', get: r => isNum(r.visitors_wan) ? NF.f(r.visitors_wan, 1) : null },
        { label: '常住人口(万人)', key: 'population_wan', get: r => isNum(r.population_wan) ? NF.f(r.population_wan, 1) : null },
        { label: '每百万人博物馆', key: 'museums_per_million_population', get: r => isNum(r.museums_per_million_population) ? NF.f(r.museums_per_million_population, 2) : null },
        { label: '每百万人参观(万人次)', key: 'visitors_per_million_population', get: r => isNum(r.visitors_per_million_population) ? NF.f(r.visitors_per_million_population, 1) : null },
        { label: '平均每馆参观(万人次)', key: 'average_visitors_per_museum', get: r => isNum(r.average_visitors_per_museum) ? NF.f(r.average_visitors_per_museum, 1) : null }
      ], rows.slice().sort((a, b) => (b.museum_count || 0) - (a.museum_count || 0)), { maxH: 560 }));

    document.getElementById('page-root').innerHTML = html;

    // ---- 地图 ----
    /* 地图框按所在栏的实际宽度定高。
       去掉 left/right 后地图会保持真实宽高比（≈1.0）适配，所以框越接近正方，
       地图画出来越大、四周留白越少。这里取栏宽为高，并设一个上限，避免在
       超宽屏上竖出一个比屏幕还高的地图。 */
    (function sizeMapBox() {
      const box = document.getElementById('s-map');
      const cell = box && box.parentElement;          // .chart-box
      const col = cell && cell.parentElement;         // 左栏
      if (!cell || !col) return;
      const w = col.clientWidth;
      if (w > 0) cell.style.height = Math.min(Math.round(w), 780) + 'px';
    })();

    const data = rows.map(r => ({ name: r.province, value: isNum(r.museum_count) ? Number(r.museum_count) : null, __row: r }));
    ['香港', '澳门', '台湾'].forEach(x => { if (!rows.some(r => r.province === x)) data.push({ name: x, value: null }); });
    const present = data.map(d => d.value).filter(v => v !== null);

    MV.chart('s-map', {
      tooltip: {
        trigger: 'item',
        formatter: o => {
          const r = o.data && o.data.__row;
          if (!r) return '<b>' + o.name + '</b><br/><span style="color:' + C.INK_MUTED + '">本项目统计范围内无此地区数据<br/>（' + C.NO_DATA_LABEL + '）</span>';
          return '<div style="font-weight:600;margin-bottom:5px">' + r.province +
            ' <span style="color:' + C.INK_MUTED + ';font-weight:400;font-size:11px">' + r.region + '</span></div>' +
            row(C.REGION[r.region], '博物馆数量', isNum(r.museum_count) ? NF.int(r.museum_count) + ' 家' : null) +
            row(C.REGION[r.region], '馆藏数量', isNum(r.collection_count) ? NF.big(r.collection_count) + ' 件(套)' : null) +
            row(C.REGION[r.region], '参观人次', isNum(r.visitors_wan) ? NF.big(r.visitors_wan) + ' 万人次' : null) +
            row(C.REGION[r.region], '常住人口', isNum(r.population_wan) ? NF.big(r.population_wan) + ' 万人' : null) +
            row(C.REGION[r.region], '每百万人博物馆数', isNum(r.museums_per_million_population) ? NF.f(r.museums_per_million_population, 2) : null);
        }
      },
      visualMap: {
        type: 'continuous', left: 24, bottom: 40, itemWidth: 12, itemHeight: 150,
        min: Math.min.apply(null, present), max: Math.max.apply(null, present),
        textStyle: { color: C.INK_MUTED, fontSize: 11 },
        inRange: { color: C.SEQ }, formatter: v => NF.big(v)
      },
      series: [{
        type: 'map', map: 'china', roam: true, zoom: 1.16,
        /* 只给上下边距、**不给左右**：同时给 left/right 时 ECharts 会把地图
           拉伸铺满整个矩形（实测容器 1740x640 → 地图也被拉成 2.72 的宽高比，
           正是「地图变扁」的成因）。只给上下时它会保持真实宽高比（≈1.0）
           适配并在水平方向居中。aspectScale 对拉伸无效，不要用它去凑。 */
        top: 20, bottom: 20,
        label: { show: true, color: C.INK_MUTED, fontSize: 9.5 },
        itemStyle: { areaColor: C.NO_DATA, borderColor: '#0d1a28', borderWidth: 0.8 },
        emphasis: {
          label: { show: true, color: '#fff', fontSize: 11, fontWeight: 600 },
          itemStyle: { areaColor: '#ffffff', borderColor: '#fff', borderWidth: 1.6, opacity: .92 }
        },
        data: data.map(d => ({ name: d.name, value: d.value === null ? NaN : d.value, __row: d.__row }))
      }]
    });

    // ---- 排名 ----
    rankBar('s-rank-museum', rows, 'museum_count', '家', '各省博物馆数量（家）');
    rankBar('s-rank-visitors', rows, 'visitors_wan', '万人次', '各省博物馆参观人次（万人次）');
    rankBar('s-rank-mpm', rows, 'museums_per_million_population', '家/百万人', '每百万人博物馆数量（家/百万人）');
    rankBar('s-rank-vpm', rows, 'visitors_per_million_population', '万人次/百万人', '每百万人参观人次（万人次/百万人）');
  }

  /* ======================================================================
     3. 馆藏资源与文化价值
     ====================================================================== */
  function pageCollection() {
    const rows = latestProv();
    const cen = D.census || {};
    const cn = cen.national || {};
    let html = header('馆藏资源与文化价值', '—— 馆藏数量与文化价值结构呈现怎样的特征？', '馆藏与价值');

    // ---- 全国可移动文物结构（普查，真实官方数据） ----
    const g1 = cn.fine_relics_grade1, g2 = cn.fine_relics_grade2, g3 = cn.fine_relics_grade3;
    const gen = cn.general_relics, ung = cn.ungraded_relics;
    const hasCensus = isNum(g1) && isNum(g2) && isNum(g3);

    html += card('一、全国可移动文物等级结构', '馆藏资源由怎样的价值结构构成？',
      (hasCensus ? '<div class="grid-2">' +
        '<div>' + chartBox('c-struct', 380) + '</div>' +
        '<div id="c-struct-note"></div>' +
        '</div>' : empty('普查数据尚未生成')) +
      '<p class="note disclaimer" style="margin-top:12px">' +
      '<strong>数据来源：</strong>第一次全国可移动文物普查（统计时点 2016 年 10 月 31 日）。' +
      '<strong>口径：</strong>普查对象为我国境内（不含港澳台）各级国家机关、事业单位、' +
      '国有企业/国有控股企业、军队武警等<strong>国有单位</strong>收藏保管的可移动文物，' +
      '<strong>包含</strong>档案馆、图书馆、宗教场所等非博物馆收藏单位。' +
      '因此该口径<strong>大于且不同于</strong>「博物馆馆藏」，本页不做两者的混合运算。' +
      '</p>');

    // ---- 分省可移动文物集聚 ----
    const top = cen.top_provinces || [];
    html += card('二、可移动文物的空间集聚', '文物资源在省际之间是如何分布的？',
      (top.length ? '<div class="grid-2">' +
        '<div>' + chartBox('c-top', 400) + '</div>' +
        '<div id="c-conc-note"></div></div>' : empty('分省普查数据尚未生成')) +
      '<p class="note disclaimer" style="margin-top:12px">' +
      '国家《第一次全国可移动文物普查数据公报》正文<strong>仅公布数量最多的五个省市</strong>，' +
      '其余省份的完整表格以图片形式存在、无法提取，因此此处<strong>只呈现可获取的省份</strong>，' +
      '并明确标注「五省合计」与「其余省份」的界线。<strong>不推测、不补全</strong>其余省份数值。' +
      '</p>');

    // ---- 分省馆藏排名 ----
    html += card('三、分省馆藏规模', '哪些地区的馆藏资源规模更大？',
      (rows.length ? '<div class="grid-2">' +
        '<div>' + chartBox('c-rank-coll', 460) + '</div>' +
        '<div>' + chartBox('c-rank-avgcoll', 460) + '</div></div>'
        : empty(NO_PROV)));

    // ---- 四象限 ----
    html += card('四、省级博物馆资源结构四象限', '两项指标之间存在怎样的关系？',
      (rows.length ? '<div class="grid-2" style="grid-template-columns:1fr 340px">' +
        '<div>' + chartBox('c-quad', 470) + '</div>' +
        '<div id="c-quad-note"></div></div>'
        : empty(NO_PROV)) +
      '<p class="note disclaimer" style="margin-top:12px" id="c-quad-disclaimer"></p>');

    document.getElementById('page-root').innerHTML = html;

    // ---- 绘制：等级结构 ----
    if (hasCensus) {
      /* 文物等级是**有序**的（一 > 二 > 三），因此使用单色顺序色阶而非分类色：
         越高的等级用越亮的一级。这是 ordinal 用法，不是 categorical。 */
      const parts = [
        { name: '一级文物', value: g1, itemStyle: { color: '#cde2fb' } },
        { name: '二级文物', value: g2, itemStyle: { color: '#9ec5f4' } },
        { name: '三级文物', value: g3, itemStyle: { color: '#6da7ec' } }
      ];
      MV.chart('c-struct', {
        tooltip: {
          trigger: 'item',
          formatter: p => row(p.color, p.name, NF.int(p.value) + ' 件（' + p.percent + '%）')
        },
        series: [{
          /* 实心饼图（不用环形）：三档等级合计就是「珍贵文物」这个整体，
             实心饼的扇形面积与占比一一对应，读者不必在脑子里把内圈补回来。 */
          type: 'pie', radius: '68%', center: ['50%', '52%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: C.SURFACE, borderWidth: 2 },
          label: {
            color: C.INK_2, fontSize: 11.5,
            formatter: p => p.name + '\n' + NF.int(p.value)
          },
          labelLine: { lineStyle: { color: C.AXIS } },
          data: parts
        }]
      });
      const total = Number(g1) + Number(g2) + Number(g3);
      document.getElementById('c-struct-note').innerHTML =
        '<div class="insight">' +
        '<div class="insight-item"><span class="marker"></span><span>全国登录<strong>珍贵文物 ' +
        NF.int(cn.precious_relics) + ' 件</strong>，占登录文物实际数量（' + NF.int(cn.movable_relics_actual_count) +
        ' 件）的 <strong>' + NF.f(cn.precious_relics / cn.movable_relics_actual_count * 100, 2) + '%</strong>。</span></div>' +
        '<div class="insight-item"><span class="marker"></span><span>珍贵文物内部结构中，' +
        '<strong>三级文物 ' + NF.int(g3) + ' 件</strong>占珍贵文物的 <strong>' +
        NF.f(g3 / total * 100, 2) + '%</strong>，一级文物仅 ' + NF.int(g1) + ' 件（' +
        NF.f(g1 / total * 100, 2) + '%）。</span></div>' +
        '<div class="insight-item"><span class="marker"></span><span>另有<strong>一般文物 ' + NF.int(gen) +
        ' 件</strong>（占登录实际数量 ' + NF.f(cn.general_relics / cn.movable_relics_actual_count * 100, 2) +
        '%）、<strong>未定级文物 ' + NF.int(ung) + ' 件</strong>（占 ' +
        NF.f(cn.ungraded_relics / cn.movable_relics_actual_count * 100, 2) + '%）。</span></div>' +
        '<div class="insight-item"><span class="marker"></span><span>全国国有可移动文物总量 <strong>' +
        NF.int(cn.movable_relics_total) + ' 件/套</strong>（含各级综合档案馆纸质历史档案 ' +
        NF.int(cn.archives_paper_files) + ' 卷/件）。</span></div>' +
        '<div class="insight-item"><span class="marker" style="background:var(--ink-muted)"></span>' +
        '<span style="color:var(--ink-muted)">等级结构只反映<strong>文物定级这一维度</strong>的构成，' +
        '不能等同于「文化价值」的完整度量。</span></div>' +
        '</div>';
    }

    // ---- 绘制：分省集聚 ----
    if (top.length) {
      const sorted = top.slice().sort((a, b) => Number(b.value) - Number(a.value));
      /* 分母必须用「登录文物实际数量」（64,073,178 件），不能用
         「可移动文物总量」（108,154,907 件/套，其中含 8,154.4 万卷档案馆纸质档案）。
         公报给出的省级占比正是按实际数量计算的：北京 11,615,758/64,073,178 = 18.13%。 */
      const totalAll = Number(cn.movable_relics_actual_count) || null;
      const topSum = sorted.reduce((s, r) => s + Number(r.value), 0);
      const rest = totalAll ? totalAll - topSum : null;
      const bj = sorted.find(x => x.province === '北京');

      const items = sorted.map(r => ({ name: r.province, value: Number(r.value), __r: r }));
      if (isNum(rest)) items.push({ name: '其余省份合计', value: rest, __rest: true });

      MV.chart('c-top', {
        grid: { left: 106, right: 86, top: 16, bottom: 26 },
        tooltip: {
          trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,.05)' } },
          formatter: ps => {
            const it = items.find(x => x.name === ps[0].name);
            const pct = totalAll ? (it.value / totalAll * 100) : null;
            return '<div style="font-weight:600;margin-bottom:5px">' + it.name + '</div>' +
              row(it.__rest ? C.NO_DATA : '#3987e5', '可移动文物数量', NF.int(it.value) + ' 件') +
              (isNum(pct) ? row('#3987e5', '占全国比重', NF.f(pct, 2) + '%') : '');
          }
        },
        xAxis: {
          type: 'value', axisLabel: { color: C.INK_MUTED, fontSize: 10.5, formatter: v => NF.big(v) },
          splitLine: { lineStyle: { color: C.GRID } }
        },
        yAxis: {
          type: 'category', inverse: true, data: items.map(i => i.name),
          axisLabel: { color: C.INK_2, fontSize: 11.5 },
          axisLine: { lineStyle: { color: C.AXIS } }, axisTick: { show: false }
        },
        series: [{
          type: 'bar', barWidth: '58%',
          data: items.map(i => ({
            value: i.value,
            itemStyle: {
              color: i.__rest ? '#2b4055' : '#3987e5',
              borderRadius: [0, 4, 4, 0]
            }
          })),
          label: {
            show: true, position: 'right', color: C.INK_2, fontSize: 10.5,
            formatter: p => {
              const it = items.find(x => x.name === p.name);
              const pct = totalAll ? (it.value / totalAll * 100) : null;
              return isNum(pct) ? NF.f(pct, 2) + '%' : '';
            }
          }
        }]
      });

      document.getElementById('c-conc-note').innerHTML =
        '<div class="insight">' +
        '<div class="insight-item"><span class="marker"></span><span>全国可移动文物 <strong>' +
        NF.int(cn.movable_relics_total) + ' 件/套</strong>，其中各级综合档案馆纸质历史档案 <strong>' +
        NF.int(cn.archives_paper_files) + ' 卷/件</strong>；<strong>登录文物实际数量 ' +
        NF.int(cn.movable_relics_actual_count) + ' 件</strong>。</span></div>' +
        '<div class="insight-item"><span class="marker"></span><span>可获取的五个省市合计 <strong>' +
        NF.int(topSum) + ' 件</strong>，占登录文物实际数量的 <strong>' +
        NF.f(topSum / totalAll * 100, 2) + '%</strong>（与普查公报口径一致）。</span></div>' +
        (bj ? '<div class="insight-item"><span class="marker"></span><span>其中<strong>' + bj.province +
          '</strong>一地即占 <strong>' + NF.f(Number(bj.value) / totalAll * 100, 2) + '%</strong>。</span></div>' : '') +
        '<div class="insight-item"><span class="marker"></span><span>其余 26 个省级行政区合计约 <strong>' +
        NF.int(rest) + ' 件</strong>（占 ' + NF.f(rest / totalAll * 100, 2) + '%）。</span></div>' +
        '<div class="insight-item"><span class="marker" style="background:var(--ink-muted)"></span>' +
        '<span style="color:var(--ink-muted)">「其余省份合计」是<strong>用登录文物实际数量减去五省之和得到的差额</strong>，' +
        '不是官方公布的逐省数值，仅用于展示集中度，<strong>不可反推任一省份的具体数量</strong>。' +
        '占比分母为登录文物实际数量，与公报给出的省级占比口径一致。</span></div>' +
        '</div>';
    }

    // ---- 绘制：分省排名 ----
    if (rows.length) {
      rankBar('c-rank-coll', rows, 'collection_count', '件(套)', '各省博物馆馆藏数量（件/套）');
      rankBar('c-rank-avgcoll', rows, 'average_collections_per_museum', '件(套)/家', '平均每家博物馆馆藏（件/套）');

      // 四象限（默认：馆藏规模 × 每百万人博物馆数）
      const kx = 'collection_count', ky = 'museums_per_million_population';
      const res = scatterTwo('c-quad', rows, kx, ky,
        '馆藏数量（件/套）', '每百万人博物馆数（家/百万人）', '件(套)', '家/百万人');
      if (res) {
        const usable = rows.filter(r => isNum(r[kx]) && isNum(r[ky]));
        const mx = usable.reduce((s, r) => s + Number(r[kx]), 0) / usable.length;
        const my = usable.reduce((s, r) => s + Number(r[ky]), 0) / usable.length;
        const hi = usable.filter(r => Number(r[kx]) >= mx && Number(r[ky]) >= my);
        const lo = usable.filter(r => Number(r[kx]) < mx && Number(r[ky]) >= my);
        document.getElementById('c-quad-note').innerHTML =
          '<div class="insight">' +
          '<div class="insight-item"><span class="marker"></span><span>样本：<strong>' + res.n +
          '</strong> 个省级行政区；两个指标的 Pearson 相关系数 <strong>r = ' + res.r.toFixed(2) +
          '</strong>（' + strength(res.r) + '）。</span></div>' +
          '<div class="insight-item"><span class="marker"></span><span>「高馆藏 × 高密度」象限：<strong>' +
          (hi.length ? hi.map(r => r.province).join('、') : '无') + '</strong>。</span></div>' +
          '<div class="insight-item"><span class="marker"></span><span>「低馆藏 × 高密度」象限：<strong>' +
          (lo.length ? lo.map(r => r.province).join('、') : '无') + '</strong>。</span></div>' +
          '<div class="insight-item"><span class="marker" style="background:var(--ink-muted)"></span>' +
          '<span style="color:var(--ink-muted)">相关系数只描述线性关联强度，' +
          '<strong>不构成因果推断</strong>。</span></div></div>';

        document.getElementById('c-quad-disclaimer').innerHTML =
          '<strong>关于「珍贵文物比例」象限的说明：</strong>本项目原计划绘制「馆藏规模 × ' +
          '珍贵文物比例」四象限，但数据审计发现：①分省<strong>博物馆口径</strong>的珍贵文物数量' +
          '没有可获取的全国统一公开数据；②《文化和旅游发展统计公报》中公布的一级/二级/三级文物' +
          '属于「<strong>文物机构</strong>」口径（含文物保护管理机构、文物商店等），' +
          '不能当作「博物馆珍贵文物」使用。为<strong>避免用错口径或编造数据</strong>，' +
          '本项目将四象限的两个维度改为<strong>真实可得的指标</strong>，并在上表提供普查口径的' +
          '珍贵文物结构分析。';
      }
    }
  }

  /* ======================================================================
     4. 公共文化服务
     ====================================================================== */
  function pageService() {
    const rows = latestProv();
    let html = header('公共文化服务', '—— 博物馆资源是否转化为公共文化服务？', '公共文化服务');

    if (!rows.length) {
      html += card('', '', '<p class="note disclaimer">' + NO_PROV + '</p>' + empty('分省数据尚未生成'));
      document.getElementById('page-root').innerHTML = html; return;
    }

    html += card('一、参观人次：绝对规模与人口标准化', '公众使用在地区间如何分布？',
      '<div class="grid-2">' +
      '<div>' + chartBox('v-rank-abs', 470) + '</div>' +
      '<div>' + chartBox('v-rank-norm', 470) + '</div>' +
      '</div>');

    html += card('二、服务强度指标', '每家博物馆平均服务多少观众？',
      '<div class="grid-2">' +
      '<div>' + chartBox('v-rank-avg', 470) + '</div>' +
      '<div>' + chartBox('v-rank-perexh', 470) + '</div>' +
      '</div>' +
      '<p class="note disclaimer" style="margin-top:12px">' +
      '「平均每家博物馆参观人次」与「平均每个展览参观人次」均为<strong>描述性指标</strong>，' +
      '仅刻画客流在机构与展览上的分布，<strong>不能作为管理绩效排名</strong>：' +
      '观众规模还受到免费开放政策、地理位置、人口基数、统计口径等多种因素影响。</p>');

    html += card('三、馆藏规模 × 参观人次', '馆藏越多的地区，参观人次是否越多？',
      chartBox('v-scatter-coll', 460) +
      '<p class="note disclaimer" style="margin-top:12px" id="v-scatter-coll-note"></p>');

    html += card('四、展览供给 × 参观人次', '展览数量与参观人次之间存在怎样的关系？',
      chartBox('v-scatter-exh', 460) +
      '<p class="note disclaimer" style="margin-top:12px" id="v-scatter-exh-note"></p>');

    document.getElementById('page-root').innerHTML = html;

    rankBar('v-rank-abs', rows, 'visitors_wan', '万人次', '各省参观人次（万人次）');
    rankBar('v-rank-norm', rows, 'visitors_per_million_population', '万人次/百万人', '每百万人参观人次（万人次/百万人）');
    rankBar('v-rank-avg', rows, 'average_visitors_per_museum', '万人次/家', '平均每家博物馆参观人次（万人次/家）');
    rankBar('v-rank-perexh', rows, 'visitors_per_exhibition', '万人次/个', '平均每个展览参观人次（万人次/个）');

    const a = scatterTwo('v-scatter-coll', rows, 'collection_count', 'visitors_wan',
      '馆藏数量（件/套）', '参观人次（万人次）', '件(套)', '万人次');
    const b = scatterTwo('v-scatter-exh', rows, 'exhibition_count', 'visitors_wan',
      '展览数量（个）', '参观人次（万人次）', '个', '万人次');

    const dis = n => '<strong>相关不等于因果。</strong>上图展示的是 ' + n +
      ' 个省级行政区在 ' + D.province.latest_year + ' 年的截面数据，' +
      'Pearson 相关系数只衡量两变量的<strong>线性关联强度</strong>，' +
      '不能说明一个变量引起另一个变量的变化；' +
      '截面数据也无法区分「资源带动服务」与「需求带动资源」这两种方向。';

    if (a) document.getElementById('v-scatter-coll-note').innerHTML =
      'r = <strong>' + a.r.toFixed(2) + '</strong>（' + strength(a.r) + '）。' + dis(a.n);
    if (b) document.getElementById('v-scatter-exh-note').innerHTML =
      'r = <strong>' + b.r.toFixed(2) + '</strong>（' + strength(b.r) + '）。' + dis(b.n);
  }

  /* ======================================================================
     5. 国际比较
     ====================================================================== */
  let intlGroup = 'B';

  function pageInternational() {
    const intl = D.international || {};
    const all = (intl.rows || []).filter(r => isNum(r.museum_count));
    const rows = all.filter(r => r.caliber_group === intlGroup);
    const cases = (D.cases && D.cases.rows) || [];

    let html = header('国际比较', '—— 中国博物馆在世界范围内处于怎样的发展位置？', '国际比较');

    html += card('', '', '<p class="note disclaimer">' + (D.meta && D.meta.disclaimer || '') + '</p>');

    if (!all.length) {
      html += card('一、世界主要国家博物馆数量', '各国博物馆规模如何？',
        empty('未获取到稳定、可比的各国博物馆数量公开数据'));
      html += card('数据可得性说明', '',
        '<p class="note">国际比较模块未能获取到满足「官方来源 + 可比口径 + 明确年份」' +
        '三项条件的公开数据。本项目坚持「如果某个指标没有可靠公开数据，宁可取消这张图，' +
        '也不能造数据」，本模块不使用任何估算值。</p>');
    } else {
      // ---- 口径切换 ----
      html += card('一、世界主要国家博物馆数量', '各国博物馆规模如何？',
        '<div class="controls" style="margin-bottom:14px">' +
        '<div class="tabs" id="i-tabs">' +
        '<button class="tab' + (intlGroup === 'B' ? ' active' : '') + '" data-g="B">UNESCO 统一口径（2019）</button>' +
        '<button class="tab' + (intlGroup === 'A' ? ' active' : '') + '" data-g="A">各国自报官方口径（2023—2024）</button>' +
        '</div></div>' +
        chartBox('i-count', 400) +
        '<p class="note disclaimer" style="margin-top:12px" id="i-group-note"></p>' +
        '<p class="note disclaimer" style="margin-top:10px">' + (D.meta && D.meta.disclaimer || '') + '</p>');

      html += card('二、口径差异：同一个国家，两个数量级不同的答案', '为什么不能直接比较各国博物馆数量？',
        '<div id="i-gap"></div>');

      html += card('三、每百万人博物馆数量', '消除人口规模差异后的比较',
        chartBox('i-density', 400) +
        '<p class="note disclaimer" style="margin-top:12px">' +
        '密度＝该国博物馆数量 ÷ 该国人口（百万人）。' +
        '由于分子（博物馆数量）的<strong>口径与年份在各国之间并不一致</strong>，' +
        '本指标只用于<strong>观察量级差异</strong>，不构成排名。</p>');
    }

    if (cases.length) {
      html += card('四、代表性博物馆', '世界代表性博物馆的参观规模',
        chartBox('i-cases', 520) +
        '<p class="note disclaimer" style="margin-top:12px">' +
        '本图<strong>是本页可比性最强的一张图</strong>：全部数值来自 TEA/AECOM ' +
        '《Theme Index and Museum Index 2023》——<strong>同一机构、同一方法、同一年度</strong>编制。' +
        '2023 年全球前 20 博物馆合计约 9,976 万人次，较 2022 年增长 65.9%，' +
        '恢复至 2019 年的 94.6%。</p>' +
        table([
          { label: '博物馆', key: 'museum_cn' },
          { label: '国家/地区', key: 'country' },
          { label: '年份', key: 'year' },
          { label: '年参观人次(万)', key: 'annual_visitors_wan', get: r => isNum(r.annual_visitors_wan) ? NF.f(r.annual_visitors_wan, 1) : null },
          { label: '馆藏数量', key: 'collection_count', get: r => isNum(r.collection_count) ? NF.int(r.collection_count) : null }
        ], cases, { maxH: 460 }));
    }

    // ---- 各馆官方公布数据 ----
    const off = (D.cases && D.cases.official) || [];
    const offV = off.filter(r => isNum(r.annual_visitors_wan));
    if (offV.length) {
      html += card('五、代表性博物馆参观人次（各馆官方口径）',
        '中国博物馆放在世界代表性博物馆中处于什么位置？',
        chartBox('i-official', Math.max(420, 26 * offV.length + 60)) +
        '<p class="note disclaimer" style="margin-top:12px">' +
        '<strong>与前一张图的区别：</strong>本图数值来自各馆<strong>自己的官方口径</strong>，' +
        '因此<strong>必须逐条看口径</strong>，不能当作排名：' +
        '韩国国立中央博物馆的 1091 万是<strong>中央馆加全部所属地区馆</strong>的合计；' +
        '上海博物馆的 657.9 万是<strong>人民广场馆与东馆两处合计</strong>；' +
        '大英博物馆为<strong>财年</strong>口径、东京国立博物馆为<strong>日本财年</strong>、' +
        '台北故宫为<strong>民国年度</strong>；各馆年份也不完全一致。' +
        '</p>' +
        /* 「年份口径」列的取值是会计/历法术语，不给释义读者看不懂，
           这里逐个说明，避免「自然年」这类词变成黑话。 */
        '<p class="note" style="margin-top:10px">' +
        '<strong>「年份口径」一列的取值含义：</strong>' +
        '<br/>· <strong>自然年</strong>：公历 1 月 1 日至 12 月 31 日，即通常说的「日历年」；' +
        '中国、法国、美国等国博物馆用这一口径。' +
        '<br/>· <strong>财年 2024/25</strong>（英国）：财政年度，通常自 4 月起算至次年 3 月，' +
        '因此「2024/25」指 2024 年 4 月—2025 年 3 月，与自然年<strong>并不重合</strong>。' +
        '<br/>· <strong>日本财年 令和6年度</strong>：日本财政年度自 4 月 1 日至次年 3 月 31 日；' +
        '「令和 6 年度」对应公历 2024 年度。' +
        '<br/>· <strong>民国 114 年度</strong>：台湾地区纪年，民国 114 年即公历 2025 年。' +
        '<br/>各口径的起止不同，因此<strong>本表只用于逐条核对数值，不做跨馆排名</strong>。' +
        '</p>' +
        table([
          { label: '博物馆', key: 'museum_cn' },
          { label: '国家/地区', key: 'country' },
          { label: '年份', key: 'year', get: r => isNum(r.year) ? r.year + '' : null },
          { label: '年参观人次(万)', key: 'annual_visitors_wan', get: r => isNum(r.annual_visitors_wan) ? NF.f(r.annual_visitors_wan, 1) : null },
          { label: '馆藏(件/套)', key: 'collection_count', get: r => isNum(r.collection_count) ? NF.int(r.collection_count) : null },
          { label: '建筑面积(㎡)', key: 'building_area_m2', get: r => isNum(r.building_area_m2) ? NF.int(r.building_area_m2) : null },
          { label: '年份口径', key: 'year_note' },
          { label: '统计口径说明', key: 'caliber_note' }
        ], offV.slice().sort((a, b) => Number(b.annual_visitors_wan) - Number(a.annual_visitors_wan)), { maxH: 520 }));
    }

    document.getElementById('page-root').innerHTML = html;

    if (rows.length) {
      MV.chart('i-count', barOption(rows, 'museum_count', '家', '博物馆数量', 0));
      const dens = rows.filter(r => isNum(r.museums_per_million));
      if (dens.length) MV.chart('i-density', barOption(dens, 'museums_per_million', '家/百万人', '每百万人博物馆数量', 2));
      else MV.showEmpty('i-density', '暂无数据');

      const gn = document.getElementById('i-group-note');
      if (gn) gn.innerHTML = intlGroup === 'B'
        ? '<strong>当前为 UNESCO 统一口径：</strong>全部数据取自同一份报告（2019 年），' +
          '年份与编制方法一致，是本页<strong>可比性最好</strong>的一组。' +
          '但 UNESCO 原文明确指出：博物馆计数「虽基于同一定义，各国执行方式不同」，' +
          '并点名中国的 1,030 家「明显低于网上其它估计（5000+）」。'
        : '<strong>当前为各国自报官方口径：</strong>各国使用自己的官方定义与最新可得年份' +
          '（美国 2014、德国 2023、中国/法国/韩国 2024），<strong>年份与定义都不一致</strong>，' +
          '仅可用于观察量级，<strong>不可当作严格排名</strong>。';

      // ---- 口径差异对照 ----
      const gap = document.getElementById('i-gap');
      const countries = Array.from(new Set(all.map(r => r.country)));
      const pairs = countries.map(c => ({
        country: c,
        A: all.find(r => r.country === c && r.caliber_group === 'A'),
        B: all.find(r => r.country === c && r.caliber_group === 'B')
      })).filter(p => p.A && p.B);

      let gapHtml = '';
      if (pairs.length) {
        gapHtml += table([
          { label: '国家', key: 'country' },
          { label: '本国官方口径（年份）', key: 'a', get: p => NF.int(p.A.museum_count) + ' 家（' + p.A.year + '）' },
          { label: 'UNESCO 口径（2019）', key: 'b', get: p => NF.int(p.B.museum_count) + ' 家' },
          { label: '倍数差', key: 'x', get: p => {
              const a = Number(p.A.museum_count), b = Number(p.B.museum_count);
              return (Math.max(a, b) / Math.min(a, b)).toFixed(1) + ' 倍';
            } },
          { label: '口径说明（本国官方）', key: 'n', get: p => p.A.caliber_note }
        ], pairs);
        gapHtml += '<p class="note" style="margin-top:12px">' +
          '<strong>结论：</strong>同一个国家的博物馆数量，在不同口径下最多可相差数倍。' +
          '因此本项目<strong>拒绝把不同国家不同口径的数字放在一起做「全球排名」</strong>，' +
          '只呈现数据本身及其口径，由读者判断可比性。</p>';
      } else {
        gapHtml = '<p class="note">当前口径分组下没有同一国家的两个数值可供对照。' +
          '<strong>美国 IMLS 口径（35,144 家）</strong>包含植物园、动物园、水族馆、历史学会、' +
          '科学中心、儿童博物馆等，而<strong>法国「musée de France」（1,220 家）</strong>是法定称号，' +
          '两者显然不可直接比较。</p>';
      }
      gap.innerHTML = gapHtml;

      document.querySelectorAll('#i-tabs .tab').forEach(b => {
        b.onclick = () => { intlGroup = b.dataset.g; pageInternational(); };
      });
    }
    if (cases.length) {
      const c = cases.filter(r => isNum(r.annual_visitors_wan))
        .sort((a, b) => Number(a.annual_visitors_wan) - Number(b.annual_visitors_wan));
      if (c.length) {
        MV.chart('i-cases', {
          grid: { left: 150, right: 96, top: 16, bottom: 26 },
          tooltip: {
            trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,.05)' } },
            formatter: ps => {
              const it = c.find(x => x.museum_cn === ps[0].name); if (!it) return '';
              return '<div style="font-weight:600;margin-bottom:5px">' + it.museum_cn +
                ' <span style="color:' + C.INK_MUTED + ';font-weight:400;font-size:11px">' +
                it.country + '</span></div>' +
                row('#3987e5', '年参观人次', NF.f(it.annual_visitors_wan, 1) + ' 万人次') +
                row('#3987e5', '统计年份', it.year + ' 年') +
                row('#3987e5', '2023年全球排名', isNum(it.rank_2023) ? '第 ' + it.rank_2023 + ' 位' : null) +
                '<div style="color:' + C.INK_MUTED + ';font-size:11px;margin-top:5px">' +
                '来源：TEA/AECOM Theme Index 2023</div>';
            }
          },
          xAxis: {
            type: 'value', axisLabel: { color: C.INK_MUTED, fontSize: 10.5, formatter: v => NF.big(v) },
            splitLine: { lineStyle: { color: C.GRID } }
          },
          yAxis: {
            type: 'category', data: c.map(x => x.museum_cn),
            axisLabel: { color: C.INK_2, fontSize: 11 },
            axisLine: { lineStyle: { color: C.AXIS } }, axisTick: { show: false }
          },
          series: [{
            type: 'bar', barWidth: '58%',
            data: c.map(x => ({
              value: Number(x.annual_visitors_wan),
              itemStyle: {
                color: x.country === '中国' ? '#c98500' : '#3987e5',
                borderRadius: [0, 4, 4, 0]
              }
            })),
            label: {
              show: true, position: 'right', color: C.INK_2, fontSize: 10.5,
              formatter: p => NF.big(p.value) + ' 万'
            }
          }]
        });
      }
    }

    if (offV.length) {
      const o = offV.slice().sort((a, b) => Number(a.annual_visitors_wan) - Number(b.annual_visitors_wan));
      MV.chart('i-official', {
        grid: { left: 168, right: 108, top: 16, bottom: 26 },
        tooltip: {
          trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,.05)' } },
          formatter: ps => {
            const it = o.find(x => x.museum_cn === ps[0].name); if (!it) return '';
            return '<div style="font-weight:600;margin-bottom:5px">' + it.museum_cn +
              ' <span style="color:' + C.INK_MUTED + ';font-weight:400;font-size:11px">' +
              it.country + '</span></div>' +
              row('#3987e5', '年参观人次', NF.f(it.annual_visitors_wan, 1) + ' 万人次') +
              row('#3987e5', '统计年份', (isNum(it.year) ? it.year : '—') + ' 年（' + (it.year_note || '') + '）') +
              row('#3987e5', '馆藏数量', isNum(it.collection_count) ? NF.int(it.collection_count) + ' 件(套)' : null) +
              row('#3987e5', '建筑面积', isNum(it.building_area_m2) ? NF.int(it.building_area_m2) + ' ㎡' : null) +
              '<div style="color:' + C.INK_MUTED + ';font-size:11px;margin-top:6px;max-width:300px;line-height:1.55">' +
              (it.caliber_note || '') + '</div>';
          }
        },
        xAxis: {
          type: 'value', axisLabel: { color: C.INK_MUTED, fontSize: 10.5, formatter: v => NF.big(v) },
          splitLine: { lineStyle: { color: C.GRID } }
        },
        yAxis: {
          type: 'category', data: o.map(x => x.museum_cn),
          axisLabel: { color: C.INK_2, fontSize: 11.5 },
          axisLine: { lineStyle: { color: C.AXIS } }, axisTick: { show: false }
        },
        series: [{
          type: 'bar', barWidth: '58%',
          data: o.map(x => ({
            value: Number(x.annual_visitors_wan),
            itemStyle: {
              color: x.country === '中国' ? '#c98500' : '#3987e5',
              borderRadius: [0, 4, 4, 0]
            }
          })),
          label: {
            show: true, position: 'right', color: C.INK_2, fontSize: 10.5,
            formatter: p => {
              const it = o.find(x => x.museum_cn === p.name);
              return NF.big(p.value) + ' 万（' + (it && isNum(it.year) ? it.year : '—') + '）';
            }
          }
        }]
      });
    }
  }

  function barOption(rows, key, unit, title, dp) {
    const s = rows.filter(r => isNum(r[key])).sort((a, b) => Number(a[key]) - Number(b[key]));
    return {
      grid: { left: 92, right: 100, top: 14, bottom: 26 },
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,.05)' } },
        formatter: ps => {
          const it = s.find(x => x.country === ps[0].name); if (!it) return '';
          return '<div style="font-weight:600;margin-bottom:5px">' + it.country + '</div>' +
            row('#3987e5', title, NF.f(it[key], dp) + ' ' + unit) +
            row('#3987e5', '统计年份', it.year + ' 年') +
            (it.caliber_note ? '<div style="color:' + C.INK_MUTED + ';font-size:11px;margin-top:5px;max-width:260px;line-height:1.5">' +
              it.caliber_note + '</div>' : '');
        }
      },
      xAxis: { type: 'value', axisLabel: { color: C.INK_MUTED, fontSize: 10.5, formatter: v => NF.big(v) }, splitLine: { lineStyle: { color: C.GRID } } },
      yAxis: {
        type: 'category', data: s.map(x => x.country),
        axisLabel: { color: C.INK_2, fontSize: 11.5 },
        axisLine: { lineStyle: { color: C.AXIS } }, axisTick: { show: false }
      },
      series: [{
        type: 'bar', barWidth: '56%',
        data: s.map(x => ({
          value: Number(x[key]),
          itemStyle: { color: x.country === '中国' ? '#c98500' : '#3987e5', borderRadius: [0, 4, 4, 0] }
        })),
        label: {
          show: true, position: 'right', color: C.INK_2, fontSize: 10.5,
          formatter: p => {
            const it = s.find(x => x.country === p.name);
            return NF.f(p.value, dp) + (it ? '（' + it.year + '）' : '');
          }
        }
      }]
    };
  }

  /* ======================================================================
     6. 数据说明与溯源
     ====================================================================== */
  function pageData() {
    const src = D.sources || [];
    const audit = D.audit || {};
    const map = D.chartMapping || [];

    let html = header('数据说明与溯源',
      '—— 每一个数字都能向上追溯到官方来源', '数据说明');

    html += card('一、数据链条', '从官方来源到图表结论的完整路径',
      '<p class="note" style="line-height:2">' +
      '<strong>官方公开来源</strong> → <code>data/raw/</code>（原始数据转录，不覆盖） → ' +
      '<code>data/clean/</code>（规范化：省份名统一、类型转换、去重） → ' +
      '<code>data/processed/</code>（分析数据集 + 派生指标） → ' +
      '<code>web/data/</code>（前端数据） → <strong>图表与结论</strong>' +
      '</p>' +
      '<p class="note disclaimer" style="margin-top:10px">' +
      '每一层都由脚本生成：<code>clean_data.py</code>、<code>build_dataset.py</code>、' +
      '<code>build_web_data.py</code>；来源链接由 <code>collect_data.py</code> 逐条实地核验并留证。</p>');

    // 审计摘要
    if (audit && audit.dataset_count) {
      html += card('二、数据规模（由脚本自动统计）', '不使用任何人工填写的统计量',
        '<div class="grid-3">' +
        /* 目录名是英文的，直接摆出来读者不知道指什么，因此中文在前、英文括注在后 */
        statTile('数据集（原始 / 清洗后 / 分析用）',
                 audit.raw_datasets + ' / ' + audit.clean_datasets + ' / ' +
                 audit.processed_datasets, ' 个') +
        statTile('原始记录数', audit.raw_records, '条') +
        statTile('分析记录数', audit.processed_records, '条') +
        statTile('分析字段总数', audit.processed_fields, '个') +
        statTile('其中衍生指标', audit.derived_fields, '个') +
        statTile('数据来源', (D.sources || []).length, '条（均已核验）') +
        '</div>' +
        '<p class="note" style="margin-top:12px">' +
        '<strong>三个数据集目录的含义：</strong>' +
        '<code>data/raw/</code>＝<strong>原始数据</strong>（自官方来源逐条转录，不改动）；' +
        '<code>data/clean/</code>＝<strong>清洗后数据</strong>（统一省份名、类型转换、去重，字段与原始一一对应）；' +
        '<code>data/processed/</code>＝<strong>分析用数据</strong>（按分析口径整理，并加入派生指标）。' +
        '<br/>' +
        '「原始记录数」指 <code>data/raw/</code> 中人工转录的官方数据条数；' +
        '「分析记录数」指 <code>data/processed/</code> 中用于绘图的记录数。' +
        '全项目共 ' + audit.missing_values + ' 个空单元格，' +
        '<strong>这些是有意保留的</strong>——未获取到的指标保持为空、' +
        '页面显示「暂无数据」，而<strong>不是填 0</strong>。' +
        '例如分省「珍贵文物数量」93 条中仅有 1 条可得，其余全部保持为空。' +
        '</p>');
    }

    // 来源台账
    if (src.length) {
      html += card('三、数据来源台账（逐条链接已实地核验）', '可点击任一链接核对',
        table([
          { label: '来源ID', key: 'source_id' },
          { label: '发布机构', key: 'source_organization' },
          { label: '文件/报告名称', key: 'source_title' },
          { label: '年份', key: 'original_year' },
          { label: '类型', key: 'source_type' },
          { label: '链接（可点击核对）', key: 'source_url', raw: true,
            get: r => '<a href="' + esc(r.source_url) + '" target="_blank" rel="noopener">打开 ↗</a>' }
        ], src, { maxH: 520 }));
    }

    // 指标公式
    html += card('四、派生指标定义与计算公式', '所有公式与实现代码一一对应',
      table([
        { label: '字段名', key: 'k' },
        { label: '中文名', key: 'n' },
        { label: '单位', key: 'u' },
        { label: '计算公式', key: 'f' },
        { label: '缺测规则', key: 'm' }
      ], [
        { k: 'museums_per_million_population', n: '每百万人博物馆数量', u: '家/百万人', f: 'museum_count / (population_wan / 100)', m: '任一字段缺测或人口为 0 → NULL' },
        { k: 'visitors_per_million_population', n: '每百万人参观人次', u: '万人次/百万人', f: 'visitors_wan / (population_wan / 100)', m: '任一字段缺测或人口为 0 → NULL' },
        { k: 'average_collections_per_museum', n: '平均每家博物馆馆藏', u: '件(套)/家', f: 'collection_count / museum_count', m: '任一字段缺测或馆数为 0 → NULL' },
        { k: 'average_visitors_per_museum', n: '平均每家博物馆参观人次', u: '万人次/家', f: 'visitors_wan / museum_count', m: '任一字段缺测或馆数为 0 → NULL' },
        { k: 'visitors_per_exhibition', n: '平均每个展览参观人次', u: '万人次/个', f: 'visitors_wan / exhibition_count', m: '任一字段缺测或展览数为 0 → NULL' },
        { k: 'visitors_per_100k_collections', n: '每十万件藏品参观人次', u: '万人次/10万件', f: 'visitors_wan / (collection_count / 100000)', m: '任一字段缺测或藏品数为 0 → NULL' },
        { k: 'precious_ratio', n: '珍贵文物比例', u: '%', f: 'precious_count / collection_count × 100', m: 'collection_count 缺测或为 0 → NULL' },
        { k: 'r（图中）', n: 'Pearson 相关系数', u: '无量纲', f: '协方差 / 两标准差之积（前端实时计算）', m: '样本 < 3 时不计算' }
      ]));

    html += card('五、口径与缺失值处理原则', '',
      '<p class="note"><strong>1. 两套口径严格分列。</strong>国家文物局「备案博物馆」与文化和旅游部' +
      '《统计公报》「文物机构 / 博物馆」统计范围不同，本项目<strong>不混用、不互相换算</strong>。</p>' +
      '<p class="note" style="margin-top:8px"><strong>2. 缺失值是 NULL，不是 0。</strong>' +
      '本项目<strong>不把缺失值填充为 0</strong>。缺失按语义区分「未统计 / 未公开 / 不适用 / 真实的 0」；' +
      '派生指标在分子分母缺测或分母为 0 时返回 NULL，可视化统一显示「暂无数据」。</p>' +
      '<p class="note" style="margin-top:8px"><strong>3. 不做跨口径连线。</strong>' +
      '时间序列出现口径断点时，曲线<strong>断开而不平滑、不补齐</strong>。</p>' +
      '<p class="note" style="margin-top:8px"><strong>4. 相关不等于因果。</strong>' +
      '所有相关系数只描述线性关联强度，不做因果推断；描述性指标不用于绩效排名。</p>' +
      '<p class="note" style="margin-top:8px"><strong>5. 国际比较不作排名。</strong>' +
      '各国统计口径、年份、馆藏定义存在差异，比较仅用于观察规模与发展特征。</p>');

    // 图表映射
    if (map.length) {
      html += card('六、图表 → 数据集 → 字段 对应关系', '每张图都能追溯到具体字段',
        table([
          { label: '图表ID', key: 'chart_id' },
          { label: '图表名称', key: 'chart_name' },
          { label: '数据集', key: 'dataset_id' },
          { label: '使用字段', key: 'fields_used' },
          { label: '计算', key: 'calculation' },
          { label: '来源', key: 'source' }
        ], map, { maxH: 520 }));
    }

    document.getElementById('page-root').innerHTML = html;
  }

  function statTile(label, value, unit) {
    return '<div class="card" style="margin:0;padding:14px 16px">' +
      '<div class="kpi-label">' + esc(label) + '</div>' +
      '<div class="kpi-value" style="font-size:27px">' + esc(value) +
      '<span class="unit">' + esc(unit) + '</span></div></div>';
  }

  /* ======================================================================
     7. 区域结构 —— 树图 / 雷达图 / 箱线图 / 热力图
     全部数据来自 data/processed/province_year.csv（31 个省级行政区，2020—2022）。
     本页只做**已有数值的聚合与归一化**，不引入任何估算或外部数据。
     ====================================================================== */

  /** 分位数（线性插值法，与常用统计软件一致）。arr 需已升序。 */
  function quantile(sorted, q) {
    if (!sorted.length) return null;
    const pos = (sorted.length - 1) * q;
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  }

  function pageRegion() {
    const rows = latestProv();
    let html = header('区域结构', '—— 四大区域在资源规模与服务水平上呈现怎样的结构差异？', '区域结构');

    if (!rows.length) {
      html += card('', '', '<p class="note disclaimer">' + NO_PROV + '</p>' + empty('分省数据尚未生成'));
      document.getElementById('page-root').innerHTML = html; return;
    }
    const year = D.province.latest_year;

    /* ---- 一、树图：区域 › 省份 的层级构成 ---- */
    const byRegion = {};
    C.REGIONS.forEach(reg => { byRegion[reg] = rows.filter(r => r.region === reg && isNum(r.museum_count)); });
    const treeData = C.REGIONS.map(reg => ({
      name: reg,
      itemStyle: { color: C.REGION[reg] },
      children: byRegion[reg].slice()
        .sort((a, b) => Number(b.museum_count) - Number(a.museum_count))
        .map(r => ({ name: r.province, value: Number(r.museum_count), __row: r }))
    })).filter(d => d.children.length);

    html += card('一、区域 › 省份 博物馆数量构成', '资源集中在哪里？',
      chartBox('r-tree', 520) +
      '<p class="note disclaimer" style="margin-top:12px">' +
      '方块<strong>面积正比于博物馆数量</strong>，外层的四大色块是区域，内层是各省。' +
      '树图适合回答「总量由谁构成、大块头是谁」，但它<strong>不表达地理相邻关系</strong>——' +
      '看空间格局请看「空间分布」页的地图。</p>');

    /* ---- 二、雷达图：四大区域多维对比 ---- */
    /* 各维度量纲差了几个数量级（馆藏以百万计、每百万人馆数只有个位数），
       直接画在同一张雷达上会被最大的维度压平。因此**逐维度做 min-max 归一化**
       到 0—100：雷达表达的是「四个区域在各维度上的相对位置」，不是绝对值。
       这一点必须写在图注里，否则读者会误读成绝对水平。 */
    const DIMS = [
      { key: 'museum_count', label: '博物馆数量', agg: 'sum' },
      { key: 'collection_count', label: '馆藏数量', agg: 'sum' },
      { key: 'visitors_wan', label: '参观人次', agg: 'sum' },
      { key: 'exhibition_count', label: '陈列展览', agg: 'sum' },
      { key: 'museums_per_million_population', label: '每百万人馆数', agg: 'ratio' }
    ];
    const aggRow = reg => {
      const rs = byRegion[reg];
      const o = { region: reg };
      DIMS.forEach(d => {
        if (d.agg === 'sum') {
          /* 只有全部省份都有值时求和，否则记为空——不做部分求和后冒充总量 */
          const vals = rs.map(r => r[d.key]);
          o[d.key] = (rs.length && vals.every(v => isNum(v)))
            ? vals.reduce((s, v) => s + Number(v), 0) : null;
        } else {
          /* 比率类维度不能相加：按「区域博物馆总数 ÷ 区域人口」重算 */
          const mus = rs.map(r => r.museum_count), pop = rs.map(r => r.population_wan);
          o[d.key] = (rs.length && mus.every(isNum) && pop.every(isNum))
            ? mus.reduce((s, v) => s + Number(v), 0) / (pop.reduce((s, v) => s + Number(v), 0) / 100)
            : null;
        }
      });
      o.provinces = rs.length;
      return o;
    };
    const regionAgg = C.REGIONS.map(aggRow).filter(a => a.provinces > 0);

    const norm = {};       // 每个维度的 min / max，用于归一化与图注说明
    DIMS.forEach(d => {
      const vs = regionAgg.map(a => a[d.key]).filter(isNum).map(Number);
      norm[d.key] = vs.length ? { min: Math.min.apply(null, vs), max: Math.max.apply(null, vs) } : null;
    });
    const scale = (key, v) => {
      const n = norm[key];
      if (!n || !isNum(v) || n.max === n.min) return null;
      return (Number(v) - n.min) / (n.max - n.min) * 100;
    };

    html += card('二、四大区域多维对比', '各区域的相对强项在哪里？',
      chartBox('r-radar', 480) +
      '<p class="note disclaimer" style="margin-top:12px">' +
      '<strong>读图提示：</strong>五个维度的量纲相差极大（馆藏以百万件计、每百万人馆数只有个位数），' +
      '直接同图会被最大的维度压平，因此本图<strong>对每个维度单独做了 0—100 的归一化</strong>：' +
      '每个轴上的 100 表示该维度上最高的区域、0 表示最低的区域。' +
      '所以雷达形状反映的是<strong>各区域的相对强项与短板</strong>，<strong>不能读出绝对数量</strong>。' +
      '各维度的实际最大/最小值列在下表中。' +
      '</p>' +
      table([
        { label: '维度', key: 'label' },
        { label: '聚合方式', key: 'how' },
        { label: '最小值', key: 'min', get: r => isNum(r.min) ? NF.f(r.min, 2) : null },
        { label: '最大值', key: 'max', get: r => isNum(r.max) ? NF.f(r.max, 2) : null }
      ], DIMS.map(d => ({
        label: d.label,
        how: d.agg === 'sum' ? '区域内各省求和' : '区域博物馆总数 ÷ 区域人口（百万人）',
        min: norm[d.key] ? norm[d.key].min : null,
        max: norm[d.key] ? norm[d.key].max : null
      })), { maxH: 320 }));

    /* ---- 三、箱线图：各省数量在区域内的离散程度 ---- */
    const boxRows = C.REGIONS.map(reg => ({
      region: reg,
      values: byRegion[reg].map(r => Number(r.museum_count)).sort((a, b) => a - b)
    })).filter(b => b.values.length);

    html += card('三、各省博物馆数量的区域内分布', '同一区域内部差异有多大？',
      chartBox('r-box', 440) +
      '<p class="note disclaimer" style="margin-top:12px">' +
      '箱体上下边为<strong>上/下四分位数</strong>，箱内横线为<strong>中位数</strong>，' +
      '须线延伸到该区域的最小、最大值（此处样本为全部省份，故无「离群点」剔除）。' +
      '箱体越<strong>长</strong>说明区域内各省差距越大。' +
      '注意：东部 10 省、西部 12 省的样本数不同，箱体长度不能直接当作「发展不均」的强弱排名。' +
      '</p>' +
      table([
        { label: '区域', key: 'region' },
        { label: '省份数', key: 'n' },
        { label: '最小', key: 'min', get: r => isNum(r.min) ? NF.int(r.min) : null },
        { label: '下四分位', key: 'q1', get: r => isNum(r.q1) ? NF.f(r.q1, 1) : null },
        { label: '中位数', key: 'med', get: r => isNum(r.med) ? NF.f(r.med, 1) : null },
        { label: '上四分位', key: 'q3', get: r => isNum(r.q3) ? NF.f(r.q3, 1) : null },
        { label: '最大', key: 'max', get: r => isNum(r.max) ? NF.int(r.max) : null }
      ], boxRows.map(b => ({
        region: b.region, n: b.values.length,
        min: b.values[0], max: b.values[b.values.length - 1],
        q1: quantile(b.values, .25), med: quantile(b.values, .5), q3: quantile(b.values, .75)
      }))));

    /* ---- 四、热力图：省份 × 年份 ---- */
    const allProv = provRows();
    const years = Array.from(new Set(allProv.map(r => r.year).filter(isNum))).sort((a, b) => a - b);
    const provs = Array.from(new Set(allProv.map(r => r.province)));
    /* 按最新年份的数量降序排列，读者自上而下就是从大到小 */
    provs.sort((a, b) => {
      const va = (rows.find(r => r.province === a) || {}).museum_count;
      const vb = (rows.find(r => r.province === b) || {}).museum_count;
      return (isNum(vb) ? Number(vb) : -1) - (isNum(va) ? Number(va) : -1);
    });
    const heat = [];
    provs.forEach((p, i) => years.forEach((y, j) => {
      const row = allProv.find(r => r.province === p && r.year === y);
      heat.push([j, i, row && isNum(row.museum_count) ? Number(row.museum_count) : null]);
    }));
    const hvals = heat.map(h => h[2]).filter(isNum).map(Number);

    html += card('四、省份 × 年份 博物馆数量', '各省这几年是增还是减？',
      (years.length >= 2 && hvals.length
        /* 只有 3 个年份，若让图表撑满卡片宽度，每个格子会有四五百像素宽，
           色阶差异反而看不出来。这里把图表限制在 660px 内并居中，
           格子接近可读的比例，两侧留白由下方说明文字承担。 */
        ? '<div style="max-width:660px;margin:0 auto">' +
          chartBox('r-heat', Math.max(420, provs.length * 26 + 96)) + '</div>'
        : empty('跨年份的分省数据不足')) +
      '<p class="note disclaimer" style="margin-top:12px">' +
      '本项目可获取的<strong>分省面板数据只有 ' + years.join('、') +
      ' 共 ' + years.length + ' 个年份</strong>（来源为《中国文化及相关产业统计年鉴》各年卷）。' +
      '年份太少，无法做趋势外推，因此这里只呈现<strong>逐年格子的实际数值</strong>，' +
      '不计算增长率、不画趋势线。空白格表示该年该省未获取到数值。' +
      '</p>');

    document.getElementById('page-root').innerHTML = html;

    /* ---- 绘图 ---- */
    MV.chart('r-tree', {
      tooltip: {
        trigger: 'item',
        formatter: p => {
          const r = p.data && p.data.__row;
          if (!r) return '<div style="font-weight:600">' + p.name + '</div>' +
            row(C.REGION[p.name] || C.INK_MUTED, '区域合计', isNum(p.value) ? NF.int(p.value) + ' 家' : null);
          return '<div style="font-weight:600;margin-bottom:5px">' + r.province +
            ' <span style="color:' + C.INK_MUTED + ';font-weight:400;font-size:11px">' + r.region + '</span></div>' +
            row(C.REGION[r.region], '博物馆数量', NF.int(r.museum_count) + ' 家') +
            row(C.REGION[r.region], '馆藏数量', isNum(r.collection_count) ? NF.big(r.collection_count) + ' 件(套)' : null) +
            row(C.REGION[r.region], '参观人次', isNum(r.visitors_wan) ? NF.big(r.visitors_wan) + ' 万人次' : null);
        }
      },
      series: [{
        type: 'treemap', roam: false, nodeClick: false,
        breadcrumb: { show: false },
        width: '96%', height: '94%', left: 'center', top: 'center',
        label: { show: true, formatter: '{b}', fontSize: 11, color: '#fff' },
        upperLabel: { show: true, height: 22, color: C.INK, fontSize: 12.5, fontWeight: 600 },
        itemStyle: { borderColor: '#0a1420', borderWidth: 2, gapWidth: 2 },
        /* 第一层（区域）用实色，第二层（省份）用同色的低饱和度变体，
           这样「哪个省属于哪个区域」靠色相就能读出来，不必依赖位置。 */
        levels: [
          { itemStyle: { borderWidth: 0, gapWidth: 3 } },
          { itemStyle: { borderWidth: 1, gapWidth: 1 }, colorSaturation: [0.4, 0.75] }
        ],
        data: treeData
      }]
    });

    /* 绘制顺序 = 命中优先级：ECharts 后画的盖在先画的上面，也先接收鼠标事件。
       中部、东北的多边形完全落在东部/西部内部，若按固定顺序画就会被整个盖住，
       悬停只能触发大区域。按归一化总分**降序**排（大的先画、小的最后画），
       小多边形就浮到上层、可以被悬停到；大多边形露在外面的部分仍可悬停。 */
    const radarData = regionAgg.map(a => {
      const vals = DIMS.map(d => scale(d.key, a[d.key]));
      return {
        name: a.region, vals,
        total: vals.reduce((s, v) => s + (isNum(v) ? v : 0), 0)
      };
    }).sort((x, y) => y.total - x.total);

    MV.chart('r-radar', {
      tooltip: {
        trigger: 'item',
        /* 直接给出该区域各维度的**实际合计值**：雷达形状是归一化后的相对位置，
           光看图形读不出数量，悬停时补上真实数字，读者才不会误读。 */
        formatter: p => {
          const a = regionAgg.find(x => x.region === p.name);
          if (!a) return p.name;
          return '<div style="font-weight:600;margin-bottom:2px">' + a.region +
            ' <span style="color:' + C.INK_MUTED + ';font-weight:400;font-size:11px">' +
            a.provinces + ' 个省级行政区合计</span></div>' +
            DIMS.map(d => row(C.REGION[a.region], d.label,
              isNum(a[d.key])
                ? (d.agg === 'ratio' ? NF.f(a[d.key], 2) + ' 家/百万人' : NF.int(a[d.key]))
                : null)).join('') +
            '<div style="color:' + C.INK_MUTED + ';font-size:11px;margin-top:5px">' +
            '雷达上的位置是各维度归一化后的相对值</div>';
        }
      },
      legend: { bottom: 0, textStyle: { color: C.INK_2, fontSize: 11.5 } },
      radar: {
        center: ['50%', '48%'], radius: '64%',
        indicator: DIMS.map(d => ({ name: d.label, max: 100 })),
        axisName: { color: C.INK_2, fontSize: 11.5 },
        splitLine: { lineStyle: { color: C.GRID } },
        splitArea: { areaStyle: { color: ['rgba(255,255,255,.012)', 'rgba(255,255,255,.03)'] } },
        axisLine: { lineStyle: { color: C.AXIS } }
      },
      series: [{
        type: 'radar', symbolSize: 5,
        /* 填充透明度压到 .08：四个区域互相重叠，填充太重会把下层完全盖死。
           识别主要靠描边与顶点，填充只作辅助。 */
        data: radarData.map(d => ({
          name: d.name,
          value: d.vals,
          lineStyle: { width: 2, color: C.REGION[d.name] },
          itemStyle: { color: C.REGION[d.name] },
          areaStyle: { color: C.REGION[d.name], opacity: .08 }
        }))
      }]
    });

    MV.chart('r-box', {
      tooltip: {
        trigger: 'item',
        /* 两个坑都在这里：
           1) 不能取 p.data —— 本系列的数据项是 { value:[…], itemStyle:{…} } 对象，
              p.data 是整个对象、没有 length，判断会直接落空，悬停什么都不显示。
           2) p.value 的**前导索引个数不固定**：ECharts 会在我们自己传的
              [类目下标, 最小, Q1, 中位数, Q3, 最大] 前面再追加一个 dataIndex，
              实测得到 7 个元素。按下标硬取会整体错位一格（最大值显示成 Q3、
              最小值显示成类目下标）。
              箱线图的五个统计量永远在**末尾**，所以一律 slice(-5)，与前面
              有几个索引无关。 */
        formatter: p => {
          const v = (p.value || []).slice(-5);   // [min, Q1, 中位数, Q3, max]
          if (v.length < 5 || !isNum(v[0])) return '';
          return '<div style="font-weight:600;margin-bottom:5px">' + p.name +
            ' <span style="color:' + C.INK_MUTED + ';font-weight:400;font-size:11px">各省博物馆数量</span></div>' +
            row(C.REGION[p.name], '最大值', NF.int(v[4])) +
            row(C.REGION[p.name], '上四分位 (Q3)', NF.f(v[3], 1)) +
            row(C.REGION[p.name], '中位数', NF.f(v[2], 1)) +
            row(C.REGION[p.name], '下四分位 (Q1)', NF.f(v[1], 1)) +
            row(C.REGION[p.name], '最小值', NF.int(v[0]));
        }
      },
      grid: { left: 70, right: 40, top: 22, bottom: 40 },
      xAxis: {
        type: 'category', data: boxRows.map(b => b.region),
        axisLabel: { color: C.INK_2, fontSize: 11.5 },
        axisLine: { lineStyle: { color: C.AXIS } }, axisTick: { show: false }
      },
      yAxis: {
        type: 'value', name: '博物馆数量（家）',
        nameTextStyle: { color: C.INK_MUTED, fontSize: 10.5 },
        axisLabel: { color: C.INK_MUTED, fontSize: 10.5, formatter: v => NF.big(v) },
        splitLine: { lineStyle: { color: C.GRID } }
      },
      series: [{
        type: 'boxplot',
        /* ECharts 箱线图的数据格式：[类目下标, 最小值, Q1, 中位数, Q3, 最大值]。
           第 0 位是类目下标，按 boxRows 的顺序给 0..n-1 即可。
           每个箱体用**自己区域的颜色**，与全站区域配色一致；
           填充用同色的低透明度版本，深浅仍能看出箱体范围。 */
        data: boxRows.map((b, i) => {
          const color = C.REGION[b.region];
          return {
            value: [i, b.values[0], quantile(b.values, .25), quantile(b.values, .5),
              quantile(b.values, .75), b.values[b.values.length - 1]],
            itemStyle: { color: color + '33', borderColor: color, borderWidth: 1.8 }
          };
        }),
        boxWidth: ['30%', '45%']
      }]
    });

    if (years.length >= 2 && hvals.length) {
      MV.chart('r-heat', {
        tooltip: {
          trigger: 'item',
          formatter: p => {
            const prov = provs[p.value[1]], y = years[p.value[0]], v = p.value[2];
            const row_ = allProv.find(r => r.province === prov && r.year === y);
            return '<div style="font-weight:600;margin-bottom:5px">' + prov +
              ' <span style="color:' + C.INK_MUTED + ';font-weight:400;font-size:11px">' + (row_ ? row_.region : '') + '</span></div>' +
              row(row_ ? C.REGION[row_.region] : C.INK_MUTED, y + ' 年博物馆数量',
                isNum(v) ? NF.int(v) + ' 家' : null);
          }
        },
        grid: { left: 78, right: 30, top: 34, bottom: 34 },
        xAxis: {
          type: 'category', data: years.map(String), splitArea: { show: true },
          axisLabel: { color: C.INK_2, fontSize: 11 },
          axisLine: { lineStyle: { color: C.AXIS } }, axisTick: { show: false }
        },
        yAxis: {
          type: 'category', data: provs, splitArea: { show: true }, inverse: true,
          axisLabel: { color: C.INK_2, fontSize: 10.5 },
          axisLine: { lineStyle: { color: C.AXIS } }, axisTick: { show: false }
        },
        visualMap: {
          min: Math.min.apply(null, hvals), max: Math.max.apply(null, hvals),
          calculable: false, orient: 'horizontal', left: 'center', bottom: 0,
          itemWidth: 12, itemHeight: 110,
          textStyle: { color: C.INK_MUTED, fontSize: 10.5 },
          inRange: { color: C.SEQ.slice().reverse() },
          formatter: v => NF.big(v)
        },
        series: [{
          type: 'heatmap',
          data: heat.filter(h => isNum(h[2])),
          label: { show: true, fontSize: 9.5, color: C.INK },
          itemStyle: { borderColor: '#0a1420', borderWidth: 1 },
          emphasis: { itemStyle: { borderColor: '#fff', borderWidth: 1.5 } }
        }]
      });
    }
  }

  /* ====================================================================== */
  const RENDERERS = {
    trend: pageTrend,
    space: pageSpace,
    region: pageRegion,
    collection: pageCollection,
    service: pageService,
    international: pageInternational,
    data: pageData
  };

  global.MVPages = {
    render: function () {
      const page = document.body.getAttribute('data-page');
      const fn = RENDERERS[page];
      if (!fn) { document.getElementById('page-root').innerHTML = '<p>未知页面：' + esc(page) + '</p>'; return; }
      try { fn(); } catch (e) {
        console.error(e);
        document.getElementById('page-root').innerHTML =
          '<div class="card"><h2 class="sec">渲染出错</h2><p class="note">' + esc(e.message) + '</p></div>';
      }
      setTimeout(() => MV.resizeAll(), 80);
    }
  };

})(window);
