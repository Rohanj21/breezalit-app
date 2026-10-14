import { getProducts, getCategories, formatPrice, getDiscountPercent, proxyImageUrl } from "../api";
import type { Product } from "../api";
import { openSizeGuide } from "../size-guide";
import { wishAttrs, wishClass } from "../wishlist-store";
import gsap from "gsap";
import {
  animateTrustBadges,
  animateWhyCards,
  animatePromoBanner,
  initHeroCarousel,
  animateAmbientShapes,
} from "../animations";

function productScrollerCard(product: Product): string {
  const img = product.images.length > 0 ? proxyImageUrl(product.images[0].src) : "";
  const cat = product.categories.length > 0 ? product.categories[0].name : "";
  const rating = parseFloat(product.average_rating) || 5;
  const discount = getDiscountPercent(product.prices);

  return `
    <a href="#/product/${product.id}" class="scroller-card">
      <div class="scroller-card-img-wrap">
        ${product.on_sale ? `<span class="badge-sale-small">-${discount}%</span>` : ""}
        <img src="${img}" alt="${product.name}" loading="lazy" />
        <button class="scroller-wishlist${wishClass(product.id)}" type="button" aria-label="Save to wishlist" ${wishAttrs(product)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
      <div class="scroller-card-body">
        <span class="scroller-cat">${cat} • ★ ${rating.toFixed(1)}</span>
        <h3 class="scroller-title">${product.name}</h3>
        <div class="scroller-price">
          <span class="price-current">${formatPrice(product.prices)}</span>
        </div>
      </div>
    </a>
  `;
}

function scrollerSkeleton(count = 3): string {
  return Array(count).fill(`
    <div class="scroller-card skeleton-card">
      <div class="skeleton scroller-card-img-wrap"></div>
      <div class="scroller-card-body">
        <div class="skeleton skeleton-line-xs"></div>
        <div class="skeleton skeleton-line-sm"></div>
        <div class="skeleton skeleton-line-sm"></div>
      </div>
    </div>
  `).join("");
}

export async function renderHome(): Promise<string> {
  return `
    <div class="home-premium">
        <!-- ★ HERO AUTO-SCROLLING CAROUSEL ★ -->
        <section class="hero-carousel" id="hero-carousel">
            <!-- Ambient floating SVG shapes -->
            <div class="hero-ambient-shapes" aria-hidden="true">
                <svg class="hero-shape shape-1" viewBox="0 0 200 200"><circle cx="100" cy="100" r="80" fill="rgba(242,101,34,0.08)"/></svg>
                <svg class="hero-shape shape-2" viewBox="0 0 200 200"><path d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.1,-46.3C90.4,-33.5,96.1,-18,97.4,-2.2C98.8,13.6,95.8,29.9,86.6,42.8C77.4,55.7,62,65.3,47.1,73.4C32.1,81.5,17.6,88.1,2.8,83.4C-12.1,78.7,-27.6,62.8,-41.8,50.8C-56,38.8,-68.9,30.8,-76.9,18.4C-84.9,6,-88,-10.8,-82.5,-24.5C-76.9,-38.2,-62.7,-48.8,-48.9,-56.3C-35.1,-63.8,-21.7,-68.2,-6.6,-57.4C8.4,-46.6,22.8,-20.5,30.5,-83.5L44.7,-76.4Z" transform="translate(100 100)" fill="rgba(255,255,255,0.06)"/></svg>
                <svg class="hero-shape shape-3" viewBox="0 0 200 200"><polygon points="100,10 190,60 190,140 100,190 10,140 10,60" fill="rgba(242,101,34,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/></svg>
            </div>

            <!-- Slide 1 -->
            <div class="hero-slide active" data-slide="0">
                <div class="hero-slide-bg">
                    <img src="https://idcletech.com/wp-content/uploads/2026/08/Banner.png" alt="Smart Cooling" loading="eager" />
                    <div class="hero-slide-overlay"></div>
                </div>
                <div class="hero-slide-content">
                    <span class="hero-eyebrow">BREEZALIT EXCLUSIVE</span>
                    <h1 class="hero-headline">Smart Cooling<br>For Modern Living</h1>
                    <p class="hero-subline">Experience whisper-quiet luxury and energy efficient BLDC technology.</p>
                    <a href="#/shop" class="btn-primary-pill hero-btn">Explore Collection <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
                </div>
            </div>

            <!-- Slide 2 -->
            <div class="hero-slide" data-slide="1">
                <div class="hero-slide-bg">
                    <img src="https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80&auto=format" alt="Premium Technology" loading="lazy" />
                    <div class="hero-slide-overlay"></div>
                </div>
                <div class="hero-slide-content">
                    <span class="hero-eyebrow">PREMIUM TECHNOLOGY</span>
                    <h1 class="hero-headline">65% Energy<br>Savings Guaranteed</h1>
                    <p class="hero-subline">BLDC motors that deliver powerful airflow while cutting your electricity bills.</p>
                    <a href="#/shop" class="btn-primary-pill hero-btn">Shop BLDC Fans <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
                </div>
            </div>

            <!-- Slide 3 -->
            <div class="hero-slide" data-slide="2">
                <div class="hero-slide-bg">
                    <img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80&auto=format" alt="Indian Homes" loading="lazy" />
                    <div class="hero-slide-overlay"></div>
                </div>
                <div class="hero-slide-content">
                    <span class="hero-eyebrow">CRAFTED FOR INDIA</span>
                    <h1 class="hero-headline">Designed For<br>Indian Homes</h1>
                    <p class="hero-subline">Premium ceiling fans engineered for India's climate — silent, powerful, beautiful.</p>
                    <a href="#/shop" class="btn-primary-pill hero-btn">View Collection <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
                </div>
            </div>

            <!-- Dot indicators -->
            <div class="hero-dots">
                <button class="hero-dot active" data-dot="0" aria-label="Slide 1"></button>
                <button class="hero-dot" data-dot="1" aria-label="Slide 2"></button>
                <button class="hero-dot" data-dot="2" aria-label="Slide 3"></button>
            </div>
        </section>

        <!-- ★ FLOATING SHORTCUT BAR ★ -->
        <section class="shortcut-bar" id="shortcut-bar">
          <a href="#/shop" class="sc-item">
            <span class="sc-icon">🛍️</span>
            <span class="sc-label">Shop</span>
          </a>
          <a href="#/compare" class="sc-item">
            <span class="sc-icon">⚖️</span>
            <span class="sc-label">Compare</span>
          </a>
          <button class="sc-item" id="sc-size-guide">
            <span class="sc-icon">📐</span>
            <span class="sc-label">Size Guide</span>
          </button>
          <a href="#/rewards" class="sc-item">
            <span class="sc-icon">🏆</span>
            <span class="sc-label">Rewards</span>
          </a>
          <a href="#/tracking" class="sc-item">
            <span class="sc-icon">📦</span>
            <span class="sc-label">Track</span>
          </a>
        </section>

        <!-- ★ Trust Badges Row ★ -->
        <section class="trust-row">
          <div class="trust-badge">
            <div class="trust-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="trust-text">
              <span class="trust-num">100K+</span>
              <span class="trust-label">Happy Users</span>
            </div>
          </div>
          <div class="trust-badge">
            <div class="trust-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div class="trust-text">
              <span class="trust-num">4.8★</span>
              <span class="trust-label">Avg Rating</span>
            </div>
          </div>
          <div class="trust-badge">
            <div class="trust-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </div>
            <div class="trust-text">
              <span class="trust-num">Free</span>
              <span class="trust-label">Delivery</span>
            </div>
          </div>
        </section>

        <!-- ★ FAN FINDER CTA ★ -->
        <section class="fan-finder-cta-section" id="fan-finder-cta">
          <button class="fan-finder-cta" id="open-fan-finder" type="button">
            <div class="fan-finder-cta-icon" aria-hidden="true">🎯</div>
            <div class="fan-finder-cta-text">
              <h3>Find Your Perfect Fan</h3>
              <p>Take our 30-sec quiz for top matches</p>
            </div>
            <div class="fan-finder-cta-arrow" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </button>
        </section>

        <!-- Modern Horizontal Categories -->
        <section class="home-section">
            <div class="section-header">
                <h2>Browse by Category</h2>
            </div>
            <div class="modern-categories-scroll" id="home-cats">
                <div class="skeleton-chip-lg"></div>
                <div class="skeleton-chip-lg"></div>
                <div class="skeleton-chip-lg"></div>
            </div>
        </section>

        <!-- Horizontal Scroller: Featured -->
        <section class="home-section">
            <div class="section-header">
                <h2>Featured Products</h2>
                <a href="#/shop" class="link-see-all">See All</a>
            </div>
            <div class="horizontal-scroller" id="home-featured">
                ${scrollerSkeleton(3)}
            </div>
        </section>

        <!-- ★ Lifestyle Banner ★ -->
        <section class="lifestyle-banner" id="lifestyle-banner">
          <div class="lifestyle-bg">
            <img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80&auto=format" alt="Modern Living Room" loading="lazy" />
            <div class="lifestyle-overlay"></div>
          </div>
          <div class="lifestyle-content">
            <span class="lifestyle-eyebrow">CRAFTED FOR COMFORT</span>
            <h2 class="lifestyle-heading">Designed For<br>Indian Homes</h2>
            <p class="lifestyle-sub">Premium BLDC ceiling fans engineered for India's climate — silent, powerful, beautiful.</p>
            <a href="#/shop" class="btn-white-pill lifestyle-cta">Shop Collection →</a>
          </div>
        </section>

        <!-- ★ Why Choose Us ★ -->
        <section class="home-section why-section">
          <div class="section-header">
            <h2>Why Choose Breezalit</h2>
          </div>
          <div class="why-grid">
            <div class="why-card gsap-why-card">
              <div class="why-icon-wrap" style="background: linear-gradient(135deg, rgba(113, 177, 217, 0.15), rgba(113, 177, 217, 0.05)); color: #5a9bc0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                <div class="icon-glow" style="background: #71b1d9;"></div>
              </div>
              <div class="why-content">
                <h3>BLDC Technology</h3>
                <p>Save up to 65% on electricity with our brushless DC motors.</p>
              </div>
            </div>
            <div class="why-card gsap-why-card">
              <div class="why-icon-wrap" style="background: linear-gradient(135deg, rgba(242, 138, 34, 0.15), rgba(242, 138, 34, 0.05)); color: #e67e1a;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                <div class="icon-glow" style="background: #f28a22;"></div>
              </div>
              <div class="why-content">
                <h3>Whisper Quiet</h3>
                <p>Ultra-silent operation for undisturbed sleep and relaxation.</p>
              </div>
            </div>
            <div class="why-card gsap-why-card">
              <div class="why-icon-wrap" style="background: linear-gradient(135deg, rgba(72, 187, 120, 0.15), rgba(72, 187, 120, 0.05)); color: #3ba465;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <div class="icon-glow" style="background: #48bb78;"></div>
              </div>
              <div class="why-content">
                <h3>5 Year Warranty</h3>
                <p>Industry-leading warranty with nationwide service support.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Sleek Dark Promo Banner -->
        <section class="modern-promo-banner gsap-promo-banner">
            <div class="promo-content-wrapper">
                <h3 class="promo-title">Upgrade Your Space<br><span class="highlight">Save 25% instantly.</span></h3>
                <p class="promo-text">On orders above ₹20,000</p>
                <a href="#/shop" class="btn-white-pill promo-cta">Grab the Offer</a>
            </div>
            <div class="promo-decoration promo-anim-shape">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <path fill="var(--primary)" fill-opacity="0.2" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.1,-46.3C90.4,-33.5,96.1,-18,97.4,-2.2C98.8,13.6,95.8,29.9,86.6,42.8C77.4,55.7,62,65.3,47.1,73.4C32.1,81.5,17.6,88.1,2.8,83.4C-12.1,78.7,-27.6,62.8,-41.8,50.8C-56,38.8,-68.9,30.8,-76.9,18.4C-84.9,6,-88,-10.8,-82.5,-24.5C-76.9,-38.2,-62.7,-48.8,-48.9,-56.3C-35.1,-63.8,-21.7,-68.2,-6.6,-57.4C8.4,-46.6,22.8,-20.5,30.5,-83.5L44.7,-76.4Z" transform="translate(100 100)" />
                </svg>
            </div>
            <div class="promo-backdrop"></div>
        </section>

        <!-- Horizontal Scroller: New Arrivals -->
        <section class="home-section">
            <div class="section-header">
                <h2>New Arrivals</h2>
                <a href="#/shop" class="link-see-all">See All</a>
            </div>
            <div class="horizontal-scroller" id="home-new">
                ${scrollerSkeleton(3)}
            </div>
        </section>

        <!-- ★ BREEZALIT IN NUMBERS ★ -->
        <section class="home-section stats-section" id="stats-section">
          <div class="section-header">
            <h2>Breezalit in Numbers</h2>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-number" data-target="50000">0</span>
              <span class="stat-suffix">+</span>
              <p class="stat-label">Fans Shipped</p>
            </div>
            <div class="stat-card">
              <span class="stat-number" data-target="4.8" data-decimal="true">0</span>
              <span class="stat-suffix">★</span>
              <p class="stat-label">Avg Rating</p>
            </div>
            <div class="stat-card">
              <span class="stat-number" data-target="200">0</span>
              <span class="stat-suffix">+</span>
              <p class="stat-label">Cities Served</p>
            </div>
            <div class="stat-card">
              <span class="stat-number" data-target="65">0</span>
              <span class="stat-suffix">%</span>
              <p class="stat-label">Energy Saved</p>
            </div>
          </div>
        </section>

        <!-- ★ Testimonials (3D) ★ -->
        <section class="home-section testimonial-section" id="testimonials-3d">
          <div class="section-header">
            <h2>What Our Customers Say</h2>
          </div>
          <div class="horizontal-scroller testimonial-scroller-3d" id="home-testimonials">
            <div class="testimonial-card-3d">
              <div class="tcard-inner">
                <div class="testimonial-stars">★★★★★</div>
                <p class="testimonial-quote">"The Caspia BLDC fan is a game changer. Incredible airflow with barely any noise. My electricity bill dropped noticeably!"</p>
                <div class="testimonial-author">
                  <div class="testimonial-avatar">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" alt="Reviewer" loading="lazy" />
                  </div>
                  <div class="testimonial-info">
                    <span class="testimonial-name">Aditya Sharma</span>
                    <span class="testimonial-loc">Mumbai, India</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="testimonial-card-3d">
              <div class="tcard-inner">
                <div class="testimonial-stars">★★★★★</div>
                <p class="testimonial-quote">"Beautiful design that complements our modern interiors. The remote control and timer feature are super convenient."</p>
                <div class="testimonial-author">
                  <div class="testimonial-avatar">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" alt="Reviewer" loading="lazy" />
                  </div>
                  <div class="testimonial-info">
                    <span class="testimonial-name">Priya Patel</span>
                    <span class="testimonial-loc">Bangalore, India</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="testimonial-card-3d">
              <div class="tcard-inner">
                <div class="testimonial-stars">★★★★★</div>
                <p class="testimonial-quote">"Installed 3 Breezalit fans across my home. The build quality is exceptional and the warranty gives peace of mind."</p>
                <div class="testimonial-author">
                  <div class="testimonial-avatar">
                    <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face" alt="Reviewer" loading="lazy" />
                  </div>
                  <div class="testimonial-info">
                    <span class="testimonial-name">Vikram Singh</span>
                    <span class="testimonial-loc">Delhi, India</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Minimalist Newsletter Card -->
        <section class="modern-newsletter">
            <div class="newsletter-card">
                <div class="newsletter-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <h2>Join the Breezalit Club</h2>
                <p>Unlock exclusive deals, early access to new fans, and insider tips.</p>
                <div class="newsletter-input-group">
                    <input type="email" id="newsletter-email" placeholder="Enter your email" autocomplete="email" />
                    <button class="btn-subscribe" id="newsletter-join" type="button">Join</button>
                </div>
            </div>
        </section>
    </div>
  `;
}

export function onHomeMount() {
  // ★ Initialize the GSAP-powered auto-scrolling hero carousel
  initHeroCarousel();

  // ★ Start ambient floating SVG shape animations
  animateAmbientShapes();

  // Newsletter signup (front-end validation only until a mailing list is connected)
  document.getElementById("newsletter-join")?.addEventListener("click", () => {
    const input = document.getElementById("newsletter-email") as HTMLInputElement | null;
    const btn = document.getElementById("newsletter-join") as HTMLButtonElement | null;
    if (!input || !btn) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
      input.focus();
      gsap.fromTo(input, { x: -6 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" });
      return;
    }
    input.value = "";
    btn.textContent = "Joined ✓";
    btn.disabled = true;
  });

  // Trust badges animation (delayed)
  gsap.delayedCall(0.8, () => animateTrustBadges());

  setTimeout(async () => {
    try {
      const [products, categories, newProducts] = await Promise.all([
        getProducts(undefined, 1, 6, "popularity"),
        getCategories(),
        getProducts(undefined, 1, 6, "date"),
      ]);

      // Categories
      const catEl = document.getElementById("home-cats");
      if (catEl) {
        const catIcons = [
          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>`,
          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>`,
          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
        ];

        catEl.innerHTML = categories
          .filter((c) => c.count > 0)
          .map(
            (c, i) => `
            <a href="#/shop?cat=${c.id}" class="modern-cat-chip">
              <div class="cat-icon-wrap">${catIcons[i % catIcons.length]}</div>
              <div class="cat-tag-info">
                  <span class="cat-tag-name">${c.name}</span>
                  <span class="cat-tag-count">${c.count} Items</span>
              </div>
            </a>
          `
          )
          .join("");

        gsap.fromTo(".modern-cat-chip", { opacity: 0, x: 20 }, { opacity: 1, x: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" });
      }

      // Featured Products Horizontal Scroller
      const prodEl = document.getElementById("home-featured");
      if (prodEl) {
        prodEl.innerHTML = products.map(productScrollerCard).join("");
        gsap.fromTo("#home-featured .scroller-card", { opacity: 0, x: 30 }, { opacity: 1, x: 0, stagger: 0.08, duration: 0.6, ease: "back.out(1.2)" });
      }

      // New Arrivals Horizontal Scroller
      const newEl = document.getElementById("home-new");
      if (newEl) {
        newEl.innerHTML = newProducts.map(productScrollerCard).join("");
        gsap.fromTo("#home-new .scroller-card", { opacity: 0, x: 30 }, { opacity: 1, x: 0, stagger: 0.08, duration: 0.6, ease: "back.out(1.2)" });
      }

      // Animate lifestyle banner
      gsap.fromTo(".lifestyle-banner",
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay: 0.3 }
      );

      // Animate Why Choose cards and Promo Banner
      animateWhyCards();
      animatePromoBanner();

      // Animate testimonials

      // ── Animate Shortcut Bar (3D tilt) ──
      gsap.fromTo(".sc-item",
        { y: 20, opacity: 0, rotateX: 15 },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.5, stagger: 0.08, ease: "back.out(1.5)", delay: 0.4 }
      );

      // ── Animate Stats CountUp ──
      document.querySelectorAll(".stat-number").forEach(el => {
        const target = parseFloat(el.getAttribute("data-target") || "0");
        const isDecimal = el.getAttribute("data-decimal") === "true";
        gsap.to({ val: 0 }, {
          val: target,
          duration: 2.5,
          ease: "power2.out",
          delay: 1,
          snap: isDecimal ? {} : { val: 1 },
          onUpdate() {
            const v = this.targets()[0].val;
            (el as HTMLElement).textContent = isDecimal ? v.toFixed(1) : Math.round(v).toLocaleString();
          }
        });
      });

      // ── Animate 3D Testimonial Cards ──
      gsap.fromTo(".testimonial-card-3d",
        { rotateY: 25, opacity: 0, x: 60 },
        { rotateY: 0, opacity: 1, x: 0, duration: 0.7, stagger: 0.15, ease: "power3.out", delay: 1.2 }
      );

      // ── Size Guide shortcut ──
      document.getElementById("sc-size-guide")?.addEventListener("click", () => openSizeGuide());

    } catch (err) {
      console.error("Home load error:", err);
      const el = document.getElementById("home-featured");
      if (el) el.innerHTML = `<div class="error-state"><p>⚠️ Cloud connection error.</p></div>`;
    }
  }, 100);
}

