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
