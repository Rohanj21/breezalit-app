// Breezalit / Gro Store — WooCommerce Store API Client (Full)

// In dev: empty so Vite proxy handles /wp-json & /wp-content → Live Link
// In prod (Capacitor): use the full Live Link URL
const isDev = import.meta.env.DEV;
const LIVE_LINK_ORIGIN = "https://boundless-night.localsite.io";
const BASE_URL = isDev ? "" : LIVE_LINK_ORIGIN;
const AUTH = btoa("12345:12345");

/**
 * Rewrite image URLs so <img> tags load through the Vite dev proxy.
 * In dev: strips the Live Link origin so src="/wp-content/…" goes via proxy.
 * In prod (CapacitorHttp): URLs stay unchanged — native HTTP handles it.
 */
export function proxyImageUrl(url: string): string {
    if (!url) return "";
    if (isDev) return url.replace(LIVE_LINK_ORIGIN, "");
    return url;
}

// ── Type Interfaces ────────────────────────────────────────────

export interface ProductImage {
    id: number;
    src: string;
    thumbnail: string;
    alt: string;
    name: string;
}

export interface ProductPrice {
    price: string;
    regular_price: string;
    sale_price: string;
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
}

export interface ProductCategory {
    id: number;
    name: string;
    slug: string;
}

export interface ProductAttribute {
    id: number;
    name: string;
    taxonomy: string;
    has_variations: boolean;
    terms: { id: number; name: string; slug: string }[];
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    permalink: string;
    description: string;
    short_description: string;
    sku: string;
    prices: ProductPrice;
    images: ProductImage[];
    categories: ProductCategory[];
    average_rating: string;
    review_count: number;
    on_sale: boolean;
    attributes: ProductAttribute[];
    is_in_stock: boolean;
    low_stock_remaining: number | null;
    type: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    parent: number;
    description: string;
    image: { src: string; alt: string } | null;
    count: number;
}

export interface WPPage {
    id: number;
    title: { rendered: string };
    content: { rendered: string };
    slug: string;
    excerpt: { rendered: string };
    featured_media: number;
}

// ── Helper ─────────────────────────────────────────────────────

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    // In dev mode the Vite proxy already injects the Auth header server-side,
    // so we skip it here to avoid triggering a CORS preflight OPTIONS request.
    const headers: Record<string, string> = isDev
        ? {}
        : { Authorization: `Basic ${AUTH}` };

    if (options.headers) {
        Object.assign(headers, options.headers);
    }

    let res: Response;
    try {
        res = await fetch(url, { ...options, headers });
    } catch (networkErr) {
        console.error("[API] Network error:", networkErr, "URL:", url);
        throw new Error(`Network error — cannot reach the store. Check your connection.`);
    }
    if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`[API] HTTP ${res.status} from ${url}:`, body);
        throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
}

// ── Products ───────────────────────────────────────────────────

export async function getProducts(
    category?: number,
    page = 1,
    perPage = 20,
    orderby = "date",
    search?: string
): Promise<Product[]> {
    // Store API defaults to descending; price must be ascending for "Low to High"
    const order = orderby === "price" ? "asc" : "desc";
    let url = `/wp-json/wc/store/v1/products?page=${page}&per_page=${perPage}&orderby=${orderby}&order=${order}`;
    if (category) url += `&category=${category}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return apiFetch<Product[]>(url);
}

export async function getProduct(id: number): Promise<Product> {
    return apiFetch<Product>(`/wp-json/wc/store/v1/products/${id}`);
}

export async function getProductVariation(id: number): Promise<Product> {
    return apiFetch<Product>(`/wp-json/wc/store/v1/products/${id}`);
}

export async function getProductVariations(productId: number): Promise<any[]> {
    return apiFetch<any[]>(`/wp-json/wc/v3/products/${productId}/variations`);
}

// ── Checkout & Orders ──────────────────────────────────────────

export async function createOrder(orderData: any): Promise<any> {
    return apiFetch<any>(`/wp-json/wc/v3/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
    });
}

// ── Categories ─────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
    return apiFetch<Category[]>(`/wp-json/wc/store/v1/products/categories`);
}

// ── WP Pages (About Us, etc.) ──────────────────────────────────

export async function getPage(slug: string): Promise<WPPage[]> {
    return apiFetch<WPPage[]>(`/wp-json/wp/v2/pages?slug=${slug}`);
}

export async function getPages(): Promise<WPPage[]> {
    return apiFetch<WPPage[]>(`/wp-json/wp/v2/pages?per_page=20`);
}

// ── Price formatting ───────────────────────────────────────────

export function formatPrice(prices: ProductPrice): string {
    const divisor = Math.pow(10, prices.currency_minor_unit);
    return `${prices.currency_symbol}${(parseInt(prices.price) / divisor).toLocaleString("en-IN")}`;
}

export function formatRegularPrice(prices: ProductPrice): string {
    const divisor = Math.pow(10, prices.currency_minor_unit);
    return `${prices.currency_symbol}${(parseInt(prices.regular_price) / divisor).toLocaleString("en-IN")}`;
}

export function getPriceNumber(prices: ProductPrice): number {
    return parseInt(prices.price) / Math.pow(10, prices.currency_minor_unit);
}

export function getRegularPriceNumber(prices: ProductPrice): number {
    return parseInt(prices.regular_price) / Math.pow(10, prices.currency_minor_unit);
}

export function getDiscountPercent(prices: ProductPrice): number {
    const regular = parseInt(prices.regular_price);
    const sale = parseInt(prices.price);
    if (!regular || regular === sale) return 0;
    return Math.round(((regular - sale) / regular) * 100);
}

// -- Secure Image Observer (APK only) --------------------------

export function setupSecureImageLoader() {
    if (isDev) return;
    const imageCache = new Map<string, string>();
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
            if (m.type === "attributes") {
                // src swapped on an existing <img> (e.g. colour gallery swap)
                const img = m.target as HTMLImageElement;
                if (img.tagName === "IMG" && (img.getAttribute("src") || "").includes(LIVE_LINK_ORIGIN)) {
                    delete img.dataset.secureLoaded;
                    handleImage(img);
                }
                return;
            }
            m.addedNodes.forEach((n) => {
                if (n.nodeType === 1) {
                    const el = n as HTMLElement;
                    if (el.tagName === "IMG") handleImage(el as HTMLImageElement);
                    if (el.querySelectorAll) {
                        el.querySelectorAll("img").forEach(handleImage);
                    }
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
    async function handleImage(img: HTMLImageElement) {
        const src = img.getAttribute("src") || img.src;
        if (!src || !src.includes(LIVE_LINK_ORIGIN) || img.dataset.secureLoaded) return;
        img.dataset.secureLoaded = "true";
        if (imageCache.has(src)) {
            img.src = imageCache.get(src)!;
            return;
        }
        try {
            const res = await fetch(src, { headers: { Authorization: `Basic ${AUTH}` } });
            if (!res.ok) throw new Error("Auth failed");
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            imageCache.set(src, objectUrl);
            img.src = objectUrl;
        } catch (e) {
            console.error("Image load failed", e);
        }
    }
    document.querySelectorAll("img").forEach(handleImage);
}

/**
 * Scrapes the rendered product HTML to extract the custom "Transparent Swatch Image" 
 * injected by the WordPress plugin inside the `data-product_variations` attribute.
 * Returns a Map of Variation ID -> Transparent Swatch URL.
 */
export async function scrapeSwatchImages(permalink: string): Promise<Record<number, string>> {
    try {
        if (!permalink) return {};
        // Proxy the permalink if running locally
        const url = isDev ? permalink.replace(LIVE_LINK_ORIGIN, "") : permalink;
        const response = await fetch(url);
        if (!response.ok) return {};
        const html = await response.text();

        const match = html.match(/data-product_variations="([^"]+)"/);
        if (!match) return {};

        // Decode HTML entities
        const decoded = match[1]
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&#039;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');

        const variationsData = JSON.parse(decoded);
        const swatchMap: Record<number, string> = {};

        variationsData.forEach((v: any) => {
            if (v.variation_id && v.swatch_image_url) {
                swatchMap[v.variation_id] = v.swatch_image_url;
            }
        });

        return swatchMap;
    } catch (e) {
        console.error("Failed to scrape swatch images:", e);
        return {};
    }
}