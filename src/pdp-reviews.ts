// Product reviews: load from WooCommerce, summary + list, and a "write a review" sheet

import { getProductReviews, createProductReview } from "./api";
import type { ProductReview } from "./api";
import { showToast } from "./toast";
import gsap from "gsap";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** WordPress returns review text as HTML; keep only its text. */
function plainText(html: string): string {
    const el = document.createElement("div");
    el.innerHTML = html || "";
    return (el.textContent || "").trim();
}

function starString(n: number): string {
    const r = Math.max(0, Math.min(5, Math.round(n)));
    return "★".repeat(r) + "☆".repeat(5 - r);
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string): string {
    return (name || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export interface ReviewStats {
    count: number;
    average: number;
}

export function reviewsShell(): string {
    return `<div id="reviews-root"><div class="rv-loading"><div class="skeleton" style="height:84px;border-radius:14px"></div></div></div>`;
}

export async function mountReviews(
    root: HTMLElement,
    productId: number,
    productName: string,
    onStats?: (s: ReviewStats) => void
) {
    const render = (reviews: ProductReview[], error = false) => {
        const count = reviews.length;
        const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
        onStats?.({ count, average });

        const dist = [5, 4, 3, 2, 1].map((star) => ({
            star,
            n: reviews.filter((r) => Math.round(r.rating) === star).length,
        }));

        root.innerHTML = `
      ${count > 0 ? `
        <div class="rv-summary">
          <div class="rv-score">
            <span class="rv-score-num">${average.toFixed(1)}</span>
            <span class="rv-score-stars">${starString(average)}</span>
            <span class="rv-score-count">${count} review${count === 1 ? "" : "s"}</span>
          </div>
          <div class="rv-bars">
            ${dist.map((d) => `
              <div class="rv-bar-row">
                <span>${d.star}★</span>
                <div class="rv-bar"><div class="rv-bar-fill" style="width:${count ? (d.n / count) * 100 : 0}%"></div></div>
                <span class="rv-bar-n">${d.n}</span>
              </div>`).join("")}
          </div>
        </div>` : `<p class="pdp-empty-note">${error ? "Reviews couldn't be loaded right now." : "No reviews yet. Be the first to share your experience."}</p>`}

      <div class="rv-write-wrap"><button class="btn-secondary-pill" id="btn-write-review" type="button">Write a review</button></div>

      <div class="rv-list">
        ${reviews.map((r) => `
          <article class="rv-card">
            <div class="rv-card-top">
              <div class="rv-avatar">${esc(initials(r.reviewer))}</div>
              <div class="rv-meta">
                <span class="rv-name">${esc(r.reviewer || "Customer")}</span>
                <span class="rv-date">${esc(formatDate(r.date_created))}${r.verified ? " · ✓ Verified purchase" : ""}</span>
              </div>
              <span class="rv-stars">${starString(r.rating)}</span>
            </div>
            <p class="rv-text">${esc(plainText(r.review))}</p>
          </article>`).join("")}
      </div>`;

        root.querySelector("#btn-write-review")?.addEventListener("click", () =>
            openReviewSheet(productId, productName, () => load())
        );
    };

    const load = async () => {
        try {
            render(await getProductReviews(productId));
        } catch (err) {
            console.warn("[Reviews] load failed:", err);
            render([], true);
        }
    };
    await load();
}

function openReviewSheet(productId: number, productName: string, onSubmitted: () => void) {
    const overlay = document.createElement("div");
    overlay.className = "review-modal-overlay";
    overlay.innerHTML = `
    <div class="review-modal-content rv-sheet" role="dialog" aria-modal="true" aria-label="Write a review">
      <div class="review-modal-header">
        <h3>Write a review</h3>
        <button class="btn-close-modal" id="rv-close" type="button" aria-label="Close">×</button>
      </div>
      <p class="rv-sheet-product">${esc(productName)}</p>

      <div class="review-modal-stars" id="rv-stars" role="radiogroup" aria-label="Rating">
        ${[1, 2, 3, 4, 5].map((n) => `<span data-val="${n}" role="radio" aria-label="${n} star${n > 1 ? "s" : ""}">★</span>`).join("")}
      </div>
      <p class="co-error" data-for="rv-stars"></p>

      <div class="co-field">
        <label for="rv-name">Your name</label>
        <input type="text" id="rv-name" autocomplete="name" />
        <p class="co-error" data-for="rv-name"></p>
      </div>
      <div class="co-field">
        <label for="rv-email">Email <em>(not shown publicly)</em></label>
        <input type="email" id="rv-email" autocomplete="email" />
        <p class="co-error" data-for="rv-email"></p>
      </div>
      <div class="co-field">
        <label for="rv-text">Your review</label>
        <textarea id="rv-text" rows="4" placeholder="What did you like or dislike?"></textarea>
        <p class="co-error" data-for="rv-text"></p>
      </div>

      <p class="co-form-error" id="rv-error" role="alert"></p>
      <button class="btn-primary-pill" id="rv-submit" type="button" style="width:100%">Submit review</button>
    </div>`;
    document.body.appendChild(overlay);

    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    gsap.fromTo(".rv-sheet", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" });

    let rating = 0;
    const stars = overlay.querySelectorAll<HTMLElement>("#rv-stars span");
    const setErr = (id: string, msg: string) => {
        const el = overlay.querySelector<HTMLElement>(`.co-error[data-for="${id}"]`);
        if (el) el.textContent = msg;
        overlay.querySelector(`#${id}`)?.classList.toggle("invalid", !!msg);
    };

    stars.forEach((star) => {
        star.addEventListener("click", () => {
            rating = parseInt(star.dataset.val || "0");
            stars.forEach((s) => s.classList.toggle("active", parseInt(s.dataset.val || "0") <= rating));
            setErr("rv-stars", "");
            gsap.fromTo(star, { scale: 0.6 }, { scale: 1, duration: 0.35, ease: "back.out(2)" });
        });
    });

    const close = () => {
        gsap.to(overlay, { opacity: 0, duration: 0.2, onComplete: () => overlay.remove() });
    };
    overlay.querySelector("#rv-close")?.addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

    const submit = overlay.querySelector<HTMLButtonElement>("#rv-submit")!;
    submit.addEventListener("click", async () => {
        const name = (overlay.querySelector("#rv-name") as HTMLInputElement).value.trim();
        const email = (overlay.querySelector("#rv-email") as HTMLInputElement).value.trim();
        const text = (overlay.querySelector("#rv-text") as HTMLTextAreaElement).value.trim();

        setErr("rv-stars", rating ? "" : "Please choose a rating");
        setErr("rv-name", name.length >= 2 ? "" : "Please enter your name");
        setErr("rv-email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Enter a valid email address");
        setErr("rv-text", text.length >= 10 ? "" : "Please write at least 10 characters");
        if (!rating || name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || text.length < 10) return;

        const errBox = overlay.querySelector<HTMLElement>("#rv-error")!;
        errBox.textContent = "";
        submit.disabled = true;
        submit.textContent = "Submitting…";
        try {
            const created = await createProductReview({
                product_id: productId,
                review: text,
                reviewer: name,
                reviewer_email: email,
                rating,
            });
            close();
            if (created.status && created.status !== "approved") {
                showToast("Thanks! Your review will appear once it's approved.");
            } else {
                showToast("Thanks for your review!");
                onSubmitted();
            }
        } catch (err: any) {
            errBox.textContent = "We couldn't submit your review. Please try again.";
            console.warn("[Reviews] submit failed:", err);
            submit.disabled = false;
            submit.textContent = "Submit review";
        }
    });
}
