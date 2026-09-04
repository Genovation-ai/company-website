/* <cine-scene mode="…"> — canvas motion layer for Genovation.
   Fills its parent. Scroll-reactive, pointer-reactive, DPI-aware, pauses off-screen.
   Modes: leak · route · assemble · converge · broadcast · workforce
   Attrs: mode, tint (hex), density (0.4–2), speed (0.4–2), opacity (0–1)
   Pure canvas 2D — no CDN, no WebGL context loss, runs on every phone. */
(function () {
  if (customElements.get('cine-scene')) return;

  var TAU = Math.PI * 2;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var ease = function (t) { return t * t * (3 - 2 * t); };

  function hexRGB(hex) {
    var n = parseInt(String(hex || '#ffffff').replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  var Scene = function () {
    return Reflect.construct(HTMLElement, [], Scene);
  };
  Scene.prototype = Object.create(HTMLElement.prototype);
  Scene.prototype.constructor = Scene;
  Object.setPrototypeOf(Scene, HTMLElement);

  Scene.prototype.connectedCallback = function () {
    if (this._built) return;
    this._built = true;
    var host = this;

    var mode = host.getAttribute('mode') || 'leak';
    var rgb = hexRGB(host.getAttribute('tint') || '#ffffff');
    var density = parseFloat(host.getAttribute('density')) || 1;
    var speed = parseFloat(host.getAttribute('speed')) || 1;
    var alpha = host.getAttribute('opacity') != null ? parseFloat(host.getAttribute('opacity')) : 1;

    host.style.display = 'block';
    if (!host.style.position) host.style.position = 'absolute';
    // fill the nearest positioned ancestor unless the author sized us explicitly
    if (!host.style.width && !host.style.height && !host.style.inset) {
      host.style.inset = '0';
      host.style.width = '100%';
      host.style.height = '100%';
    }
    host.style.pointerEvents = 'none';

    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var mobile = window.matchMedia('(max-width: 760px)').matches;
    var W = 0, H = 0, dpr = 1;
    var scroll = 0, scrollSmooth = 0;
    var mx = 0.5, my = 0.5, pmx = 0.5, pmy = 0.5;
    var t0 = performance.now();
    var reveal = 0;

    function resize() {
      var r = host.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width));
      var h = Math.max(1, Math.round(r.height));
      var d = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
      var cw = Math.round(w * d), ch = Math.round(h * d);
      // nothing actually changed — don't re-dirty layout (but never skip the first build)
      if (inited && cw === canvas.width && ch === canvas.height) return;
      W = w; H = h; dpr = d;
      canvas.width = cw;
      canvas.height = ch;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      inited = true;
      build();
    }

    /* ---------- particle sets, per mode ---------- */
    var P = [];          // primary particles
    var NODES = [];       // fixed points (holes, agents, cities)
    var count = 0;
    var inited = false;

    function rnd(a, b) { return a + Math.random() * (b - a); }

    function build() {
      P.length = 0; NODES.length = 0;
      var base = mobile ? 0.55 : 1;
      if (mode === 'leak') {
        count = Math.round(340 * density * base);
        // five holes across the vessel line
        for (var h = 0; h < 5; h++) {
          NODES.push({ x: (0.16 + h * 0.17) * W, y: H * 0.42 + Math.sin(h * 1.7) * H * 0.03, sealed: 0 });
        }
        for (var i = 0; i < count; i++) {
          var n = NODES[i % NODES.length];
          P.push({ hx: i % NODES.length, x: n.x, y: n.y, vx: rnd(-0.25, 0.25), vy: rnd(0.4, 1.5), r: rnd(0.7, 2.3), a: rnd(0.25, 0.85), life: Math.random() });
        }
      } else if (mode === 'route') {
        count = Math.round(110 * density * base);
        // a call travelling through four stations
        for (var s = 0; s < 4; s++) NODES.push({ x: (0.16 + s * 0.226) * W, y: H * (0.5 + Math.sin(s * 1.2) * 0.12) });
        for (var j = 0; j < count; j++) P.push({ t: Math.random(), sp: rnd(0.04, 0.11), r: rnd(0.8, 2.4), a: rnd(0.2, 0.9), off: rnd(-14, 14) });
      } else if (mode === 'assemble') {
        count = Math.round(260 * density * base);
        // a grid that snaps into a dashboard
        var cols = mobile ? 9 : 15, rows = mobile ? 6 : 9;
        for (var c = 0; c < cols; c++) for (var r2 = 0; r2 < rows; r2++) {
          NODES.push({ x: (0.14 + (c / (cols - 1)) * 0.72) * W, y: (0.2 + (r2 / (rows - 1)) * 0.6) * H });
        }
        for (var k = 0; k < NODES.length; k++) {
          var tgt = NODES[k];
          P.push({ tx: tgt.x, ty: tgt.y, x: rnd(0, W), y: rnd(0, H), r: rnd(0.9, 2.1), a: rnd(0.25, 0.8), d: Math.random() });
        }
        count = P.length;
      } else if (mode === 'converge') {
        count = Math.round(200 * density * base);
        NODES.push({ x: W * 0.5, y: H * 0.5 });
        for (var m = 0; m < count; m++) {
          var ang = Math.random() * TAU;
          var rad = rnd(0.5, 1.25) * Math.max(W, H) * 0.6;
          P.push({ ang: ang, rad: rad, rad0: rad, sp: rnd(0.2, 0.75), r: rnd(0.7, 2.2), a: rnd(0.2, 0.85), t: Math.random() });
        }
      } else if (mode === 'broadcast') {
        count = Math.round(150 * density * base);
        NODES.push({ x: W * 0.5, y: H * 0.62 });
        for (var b = 0; b < count; b++) {
          P.push({ ang: rnd(-2.5, -0.65), sp: rnd(0.25, 0.8), t: Math.random(), r: rnd(1, 3), a: rnd(0.25, 0.9), spin: rnd(-0.02, 0.02) });
        }
      } else { // workforce — five nodes sharing a memory ring
        count = Math.round(180 * density * base);
        for (var w = 0; w < 5; w++) {
          var aa = -Math.PI / 2 + (w / 5) * TAU;
          NODES.push({ x: W * 0.5 + Math.cos(aa) * Math.min(W, H) * 0.3, y: H * 0.5 + Math.sin(aa) * Math.min(W, H) * 0.3 });
        }
        for (var q = 0; q < count; q++) {
          P.push({ from: q % 5, to: (q + 1 + Math.floor(Math.random() * 3)) % 5, t: Math.random(), sp: rnd(0.1, 0.3), r: rnd(0.8, 2.2), a: rnd(0.2, 0.8) });
        }
      }
    }

    /* ---------- draw helpers ---------- */
    function dot(x, y, r, a) {
      ctx.globalAlpha = a * alpha * reveal;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
    function line(x1, y1, x2, y2, a, w) {
      ctx.globalAlpha = a * alpha * reveal;
      ctx.lineWidth = w || 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    /* ---------- the frame ---------- */
    function frame(now) {
      if (!NODES.length) { build(); return; }
      var dt = Math.min(0.05, (now - t0) / 1000);
      t0 = now;
      var T = now / 1000;
      reveal = clamp(reveal + dt * 0.7, 0, 1);
      scrollSmooth = lerp(scrollSmooth, scroll, 0.08);
      pmx = lerp(pmx, mx, 0.06);
      pmy = lerp(pmy, my, 0.06);

      ctx.clearRect(0, 0, W, H);
      var fill = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
      ctx.fillStyle = fill;
      ctx.strokeStyle = fill;
      ctx.globalCompositeOperation = 'lighter';

      var px = (pmx - 0.5) * 26, py = (pmy - 0.5) * 18;

      if (mode === 'leak') {
        // holes seal progressively with scroll
        for (var i = 0; i < NODES.length; i++) {
          var n = NODES[i];
          var want = clamp((scrollSmooth - i * 0.11) * 5, 0, 1);
          n.sealed = lerp(n.sealed, ease(want), 0.06);
          var glow = 0.1 + 0.5 * (1 - n.sealed);
          dot(n.x + px * 0.4, n.y + py * 0.4, 1.6 + 2.4 * (1 - n.sealed), glow);
          if (n.sealed > 0.02) {
            // the plug: a soft closing bracket
            ctx.globalAlpha = n.sealed * 0.5 * alpha * reveal;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(n.x + px * 0.4, n.y + py * 0.4, 6 + 4 * (1 - n.sealed), 0, TAU * n.sealed);
            ctx.stroke();
          }
        }
        // the vessel line
        ctx.globalAlpha = 0.14 * alpha * reveal;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var vx = 0; vx <= W; vx += 8) {
          var vy = H * 0.42 + Math.sin(vx / W * 5.1) * H * 0.03 + Math.sin(T * 0.5 + vx / W * 2) * 2;
          if (vx === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
        }
        ctx.stroke();

        for (var p = 0; p < P.length; p++) {
          var d = P[p], hn = NODES[d.hx];
          var esc = 1 - hn.sealed;
          d.vy += dt * 26 * speed * esc;
          d.x += d.vx * speed;
          d.y += d.vy * speed;
          d.life += dt * 0.5;
          // rising column once sealed: value coming back up
          if (hn.sealed > 0.5) {
            d.y -= dt * 30 * speed * (hn.sealed - 0.5) * 2;
            d.x += Math.sin(T * 0.8 + p) * 0.12;
          }
          if (d.y > H + 12 || d.y < -12 || d.life > 3.2) {
            d.x = hn.x + rnd(-2, 2); d.y = hn.y; d.vy = rnd(0.3, 1.2); d.vx = rnd(-0.25, 0.25); d.life = 0;
          }
          var fade = clamp(1 - Math.abs(d.y - hn.y) / (H * 0.7), 0.05, 1);
          dot(d.x + px * 0.5, d.y, d.r, d.a * fade * (0.25 + esc * 0.75));
        }

      } else if (mode === 'route') {
        for (var s = 0; s < NODES.length - 1; s++) {
          line(NODES[s].x + px, NODES[s].y + py, NODES[s + 1].x + px, NODES[s + 1].y + py, 0.1, 1);
        }
        for (var s2 = 0; s2 < NODES.length; s2++) {
          var lit = clamp((scrollSmooth - s2 * 0.14) * 6, 0, 1);
          var nn = NODES[s2];
          dot(nn.x + px, nn.y + py, 2.4 + 3.4 * lit, 0.2 + 0.6 * lit);
          ctx.globalAlpha = (0.1 + 0.28 * lit) * alpha * reveal;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(nn.x + px, nn.y + py, 12 + 9 * Math.sin(T * 1.4 + s2), 0, TAU);
          ctx.stroke();
        }
        for (var r3 = 0; r3 < P.length; r3++) {
          var q2 = P[r3];
          q2.t += dt * q2.sp * speed;
          if (q2.t > 1) q2.t -= 1;
          var seg = q2.t * (NODES.length - 1);
          var si = Math.floor(seg), sf = seg - si;
          var A = NODES[Math.min(si, NODES.length - 1)], B = NODES[Math.min(si + 1, NODES.length - 1)];
          var x = lerp(A.x, B.x, sf) + px, y = lerp(A.y, B.y, sf) + py + q2.off * (1 - Math.abs(sf - 0.5) * 2) * 0.5;
          dot(x, y, q2.r, q2.a * (0.35 + 0.65 * Math.sin(q2.t * Math.PI)));
        }

      } else if (mode === 'assemble') {
        var snap = ease(clamp(scrollSmooth * 1.5, 0, 1));
        for (var a2 = 0; a2 < P.length; a2++) {
          var e = P[a2];
          var wob = Math.sin(T * 0.6 + e.d * 9) * (1 - snap) * 22;
          e.x = lerp(e.x, e.tx + wob + px, 0.02 + 0.05 * snap);
          e.y = lerp(e.y, e.ty + wob * 0.6 + py, 0.02 + 0.05 * snap);
          dot(e.x, e.y, e.r * (0.6 + 0.4 * snap), e.a * (0.2 + 0.7 * snap));
        }
        // panel edges draw in once snapped
        if (snap > 0.45) {
          var g = (snap - 0.45) / 0.55;
          ctx.globalAlpha = g * 0.16 * alpha * reveal;
          ctx.lineWidth = 1;
          ctx.strokeRect(W * 0.14 + px, H * 0.2 + py, W * 0.72, H * 0.6);
          ctx.beginPath();
          ctx.moveTo(W * 0.14 + px, H * 0.32 + py); ctx.lineTo(W * 0.86 + px, H * 0.32 + py);
          ctx.moveTo(W * 0.42 + px, H * 0.32 + py); ctx.lineTo(W * 0.42 + px, H * 0.8 + py);
          ctx.stroke();
        }

      } else if (mode === 'converge') {
        var cx = NODES[0].x + px, cy = NODES[0].y + py;
        for (var c2 = 0; c2 < P.length; c2++) {
          var f = P[c2];
          f.rad -= dt * f.sp * 90 * speed * (0.5 + scrollSmooth);
          f.ang += dt * 0.12 * speed;
          if (f.rad < 6) { f.rad = f.rad0; f.ang = Math.random() * TAU; }
          var fx = cx + Math.cos(f.ang) * f.rad, fy = cy + Math.sin(f.ang) * f.rad * 0.62;
          var near = 1 - clamp(f.rad / f.rad0, 0, 1);
          dot(fx, fy, f.r * (0.7 + near), f.a * (0.12 + near * 0.8));
          if (near > 0.72) {
            var tx2 = cx + Math.cos(f.ang) * Math.max(6, f.rad - 26);
            var ty2 = cy + Math.sin(f.ang) * Math.max(6, f.rad - 26) * 0.62;
            line(fx, fy, tx2, ty2, (near - 0.72) * 0.7, 0.8);
          }
        }
        ctx.globalAlpha = (0.3 + 0.25 * Math.sin(T * 1.6)) * alpha * reveal;
        ctx.beginPath(); ctx.arc(cx, cy, 3.6, 0, TAU); ctx.fill();
        ctx.globalAlpha = 0.18 * alpha * reveal;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, 16 + 10 * Math.sin(T * 1.1), 0, TAU); ctx.stroke();

      } else if (mode === 'broadcast') {
        var sx = NODES[0].x + px, sy = NODES[0].y + py;
        for (var b2 = 0; b2 < P.length; b2++) {
          var v = P[b2];
          v.t += dt * v.sp * speed * (0.55 + scrollSmooth * 0.8);
          if (v.t > 1) { v.t -= 1; v.ang = rnd(-2.5, -0.65); }
          var dist = v.t * Math.max(W, H) * 0.78;
          var bx = sx + Math.cos(v.ang) * dist;
          var by = sy + Math.sin(v.ang) * dist;
          var fadeB = Math.sin(v.t * Math.PI);
          // little frames rather than dots
          ctx.globalAlpha = v.a * fadeB * alpha * reveal;
          ctx.lineWidth = 1;
          var ss = v.r * 2.4;
          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(v.t * 3 * (v.spin > 0 ? 1 : -1));
          ctx.strokeRect(-ss / 2, -ss * 0.32, ss, ss * 0.64);
          ctx.restore();
        }
        ctx.globalAlpha = (0.35 + 0.3 * Math.sin(T * 2)) * alpha * reveal;
        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, TAU); ctx.fill();

      } else { // workforce
        for (var n2 = 0; n2 < NODES.length; n2++) {
          for (var n3 = n2 + 1; n3 < NODES.length; n3++) {
            line(NODES[n2].x + px, NODES[n2].y + py, NODES[n3].x + px, NODES[n3].y + py, 0.055, 1);
          }
        }
        for (var n4 = 0; n4 < NODES.length; n4++) {
          var lit2 = 0.35 + 0.4 * Math.sin(T * 1.2 + n4 * 1.3);
          dot(NODES[n4].x + px, NODES[n4].y + py, 3.2, 0.3 + lit2 * 0.4);
          ctx.globalAlpha = 0.12 * alpha * reveal;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(NODES[n4].x + px, NODES[n4].y + py, 13 + 7 * Math.sin(T * 1.5 + n4), 0, TAU);
          ctx.stroke();
        }
        for (var w2 = 0; w2 < P.length; w2++) {
          var u = P[w2];
          u.t += dt * u.sp * speed;
          if (u.t > 1) { u.t -= 1; u.from = u.to; u.to = (u.to + 1 + Math.floor(Math.random() * 3)) % 5; }
          var F = NODES[u.from], Tn = NODES[u.to];
          var ux = lerp(F.x, Tn.x, u.t) + px, uy = lerp(F.y, Tn.y, u.t) + py;
          dot(ux, uy, u.r, u.a * Math.sin(u.t * Math.PI));
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    /* ---------- loop, observers, listeners ---------- */
    var visible = true, raf = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      frame(now || performance.now());
    }

    function onScroll() {
      var r = host.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      scroll = clamp(1 - (r.top + r.height * 0.35) / vh, 0, 1);
    }
    function onMove(e) {
      mx = clamp(e.clientX / (window.innerWidth || 1), 0, 1);
      my = clamp(e.clientY / (window.innerHeight || 1), 0, 1);
    }

    this._onScroll = onScroll;
    this._onResize = resize;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize);
    if (!reduce && window.matchMedia('(pointer: fine)').matches) {
      this._onMove = onMove;
      window.addEventListener('mousemove', onMove, { passive: true });
    }
    if ('ResizeObserver' in window) {
      var self = this;
      // defer out of the callback, or mutating the canvas re-dirties layout in the same cycle
      this._ro = new ResizeObserver(function () {
        cancelAnimationFrame(self._roRaf);
        self._roRaf = requestAnimationFrame(resize);
      });
      this._ro.observe(host);
    }
    if ('IntersectionObserver' in window) {
      this._io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { visible = en.isIntersecting; });
      }, { rootMargin: '160px' });
      this._io.observe(host);
    }

    resize();
    onScroll();
    if (reduce) { reveal = 1; scrollSmooth = 0.5; frame(performance.now()); }
    else loop();

    this._stop = function () { cancelAnimationFrame(raf); };
  };

  Scene.prototype.disconnectedCallback = function () {
    if (this._onScroll) window.removeEventListener('scroll', this._onScroll);
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this._onMove) window.removeEventListener('mousemove', this._onMove);
    if (this._ro) this._ro.disconnect();
    if (this._roRaf) cancelAnimationFrame(this._roRaf);
    if (this._io) this._io.disconnect();
    if (this._stop) this._stop();
    this._built = false;
    this.innerHTML = '';
  };

  customElements.define('cine-scene', Scene);
})();
