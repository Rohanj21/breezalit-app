// Breezalit — Main Entry Point
import { registerRoutes } from "./router";
import { renderHome, onHomeMount } from "./pages/home";
import { renderShop, onShopMount } from "./pages/shop";
import { renderProduct, onProductMount } from "./pages/product";
import { renderCart, onCartMount } from "./pages/cart";
import { renderAbout, onAboutMount } from "./pages/about";
import { renderCheckout, onCheckoutMount } from "./pages/checkout";
import { renderCompare, onCompareMount } from "./pages/compare";
import { renderTracking, onTrackingMount } from "./pages/tracking";
import { renderRewards, onRewardsMount } from "./pages/rewards";
import { updateBadge } from "./cart-store";
import { getProducts, proxyImageUrl, setupSecureImageLoader } from "./api";
import { initChatbot } from "./chatbot";
import { initSocialProof } from "./social-proof";
import { initFanFinder } from "./fan-finder";
import { initNotifications } from "./notifications";
import { showScratchCoupon } from "./scratch-coupon";
import { runSplash } from "./splash";
import gsap from "gsap";
import { App } from "@capacitor/app";
import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  setupSecureImageLoader();

  // Android Back Button Hardware Handler
  App.addListener("backButton", () => {
    const hash = window.location.hash;
    if (hash === "#/" || hash === "") {
      App.exitApp();
    } else {
      window.history.back();
    }
  });

  // ── Splash screen ──
  runSplash(() => {
    // Show scratch coupon 3s after splash ends
    setTimeout(() => showScratchCoupon(), 3000);
  });

  const pageContent = document.getElementById("page-content");
  if (!pageContent) return;

  // Track current params for onMounted callbacks
  let lastParams: Record<string, string> = {};

  registerRoutes(
    [
      {
        path: "/",
        render: renderHome,
        onMounted: () => onHomeMount(),
      },
      {
        path: "/shop",
        render: renderShop,
        onMounted: () => onShopMount(),
      },
      {
        path: "/product/:id",
        render: (params) => {
          lastParams = params;
          return renderProduct(params);
        },
        onMounted: () => onProductMount(lastParams),
      },
      {
        path: "/cart",
        render: renderCart,
        onMounted: () => onCartMount(),
      },
      {
        path: "/about",
        render: renderAbout,
        onMounted: () => onAboutMount(),
      },
      {
        path: "/checkout",
        render: renderCheckout,
        onMounted: () => onCheckoutMount(),
      },
      {
        path: "/compare",
        render: renderCompare,
        onMounted: () => onCompareMount(),
      },
      {
        path: "/tracking",
        render: renderTracking,
        onMounted: () => onTrackingMount(),
      },
      {
        path: "/rewards",
        render: renderRewards,
        onMounted: () => onRewardsMount(),
      },
    ],
    pageContent
  );

  updateBadge();
  initChatbot();
  initSocialProof();
  initFanFinder();
  initNotifications();

  // ── Pull-to-Refresh with branded Breezalit fan ──
  (() => {
    // Inject PTR indicator
    const ptr = document.createElement("div");
    ptr.className = "ptr-indicator";
    ptr.id = "ptr-indicator";
    ptr.innerHTML = `
      <div class="ptr-fan-wrap">
        <svg id="ptr-fan-svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C12 2 7 6 7 10c0 2.76 2.24 5 5 5s5-2.24 5-5c0-4-5-8-5-8zm0 20c0 0 5-4 5-8 0-2.76-2.24-5-5-5s-5 2.24-5 5c0 4 5 8 5 8zm-10-10c0 0 4-5 8-5 2.76 0 5 2.24 5 5s-2.24 5-5 5c-4 0-8-5-8-5zm20 0c0 0-4 5-8 5-2.76 0-5-2.24-5-5s2.24-5 5-5c4 0 8 5 8 5z"/>
          <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3"/>
        </svg>
      </div>
      <span class="ptr-text" id="ptr-text">Pull to refresh</span>
    `;
    document.body.appendChild(ptr);

    let startY = 0;
    let pulling = false;
    const THRESHOLD = 150; // Increased threshold for a "hard pull"

    pageContent.addEventListener("touchstart", (e) => {
      // ONLY start pull-to-refresh if we are ALREADY strictly at the top
      if (window.scrollY <= 2) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    }, { passive: true });

    pageContent.addEventListener("touchmove", (e) => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;

      // Abort pulling if user started scrolling down the page normally
      if (window.scrollY > 5 || dy < 0) {
        pulling = false;
        ptr.classList.remove("visible");
        return;
      }

      // Add a 40px "deadzone" before the PTR UI even shows up
      if (dy > 40) {
        // We subtract 40 from dy so the animation starts smoothly after the deadzone
        const effectivePull = dy - 40;
        const progress = Math.min(effectivePull / THRESHOLD, 1);
        ptr.classList.add("visible");

        // Spin fan proportional to pull distance
        const fanEl = document.getElementById("ptr-fan-svg");
        if (fanEl) fanEl.style.transform = `rotate(${effectivePull * 3}deg)`;

        const textEl = document.getElementById("ptr-text");
        if (textEl) textEl.textContent = progress >= 1 ? "Release to refresh" : "Pull to refresh";
      } else {
        ptr.classList.remove("visible");
      }
    }, { passive: true });

    pageContent.addEventListener("touchend", () => {
      if (!pulling) return;
      pulling = false;
      const wasVisible = ptr.classList.contains("visible");
      const textEl = document.getElementById("ptr-text");
      const fanEl = document.getElementById("ptr-fan-svg");

      if (wasVisible && textEl?.textContent === "Release to refresh") {
        // Trigger refresh
        if (textEl) textEl.textContent = "Refreshing...";

        // Fast spin animation
        if (fanEl) {
          gsap.to(fanEl, { rotation: "+=1080", duration: 1.2, ease: "power2.inOut" });
        }

        setTimeout(() => {
          ptr.classList.remove("visible");
          if (fanEl) gsap.set(fanEl, { rotation: 0 });
          // Re-trigger current route
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        }, 1200);
      } else {
        ptr.classList.remove("visible");
        if (fanEl) gsap.set(fanEl, { rotation: 0 });
      }
    }, { passive: true });
  })();

  // ── Search Overlay ──
  const searchOverlay = document.getElementById("search-overlay");
  const searchInput = document.getElementById("search-input") as HTMLInputElement;
  const searchClose = document.getElementById("search-close");
  const searchResults = document.getElementById("search-results");
  const btnSearch = document.getElementById("btn-search");

  btnSearch?.addEventListener("click", () => {
    searchOverlay?.classList.add("open");
    gsap.fromTo(searchOverlay, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    setTimeout(() => searchInput?.focus(), 300);
  });

  searchClose?.addEventListener("click", () => {
    gsap.to(searchOverlay, {
      opacity: 0,
      duration: 0.2,
      onComplete: () => searchOverlay?.classList.remove("open"),
    });
    if (searchInput) searchInput.value = "";
    if (searchResults) searchResults.innerHTML = "";
  });

  let searchTimer: ReturnType<typeof setTimeout>;
  searchInput?.addEventListener("input", () => {
    clearTimeout(searchTimer);
    const q = searchInput.value.trim();
    if (q.length < 2) {
      if (searchResults) searchResults.innerHTML = "";
      return;
    }
    searchTimer = setTimeout(async () => {
      try {
        if (searchResults) searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
        const products = await getProducts(undefined, 1, 8, "date", q);
        if (!searchResults) return;
        if (products.length === 0) {
          searchResults.innerHTML = '<div class="search-empty">No products found</div>';
          return;
        }
        searchResults.innerHTML = products
          .map(
            (p) => `
          <div class="search-result-item" data-id="${p.id}" style="cursor:pointer">
            <img src="${proxyImageUrl(p.images[0]?.src || "")}" alt="${p.name}" />
            <div class="search-result-info">
              <span class="search-result-name">${p.name}</span>
              <span class="search-result-price">${p.prices.currency_symbol}${(parseInt(p.prices.price) / Math.pow(10, p.prices.currency_minor_unit)).toLocaleString("en-IN")}</span>
            </div>
          </div>
        `
          )
          .join("");
        gsap.fromTo(".search-result-item", { opacity: 0, x: -10 }, { opacity: 1, x: 0, stagger: 0.05, duration: 0.3 });
      } catch {
        if (searchResults) searchResults.innerHTML = '<div class="search-empty">Search failed</div>';
      }
    }, 350);
  });

  searchResults?.addEventListener("click", (e) => {
    const item = (e.target as HTMLElement).closest(".search-result-item") as HTMLElement;
    if (item && item.dataset.id) {
      window.location.hash = "#/product/" + item.dataset.id;

      // Properly animate out overlay so it doesn't get stuck
      gsap.to(searchOverlay, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => searchOverlay?.classList.remove("open"),
      });

      if (searchInput) searchInput.value = "";
      if (searchResults) searchResults.innerHTML = "";
    }
  });
});