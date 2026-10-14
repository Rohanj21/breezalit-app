// Breezalit — Fan Comparison
// Pick up to 3 fans, see them side-by-side with winners highlighted,
// hide identical rows, and share the comparison via URL.
import { getProducts, getPriceNumber, getDiscountPercent, formatPrice, proxyImageUrl } from "../api";
import type { Product } from "../api";
import { showToast } from "../toast";
import gsap from "gsap";

const MAX_COMPARE = 3;

// Used for the "power cost per year" estimate
const HOURS_PER_DAY = 8;
const RATE_PER_UNIT = 8; // ₹ per kWh

const IMG_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#f1f3f6"/><g fill="none" stroke="#b6bcc7" stroke-width="2.5" stroke-linecap="round"><circle cx="40" cy="40" r="4"/><path d="M40 36c-2-10 2-18 8-18 4 0 5 6 0 12M44 40c10-2 18 2 18 8 0 4-6 5-12 0M40 44c2 10-2 18-8 18-4 0-5-6 0-12M36 40c-10 2-18-2-18-8 0-4 6-5 12 0"/></g></svg>`
  );

// ── Spec extraction ──────────────────────────────────────────────

const MISSING = "—";

function attrText(product: Product, keys: string[]): string {
  for (const attr of product.attributes) {
    const slug = attr.name.toLowerCase().replace(/\s+/g, "-");
    if (keys.includes(slug) && attr.terms.length > 0) {
      return attr.terms.map((t) => t.name).join(", ");
    }
  }
  return MISSING;
}

function firstNumber(text: string): number {
  const m = text.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

function colorCount(product: Product): number {
  const a = product.attributes.find((x) => ["color", "colors", "colour", "colours"].includes(x.name.toLowerCase()));
  return a ? a.terms.length : 0;
}

function wattsOf(product: Product): number {
  return firstNumber(attrText(product, ["watts", "watt", "power"]));
}

interface Cell {
  text: string; // what the user sees
  num: number; // what we rank by (0 = not available)
}

interface SpecRow {
  key: string;
  label: string;
  icon: string;
  win: "lower" | "higher" | "none";
  tag: string; // label on the winning cell
  get: (p: Product) => Cell;
}

const NA: Cell = { text: MISSING, num: 0 };

const ROWS: SpecRow[] = [
  {
    key: "price", label: "Price", icon: "💰", win: "lower", tag: "Lowest",
    get: (p) => ({ text: formatPrice(p.prices), num: getPriceNumber(p.prices) }),
  },
  {
    key: "discount", label: "Discount", icon: "🏷️", win: "higher", tag: "Biggest",
    get: (p) => {
      const d = getDiscountPercent(p.prices);
      return d > 0 ? { text: `${d}% off`, num: d } : { text: "No offer", num: 0 };
    },
  },
  {
    key: "watts", label: "Power", icon: "⚡", win: "lower", tag: "Most efficient",
    get: (p) => {
      const t = attrText(p, ["watts", "watt", "power"]);
      return t === MISSING ? NA : { text: /w/i.test(t) ? t : `${t} W`, num: firstNumber(t) };
    },
  },
  {
    key: "energy", label: "Power cost / year", icon: "🔌", win: "lower", tag: "Cheapest to run",
    get: (p) => {
      const w = wattsOf(p);
      if (!w) return NA;
      const cost = Math.round((w / 1000) * HOURS_PER_DAY * 365 * RATE_PER_UNIT);
      return { text: `≈ ₹${cost.toLocaleString("en-IN")}`, num: cost };
    },
  },
  {
    key: "rpm", label: "Speed (RPM)", icon: "🔄", win: "higher", tag: "Fastest",
    get: (p) => {
      const t = attrText(p, ["rpm", "r.p.m.", "speed"]);
      return t === MISSING ? NA : { text: t, num: firstNumber(t) };
    },
  },
  {
    key: "air", label: "Air delivery", icon: "💨", win: "higher", tag: "Most air",
    get: (p) => {
      const t = attrText(p, ["air-delivery", "air-flow"]);
      return t === MISSING ? NA : { text: t, num: firstNumber(t) };
    },
  },
  {
    key: "size", label: "Size", icon: "📏", win: "none", tag: "",
    get: (p) => {
      const t = attrText(p, ["size", "sweep-size", "blade-size"]);
      return t === MISSING ? NA : { text: t, num: firstNumber(t) };
    },
  },
  {
    key: "colors", label: "Colour options", icon: "🎨", win: "higher", tag: "Most choice",
    get: (p) => {
      const n = colorCount(p);
      return n > 0 ? { text: `${n} option${n === 1 ? "" : "s"}`, num: n } : NA;
    },
  },
  {
    key: "rating", label: "Customer rating", icon: "⭐", win: "higher", tag: "Top rated",
    get: (p) => {
      const r = parseFloat(p.average_rating) || 0;
      return p.review_count > 0 && r > 0
        ? { text: `★ ${r.toFixed(1)} (${p.review_count})`, num: r }
        : { text: "No reviews yet", num: 0 };
    },
  },
  {
    key: "category", label: "Category", icon: "📂", win: "none", tag: "",
    get: (p) => {
      const t = p.categories.map((c) => c.name).join(", ");
      return t ? { text: t, num: 0 } : NA;
    },
  },
  {
    key: "stock", label: "Availability", icon: "📦", win: "none", tag: "",
    get: (p) => ({ text: p.is_in_stock ? "In stock" : "Out of stock", num: 0 }),
  },
];

// ── Page shell ───────────────────────────────────────────────────

export async function renderCompare(): Promise<string> {
  return `
    <div class="cmp" id="compare-page">
      <div class="cmp-top">
        <a href="#/" class="cmp-back" aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </a>
        <div class="cmp-top-text">
          <h1>Compare fans</h1>
          <p id="cmp-sub">Choose up to ${MAX_COMPARE} fans to compare side by side</p>
        </div>
        <button class="cmp-reset" id="cmp-reset" type="button" hidden>Reset</button>
      </div>

      <div class="cmp-picker">
        <div class="cmp-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" id="cmp-search" placeholder="Search fans" autocomplete="off" />
        </div>
        <div class="cmp-picker-scroll" id="cmp-picker">
          ${Array(4).fill('<div class="cmp-pick skeleton" style="height:128px"></div>').join("")}
        </div>
      </div>

      <div id="cmp-board"></div>
    </div>
  `;
}

export function onCompareMount() {
  const picker = document.getElementById("cmp-picker");
  const board = document.getElementById("cmp-board");
  const resetBtn = document.getElementById("cmp-reset") as HTMLButtonElement | null;
  const searchEl = document.getElementById("cmp-search") as HTMLInputElement | null;
  const subEl = document.getElementById("cmp-sub");
  if (!picker || !board || !resetBtn || !searchEl || !subEl) return;

  let all: Product[] = [];
  let selected: number[] = [];
  let query = "";
  let diffOnly = false;
  let tableShownBefore = false;

  // Broken images → neutral placeholder (error events don't bubble, so capture)
  document.getElementById("compare-page")?.addEventListener("error", (e) => {
    const t = e.target as HTMLElement;
    if (t instanceof HTMLImageElement && t.src !== IMG_FALLBACK) t.src = IMG_FALLBACK;
  }, true);

  // Pre-select from a shared link: #/compare?ids=12,34
  const idsParam = new URLSearchParams(window.location.hash.split("?")[1] || "").get("ids");
  const initialIds = idsParam ? idsParam.split(",").map((n) => parseInt(n)).filter(Boolean) : [];

  const img = (p: Product) => proxyImageUrl(p.images[0]?.thumbnail || p.images[0]?.src || "") || IMG_FALLBACK;
  const productById = (id: number) => all.find((p) => p.id === id);

  function syncUrl() {
    const q = selected.length ? `?ids=${selected.join(",")}` : "";
    history.replaceState(null, "", `#/compare${q}`);
  }

  // ── Picker ──
  function renderPicker() {
    const q = query.trim().toLowerCase();
    const list = q ? all.filter((p) => p.name.toLowerCase().includes(q)) : all;

    if (list.length === 0) {
      picker!.innerHTML = `<p class="cmp-none">No fans match "${query.replace(/</g, "&lt;")}"</p>`;
      return;
    }

    picker!.innerHTML = list.map((p) => {
      const on = selected.includes(p.id);
      return `
        <button class="cmp-pick ${on ? "on" : ""}" data-id="${p.id}" type="button" aria-pressed="${on}">
          <span class="cmp-pick-img">
            <img src="${img(p)}" alt="" loading="lazy" />
            <span class="cmp-pick-check" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          </span>
          <span class="cmp-pick-name">${p.name}</span>
          <span class="cmp-pick-price">${formatPrice(p.prices)}</span>
        </button>`;
    }).join("");
  }

  // ── Board ──
  function renderBoard() {
    const items = selected.map(productById).filter((p): p is Product => !!p);
    resetBtn!.hidden = items.length === 0;
    subEl!.textContent = items.length === 0
      ? `Choose up to ${MAX_COMPARE} fans to compare side by side`
      : `${items.length} of ${MAX_COMPARE} selected`;

    if (items.length < 2) {
      board!.innerHTML = `
        <div class="cmp-hint">
          <div class="cmp-hint-icon">⚖️</div>
          <h2>${items.length === 0 ? "Pick two fans to start" : "Pick one more fan"}</h2>
          <p>Tap the fans above. We'll line up price, power, speed and more, and highlight the best in each row.</p>
          ${items.length === 1 ? `<div class="cmp-hint-chip"><img src="${img(items[0])}" alt="" /> ${items[0].name}</div>` : ""}
        </div>`;
      tableShownBefore = false;
      return;
    }

    const cols = items.length;
    const rows = ROWS.map((row) => {
      const cells = items.map((p) => row.get(p));
      const available = cells.some((c) => c.text !== MISSING);
      const allSame = cells.every((c) => c.text === cells[0].text);
      let winners: number[] = [];
      if (row.win !== "none" && !allSame) {
        const ranked = cells.map((c) => c.num).filter((n) => n > 0);
        if (ranked.length > 0) {
          const target = row.win === "lower" ? Math.min(...ranked) : Math.max(...ranked);
          winners = cells.map((c, i) => (c.num === target ? i : -1)).filter((i) => i >= 0);
        }
      }
      return { row, cells, available, allSame, winners };
    }).filter((r) => r.available);

    // Wins per product → "best pick"
    const wins = items.map((_, i) => rows.filter((r) => r.winners.includes(i)).length);
    const maxWins = Math.max(...wins);
    const leader = maxWins > 0 && wins.filter((w) => w === maxWins).length === 1 ? wins.indexOf(maxWins) : -1;

    const visibleRows = diffOnly ? rows.filter((r) => !r.allSame) : rows;
    const hasEnergyRow = rows.some((r) => r.row.key === "energy");

    board!.innerHTML = `
      <div class="cmp-sticky">
        <div class="cmp-heads cols-${cols}">
          ${items.map((p, i) => `
            <div class="cmp-head ${i === leader ? "leader" : ""}">
              <button class="cmp-remove" data-remove="${p.id}" aria-label="Remove ${p.name}" type="button">×</button>
              ${i === leader ? '<span class="cmp-badge">Best pick</span>' : ""}
              <div class="cmp-head-img"><img src="${img(p)}" alt="" /></div>
              <span class="cmp-head-name">${p.name}</span>
              <span class="cmp-head-price">${formatPrice(p.prices)}</span>
              <span class="cmp-head-wins">${wins[i]} win${wins[i] === 1 ? "" : "s"}</span>
            </div>`).join("")}
        </div>
      </div>

      <div class="cmp-toolbar">
        <label class="cmp-switch">
          <input type="checkbox" id="cmp-diff" ${diffOnly ? "checked" : ""} />
          <span class="cmp-switch-track"><span class="cmp-switch-thumb"></span></span>
          <span>Show differences only</span>
        </label>
      </div>

      <div class="cmp-table">
        ${visibleRows.length === 0
          ? `<p class="cmp-none">These fans have identical specs.</p>`
          : visibleRows.map(({ row, cells, allSame, winners }) => `
          <div class="cmp-row ${allSame ? "same" : ""}">
            <div class="cmp-row-label"><span>${row.icon}</span>${row.label}</div>
            <div class="cmp-vals cols-${cols}">
              ${cells.map((c, i) => `
                <div class="cmp-val ${winners.includes(i) ? "best" : ""} ${c.text === MISSING || c.text === "No reviews yet" ? "na" : ""}">
                  <span class="cmp-val-text">${c.text}</span>
                  ${winners.includes(i) && row.tag ? `<span class="cmp-val-tag">${row.tag}</span>` : ""}
                </div>`).join("")}
            </div>
          </div>`).join("")}
      </div>

      ${hasEnergyRow ? `<p class="cmp-foot">Power cost is an estimate at ${HOURS_PER_DAY} hrs/day and ₹${RATE_PER_UNIT} per unit.</p>` : ""}

      <div class="cmp-actions cols-${cols}">
        ${items.map((p) => `<a href="#/product/${p.id}" class="cmp-view">View<span> details</span></a>`).join("")}
      </div>
    `;

    if (!tableShownBefore) {
      gsap.fromTo("#cmp-board .cmp-head, #cmp-board .cmp-row",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: "power2.out", clearProps: "opacity,transform" });
    }
    tableShownBefore = true;
  }

  function refresh() {
    syncUrl();
    renderPicker();
    renderBoard();
  }

  // ── Events ──
  picker.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>(".cmp-pick");
    if (!btn) return;
    const id = parseInt(btn.dataset.id || "0");
    if (selected.includes(id)) {
      selected = selected.filter((x) => x !== id);
    } else {
      if (selected.length >= MAX_COMPARE) {
        showToast(`You can compare up to ${MAX_COMPARE} fans`, "error");
        return;
      }
      selected = [...selected, id];
    }
    const scroll = picker.scrollLeft;
    refresh();
    picker.scrollLeft = scroll;
  });

  board.addEventListener("click", (e) => {
    const rm = (e.target as HTMLElement).closest<HTMLElement>("[data-remove]");
    if (rm) {
      selected = selected.filter((x) => x !== parseInt(rm.dataset.remove || "0"));
      refresh();
    }
  });

  board.addEventListener("change", (e) => {
    const t = e.target as HTMLInputElement;
    if (t.id === "cmp-diff") {
      diffOnly = t.checked;
      renderBoard();
    }
  });

  resetBtn.addEventListener("click", () => {
    selected = [];
    refresh();
  });

  searchEl.addEventListener("input", () => {
    query = searchEl.value;
    renderPicker();
  });

  // ── Load ──
  function load() {
    getProducts(undefined, 1, 30, "popularity")
      .then((products) => {
        all = products;
        selected = initialIds.filter((id) => productById(id)).slice(0, MAX_COMPARE);
        refresh();
      })
      .catch(() => {
        picker!.innerHTML = `
          <div class="cmp-none">
            Couldn't load fans.
            <button class="cmp-retry" id="cmp-retry" type="button">Try again</button>
          </div>`;
        document.getElementById("cmp-retry")?.addEventListener("click", () => {
          picker!.innerHTML = Array(4).fill('<div class="cmp-pick skeleton" style="height:128px"></div>').join("");
          load();
        });
      });
  }
  load();
}
