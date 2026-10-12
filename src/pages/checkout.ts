// Checkout Page — sectioned form with inline validation, order summary and sticky pay bar
import { getCart, getCartTotal, getCartSavings, getShipping, clearCart } from "../cart-store";
import { createOrder } from "../api";
import gsap from "gsap";

const inr = (n: number) => n.toLocaleString("en-IN");

// WooCommerce state codes for India
const STATES: [string, string][] = [
  ["AP", "Andhra Pradesh"], ["AR", "Arunachal Pradesh"], ["AS", "Assam"], ["BR", "Bihar"],
  ["CT", "Chhattisgarh"], ["GA", "Goa"], ["GJ", "Gujarat"], ["HR", "Haryana"],
  ["HP", "Himachal Pradesh"], ["JK", "Jammu and Kashmir"], ["JH", "Jharkhand"], ["KA", "Karnataka"],
  ["KL", "Kerala"], ["MP", "Madhya Pradesh"], ["MH", "Maharashtra"], ["MN", "Manipur"],
  ["ML", "Meghalaya"], ["MZ", "Mizoram"], ["NL", "Nagaland"], ["OR", "Odisha"],
  ["PB", "Punjab"], ["RJ", "Rajasthan"], ["SK", "Sikkim"], ["TN", "Tamil Nadu"],
  ["TS", "Telangana"], ["TR", "Tripura"], ["UK", "Uttarakhand"], ["UP", "Uttar Pradesh"],
  ["WB", "West Bengal"], ["AN", "Andaman and Nicobar Islands"], ["CH", "Chandigarh"],
  ["DN", "Dadra and Nagar Haveli"], ["DD", "Daman and Diu"], ["DL", "Delhi"],
  ["LA", "Ladakh"], ["LD", "Lakshadweep"], ["PY", "Puducherry"],
];

const PAYMENT_METHODS = [
  { value: "cod", title: "Cash on Delivery", desc: "Pay when your order arrives" },
  { value: "bacs", title: "Bank Transfer / UPI", desc: "Payment details are shared after you place the order" },
];

export async function renderCheckout(): Promise<string> {
  const cart = getCart();

  if (cart.length === 0) {
    return `
      <div class="checkout-page checkout-empty">
        <h2>Your cart is empty</h2>
        <p>You need items in your cart to check out.</p>
        <a href="#/shop" class="btn-primary-pill">Go to Shop</a>
      </div>
    `;
  }

  const subtotal = getCartTotal();
  const cs = cart[0].currencySymbol;
  const shipping = getShipping(subtotal);
  const savings = getCartSavings();
  const finalTotal = subtotal + shipping;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return `
    <div class="checkout-page">
      <div class="co-header">
        <a href="#/cart" class="co-back" aria-label="Back to cart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </a>
        <h1>Checkout</h1>
      </div>

      <ol class="co-steps" aria-label="Checkout progress">
        <li class="done"><span>✓</span>Cart</li>
        <li class="active"><span>2</span>Details</li>
        <li><span>3</span>Confirm</li>
      </ol>

      <form id="checkout-form" novalidate>
        <section class="co-card">
          <h2 class="co-title">Delivery details</h2>

          <div class="co-field">
            <label for="chk-name">Full name</label>
            <input type="text" id="chk-name" autocomplete="name" placeholder="As on your ID" />
            <p class="co-error" data-for="chk-name"></p>
          </div>

          <div class="co-row">
            <div class="co-field">
              <label for="chk-phone">Phone</label>
              <input type="tel" id="chk-phone" inputmode="tel" autocomplete="tel" placeholder="10-digit mobile" />
              <p class="co-error" data-for="chk-phone"></p>
            </div>
            <div class="co-field">
              <label for="chk-email">Email <em>(optional)</em></label>
              <input type="email" id="chk-email" autocomplete="email" placeholder="you@example.com" />
              <p class="co-error" data-for="chk-email"></p>
            </div>
          </div>

          <div class="co-field">
            <label for="chk-address">Address</label>
            <input type="text" id="chk-address" autocomplete="street-address" placeholder="House no., street, area" />
            <p class="co-error" data-for="chk-address"></p>
          </div>

          <div class="co-row">
            <div class="co-field">
              <label for="chk-city">City</label>
              <input type="text" id="chk-city" autocomplete="address-level2" />
              <p class="co-error" data-for="chk-city"></p>
            </div>
            <div class="co-field">
              <label for="chk-pin">PIN code</label>
              <input type="text" id="chk-pin" inputmode="numeric" maxlength="6" autocomplete="postal-code" placeholder="6 digits" />
              <p class="co-error" data-for="chk-pin"></p>
            </div>
          </div>

          <div class="co-field">
            <label for="chk-state">State</label>
            <select id="chk-state" autocomplete="address-level1">
              <option value="">Select state</option>
              ${STATES.map(([code, name]) => `<option value="${code}">${name}</option>`).join("")}
            </select>
            <p class="co-error" data-for="chk-state"></p>
          </div>
        </section>

        <section class="co-card">
          <h2 class="co-title">Payment method</h2>
          <div class="co-pay-list">
            ${PAYMENT_METHODS.map((m, i) => `
              <label class="co-pay">
                <input type="radio" name="payment" value="${m.value}" data-title="${m.title}" ${i === 0 ? "checked" : ""} />
                <span class="co-pay-body">
                  <strong>${m.title}</strong>
                  <small>${m.desc}</small>
                </span>
                <span class="co-pay-dot" aria-hidden="true"></span>
              </label>
            `).join("")}
          </div>
        </section>

        <section class="co-card">
          <h2 class="co-title">Order summary <span class="co-count">${itemCount} item${itemCount === 1 ? "" : "s"}</span></h2>
          <ul class="co-items">
            ${cart.map((item) => `
              <li class="co-item">
                <div class="co-item-img"><img src="${item.image}" alt="" /></div>
                <div class="co-item-info">
                  <span class="co-item-name">${item.name}</span>
                  <span class="co-item-qty">Qty ${item.quantity}</span>
                </div>
                <span class="co-item-price">${cs}${inr(item.price * item.quantity)}</span>
              </li>
            `).join("")}
          </ul>
          <div class="summary-divider"></div>
          <div class="summary-line"><span>Subtotal</span><span>${cs}${inr(subtotal)}</span></div>
          ${savings > 0 ? `<div class="summary-line summary-savings"><span>You save</span><span>− ${cs}${inr(savings)}</span></div>` : ""}
          <div class="summary-line"><span>Shipping</span><span class="${shipping === 0 ? "free-tag" : ""}">${shipping === 0 ? "Free" : `${cs}${inr(shipping)}`}</span></div>
          <div class="summary-divider"></div>
          <div class="summary-line total"><span>Total to pay</span><span>${cs}${inr(finalTotal)}</span></div>
          <p class="summary-note">Inclusive of all taxes</p>
        </section>

        <p class="co-form-error" id="co-form-error" role="alert"></p>
      </form>

      <div class="co-sticky">
        <div class="co-sticky-total">
          <span>Total</span>
          <strong>${cs}${inr(finalTotal)}</strong>
        </div>
        <button type="button" class="co-place-btn" id="btn-place-order">Place order</button>
      </div>
    </div>
  `;
}

type Validator = (value: string) => string;

const VALIDATORS: Record<string, Validator> = {
  "chk-name": (v) => (v.trim().length >= 2 ? "" : "Please enter your full name"),
  "chk-phone": (v) => (/^(\+91[\s-]?)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, "").replace(/^0/, "")) ? "" : "Enter a valid 10-digit mobile number"),
  "chk-email": (v) => (!v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Enter a valid email address"),
  "chk-address": (v) => (v.trim().length >= 5 ? "" : "Please enter your address"),
  "chk-city": (v) => (v.trim() ? "" : "Please enter your city"),
  "chk-pin": (v) => (/^[1-9]\d{5}$/.test(v.trim()) ? "" : "Enter a valid 6-digit PIN code"),
  "chk-state": (v) => (v ? "" : "Please select your state"),
};

function setFieldError(id: string, message: string) {
  const field = document.getElementById(id);
  const err = document.querySelector(`.co-error[data-for="${id}"]`) as HTMLElement | null;
  field?.classList.toggle("invalid", !!message);
  if (err) err.textContent = message;
}

function validateField(id: string): boolean {
  const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
  if (!el) return true;
  const message = VALIDATORS[id](el.value);
  setFieldError(id, message);
  return !message;
}

export function onCheckoutMount() {
  const page = document.querySelector(".checkout-page");
  if (page) {
    gsap.fromTo(page.querySelectorAll(".co-card, .co-steps"),
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" }
    );
  }

  // Validate on blur; clear the error as soon as the user fixes it
  Object.keys(VALIDATORS).forEach((id) => {
    const el = document.getElementById(id);
    el?.addEventListener("blur", () => validateField(id));
    el?.addEventListener("input", () => {
      if (el.classList.contains("invalid")) validateField(id);
    });
    el?.addEventListener("change", () => validateField(id));
  });

  const btn = document.getElementById("btn-place-order") as HTMLButtonElement | null;
  const formError = document.getElementById("co-form-error");

  btn?.addEventListener("click", async () => {
    if (btn.disabled) return;
    if (formError) formError.textContent = "";

    const ids = Object.keys(VALIDATORS);
    const invalid = ids.filter((id) => !validateField(id));
    if (invalid.length > 0) {
      const first = document.getElementById(invalid[0]);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      (first as HTMLElement | null)?.focus({ preventScroll: true });
      return;
    }

    const cart = getCart();
    if (cart.length === 0) {
      if (formError) formError.textContent = "Your cart is empty.";
      return;
    }

    const val = (id: string) => (document.getElementById(id) as HTMLInputElement).value.trim();
    const nameParts = val("chk-name").split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");
    const payment = document.querySelector('input[name="payment"]:checked') as HTMLInputElement | null;
    const phone = val("chk-phone").replace(/[\s-]/g, "").replace(/^(\+91|0)/, "");
    const shippingCost = getShipping(getCartTotal());

    const address = {
      first_name: firstName,
      last_name: lastName,
      address_1: val("chk-address"),
      city: val("chk-city"),
      state: val("chk-state"),
      postcode: val("chk-pin"),
      country: "IN",
    };

    const orderData = {
      payment_method: payment?.value || "cod",
      payment_method_title: payment?.dataset.title || "Cash on Delivery",
      set_paid: false,
      billing: { ...address, phone, email: val("chk-email") },
      shipping: address,
      line_items: cart.map((c) => c.variationId
        ? { product_id: c.productId ?? c.id, variation_id: c.variationId, quantity: c.quantity }
        : { product_id: c.id, quantity: c.quantity }),
      shipping_lines: [{
        method_id: "flat_rate",
        method_title: shippingCost === 0 ? "Free Shipping" : "Standard Delivery",
        total: shippingCost.toFixed(2),
      }],
    };

    const originalText = btn.textContent || "Place order";
    btn.innerHTML = `<span class="loading-spinner"></span> Placing order…`;
    btn.disabled = true;

    try {
      const res = await createOrder(orderData);
      clearCart();
      showSuccessOverlay(res.id);
    } catch (err: any) {
      if (formError) formError.textContent = "We couldn't place your order. " + (err?.message || "Please try again.");
      formError?.scrollIntoView({ behavior: "smooth", block: "center" });
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

function showSuccessOverlay(orderId: number) {
  const overlay = document.createElement("div");
  overlay.className = "success-overlay";
  overlay.innerHTML = `
        <div class="success-content">
            <div class="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2>Order placed!</h2>
            <p>Thank you for shopping at Breezalit.<br>Your order ID is <strong>#${orderId}</strong></p>
            <button class="btn-primary-pill" id="btn-success-home" style="margin-top: 30px; width: 100%;">Continue shopping</button>
        </div>
    `;
  document.body.appendChild(overlay);

  const tl = gsap.timeline();
  tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 })
    .fromTo(".success-icon", { scale: 0, rotation: -45 }, { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2)" })
    .fromTo(".success-content h2", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, "-=0.2")
    .fromTo(".success-content p", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, "-=0.2")
    .fromTo("#btn-success-home", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }, "-=0.2");

  document.getElementById("btn-success-home")?.addEventListener("click", () => {
    gsap.to(overlay, {
      opacity: 0, duration: 0.3, onComplete: () => {
        overlay.remove();
        window.location.hash = "#/";
      }
    });
  });
}
