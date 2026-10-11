/* ==========================================================================
   core.js —— 公共运行时：舞台缩放、ECharts 主题、数值格式化、交互总线
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------- 常量 */
  const C = {
    STAGE_W: 1920,
    STAGE_H: 1080,

    /* 分类色：区域身份（已程序化校验，见 docs/visual_design.md） */
    REGION: {
      '东部': '#3987e5',
      '中部': '#199e70',
      '西部': '#c98500',
      '东北': '#e66767'
    },
    /* 形状是颜色之外的第二识别通道 —— CVD 底线区间所要求的二次编码 */
    REGION_SYMBOL: {
      '东部': 'circle',
      '中部': 'triangle',
      '西部': 'diamond',
      '东北': 'rect'
    },
    REGIONS: ['东部', '中部', '西部', '东北'],

    /* 顺序色阶：地图数量级（单色蓝，6 级） */
    SEQ: ['#184f95', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4', '#cde2fb'],
    NO_DATA: '#21323f',

    /* 文字与配件（必须与 theme.css 的令牌一致） */
    INK: '#e8f0f7',
    INK_2: '#a6bccd',
    INK_MUTED: '#7590a5',
    GRID: '#1c3145',
    AXIS: '#2a4459',
    SURFACE: '#101f30',

    NO_DATA_LABEL: '暂无数据'
  };
  global.MV = global.MV || {};
  global.MV.C = C;

  /* ---------------------------------------------------------------- 舞台缩放
     大屏的常见问题是「按固定 1920×1080 设计、在非 16:9 屏幕上等比缩放」，
     结果宽屏（比如 2:1）上下占满、左右留出大片黑边，看起来既不居中也不好用。

     这里的做法：**画布高度跟随窗口宽高比**（H = 1920 × 窗口高 / 窗口宽），
     再按宽度缩放到刚好铺满，因此不会出现黑边。网格里的弹性行（1fr）会吸收
     高度的变化，面板本身不会变形；只有超出合理范围（过矮/过高）时才退回
     固定 1080 高 + 等比缩放。
  ------------------------------------------------------------------------ */
  const STAGE_H_MIN = 940;
  const STAGE_H_MAX = 1260;

  function fitStage() {
    const stage = document.getElementById('stage');
    if (!stage) return;

    const ar = global.innerHeight / global.innerWidth;
    let h = Math.round(C.STAGE_W * ar);
    h = Math.max(STAGE_H_MIN, Math.min(STAGE_H_MAX, h));
    if (stage.__h !== h) {
      stage.style.height = h + 'px';
      stage.__h = h;
    }

    const s = Math.min(global.innerWidth / C.STAGE_W, global.innerHeight / h);
    stage.style.transform = 'scale(' + s + ')';
    /* 用负外边距抵消缩放后的空白，保证始终居中且无滚动条 */
    stage.style.marginLeft = ((s - 1) * C.STAGE_W / 2) + 'px';
    stage.style.marginTop = ((s - 1) * h / 2) + 'px';
  }

  /* ---------------------------------------------------------------- 数值格式化 */
  const NF = {
    /** 千分位整数 */
    int(v, dash) { return MV.isNum(v) ? Math.round(v).toLocaleString('en-US') : (dash || C.NO_DATA_LABEL); },
    /** 固定小数 */
    f(v, d, dash) {
      if (!MV.isNum(v)) return dash || C.NO_DATA_LABEL;
      return Number(v).toFixed(d === undefined ? 1 : d);
    },
    /** 大数自动降级为「万 / 亿」 */
    big(v, dash) {
      if (!MV.isNum(v)) return dash || C.NO_DATA_LABEL;
      const a = Math.abs(v);
      if (a >= 1e8) return (v / 1e8).toFixed(2) + '亿';
      if (a >= 1e4) return (v / 1e4).toFixed(1) + '万';
      return Math.round(v).toLocaleString('en-US');
    },
    /** 百分比 */
    pct(v, d, dash) {
      if (!MV.isNum(v)) return dash || C.NO_DATA_LABEL;
      return Number(v).toFixed(d === undefined ? 1 : d) + '%';
    }
  };
  global.MV.NF = NF;

  /* ---------------------------------------------------------------- 数值判定 */
  /** 缺测判定：null / undefined / NaN / '' 均视为缺测。0 是有效值。 */
  function isNum(v) {
    return v !== null && v !== undefined && v !== '' && typeof v !== 'boolean' && !Number.isNaN(Number(v));
  }
  global.MV.isNum = isNum;

  /* ---------------------------------------------------------------- ECharts 主题 */
  const BASE_TEXT = { fontFamily: '"Microsoft YaHei","PingFang SC",system-ui,sans-serif', color: C.INK_2 };

  global.MV.theme = {
    color: [C.REGION['东部'], C.REGION['中部'], C.REGION['西部'], C.REGION['东北']],
    backgroundColor: 'transparent',
    textStyle: BASE_TEXT,
    title: {
      textStyle: { color: C.INK, fontSize: 13, fontWeight: 600 },
      subtextStyle: { color: C.INK_MUTED, fontSize: 11 }
    },
    animationDuration: 620,
    animationEasing: 'cubicOut',
    grid: { left: 46, right: 18, top: 26, bottom: 30, containLabel: false },
    tooltip: {
      /* .panel 上有 overflow:hidden，tooltip 默认允许溢出到图表容器之外，
         贴边悬停时会被面板裁掉——表现为「有时候显示、有时候不显示」。
         confine 把 tooltip 约束在图表容器内，从根上避免被裁。 */
      confine: true,
      backgroundColor: 'rgba(10,20,32,0.96)',
      borderColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      padding: [9, 12],
      textStyle: { color: C.INK, fontSize: 12.5, fontFamily: BASE_TEXT.fontFamily },
      extraCssText: 'border-radius:6px;box-shadow:0 8px 26px rgba(0,0,0,.5);backdrop-filter:blur(3px);'
    },
    legend: {
      textStyle: { color: C.INK_2, fontSize: 11.5 },
      itemWidth: 10, itemHeight: 10, itemGap: 12, icon: 'roundRect'
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: C.AXIS, width: 1 } },
      axisTick: { show: false },
      axisLabel: { color: C.INK_MUTED, fontSize: 11 },
      splitLine: { show: false }
    },
    valueAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: C.INK_MUTED, fontSize: 11 },
      splitLine: { lineStyle: { color: C.GRID, width: 1, type: 'solid' } },
      nameTextStyle: { color: C.INK_MUTED, fontSize: 11 }
    }
  };

  /* ---------------------------------------------------------------- 图表注册表 */
  const charts = new Map();

  /* 把上面的主题**真正注册**到 ECharts。
     不注册的话，任何未显式指定颜色的系列会回落到 ECharts 自带默认调色板，
     那样就会绕过本项目已校验的配色，所以这一步必须做。 */
  const THEME_NAME = 'mv';
  let themeReady = false;
  function ensureTheme() {
    if (themeReady) return;
    if (global.echarts && global.echarts.registerTheme) {
      global.echarts.registerTheme(THEME_NAME, global.MV.theme);
      themeReady = true;
    }
  }

  /** 实例是否还挂在「当前文档里的那个容器」上。
   *  页面重绘（例如国际比较页切换口径时整个替换 #page-root 的 innerHTML）
   *  会把原容器换成新元素，但缓存里的实例仍绑在**已被移除**的旧 canvas 上。
   *  此时若继续复用它，setOption 会画进一个不在文档中的节点，页面上只剩
   *  一块空白——这正是「切换口径后图表全部消失」的成因。
   *  判据必须是对象同一性（实例的 dom === 当前元素），只比 id 会误判为可复用。 */
  function isLive(inst, el) {
    return !!inst && inst.getDom() === el && inst.getDom().isConnected;
  }

  /** 创建或复用图表实例（自动 resize） */
  function chart(domId, option) {
    const el = document.getElementById(domId);
    if (!el) { console.warn('[MV] 找不到容器 #' + domId); return null; }
    ensureTheme();
    let inst = charts.get(domId);
    if (inst && !isLive(inst, el)) {
      try { inst.dispose(); } catch (e) { /* 已回收则忽略 */ }
      charts.delete(domId);
      inst = null;
    }
    if (!inst) {
      inst = echarts.init(el, themeReady ? THEME_NAME : null, { renderer: 'canvas' });
      charts.set(domId, inst);
    }
    if (option) inst.setOption(option, true);
    return inst;
  }
  function getChart(domId) { return charts.get(domId); }
  /* 只 resize 仍然挂在文档里的实例：已随页面重绘被丢弃的那些再 resize
     既无意义，也可能在已 dispose 的实例上抛错。 */
  function resizeAll() {
    charts.forEach((c, id) => {
      const el = document.getElementById(id);
      if (isLive(c, el)) c.resize();
    });
  }
  global.MV.chart = chart;
  global.MV.getChart = getChart;
  global.MV.resizeAll = resizeAll;

  /* ---------------------------------------------------------------- 缺测提示 */
  /** 面板无数据时显示统一文案（绝不显示为 0） */
  function showEmpty(domId, text) {
    const el = document.getElementById(domId);
    if (!el) return;
    /* 用空状态文案替换容器内容前，先丢弃该容器上可能存在的实例，
       否则缓存会留下一个绑在已删除节点上的实例（与 chart() 同一类问题）。 */
    const stale = charts.get(domId);
    if (stale) {
      try { stale.dispose(); } catch (e) { /* 已回收则忽略 */ }
      charts.delete(domId);
    }
    el.innerHTML = '<div class="empty-state">' + (text || C.NO_DATA_LABEL) + '</div>';
  }
  global.MV.showEmpty = showEmpty;

  /* ---------------------------------------------------------------- tooltip 行 */
  /** 生成 tooltip 中的一行：色块 + 名称 + 值（缺测显示"暂无数据"） */
  function row(color, name, value, symbol) {
    const sw = symbol
      ? '<span style="display:inline-block;width:8px;height:8px;background:' + color +
        ';transform:rotate(45deg);margin-right:6px;border-radius:1px"></span>'
      : '<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:' + color +
        ';margin-right:6px"></span>';
    const v = (value === undefined || value === null || value === '') ? C.NO_DATA_LABEL : value;
    return '<div style="display:flex;justify-content:space-between;gap:16px;line-height:1.75">' +
      '<span style="color:' + C.INK_2 + '">' + sw + name + '</span>' +
      '<b style="color:' + C.INK + ';font-variant-numeric:tabular-nums">' + v + '</b></div>';
  }
  global.MV.row = row;

  /* ---------------------------------------------------------------- 交互总线 */
  /* 首页各模块通过它联动：地图点击省份 -> KPI / 四象限 / 服务 / 国际比较 同步过滤 */
  const listeners = {};
  global.MV.bus = {
    on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
    emit(evt, payload) { (listeners[evt] || []).forEach(fn => { try { fn(payload); } catch (e) { console.error(e); } }); }
  };

  /* 当前分析上下文：选中的省份（null = 全国）与年份 */
  global.MV.state = { province: null, year: null };

  global.MV.setProvince = function (p) {
    global.MV.state.province = p || null;
    global.MV.bus.emit('province', global.MV.state.province);
  };
  global.MV.setYear = function (y) {
    global.MV.state.year = y || null;
    global.MV.bus.emit('year', global.MV.state.year);
  };

  /* ---------------------------------------------------------------- 启动 */
  function boot() {
    fitStage();
    global.addEventListener('resize', function () { fitStage(); resizeAll(); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }

})(window);
