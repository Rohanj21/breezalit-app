// Breezalit — Apple-Style Fan Comparison
// Clean spec table with sticky headers, highlighted differences, and GSAP transitions
import { getProducts, formatPrice, getDiscountPercent, proxyImageUrl } from "../api";
import type { Product } from "../api";
import gsap from "gsap";

const MAX_COMPARE = 3;

// ── Spec Extraction Helpers ──
function extractSpec(product: Product, keys: string[]): string {
  for (const attr of product.attributes) {
    const slug = attr.name.toLowerCase().replace(/\s+/g, "-");
    if (keys.includes(slug) && attr.terms.length > 0) {
      return attr.terms[0].name;
    }
  }
  return "—";
}

function extractSpecNum(product: Product, keys: string[]): number {
  const val = extractSpec(product, keys);
  const match = val.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

// ── All comparison rows we want to display ──
interface SpecRow {
  label: string;
  icon: string;
  keys: string[];
  unit: string;
  winRule: "lower" | "higher" | "none"; // "lower" = lower is better (e.g. wattage)
  type: "numeric" | "text";
}

const SPEC_ROWS: SpecRow[] = [
  { label: "Price", icon: "💰", keys: [], unit: "", winRule: "lower", type: "text" },
  { label: "Wattage", icon: "⚡", keys: ["watts", "watt", "power"], unit: "W", winRule: "lower", type: "numeric" },
  { label: "RPM", icon: "🔄", keys: ["rpm", "r.p.m.", "speed"], unit: "", winRule: "higher", type: "numeric" },
  { label: "Air Delivery", icon: "💨", keys: ["air-delivery", "air-flow"], unit: " CMM", winRule: "higher", type: "numeric" },
  { label: "Size", icon: "📏", keys: ["size", "sweep-size", "blade-size"], unit: "\"", winRule: "none", type: "numeric" },
  { label: "Category", icon: "📂", keys: [], unit: "", winRule: "none", type: "text" },
  { label: "Rating", icon: "⭐", keys: [], unit: "", winRule: "higher", type: "text" },
  { label: "Colors", icon: "🎨", keys: [], unit: "", winRule: "higher", type: "text" },
  { label: "On Sale", icon: "🏷️", keys: [], unit: "", winRule: "none", type: "text" },
];

function getSpecValue(product: Product, spec: SpecRow): string {
  switch (spec.label) {
    case "Price": return formatPrice(product.prices);
    case "Category": return product.categories.map(c => c.name).join(", ") || "—";
    case "Rating": return `★ ${(parseFloat(product.average_rating) || 5.0).toFixed(1)}`;
    case "Colors": {
      const colorAttr = product.attributes.find(a =>
        a.name.toLowerCase() === "color" || a.name.toLowerCase() === "colours"
      );
      return colorAttr ? `${colorAttr.terms.length} options` : "Standard";
    }
    case "On Sale": return product.on_sale ? `Yes (−${getDiscountPercent(product.prices)}%)` : "No";
    default: {
      const val = extractSpecNum(product, spec.keys);
      return val > 0 ? `${val}${spec.unit}` : "—";
    }
  }
}

function getNumericValue(product: Product, spec: SpecRow): number {
  switch (spec.label) {
    case "Rating": return parseFloat(product.average_rating) || 5;
    case "Colors": {
      const a = product.attributes.find(a =>
        a.name.toLowerCase() === "color" || a.name.toLowerCase() === "colours"
      );
      return a ? a.terms.length : 1;
    }
    default: return extractSpecNum(product, spec.keys);
  }
}

export async function renderCompare(): Promise<string> {
  return `
    <div class="apple-compare" id="compare-page">
      <div class="ac-header">
        <a href="#/" class="header-icon-btn" aria-label="Go Back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </a>
        <h1 class="ac-title">Compare Fans</h1>
        <div style="width:40px;"></div>
      </div>

      <p class="ac-subtitle">Select up to ${MAX_COMPARE} fans to compare side-by-side.</p>

      <!-- Product Picker Strip -->
      <div class="ac-picker-strip" id="ac-picker">
        <div class="compare-selector-loading">
          <div class="skeleton" style="width:100px;height:120px;border-radius:16px;"></div>
          <div class="skeleton" style="width:100px;height:120px;border-radius:16px;"></div>
          <div class="skeleton" style="width:100px;height:120px;border-radius:16px;"></div>
        </div>
      </div>

      <!-- Sticky Product Headers + Spec Table (hidden until 2+ selected) -->
      <div class="ac-table-wrap" id="ac-table-wrap" style="display:none;">
        <div class="ac-sticky-heads" id="ac-sticky-heads"></div>
        <div class="ac-spec-table" id="ac-spec-table"></div>
      </div>

      <div class="ac-empty" id="ac-empty">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5">
          <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
        </svg>
        <p>Tap fans above to start comparing</p>
      </div>
    </div>
  `;
}

export function onCompareMount() {
  const selectedIds = new Set<number>();
  let allProducts: Product[] = [];

  const pickerEl = document.getElementById("ac-picker")!;
  const tableWrap = document.getElementById("ac-table-wrap")!;
  const emptyEl = document.getElementById("ac-empty")!;
  const stickyHeads = document.getElementById("ac-sticky-heads")!;
  const specTable = document.getElementById("ac-spec-table")!;

  getProducts().then(products => {
    allProducts = products;
    renderPicker();
  });

  function renderPicker() {
    pickerEl.innerHTML = `
      <div class="ac-picker-scroll">
        ${allProducts.map(p => {
      const img = p.images.length > 0 ? proxyImageUrl(p.images[0].src) : "";
      const selected = selectedIds.has(p.id);
      return `
            <button class="ac-pick ${selected ? "ac-picked" : ""}" data-pid="${p.id}">
              <div class="ac-pick-img">
                <img src="${img}" alt="${p.name}" loading="lazy" />
                ${selected ? `<div class="ac-pick-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>` : ""}
              </div>
              <span class="ac-pick-label">${p.name.split(" ").slice(0, 2).join(" ")}</span>
            </button>
          `;
    }).join("")}
      </div>
    `;

    pickerEl.querySelectorAll(".ac-pick").forEach(btn => {
      btn.addEventListener("click", () => {
        const pid = parseInt((btn as HTMLElement).dataset.pid!);
        if (selectedIds.has(pid)) {
          selectedIds.delete(pid);
        } else {
          if (selectedIds.size >= MAX_COMPARE) {
            gsap.fromTo(btn, { x: -4 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" });
            return;
          }
          selectedIds.add(pid);
        }
        renderPicker();
        renderTable();
      });
    });
  }

  function renderTable() {
    const selected = allProducts.filter(p => selectedIds.has(p.id));
    if (selected.length < 2) {
      tableWrap.style.display = "none";
      emptyEl.style.display = "flex";
      return;
    }

    tableWrap.style.display = "block";
    emptyEl.style.display = "none";

    const cols = selected.length;

    // ── Sticky Product Headers (Apple-style) ──
    stickyHeads.innerHTML = `
      <div class="ac-heads-grid ac-cols-${cols}">
        ${selected.map(p => {
      const img = p.images.length > 0 ? proxyImageUrl(p.images[0].src) : "";
      return `
            <div class="ac-head-card">
              <div class="ac-head-img"><img src="${img}" alt="${p.name}"/></div>
              <h3 class="ac-head-name">${p.name}</h3>
              <span class="ac-head-price">${formatPrice(p.prices)}</span>
              <a href="#/product/${p.id}" class="ac-head-btn">View</a>
            </div>
          `;
    }).join("")}
      </div>
    `;

    // ── Build the spec rows ──
    specTable.innerHTML = SPEC_ROWS.map(spec => {
      const values = selected.map(p => getSpecValue(p, spec));
      const numVals = selected.map(p => getNumericValue(p, spec));

      // Determine if there's a difference
      const allSame = values.every(v => v === values[0]);

      // Determine the "winner" column
      let winIdx = -1;
      if (spec.winRule !== "none" && !allSame) {
        const validNums = numVals.filter(v => v > 0);
        if (validNums.length > 0) {
          const target = spec.winRule === "lower"
            ? Math.min(...numVals.filter(v => v > 0))
            : Math.max(...numVals);
          winIdx = numVals.indexOf(target);
        }
      }

      return `
        <div class="ac-row ${allSame ? "" : "ac-row-diff"}">
          <div class="ac-row-label">
            <span class="ac-row-icon">${spec.icon}</span>
            <span>${spec.label}</span>
          </div>
          <div class="ac-row-vals ac-cols-${cols}">
            ${values.map((v, i) => `
              <div class="ac-val ${i === winIdx ? "ac-val-best" : ""} ${!allSame && i !== winIdx && winIdx !== -1 ? "ac-val-dim" : ""}">
                ${v}
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }).join("");

    // ── GSAP Animations ──
    requestAnimationFrame(() => {
      gsap.fromTo(".ac-head-card",
        { opacity: 0, y: 30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.2)" }
      );
      gsap.fromTo(".ac-row",
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.06, ease: "power3.out", delay: 0.3 }
      );
    });
  }
}
