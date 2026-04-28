(() => {
  const NS = "er";

  function qs(root, sel) {
    return root.querySelector(sel);
  }

  function qsa(root, sel) {
    return Array.from(root.querySelectorAll(sel));
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return "";
    }
  }

  function initials(name) {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    if (parts.length === 0) return "?";
    return parts.map((p) => p[0].toUpperCase()).join("");
  }

  function renderStars(rating) {
    const n = clamp(parseInt(rating, 10) || 0, 0, 5);
    let out = "";
    for (let i = 1; i <= 5; i++) {
      out += `<span class="er-star ${i <= n ? "is-on" : "is-off"}" aria-hidden="true">★</span>`;
    }
    return `<span class="er-stars" aria-label="${n} out of 5 stars">${out}</span>`;
  }

  function parseBool(v, fallback) {
    if (typeof v === "boolean") return v;
    if (v === "true") return true;
    if (v === "false") return false;
    return fallback;
  }

  function parseIntOr(v, fallback) {
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) ? n : fallback;
  }

  function sortReviews(reviews, sort) {
    const copy = reviews.slice();
    if (sort === "highest") {
      copy.sort((a, b) => (b.rating - a.rating) || (new Date(b.createdAt) - new Date(a.createdAt)));
      return copy;
    }
    if (sort === "lowest") {
      copy.sort((a, b) => (a.rating - b.rating) || (new Date(b.createdAt) - new Date(a.createdAt)));
      return copy;
    }
    copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return copy;
  }

  function hasMedia(review) {
    return Boolean(review && review.imageUrl);
  }

  function makeToast(root, msg, kind = "success") {
    const live = qs(root, ".er-live");
    if (live) live.textContent = msg;

    const toast = document.createElement("div");
    toast.className = `er-toast er-toast--${kind}`;
    toast.setAttribute("role", "status");
    toast.textContent = msg;
    root.appendChild(toast);
    window.setTimeout(() => toast.classList.add("is-in"), 10);
    window.setTimeout(() => {
      toast.classList.remove("is-in");
      window.setTimeout(() => toast.remove(), 180);
    }, 3200);
  }

  function buildMainWidget(root, data, opts) {
    const { config, reviews, stats } = data;

    const title =
      (opts.titleOverride && String(opts.titleOverride).trim()) ||
      (config && config.mainTitle) ||
      "Reviews";

    const accent = (opts.accent && String(opts.accent).trim()) || (config && config.mainAccentColor) || "#111111";
    const showBreakdown = parseBool(opts.showBreakdown, config?.mainShowBreakdown ?? true);
    const showWrite = parseBool(opts.showWrite, config?.mainShowWriteButton ?? true);
    const pageSize = clamp(parseIntOr(opts.pageSize, config?.mainPageSize ?? 20), 4, 48);

    const defaultSort = (opts.defaultSort || config?.mainDefaultSort || "latest").toString();

    root.style.setProperty("--er-accent", accent);

    root.innerHTML = `
      <div class="er-widget er-widget--main" style="--er-accent: ${escapeHtml(accent)};">
        <div class="er-live" aria-live="polite" aria-atomic="true"></div>

        <header class="er-head">
          <div class="er-head__titles">
            <h2 class="er-h2">${escapeHtml(title)}</h2>
            <div class="er-subhead">
              <div class="er-avg">
                <span class="er-avg__num">${escapeHtml(stats?.avg ?? "0.0")}</span>
                ${renderStars(Math.round(parseFloat(stats?.avg || "0") || 0))}
                <span class="er-avg__count">(${escapeHtml(stats?.total ?? 0)})</span>
              </div>
              <span class="er-verified"><span class="er-verified__mark">✓</span> Verified</span>
            </div>
          </div>
          ${
            showWrite
              ? `<div class="er-head__cta"><button type="button" class="er-btn er-btn--primary" data-er-open>Write a review</button></div>`
              : ""
          }
        </header>

        ${
          showBreakdown
            ? `<section class="er-break" aria-label="Rating breakdown">
                ${[5, 4, 3, 2, 1]
                  .map((star) => {
                    const row = (stats?.breakdown || []).find((b) => b.star === star) || { count: 0, pct: 0 };
                    return `
                      <div class="er-break__row">
                        <span class="er-break__label">${star}</span>
                        <span class="er-break__stars" aria-hidden="true">★</span>
                        <div class="er-break__bar" role="img" aria-label="${star} stars: ${row.count} reviews (${row.pct}%)">
                          <div class="er-break__fill" style="width:${clamp(row.pct || 0, 0, 100)}%"></div>
                        </div>
                        <span class="er-break__pct">${clamp(row.pct || 0, 0, 100)}%</span>
                      </div>`;
                  })
                  .join("")}
              </section>`
            : ""
        }

        <div class="er-tools">
          <div class="er-tools__left">
            <span class="er-tools__count" data-er-count></span>
            <button type="button" class="er-chip" data-er-photos>
              <span class="er-chip__dot"></span>
              with pictures
            </button>
          </div>
          <div class="er-tools__right">
            <label class="er-select">
              <span class="er-sr">Sort</span>
              <select data-er-sort>
                <option value="latest">Latest</option>
                <option value="highest">Highest</option>
                <option value="lowest">Lowest</option>
              </select>
            </label>
          </div>
        </div>

        <section class="er-grid" data-er-grid aria-label="Reviews list"></section>

        <div class="er-foot">
          <button type="button" class="er-btn er-btn--ghost" data-er-more>Show more</button>
        </div>

        <div class="er-modal" hidden data-er-modal>
          <div class="er-modal__backdrop" data-er-close tabindex="-1"></div>
          <div class="er-modal__dialog" role="dialog" aria-modal="true" aria-label="Write a review">
            <div class="er-modal__head">
              <div class="er-modal__title">Write a review</div>
              <button type="button" class="er-iconbtn" data-er-close aria-label="Close">×</button>
            </div>
            <form class="er-form" data-er-form>
              <div class="er-form__row">
                <label class="er-field">
                  <span class="er-field__label">Name</span>
                  <input name="customerName" type="text" autocomplete="name" required />
                </label>
                <label class="er-field">
                  <span class="er-field__label">Email (optional)</span>
                  <input name="customerEmail" type="email" autocomplete="email" />
                </label>
              </div>
              <label class="er-field">
                <span class="er-field__label">Rating</span>
                <select name="rating" required>
                  <option value="">Select</option>
                  <option value="5">★★★★★</option>
                  <option value="4">★★★★</option>
                  <option value="3">★★★</option>
                  <option value="2">★★</option>
                  <option value="1">★</option>
                </select>
              </label>
              <label class="er-field">
                <span class="er-field__label">Title (optional)</span>
                <input name="title" type="text" />
              </label>
              <label class="er-field">
                <span class="er-field__label">Review</span>
                <textarea name="body" rows="4" required></textarea>
              </label>
              <div class="er-form__actions">
                <button type="button" class="er-btn er-btn--ghost" data-er-close>Cancel</button>
                <button type="submit" class="er-btn er-btn--primary" data-er-submit-btn>Submit review</button>
              </div>
              <input type="hidden" name="shopifyProductId" value="${escapeHtml(opts.productId || "")}" />
              <input type="hidden" name="productTitle" value="${escapeHtml(opts.productTitle || "")}" />
            </form>
          </div>
        </div>
      </div>
    `;

    const state = {
      all: Array.isArray(reviews) ? reviews.slice() : [],
      sort: defaultSort,
      withPhotos: false,
      pageSize,
      shown: 0,
    };

    const elGrid = qs(root, "[data-er-grid]");
    const elCount = qs(root, "[data-er-count]");
    const elSort = qs(root, "[data-er-sort]");
    const elPhotos = qs(root, "[data-er-photos]");
    const elMore = qs(root, "[data-er-more]");

    if (elSort) elSort.value = state.sort;

    function getFiltered() {
      const base = sortReviews(state.all, state.sort);
      const filtered = state.withPhotos ? base.filter(hasMedia) : base;
      return filtered;
    }

    function renderCount(total, shown) {
      if (!elCount) return;
      elCount.textContent = `Showing ${shown}/${total} reviews`;
    }

    function renderCards(items) {
      if (!elGrid) return;
      elGrid.insertAdjacentHTML(
        "beforeend",
        items
          .map((r) => {
            const name = r.customerName || "Customer";
            const title = r.title || "";
            const body = r.body || "";
            const productTitle = r.productTitle || "";
            const img = r.imageUrl ? `<img class="er-card__img" loading="lazy" src="${escapeHtml(r.imageUrl)}" alt="" />` : "";
            const media = img ? `<div class="er-card__media">${img}</div>` : "";
            const avatar = `<div class="er-avatar" aria-hidden="true">${escapeHtml(initials(name))}</div>`;
            const date = r.createdAt ? `<span class="er-date">${escapeHtml(formatDate(r.createdAt))}</span>` : "";

            return `
              <article class="er-card">
                ${media}
                <div class="er-card__body">
                  <div class="er-card__top">
                    <div class="er-person">
                      ${avatar}
                      <div class="er-person__meta">
                        <div class="er-person__name">${escapeHtml(name)} <span class="er-badge" title="Verified">✓</span></div>
                        <div class="er-person__sub">${date}</div>
                      </div>
                    </div>
                    <div class="er-card__rating">${renderStars(r.rating)}</div>
                  </div>
                  ${
                    title
                      ? `<div class="er-card__title">${escapeHtml(title)}</div>`
                      : ""
                  }
                  <div class="er-card__text">${escapeHtml(body)}</div>
                  ${
                    productTitle
                      ? `<div class="er-card__product">${escapeHtml(productTitle)}</div>`
                      : ""
                  }
                </div>
              </article>
            `;
          })
          .join("")
      );
    }

    function sync() {
      const filtered = getFiltered();
      const total = filtered.length;

      if (elGrid) elGrid.innerHTML = "";
      state.shown = 0;

      const next = filtered.slice(0, state.pageSize);
      state.shown = next.length;
      renderCards(next);
      renderCount(total, state.shown);

      if (elMore) elMore.hidden = state.shown >= total;
      if (elPhotos) elPhotos.classList.toggle("is-on", state.withPhotos);
    }

    function showMore() {
      const filtered = getFiltered();
      const total = filtered.length;
      const next = filtered.slice(state.shown, state.shown + state.pageSize);
      state.shown += next.length;
      renderCards(next);
      renderCount(total, state.shown);
      if (elMore) elMore.hidden = state.shown >= total;
    }

    elSort?.addEventListener("change", () => {
      state.sort = elSort.value;
      sync();
    });

    elPhotos?.addEventListener("click", () => {
      state.withPhotos = !state.withPhotos;
      sync();
    });

    elMore?.addEventListener("click", showMore);

    // Modal
    const elModal = qs(root, "[data-er-modal]");
    const btnOpen = qs(root, "[data-er-open]");
    const closeEls = qsa(root, "[data-er-close]");
    const elForm = qs(root, "[data-er-form]");
    const submitBtn = qs(root, "[data-er-submit-btn]");

    let lastFocus = null;
    function openModal() {
      if (!elModal) return;
      lastFocus = document.activeElement;
      elModal.hidden = false;
      document.documentElement.classList.add("er-modalOpen");
      const firstInput = qs(elModal, "input,select,textarea,button");
      firstInput?.focus?.();
    }

    function closeModal() {
      if (!elModal) return;
      elModal.hidden = true;
      document.documentElement.classList.remove("er-modalOpen");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    btnOpen?.addEventListener("click", openModal);
    closeEls.forEach((el) => el.addEventListener("click", closeModal));
    elModal?.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    elForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!opts.submitUrl) return;

      const fd = new FormData(elForm);
      submitBtn?.setAttribute("disabled", "disabled");
      submitBtn?.classList.add("is-loading");

      try {
        const res = await fetch(opts.submitUrl, { method: "POST", body: fd });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.success) {
          throw new Error(json?.error || "Submission failed");
        }
        makeToast(root, "Review submitted. Thank you!");
        elForm.reset();
        closeModal();
      } catch (err) {
        makeToast(root, err?.message || "Could not submit review", "error");
      } finally {
        submitBtn?.removeAttribute("disabled");
        submitBtn?.classList.remove("is-loading");
      }
    });

    sync();
  }

  function truncate(s, max) {
    const t = String(s || "");
    if (!max || t.length <= max) return t;
    const cut = t.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + "…";
  }

  function buildCardCarousel(root, data, opts) {
    const { config, reviews, stats } = data;

    const title =
      (opts.titleOverride && String(opts.titleOverride).trim()) ||
      (config && config.cardTitle) ||
      "Customers are saying";

    const accent =
      (opts.accent && String(opts.accent).trim()) ||
      (config && config.cardAccentColor) ||
      "#111111";

    const showRating = parseBool(opts.showRating, config?.cardShowRating ?? true);
    const showName = parseBool(opts.showName, config?.cardShowName ?? true);
    const showBadge = parseBool(opts.showBadge, config?.cardShowBadge ?? true);
    const showProduct = parseBool(opts.showProduct, config?.cardShowProduct ?? true);
    const maxChars = clamp(parseIntOr(opts.maxChars, config?.cardMaxChars ?? 120), 60, 260);
    const perView = clamp(parseIntOr(opts.cardsPerView, 4), 2, 6);

    root.style.setProperty("--er-accent", accent);
    root.style.setProperty("--er-cardsPerView", String(perView));

    const all = Array.isArray(reviews) ? reviews.slice() : [];
    const withImages = all.filter((r) => r.imageUrl);
    const items = (withImages.length ? withImages : all).slice(0, 24);

    root.innerHTML = `
      <div class="er-widget er-widget--card" style="--er-accent:${escapeHtml(accent)}; --er-cardsPerView:${perView};">
        <header class="er-cardCarousel__head">
          <h2 class="er-h2 er-h2--center">${escapeHtml(title)}</h2>
          <div class="er-subhead er-subhead--center">
            <div class="er-avg">
              ${showRating ? `<span class="er-avg__num">${escapeHtml(stats?.avg ?? "0.0")}</span>` : ""}
              ${showRating ? renderStars(Math.round(parseFloat(stats?.avg || "0") || 0)) : ""}
              <span class="er-avg__count">(${escapeHtml(stats?.total ?? 0)})</span>
              <span class="er-verified"><span class="er-verified__mark">✓</span> Verified</span>
            </div>
          </div>
        </header>

        <div class="er-cardCarousel" aria-label="Reviews carousel">
          <button class="er-navBtn" type="button" data-er-prev aria-label="Previous reviews">
            <span aria-hidden="true">‹</span>
          </button>

          <div class="er-cardCarousel__viewport" data-er-viewport>
            <div class="er-cardCarousel__track" data-er-track>
              ${items
                .map((r) => {
                  const text = truncate(r.body || "", maxChars);
                  const productTitle = r.productTitle || "";
                  const name = r.customerName || "Customer";
                  const img = r.imageUrl
                    ? `<img class="er-cardC__img" loading="lazy" src="${escapeHtml(r.imageUrl)}" alt="" />`
                    : `<div class="er-cardC__img er-cardC__img--empty"></div>`;

                  return `
                    <article class="er-cardC">
                      <div class="er-cardC__media">${img}</div>
                      <div class="er-cardC__body">
                        <div class="er-cardC__text">${escapeHtml(text)}</div>
                        ${showRating ? `<div class="er-cardC__rating">${renderStars(r.rating)}</div>` : ""}
                        ${
                          showName
                            ? `<div class="er-cardC__name">${escapeHtml(name)}${showBadge ? ` <span class="er-badge" title="Verified">✓</span>` : ""}</div>`
                            : ""
                        }
                        ${showProduct && productTitle ? `<div class="er-cardC__product">${escapeHtml(productTitle)}</div>` : ""}
                      </div>
                    </article>
                  `;
                })
                .join("")}
            </div>
          </div>

          <button class="er-navBtn" type="button" data-er-next aria-label="Next reviews">
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    `;

    const viewport = qs(root, "[data-er-viewport]");
    const track = qs(root, "[data-er-track]");
    const btnPrev = qs(root, "[data-er-prev]");
    const btnNext = qs(root, "[data-er-next]");

    function cardStep() {
      if (!track) return 320;
      const first = track.querySelector(".er-cardC");
      if (!first) return 320;
      const rect = first.getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || "0") || 0;
      return rect.width + gap;
    }

    function scrollByCards(dir) {
      if (!viewport) return;
      const step = cardStep();
      viewport.scrollBy({ left: dir * step, behavior: "smooth" });
    }

    function syncNav() {
      if (!viewport || !btnPrev || !btnNext) return;
      const max = viewport.scrollWidth - viewport.clientWidth - 1;
      btnPrev.disabled = viewport.scrollLeft <= 0;
      btnNext.disabled = viewport.scrollLeft >= max;
    }

    btnPrev?.addEventListener("click", () => scrollByCards(-1));
    btnNext?.addEventListener("click", () => scrollByCards(1));
    viewport?.addEventListener("scroll", () => window.requestAnimationFrame(syncNav), { passive: true });
    window.setTimeout(syncNav, 0);
    window.addEventListener("resize", () => window.requestAnimationFrame(syncNav), { passive: true });
  }

  function buildFanCarousel(root, data, opts) {
    const { config, reviews, stats } = data;

    const title =
      (opts.titleOverride && String(opts.titleOverride).trim()) ||
      (config && config.fanTitle) ||
      "Real customer stories";

    const accent =
      (opts.accent && String(opts.accent).trim()) ||
      (config && config.fanAccentColor) ||
      "#111111";

    const showRating = parseBool(opts.showRating, config?.fanShowRating ?? true);
    const showName = parseBool(opts.showName, config?.fanShowName ?? true);
    const showBadge = parseBool(opts.showBadge, config?.fanShowBadge ?? true);

    root.style.setProperty("--er-accent", accent);
    root.style.setProperty("--er-fanPerView", "5");

    const all = Array.isArray(reviews) ? reviews.slice() : [];
    const withImages = all.filter((r) => r.imageUrl);
    const items = (withImages.length ? withImages : all).slice(0, 18);

    root.innerHTML = `
      <div class="er-widget er-widget--fan" style="--er-accent:${escapeHtml(accent)};">
        <header class="er-fan__head">
          <h2 class="er-h2 er-h2--center">${escapeHtml(title)}</h2>
          <div class="er-subhead er-subhead--center">
            <div class="er-avg">
              ${showRating ? `${renderStars(Math.round(parseFloat(stats?.avg || "0") || 0))}` : ""}
              <span class="er-avg__count">${escapeHtml(stats?.avg ?? "0.0")} (${escapeHtml(stats?.total ?? 0)})</span>
              <span class="er-verified"><span class="er-verified__mark">✓</span> Verified</span>
            </div>
          </div>
        </header>

        <div class="er-fan" aria-label="Customer photo reviews">
          <button class="er-navBtn er-navBtn--ghost" type="button" data-er-prev aria-label="Previous">
            <span aria-hidden="true">‹</span>
          </button>

          <div class="er-fan__viewport" data-er-viewport>
            <div class="er-fan__track" data-er-track>
              ${items
                .map((r, idx) => {
                  const name = r.customerName || "Customer";
                  const img = r.imageUrl
                    ? `<img class="er-fanCard__img" loading="lazy" src="${escapeHtml(r.imageUrl)}" alt="" />`
                    : `<div class="er-fanCard__img er-fanCard__img--empty"></div>`;

                  return `
                    <article class="er-fanCard ${idx === 0 ? "is-center" : ""}" data-er-card>
                      <div class="er-fanCard__media">${img}</div>
                      <div class="er-fanCard__shade"></div>
                      <div class="er-fanCard__cap">
                        ${showRating ? `<div class="er-fanCard__stars">${renderStars(r.rating)}</div>` : ""}
                        ${
                          showName
                            ? `<div class="er-fanCard__name">${escapeHtml(name)}${showBadge ? ` <span class="er-badge er-badge--onDark" title="Verified">✓</span>` : ""}</div>`
                            : ""
                        }
                      </div>
                    </article>
                  `;
                })
                .join("")}
            </div>
          </div>

          <button class="er-navBtn er-navBtn--ghost" type="button" data-er-next aria-label="Next">
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    `;

    const viewport = qs(root, "[data-er-viewport]");
    const track = qs(root, "[data-er-track]");
    const btnPrev = qs(root, "[data-er-prev]");
    const btnNext = qs(root, "[data-er-next]");

    function cards() {
      return track ? qsa(track, "[data-er-card]") : [];
    }

    function centerIndex() {
      if (!viewport || !track) return;
      const list = cards();
      if (list.length === 0) return 0;

      const centerX = viewport.scrollLeft + viewport.clientWidth / 2;
      let best = null;
      let bestDist = Infinity;
      let bestIdx = 0;

      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        const left = c.offsetLeft;
        const mid = left + c.offsetWidth / 2;
        const dist = Math.abs(mid - centerX);
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
          bestIdx = i;
        }
      }

      list.forEach((c, i) => {
        const dist = Math.abs(i - bestIdx);
        c.classList.toggle("is-center", dist === 0);
        c.classList.toggle("is-near", dist === 1);
      });

      if (btnPrev && btnNext) {
        const max = viewport.scrollWidth - viewport.clientWidth - 1;
        btnPrev.disabled = viewport.scrollLeft <= 0;
        btnNext.disabled = viewport.scrollLeft >= max;
      }

      return bestIdx;
    }

    function scrollToIdx(idx) {
      if (!viewport || !track) return;
      const list = cards();
      const target = list[clamp(idx, 0, list.length - 1)];
      if (!target) return;
      const left = target.offsetLeft - (viewport.clientWidth - target.offsetWidth) / 2;
      viewport.scrollTo({ left, behavior: "smooth" });
    }

    btnPrev?.addEventListener("click", () => scrollToIdx(centerIndex() - 1));
    btnNext?.addEventListener("click", () => scrollToIdx(centerIndex() + 1));
    viewport?.addEventListener("scroll", () => window.requestAnimationFrame(centerIndex), { passive: true });
    window.setTimeout(() => {
      // Start near the first “hero” position.
      scrollToIdx(2);
      window.setTimeout(() => centerIndex(), 50);
    }, 0);
    window.addEventListener("resize", () => window.requestAnimationFrame(centerIndex), { passive: true });
  }

  async function initRoot(root) {
    if (root.__erInited) return;
    root.__erInited = true;

    const endpoint = root.getAttribute("data-er-endpoint") || "";
    const widget = root.getAttribute("data-er-widget") || "main";
    const submitUrl = root.getAttribute("data-er-submit") || "";
    const titleOverride = root.getAttribute("data-er-title-override") || "";

    const accent = root.getAttribute("data-er-accent") || "";
    const showBreakdown = root.getAttribute("data-er-show-breakdown");
    const showWrite = root.getAttribute("data-er-show-write");
    const defaultSort = root.getAttribute("data-er-default-sort") || "latest";
    const pageSize = root.getAttribute("data-er-page-size") || "20";

    const productId = root.getAttribute("data-er-product-id") || "";
    const productTitle = root.getAttribute("data-er-product-title") || "";

    const showRating = root.getAttribute("data-er-show-rating");
    const showName = root.getAttribute("data-er-show-name");
    const showBadge = root.getAttribute("data-er-show-badge");
    const showProduct = root.getAttribute("data-er-show-product");
    const maxChars = root.getAttribute("data-er-max-chars") || "";
    const cardsPerView = root.getAttribute("data-er-cards-per-view") || "";

    if (!endpoint) {
      root.innerHTML = `<div class="er-widget er-widget--main"><div class="er-empty">Missing widget endpoint.</div></div>`;
      return;
    }

    try {
      const res = await fetch(endpoint, { method: "GET", headers: { Accept: "application/json" } });
      const data = await res.json();
      if (!res.ok || data?.error) throw new Error(data?.error || "Failed to load reviews");

      if (widget === "card") {
        buildCardCarousel(root, data, {
          titleOverride,
          accent,
          showRating,
          showName,
          showBadge,
          showProduct,
          maxChars,
          cardsPerView,
        });
      } else if (widget === "fan") {
        buildFanCarousel(root, data, {
          titleOverride,
          accent,
          showRating,
          showName,
          showBadge,
        });
      } else {
        buildMainWidget(root, data, {
          submitUrl,
          titleOverride,
          accent,
          showBreakdown,
          showWrite,
          defaultSort,
          pageSize,
          productId,
          productTitle,
        });
      }
    } catch (err) {
      root.innerHTML = `
        <div class="er-widget er-widget--main">
          <div class="er-empty">
            <div class="er-empty__title">Could not load reviews</div>
            <div class="er-empty__sub">${escapeHtml(err?.message || "Please try again later.")}</div>
          </div>
        </div>
      `;
    }
  }

  function boot() {
    const roots = qsa(document, ".er-root[data-er-widget='main'], .er-root[data-er-widget='card'], .er-root[data-er-widget='fan']");
    if (roots.length === 0) return;

    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              for (const e of entries) {
                if (e.isIntersecting) {
                  io.unobserve(e.target);
                  initRoot(e.target);
                }
              }
            },
            { rootMargin: "200px 0px" }
          )
        : null;

    roots.forEach((r) => (io ? io.observe(r) : initRoot(r)));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.EdgeReviews = window.EdgeReviews || {};
  window.EdgeReviews[NS] = { boot };
})();

