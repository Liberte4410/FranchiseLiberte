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

  // --- 5. フォーム読み込みのステータス監視＆フォールバック ---
  setTimeout(() => {
    const xhmForm = document.getElementById('xhm-form');
    const formFallback = document.getElementById('form-fallback-msg');
    if (xhmForm && formFallback) {
      if (xhmForm.children.length === 0) {
        formFallback.classList.remove('hidden');
      }
    }
  }, 4000);
});
