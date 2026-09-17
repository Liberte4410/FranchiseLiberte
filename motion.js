/**
 * Liberté（リベルテ）FC募集LP - スクロールアニメーション (motion.js)
 * 
 * 仕様方針:
 * - 参考サイト（https://tiana-beauty.com/franchise/）に合わせた「ふわっと浮き上がる」自然で上質なアニメーション
 * - トップ（ファーストビュー）および各種ボタン・フォームはアニメーション対象外（視認性・即時操作性を確保）
 * - CSS transform / opacity と IntersectionObserver による滑らかなハードウェアアクセラレーション演出
 * - 初回表示時に画面内・画面上部にある要素はチラつきなく即座に表示
 * - 同一行のカード群には心地よい時間差（スタッガー）演出
 * - アニメーション完了後はインラインスタイルを自動消去し、標準スタイルに復帰
 */

document.addEventListener('DOMContentLoaded', () => {
  // ブラウザ対応チェック & 視覚効果低減モードの判定
  if (!('IntersectionObserver' in window)) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) return;

  // 画面幅に応じた移動距離と所要時間（PC: 46px / 850ms, スマホ: 26px / 750ms）
  const isCompact = () => window.innerWidth < 768;
  const getDistance = () => (isCompact() ? 26 : 46);
  const getDuration = () => (isCompact() ? 720 : 850);
  const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

  // アニメーション対象セレクタ（トップのヒーロー、各種ボタン、フォーム、追従バー、フッターは除外）
  const SELECTORS = [
    // 課題・動機セクション
    '#challenges .lp-heading',
    '#challenges .lp-need',

    // 出店タイプセクション
    '#store-types .lp-heading',
    '#store-types .lp-type-card',
    '#store-types .lp-comparison',

    // リベルテの強みセクション
    '#reasons .lp-heading',
    '#reasons .lp-reason-card',

    // 本部サポートセクション
    '#support .lp-heading',
    '#support .lp-owner-panel',
    '#support .lp-support-panel',
    '#support .lp-three-way',

    // 開業プランセクション
    '#plan .lp-heading',
    '#plan .lp-price-overview > div',
    '#plan .lp-cost-choices > div',

    // オーナーの声セクション
    '#voices .lp-heading',
    '#voices .lp-voice',

    // 全国展開セクション
    '#expansion .lp-heading',
    '#expansion .lp-store-milestones > div',
    '#expansion .lp-network-map',

    // 代表メッセージセクション
    '#profile .lp-heading',
    '#profile .lp-profile',

    // 開業までのステップセクション
    '#steps .lp-heading',
    '#steps .lp-flow > li',

    // よくある質問セクション
    '#faq .lp-heading',
    '#faq .lp-details'
  ].join(',');

  // 操作要素やファーストビュー・固定バー・フッターを安全に除外
  const EXCLUDED_PARENTS = '.franchise-hero, .site-header, #floating-cta, #contact-form-section, .glass-footer';
  const INTERACTIVE = 'a, button, input, select, textarea, [role="button"], #xhm-form';

  const rawElements = Array.from(document.querySelectorAll(SELECTORS));
  const targetElements = rawElements.filter(el => {
    if (el.closest(EXCLUDED_PARENTS)) return false;
    if (el.matches(INTERACTIVE)) return false;
    return !rawElements.some(parent => parent !== el && parent.contains(el));
  });

  const seen = new WeakSet();
  let observer = null;

  // 即時表示関数（インラインスタイルをクリアして通常状態に戻す）
  const showInstantly = (el) => {
    if (!el) return;
    seen.add(el);
    if (observer) observer.unobserve(el);
    el.style.opacity = '';
    el.style.transform = '';
    el.style.transition = '';
    el.style.transitionDelay = '';
    el.style.willChange = '';
    el.dataset.motionState = 'shown';
  };

  // ふわっと浮き上がるアニメーション実行関数
  const revealWithMotion = (el, delay = 0) => {
    el.dataset.motionState = 'revealing';
    const duration = getDuration();

    if (delay > 0) {
      el.style.transitionDelay = `${delay}ms, ${delay}ms`;
    } else {
      el.style.transitionDelay = '0ms, 0ms';
    }

    // 次フレームで目標値（opacity: 1, translateY: 0）を適用
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });

    const cleanup = () => {
      el.removeEventListener('transitionend', onEnd);
      showInstantly(el);
    };

    const onEnd = (event) => {
      if (event.target === el && (event.propertyName === 'opacity' || event.propertyName === 'transform')) {
        cleanup();
      }
    };

    el.addEventListener('transitionend', onEnd);
    // トランジション未発火対策のフォールバックタイマー
    setTimeout(cleanup, duration + delay + 200);
  };

  // IntersectionObserver 設定（下端から約8%手前で検知して滑らかにフェードイン開始）
  observer = new IntersectionObserver((entries) => {
    const enteringEntries = entries.filter(entry => entry.isIntersecting);

    for (const entry of enteringEntries) {
      const el = entry.target;
      observer.unobserve(el);
      if (seen.has(el)) continue;
      seen.add(el);

      // 高速スクロールや画面上部をすでに通り過ぎている場合は即時表示
      if (entry.boundingClientRect.top < 0 || document.hidden) {
        showInstantly(el);
        continue;
      }

      // 同一行（ほぼ同じ Y 座標）にあるカード群を検出し、自然な時間差（スタッガー）を付与
      const rowEntries = enteringEntries.filter(other =>
        Math.abs(other.boundingClientRect.top - entry.boundingClientRect.top) < 32
      ).sort((a, b) => a.boundingClientRect.left - b.boundingClientRect.left);

      const indexInRow = Math.max(0, rowEntries.findIndex(e => e.target === el));
      const delay = isCompact() ? indexInRow * 60 : indexInRow * 120;

      revealWithMotion(el, delay);
    }
  }, {
    root: null,
    rootMargin: '0px 0px -8% 0px',
    threshold: 0
  });

  // 初期化：画面内・上部にある要素は即座に通常表示、画面下部の要素のみ準備
  const viewportHeight = window.innerHeight;
  const initialThreshold = viewportHeight * 0.88;
  const distance = getDistance();
  const duration = getDuration();

  for (const el of targetElements) {
    const rect = el.getBoundingClientRect();
    // 画面内またはスクロール済みの要素はチラつきなく即時表示
    if (rect.top < initialThreshold) {
      showInstantly(el);
    } else {
      // 画面下の要素のみふわっと浮き上がる初期状態をセット
      el.style.opacity = '0';
      el.style.transform = `translateY(${distance}px)`;
      el.style.transition = `opacity ${duration}ms ${EASING}, transform ${duration}ms ${EASING}`;
      el.style.willChange = 'opacity, transform';
      el.dataset.motionState = 'hidden';
      observer.observe(el);
    }
  }

  // ページ内アンカーリンクのクリック時は移動先セクションを即時表示
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', () => {
      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#' || hash === '#top') return;
      try {
        const targetSec = document.querySelector(hash);
        if (targetSec) {
          targetSec.querySelectorAll(SELECTORS).forEach(showInstantly);
        }
      } catch {}
    });
  });

  // URLハッシュ付きで直接アクセスされた場合の対応
  if (window.location.hash) {
    try {
      const hashTarget = document.querySelector(window.location.hash);
      if (hashTarget) {
        hashTarget.querySelectorAll(SELECTORS).forEach(showInstantly);
      }
    } catch {}
  }

  // 印刷前・視覚効果低減設定変更時の全要素表示
  window.addEventListener('beforeprint', () => {
    targetElements.forEach(showInstantly);
  });

  reducedMotion.addEventListener('change', (e) => {
    if (e.matches) {
      targetElements.forEach(showInstantly);
    }
  });
});
