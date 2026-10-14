// localStorage-backed cart store

export interface CartItem {
    id: number;
    name: string;
    price: number;
    regularPrice: number;
    currencySymbol: string;
    image: string;
    quantity: number;
    onSale: boolean;
    /** Parent product ID when `id` is a variation ID */
    productId?: number;
    variationId?: number;
}

const CART_KEY = "breezalit_cart";

function loadCart(): CartItem[] {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
        return [];
    }
}

function saveCart(items: CartItem[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateBadge();
}

export function getCart(): CartItem[] {
    return loadCart();
}

export function addToCart(item: Omit<CartItem, "quantity">, qty = 1) {
    const cart = loadCart();
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
        existing.quantity = Math.max(1, existing.quantity + qty);
    } else {
        cart.push({ ...item, quantity: qty });
    }
    saveCart(cart);
}

export function removeFromCart(id: number) {
    const cart = loadCart().filter((c) => c.id !== id);
    saveCart(cart);
}

export function updateQuantity(id: number, qty: number) {
    const cart = loadCart();
    const item = cart.find((c) => c.id === id);
    if (item) {
        item.quantity = Math.max(1, qty);
    }
    saveCart(cart);
}

export function clearCart() {
    saveCart([]);
    removeCoupon();
}

export function getCartTotal(): number {
    return loadCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function getCartCount(): number {
    return loadCart().reduce((sum, i) => sum + i.quantity, 0);
}

export function updateBadge() {
    const badge = document.getElementById("cart-badge");
    const count = getCartCount();
    if (badge) {
        badge.textContent = count.toString();
        badge.style.display = count > 0 ? "flex" : "none";
    }
}


// ── Shipping & savings (single source of truth for cart + checkout) ──

export const FREE_DELIVERY_THRESHOLD = 20000;
export const SHIPPING_FEE = 149;

export function getShipping(subtotal: number): number {
    return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : SHIPPING_FEE;
}

/** Total discount versus regular prices for items currently on sale. */
export function getCartSavings(): number {
    return loadCart().reduce(
        (sum, i) => sum + (i.onSale && i.regularPrice > i.price ? (i.regularPrice - i.price) * i.quantity : 0),
        0
    );
}


// ── Coupons ──────────────────────────────────────────────────────

export interface AppliedCoupon {
    code: string;
    discountType: string;
    amount: number;
    minimumAmount: number;
    freeShipping: boolean;
    productIds: number[];
    excludedProductIds: number[];
}

const COUPON_KEY = "breezalit_coupon";

export function getAppliedCoupon(): AppliedCoupon | null {
    try {
        const raw = localStorage.getItem(COUPON_KEY);
        return raw ? (JSON.parse(raw) as AppliedCoupon) : null;
    } catch {
        return null;
    }
}

export function applyCoupon(coupon: AppliedCoupon) {
    localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
}

export function removeCoupon() {
    localStorage.removeItem(COUPON_KEY);
}

export interface CouponStatus {
    coupon: AppliedCoupon | null;
    /** Rupees taken off the subtotal (0 when the coupon doesn't currently qualify) */
    discount: number;
    /** When the cart is below the coupon minimum: how much more to add */
    shortBy: number;
}

export function getCouponStatus(): CouponStatus {
    const coupon = getAppliedCoupon();
    const cart = loadCart();
    if (!coupon || cart.length === 0) return { coupon, discount: 0, shortBy: 0 };

    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    if (coupon.minimumAmount > 0 && subtotal < coupon.minimumAmount) {
        return { coupon, discount: 0, shortBy: Math.ceil(coupon.minimumAmount - subtotal) };
    }

    const eligible = cart.filter((i) => {
        const pid = i.productId ?? i.id;
        if (coupon.excludedProductIds.includes(pid)) return false;
        return coupon.productIds.length === 0 || coupon.productIds.includes(pid);
    });
    const eligibleTotal = eligible.reduce((s, i) => s + i.price * i.quantity, 0);

    let discount = 0;
    if (coupon.discountType === "percent") {
        discount = (eligibleTotal * coupon.amount) / 100;
    } else if (coupon.discountType === "fixed_product") {
        discount = eligible.reduce((s, i) => s + Math.min(coupon.amount, i.price) * i.quantity, 0);
    } else {
        discount = eligible.length > 0 ? Math.min(coupon.amount, eligibleTotal) : 0;
    }
    return { coupon, discount: Math.min(Math.round(discount), Math.round(subtotal)), shortBy: 0 };
}

/** Shipping after taking a free-shipping coupon into account. */
export function getCartShipping(): number {
    const { coupon, discount, shortBy } = getCouponStatus();
    if (coupon?.freeShipping && shortBy === 0 && (discount > 0 || coupon.discountType === "fixed_cart")) return 0;
    return getShipping(getCartTotal());
}

export function getGrandTotal(): number {
    return Math.max(0, getCartTotal() - getCouponStatus().discount) + getCartShipping();
}
