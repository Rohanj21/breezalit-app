// localStorage-backed wishlist

import type { Product } from "./api";
import { getPriceNumber, proxyImageUrl } from "./api";

export interface WishItem {
    id: number;
    name: string;
    image: string;
    price: number;
    currencySymbol: string;
}

const KEY = "breezalit_wishlist";

function load(): WishItem[] {
    try {
        const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function save(items: WishItem[]) {
    try {
        localStorage.setItem(KEY, JSON.stringify(items));
    } catch { /* storage full or unavailable */ }
    updateWishBadge();
    window.dispatchEvent(new CustomEvent("wishlist-changed"));
}

export function getWishlist(): WishItem[] {
    return load();
}

export function isWished(id: number): boolean {
    return load().some((i) => i.id === id);
}

/** Adds or removes the item. Returns true when the item is now in the wishlist. */
export function toggleWish(item: WishItem): boolean {
    const items = load();
    const exists = items.some((i) => i.id === item.id);
    save(exists ? items.filter((i) => i.id !== item.id) : [item, ...items]);
    return !exists;
}

export function removeWish(id: number) {
    save(load().filter((i) => i.id !== id));
}

export function wishItemFromProduct(p: Product): WishItem {
    return {
        id: p.id,
        name: p.name,
        image: proxyImageUrl(p.images[0]?.thumbnail || p.images[0]?.src || ""),
        price: getPriceNumber(p.prices),
        currencySymbol: p.prices.currency_symbol,
    };
}

/** data-* attributes that let a global click handler toggle a card's heart. */
export function wishAttrs(p: Product): string {
    const it = wishItemFromProduct(p);
    return [
        `data-wl-id="${it.id}"`,
        `data-wl-name="${encodeURIComponent(it.name)}"`,
        `data-wl-image="${encodeURIComponent(it.image)}"`,
        `data-wl-price="${it.price}"`,
        `data-wl-cs="${encodeURIComponent(it.currencySymbol)}"`,
    ].join(" ");
}

export function wishClass(id: number): string {
    return isWished(id) ? " wished" : "";
}

export function wishItemFromElement(el: HTMLElement): WishItem | null {
    const id = parseInt(el.dataset.wlId || "");
    if (!id) return null;
    return {
        id,
        name: decodeURIComponent(el.dataset.wlName || ""),
        image: decodeURIComponent(el.dataset.wlImage || ""),
        price: parseFloat(el.dataset.wlPrice || "0"),
        currencySymbol: decodeURIComponent(el.dataset.wlCs || "₹"),
    };
}

export function updateWishBadge() {
    const badge = document.getElementById("wish-badge");
    if (!badge) return;
    const count = load().length;
    badge.textContent = String(count);
    badge.style.display = count > 0 ? "flex" : "none";
}
