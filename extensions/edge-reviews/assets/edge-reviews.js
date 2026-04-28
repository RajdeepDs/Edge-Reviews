/* Edge Reviews — Storefront Widget v1.0 */
(function () {
  'use strict';

  if (window.__EdgeReviewsLoaded) return;
  window.__EdgeReviewsLoaded = true;

  const GRADIENTS = [
    'linear-gradient(160deg,#667eea,#764ba2)',
    'linear-gradient(160deg,#f093fb,#f5576c)',
    'linear-gradient(160deg,#4facfe,#00c6fb)',
    'linear-gradient(160deg,#43e97b,#38f9d7)',
    'linear-gradient(160deg,#fa709a,#fee140)',
    'linear-gradient(160deg,#a18cd1,#fbc2eb)',
    'linear-gradient(160deg,#fccb90,#d57eeb)',
    'linear-gradient(160deg,#a1c4fd,#c2e9fb)',
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────

  function stars(rating, size) {
    size = size || 14;
    var full = Math.round(rating);
    var empty = 5 - full;
    return '<span class="er-stars" style="font-size:' + size + 'px">' +
      '<span class="er-stars-full">' + '★'.repeat(full) + '</span>' +
      '<span class="er-stars-empty">' + '★'.repeat(empty) + '</span>' +
      '</span>';
  }

  function date(str) {
    return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function badge() {
    return '<span class="er-badge">✓ Verified</span>';
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  // ── Data fetching via Shopify app proxy ────────────────────────────────────
  // Shopify proxies /apps/edge-reviews/widget → app server, adding ?shop= automatically.

  var cachedData = null;

  function fetchData(cb) {
    if (cachedData) { cb(null, cachedData); return; }
    fetch('/apps/edge-reviews/widget')
      .then(function (r) { return r.json(); })
      .then(function (data) { cachedData = data; cb(null, data); })
      .catch(function (err) { cb(err); });
  }

  // ── Main Widget ────────────────────────────────────────────────────────────

  function renderMain(el, data) {
    var stats = data.stats;
    var reviews = data.reviews;
    var cfg = data.config || {};
    var cols = cfg.masonryColumns || 4;
    var showRating = cfg.masonryShowRating !== false;
    var showName = cfg.masonryShowName !== false;
    var showBadge = cfg.masonryShowBadge !== false;
    var tileColor = cfg.masonryTileColor || '#8fad88';
    var title = cfg.masonryTitle || 'From our customers';

    var breakdownRows = stats.breakdown.map(function (b) {
      return '<div class="er-breakdown-row">' +
        '<span class="er-breakdown-label">' + b.star + '★</span>' +
        '<div class="er-breakdown-bar-track"><div class="er-breakdown-bar-fill" style="width:0%" data-w="' + b.pct + '%"></div></div>' +
        '<span class="er-breakdown-pct">' + b.pct + '%</span>' +
        '</div>';
    }).join('');

    var summaryBar =
      '<div class="er-summary-bar">' +
        '<div class="er-summary-left">' +
          '<div class="er-avg-number">' + stats.avg + '</div>' +
          stars(parseFloat(stats.avg), 18) +
          '<div class="er-review-count">' + stats.total + ' reviews</div>' +
        '</div>' +
        '<div class="er-vdivider"></div>' +
        '<div class="er-breakdown">' + breakdownRows + '</div>' +
        '<div class="er-vdivider"></div>' +
        '<div class="er-summary-right">' +
          '<button class="er-write-review-btn" onclick="document.getElementById(\'er-write-review\')&&document.getElementById(\'er-write-review\').scrollIntoView({behavior:\'smooth\'})">Write A Review</button>' +
        '</div>' +
      '</div>';

    var cards = reviews.map(function (r, i) {
      var hasImage = r.imageUrl && r.imageUrl.length > 0;
      var imgOrTile = hasImage
        ? '<div class="er-card-image" style="background-image:url(' + esc(r.imageUrl) + ')"></div>'
        : '<div class="er-card-text-tile" style="background:' + tileColor + '">' +
            (showRating ? stars(r.rating, 11) : '') +
            '<p>' + esc(r.body.slice(0, 110)) + '</p>' +
          '</div>';
      var body =
        '<div class="er-card-body">' +
          (hasImage && showRating ? stars(r.rating, 12) : '') +
          (r.title ? '<div class="er-card-title">' + esc(r.title) + '</div>' : '') +
          (hasImage ? '<p class="er-card-text">' + esc(r.body) + '</p>' : '') +
          '<div class="er-card-footer">' +
            (showName ? '<span class="er-card-author">' + esc(r.customerName) + (showBadge ? ' ' + badge() : '') + '</span>' : '') +
            '<span class="er-card-date">' + date(r.createdAt) + '</span>' +
          '</div>' +
        '</div>';
      return '<div class="er-review-card">' + imgOrTile + body + '</div>';
    }).join('');

    el.innerHTML =
      summaryBar +
      '<div class="er-section-title">' + esc(title) + '</div>' +
      '<div class="er-masonry-grid" style="column-count:' + cols + '">' + cards + '</div>';

    // Animate bars after paint
    requestAnimationFrame(function () {
      el.querySelectorAll('.er-breakdown-bar-fill[data-w]').forEach(function (bar) {
        bar.style.width = bar.getAttribute('data-w');
      });
    });
  }

  // ── Masonry Grid ───────────────────────────────────────────────────────────

  function renderMasonry(el, data) {
    var reviews = data.reviews;
    var cfg = data.config || {};
    var title = cfg.masonryTitle || 'From our customers';

    if (!reviews.length) {
      el.innerHTML = '<div class="er-empty">No reviews yet.</div>';
      return;
    }

    var cards = reviews.map(function (r) {
      var hasImage = r.imageUrl && r.imageUrl.length > 0;

      if (hasImage) {
        return '<div class="er-mg-card">' +
          '<div class="er-mg-bg" style="background-image:url(' + esc(r.imageUrl) + ')">' +
            '<div class="er-mg-base-info">' +
              stars(r.rating, 13) +
              '<span class="er-mg-base-name">' + esc(r.customerName) + '</span>' +
            '</div>' +
            '<div class="er-mg-hover">' +
              (r.title ? '<p class="er-mg-hover-title">' + esc(r.title) + '</p>' : '') +
              '<p class="er-mg-hover-body">' + esc(r.body) + '</p>' +
            '</div>' +
          '</div>' +
        '</div>';
      }

      return '<div class="er-mg-card">' +
        '<div class="er-mg-text-tile">' +
          stars(r.rating, 13) +
          '<p class="er-mg-tile-desc">' + esc(r.body) + '</p>' +
          '<span class="er-mg-tile-name">' + esc(r.customerName) + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    el.innerHTML =
      '<div class="er-agg-header">' +
        '<div class="er-agg-header-title">' + esc(title) + '</div>' +
      '</div>' +
      '<div class="er-mg-grid">' + cards + '</div>';
  }

  // ── Card Carousel ──────────────────────────────────────────────────────────

  function renderCardCarousel(el, data) {
    var reviews = data.reviews;
    var cfg = data.config || {};
    var title = cfg.cardTitle || 'What our customers say';
    var showRating = cfg.cardShowRating !== false;
    var showName = cfg.cardShowName !== false;
    var showBadge = cfg.cardShowBadge !== false;
    var showProduct = cfg.cardShowProduct !== false;

    if (!reviews.length) {
      el.innerHTML = '<div class="er-empty">No reviews yet.</div>';
      return;
    }

    var uid = 'er-cc-' + Math.random().toString(36).slice(2, 7);

    var cards = reviews.slice(0, 16).map(function (r, i) {
      return '<div class="er-carousel-card">' +
        '<div class="er-carousel-card-img" style="background:' + GRADIENTS[i % GRADIENTS.length] + '"></div>' +
        '<div class="er-carousel-card-body">' +
          '<p class="er-carousel-card-text">' + esc(r.body) + '</p>' +
          (showRating ? stars(r.rating, 12) : '') +
          (showName ? '<div class="er-carousel-card-author">' + esc(r.customerName) + (showBadge ? ' ' + badge() : '') + '</div>' : '') +
          (showProduct && r.productTitle ? '<div class="er-carousel-card-product">' + esc(r.productTitle) + '</div>' : '') +
        '</div>' +
      '</div>';
    }).join('');

    el.innerHTML =
      '<div class="er-agg-header"><div class="er-agg-header-title">' + esc(title) + '</div></div>' +
      '<div class="er-card-carousel-wrap" id="' + uid + '">' +
        '<button class="er-carousel-btn er-prev-btn" aria-label="Previous">&#8249;</button>' +
        '<div class="er-carousel-track-wrap"><div class="er-carousel-track">' + cards + '</div></div>' +
        '<button class="er-carousel-btn er-next-btn" aria-label="Next">&#8250;</button>' +
      '</div>';

    initCardCarousel(document.getElementById(uid));
  }

  function initCardCarousel(container) {
    if (!container) return;
    var track = container.querySelector('.er-carousel-track');
    var wrap = container.querySelector('.er-carousel-track-wrap');
    var prev = container.querySelector('.er-prev-btn');
    var next = container.querySelector('.er-next-btn');
    var pos = 0;

    function update(dir) {
      var card = track.querySelector('.er-carousel-card');
      if (!card) return;
      var cardW = card.offsetWidth + 16;
      var visible = Math.max(1, Math.floor(wrap.offsetWidth / cardW));
      var total = track.querySelectorAll('.er-carousel-card').length;
      var max = Math.max(0, total - visible);
      pos = Math.max(0, Math.min(max, pos + dir));
      track.style.transform = 'translateX(-' + (pos * cardW) + 'px)';
    }

    prev.addEventListener('click', function () { update(-1); });
    next.addEventListener('click', function () { update(1); });
  }

  // ── Fan Carousel ───────────────────────────────────────────────────────────

  function renderFanCarousel(el, data) {
    var reviews = data.reviews;
    var cfg = data.config || {};
    var title = cfg.fanTitle || 'From our customers';
    var showRating = cfg.fanShowRating !== false;
    var showName = cfg.fanShowName !== false;
    var showBadge = cfg.fanShowBadge !== false;

    if (!reviews.length) {
      el.innerHTML = '<div class="er-empty">No reviews yet.</div>';
      return;
    }

    var uid = 'er-fan-' + Math.random().toString(36).slice(2, 7);

    var cards = reviews.slice(0, 10).map(function (r, i) {
      return '<div class="er-fan-card" data-index="' + i + '">' +
        '<div class="er-fan-card-inner" style="background:' + GRADIENTS[i % GRADIENTS.length] + '">' +
          '<div class="er-fan-card-overlay">' +
            (showRating ? stars(r.rating, 11) : '') +
            (showName ? '<div class="er-fan-card-name">' + esc(r.customerName) + (showBadge ? '<span style="color:#4ade80;margin-left:5px">✓</span>' : '') + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    el.innerHTML =
      '<div class="er-agg-header"><div class="er-agg-header-title">' + esc(title) + '</div></div>' +
      '<div class="er-fan-wrap" id="' + uid + '">' +
        '<button class="er-carousel-btn er-fan-prev" aria-label="Previous">&#8249;</button>' +
        '<div class="er-fan-stage">' + cards + '</div>' +
        '<button class="er-carousel-btn er-fan-next" aria-label="Next">&#8250;</button>' +
      '</div>';

    initFanCarousel(document.getElementById(uid));
  }

  function initFanCarousel(container) {
    if (!container) return;
    var cards = Array.from(container.querySelectorAll('.er-fan-card'));
    var active = 0;

    function render() {
      cards.forEach(function (card, i) {
        var offset = i - active;
        if (offset === 0) card.setAttribute('data-pos', 'center');
        else if (offset === -1) card.setAttribute('data-pos', 'left');
        else if (offset === 1) card.setAttribute('data-pos', 'right');
        else card.setAttribute('data-pos', 'hidden');
      });
    }

    render();

    container.querySelector('.er-fan-prev').addEventListener('click', function () {
      active = Math.max(0, active - 1);
      render();
    });
    container.querySelector('.er-fan-next').addEventListener('click', function () {
      active = Math.min(cards.length - 1, active + 1);
      render();
    });
  }

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  function init() {
    var widgets = document.querySelectorAll('[data-er-widget]');
    if (!widgets.length) return;

    fetchData(function (err, data) {
      if (err || !data) {
        widgets.forEach(function (el) {
          el.innerHTML = '<div class="er-empty">Could not load reviews.</div>';
        });
        return;
      }

      widgets.forEach(function (el) {
        switch (el.dataset.erWidget) {
          case 'main':          renderMain(el, data);          break;
          case 'masonry-grid':  renderMasonry(el, data);       break;
          case 'card-carousel': renderCardCarousel(el, data);  break;
          case 'fan-carousel':  renderFanCarousel(el, data);   break;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
