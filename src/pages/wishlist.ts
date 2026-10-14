// Wishlist page — saved fans, quick access and removal
import { getWishlist, removeWish } from "../wishlist-store";
import { animateCards } from "../animations";
import gsap from "gsap";

const inr = (n: number) => n.toLocaleString("en-IN");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function renderWishlist(): Promise<string> {
  const items = getWishlist();

  const header = `
    <div class="wl-top">
      <a href="#/" class="cmp-back" aria-label="Go back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </a>
      <div class="wl-top-text">
        <h1>Wishlist</h1>
        <p>${items.length} saved ${items.length === 1 ? "fan" : "fans"}</p>
      </div>
    </div>`;

  if (items.length === 0) {
    return `
      <div class="wl-page">
        ${header}
        <div class="wl-empty">
          <div class="wl-empty-icon">♡</div>
          <h2>Nothing saved yet</h2>
          <p>Tap the heart on any fan to keep it here for later.</p>
          <a href="#/shop" class="btn-primary-pill">Browse fans</a>
        </div>
      </div>`;
  }

  return `
    <div class="wl-page">
      ${header}
      <div class="wl-grid" id="wl-grid">
        ${items.map((i) => `
          <div class="wl-card" data-id="${i.id}">
            <a href="#/product/${i.id}" class="wl-img"><img src="${i.image}" alt="" loading="lazy" /></a>
            <button class="wl-remove" data-remove="${i.id}" type="button" aria-label="Remove ${esc(i.name)} from wishlist">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#e02b2b" stroke="#e02b2b" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            <div class="wl-body">
              <a href="#/product/${i.id}" class="wl-name">${i.name}</a>
              <span class="wl-price">${i.currencySymbol}${inr(i.price)}</span>
              <a href="#/product/${i.id}" class="wl-view">View</a>
            </div>
          </div>`).join("")}
      </div>
    </div>`;
}

export function onWishlistMount() {
  animateCards("#wl-grid .wl-card", 0.06);

  document.getElementById("wl-grid")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-remove]");
    if (!btn) return;
    const id = parseInt(btn.dataset.remove || "0");
    const card = btn.closest<HTMLElement>(".wl-card");
    removeWish(id);

    const finish = async () => {
      const content = document.getElementById("page-content");
      if (content) {
        content.innerHTML = await renderWishlist();
        onWishlistMount();
      }
    };
    if (card) {
      gsap.to(card, { opacity: 0, scale: 0.9, duration: 0.2, onComplete: finish });
    } else {
      finish();
    }
  });
}
