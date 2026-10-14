// Product Detail Page — Industry-Grade with GSAP animations, tabs, flying cart
import { getProduct, getProducts, getProductVariation, scrapeSwatchImages, formatPrice, formatRegularPrice, getDiscountPercent, proxyImageUrl } from "../api";
import type { Product } from "../api";
import { addToCart } from "../cart-store";
import { isWished, toggleWish, wishItemFromProduct } from "../wishlist-store";
import { renderSpecsTab, renderDetailsTab, wireDetailsToggle, buildGlanceSlides, glanceClosed, rememberGlanceClosed } from "../pdp-content";
import { reviewsShell, mountReviews } from "../pdp-reviews";
import { fetchCoupon, fetchPublicOffers } from "../coupons";
import { applyCoupon } from "../cart-store";
import { showToast } from "../toast";
import { renderBundleCard, onBundleMount } from "../components/bundle-card";
import { openArViewer } from "../ar-viewer";
import { openEnergyCalculator } from "../energy-calculator";
import { openSizeGuide } from "../size-guide";
import { animateFlyToCart, animateBadgePop, animatePulseUrgency, animateTabSwitch, animateShake } from "../animations";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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

function ratingMarkup(count: number, avg: number): string {
  if (count <= 0 || avg <= 0) return `<span class="pdp-tag-new">New</span>`;
  const r = Math.round(avg);
  const stars = "★".repeat(r) + "☆".repeat(5 - r);
  return `<button class="pdp-rating-link" id="pdp-rating-link" type="button" aria-label="Read reviews">
    <span class="stars">${stars}</span><b>${avg.toFixed(1)}</b><span class="pdp-rating-count">(${count})</span>
  </button>`;
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function specCard(iconSvg: string, iconColor: string, bgColor: string, label: string, value: string): string {
  return `
    <div class="spec-card">
      <div class="spec-icon-wrap" style="background: ${bgColor}; color: ${iconColor};">
        ${iconSvg}
      </div>
      <div class="spec-info">
        <span class="spec-label">${label}</span>
        <span class="spec-value">${value}</span>
      </div>
    </div>
  `;
}

// Beautiful SVGs matching Website Desktop
const SVGS = {
  wind: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>`,
  ruler: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-dasharray="3 3" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
  fan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 12V2a10 10 0 0 1 10 10H12z"/><path d="M12 12h10a10 10 0 0 1-10 10v-10z"/><path d="M12 12v10a10 10 0 0 1-10-10h10z"/><path d="M12 12H2a10 10 0 0 1 10-10v10z"/></svg>`,
  zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  colors: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>`
};

function getSpecs(product: Product): { iconSvg: string; iconColor: string; bgColor: string; label: string; value: string }[] {
  const specs: { iconSvg: string; iconColor: string; bgColor: string; label: string; value: string }[] = [];

  const map: Record<string, { icon: string; label: string; color: string; bg: string }> = {
    "air-delivery": { icon: SVGS.wind, label: "AIR DELIVERY", color: "#71b1d9", bg: "rgba(113, 177, 217, 0.15)" },
    "air-flow": { icon: SVGS.wind, label: "AIR DELIVERY", color: "#71b1d9", bg: "rgba(113, 177, 217, 0.15)" },
    size: { icon: SVGS.ruler, label: "SIZE", color: "#a768d9", bg: "rgba(167, 104, 217, 0.15)" },
    "sweep-size": { icon: SVGS.ruler, label: "SWEEP SIZE", color: "#a768d9", bg: "rgba(167, 104, 217, 0.15)" },
    "blade-size": { icon: SVGS.ruler, label: "BLADE SIZE", color: "#a768d9", bg: "rgba(167, 104, 217, 0.15)" },
    rpm: { icon: SVGS.fan, label: "R.P.M.", color: "#f28a22", bg: "rgba(242, 138, 34, 0.15)" },
    "r.p.m.": { icon: SVGS.fan, label: "R.P.M.", color: "#f28a22", bg: "rgba(242, 138, 34, 0.15)" },
    speed: { icon: SVGS.fan, label: "SPEED", color: "#f28a22", bg: "rgba(242, 138, 34, 0.15)" },
    watts: { icon: SVGS.zap, label: "WATTS", color: "#f2c94c", bg: "rgba(242, 201, 76, 0.15)" },
    watt: { icon: SVGS.zap, label: "WATTS", color: "#f2c94c", bg: "rgba(242, 201, 76, 0.15)" },
    power: { icon: SVGS.zap, label: "POWER", color: "#f2c94c", bg: "rgba(242, 201, 76, 0.15)" },
    color: { icon: SVGS.colors, label: "COLORS", color: "#555", bg: "#f0f0f0" },
    colours: { icon: SVGS.colors, label: "COLORS", color: "#555", bg: "#f0f0f0" },
  };

  for (const attr of product.attributes) {
    const slug = attr.name.toLowerCase().replace(/\s+/g, "-");
    const m = map[slug];
    if (m && attr.terms.length > 0) {
      specs.push({
        iconSvg: m.icon,
        iconColor: m.color,
        bgColor: m.bg,
        label: m.label,
        value: attr.terms.map((t) => t.name).join(", ")
      });
    }
  }
  return specs;
}

export async function renderProduct(_params: Record<string, string>): Promise<string> {
  return `
    <div class="pdp" id="pdp-container">
      <div class="pdp-loading">
        <div class="skeleton skeleton-img-xl"></div>
        <div class="pdp-body-skeleton" style="padding:16px">
          <div class="skeleton skeleton-line-lg"></div>
          <div class="skeleton skeleton-line-sm"></div>
          <div class="skeleton skeleton-line-xl"></div>
          <div class="pdp-spec-skeleton">
            <div class="skeleton skeleton-spec"></div>
            <div class="skeleton skeleton-spec"></div>
            <div class="skeleton skeleton-spec"></div>
            <div class="skeleton skeleton-spec"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function onProductMount(params: Record<string, string>) {
  const id = parseInt(params.id);

  setTimeout(async () => {
    try {
      const [p, recommends] = await Promise.all([
        getProduct(id),
        getProducts(undefined, 1, 6, "popularity")
      ]);

      // MANUAL SWATCH OVERRIDES: Provided directly per user constraints due to WP data corruption
      const MANUAL_SWATCH_MAP: Record<string, string> = {
        "Pearl brown with copper ornament": encodeURI(`https://boundless-night.localsite.io/wp-content/uploads/2026/08/CASPIA-BROWN-1-1-1.png`),
        "Pearl white with silver ornament": encodeURI(`https://boundless-night.localsite.io/wp-content/uploads/2026/07/BLDC-White-1-scaled.png`),
        "Antique copper with rosewood finish blades": encodeURI(`https://boundless-night.localsite.io/wp-content/uploads/2026/07/Rolex-Antique-Copper-1.png`),
        "Antique brass finish with walnut finish blades": encodeURI(`https://boundless-night.localsite.io/wp-content/uploads/2026/07/Rolex-LED-48″-BLDC-1.png`),
        "Brushed steel finish with walnut finish blades": encodeURI(`https://boundless-night.localsite.io/wp-content/uploads/2026/07/Rolex-LED-48″-BLDC-2-1.png`)
      };

      // Fetch variation data (images per color)
      type VarData = { id: number; colorName: string; swatchImg: string | null; lifestyleImg: string | null; price: number | null; regularPrice: number | null };
      let variationData: VarData[] = [];
      if (p.type === "variable" && (p as any).variations?.length) {
        const parentVars = (p as any).variations as { id: number; attributes: { name: string; value: string }[] }[];

        // Build a map of variation ID -> color name from the parent product's variation attributes
        const colorNameMap: Record<number, string> = {};
        parentVars.forEach(v => {
          const colorAttrFromVar = v.attributes?.find(a =>
            ["color", "colors", "colour", "colours"].includes(a.name.toLowerCase())
          );
          if (colorAttrFromVar) colorNameMap[v.id] = colorAttrFromVar.value;
        });
        const varIds = parentVars.map(v => v.id);

        // Fetch each variation individually via Store API + scrape custom swatch images
        const [swatchMap, ...varProducts] = await Promise.all([
          scrapeSwatchImages(p.permalink),
          ...varIds.map(vid => getProductVariation(vid).catch(() => null))
        ]);

        variationData = varProducts.filter(Boolean).map((vp: any) => {
          const colorName = colorNameMap[vp.id] || vp.variation || vp.name || "Default";

          // Custom transparent URL logic 
          let customSwatchUrl = MANUAL_SWATCH_MAP[colorName] || swatchMap[vp.id];

          // Fix WP plugin leakage of local domains over API
          if (customSwatchUrl && customSwatchUrl.includes('e-commerce.local')) {
            customSwatchUrl = customSwatchUrl.replace('http://e-commerce.local', 'https://boundless-night.localsite.io');
          }

          return {
            id: vp.id,
            colorName,
            swatchImg: customSwatchUrl || vp.images?.[0]?.src || null, // Transparent cutout for the Color Cards
            lifestyleImg: vp.images?.[0]?.src || null,                 // Large Room photo to swap into the Main Gallery
            price: vp.prices?.price ? parseInt(vp.prices.price) / Math.pow(10, vp.prices.currency_minor_unit) : null,
            regularPrice: vp.prices?.regular_price ? parseInt(vp.prices.regular_price) / Math.pow(10, vp.prices.currency_minor_unit) : null
          };
        });
      }

      const container = document.getElementById("pdp-container");
      if (!container) return;

      const specs = getSpecs(p);
      const discount = getDiscountPercent(p.prices);
      const glanceSlides = buildGlanceSlides(specs);
      const divisor = Math.pow(10, p.prices.currency_minor_unit);
      const priceNum = parseInt(p.prices.price) / divisor;
      const regPriceNum = parseInt(p.prices.regular_price) / divisor;

      const colorAttr = p.attributes.find(
        (a) => a.name.toLowerCase() === "color" ||
          a.name.toLowerCase() === "colors" ||
          a.name.toLowerCase() === "colour" ||
          a.name.toLowerCase() === "colours"
      );
      const colors = colorAttr ? colorAttr.terms : [];

      container.innerHTML = `
        <!-- Sticky Mini-Header (Hidden, slides down on scroll) -->
        <div class="pdp-mini-header" id="pdp-mini-header">
          <div class="mini-head-flex">
            <span class="mini-title">${p.name}</span>
            <span class="mini-price">${formatPrice(p.prices)}</span>
          </div>
        </div>

        <!-- Scroll-Snap Image Gallery -->
        <div class="pdp-hero-gallery" id="pdp-gallery">
          <div class="pdp-bread-float">
            <a href="#/" class="btn-circular-back" aria-label="Go Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </a>
          </div>
          <div class="pdp-gallery-actions">
            <button class="pdp-wishlist-float${isWished(p.id) ? " wished" : ""}" id="btn-wishlist" type="button" aria-label="Save to wishlist" aria-pressed="${isWished(p.id)}">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            <button class="pdp-share-float" id="btn-share" type="button" aria-label="Share">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
          </div>
          
          <div class="gallery-snap-slider" id="gallery-slider">
            ${p.images.map(img => `
              <div class="gallery-slide">
                <img src="${proxyImageUrl(img.src)}" alt="${p.name}" />
              </div>
            `).join("")}
          </div>

          ${glanceSlides.length > 0 && !glanceClosed() ? `
          <div class="pdp-glance" id="pdp-glance" aria-live="polite">
            <div class="glance-slides">
              ${glanceSlides.map((sl, i) => `
                <div class="glance-slide ${i === 0 ? "on" : ""}">
                  <span class="glance-icon">${sl.icon}</span>
                  <span class="glance-text"><small>${sl.label}</small><b>${sl.value}</b></span>
                </div>`).join("")}
            </div>
            <button class="glance-close" id="glance-close" type="button" aria-label="Hide highlights">×</button>
          </div>` : ""}

          ${p.images.length > 1 ? `
            <div class="gallery-nav-float">
              <div class="gallery-dots" id="gallery-dots">
                ${p.images.map((_, i) => `<div class="dot ${i === 0 ? "active" : ""}" data-idx="${i}"></div>`).join("")}
              </div>
            </div>
          ` : ""}
        </div>

        <!-- Pull Up Sheet Data Section -->
        <div class="pdp-info-sheet">
          <div class="sheet-drag-handle"></div>
          
          <!-- Title block -->
          <div class="pdp-head">
            ${p.categories.length > 0 ? `<span class="pdp-eyebrow">${p.categories[0].name}</span>` : ""}
            <h1 class="pdp-name">${p.name}</h1>
            <div class="pdp-meta-row">
              <span id="pdp-rating-slot">${ratingMarkup(p.review_count, parseFloat(p.average_rating) || 0)}</span>
              <span class="pdp-stock ${p.is_in_stock ? "in" : "out"}">${p.is_in_stock ? "In stock" : "Out of stock"}</span>
              ${p.low_stock_remaining ? `<span class="pdp-urgency-badge" id="urgency-badge">Only ${p.low_stock_remaining} left!</span>` : ""}
            </div>
          </div>

          <!-- Price block -->
          <div class="pdp-price-row">
            <div class="pdp-price-line">
              <span class="pdp-price-now">${formatPrice(p.prices)}</span>
              ${p.on_sale ? `<span class="pdp-price-old">${formatRegularPrice(p.prices)}</span>` : ""}
              ${p.on_sale && discount > 0 ? `<span class="pdp-save-pill">Save ${discount}%</span>` : ""}
            </div>
            <span class="pdp-tax-note">Inclusive of all taxes</span>
          </div>

          <!-- Offers (public coupons) -->
          <div class="pdp-offers" id="pdp-offers" hidden></div>

          <!-- Colour selector -->
          ${colors.length > 0 ? `
            <div class="pdp-block pdp-colors-section">
              <div class="pdp-block-head">
                <h3 class="pdp-section-label">Colour</h3>
                <button class="pdp-color-clear" id="color-clear" type="button" hidden>Clear</button>
              </div>
              <p class="pdp-selected-color" id="selected-color-name">Select a colour to see it on the fan</p>
              <div class="pdp-color-cards" id="color-swatches">
                ${colors.map((c) => {
        const v = variationData.find(vd => vd.colorName.toLowerCase() === c.name.toLowerCase());
        const fallbackSwatch = proxyImageUrl(MANUAL_SWATCH_MAP?.[c.name] || "");
        const swatchUrl = v?.swatchImg ? proxyImageUrl(v.swatchImg) : fallbackSwatch;
        const lifestyleUrl = v?.lifestyleImg ? proxyImageUrl(v.lifestyleImg) : fallbackSwatch;

        return `
                    <button class="color-card" aria-pressed="false" data-var-id="${v?.id || ""}" data-color="${c.name}" data-img="${lifestyleUrl}" aria-label="${c.name}" title="${c.name}">
                      <div class="color-card-img">
                        ${swatchUrl ? `<img src="${swatchUrl}" alt="${c.name}" loading="lazy" />` : `<div class="color-card-placeholder" style="background:#eef2f6;"></div>`}
                      </div>
                      <span class="color-card-name">${c.name}</span>
                    </button>
                  `;
      }).join("")}
              </div>
            </div>
          ` : ""}

          <!-- Key specs -->
          ${specs.length > 0 ? `
            <div class="pdp-block">
              <h3 class="pdp-section-label">Key specs</h3>
              <div class="pdp-specs-grid" id="pdp-specs">
                ${specs.map((s) => specCard(s.iconSvg, s.iconColor, s.bgColor, s.label, s.value)).join("")}
              </div>
            </div>
          ` : ""}

          <!-- Tools -->
          <div class="pdp-block">
            <h3 class="pdp-section-label">Try before you buy</h3>
            <div class="pdp-tools">
              ${(variationData.length > 0 || colors.length > 0) ? `
              <button class="pdp-tool" id="btn-ar-visualize">
                <span class="pdp-tool-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v2M16 20h2a2 2 0 0 0 2-2v-2"/><circle cx="12" cy="12" r="3"/></svg></span>
                <span class="pdp-tool-label">See in<br>your room</span>
              </button>` : ""}
              <button class="pdp-tool" id="btn-energy-calc">
                <span class="pdp-tool-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
                <span class="pdp-tool-label">Energy<br>savings</span>
              </button>
              <button class="pdp-tool" id="btn-size-guide">
                <span class="pdp-tool-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg></span>
                <span class="pdp-tool-label">Room size<br>guide</span>
              </button>
            </div>
          </div>

          <!-- Trust strip -->
          <div class="pdp-trust">
            <div class="pdp-trust-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span><b>5 Year</b>Warranty</span>
            </div>
            <div class="pdp-trust-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              <span><b>Free</b>Delivery</span>
            </div>
            <div class="pdp-trust-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span><b>ISI</b>Certified</span>
            </div>
          </div>

          <!-- ★ Tabbed Content: Specs / Details / Reviews ★ -->
          <div class="pdp-tabs">
            <div class="pdp-tab-bar">
              <button class="pdp-tab-btn active" data-tab="tab-specs">Specifications</button>
              <button class="pdp-tab-btn" data-tab="tab-details">Details</button>
              <button class="pdp-tab-btn" data-tab="tab-reviews" id="tab-reviews-btn">Reviews${p.review_count > 0 ? ` (${p.review_count})` : ""}</button>
            </div>
            <div class="pdp-tab-content" id="tab-specs" style="display:block;">
              ${renderSpecsTab(p)}
            </div>
            <div class="pdp-tab-content" id="tab-details" style="display:none;">
              ${renderDetailsTab(p)}
            </div>
            <div class="pdp-tab-content" id="tab-reviews" style="display:none;">
              ${reviewsShell()}
            </div>
          </div>

          <!-- Product Bundle Container -->
          <div id="pdp-bundle-container"></div>

          <!-- Recommends Section -->
          <div class="pdp-recommends">
            <h3 class="pdp-section-label">You Might Also Like</h3>
            <div class="horizontal-scroller" style="padding-top:16px;">
              ${recommends.filter(r => r.id !== p.id).slice(0, 4).map(productScrollerCard).join("")}
            </div>
          </div>
          
          <!-- Bottom Spacer for sticky action bar -->
          <div class="pdp-bottom-pad"></div>
        </div>

        <!-- Sticky Bottom Actions -->
        <div class="pdp-sticky-actions">
          <div class="pdp-action-btns pdp-actions-initial" id="pdp-actions-initial">
            <button class="btn-atc-full" id="btn-atc" ${!p.is_in_stock ? "disabled" : ""}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span>Add to Cart</span>
            </button>
            <button class="btn-buy-premium" id="btn-buy" ${!p.is_in_stock ? "disabled" : ""}>
              <span>Buy Now</span>
            </button>
          </div>
          <div class="pdp-action-btns pdp-actions-added" id="pdp-actions-added" style="display:none">
            <div class="qty-control-inline">
              <button class="qty-btn" id="qty-minus">−</button>
              <span class="qty-value" id="qty-val">1</span>
              <button class="qty-btn" id="qty-plus">+</button>
            </div>
            <button class="btn-view-cart" id="btn-view-cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span>View Cart</span>
            </button>
          </div>
        </div>
      `;

      // ── Bundle Logic ──
      const bundleContainer = document.getElementById("pdp-bundle-container");
      if (bundleContainer) {
        try {
          bundleContainer.innerHTML = await renderBundleCard(id);
          onBundleMount();
        } catch (err) {
          console.warn("[PDP] bundle unavailable:", err); // upsell is optional
        }
      }

      // ── Advanced GSAP Animations ──
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(".pdp-hero-gallery", { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.8 }, 0)
        .fromTo(".pdp-info-sheet", { y: 150, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power4.out" }, 0.2)
        .fromTo(".pdp-name", { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5 }, 0.4)
        .fromTo(".pdp-price-row", { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4 }, 0.5);

      // Spec Cards Entrance (pop & scale)
      if (specs.length > 0) {
        tl.fromTo(".spec-card",
          { opacity: 0, y: 30, scale: 0.85 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: "back.out(1.5)" },
          0.5
        ).fromTo(".spec-icon-wrap svg",
          { scale: 0, rotation: -45 },
          { scale: 1, rotation: 0, duration: 0.6, stagger: 0.08, ease: "back.out(2)" },
          0.6
        );
      }

      // Colour, tools and trust blocks
      tl.fromTo(".pdp-block, .pdp-trust",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 },
        0.7
      );

      tl.fromTo(".pdp-sticky-actions", { y: 100 }, { y: 0, duration: 0.6, ease: "power3.out" }, 0.8);

      // ── ScrollTrigger Interactions ──
      const scroller = document.getElementById("page-content");
      if (scroller) {
        gsap.to("#gallery-slider", {
          y: 60, opacity: 0.3, scale: 0.95,
          ease: "none",
          scrollTrigger: { trigger: "#pdp-container", scroller: scroller, start: "top top", end: "+=400", scrub: true }
        });

        gsap.to("#pdp-mini-header", {
          y: 0,
          ease: "power3.out", duration: 0.3,
          scrollTrigger: {
            trigger: ".pdp-name",
            scroller: scroller,
            start: "top top",
            toggleActions: "play none none reverse"
          }
        });
      }

      // ── Urgency pulse ──
      if (p.low_stock_remaining) {
        animatePulseUrgency("#urgency-badge");
      }

      // ── Tab Switching ──
      const tabBtns = container.querySelectorAll(".pdp-tab-btn");
      let activeTabId = "tab-specs";
      tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          const targetId = (btn as HTMLElement).dataset.tab!;
          if (targetId === activeTabId) return;

          tabBtns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");

          const outgoing = container.querySelector(`#${activeTabId}`) as HTMLElement;
          const incoming = container.querySelector(`#${targetId}`) as HTMLElement;
          if (outgoing && incoming) {
            const tabIds = ["tab-specs", "tab-details", "tab-reviews"];
            const dir = tabIds.indexOf(targetId) > tabIds.indexOf(activeTabId) ? "left" : "right";
            animateTabSwitch(outgoing, incoming, dir);
          }
          activeTabId = targetId;
        });
      });

      // ── Rating link jumps to the Reviews tab ──
      container.addEventListener("click", (e) => {
        if (!(e.target as HTMLElement).closest("#pdp-rating-link")) return;
        (container.querySelector('.pdp-tab-btn[data-tab="tab-reviews"]') as HTMLElement | null)?.click();
        container.querySelector(".pdp-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      // ── Colour selection ──
      // Tap a colour: the gallery locks on that colour's photo (no sliding).
      // Tap it again (or "Clear"): the full gallery comes back.
      const swatchContainer = document.getElementById("color-swatches");
      const gallerySlider = document.getElementById("gallery-slider");
      const galleryEl = document.getElementById("pdp-gallery");
      const colorLabel = document.getElementById("selected-color-name");
      const colorClear = document.getElementById("color-clear") as HTMLButtonElement | null;
      const basePriceText = formatPrice(p.prices);
      const baseOldText = p.on_sale ? formatRegularPrice(p.prices) : "";

      const firstGalleryImg = () => gallerySlider?.querySelector(".gallery-slide img") as HTMLImageElement | null;

      const swapFirstImage = (src: string) => {
        const img = firstGalleryImg();
        if (!img) return;
        gsap.to(img, {
          opacity: 0, scale: 0.97, duration: 0.18,
          onComplete: () => {
            const reveal = () => gsap.to(img, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" });
            img.onload = reveal;
            img.onerror = reveal; // never leave the image invisible
            img.src = src;
            if (img.complete) reveal();
          }
        });
      };

      const lockGallery = (src: string) => {
        const img = firstGalleryImg();
        if (img && !img.dataset.orig) img.dataset.orig = img.getAttribute("src") || "";
        galleryEl?.classList.add("locked");
        gallerySlider?.scrollTo({ left: 0 });
        swapFirstImage(src);
      };

      const unlockGallery = () => {
        galleryEl?.classList.remove("locked");
        const orig = firstGalleryImg()?.dataset.orig;
        if (orig) swapFirstImage(orig);
      };

      const setPrice = (v: { price: number | null; regularPrice: number | null } | null) => {
        const cs = p.prices.currency_symbol;
        const nowText = v?.price ? `${cs}${v.price.toLocaleString("en-IN")}` : basePriceText;
        container.querySelector(".pdp-price-now")!.textContent = nowText;
        const mini = container.querySelector(".mini-price");
        if (mini) mini.textContent = nowText;

        const oldEl = container.querySelector(".pdp-price-old");
        const pill = container.querySelector(".pdp-save-pill");
        if (v?.price && v.regularPrice && v.regularPrice > v.price) {
          if (oldEl) oldEl.textContent = `${cs}${v.regularPrice.toLocaleString("en-IN")}`;
          if (pill) pill.textContent = `Save ${Math.round(((v.regularPrice - v.price) / v.regularPrice) * 100)}%`;
        } else if (oldEl && baseOldText) {
          oldEl.textContent = baseOldText;
          if (pill) pill.textContent = `Save ${discount}%`;
        }
      };

      const selectColor = (card: HTMLElement | null) => {
        swatchContainer?.querySelectorAll(".color-card").forEach((c) => {
          c.classList.remove("active");
          c.setAttribute("aria-pressed", "false");
        });

        if (!card) {
          if (colorLabel) { colorLabel.textContent = "Select a colour to see it on the fan"; colorLabel.classList.remove("chosen"); }
          if (colorClear) colorClear.hidden = true;
          setPrice(null);
          unlockGallery();
          return;
        }

        card.classList.add("active");
        card.setAttribute("aria-pressed", "true");
        if (colorLabel) { colorLabel.textContent = card.dataset.color || ""; colorLabel.classList.add("chosen"); }
        if (colorClear) colorClear.hidden = false;
        setPrice(variationData.find((vd) => String(vd.id) === card.dataset.varId) || null);

        const photo = card.dataset.img;
        if (photo) lockGallery(photo); else unlockGallery();
      };

      swatchContainer?.addEventListener("click", (e) => {
        const card = (e.target as HTMLElement).closest(".color-card") as HTMLElement | null;
        if (!card) return;
        const wasActive = card.classList.contains("active");
        gsap.fromTo(card, { scale: 0.92 }, { scale: 1, duration: 0.35, ease: "elastic.out(1, 0.4)" });
        selectColor(wasActive ? null : card);
      });
      colorClear?.addEventListener("click", () => selectColor(null));

      // ── AR Viewer Integration ──
      const arBtn = document.getElementById("btn-ar-visualize");
      arBtn?.addEventListener("click", () => {
        // Find the active color card's transparent image, or fallback to the main product image
        const activeCard = swatchContainer?.querySelector(".color-card.active") as HTMLElement;
        let imgUrl = "";
        if (activeCard) {
          const inlineImg = activeCard.querySelector("img");
          if (inlineImg) {
            imgUrl = inlineImg.getAttribute("src") || "";
          } else {
            // Use lifestyle fallback if it's a non-variable fallback
            imgUrl = activeCard.dataset.img || "";
          }
        }
        if (!imgUrl && p.images.length > 0) {
          imgUrl = p.images[0].src;
        }

        if (imgUrl) {
          openArViewer(imgUrl);
        } else {
          alert("Could not load product image for visualization.");
        }
      });

      // ── Energy Calculator Integration ──
      const ecBtn = document.getElementById("btn-energy-calc");
      ecBtn?.addEventListener("click", () => {
        // Extract wattage from product specs
        const wattsAttr = p.attributes.find(a =>
          ["watts", "watt", "power"].includes(a.name.toLowerCase())
        );
        let watts = 35; // Default BLDC wattage
        if (wattsAttr && wattsAttr.terms.length > 0) {
          const parsed = parseInt(wattsAttr.terms[0].name);
          if (!isNaN(parsed)) watts = parsed;
        }
        openEnergyCalculator(watts);
      });

      // ── Size Guide ──
      document.getElementById("btn-size-guide")?.addEventListener("click", () => openSizeGuide());

      // ── Wishlist ──
      const wishlistBtn = document.getElementById("btn-wishlist");
      wishlistBtn?.addEventListener("click", () => {
        const nowWished = toggleWish(wishItemFromProduct(p));
        wishlistBtn.classList.toggle("wished", nowWished);
        wishlistBtn.setAttribute("aria-pressed", String(nowWished));
        if (nowWished) {
          gsap.fromTo(wishlistBtn, { scale: 0.6 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.35)" });
        }
        showToast(nowWished ? "Saved to wishlist" : "Removed from wishlist");
      });

      // ── Share Button ──
      document.getElementById("btn-share")?.addEventListener("click", async () => {
        try {
          if (navigator.share) {
            await navigator.share({ title: p.name, text: `Check out ${p.name} on Breezalit!`, url: window.location.href });
          } else {
            await navigator.clipboard.writeText(window.location.href);
            showToast("Link copied");
          }
        } catch (_e) { /* user cancelled */ }
      });

      // ── Native Gallery Scroll Spy logic ──
      const slider = document.getElementById("gallery-slider");
      const dots = container.querySelectorAll(".gallery-dots .dot");

      if (slider) {
        slider.addEventListener("scroll", () => {
          let actIdx = Math.round(slider.scrollLeft / slider.clientWidth);
          dots.forEach(d => d.classList.remove("active"));
          if (dots[actIdx]) dots[actIdx].classList.add("active");
        });
      }

      dots.forEach((t) => {
        t.addEventListener("click", () => {
          const idx = parseInt((t as HTMLElement).dataset.idx || "0");
          if (slider) {
            slider.scrollTo({ left: idx * slider.clientWidth, behavior: "smooth" });
          }
        });
      });

      // ── Cart item for the currently selected colour/variation ──
      const selectedVariation = () => {
        const activeCard = container.querySelector(".color-card.active") as HTMLElement | null;
        if (activeCard) return variationData.find((vd) => String(vd.id) === activeCard.dataset.varId);
        return variationData.length === 1 ? variationData[0] : undefined;
      };

      const buildCartItem = () => {
        const v = selectedVariation();
        return {
          id: v ? v.id : p.id,
          productId: p.id,
          variationId: v ? v.id : undefined,
          name: v && colors.length > 1 ? `${p.name} – ${v.colorName}` : p.name,
          price: v?.price ?? priceNum,
          regularPrice: v?.regularPrice ?? regPriceNum,
          currencySymbol: p.prices.currency_symbol,
          image: proxyImageUrl(v?.lifestyleImg || p.images[0]?.src || ""),
          onSale: p.on_sale,
        };
      };
      let addedItem: ReturnType<typeof buildCartItem> | null = null;

      // ── Quantity Micro-Interactions ──
      let qty = 1;
      const qtyVal = container.querySelector("#qty-val");

      const popQty = () => {
        if (!qtyVal) return;
        qtyVal.textContent = qty.toString();
        gsap.fromTo(qtyVal, { scale: 1.4, color: "var(--primary)" }, { scale: 1, color: "var(--text-main)", duration: 0.4, ease: "back.out(2)" });
      };

      container.querySelector("#qty-minus")?.addEventListener("click", () => {
        if (qty > 1) {
          qty--;
          popQty();
          // Update cart quantity
          if (addedItem) addToCart(addedItem, -1);
          animateBadgePop();
        } else {
          animateShake(container.querySelector(".qty-control-inline") as HTMLElement);
        }
      });
      container.querySelector("#qty-plus")?.addEventListener("click", () => {
        qty++;
        popQty();
        if (addedItem) addToCart(addedItem, 1);
        animateBadgePop();
      });

      // ── View Cart navigates to cart ──
      container.querySelector("#btn-view-cart")?.addEventListener("click", () => {
        window.location.hash = "#/cart";
      });

      // ── Add to Cart with Flying Animation ──
      const atcBtn = container.querySelector("#btn-atc") as HTMLButtonElement;
      const initialActions = container.querySelector("#pdp-actions-initial") as HTMLElement;
      const addedActions = container.querySelector("#pdp-actions-added") as HTMLElement;

      const addSelectedToCart = (): boolean => {
        // Variable products need a concrete colour so the order line is valid
        if (p.type === "variable" && !selectedVariation()) {
          if (variationData.length === 0) {
            showToast("This product can't be added right now. Please try again later.", "error");
            return false;
          }
          const block = container.querySelector(".pdp-colors-section") as HTMLElement | null;
          if (block) {
            block.scrollIntoView({ behavior: "smooth", block: "center" });
            animateShake(block);
          }
          showToast("Please select a colour first", "error");
          return false;
        }
        addedItem = buildCartItem();
        addToCart(addedItem, qty);
        return true;
      };

      container.querySelector("#btn-buy")?.addEventListener("click", () => {
        if (!addSelectedToCart()) return;
        animateBadgePop();
        window.location.hash = "#/checkout";
      });

      atcBtn?.addEventListener("click", () => {
        if (!addSelectedToCart()) return;

        // Flying cart animation
        animateFlyToCart(atcBtn);
        animateBadgePop();

        // Brief "Added!" feedback on the button
        atcBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>Added!</span>`;
        atcBtn.classList.add("added");
        gsap.fromTo(atcBtn, { scale: 0.92 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" });

        // After 1.2s, morph the footer to show qty stepper + View Cart
        setTimeout(() => {
          if (initialActions && addedActions) {
            gsap.to(initialActions, {
              opacity: 0, y: 20, duration: 0.3,
              onComplete: () => {
                initialActions.style.display = "none";
                addedActions.style.display = "flex";
                gsap.fromTo(addedActions,
                  { opacity: 0, y: 20 },
                  { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.5)" }
                );
              }
            });
          }
        }, 1200);
      });

      // ── Reviews (live from WooCommerce) ──
      const reviewsRoot = document.getElementById("reviews-root");
      if (reviewsRoot) {
        mountReviews(reviewsRoot, p.id, p.name, (stats) => {
          const slot = document.getElementById("pdp-rating-slot");
          if (slot) slot.innerHTML = ratingMarkup(stats.count, stats.average);
          const tabBtn = document.getElementById("tab-reviews-btn");
          if (tabBtn) tabBtn.textContent = stats.count ? `Reviews (${stats.count})` : "Reviews";
        });
      }

      // ── Details "Read more" ──
      wireDetailsToggle(container);

      // ── Offers: coupons the store marked public ──
      const offersEl = document.getElementById("pdp-offers");
      if (offersEl) {
        fetchPublicOffers()
          .then((offers) => {
            if (offers.length === 0 || !document.body.contains(offersEl)) return;
            offersEl.hidden = false;
            offersEl.innerHTML = `
              <h3 class="pdp-section-label">Offers for you</h3>
              <div class="offer-list">
                ${offers.map((o) => `
                  <div class="offer-card">
                    <div class="offer-text"><b>${esc(o.code)}</b><span>${esc(o.text)}</span></div>
                    <button class="offer-apply" data-code="${esc(o.code)}" type="button">Apply</button>
                  </div>`).join("")}
              </div>`;
          })
          .catch(() => { /* offers are optional */ });

        offersEl.addEventListener("click", async (e) => {
          const btn = (e.target as HTMLElement).closest(".offer-apply") as HTMLButtonElement | null;
          if (!btn || btn.disabled) return;
          btn.disabled = true;
          btn.textContent = "Applying…";
          try {
            applyCoupon(await fetchCoupon(btn.dataset.code || ""));
            btn.textContent = "Applied ✓";
            showToast(`${btn.dataset.code} applied — see it in your cart`);
          } catch (err: any) {
            btn.disabled = false;
            btn.textContent = "Apply";
            showToast(err?.message || "Couldn't apply this coupon", "error");
          }
        });
      }

      // ── "At a glance" slider on the image ──
      const glance = document.getElementById("pdp-glance");
      if (glance) {
        const slideEls = glance.querySelectorAll(".glance-slide");
        let gi = 0;
        const glanceTimer = setInterval(() => {
          if (!document.body.contains(glance)) { clearInterval(glanceTimer); return; }
          if (slideEls.length < 2) return;
          slideEls[gi].classList.remove("on");
          gi = (gi + 1) % slideEls.length;
          slideEls[gi].classList.add("on");
        }, 3200);

        document.getElementById("glance-close")?.addEventListener("click", () => {
          clearInterval(glanceTimer);
          rememberGlanceClosed();
          glance.classList.add("closing");
          setTimeout(() => glance.remove(), 250);
        });
      }

    } catch (err) {
      console.error("PDP error:", err);
      const container = document.getElementById("pdp-container");
      if (container) {
        container.innerHTML = `<div class="error-state"><p>⚠️ Product not found.</p><a href="#/shop" class="btn-primary-pill">← Back to Shop</a></div>`;
      }
    }
  }, 50);
}