/* <agent-stack> — the five agents assembling into one dashboard.
 *
 * Scroll-scrubbed: as the section travels through the viewport, five panels
 * fly in one at a time and lock into a dashboard grid, then the links between
 * them draw in. Same mechanic as the food-assembly reels, except the "dish"
 * is the Gen AI Operating System and the "ingredients" are the five agents
 * named in the company profile.
 *
 * Pure inline SVG — no image assets, no dependencies, no build step. Vector
 * means the panel labels render as real crisp text at any size, so the
 * animation explains the product instead of only decorating it.
 *
 * Attrs: tint (hex accent), panel (hex panel fill)
 */
(function () {
  if (customElements.get('agent-stack')) return;

  var NS = 'http://www.w3.org/2000/svg';
  var VB_W = 600, VB_H = 380;

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  // easeOutBack — the small overshoot is what makes a part feel like it "lands"
  var land = function (t) {
    var c1 = 1.20, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* Panel geometry — a real dashboard grid, not a scatter.
   * from[] is where each panel flies in from. */
  var PANELS = [
    { id: 'reception',  label: 'Reception',  x: 8,   y: 8,   w: 356, h: 176, from: [-150, -60] },
    { id: 'sales',      label: 'Sales',      x: 372, y: 8,   w: 220, h: 176, from: [170, -70] },
    { id: 'operations', label: 'Operations', x: 8,   y: 192, w: 185, h: 180, from: [-140, 120] },
    { id: 'marketing',  label: 'Marketing',  x: 201, y: 192, w: 185, h: 180, from: [0, 165] },
    { id: 'finance',    label: 'Finance',    x: 394, y: 192, w: 198, h: 180, from: [160, 130] }
  ];

  /* Links drawn between panel centres once everything has landed —
   * "shared memory so nothing gets repeated back to your customer". */
  var LINKS = [[0, 1], [0, 2], [0, 3], [1, 4], [3, 4], [2, 3]];

  var Stack = function () { return Reflect.construct(HTMLElement, [], Stack); };
  Stack.prototype = Object.create(HTMLElement.prototype);
  Stack.prototype.constructor = Stack;
  Object.setPrototypeOf(Stack, HTMLElement);

  Stack.prototype.connectedCallback = function () {
    if (this._built) return;
    this._built = true;

    var host = this;
    var TINT = host.getAttribute('tint') || '#2C77E7';
    var PALE = host.getAttribute('pale') || '#9EC1FF';
    var FILL = host.getAttribute('panel') || '#0E1830';

    host.style.display = 'block';
    host.style.width = '100%';
    host.style.pointerEvents = 'none';

    var svg = el('svg', {
      viewBox: '0 0 ' + VB_W + ' ' + VB_H,
      width: '100%',
      'aria-hidden': 'true',
      preserveAspectRatio: 'xMidYMid meet'
    });
    svg.style.cssText = 'display:block;width:100%;height:auto;overflow:visible';
    host.appendChild(svg);

    var defs = el('defs', {});
    // soft glow used on accents
    var blur = el('filter', { id: 'as-glow', x: '-60%', y: '-60%', width: '220%', height: '220%' });
    blur.appendChild(el('feGaussianBlur', { stdDeviation: '3.4', result: 'b' }));
    var mg = el('feMerge', {});
    mg.appendChild(el('feMergeNode', { in: 'b' }));
    mg.appendChild(el('feMergeNode', { in: 'SourceGraphic' }));
    blur.appendChild(mg);
    defs.appendChild(blur);
    // fill under the finance line graph
    var grad = el('linearGradient', { id: 'as-area', x1: '0', y1: '0', x2: '0', y2: '1' });
    grad.appendChild(el('stop', { offset: '0', 'stop-color': TINT, 'stop-opacity': '.42' }));
    grad.appendChild(el('stop', { offset: '1', 'stop-color': TINT, 'stop-opacity': '0' }));
    defs.appendChild(grad);
    svg.appendChild(defs);

    var linkLayer = el('g', {});
    svg.appendChild(linkLayer);

    /* ---------- links ---------- */
    var linkEls = [];
    LINKS.forEach(function (pair) {
      var a = PANELS[pair[0]], b = PANELS[pair[1]];
      var l = el('line', {
        x1: a.x + a.w / 2, y1: a.y + a.h / 2,
        x2: b.x + b.w / 2, y2: b.y + b.h / 2,
        stroke: TINT, 'stroke-width': '1', 'stroke-opacity': '0'
      });
      linkLayer.appendChild(l);
      linkEls.push(l);
    });

    /* ---------- panel bodies ---------- */
    function card(p) {
      var g = el('g', {});
      g.appendChild(el('rect', {
        x: p.x, y: p.y, width: p.w, height: p.h, rx: 16,
        fill: FILL, stroke: TINT, 'stroke-width': '1.1', 'stroke-opacity': '.55'
      }));
      // top hairline highlight, matches the glass cards elsewhere on the page
      g.appendChild(el('path', {
        d: 'M' + (p.x + 16) + ' ' + (p.y + 1) + ' H' + (p.x + p.w - 16),
        stroke: '#FFFFFF', 'stroke-opacity': '.16', 'stroke-width': '1'
      }));
      var t = el('text', {
        x: p.x + 16, y: p.y + 26,
        fill: '#FFFFFF', 'fill-opacity': '.72',
        'font-family': "Barlow, system-ui, sans-serif",
        'font-size': '11', 'font-weight': '500', 'letter-spacing': '2.2'
      });
      t.textContent = p.label.toUpperCase();
      g.appendChild(t);
      return g;
    }

    function dot(cx, cy, r, o) {
      return el('circle', { cx: cx, cy: cy, r: r, fill: PALE, 'fill-opacity': o == null ? 1 : o });
    }

    // 1 · Reception — a waveform ring, plus queued messages
    function reception(p, g) {
      var cx = p.x + 74, cy = p.y + 104;
      [22, 34, 46].forEach(function (r, i) {
        g.appendChild(el('circle', {
          cx: cx, cy: cy, r: r, fill: 'none',
          stroke: TINT, 'stroke-width': i === 0 ? '2' : '1',
          'stroke-opacity': String(0.75 - i * 0.22)
        }));
      });
      var bars = el('g', { filter: 'url(#as-glow)' });
      for (var i = 0; i < 9; i++) {
        var h = 6 + Math.abs(Math.sin(i * 1.1)) * 20;
        bars.appendChild(el('rect', {
          x: cx - 20 + i * 5, y: cy - h / 2, width: 2.4, height: h, rx: 1.2,
          fill: PALE, 'fill-opacity': '.9'
        }));
      }
      g.appendChild(bars);
      for (var j = 0; j < 3; j++) {
        g.appendChild(el('rect', {
          x: p.x + 150, y: p.y + 62 + j * 30, width: 180 - j * 34, height: 16, rx: 8,
          fill: TINT, 'fill-opacity': String(0.4 - j * 0.1)
        }));
      }
    }

    // 2 · Sales — a four-stage pipeline over a rising bar chart
    function sales(p, g) {
      var y = p.y + 74, x0 = p.x + 26, gap = 48;
      g.appendChild(el('line', {
        x1: x0, y1: y, x2: x0 + gap * 3, y2: y,
        stroke: TINT, 'stroke-width': '1.4', 'stroke-opacity': '.6'
      }));
      for (var i = 0; i < 4; i++) {
        g.appendChild(el('circle', {
          cx: x0 + i * gap, cy: y, r: i === 3 ? 8 : 6,
          fill: i === 3 ? TINT : FILL, stroke: TINT, 'stroke-width': '1.6'
        }));
      }
      for (var b = 0; b < 5; b++) {
        var h = 10 + b * 9;
        g.appendChild(el('rect', {
          x: p.x + 26 + b * 30, y: p.y + 150 - h, width: 15, height: h, rx: 3,
          fill: PALE, 'fill-opacity': String(0.3 + b * 0.13)
        }));
      }
    }

    // 3 · Operations — a task grid with a progress ring
    function operations(p, g) {
      for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
          var on = (r + c) % 2 === 0;
          g.appendChild(el('rect', {
            x: p.x + 22 + c * 32, y: p.y + 54 + r * 32, width: 24, height: 24, rx: 6,
            fill: on ? TINT : 'none', 'fill-opacity': on ? '.55' : '0',
            stroke: TINT, 'stroke-width': '1', 'stroke-opacity': '.5'
          }));
        }
      }
      var cx = p.x + 143, cy = p.y + 132, rr = 20;
      g.appendChild(el('circle', {
        cx: cx, cy: cy, r: rr, fill: 'none',
        stroke: '#FFFFFF', 'stroke-opacity': '.14', 'stroke-width': '4'
      }));
      g.appendChild(el('circle', {
        cx: cx, cy: cy, r: rr, fill: 'none', stroke: TINT, 'stroke-width': '4',
        'stroke-linecap': 'round',
        'stroke-dasharray': (2 * Math.PI * rr * 0.68) + ' ' + (2 * Math.PI * rr),
        transform: 'rotate(-90 ' + cx + ' ' + cy + ')'
      }));
    }

    // 4 · Marketing — one source broadcasting outward
    function marketing(p, g) {
      var cx = p.x + 52, cy = p.y + 106;
      g.appendChild(el('circle', { cx: cx, cy: cy, r: 7, fill: TINT, filter: 'url(#as-glow)' }));
      [26, 44, 62].forEach(function (r, i) {
        g.appendChild(el('path', {
          d: 'M' + cx + ' ' + (cy - r) + ' A' + r + ' ' + r + ' 0 0 1 ' + cx + ' ' + (cy + r),
          fill: 'none', stroke: TINT, 'stroke-width': '1.6',
          'stroke-opacity': String(0.7 - i * 0.2), 'stroke-linecap': 'round'
        }));
      });
      [[46, -34], [66, -8], [58, 26], [40, 44]].forEach(function (d, i) {
        g.appendChild(dot(cx + d[0] + 34, cy + d[1], 3.2, 0.55 + i * 0.1));
      });
    }

    // 5 · Finance — margin trending up, plus a split
    function finance(p, g) {
      var pts = [[0, 62], [34, 48], [68, 54], [102, 30], [136, 12]];
      var ox = p.x + 22, oy = p.y + 72;
      var d = pts.map(function (q, i) { return (i ? 'L' : 'M') + (ox + q[0]) + ' ' + (oy + q[1]); }).join(' ');
      g.appendChild(el('path', {
        d: d + ' L' + (ox + 136) + ' ' + (oy + 78) + ' L' + ox + ' ' + (oy + 78) + ' Z',
        fill: 'url(#as-area)'
      }));
      g.appendChild(el('path', {
        d: d, fill: 'none', stroke: TINT, 'stroke-width': '2.4',
        'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: 'url(#as-glow)'
      }));
      g.appendChild(dot(ox + 136, oy + 12, 4.2));
      var cx = p.x + 100, cy = p.y + 146, rr = 15;
      g.appendChild(el('circle', {
        cx: cx, cy: cy, r: rr, fill: 'none',
        stroke: '#FFFFFF', 'stroke-opacity': '.14', 'stroke-width': '6'
      }));
      g.appendChild(el('circle', {
        cx: cx, cy: cy, r: rr, fill: 'none', stroke: PALE, 'stroke-width': '6',
        'stroke-dasharray': (2 * Math.PI * rr * 0.58) + ' ' + (2 * Math.PI * rr),
        transform: 'rotate(-120 ' + cx + ' ' + cy + ')'
      }));
    }

    var DRAW = { reception: reception, sales: sales, operations: operations, marketing: marketing, finance: finance };

    var groups = PANELS.map(function (p) {
      var g = el('g', {});
      var body = card(p);
      g.appendChild(body);
      DRAW[p.id](p, g);
      g.setAttribute('opacity', '0');
      svg.appendChild(g);
      return g;
    });

    /* ---------- scroll drive ---------- */
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var visible = false;
    var raf = 0;
    var current = -1;

    function apply(progress) {
      if (progress === current) return;
      current = progress;

      PANELS.forEach(function (p, i) {
        // staggered: each part waits its turn, exactly like the reels
        var t = clamp((progress - i * 0.14) / 0.36, 0, 1);
        var e = land(t);
        var cx = p.x + p.w / 2, cy = p.y + p.h / 2;
        var tx = p.from[0] * (1 - e);
        var ty = p.from[1] * (1 - e);
        var s = 0.84 + 0.16 * e;
        groups[i].setAttribute(
          'transform',
          'translate(' + tx.toFixed(2) + ' ' + ty.toFixed(2) + ') ' +
          'translate(' + cx + ' ' + cy + ') scale(' + s.toFixed(4) + ') translate(' + (-cx) + ' ' + (-cy) + ')'
        );
        groups[i].setAttribute('opacity', clamp(t * 1.6, 0, 1).toFixed(3));
      });

      // links draw only once the parts are home
      var lp = clamp((progress - 0.62) / 0.3, 0, 1);
      var lo = easeOut(lp) * 0.32;
      linkEls.forEach(function (l) { l.setAttribute('stroke-opacity', lo.toFixed(3)); });
    }

    function measure() {
      var host_rect = host.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      /* Starts once the block is genuinely on screen and finishes as it reaches
       * the top, so the whole assembly happens in front of the reader rather
       * than below the fold. */
      var p = (vh * 0.72 - host_rect.top) / (vh * 0.78);
      apply(clamp(p, 0, 1));
    }

    function tick() {
      raf = 0;
      if (visible) measure();
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    if (reduce) {
      apply(1);
    } else {
      apply(0);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          visible = es[0].isIntersecting;
          if (visible) measure();
        }, { rootMargin: '200px 0px' }).observe(host);
      } else {
        visible = true;
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      measure();
      setTimeout(measure, 300);
    }
  };

  customElements.define('agent-stack', Stack);
  try {
    window['agent-stack'] = Stack;
    window.agentStack = Stack;
  } catch (e) {}
})();
