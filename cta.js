/* Persistent booking CTA.
 *
 * Mounts a fixed "Book your free Leak Audit" control on every page so an action
 * is always one tap away, at any scroll depth. The site header is
 * position: relative, so the nav CTA scrolls out of reach — this replaces it
 * once the hero is behind you.
 *
 * Appended to <body> as a sibling of the React root, never inside it, so the
 * support.js runtime never reconciles these nodes away.
 */
(function () {
  'use strict';

  var BOOKING = 'https://api.leadconnectorhq.com/widget/booking/3qoHJXcr2Hv7u9ADreKm';
  var TEL = '+12897003394';
  var TEL_LABEL = '+1 289-700-3394';
  var MOBILE_MAX = 759;

  if (window.__genovationCta) return;
  window.__genovationCta = true;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isMobile() {
    return window.innerWidth <= MOBILE_MAX;
  }

  function glass(el, blur) {
    el.style.background = 'rgba(255,255,255,.01)';
    el.style.backgroundBlendMode = 'luminosity';
    el.style.backdropFilter = 'blur(' + blur + 'px)';
    el.style.webkitBackdropFilter = 'blur(' + blur + 'px)';
    el.style.boxShadow = '4px 4px 18px rgba(0,0,0,.35), inset 0 1px 1px rgba(255,255,255,.15)';
  }

  /* The gradient ring the rest of the site draws with mask-composite. Inline
   * styles can't carry ::before, so it goes in one stylesheet. */
  var css = document.createElement('style');
  css.textContent =
    '#gv-cta a{text-decoration:none}' +
    '#gv-cta .gv-ring{position:relative;overflow:hidden}' +
    '#gv-cta .gv-ring::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1.4px;' +
    'background:linear-gradient(180deg,rgba(255,255,255,.5) 0%,rgba(255,255,255,.2) 20%,rgba(255,255,255,0) 40%,rgba(255,255,255,0) 60%,rgba(255,255,255,.2) 80%,rgba(255,255,255,.5) 100%);' +
    '-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}' +
    '#gv-cta .gv-primary{transition:transform .3s cubic-bezier(.33,1,.68,1),opacity .3s ease}' +
    '#gv-cta .gv-primary:hover{transform:translateY(-2px)}' +
    '@media (prefers-reduced-motion: reduce){#gv-cta .gv-primary{transition:none}#gv-cta .gv-primary:hover{transform:none}}';
  document.head.appendChild(css);

  var wrap = document.createElement('div');
  wrap.id = 'gv-cta';
  wrap.setAttribute('data-gv-cta', '1');
  wrap.style.cssText = [
    'position:fixed',
    'z-index:900',
    'display:flex',
    'align-items:center',
    'gap:10px',
    'opacity:0',
    'visibility:hidden',
    'pointer-events:none',
    'transform:translateY(14px)',
    'transition:' + (reduceMotion ? 'none' : 'opacity .45s ease, transform .5s cubic-bezier(.19,1,.22,1), visibility .45s')
  ].join(';');

  function arrow() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:relative;z-index:1;width:16px;height:16px;flex:none';
    svg.innerHTML = '<path d="M7 17L17 7"></path><path d="M7 7h10v10"></path>';
    return svg;
  }

  function phoneIcon() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:relative;z-index:1;width:18px;height:18px;flex:none';
    svg.innerHTML =
      '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"></path>';
    return svg;
  }

  /* Primary — book the audit. */
  var book = document.createElement('a');
  book.className = 'gv-ring gv-primary';
  book.href = BOOKING;
  book.target = '_blank';
  book.rel = 'noopener';
  book.setAttribute('data-gv-book', '1');
  book.style.cssText = [
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'gap:9px',
    'padding:14px 22px',
    'border-radius:999px',
    'font-size:16px',
    'font-weight:500',
    'line-height:1',
    'color:#FFFFFF',
    'white-space:nowrap',
    'pointer-events:auto'
  ].join(';');
  glass(book, 50);
  var bookLabel = document.createElement('span');
  bookLabel.style.cssText = 'position:relative;z-index:1';
  bookLabel.textContent = 'Book your free Leak Audit';
  book.appendChild(bookLabel);
  book.appendChild(arrow());

  /* Secondary — call now. */
  var call = document.createElement('a');
  call.className = 'gv-ring gv-primary';
  call.href = 'tel:' + TEL;
  call.setAttribute('aria-label', 'Call ' + TEL_LABEL);
  call.style.cssText = [
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'gap:9px',
    'border-radius:999px',
    'font-size:16px',
    'font-weight:500',
    'line-height:1',
    'color:#FFFFFF',
    'white-space:nowrap',
    'pointer-events:auto'
  ].join(';');
  glass(call, 20);
  call.appendChild(phoneIcon());
  var callLabel = document.createElement('span');
  callLabel.style.cssText = 'position:relative;z-index:1';
  call.appendChild(callLabel);

  wrap.appendChild(book);
  wrap.appendChild(call);

  function layout() {
    if (isMobile()) {
      wrap.style.left = '12px';
      wrap.style.right = '12px';
      wrap.style.bottom = 'calc(12px + env(safe-area-inset-bottom, 0px))';
      book.style.flex = '1 1 auto';
      book.style.padding = '15px 18px';
      call.style.flex = '0 0 auto';
      call.style.padding = '15px 17px';
      callLabel.textContent = '';
      callLabel.style.display = 'none';
    } else {
      wrap.style.left = 'auto';
      wrap.style.right = '24px';
      wrap.style.bottom = '24px';
      book.style.flex = '0 0 auto';
      book.style.padding = '14px 22px';
      call.style.flex = '0 0 auto';
      call.style.padding = '14px 20px';
      callLabel.textContent = TEL_LABEL;
      callLabel.style.display = 'inline';
    }
  }

  var shown = false;
  function setShown(next) {
    if (next === shown) return;
    shown = next;
    wrap.style.opacity = next ? '1' : '0';
    wrap.style.visibility = next ? 'visible' : 'hidden';
    wrap.style.transform = next ? 'translateY(0)' : 'translateY(14px)';
    wrap.style.pointerEvents = next ? 'auto' : 'none';
  }

  /* Suppressed while the page's own closing CTA block is on screen — no point
   * floating a duplicate over the real thing. */
  var atClosingCta = false;

  function update() {
    /* Short pages (404) barely scroll, so gating on scroll depth alone would
     * hide the CTA for the whole visit. Show it immediately when there is
     * little or nothing to scroll past. */
    var range = document.documentElement.scrollHeight - window.innerHeight;
    var shortPage = range < window.innerHeight * 0.75;
    var past =
      shortPage || window.scrollY > Math.min(window.innerHeight * 0.55, 620);
    setShown(past && !atClosingCta);
  }

  var watched = null;
  function watchClosingCta() {
    /* Labels vary across pages — "CTA", "Final CTA", "Book" — so match on the
     * label text rather than an exact value. */
    var target = null;
    var sections = document.querySelectorAll('section[data-screen-label]');
    for (var i = 0; i < sections.length; i++) {
      var label = (sections[i].getAttribute('data-screen-label') || '').toLowerCase();
      if (
        label.indexOf('cta') !== -1 ||
        label.indexOf('audit') !== -1 ||
        label.indexOf('booking') !== -1
      ) {
        target = sections[i];
      }
    }
    if (!target || target === watched || !('IntersectionObserver' in window)) return;
    watched = target;
    new IntersectionObserver(
      function (entries) {
        atClosingCta = entries[0].isIntersecting;
        update();
      },
      { threshold: 0.28 }
    ).observe(target);
  }

  function mount() {
    if (!document.body || wrap.isConnected) return;
    document.body.appendChild(wrap);
    layout();
    update();
    /* The runtime renders asynchronously; the closing CTA may not exist yet. */
    watchClosingCta();
    setTimeout(watchClosingCta, 1200);
  }

  var ticking = false;
  window.addEventListener(
    'scroll',
    function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        update();
        ticking = false;
      });
    },
    { passive: true }
  );
  window.addEventListener('resize', function () {
    layout();
    update();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
  window.addEventListener('load', mount);
})();
