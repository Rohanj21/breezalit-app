// Product page content helpers: safe HTML, specifications, details, "at a glance" slides

import type { Product } from "./api";

// ── Sanitising WordPress HTML ───────────────────────────────────

const BLOCKED_TAGS = ["script", "style", "iframe", "object", "embed", "link", "meta", "form", "input", "button"];

export function sanitizeHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html || "", "text/html");
    BLOCKED_TAGS.forEach((tag) => doc.querySelectorAll(tag).forEach((el) => el.remove()));
    doc.body.querySelectorAll("*").forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
            const name = attr.name.toLowerCase();
            const value = attr.value.trim().toLowerCase();
            if (name.startsWith("on") || name === "style" || ((name === "href" || name === "src") && value.startsWith("javascript:"))) {
                el.removeAttribute(attr.name);
            }
        });
        if (el.tagName === "A") {
            el.setAttribute("target", "_blank");
            el.setAttribute("rel", "noopener noreferrer");
        }
    });
    return doc.body.innerHTML;
}

const escapeText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function textOf(html: string): string {
    const el = document.createElement("div");
    el.innerHTML = html;
    return (el.textContent || "").replace(/\s+/g, " ").trim();
}

// ── Highlights (from the short description) ─────────────────────

interface HighlightGroup {
    title?: string;
    items: string[];
}

function parseHighlights(html: string): HighlightGroup[] {
    const root = document.createElement("div");
    root.innerHTML = sanitizeHtml(html);

    const groups: HighlightGroup[] = [];
    let current: HighlightGroup = { items: [] };
    const push = () => {
        if (current.title || current.items.length) groups.push(current);
        current = { items: [] };
    };

    const handleLine = (lineHtml: string) => {
        const trimmed = lineHtml.trim();
        const text = textOf(trimmed);
        if (!text) return;
        const isHeading = /^<(strong|b)>[\s\S]*<\/(strong|b)>$/i.test(trimmed) || /^<h[1-6][^>]*>/i.test(trimmed);
        if (isHeading) {
            push();
            current.title = text.replace(/:$/, "");
        } else {
            current.items.push(text);
        }
    };

    Array.from(root.children).forEach((block) => {
        if (block.tagName === "UL" || block.tagName === "OL") {
            block.querySelectorAll("li").forEach((li) => handleLine(li.innerHTML));
        } else {
            block.innerHTML.split(/<br\s*\/?>/i).forEach(handleLine);
        }
    });
    if (root.children.length === 0 && root.textContent?.trim()) handleLine(escapeText(root.textContent));
    push();
    return groups;
}

const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

// ── Specifications tab ──────────────────────────────────────────

const COLOR_NAMES = ["color", "colors", "colour", "colours"];

export function renderSpecsTab(p: Product): string {
    const highlights = parseHighlights(p.short_description || "");

    const rows: { label: string; value: string }[] = [];
    let colorTerms: string[] = [];
    p.attributes.forEach((a) => {
        if (a.terms.length === 0) return;
        if (COLOR_NAMES.includes(a.name.toLowerCase())) {
            colorTerms = a.terms.map((t) => t.name);
        } else {
            rows.push({ label: a.name, value: a.terms.map((t) => t.name).join(", ") });
        }
    });
    if (p.sku) rows.push({ label: "Model no.", value: p.sku });
    if (p.categories.length) rows.push({ label: "Category", value: p.categories.map((c) => c.name).join(", ") });

    const blocks: string[] = [];

    if (highlights.length > 0) {
        blocks.push(`
      <div class="spec-block">
        <h4 class="spec-block-title">Highlights</h4>
        ${highlights.map((g) => `
          ${g.title ? `<p class="hl-group-title">${escapeText(g.title)}</p>` : ""}
          <ul class="hl-list">
            ${g.items.map((i) => `<li><span class="hl-check">${CHECK}</span><span>${escapeText(i)}</span></li>`).join("")}
          </ul>`).join("")}
      </div>`);
    }

    if (rows.length > 0) {
        blocks.push(`
      <div class="spec-block">
        <h4 class="spec-block-title">Technical specifications</h4>
        <dl class="spec-table">
          ${rows.map((r) => `<div class="spec-row"><dt>${escapeText(r.label)}</dt><dd>${escapeText(r.value)}</dd></div>`).join("")}
        </dl>
      </div>`);
    }

    if (colorTerms.length > 0) {
        blocks.push(`
      <div class="spec-block">
        <h4 class="spec-block-title">Available finishes</h4>
        <div class="finish-chips">${colorTerms.map((c) => `<span class="finish-chip">${escapeText(c)}</span>`).join("")}</div>
      </div>`);
    }

    return blocks.length > 0 ? blocks.join("") : `<p class="pdp-empty-note">Specifications will be added soon.</p>`;
}

// ── Details tab ─────────────────────────────────────────────────

export function renderDetailsTab(p: Product): string {
    if (!p.description || !textOf(p.description)) {
        return `<p class="pdp-empty-note">No additional details available.</p>`;
    }
    const long = textOf(p.description).length > 420;
    return `
    <div class="desc-wrap ${long ? "collapsed" : ""}" id="desc-wrap">
      <div class="desc-html">${sanitizeHtml(p.description)}</div>
      ${long ? `<div class="desc-fade"></div>` : ""}
    </div>
    ${long ? `<button class="desc-toggle" id="desc-toggle" type="button">Read more</button>` : ""}`;
}

export function wireDetailsToggle(root: HTMLElement) {
    const btn = root.querySelector<HTMLButtonElement>("#desc-toggle");
    const wrap = root.querySelector<HTMLElement>("#desc-wrap");
    btn?.addEventListener("click", () => {
        const collapsed = wrap?.classList.toggle("collapsed");
        btn.textContent = collapsed ? "Read more" : "Show less";
    });
}

// ── "At a glance" slides on the product image ───────────────────

export interface GlanceSlide {
    icon: string;
    label: string;
    value: string;
}

export function buildGlanceSlides(
    specs: { iconSvg: string; label: string; value: string }[],
    hasWarranty = true
): GlanceSlide[] {
    const slides: GlanceSlide[] = specs.slice(0, 3).map((s) => ({
        icon: s.iconSvg,
        label: s.label.toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
        value: s.value,
    }));

    if (hasWarranty) {
        slides.push({
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
            label: "Warranty",
            value: "5 years",
        });
    }
    if (slides.length < 2) {
        slides.unshift({
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
            label: "Motor",
            value: "Energy-efficient BLDC",
        });
    }
    return slides;
}

const GLANCE_CLOSED_KEY = "breezalit_glance_closed";

export function glanceClosed(): boolean {
    try {
        return sessionStorage.getItem(GLANCE_CLOSED_KEY) === "1";
    } catch {
        return false;
    }
}

export function rememberGlanceClosed() {
    try {
        sessionStorage.setItem(GLANCE_CLOSED_KEY, "1");
    } catch { /* ignore */ }
}
