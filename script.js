/**
 * Liberté（リベルテ）FC募集LP - インタラクション制御スクリプト
 */

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const spMenuBtn = document.getElementById('sp-menu-btn');
  const spMenuClose = document.getElementById('sp-menu-close');
  const spMenuDrawer = document.getElementById('sp-menu-drawer');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const setMenuOpen = (open, restoreFocus = true) => {
    if (!spMenuDrawer || !spMenuBtn) return;
    spMenuDrawer.hidden = !open;
    spMenuDrawer.classList.toggle('hidden', !open);
    spMenuBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('overflow-hidden', open);
    document.body.style.overflow = open ? 'hidden' : '';
    document.querySelectorAll('.site-header, main, footer, #floating-cta').forEach(element => {
      element.inert = open || (element.id === 'floating-cta' && element.style.opacity !== '1');
    });
    if (open) spMenuClose?.focus();
    else if (restoreFocus) spMenuBtn.focus();
  };

  // --- 1. スムーススクロール（ヘッダーの高さを考慮） ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        if (spMenuDrawer && !spMenuDrawer.hidden) setMenuOpen(false);
        const headerOffset = header?.getBoundingClientRect().height ?? 64;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: reducedMotion.matches ? 'instant' : 'smooth'
        });
      }
    });
  });

  // --- 2. モバイル用ハンバーガーメニュー開閉 ---
  if (spMenuBtn && spMenuDrawer) {
    spMenuBtn.addEventListener('click', () => setMenuOpen(spMenuDrawer.hidden));
    spMenuClose?.addEventListener('click', () => setMenuOpen(false));
    spMenuDrawer.addEventListener('click', event => {
      if (event.target === spMenuDrawer) setMenuOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (spMenuDrawer.hidden) return;
      if (event.key === 'Escape') setMenuOpen(false);
      if (event.key === 'Tab') {
        const focusable = spMenuDrawer.querySelectorAll('a[href], button');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', event => {
      if (event.matches && !spMenuDrawer.hidden) setMenuOpen(false, false);
    });
  }

  // --- 3. アコーディオン開閉（FAQ・詳細情報） ---
  const accordionButtons = document.querySelectorAll('.accordion-btn');
  accordionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling;
      const icon = btn.querySelector('.accordion-icon');
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';

      btn.setAttribute('aria-expanded', !isExpanded);
      if (content) {
        content.classList.toggle('active');
      }
      if (icon) {
        icon.classList.toggle('rotated');
      }
    });
  });

  // --- 4. モバイル固定フッターCTAの表示制御 ---
  const floatingCta = document.getElementById('floating-cta');
  const contactSection = document.getElementById('contact-form-section');
  const heroSection = document.querySelector('.franchise-hero');

  if (floatingCta) {
    const updateFloatingCta = () => {
      const windowHeight = window.innerHeight;
      const headerHeight = header?.getBoundingClientRect().height ?? 64;
      const heroHasPassed = heroSection
        ? heroSection.getBoundingClientRect().bottom <= headerHeight
        : window.scrollY > 220;

      if (heroHasPassed) {
        if (contactSection) {
          const contactRect = contactSection.getBoundingClientRect();
          if (contactRect.top < windowHeight && contactRect.bottom > 0) {
            floatingCta.style.opacity = '0';
            floatingCta.style.pointerEvents = 'none';
            floatingCta.inert = true;
            return;
          }
        }
        floatingCta.style.opacity = '1';
        floatingCta.style.pointerEvents = 'auto';
        floatingCta.inert = spMenuDrawer ? !spMenuDrawer.hidden : false;
      } else {
        floatingCta.style.opacity = '0';
        floatingCta.style.pointerEvents = 'none';
        floatingCta.inert = true;
      }
    };
    window.addEventListener('scroll', updateFloatingCta, { passive: true });
    window.addEventListener('resize', updateFloatingCta);
    updateFloatingCta();
  }

});

// Register before the deferred provider script can send its first height message.
(() => {
  // --- 埋め込みフォームの高さを、PC・スマホ共通で内容に合わせる ---
  const formHost = document.getElementById('xhm-form');
  const formOrigin = 'https://form.hirameki7.io';
  const preparedFrames = new WeakSet();
  let formResizeTimer;
  const refreshFormSize = () => {
    clearTimeout(formResizeTimer);
    formResizeTimer = setTimeout(() => {
      formHost?.querySelector('iframe')?.contentWindow?.postMessage(
        { type: 'shown', params: {} }, formOrigin
      );
    }, 150);
  };
  const prepareFormFrame = () => {
    const frame = formHost?.querySelector('iframe');
    if (!frame || preparedFrames.has(frame)) return;
    preparedFrames.add(frame);
    frame.title = '無料相談・資料請求フォーム';
    // Height messages normally show the entire form. Until then, allow scrolling
    // so a delayed provider response cannot make the last controls unreachable.
    frame.setAttribute('scrolling', formHost.hasAttribute('data-sized') ? 'no' : 'auto');
    frame.addEventListener('load', refreshFormSize);
    refreshFormSize();
  };
  if (formHost) {
    new MutationObserver(prepareFormFrame).observe(formHost, { childList: true });
    prepareFormFrame();
    window.addEventListener('message', event => {
      const frame = formHost.querySelector('iframe');
      const message = event.data;
      if (event.origin !== formOrigin || event.source !== frame?.contentWindow ||
          !message || message.target !== 'xhm-form' ||
          !['ready', 'height'].includes(message.type)) return;
      const reportedHeight = message.params?.h;
      if (typeof reportedHeight !== 'number' || !Number.isFinite(reportedHeight) ||
          reportedHeight <= 300 || reportedHeight > 100000) return;
      // Hirameki7 reports content bottom + 301px for calendar popovers. Keep
      // that reserve only while a popover is open, plus 24px of breathing room.
      const reserve = message.params.isOverflow ? 0 : 300;
      const height = Math.max(500, Math.ceil(reportedHeight - reserve + 24));
      formHost.style.setProperty('--contact-frame-height', `${height}px`);
      formHost.setAttribute('data-sized', 'true');
      frame.setAttribute('scrolling', height > 500 ? 'no' : 'auto');
    });
    // Ask the provider to remeasure when a narrow screen changes orientation
    // or the browser restores the page. Its existing handler retains form data.
    let lastFormWidth;
    new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      if (width !== lastFormWidth) {
        lastFormWidth = width;
        refreshFormSize();
      }
    }).observe(formHost);
    new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) refreshFormSize();
    }, { rootMargin: '200px 0px' }).observe(formHost);
    window.addEventListener('pageshow', refreshFormSize);
  }

  // --- 6. フォーム読み込みのステータス監視＆フォールバック ---
  setTimeout(() => {
    const xhmForm = document.getElementById('xhm-form');
    const formFallback = document.getElementById('form-fallback-msg');
    if (xhmForm && formFallback) {
      if (xhmForm.children.length === 0) {
        formFallback.classList.remove('hidden');
      }
    }
  }, 4000);
})();


/* ==================================================================
 *  7. スクロール連動アニメーション（フェードアップ／ズームイン）
 *     - HTMLは書き換えず、JS側で対象要素に data-reveal を付与します
 *     - 画面に入ったら .is-visible を付けて、CSSのトランジションを再生
 *     - このスクリプトは </body> 直前で同期実行されるため、
 *       最初の描画前に初期状態（非表示）が適用されます
 * ================================================================== */
(() => {
  'use strict';

  // 対応していない環境／動きを減らす設定の場合は何もしない（通常表示のまま）
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const STEP = 90;       // 同じグループ内で1つずつずらす時間(ms)
  const MAX_STEP = 5;    // ずらしの上限（6番目以降は同じタイミング）
  const CLEANUP = 1900;  // 再生後に属性を外すまでの時間(ms)

  const targets = [];               // { el, dir, delay }
  const registered = new Set();

  const classOf = el => el.getAttribute('class') || '';

  const add = (el, dir, delay) => {
    if (!el || registered.has(el)) return;
    registered.add(el);
    targets.push({ el, dir, delay });
  };

  // --- 要素ごとの動く向きを決める ---
  const directionFor = (el, index, total) => {
    // 埋め込みフォームなど iframe を含むブロックは、
    // 描画が乱れないよう「その場でふわっと表示」だけにする
    if (el.querySelector && el.querySelector('iframe, #xhm-form')) return 'fade';
    // 2カラムの左右並び（PC）のときだけ、左右から寄せる
    const parent = el.parentElement;
    if (total === 2 && parent && /grid-cols-12/.test(classOf(parent))) {
      return index === 0 ? 'left' : 'right';
    }
    return 'up';
  };

  const addGroup = elements => {
    elements.forEach((el, i) => {
      add(el, directionFor(el, i, elements.length), Math.min(i, MAX_STEP) * STEP);
    });
  };

  // 見出しブロック（ラベル＋h2＋リード文）かどうか
  const isHeadingBlock = el => !!el.querySelector(':scope > .section-label, :scope > h2');

  // カードを並べている入れ物かどうか
  const isGroupContainer = el => {
    const c = classOf(el);
    return /(^|\s)(challenge-grid|three-card-grid|steps-grid|expansion-stats|grid)(\s|$)/.test(c) ||
           /(^|\s)space-y-\d/.test(c);
  };

  // --- 1. ファーストビュー：上から順番に現れる ---
  const hero = document.querySelector('.franchise-hero');
  if (hero) {
    let heroDelay = 60;
    [
      '.hero-eyebrow', '.hero-recruitment', '.hero-title', '.hero-subtitle',
      '.hero-visual', '.hero-fact', '.hero-support', '.hero-actions', '.hero-note'
    ].forEach(selector => {
      hero.querySelectorAll(selector).forEach(el => {
        add(el, 'up', heroDelay);
        heroDelay += 70;
      });
    });
  }

  // --- 2. 各セクション：ブロック単位・カード単位で現れる ---
  document.querySelectorAll('.content-section').forEach(section => {
    const container = section.firstElementChild;
    if (!container) return;

    Array.from(container.children).forEach(block => {
      // 見出しブロック → ラベル・見出し・リード文を1つずつずらして表示
      if (isHeadingBlock(block)) {
        addGroup(Array.from(block.children));
        return;
      }
      // カードグリッド → カードを1枚ずつずらして表示
      if (isGroupContainer(block) && block.childElementCount > 1) {
        addGroup(Array.from(block.children));
        return;
      }
      // それ以外 → ブロックごとまとめて表示
      add(block, directionFor(block, 0, 1), 0);
    });
  });

  // --- 3. 画面に入ったら再生する監視役 ---
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-visible');
      obs.unobserve(el);
      // 再生し終わったら属性を外して、元のホバー演出などを妨げないようにする
      const delay = parseInt(el.style.getPropertyValue('--reveal-delay'), 10) || 0;
      window.setTimeout(() => {
        el.removeAttribute('data-reveal');
        el.removeAttribute('data-reveal-img');
        el.style.removeProperty('--reveal-delay');
      }, delay + CLEANUP);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

  targets.forEach(({ el, dir, delay }) => {
    el.setAttribute('data-reveal', dir);
    if (delay) el.style.setProperty('--reveal-delay', delay + 'ms');
    observer.observe(el);
  });

  // --- 4. セクションラベルの下線を左から引く ---
  const targetSet = new Set(targets.map(t => t.el));
  document.querySelectorAll('.content-section .section-label').forEach(label => {
    for (let node = label; node && node !== document.body; node = node.parentElement) {
      if (targetSet.has(node)) {
        label.classList.add('reveal-underline');
        return;
      }
    }
  });

  // --- 5. 写真のズームイン（枠が overflow:hidden の画像だけ） ---
  document.querySelectorAll('.content-section img').forEach(img => {
    const frame = img.parentElement;
    if (!frame) return;
    if (window.getComputedStyle(frame).overflow !== 'hidden') return;
    img.setAttribute('data-reveal-img', '');
    observer.observe(img);
  });

  // --- 6. ヘッダー：スクロールで少しコンパクトにする ---
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    let scrolled = null;
    const updateHeader = () => {
      const next = window.scrollY > 40;
      if (next === scrolled) return;
      scrolled = next;
      siteHeader.classList.toggle('is-scrolled', next);
    };
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }
})();
