/* ============================================================
   gsap-lite — 부스 앱에서 쓰는 GSAP API 부분집합 (외부 의존 0)
   지원: gsap.fromTo / gsap.from / gsap.to / gsap.set
   props: opacity, x, y, scale, duration(s), delay(s), ease(무시→CSS)
   실제 GSAP으로 교체하려면 이 파일 대신 gsap.min.js 를 로드하면 됨
   (API 호환이므로 앱 코드는 수정 불필요)
   ============================================================ */
(function () {
  if (window.gsap) return; // 진짜 GSAP이 이미 있으면 양보

  var EASE = {
    'power2.out': 'cubic-bezier(.22,.61,.36,1)',
    'power3.out': 'cubic-bezier(.165,.84,.44,1)',
    'power1.in': 'cubic-bezier(.47,0,.745,.715)',
    'back.out(1.4)': 'cubic-bezier(.175,.885,.32,1.4)',
    'back.out(2)': 'cubic-bezier(.175,.885,.32,1.6)',
  };

  function els(target) {
    if (typeof target === 'string') return Array.prototype.slice.call(document.querySelectorAll(target));
    if (target instanceof Element) return [target];
    if (target && target.length != null) return Array.prototype.slice.call(target);
    return [];
  }

  function transformOf(vars) {
    var t = [];
    if (vars.x != null) t.push('translateX(' + vars.x + 'px)');
    if (vars.y != null) t.push('translateY(' + vars.y + 'px)');
    if (vars.scale != null) t.push('scale(' + vars.scale + ')');
    return t.length ? t.join(' ') : null;
  }

  function frame(vars) {
    var f = {};
    if (vars.opacity != null) f.opacity = vars.opacity;
    var tr = transformOf(vars);
    if (tr) f.transform = tr;
    return f;
  }

  function animate(el, fromVars, toVars) {
    var dur = (toVars.duration != null ? toVars.duration : 0.5) * 1000;
    var delay = (toVars.delay || 0) * 1000;
    var easing = EASE[toVars.ease] || 'cubic-bezier(.22,.61,.36,1)';
    var kf = [];
    if (fromVars) kf.push(frame(fromVars));
    kf.push(frame(toVars));
    if (kf.length === 1) kf.unshift({});
    try {
      var a = el.animate(kf, { duration: dur, delay: delay, easing: easing, fill: 'both' });
      a.onfinish = function () {
        applySet(el, toVars);
        try { a.cancel(); } catch (e) {}
        if (toVars.onComplete) toVars.onComplete();
      };
    } catch (e) {
      applySet(el, toVars);
      if (toVars.onComplete) toVars.onComplete();
    }
  }

  function applySet(el, vars) {
    if (vars.opacity != null) el.style.opacity = vars.opacity;
    var tr = transformOf(vars);
    if (tr) el.style.transform = (vars.y === 0 && vars.x == null && vars.scale == null) ? '' : tr;
  }

  window.gsap = {
    fromTo: function (target, fromVars, toVars) { els(target).forEach(function (el) { animate(el, fromVars, toVars); }); },
    to: function (target, toVars) { els(target).forEach(function (el) { animate(el, null, toVars); }); },
    from: function (target, fromVars) {
      els(target).forEach(function (el) {
        animate(el, fromVars, { duration: fromVars.duration, delay: fromVars.delay, ease: fromVars.ease, opacity: 1, x: 0, y: 0, scale: 1 });
      });
    },
    set: function (target, vars) { els(target).forEach(function (el) { applySet(el, vars); }); },
  };
})();
