/* Scroll reveals are optional decoration: content remains visible without JS. */
document.addEventListener('DOMContentLoaded', () => {
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactScreen = window.matchMedia('(max-width: 767px)');
  const selectors = [
    '.hero-intro', '.hero-visual', '.hero-facts',
    '.lp-heading', '.lp-need', '.lp-type-card', '.lp-reason-card',
    '.lp-owner-panel', '.lp-support-title', '.lp-support-list > li',
    '.lp-three-way', '.lp-price-overview > div', '.lp-cost-choices > div',
    '.lp-voice', '.lp-store-milestones > div',
    '.lp-network-map', '.lp-profile > figure', '.lp-profile-copy > p',
    '.lp-flow > li', '.lp-consult-strip > div'
  ].join(',');
  // Never animate a control or any ancestor that would move/hide a control.
  const controls = 'a,button,input,select,textarea,summary,details,[role="button"],iframe,form,#xhm-form';
  const candidates = [...document.querySelectorAll(selectors)].filter(element =>
    !element.matches(controls) && !element.querySelector(controls)
  );
  const targets = candidates.filter(element =>
    !candidates.some(parent => parent !== element && parent.contains(element))
  );
  const seen = new WeakSet();
  const active = new Map();
  let observer;
  let printing = false;

  const stop = () => {
    observer?.disconnect();
    for (const [element, animation] of active) {
      animation.cancel();
      element.dataset.motionState = 'shown';
    }
    active.clear();
  };

  const start = () => {
    stop();
    if (printing || reducedMotion.matches) return;
    observer = new IntersectionObserver(entries => {
      const entering = entries.filter(entry => entry.isIntersecting);
      for (const entry of entering) {
        const element = entry.target;
        observer.unobserve(element);
        if (seen.has(element)) continue;
        seen.add(element);
        // An anchor jump or restored scroll position must show its content immediately.
        if (entry.boundingClientRect.top < -40 || document.hidden) {
          element.dataset.motionState = 'shown';
          continue;
        }
        const row = entering.filter(other =>
          Math.abs(other.boundingClientRect.top - entry.boundingClientRect.top) < 24
        ).sort((a, b) => a.boundingClientRect.left - b.boundingClientRect.left);
        const delay = Math.min(row.indexOf(entry), 2) * 90;
        const distance = compactScreen.matches ? 16 : 28;
        const photo = element.matches('.hero-visual');
        element.dataset.motionState = 'revealing';
        try {
          const animation = element.animate([
            { opacity: 0, transform: photo ? 'scale(.985)' : `translateY(${distance}px)` },
            { opacity: 1, transform: 'none' }
          ], {
            duration: compactScreen.matches ? 620 : 760,
            delay,
            easing: 'cubic-bezier(.2,.65,.3,1)',
            fill: 'backwards'
          });
          active.set(element, animation);
          animation.finished.then(() => {
            active.delete(element);
            element.dataset.motionState = 'shown';
          }).catch(() => {});
        } catch {
          element.dataset.motionState = 'shown';
        }
      }
    }, { threshold: 0, rootMargin: '0px 0px 24px 0px' });
    for (const element of targets) {
      if (!seen.has(element)) observer.observe(element);
    }
  };

  reducedMotion.addEventListener('change', start);
  window.addEventListener('beforeprint', () => { printing = true; stop(); });
  window.addEventListener('afterprint', () => { printing = false; start(); });
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', event => { if (event.persisted) start(); });
  start();
});
