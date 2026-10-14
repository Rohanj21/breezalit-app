// Shop Page — Industry-level with GSAP animations
import { getProducts, getCategories, formatPrice, formatRegularPrice, getDiscountPercent, proxyImageUrl } from "../api";
import type { Product, Category } from "../api";
import { animateCards, animateChips } from "../animations";
import { wishAttrs, wishClass } from "../wishlist-store";
import gsap from "gsap";

let categories: Category[] = [];
let currentCat: number | undefined;
let currentPage = 1;
let requestId = 0;
let loadingMore = false;
let allLoaded = false;
let currentSort = "date";

function productCard(product: Product): string {
  const img = product.images.length > 0 ? proxyImageUrl(product.images[0].src) : "";
  const cat = product.categories.length > 0 ? product.categories[0].name : "";
  const rating = parseFloat(product.average_rating) || 5;
  const fullStars = Math.round(rating);
  const stars = "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
  const discount = getDiscountPercent(product.prices);

  return `
    <a href="#/product/${product.id}" class="product-card">
      ${product.on_sale ? `<span class="badge-sale">${discount > 0 ? `-${discount}%` : "SALE"}</span>` : ""}
      <div class="card-wishlist${wishClass(product.id)}" role="button" aria-label="Save to wishlist" ${wishAttrs(product)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </div>
      <div class="card-img-wrap">
        <img src="${img}" alt="${product.name}" loading="lazy" />
      </div>
      <div class="card-body">
        <span class="card-category">${cat.toUpperCase()}</span>
        <h3 class="card-title">${product.name}</h3>
        <div class="card-rating">
          <span class="stars">${stars}</span>
          <span class="rating-val">${rating.toFixed(1)}</span>
          <span class="review-count">(${product.review_count})</span>
        </div>
        <div class="card-price">
          ${product.on_sale ? `<span class="price-old">${formatRegularPrice(product.prices)}</span>` : ""}
          <span class="price-current">${formatPrice(product.prices)}</span>
        </div>
      </div>
    </a>
  `;
}

function skeletonGrid(count = 6): string {
  return Array(count).fill(`
    <div class="product-card skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="card-body">
        <div class="skeleton skeleton-line-xs"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line-sm"></div>
        <div class="skeleton skeleton-line-sm"></div>
      </div>
    </div>
  `).join("");
}

export async function renderShop(_params: Record<string, string>): Promise<string> {
  const hashParts = window.location.hash.split("?");
  const sp = new URLSearchParams(hashParts[1] || "");
  const catFromUrl = sp.get("cat");
  currentCat = undefined;
  if (catFromUrl) {
    if (/^\d+$/.test(catFromUrl)) {
      currentCat = parseInt(catFromUrl);
    } else {
      // Slug (e.g. from the size guide) — resolve to a category ID; fall back to "all"
      try {
        const cats = await getCategories();
        currentCat = cats.find((c) => c.slug === catFromUrl)?.id;
      } catch { /* show all products */ }
    }
  }
  currentPage = 1;
  allLoaded = false;
  currentSort = "date";
  loadingMore = false;
  requestId++; // invalidate any in-flight request from a previous visit

  return `
    <div class="shop-page">
      <!-- Shop Hero Banner -->
      <div class="shop-hero-banner">
        <div class="shop-hero-bg">
          <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80&auto=format" alt="Premium Fans" loading="eager" />
          <div class="shop-hero-overlay"></div>
        </div>
        <div class="shop-hero-content">
          <span class="shop-hero-badge">PREMIUM COLLECTION</span>
          <h1 class="shop-hero-title">Shop</h1>
          <p class="shop-hero-subtitle">Discover our premium range of fans for every room</p>
        </div>
      </div>

      <!-- ★ Premium Animated Discount Banner ★ -->
      <div class="discount-banner" id="shop-discount-banner">
        <!-- Animated background particles -->
        <div class="discount-particles" aria-hidden="true">
          <span class="d-particle p1"></span>
          <span class="d-particle p2"></span>
          <span class="d-particle p3"></span>
          <span class="d-particle p4"></span>
          <span class="d-particle p5"></span>
          <span class="d-particle p6"></span>
        </div>

        <!-- Decorative SVG shapes -->
        <svg class="discount-shape ds-1" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" stroke-dasharray="8 6"/></svg>
        <svg class="discount-shape ds-2" viewBox="0 0 60 60" aria-hidden="true"><polygon points="30,2 58,22 48,56 12,56 2,22" fill="none" stroke="rgba(242,101,34,0.15)" stroke-width="1.5"/></svg>

        <!-- Content -->
        <div class="discount-content">
          <div class="discount-left">
            <div class="discount-percent-wrap">
              <span class="discount-percent" id="discount-num">20</span>
              <span class="discount-percent-sign">%</span>
            </div>
            <span class="discount-off-label">OFF</span>
          </div>

          <div class="discount-right">
            <span class="discount-eyebrow">🔥 LIMITED TIME OFFER</span>
            <h3 class="discount-headline">Monsoon Sale<br>Is Here!</h3>
            <p class="discount-subtext">On all premium BLDC fans. Use code <strong class="discount-code">MONSOON20</strong></p>
            <a href="#/shop" class="discount-cta">
              Shop Now
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>
        </div>

        <!-- Running shimmer line -->
        <div class="discount-shimmer"></div>
      </div>

      <!-- Sort & Filter Bar -->
      <div class="filter-bar">
        <div class="filter-sort">
          <span class="filter-label">Sort by:</span>
          <select id="shop-sort" class="sort-select">
            <option value="date">Newest</option>
            <option value="price">Price: Low to High</option>
            <option value="rating">Top Rated</option>
            <option value="popularity">Popularity</option>
          </select>
        </div>
        <div class="filter-view">
          <button class="view-btn active" data-view="grid" aria-label="Grid view">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </button>
          <button class="view-btn" data-view="list" aria-label="List view">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- Category Tabs -->
      <div class="cat-tabs-wrap">
        <div class="cat-tabs" id="shop-cats">
          <button class="cat-tab active" data-cat="all">All Products</button>
        </div>
      </div>

      <!-- Product Grid -->
      <div class="product-grid" id="shop-grid">${skeletonGrid()}</div>

      <!-- Load More -->
      <div class="load-more" id="shop-more" style="display:none">
        <button class="btn-load-more" id="btn-more">
          <span>Load More Products</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>

      <!-- Results count -->
      <div class="results-info" id="results-info"></div>
    </div>
  `;
}

export function onShopMount() {
  // ★ Shop Hero Banner GSAP entrance
  gsap.fromTo(".shop-hero-bg img",
    { scale: 1.15, filter: "brightness(0.5)" },
    { scale: 1, filter: "brightness(1)", duration: 1.8, ease: "power2.out" }
  );
  gsap.fromTo(".shop-hero-badge, .shop-hero-title, .shop-hero-subtitle",
    { opacity: 0, y: 25 },
    { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "power3.out", delay: 0.3 }
  );

  // ★ Advanced Discount Banner GSAP Animations
  const discountBanner = document.getElementById("shop-discount-banner");
  if (discountBanner) {
    const tl = gsap.timeline({ delay: 0.4 });

    // 1. Banner entrance — scale + fade with elastic pop
    tl.fromTo(discountBanner,
      { opacity: 0, scale: 0.92, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: "back.out(1.4)" }
    );

    // 2. Discount number count-up from 0 → 20
    const numEl = document.getElementById("discount-num");
    if (numEl) {
      const counter = { val: 0 };
      tl.to(counter, {
        val: 20, duration: 1.2, ease: "power2.out",
        onUpdate: () => { numEl.textContent = Math.round(counter.val).toString(); }
      }, "-=0.3");
    }

    // 3. Content stagger — eyebrow, headline, subtext, CTA
    tl.fromTo(".discount-eyebrow, .discount-headline, .discount-subtext, .discount-cta",
      { opacity: 0, x: 20 },
      { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: "power3.out" },
      "-=0.8"
    );

    // 4. OFF label pop-in
    tl.fromTo(".discount-off-label",
      { opacity: 0, scale: 0, rotation: -20 },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2)" },
      "-=0.6"
    );

    // 5. Percent sign bounce
    tl.fromTo(".discount-percent-sign",
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.4, ease: "bounce.out" },
      "-=0.4"
    );

    // 6. Coupon code highlight flash
    tl.fromTo(".discount-code",
      { backgroundSize: "0% 100%" },
      { backgroundSize: "100% 100%", duration: 0.6, ease: "power2.out" },
      "-=0.2"
    );

    // ── Infinite ambient animations ──

    // Floating particles — randomized drift paths
    document.querySelectorAll(".d-particle").forEach((p, i) => {
      gsap.set(p, { x: 0, y: 0 });
      gsap.to(p, {
        y: -60 - Math.random() * 40,
        x: (i % 2 === 0 ? 1 : -1) * (20 + Math.random() * 30),
        opacity: 0,
        duration: 2 + Math.random() * 2,
        repeat: -1,
        delay: Math.random() * 2,
        ease: "power1.out"
      });
    });

    // Rotating dashed circle
    gsap.to(".discount-shape.ds-1", {
      rotation: 360, duration: 20, repeat: -1, ease: "none",
      transformOrigin: "center center"
    });

    // Pulsing pentagon
    gsap.to(".discount-shape.ds-2", {
      rotation: -360, scale: 1.15,
      duration: 15, repeat: -1, yoyo: true, ease: "sine.inOut",
      transformOrigin: "center center"
    });

    // Shimmer sweep — infinite diagonal light sweep across the banner
    gsap.to(".discount-shimmer", {
      x: "400%", duration: 3, repeat: -1, repeatDelay: 2, ease: "power2.inOut"
    });

    // CTA button subtle pulse glow
    gsap.to(".discount-cta", {
      boxShadow: "0 0 20px rgba(242,101,34,0.6), 0 0 40px rgba(242,101,34,0.2)",
      duration: 1.2, repeat: -1, yoyo: true, ease: "sine.inOut"
    });
  }

  fetchCategories();
  loadProducts(true);

  // Sort handler
  document.getElementById("shop-sort")?.addEventListener("change", (e) => {
    currentSort = (e.target as HTMLSelectElement).value;
    currentPage = 1;
    allLoaded = false;
    loadProducts(true);
  });

  // Load more
  document.getElementById("btn-more")?.addEventListener("click", () => {
    currentPage++;
    loadProducts(false);
  });

  // View toggle
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const grid = document.getElementById("shop-grid");
      if (!grid) return;
      const view = (btn as HTMLElement).dataset.view;
      grid.classList.toggle("list-view", view === "list");
    });
  });
}

async function fetchCategories() {
  try {
    categories = await getCategories();
    const catsEl = document.getElementById("shop-cats");
    if (!catsEl) return;

    catsEl.innerHTML =
      `<button class="cat-tab ${!currentCat ? "active" : ""}" data-cat="all">All Products</button>` +
      categories
        .filter((c) => c.count > 0)
        .map(
          (c) =>
            `<button class="cat-tab ${currentCat === c.id ? "active" : ""}" data-cat="${c.id}">
              ${c.name} <span class="cat-count">${c.count}</span>
            </button>`
        )
        .join("");

    animateChips(".cat-tab");

    catsEl.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest(".cat-tab") as HTMLElement;
      if (!target) return;
      catsEl.querySelectorAll(".cat-tab").forEach((t) => t.classList.remove("active"));
      target.classList.add("active");
      const catId = target.dataset.cat;
      currentCat = catId === "all" ? undefined : parseInt(catId!);
      currentPage = 1;
      allLoaded = false;
      loadProducts(true);
    });
  } catch (err) {
    console.error("Category fetch error:", err);
  }
}

async function loadProducts(replace: boolean) {
  if (!replace && (allLoaded || loadingMore)) return;
  const myRequest = ++requestId;
  loadingMore = !replace;

  const grid = document.getElementById("shop-grid");
  const moreWrap = document.getElementById("shop-more");

  if (replace && grid) {
    grid.innerHTML = skeletonGrid();
  }

  try {
    const products = await getProducts(currentCat, currentPage, 10, currentSort);
    if (myRequest !== requestId) return; // filter/sort changed or page left while loading
    loadingMore = false;

    if (grid) {
      const html = products.map(productCard).join("");
      if (replace) {
        grid.innerHTML = html;
        // GSAP staggered reveal
        animateCards("#shop-grid .product-card", 0.06);
      } else {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        const newCards = Array.from(tempDiv.children);
        newCards.forEach((card) => {
          grid.appendChild(card);
          gsap.fromTo(
            card,
            { opacity: 0, y: 40, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power2.out" }
          );
        });
      }
    }

    if (products.length < 10) {
      allLoaded = true;
    }

    if (moreWrap) {
      moreWrap.style.display = allLoaded ? "none" : "flex";
    }

    // Results info
    const info = document.getElementById("results-info");
    if (info) {
      const total = grid?.querySelectorAll(".product-card:not(.skeleton-card)").length || 0;
      info.textContent = `Showing ${total} products`;
    }
  } catch (err) {
    console.error("Load error:", err);
    if (myRequest !== requestId) return;
    loadingMore = false;
    if (currentPage > 1) currentPage--;
    if (grid && replace) {
      grid.innerHTML = `<div class="error-state"><p>⚠️ Could not load products. Ensure Live Link is active.</p></div>`;
    }
  }
}
