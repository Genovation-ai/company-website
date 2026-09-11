/* <scrub-seq> — scroll-scrubbed image sequence.
 *
 * Scroll drives a film sequence frame by frame, the technique behind Apple's
 * product pages and the assembly reels: the viewer controls the footage
 * instead of watching it loop. Real frames, so it reads cinematic rather than
 * like vector motion graphics.
 *
 * Mounted on <body> is not required — it draws into its own canvas and is
 * driven by the scroll position of the nearest [data-scrub-track] ancestor.
 *
 * Attrs: base (path prefix), count (frame count), ext, pad (digits)
 */
(function () {
  'use strict';
  if (customElements.get('scrub-seq')) return;

  var Seq = function () { return Reflect.construct(HTMLElement, [], Seq); };
  Seq.prototype = Object.create(HTMLElement.prototype);
  Seq.prototype.constructor = Seq;
  Object.setPrototypeOf(Seq, HTMLElement);

  Seq.prototype.connectedCallback = function () {
    if (this._built) return;
    this._built = true;
    var host = this;

    var base = host.getAttribute('base') || '';
    var count = parseInt(host.getAttribute('count'), 10) || 0;
    var ext = host.getAttribute('ext') || '.webp';
    var pad = parseInt(host.getAttribute('pad'), 10) || 3;
    if (!base || !count) return;

    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    host.style.display = 'block';
    host.style.position = 'absolute';
    host.style.inset = '0';
    host.style.pointerEvents = 'none';

    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%';
    host.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var frames = new Array(count);
    var loaded = 0;
    var current = -1;
    var dpr = 1;

    function src(i) {
      var n = String(i + 1);
      while (n.length < pad) n = '0' + n;
      return base + n + ext;
    }

    function resize() {
      var r = host.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width));
      var h = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width === Math.round(w * dpr) && canvas.height === Math.round(h * dpr)) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      current = -1; // force redraw at the new size
    }

    // cover-fit draw, like object-fit: cover
    function draw(i) {
      var img = frames[i];
      if (!img || !img.complete || !img.naturalWidth) return;
      if (i === current) return;
      current = i;
      var cw = canvas.width, ch = canvas.height;
      var ir = img.naturalWidth / img.naturalHeight, cr = cw / ch;
      var dw, dh, dx, dy;
      if (ir > cr) { dh = ch; dw = ch * ir; dx = (cw - dw) / 2; dy = 0; }
      else { dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2; }
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    function nearestLoaded(i) {
      if (frames[i] && frames[i].complete && frames[i].naturalWidth) return i;
      for (var d = 1; d < count; d++) {
        if (frames[i - d] && frames[i - d].complete && frames[i - d].naturalWidth) return i - d;
        if (frames[i + d] && frames[i + d].complete && frames[i + d].naturalWidth) return i + d;
      }
      return -1;
    }

    /* Load the first frame immediately so the section is never empty, then the
     * rest in the background. */
    function load(i, onload) {
      if (frames[i]) return;
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () { loaded++; if (onload) onload(); };
      img.onerror = function () { loaded++; };
      img.src = src(i);
      frames[i] = img;
    }

    var started = false;
    function startLoading() {
      if (started) return;
      started = true;
      load(0, function () { resize(); draw(0); });
      load(count - 1);
      // fill in the rest, spread out so it never blocks interaction
      var i = 1;
      (function next() {
        var budget = 4;
        while (i < count - 1 && budget-- > 0) { load(i); i++; }
        if (i < count - 1) setTimeout(next, 60);
      })();
    }

    function track() {
      return host.closest('[data-scrub-track]') || host.parentElement;
    }

    function progress() {
      var t = track();
      if (!t) return 0;
      var r = t.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      var total = r.height - vh;      // scrollable distance inside the track
      if (total <= 0) return 0;
      var p = (-r.top) / total;
      return p < 0 ? 0 : p > 1 ? 1 : p;
    }

    // copy beats that hand off as the sequence advances
    var lines = null;
    function updateLines(p) {
      var t = track();
      if (!t) return;
      if (!lines) lines = Array.prototype.slice.call(t.querySelectorAll('[data-scrub-line]'));
      if (!lines.length) return;
      // each line owns an equal slice, with a short fade at the seams
      var n = lines.length;
      var active = Math.min(n - 1, Math.floor(p * n));
      lines.forEach(function (el, i) { el.style.opacity = i === active ? '1' : '0'; });
    }

    var ticking = false;
    function update() {
      ticking = false;
      resize();
      var p = reduce ? 1 : progress();
      var idx = Math.round(p * (count - 1));
      var use = nearestLoaded(idx);
      if (use >= 0) draw(use);
      updateLines(p);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { startLoading(); onScroll(); }
      }, { rootMargin: '300px 0px' }).observe(host);
    } else {
      startLoading();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    setTimeout(function () { startLoading(); onScroll(); }, 400);
  };

  customElements.define('scrub-seq', Seq);
})();
