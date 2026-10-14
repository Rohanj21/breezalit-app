// Cart Page — clear hierarchy, delivery progress, swipe-to-delete, sticky checkout bar
import {
  getCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  getCartTotal,
  getCartSavings,
  getCartShipping,
  getCouponStatus,
  getGrandTotal,
  applyCoupon,
  removeCoupon,
  FREE_DELIVERY_THRESHOLD,
} from "../cart-store";
import { fetchCoupon } from "../coupons";
import { showToast } from "../toast";
import { renderBundleCard, onBundleMount } from "../components/bundle-card";
import { animateBadgePop, animateCountUp, animateRemoveItem, animateCartItems, animateShake } from "../animations";
import gsap from "gsap";

const inr = (n: number) => n.toLocaleString("en-IN");

export async function renderCart(): Promise<string> {
  const cart = getCart();

  if (cart.length === 0) {
    return `
      <div class="cart-page cart-empty">
        <div class="empty-cart-state">
          <div class="empty-cart-visual">
            <div class="empty-cart-circle">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
          </div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet.<br>Start browsing our collection.</p>
          <a href="#/shop" class="btn-primary-pill">Explore Products →</a>
        </div>
      </div>
    `;
  }

  const total = getCartTotal();
  const cs = cart[0].currencySymbol;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const remaining = FREE_DELIVERY_THRESHOLD - total;
  const progressPercent = Math.min(100, (total / FREE_DELIVERY_THRESHOLD) * 100);
  const shipping = getCartShipping();
  const savings = getCartSavings();
  const couponStatus = getCouponStatus();
  const grandTotal = getGrandTotal();

  return `
    <div class="cart-page">
      <div class="cart-header">
        <div class="cart-title-group">
          <h1 class="page-title">Cart</h1>
          <span class="cart-count-label">${itemCount} item${itemCount === 1 ? "" : "s"}</span>
        </div>
        <button class="btn-clear-link" id="btn-clear" type="button">Clear all</button>
      </div>

      <div class="delivery-progress-section">
        ${remaining > 0
      ? `<p class="delivery-msg">Add <strong>${cs}${inr(remaining)}</strong> more for <span class="free-tag">Free Delivery</span></p>`
      : `<p class="delivery-msg delivery-success">You've unlocked <span class="free-tag">Free Delivery</span></p>`
    }
        <div class="delivery-bar-track">
          <div class="delivery-bar-fill" id="delivery-bar" style="width: ${progressPercent}%"></div>
        </div>
      </div>

      <div class="cart-items" id="cart-items">
        ${cart.map((item) => `
          <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-swipe-layer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>Delete</span>
            </div>
            <div class="cart-item-content">
              <a href="#/product/${item.productId ?? item.id}" class="cart-item-img">
                <img src="${item.image}" alt="${item.name}" />
              </a>
              <div class="cart-item-body">
                <h3 class="cart-item-name">${item.name}</h3>
                <div class="cart-item-price-row">
                  <span class="price-current">${cs}${inr(item.price)}</span>
                  ${item.onSale && item.regularPrice > item.price ? `<span class="price-old">${cs}${inr(item.regularPrice)}</span>` : ""}
                </div>
                <div class="cart-item-bottom">
                  <div class="qty-control compact">
                    <button class="qty-btn cart-qty" data-action="minus" data-id="${item.id}" aria-label="Decrease quantity">−</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn cart-qty" data-action="plus" data-id="${item.id}" aria-label="Increase quantity">+</button>
                  </div>
                  <span class="cart-line-total">${cs}${inr(item.price * item.quantity)}</span>
                  <button class="btn-remove-item" data-id="${item.id}" aria-label="Remove ${item.name}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="cart-coupon" id="cart-coupon">
        ${couponStatus.coupon
      ? `<div class="coupon-applied ${couponStatus.shortBy > 0 ? "warn" : ""}">
            <span class="coupon-applied-icon">🏷️</span>
            <div class="coupon-applied-text">
              <strong>${couponStatus.coupon.code}</strong>
              <small>${couponStatus.shortBy > 0
          ? `Add ${cs}${inr(couponStatus.shortBy)} more to use this coupon`
          : `You save ${cs}${inr(couponStatus.discount)}`}</small>
            </div>
            <button class="coupon-remove" id="coupon-remove" type="button">Remove</button>
          </div>`
      : `<label class="coupon-label" for="coupon-input">Have a coupon?</label>
          <div class="coupon-row">
            <input type="text" id="coupon-input" placeholder="Enter code" autocomplete="off" autocapitalize="characters" />
            <button class="coupon-apply" id="coupon-apply" type="button">Apply</button>
          </div>
          <p class="co-error" id="coupon-error"></p>`}
      </div>

      <div class="cart-summary-card">
        <h3>Order summary</h3>
        <div class="summary-line"><span>Subtotal (${itemCount} item${itemCount === 1 ? "" : "s"})</span><span id="summary-subtotal">${cs}${inr(total)}</span></div>
        ${savings > 0 ? `<div class="summary-line summary-savings"><span>You save</span><span>− ${cs}${inr(savings)}</span></div>` : ""}
        ${couponStatus.discount > 0 ? `<div class="summary-line summary-savings"><span>Coupon (${couponStatus.coupon!.code})</span><span>− ${cs}${inr(couponStatus.discount)}</span></div>` : ""}
        <div class="summary-line"><span>Shipping</span><span class="${shipping === 0 ? "free-tag" : ""}">${shipping === 0 ? "Free" : `${cs}${inr(shipping)}`}</span></div>
        <div class="summary-divider"></div>
        <div class="summary-line total"><span>Total</span><span id="summary-total">${cs}${inr(grandTotal)}</span></div>
        <p class="summary-note">Inclusive of all taxes</p>
      </div>

      <div id="cart-bundle-container" class="cart-bundle"></div>

      <div class="cart-sticky">
        <div class="cart-sticky-total">
          <span>Total</span>
          <strong>${cs}${inr(grandTotal)}</strong>
        </div>
        <a href="#/checkout" class="cart-sticky-btn">Checkout
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </div>
    </div>
  `;
}

export function onCartMount() {
  animateCartItems();

  // GSAP summary card
  gsap.fromTo(".cart-summary-card",
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.5, delay: 0.2, ease: "power2.out" }
  );

  // Animate delivery bar
  const bar = document.getElementById("delivery-bar");
  if (bar) {
    gsap.fromTo(bar,
      { width: "0%" },
      { width: bar.style.width || "0%", duration: 1, delay: 0.3, ease: "power2.out" }
    );
  }

  // Animate empty cart visual
  gsap.fromTo(".empty-cart-circle",
    { scale: 0, rotation: -15 },
    { scale: 1, rotation: 0, duration: 0.7, ease: "elastic.out(1, 0.5)" }
  );

  // ── Swipe-to-delete Touch Handling ──
  setupSwipeToDelete();

  const container = document.getElementById("cart-items");
  container?.addEventListener("click", async (e) => {
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn) return;

    const id = parseInt(btn.dataset.id || "0");
    if (!id) return;

    if (btn.classList.contains("cart-qty")) {
      const action = btn.dataset.action;
      const item = getCart().find((c) => c.id === id);
      if (!item) return;

      if (action === "minus") {
        if (item.quantity > 1) {
          updateQuantity(id, item.quantity - 1);
        } else {
          animateShake(btn.closest(".cart-item") as HTMLElement);
          return;
        }
      } else {
        updateQuantity(id, item.quantity + 1);
      }
      animateBadgePop();
      await reRender();
    }

    if (btn.classList.contains("btn-remove-item")) {
      const el = btn.closest(".cart-item") as HTMLElement;
      if (el) await animateRemoveItem(el);
      removeFromCart(id);
      animateBadgePop();
      await reRender();
    }
  });

  document.getElementById("btn-clear")?.addEventListener("click", async () => {
    if (!window.confirm("Remove all items from your cart?")) return;
    const items = Array.from(document.querySelectorAll(".cart-item")) as HTMLElement[];
    await Promise.all(items.map((item) => animateRemoveItem(item)));
    clearCart();
    animateBadgePop();
    await reRender();
  });

  // ── Coupon apply / remove ──
  const couponInput = document.getElementById("coupon-input") as HTMLInputElement | null;
  const couponBtn = document.getElementById("coupon-apply") as HTMLButtonElement | null;
  const couponError = document.getElementById("coupon-error");
  const submitCoupon = async () => {
    if (!couponInput || !couponBtn || couponBtn.disabled) return;
    if (couponError) couponError.textContent = "";
    couponBtn.disabled = true;
    couponBtn.textContent = "Checking…";
    try {
      applyCoupon(await fetchCoupon(couponInput.value));
      showToast("Coupon applied");
      await reRender();
    } catch (err: any) {
      if (couponError) couponError.textContent = err?.message || "Couldn't apply this coupon";
      couponBtn.disabled = false;
      couponBtn.textContent = "Apply";
    }
  };
  couponBtn?.addEventListener("click", submitCoupon);
  couponInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") submitCoupon(); });
  document.getElementById("coupon-remove")?.addEventListener("click", async () => {
    removeCoupon();
    await reRender();
  });

  const bundleContainer = document.getElementById("cart-bundle-container");
  if (bundleContainer) {
    renderBundleCard(undefined, getCart().map((i) => i.productId ?? i.id))
      .then((html) => {
        if (!document.body.contains(bundleContainer)) return; // page changed meanwhile
        bundleContainer.innerHTML = html;
        onBundleMount(async () => {
          // Re-render so the newly added bundle shows up
          await reRender();
          animateBadgePop();
        });
      })
      .catch(() => { /* upsell is optional */ });
  }
}

function setupSwipeToDelete() {
  const items = document.querySelectorAll(".cart-item-content");
  items.forEach(item => {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    const el = item as HTMLElement;

    el.addEventListener("touchstart", (e) => {
      startX = (e as TouchEvent).touches[0].clientX;
      currentX = 0;
      isDragging = true;
      el.style.transition = "none";
    }, { passive: true });

    el.addEventListener("touchmove", (e) => {
      if (!isDragging) return;
      currentX = (e as TouchEvent).touches[0].clientX - startX;
      if (currentX < 0) {
        el.style.transform = `translateX(${Math.max(currentX, -100)}px)`;
      }
    }, { passive: true });

    el.addEventListener("touchend", async () => {
      isDragging = false;
      el.style.transition = "transform 0.3s ease";
      if (currentX < -60) {
        // Swiped far enough — delete
        const cartItem = el.closest(".cart-item") as HTMLElement;
        const id = parseInt(cartItem?.dataset.id || "0");
        if (id) {
          await animateRemoveItem(cartItem);
          removeFromCart(id);
          animateBadgePop();
          await reRender();
        }
      } else {
        el.style.transform = "translateX(0)";
      }
      currentX = 0;
    });
  });
}

async function reRender() {
  const content = document.getElementById("page-content");
  if (content) {
    const oldTotal = document.getElementById("summary-total");
    const oldVal = oldTotal ? parseInt(oldTotal.textContent?.replace(/[^\d]/g, "") || "0") : 0;

    content.innerHTML = await renderCart();
    onCartMount();

    // Animate count-up on total if there's a change
    const newTotal = document.getElementById("summary-total");
    if (newTotal && oldVal > 0) {
      const newVal = parseInt(newTotal.textContent?.replace(/[^\d]/g, "") || "0");
      if (newVal !== oldVal) {
        const cs = getCart()[0]?.currencySymbol || "₹";
        animateCountUp(newTotal, oldVal, newVal, cs);
      }
    }
  }
}
