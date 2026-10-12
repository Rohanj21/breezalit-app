// "Frequently bought together" — selectable list with a live total
import { getProducts, getProductVariation, proxyImageUrl, getPriceNumber } from "../api";
import type { Product } from "../api";
import { addToCart } from "../cart-store";
import { animateFlyToCart, animateBadgePop } from "../animations";
import { showToast } from "../toast";
import gsap from "gsap";

const BUNDLE_SIZE = 3;

let cachedProducts: Product[] | null = null;
const bundleProducts = new Map<number, Product>();

const inr = (n: number) => n.toLocaleString("en-IN");

/**
 * @param excludeId  product currently being viewed
 * @param excludeIds products to leave out (e.g. already in the cart)
 */
export async function renderBundleCard(excludeId?: number, excludeIds: number[] = []): Promise<string> {
    if (!cachedProducts) {
        cachedProducts = await getProducts(undefined, 1, 12, "popularity");
    }

    const skip = new Set<number>(excludeIds);
    if (excludeId) skip.add(excludeId);

    // Stable pick (no shuffling, so the bundle doesn't change on every re-render)
    const items = cachedProducts
        .filter((p) => !skip.has(p.id) && p.is_in_stock)
        .slice(0, BUNDLE_SIZE);
    if (items.length < 2) return "";

    items.forEach((p) => bundleProducts.set(p.id, p));

    const currSym = items[0].prices.currency_symbol || "₹";
    const total = items.reduce((sum, p) => sum + getPriceNumber(p.prices), 0);

    const rows = items.map((p) => {
        const price = getPriceNumber(p.prices);
        const img = proxyImageUrl(p.images[0]?.thumbnail || p.images[0]?.src || "");
        return `
            <li class="bundle-v2-item" data-id="${p.id}" data-price="${price}">
                <label class="bundle-v2-check" aria-label="Include ${p.name}">
                    <input type="checkbox" checked />
                    <span class="bundle-v2-box" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                </label>
                <a href="#/product/${p.id}" class="bundle-v2-img"><img src="${img}" alt="" loading="lazy" /></a>
                <div class="bundle-v2-info">
                    <a href="#/product/${p.id}" class="bundle-v2-name">${p.name}</a>
                    <span class="bundle-v2-price">${currSym}${inr(price)}</span>
                </div>
            </li>`;
    }).join("");

    return `
        <section class="bundle-v2" data-currency="${currSym}">
            <div class="bundle-v2-head">
                <h3>Frequently bought together</h3>
            </div>
            <ul class="bundle-v2-list">${rows}</ul>
            <div class="bundle-v2-foot">
                <div class="bundle-v2-total">
                    <span class="bundle-v2-count">${items.length} items</span>
                    <strong class="bundle-v2-sum">${currSym}${inr(total)}</strong>
                </div>
                <button class="bundle-v2-btn" type="button">Add ${items.length} to cart</button>
            </div>
        </section>
    `;
}

/** Variable products need a concrete variation in the cart so the order can be created. */
async function resolveCartItem(p: Product) {
    const variations = (p as any).variations as { id: number; attributes: { name: string; value: string }[] }[] | undefined;

    if (p.type === "variable" && variations?.length) {
        const first = variations[0];
        const vp = await getProductVariation(first.id);
        const color = first.attributes?.find((a) => a.value)?.value;
        return {
            id: vp.id,
            productId: p.id,
            variationId: vp.id,
            name: color ? `${p.name} – ${color}` : p.name,
            price: getPriceNumber(vp.prices),
            regularPrice: parseInt(vp.prices.regular_price) / Math.pow(10, vp.prices.currency_minor_unit),
            currencySymbol: vp.prices.currency_symbol,
            image: proxyImageUrl(vp.images[0]?.src || p.images[0]?.src || ""),
            onSale: vp.on_sale,
        };
    }

    return {
        id: p.id,
        name: p.name,
        price: getPriceNumber(p.prices),
        regularPrice: parseInt(p.prices.regular_price) / Math.pow(10, p.prices.currency_minor_unit),
        currencySymbol: p.prices.currency_symbol,
        image: proxyImageUrl(p.images[0]?.src || ""),
        onSale: p.on_sale,
    };
}

export function onBundleMount(onAddedCallback?: () => void) {
    const wrappers = document.querySelectorAll<HTMLElement>(".bundle-v2");
    if (!wrappers.length) return;

    gsap.fromTo(wrappers,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
    );
    gsap.fromTo(".bundle-v2-item",
        { opacity: 0, x: 16 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, delay: 0.15, ease: "power2.out" }
    );

    wrappers.forEach((wrapper) => {
        const btn = wrapper.querySelector<HTMLButtonElement>(".bundle-v2-btn");
        const sumEl = wrapper.querySelector<HTMLElement>(".bundle-v2-sum");
        const countEl = wrapper.querySelector<HTMLElement>(".bundle-v2-count");
        const currSym = wrapper.dataset.currency || "₹";
        if (!btn || !sumEl || !countEl) return;

        const checkedRows = () =>
            Array.from(wrapper.querySelectorAll<HTMLElement>(".bundle-v2-item"))
                .filter((row) => row.querySelector<HTMLInputElement>("input")?.checked);

        const refresh = () => {
            const rows = checkedRows();
            const total = rows.reduce((s, r) => s + parseFloat(r.dataset.price || "0"), 0);
            sumEl.textContent = `${currSym}${inr(total)}`;
            countEl.textContent = `${rows.length} item${rows.length === 1 ? "" : "s"}`;
            btn.textContent = rows.length > 0 ? `Add ${rows.length} to cart` : "Select items";
            btn.disabled = rows.length === 0;
            wrapper.querySelectorAll(".bundle-v2-item").forEach((row) => {
                row.classList.toggle("unchecked", !row.querySelector<HTMLInputElement>("input")?.checked);
            });
        };

        wrapper.addEventListener("change", refresh);

        btn.addEventListener("click", async () => {
            const rows = checkedRows();
            if (rows.length === 0 || btn.disabled) return;

            btn.disabled = true;
            btn.textContent = "Adding…";

            let added = 0;
            for (const row of rows) {
                const product = bundleProducts.get(parseInt(row.dataset.id || "0"));
                if (!product) continue;
                try {
                    addToCart(await resolveCartItem(product), 1);
                    added++;
                    const img = row.querySelector<HTMLElement>(".bundle-v2-img");
                    if (img) animateFlyToCart(img);
                } catch (err) {
                    console.error("[Bundle] could not add", product.name, err);
                }
            }

            if (added > 0) {
                animateBadgePop();
                showToast(`${added} item${added === 1 ? "" : "s"} added to cart`);
                btn.textContent = "Added ✓";
                btn.classList.add("done");
                setTimeout(() => {
                    btn.classList.remove("done");
                    refresh();
                    onAddedCallback?.();
                }, 700);
            } else {
                showToast("Couldn't add these items. Please try again.", "error");
                refresh();
            }
        });

        refresh();
    });
}
