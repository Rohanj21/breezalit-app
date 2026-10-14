// Coupon lookup/validation against WooCommerce, mapped to the local cart model

import { getCouponByCode, getAllCoupons } from "./api";
import type { WCCoupon } from "./api";
import type { AppliedCoupon } from "./cart-store";

export const PUBLIC_MARKER = "#public";

function toApplied(c: WCCoupon): AppliedCoupon {
    return {
        code: c.code.toUpperCase(),
        discountType: c.discount_type,
        amount: parseFloat(c.amount) || 0,
        minimumAmount: parseFloat(c.minimum_amount) || 0,
        freeShipping: !!c.free_shipping,
        productIds: c.product_ids || [],
        excludedProductIds: c.excluded_product_ids || [],
    };
}

/** Throws an Error with a customer-friendly message when the coupon can't be used. */
export async function fetchCoupon(rawCode: string): Promise<AppliedCoupon> {
    const code = rawCode.trim();
    if (!code) throw new Error("Enter a coupon code");

    let coupon: WCCoupon | null;
    try {
        coupon = await getCouponByCode(code);
    } catch {
        throw new Error("Couldn't check this coupon right now. Please try again.");
    }

    if (!coupon) throw new Error("This coupon code isn't valid");
    if (coupon.date_expires && new Date(coupon.date_expires).getTime() < Date.now()) {
        throw new Error("This coupon has expired");
    }
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        throw new Error("This coupon has been fully redeemed");
    }
    return toApplied(coupon);
}

export interface PublicOffer {
    code: string;
    text: string;
}

/** Coupons the store owner marked as public by adding "#public" to the description. */
let offersCache: { at: number; data: WCCoupon[] } | null = null;

export async function fetchPublicOffers(): Promise<PublicOffer[]> {
    if (!offersCache || Date.now() - offersCache.at > 5 * 60 * 1000) {
        offersCache = { at: Date.now(), data: await getAllCoupons() };
    }
    const all = offersCache.data;
    return all
        .filter((c) => (c.description || "").toLowerCase().includes(PUBLIC_MARKER))
        .filter((c) => !c.date_expires || new Date(c.date_expires).getTime() > Date.now())
        .filter((c) => !c.usage_limit || c.usage_count < c.usage_limit)
        .map((c) => ({
            code: c.code.toUpperCase(),
            text: c.description.replace(new RegExp(PUBLIC_MARKER, "ig"), "").trim() || defaultText(c),
        }));
}

function defaultText(c: WCCoupon): string {
    const amt = parseFloat(c.amount) || 0;
    return c.discount_type === "percent" ? `${amt}% off` : `₹${amt} off`;
}
