/**
 * Adapted from QIFANAI/dsh-startup-screen v1.6.0, commit 8499f9df.
 * Copyright (c) 2026 沈宏宏 and dsh-startup-screen contributors, MIT.
 * See dsh-startup-LICENSE.txt. Visual choreography preserved; host lifecycle,
 * branding, scene copy and media handling adapted for ShineAI.
 */
export function mountCinematic(host, {theme='dark', speed=1, facts={}}={}, onFinish=()=>{}) {
  let disposed=false;
  const timeouts=new Set(), intervals=new Set(), frames=new Set();
  function setTimeout(fn,delay){if(disposed)return 0;const id=window.setTimeout(()=>{timeouts.delete(id);if(!disposed)fn();},delay);timeouts.add(id);return id;}
  function clearTimeout(id){window.clearTimeout(id);timeouts.delete(id);}
  function setInterval(fn,delay){if(disposed)return 0;const id=window.setInterval(()=>{if(!disposed)fn();},delay);intervals.add(id);return id;}
  function clearInterval(id){window.clearInterval(id);intervals.delete(id);}
  function requestAnimationFrame(fn){if(disposed)return 0;const id=window.requestAnimationFrame(t=>{frames.delete(id);if(!disposed)fn(t);});frames.add(id);return id;}
  const SHINE_MARK_PATH='M25 4L29 16L41 12L37 24L48 29L35 33L38 46L25 39L12 46L15 33L2 29L13 24L9 12L21 16Z';
  const C={theme,speed,requireInteraction:false,allowSkip:false,accent:'#ff7500',glitchA:'#ff3b30',glitchB:'#2971b8',identity:'SHINEAI',identityId:'LOCAL',brand1:'SHINEAI',brand2:'YOUR LOCAL AI WORKSPACE',brand3a:'DESKTOP',brand3b:'AI',orgZh:'ShineAI',orgEn:'LOCAL INTELLIGENCE',orgSub:'CREATE · EXPLORE · BUILD',welcomeBox:'SHINEAI',footer:'SHINEAI / LOCAL WORKSPACE'};
  const F={...facts,music:facts.music||'SILENT'};
  const factText=v=>v===null||v===undefined||v===''?'—':String(v);
  const STEPS=[
    {zh:'唤醒本地工作台',en:'AWAKEN YOUR WORKSPACE',log:'让灵感，从这里开始',logEn:'YOUR NEXT IDEA STARTS HERE',badge:'AWAKEN',hold:1200,progress:.28,action:'auto'},
    {zh:'连接你的创造力',en:'CONNECT YOUR CREATIVITY',log:'本地工作台 · 自由探索',logEn:'LOCAL WORKSPACE · OPEN POSSIBILITIES',badge:'CONNECT',hold:1200,progress:.45,action:'auto'},
    {zh:'构建无限可能',en:'BUILD NEW POSSIBILITIES',log:'从一个问题，到下一个作品',logEn:'FROM A QUESTION TO YOUR NEXT CREATION',badge:'CREATE',hold:1600,progress:.64,action:'auto',assembleLogo:true},
    {zh:'探索新的边界',en:'EXPLORE WHAT COMES NEXT',log:'每一次探索，都有新的发现',logEn:'MAKE ROOM FOR YOUR NEXT DISCOVERY',badge:'EXPLORE',hold:1500,progress:.80,action:'auto',hex:true},
    {zh:'让想法闪耀',en:'LET YOUR IDEAS SHINE',log:'ShineAI · 你的本地 AI 工作台',logEn:'SHINEAI · YOUR LOCAL AI WORKSPACE',badge:'SHINE',hold:1700,progress:.94,action:'auto',reticle:true}
  ];
  
  function el(tag, cls, text) {
    var n = document.createElement(tag)
    if (cls) n.className = cls
    if (text != null) n.textContent = text
    return n
  }

  var metalSeq = 0

  function createShineMark(cls) {
    var ns = 'http://www.w3.org/2000/svg'
    var svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('viewBox', '0 0 50 50')
    svg.setAttribute('aria-hidden', 'true')
    if (cls) svg.setAttribute('class', cls)

    var gid = 'dsu-metal-' + (++metalSeq)
    var defs = document.createElementNS(ns, 'defs')
    var lg = document.createElementNS(ns, 'linearGradient')
    lg.setAttribute('id', gid)
    lg.setAttribute('x1', '0.10'); lg.setAttribute('y1', '0')
    lg.setAttribute('x2', '0.62'); lg.setAttribute('y2', '1')
    var stops = [
      [0, '#ffffff', '0.24'],      
      [0.40, '#ffffff', '0'],
      [0.62, '#000000', '0'],
      [1, '#000000', '0.20']       
    ]
    for (var i = 0; i < stops.length; i++) {
      var st = document.createElementNS(ns, 'stop')
      st.setAttribute('offset', String(stops[i][0]))
      st.setAttribute('stop-color', stops[i][1])
      st.setAttribute('stop-opacity', stops[i][2])
      lg.appendChild(st)
    }
    defs.appendChild(lg)
    svg.appendChild(defs)

    var p = document.createElementNS(ns, 'path')
    p.setAttribute('d', SHINE_MARK_PATH)
    p.setAttribute('fill-rule', 'nonzero')
    svg.appendChild(p)   

    var shine = document.createElementNS(ns, 'path')
    shine.setAttribute('d', SHINE_MARK_PATH)
    shine.setAttribute('fill-rule', 'nonzero')
    shine.style.fill = 'url(#' + gid + ')'
    svg.appendChild(shine)
    return svg
  }

  function typeIn(host, text, stagger, mode) {
    host.textContent = ''
    var frag = document.createDocumentFragment()
    var slots = []
    var n = 0
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i)
      if (ch === ' ') {
        frag.appendChild(document.createTextNode('\u00a0'))
        continue
      }
      var decode = mode === 'decode'
      
      var s = el('span', ch === '·' ? 'dsu-ch dsu-sep' : 'dsu-ch', decode ? glyphFor(ch) : ch)
      s.style.transitionDelay = Math.round(n * stagger) + 'ms'
      if (decode) slots.push({ node: s, text: ch, delay: Math.round(n * stagger) })
      frag.appendChild(s)
      n++
    }
    host.appendChild(frag)
    return slots
  }

  var GLYPH_WIDE = '\u30a2\u30a4\u30a6\u30a8\u30aa\u30ab\u30ad\u30af\u30b1\u30b3' +
    '\u30b5\u30b7\u30b9\u30bb\u30bd\u30bf\u30c1\u30c4\u30c6\u30c8\u30ca\u30cb\u30cc\u30cd\u30ce'
  var GLYPH_NARROW = '0123456789ABCDEF'
  
  function glyphFor(ch) {
    var wide = ch.charCodeAt(0) > 0x2e7f
    var pool = wide ? GLYPH_WIDE : GLYPH_NARROW
    return pool.charAt(Math.floor(Math.random() * pool.length))
  }

  var decodeTimer = null
  var decodePending = []
  var DECODE_TICK = 55

  function startDecode(slots) {
    stopDecode()
    if (!slots || !slots.length) return
    decodePending = []
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i]
      decodePending.push({
        node: s.node, text: s.text,
        lockAt: s.delay + 100 + Math.random() * 180
      })
    }
    var t0 = Date.now()
    decodeTimer = setInterval(function () {
      var now = Date.now() - t0
      var rest = []
      for (var j = 0; j < decodePending.length; j++) {
        var d = decodePending[j]
        if (now >= d.lockAt) d.node.textContent = d.text
        else { d.node.textContent = glyphFor(d.text); rest.push(d) }
      }
      decodePending = rest
      if (!decodePending.length) stopDecode()
    }, DECODE_TICK)
  }

  function stopDecode() {
    if (decodeTimer) { clearInterval(decodeTimer); decodeTimer = null }
    for (var i = 0; i < decodePending.length; i++) {
      decodePending[i].node.textContent = decodePending[i].text
    }
    decodePending = []
  }

  function setIn(node, on, cls) {
    if (!node) return
    node.classList.toggle(cls || 'dsu-in', !!on)
  }

  var root = host
  root.classList.toggle('dsu-dark', C.theme === 'dark')
  root.style.setProperty('--dsu-speed', String(C.speed))
  root.style.setProperty('--dsu-accent', C.accent)
  root.style.setProperty('--dsu-glitch-a', C.glitchA)
  root.style.setProperty('--dsu-glitch-b', C.glitchB)

  var ui = {}
  var clockTimer = null
  var html =
    '<div class="dsu-atmo"></div>' +
    '<canvas class="dsu-field" aria-hidden="true"></canvas>' +
    '<div class="dsu-beams"></div>' +
    '<div class="dsu-floor"></div>' +
    '<div class="dsu-plate"></div>' +
    '<div class="dsu-vignette"></div>' +
    '<div class="dsu-watermark"></div>' +
    '<div class="dsu-grain"></div>' +
    '<div class="dsu-black">' +
      '<div class="dsu-black-inner"></div>' +
      '<div class="dsu-sweep"></div>' +
    '</div>' +
    '<div class="dsu-wash"></div>' +
    '<div class="dsu-sheen"></div>' +
    '<header class="dsu-brand">' +
      '<div class="dsu-brand-1"></div><div class="dsu-brand-2"></div>' +
      '<div class="dsu-brand-3"><b></b><span></span></div>' +
    '</header>' +
    '<div class="dsu-stepcount">[ 00 / 06 ] INIT</div>' +
    '<div class="dsu-center">' +
      '<div class="dsu-status"><span class="dsu-status-zh"></span><i class="dsu-caret"></i></div>' +
      '<div class="dsu-sub-en"></div>' +
      '<div class="dsu-rule"></div>' +
      '<div class="dsu-logo"></div>' +
      '<div class="dsu-dots" hidden></div>' +
    '</div>' +
    '<div class="dsu-idline"></div>' +
    '<div class="dsu-facts dsu-facts-1"></div>' +
    '<div class="dsu-facts dsu-facts-2"></div>' +
    '<div class="dsu-reticle"></div>' +
    '<div class="dsu-hex"></div>' +
    '<div class="dsu-trace"></div>' +
    '<div class="dsu-welcome">' +
      '<div class="dsu-w1">WELCOME TO</div>' +
      '<div class="dsu-w2"></div>' +
      '<div class="dsu-w3"></div>' +
      '<div class="dsu-w4"></div>' +
    '</div>' +
    '<div class="dsu-action">' +
      '<div class="dsu-card" hidden></div>' +
      '<button class="dsu-btn" type="button">' +
        '<span class="dsu-btn-zh"></span><span class="dsu-btn-en"></span>' +
      '</button>' +
      '<div class="dsu-hint"></div>' +
    '</div>' +
    '<div class="dsu-frame">' +
      '<i class="dsu-corner dsu-c-tl"></i><i class="dsu-corner dsu-c-tr"></i>' +
      '<i class="dsu-corner dsu-c-bl"></i><i class="dsu-corner dsu-c-br"></i>' +
      '<div class="dsu-scanline"></div>' +
    '</div>' +
    '<div class="dsu-slats"></div>' +
    '<div class="dsu-voice"><i></i><i></i><i></i><i></i><i></i></div>' +
    '<div class="dsu-meta"><span class="dsu-meta-1"></span><span class="dsu-meta-2"></span></div>' +
    '<div class="dsu-checks"></div>' +
    '<div class="dsu-skip">SKIP ▸</div>' +
    '<footer class="dsu-foot"><span></span><i></i></footer>' +
    '<div class="dsu-subtitle">' +
      '<span class="dsu-sub-zh"></span><span class="dsu-sub-en2"></span>' +
    '</div>' +
    '<div class="dsu-progress"><i></i></div>' +
    '<div class="dsu-bloom"></div>' +
    '<div class="dsu-streak"></div>' +
    '<div class="dsu-tear"></div>' +
    '<div class="dsu-flash"></div>'

  root.innerHTML = html

  function q(sel) { return root.querySelector(sel) }
  ui.plate = q('.dsu-plate')
  ui.watermark = q('.dsu-watermark')
  ui.black = q('.dsu-black')
  ui.blackInner = q('.dsu-black-inner')
  ui.sweep = q('.dsu-sweep')
  ui.wash = q('.dsu-wash')
  ui.sheen = q('.dsu-sheen')
  ui.flash = q('.dsu-flash')
  ui.bloom = q('.dsu-bloom')
  ui.streak = q('.dsu-streak')
  ui.tear = q('.dsu-tear')
  ui.vignette = q('.dsu-vignette')
  ui.brand = q('.dsu-brand')
  ui.center = q('.dsu-center')
  ui.brand1 = q('.dsu-brand-1')
  ui.brand2 = q('.dsu-brand-2')
  ui.brand3b = q('.dsu-brand-3 b')
  ui.brand3s = q('.dsu-brand-3 span')
  ui.stepcount = q('.dsu-stepcount')
  ui.status = q('.dsu-status')
  ui.statusZh = q('.dsu-status-zh')
  ui.caret = q('.dsu-caret')
  ui.subEn = q('.dsu-sub-en')
  ui.rule = q('.dsu-rule')
  ui.logo = q('.dsu-logo')
  ui.dots = q('.dsu-dots')
  ui.idline = q('.dsu-idline')
  ui.fact1 = q('.dsu-facts-1')
  ui.fact2 = q('.dsu-facts-2')
  ui.reticle = q('.dsu-reticle')
  ui.hex = q('.dsu-hex')
  ui.trace = q('.dsu-trace')
  ui.welcome = q('.dsu-welcome')
  ui.w1 = q('.dsu-w1')
  ui.w2 = q('.dsu-w2')
  ui.w3 = q('.dsu-w3')
  ui.w4 = q('.dsu-w4')
  ui.action = q('.dsu-action')
  ui.card = q('.dsu-card')
  ui.btn = q('.dsu-btn')
  ui.btnZh = q('.dsu-btn-zh')
  ui.btnEn = q('.dsu-btn-en')
  ui.hint = q('.dsu-hint')
  ui.skip = q('.dsu-skip')
  ui.foot = q('.dsu-foot')
  ui.footText = q('.dsu-foot span')
  ui.subZh = q('.dsu-sub-zh')
  ui.subEn2 = q('.dsu-sub-en2')
  ui.progress = q('.dsu-progress')
  ui.bar = q('.dsu-progress i')
  ui.frame = q('.dsu-frame')
  ui.scanline = q('.dsu-scanline')
  ui.slats = q('.dsu-slats')
  ui.voice = q('.dsu-voice')
  ui.meta = q('.dsu-meta')
  ui.meta1 = q('.dsu-meta-1')
  ui.meta2 = q('.dsu-meta-2')
  ui.atmo = q('.dsu-atmo')
  ui.field = q('.dsu-field')
  ui.beams = q('.dsu-beams')
  ui.floor = q('.dsu-floor')
  ui.checks = q('.dsu-checks')

  ui.brand1.textContent = C.brand1
  ui.brand2.textContent = C.brand2
  ui.brand3b.textContent = C.brand3a
  ui.brand3s.textContent = C.brand3b
  ui.footText.textContent = C.footer
  ui.w2.textContent = C.welcomeBox
  ui.w4.textContent = '欢迎回到你的工作台'
  
  ui.idline.textContent = ''
  ui.idline.appendChild(el('span', null, '· WORKSPACE : '))
  ui.idline.appendChild(el('b', null, C.identityId))

  ;(function blackStage() {
    var inner = ui.blackInner
    var whale = createShineMark('dsu-whale')
    inner.appendChild(whale)
    inner.appendChild(el('div', 'dsu-black-zh', C.orgZh))
    var en = el('div', 'dsu-black-en', C.orgEn)
    inner.appendChild(en)
    inner.appendChild(el('div', 'dsu-black-sub', C.orgSub))
    ui.blackEn = en
  })()

  ;(function logoStage() {
    ui.logo.appendChild(createShineMark())
    ui.logo.appendChild(el('div', 'dsu-logolabel', 'S H I N E A I'))
  })()

  ;(function welcomeLogo() {
    ui.w3.appendChild(createShineMark())
    ui.w3.appendChild(el('span', 'dsu-w3label', 'S H I N E A I  ·  W O R K S P A C E'))
  })()

  ;(function watermark() {
    var boxes = [
      [0.60, 0.02, 0.16, 0.96], [0.78, 0.02, 0.16, 0.96], [0.96, 0.02, 0.16, 0.96],
      [0.05, 0.02, 0.10, 0.5]
    ]
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i]
      var depth = i < 1 ? ' dsu-wm-far' : i < 3 ? ' dsu-wm-mid' : ' dsu-wm-near'
      var n = el('div', 'dsu-wm' + depth)
      n.style.left = (b[0] * 100) + '%'
      n.style.top = (b[1] * 100) + '%'
      n.style.width = (b[2] * 100) + '%'
      n.style.height = (b[3] * 100) + '%'
      ui.watermark.appendChild(n)
    }
  })()

  ;(function slatsAndMeta() {
    for (var i = 0; i < STEPS.length + 1; i++) ui.slats.appendChild(el('i', 'dsu-slat'))
    
    ui.meta1.textContent = 'REV ' + factText(F.version) + ' · ' + factText(F.profile) + ' PROFILE'
    
    ui.fact1.textContent = ''
    ui.fact1.appendChild(el('span', null, '· OPENING : '))
    ui.fact1.appendChild(el('b', null, 'CINEMATIC'))
    ui.fact2.textContent = ''
    ui.fact2.appendChild(el('span', null, '· SANDBOX : '))
    ui.fact2.appendChild(el('b', null, factText(F.sandbox)))
    ui.fact2.appendChild(el('span', null, ' · AUDIO : '))
    
    ui.fact2.appendChild(el('b', null, factText(F.music)))
    paintClock()
    clockTimer = setInterval(paintClock, 1000)
  })()

  ;(function trace() {
    var ns = 'http://www.w3.org/2000/svg'
    var svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('viewBox', '0 0 520 46')
    var base = document.createElementNS(ns, 'line')
    base.setAttribute('x1', '0'); base.setAttribute('y1', '23')
    base.setAttribute('x2', '520'); base.setAttribute('y2', '23')
    base.setAttribute('class', 'dsu-trace-base')
    svg.appendChild(base)
    for (var i = 0; i <= 20; i++) {
      var tick = document.createElementNS(ns, 'line')
      var tx = i * 26
      tick.setAttribute('x1', String(tx)); tick.setAttribute('y1', '19')
      tick.setAttribute('x2', String(tx)); tick.setAttribute('y2', '27')
      tick.setAttribute('class', 'dsu-trace-tick')
      svg.appendChild(tick)
    }
    var seed = String(F.hash || 'SHINEAI')
    var h = 2166136261
    for (var k = 0; k < seed.length; k++) {
      h ^= seed.charCodeAt(k)
      h = Math.imul(h, 16777619) >>> 0
    }
    var phase = (h % 628) / 100
    
    function tracePathAt(now) {
      var drift = now * 0.00034
      var d = 'M0 23'
      for (var x = 0; x <= 520; x += 8) {
        var env = Math.sin((x / 520) * Math.PI)
        var amp = (Math.sin(x * 0.035 + phase + drift) * 5 +
          Math.sin(x * 0.011 + phase * 1.7 - drift * 0.62) * 3) * env
        d += ' L' + x + ' ' + (23 + amp).toFixed(1)
      }
      return d
    }
    var path = document.createElementNS(ns, 'path')
    path.setAttribute('d', tracePathAt(0))
    path.setAttribute('class', 'dsu-trace-line')
    svg.appendChild(path)
    var cursor = document.createElementNS(ns, 'line')
    cursor.setAttribute('x1', '0'); cursor.setAttribute('y1', '2')
    cursor.setAttribute('x2', '0'); cursor.setAttribute('y2', '44')
    cursor.setAttribute('class', 'dsu-trace-cursor')
    svg.appendChild(cursor)
    ui.trace.appendChild(svg)
    ui.tracePath = path
    ui.traceTimer = setInterval(function () { path.setAttribute('d', tracePathAt(Date.now())) }, 90)
  })()

  ;(function checks() {
    var rows = [
      ['PROFILE', F.profile],
      ['AUDIO', F.music],
      ['PLATFORM', F.platform],
      ['SANDBOX', F.sandbox],
      ['THEME', C.theme.toUpperCase()]
    ]
    var checksHead = el('div', 'dsu-checks-h', 'OPENING / ')
    checksHead.appendChild(el('span', 'dsu-live', 'SCENE'))
    ui.checks.appendChild(checksHead)
    for (var i = 0; i < rows.length; i++) {
      var row = el('div', 'dsu-check')
      row.appendChild(el('span', 'dsu-check-k', rows[i][0]))
      row.appendChild(el('span', 'dsu-check-v', factText(rows[i][1])))
      row.appendChild(el('i'))
      ui.checks.appendChild(row)
    }
  })()

  ;(function reticle() {
    var ns = 'http://www.w3.org/2000/svg'
    var svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('viewBox', '0 0 400 400')
    function arc(cx, cy, r, a0, a1, cls, cap) {
      var rad = function (d) { return (d - 90) * Math.PI / 180 }
      var x0 = cx + r * Math.cos(rad(a0)), y0 = cy + r * Math.sin(rad(a0))
      var x1 = cx + r * Math.cos(rad(a1)), y1 = cy + r * Math.sin(rad(a1))
      var large = (a1 - a0) > 180 ? 1 : 0
      var p = document.createElementNS(ns, 'path')
      p.setAttribute('d', 'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) +
        ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2))
      p.setAttribute('class', cls)
      if (cap) p.setAttribute('stroke-linecap', cap)
      return { node: p, x: x1, y: y1, x0: x0, y0: y0 }
    }
    var gA = document.createElementNS(ns, 'g')
    gA.setAttribute('class', 'dsu-ret-rot-a')
    
    var a = arc(200, 200, 150, 215, 505, 'dsu-ring-a', 'round')
    gA.appendChild(a.node)
    var da = document.createElementNS(ns, 'circle')
    da.setAttribute('class', 'dsu-dot-a')
    da.setAttribute('cx', a.x.toFixed(2)); da.setAttribute('cy', a.y.toFixed(2)); da.setAttribute('r', '7')
    gA.appendChild(da)
    svg.appendChild(gA)

    var gB = document.createElementNS(ns, 'g')
    gB.setAttribute('class', 'dsu-ret-rot-b')
    var b = arc(200, 200, 104, 200, 490, 'dsu-ring-b', 'round')
    gB.appendChild(b.node)
    var db = document.createElementNS(ns, 'circle')
    db.setAttribute('class', 'dsu-dot-b')
    db.setAttribute('cx', b.x0.toFixed(2)); db.setAttribute('cy', b.y0.toFixed(2)); db.setAttribute('r', '4')
    gB.appendChild(db)
    svg.appendChild(gB)

    var gC = document.createElementNS(ns, 'g')
    var bl = arc(200, 200, 62, 118, 242, 'dsu-bracket', 'round')
    var br = arc(200, 200, 62, 298, 62, 'dsu-bracket', 'round')
    gC.appendChild(bl.node); gC.appendChild(br.node)
    svg.appendChild(gC)

    var pts = [[152, 132], [252, 268], [278, 150]]
    for (var i = 0; i < pts.length; i++) {
      var c = document.createElementNS(ns, 'circle')
      c.setAttribute('class', 'dsu-dot-o')
      c.setAttribute('cx', pts[i][0]); c.setAttribute('cy', pts[i][1]); c.setAttribute('r', '2.8')
      svg.appendChild(c)
    }

    var gT = document.createElementNS(ns, 'g')
    gT.setAttribute('class', 'dsu-ret-ticks')
    var TICKS = 48
    for (var t = 0; t < TICKS; t++) {
      var deg = (t / TICKS) * 360 - 90
      var rad = deg * Math.PI / 180
      var long = t % 4 === 0
      var r0 = 133
      var r1 = long ? 143 : 138
      var line = document.createElementNS(ns, 'line')
      line.setAttribute('class', 'dsu-tick' + (long ? ' dsu-tick-major' : ''))
      line.setAttribute('x1', (200 + r0 * Math.cos(rad)).toFixed(2))
      line.setAttribute('y1', (200 + r0 * Math.sin(rad)).toFixed(2))
      line.setAttribute('x2', (200 + r1 * Math.cos(rad)).toFixed(2))
      line.setAttribute('y2', (200 + r1 * Math.sin(rad)).toFixed(2))
      line.style.animationDelay = Math.round(t * 32) + 'ms'
      gT.appendChild(line)
    }
    svg.appendChild(gT)

    var gD = document.createElementNS(ns, 'g')
    gD.setAttribute('class', 'dsu-ret-data')
    var DATA_TICKS = 40
    var lit = Math.max(6, Math.min(DATA_TICKS, Number(F.bundleCount) || 12))
    for (var d = 0; d < DATA_TICKS; d++) {
      var degD = (d / DATA_TICKS) * 360 - 90
      var radD = degD * Math.PI / 180
      var rD0 = 112
      var rD1 = d < lit ? 120 : 116
      var lineD = document.createElementNS(ns, 'line')
      lineD.setAttribute('class', 'dsu-tick-data' + (d < lit ? ' dsu-lit' : ''))
      lineD.setAttribute('x1', (200 + rD0 * Math.cos(radD)).toFixed(2))
      lineD.setAttribute('y1', (200 + rD0 * Math.sin(radD)).toFixed(2))
      lineD.setAttribute('x2', (200 + rD1 * Math.cos(radD)).toFixed(2))
      lineD.setAttribute('y2', (200 + rD1 * Math.sin(radD)).toFixed(2))
      lineD.style.animationDelay = Math.round(d * 26) + 'ms'
      gD.appendChild(lineD)
    }
    svg.appendChild(gD)

    var comet = document.createElementNS(ns, 'circle')
    comet.setAttribute('class', 'dsu-ret-comet')
    comet.setAttribute('cx', '200')
    comet.setAttribute('cy', '200')
    comet.setAttribute('r', '150')
    comet.setAttribute('pathLength', '100')
    comet.setAttribute('stroke-dasharray', '8 92')
    svg.appendChild(comet)

    var ping = document.createElementNS(ns, 'circle')
    ping.setAttribute('class', 'dsu-ping')
    ping.setAttribute('cx', '200')
    ping.setAttribute('cy', '200')
    ping.setAttribute('r', '150')
    svg.appendChild(ping)

    ui.reticle.appendChild(svg)

    ui.reticleScan = el('div', 'dsu-ret-scan')
    ui.reticle.appendChild(ui.reticleScan)
  })()


  var timers = []
  var waiters = []
  var skipped = false
  var finished = false
  var hexTimer = null

  function ms(base) { return Math.round(base / C.speed) }

  function wait(base) {
    return new Promise(function (resolve) {
      if (skipped) return resolve()
      var done = false
      function fin() {
        if (done) return
        done = true
        var i = waiters.indexOf(fin)
        if (i >= 0) waiters.splice(i, 1)
        resolve()
      }
      var t = setTimeout(fin, Math.max(0, ms(base)))
      timers.push(t)
      waiters.push(fin)
    })
  }

  function releaseAll() {
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i])
    timers.length = 0
    stopDecode()   
    var list = waiters.slice()
    waiters.length = 0
    for (var j = 0; j < list.length; j++) { try { list[j]() } catch (err) {  } }
  }

  function setProgress(p) {
    var pct = Math.max(0, Math.min(1, p))
    ui.bar.style.width = Math.round(pct * 100) + '%'
  }

  function setSlats(active) {
    var items = ui.slats.children
    for (var i = 0; i < items.length; i++) {
      var idx = i + 1
      items[i].classList.toggle('dsu-on', idx === active)
      items[i].classList.toggle('dsu-past', idx < active)
    }
  }

  function setChecks(active) {
    if (!ui.checks) return
    var items = ui.checks.querySelectorAll('.dsu-check')
    for (var i = 0; i < items.length; i++) {
      var idx = i + 1
      items[i].classList.toggle('dsu-on', idx === active)
      items[i].classList.toggle('dsu-past', idx < active)
    }
  }

  function sweep() {
    if (!ui.scanline) return
    ui.scanline.classList.remove('dsu-go')
    void ui.scanline.offsetWidth
    ui.scanline.classList.add('dsu-go')
  }

  function paintClock() {
    var d = new Date()
    var pad = function (n) { return (n < 10 ? '0' : '') + n }
    ui.meta2.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
  }

  function setSubtitle(zh, en) {
    ui.subZh.classList.remove('dsu-in')
    ui.subEn2.classList.remove('dsu-in')
    setTimeout(function () {
      ui.subZh.textContent = zh || ''
      ui.subEn2.textContent = en || ''
      ui.subZh.classList.add('dsu-in')
      if (en) ui.subEn2.classList.add('dsu-in')
    }, ms(140))
  }

  function setStepCount(i, code) {
    var totalSteps = STEPS.length + 1
    ui.stepcount.textContent = '[ ' + String(i).padStart(2, '0') + ' / ' +
      String(totalSteps).padStart(2, '0') + ' ] ' + code
  }

  function startHex() {
    var lines = 12
    
    var seed = String(F.hash || 'SHINEAI') + '|' + String(F.model || '') + '|' + String(F.bundleCount || '')
    var h = 2166136261
    for (var k = 0; k < seed.length; k++) {
      h ^= seed.charCodeAt(k)
      h = Math.imul(h, 16777619) >>> 0
    }
    var tick = 0
    function line() {
      var s = ''
      for (var i = 0; i < 26; i++) {
        h = (Math.imul(h, 1664525) + 1013904223 + (tick++)) >>> 0
        s += '0123456789ABCDEF'.charAt(h >>> 28)
        if (i % 2 === 1) s += ' '
      }
      return s
    }
    function paint() {
      var out = []
      for (var i = 0; i < lines; i++) out.push(line())
      ui.hex.innerHTML = out.join('<br>')
    }
    paint()
    ui.hex.classList.add('dsu-in')

    hexTimer = setInterval(paint, 110)
  }
  function stopHex() {
    if (hexTimer) { clearInterval(hexTimer); hexTimer = null }
    ui.hex.classList.remove('dsu-in')
  }

  var fieldHandle = null

  function stopField() {
    if (!fieldHandle) return
    fieldHandle.stop()
    fieldHandle = null
  }

  function startField() {
    var cv = ui.field
    if (!cv || typeof cv.getContext !== 'function') return
    var ctx = null
    try { ctx = cv.getContext('2d') } catch (e) { return }
    if (!ctx) return

    var reduced = false
    try {
      reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    } catch (e) {  }

    var dpr = Math.min(1.75, Math.max(1, Number(window.devicePixelRatio) || 1))
    var W = 0
    var H = 0
    var raf = 0
    var frames = 0
    var startedAt = Date.now()
    function fieldNow() { return Math.max(0, Date.now() - startedAt) }
    var palette = C.theme === 'dark'
      ? { cool: '111,211,232', warm: '255,177,102', dim: '224,241,246' }
      : { cool: '38,108,122', warm: '164,91,38', dim: '48,64,66' }

    var state = 2166136261
    var seed = String(F.hash || 'SHINEAI') + '|' + String(F.profile || '') + '|' + String(F.bundleCount || '')
    for (var k = 0; k < seed.length; k++) {
      state ^= seed.charCodeAt(k)
      state = Math.imul(state, 16777619) >>> 0
    }
    function rand() {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      return state / 4294967296
    }

    var motes = []
    var ribbons = []
    var columns = []

    function resize() {
      W = Math.max(1, Number(cv.clientWidth) || Number(root.clientWidth) || Number(window.innerWidth) || 1600)
      H = Math.max(1, Number(cv.clientHeight) || Number(root.clientHeight) || Number(window.innerHeight) || 1020)
      cv.width = Math.round(W * dpr)
      cv.height = Math.round(H * dpr)
      if (cv.style) {
        cv.style.width = '100%'
        cv.style.height = '100%'
      }
      if (typeof ctx.setTransform === 'function') ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      spawn()
    }

    function spawn() {
      motes.length = 0
      ribbons.length = 0
      columns.length = 0
      var count = Math.round(Math.min(150, Math.max(74, (W * H) / 13500)))
      for (var i = 0; i < count; i++) {
        motes.push({
          x: rand() * W,
          y: rand() * H,
          z: 0.24 + rand() * 0.76,
          r: 0.35 + rand() * 1.35,
          ax: 10 + rand() * 54,
          ay: 7 + rand() * 38,
          sp: 0.000025 + rand() * 0.000075,
          ph: rand() * Math.PI * 2,
          tw: 0.00028 + rand() * 0.00066,
          warm: rand() < 0.24
        })
      }
      for (var r = 0; r < 4; r++) {
        ribbons.push({
          y: 0.20 + r * 0.18 + rand() * 0.055,
          amp: 0.028 + rand() * 0.042,
          sp: 0.000022 + rand() * 0.000026,
          ph: rand() * Math.PI * 2,
          wide: 5 + rand() * 8,
          warm: r === 1
        })
      }
      for (var c = 0; c < 12; c++) {
        columns.push({
          side: c % 2,
          x: c < 6 ? (0.025 + rand() * 0.12) : (0.855 + rand() * 0.12),
          y: rand(),
          len: 24 + rand() * 86,
          sp: 0.000006 + rand() * 0.000012
        })
      }
    }

    function drawRibbon(r, now) {
      var drift = now * r.sp
      var x0 = -W * 0.12
      var x1 = W * 1.12
      var y0 = H * (r.y + Math.sin(drift + r.ph) * r.amp)
      var y1 = H * (r.y + Math.cos(drift * 0.82 + r.ph) * r.amp * 1.25)
      var c1 = H * (r.y + Math.sin(drift * 0.64 + r.ph) * r.amp * 2.1)
      var c2 = H * (r.y + Math.cos(drift * 0.57 + r.ph * 1.4) * r.amp * 2.4)
      var rgb = r.warm ? palette.warm : palette.cool
      var grad = ctx.createLinearGradient(0, 0, W, 0)
      grad.addColorStop(0, 'rgba(' + rgb + ',0)')
      grad.addColorStop(0.22, 'rgba(' + rgb + ',' + (C.theme === 'dark' ? 0.055 : 0.045) + ')')
      grad.addColorStop(0.50, 'rgba(' + rgb + ',' + (C.theme === 'dark' ? 0.14 : 0.085) + ')')
      grad.addColorStop(0.78, 'rgba(' + rgb + ',' + (C.theme === 'dark' ? 0.050 : 0.040) + ')')
      grad.addColorStop(1, 'rgba(' + rgb + ',0)')
      ctx.strokeStyle = grad
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.bezierCurveTo(W * 0.28, c1, W * 0.70, c2, x1, y1)
      ctx.lineWidth = r.wide
      ctx.globalAlpha = 0.16
      ctx.stroke()
      ctx.lineWidth = 0.75
      ctx.globalAlpha = 0.72
      ctx.stroke()

      var u = ((now * 0.000034 + r.ph / (Math.PI * 2)) % 1 + 1) % 1
      var v = 1 - u
      var px = v * v * v * x0 + 3 * v * v * u * (W * 0.28) +
        3 * v * u * u * (W * 0.70) + u * u * u * x1
      var py = v * v * v * y0 + 3 * v * v * u * c1 +
        3 * v * u * u * c2 + u * u * u * y1
      var cdx = (px / W - 0.5) * 2
      var cdy = (py / H - 0.45) * 2
      var cometFade = Math.min(1, Math.max(0.16, Math.sqrt(cdx * cdx + cdy * cdy) * 1.4))
      ctx.beginPath()
      ctx.fillStyle = 'rgba(' + rgb + ',' + (0.11 * cometFade).toFixed(3) + ')'
      ctx.arc(px, py, r.wide * 2.4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.fillStyle = 'rgba(' + rgb + ',' + (0.72 * cometFade).toFixed(3) + ')'
      ctx.arc(px, py, r.warm ? 1.25 : 1.05, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    function draw(now, still) {
      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = C.theme === 'dark' ? 'lighter' : 'source-over'

      var sx = ((now * 0.012) % (W + 260)) - 130
      var sweep = ctx.createLinearGradient(sx - 150, 0, sx + 150, 0)
      sweep.addColorStop(0, 'rgba(' + palette.cool + ',0)')
      sweep.addColorStop(0.5, 'rgba(' + palette.cool + ',' + (C.theme === 'dark' ? 0.028 : 0.018) + ')')
      sweep.addColorStop(1, 'rgba(' + palette.cool + ',0)')
      ctx.fillStyle = sweep
      ctx.fillRect(sx - 150, 0, 300, H)

      for (var r = 0; r < ribbons.length; r++) drawRibbon(ribbons[r], now)

      for (var w = 0; w < 3; w++) {
        ctx.beginPath()
        for (var x = 0; x <= W; x += 26) {
          var wy = H * (0.745 + w * 0.052) +
            Math.sin(x * 0.0062 + now * 0.00022 + w * 1.7) * (3 + w * 1.4) +
            Math.sin(x * 0.013 - now * 0.00014 + w) * 1.6
          if (x === 0) ctx.moveTo(x, wy)
          else ctx.lineTo(x, wy)
        }
        ctx.strokeStyle = 'rgba(' + (w === 1 ? palette.warm : palette.cool) + ',' +
          (C.theme === 'dark' ? 0.050 : 0.032) + ')'
        ctx.lineWidth = 0.8
        ctx.stroke()
      }

      for (var c = 0; c < columns.length; c++) {
        var col = columns[c]
        var cy = ((col.y + now * col.sp) % 1.2) * H - col.len
        ctx.fillStyle = 'rgba(' + palette.dim + ',' + (C.theme === 'dark' ? 0.035 : 0.022) + ')'
        ctx.fillRect(Math.round(col.x * W), cy, 1, col.len)
      }

      for (var m = 0; m < motes.length; m++) {
        var dot = motes[m]
        var mx = dot.x + Math.sin(now * dot.sp + dot.ph) * dot.ax
        var my = dot.y + Math.cos(now * dot.sp * 0.83 + dot.ph) * dot.ay
        if (still) { mx = dot.x; my = dot.y }
        var nx = (mx / W - 0.5) * 2
        var ny = (my / H - 0.45) * 2
        var dist = Math.sqrt(nx * nx * 1.18 + ny * ny)
        var centerFade = Math.min(1, Math.max(0.18, dist * 1.32))
        var twinkle = 0.62 + 0.38 * Math.sin(now * dot.tw + dot.ph)
        var alpha = (0.045 + dot.z * 0.16) * centerFade * twinkle
        var rgbDot = dot.warm ? palette.warm : palette.cool
        ctx.beginPath()
        ctx.fillStyle = 'rgba(' + rgbDot + ',' + alpha.toFixed(3) + ')'
        ctx.arc(mx, my, dot.r * dot.z, 0, Math.PI * 2)
        ctx.fill()
        if (dot.r > 1.15) {
          ctx.beginPath()
          ctx.fillStyle = 'rgba(' + rgbDot + ',' + (alpha * 0.12).toFixed(3) + ')'
          ctx.arc(mx, my, dot.r * 4.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    function frame() {
      if (!fieldHandle) return
      draw(fieldNow(), false)
      frames++
      if (fieldHandle) fieldHandle.frames = frames
      raf = requestAnimationFrame(frame)
    }

    function onResize() {
      resize()
      draw(fieldNow(), true)
    }
    function onVisibility() {
      if (document.hidden) {
        if (raf) { window.cancelAnimationFrame(raf); raf = 0 }
      } else if (!reduced && !raf) {
        raf = requestAnimationFrame(frame)
      }
    }

    fieldHandle = {
      frames: 0,
      width: function () { return W },
      height: function () { return H },
      draw: function (ms, still) { draw(ms || 0, !!still) },
      stop: function () {
        if (raf) { window.cancelAnimationFrame(raf); raf = 0 }
        window.removeEventListener('resize', onResize)
        document.removeEventListener('visibilitychange', onVisibility)
      }
    }
    root.cinematicField = fieldHandle
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    resize()
    draw(0, true)
    if (!reduced) raf = requestAnimationFrame(frame)
  }

  function run() {
    return Promise.resolve()
      
      .then(function () { if (finished) return; return wait(820) })
      .then(function () { if (finished) return;
        ui.blackInner.classList.add('dsu-in')
        
        return wait(240)
      })
      .then(function () { if (finished) return;
        ui.blackEn.classList.add('dsu-tighten')
        return wait(880)
      })
      .then(function () { if (finished) return;
        ui.sweep.classList.add('dsu-go')
        return wait(760)
      })
      
      .then(function () { if (finished) return;
        ui.blackInner.classList.add('dsu-out')
        
        ui.wash.style.transition = 'opacity ' + ms(220) + 'ms linear'
        ui.wash.style.opacity = '1'
        return wait(260)
      })
      .then(function () { if (finished) return;
        ui.plate.style.transition = 'opacity ' + ms(900) + 'ms ease'
        ui.plate.style.opacity = '1'
        ui.watermark.style.transition = 'opacity ' + ms(1100) + 'ms ease'
        ui.watermark.style.opacity = '1'
        ui.wash.style.transition = 'opacity ' + ms(720) + 'ms cubic-bezier(.2,.9,.2,1)'
        ui.wash.style.opacity = '0'
        ui.black.style.transition = 'opacity ' + ms(720) + 'ms ease'
        ui.black.style.opacity = '0'
        
        ui.sheen.classList.add('dsu-go')
        return wait(760)
      })
      
      .then(function () { if (finished) return;
        ui.brand.classList.add('dsu-in')
        ui.foot.classList.add('dsu-in')
        ui.stepcount.classList.add('dsu-in')
        ui.idline.classList.add('dsu-in')
        ui.fact1.classList.add('dsu-in')
        ui.fact2.classList.add('dsu-in')
        ui.frame.classList.add('dsu-in')
        ui.slats.classList.add('dsu-in')
        ui.meta.classList.add('dsu-in')
        ui.vignette.classList.add('dsu-in')
        ui.voice.classList.add('dsu-in')
        ui.atmo.classList.add('dsu-in')
        ui.field.classList.add('dsu-in')
        ui.beams.classList.add('dsu-in')
        ui.floor.classList.add('dsu-in')
        ui.checks.classList.add('dsu-in')
        ui.trace.classList.add('dsu-in')
        root.classList.add('dsu-cam')
        setChecks(0)
        setProgress(0.12)
        setStepCount(0, 'BOOT')
        setSlats(0)
        
        setSubtitle(
          'ShineAI 开场演出 · 按 Esc 可随时跳过',
          'CINEMATIC OPENING · ESC TO SKIP'
        )
        if (C.allowSkip) ui.skip.classList.add('dsu-in')
        return wait(700)
      })
      .then(function () { if (finished) return; ui.black.style.display = 'none'; sweep() })
      
      .then(function () { if (finished) return; return stepLoop() })
      
      .then(function () { if (finished) return; return finale() })
      .catch(function (err) {
        try { console.warn('[ShineAI opening] 动画异常，直接揭幕：', err) } catch (e2) {}
        return finish()
      })
  }

  function stepLoop() {
    var chain = Promise.resolve()
    STEPS.forEach(function (step, i) {
      chain = chain.then(function () { if (finished) return;
        if (finished) return
        var n = i + 1
        setStepCount(n, step.badge)
        setSlats(n)
        setChecks(n)
        setProgress(step.progress)
        setSubtitle(step.log, step.logEn)

        var spoke = Promise.resolve(0)

        ui.status.classList.toggle('dsu-zhline', true)
        
        ui.status.classList.remove('dsu-in')
        ui.subEn.classList.remove('dsu-in')
        void ui.status.offsetWidth
        
        var slots = typeIn(ui.statusZh, step.zh, 46, 'decode')
        slots = slots.concat(typeIn(ui.subEn, step.en, 13, 'decode'))
        startDecode(slots)
        ui.caret.classList.toggle('dsu-on', !!step.action && step.action !== 'auto')
        requestAnimationFrame(function () {
          if (finished) return
          ui.status.classList.add('dsu-in')
          ui.subEn.classList.add('dsu-in')
        })
        ui.rule.classList.add('dsu-in')

        if (step.assembleLogo) assembleLogo()
        if (step.reticle) {
          
          ui.logo.classList.remove('dsu-in')
          ui.dots.hidden = true
          ui.reticle.classList.add('dsu-in')
          
          ui.reticle.classList.remove('dsu-lock')
          void ui.reticle.offsetWidth
          ui.reticle.classList.add('dsu-lock')
          sweep()
        }
        if (step.hex) startHex()

        function holdFor(spoken) {
          var target = Math.max(ms(step.hold), (spoken || 0) + ms(240))
          return wait(Math.max(0, target - (spoken || 0)))
        }

        if (step.hex) {
          return spoke.then(holdFor).then(function () { if (finished) return; stopHex() })
        }
        return spoke.then(holdFor)
      })
    })
    return chain
  }

  function assembleLogo() {
    ui.logo.classList.add('dsu-in')
    ui.dots.hidden = false
    var path = ui.logo.querySelector('path')
    if (path && typeof path.getTotalLength === 'function') {
      try {
        var len = path.getTotalLength()
        path.style.fill = 'none'
        path.style.stroke = 'currentColor'
        path.style.strokeWidth = '1.1'
        path.style.strokeDasharray = len
        path.style.strokeDashoffset = len
        
        path.animate(
          [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
          { duration: ms(1400), easing: 'cubic-bezier(.55,.06,.24,1)', fill: 'forwards' }
        )
        setTimeout(function () {
          path.style.transition = 'fill ' + ms(420) + 'ms ease, stroke-width ' + ms(420) + 'ms ease'
          path.style.fill = ''
          path.style.strokeWidth = '0'
        }, ms(1450))
      } catch (err) {  }
    }
    return wait(300)
  }

  function finale() {
    if (finished) return Promise.resolve()
    setStepCount(6, 'WELCOME')
    setSlats(6)
    setProgress(1)

    setSubtitle('欢迎回到 ShineAI', 'WELCOME TO YOUR LOCAL WORKSPACE')

    var welcome = Promise.resolve(0)

    ui.status.classList.remove('dsu-in')
    ui.subEn.classList.remove('dsu-in')
    ui.rule.classList.remove('dsu-in')
    ui.reticle.classList.remove('dsu-in')
    stopHex()
    
    ui.center.classList.add('dsu-off')
    ui.dots.hidden = true

    return wait(360)
      .then(function () { if (finished) return;
        ui.welcome.classList.add('dsu-in')
        ui.idline.classList.remove('dsu-in')
        ui.fact1.classList.remove('dsu-in')
        ui.fact2.classList.remove('dsu-in')
        ui.checks.classList.remove('dsu-in')
        ui.trace.classList.remove('dsu-in')
        return wait(420)
      })
      .then(function () { if (finished) return;
        
        var targets = [ui.w1, ui.w2, ui.w4]
        targets.forEach(function (t) {
          t.classList.add('dsu-glitch')
          t.setAttribute('data-text', t.textContent)
        })
        ui.w2.classList.add('dsu-glitch-box')   
        void ui.welcome.offsetWidth
        targets.forEach(function (t) { t.classList.add('dsu-on') })
        
        ui.tear.classList.add('dsu-go')
        return wait(640)
      })
      
      .then(function () { if (finished) return;
        root.classList.add('dsu-peak')
        setTimeout(function () { root.classList.remove('dsu-peak') }, Math.max(600, ms(1200)))
        ui.bloom.classList.add('dsu-go')
        ui.streak.classList.add('dsu-go')
        return wait(430)
      })
      
      .then(function () { if (finished) return;
        ui.flash.style.transition = 'opacity ' + ms(70) + 'ms linear'
        ui.flash.style.opacity = '0.32'
        return wait(90)
      })
      .then(function () { if (finished) return;
        ui.flash.style.transition = 'opacity ' + ms(340) + 'ms cubic-bezier(0.4, 0, 0.2, 1)'
        ui.flash.style.opacity = '0'
        return wait(320)
      })
      
      .then(function () { if (finished) return; return welcome })
      
      .then(function () { if (finished) return;
        root.classList.add('dsu-handoff')

        return wait(780)
      })
      .then(function () { if (finished) return; return finish() })
  }

  function dispose() {
    if(disposed)return;
    finished=true;skipped=true;
    releaseAll();stopHex();stopField();
    disposed=true;
    for(const id of timeouts)window.clearTimeout(id);
    for(const id of intervals)window.clearInterval(id);
    for(const id of frames)window.cancelAnimationFrame(id);
    timeouts.clear();intervals.clear();frames.clear();
    for(const element of [root,...root.querySelectorAll('*')])for(const animation of element.getAnimations())animation.cancel();
    delete root.cinematicField;
  }
  function finish() {
    if(disposed)return;
    dispose();onFinish();
  }
  startField();
  setProgress(.05);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){
    ui.black.style.display='none';ui.plate.style.opacity='1';ui.welcome.classList.add('dsu-in');
    setTimeout(finish,1800);
  }else run();
  return dispose;
}
