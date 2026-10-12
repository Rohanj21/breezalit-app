// Breezalit — GSAP Animation Utilities (Industry-Grade)
import gsap from "gsap";

// ── Page transition ────────────────────────────────────────────
export function animatePageIn(container: HTMLElement) {
    gsap.fromTo(
        container,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
    );
}

// ── Staggered card reveal ──────────────────────────────────────
export function animateCards(selector: string, stagger = 0.08) {
    const cards = document.querySelectorAll(selector);
    if (!cards.length) return;
    gsap.fromTo(
        cards,
        { opacity: 0, y: 40, scale: 0.95 },
        {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger,
            ease: "power2.out",
            clearProps: "transform",
        }
    );
}

// ── Hero section entrance ──────────────────────────────────────
export function animateHero() {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(".hero-badge", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5 })
        .fromTo(".hero-title", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.3")
        .fromTo(".hero-desc", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.3")
        .fromTo(".hero-cta", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.4 }, "-=0.2")
        .fromTo(".hero-image", { opacity: 0, x: 60, rotate: -5 }, { opacity: 1, x: 0, rotate: 0, duration: 0.7 }, "-=0.6")
        .fromTo(".hero-trust", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, "-=0.3");
    return tl;
}

// ── Section heading reveal ─────────────────────────────────────
export function animateSection(selector: string) {
    gsap.fromTo(
        selector,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );
}

// ── Category chips slide-in ────────────────────────────────────
export function animateChips(selector: string) {
    const chips = document.querySelectorAll(selector);
    if (!chips.length) return;
    gsap.fromTo(
        chips,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.06, ease: "power2.out" }
    );
}

// ── Product image zoom on carousel change ──────────────────────
export function animateSlideIn(element: Element) {
    gsap.fromTo(
        element,
        { opacity: 0, scale: 1.1 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }
    );
}

// ── Add to cart bounce ─────────────────────────────────────────
export function animateAddToCart(button: HTMLElement) {
    gsap.timeline()
        .to(button, { scale: 0.9, duration: 0.1 })
        .to(button, { scale: 1.05, duration: 0.15 })
        .to(button, { scale: 1, duration: 0.1 });
}

// ── Cart badge pop ─────────────────────────────────────────────
export function animateBadgePop() {
    const badge = document.getElementById("cart-badge");
    if (!badge) return;
    gsap.fromTo(
        badge,
        { scale: 0, rotation: -30 },
        { scale: 1, rotation: 0, duration: 0.4, ease: "back.out(3)" }
    );
}

// ── Stat counter animation ─────────────────────────────────────
export function animateStats() {
    const stats = document.querySelectorAll(".stat-card");
    if (!stats.length) return;
    gsap.fromTo(
        stats,
        { opacity: 0, y: 40, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.2)" }
    );
}

// ── Feature items stagger ──────────────────────────────────────
export function animateFeatures() {
    const items = document.querySelectorAll(".feature-item");
    if (!items.length) return;
    gsap.fromTo(
        items,
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.12, ease: "power2.out" }
    );
}

// ── Float animation for hero image ─────────────────────────────
export function startFloatAnimation(selector: string) {
    gsap.to(selector, {
        y: -12,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
    });
}

// ── Cart item slide in ─────────────────────────────────────────
export function animateCartItems() {
    const items = document.querySelectorAll(".cart-item");
    if (!items.length) return;
    gsap.fromTo(
        items,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" }
    );
}

// ── Remove item animation ──────────────────────────────────────
export function animateRemoveItem(element: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
        gsap.to(element, {
            opacity: 0,
            x: 100,
            height: 0,
            padding: 0,
            marginBottom: 0,
            duration: 0.35,
            ease: "power2.in",
            onComplete: resolve,
        });
    });
}

// ════════════════════════════════════════════════════════════════
// ★★★  NEW INDUSTRY-GRADE ANIMATIONS  ★★★
// ════════════════════════════════════════════════════════════════

// ── Flying product image to cart ───────────────────────────────
export function animateFlyToCart(sourceEl: HTMLElement) {
    const cartIcon = document.querySelector(".nav-cart .nav-icon-wrap");
    if (!cartIcon || !sourceEl) return;

    const sourceRect = sourceEl.getBoundingClientRect();
    const destRect = cartIcon.getBoundingClientRect();

    // Create a flying ghost clone
    const ghost = document.createElement("div");
    ghost.style.cssText = `
        position: fixed; z-index: 9999;
        width: 60px; height: 60px; border-radius: 50%;
        overflow: hidden; pointer-events: none;
        box-shadow: 0 8px 32px rgba(242, 101, 34, 0.4);
        border: 3px solid var(--primary);
    `;

    // Clone the product image
    const imgSrc = sourceEl.querySelector("img")?.src
        || sourceEl.closest(".pdp")?.querySelector(".gallery-slide img")?.getAttribute("src")
        || "";
    ghost.innerHTML = `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;">`;
    ghost.style.left = `${sourceRect.left + sourceRect.width / 2 - 30}px`;
    ghost.style.top = `${sourceRect.top}px`;

    document.body.appendChild(ghost);

    // Animate along a curved path to the cart
    const dx = destRect.left + destRect.width / 2 - 30 - (sourceRect.left + sourceRect.width / 2 - 30);
    const dy = destRect.top + destRect.height / 2 - 30 - sourceRect.top;

    gsap.to(ghost, {
        x: dx,
        y: dy,
        scale: 0.2,
        opacity: 0.3,
        duration: 0.75,
        ease: "power3.in",
        onComplete: () => {
            ghost.remove();
            // Pop the cart icon
            gsap.fromTo(cartIcon, { scale: 1.4 }, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.4)" });
        },
    });
}

// ── Count-up number animation ──────────────────────────────────
export function animateCountUp(el: HTMLElement, from: number, to: number, prefix = "", suffix = "") {
    const obj = { val: from };
    gsap.to(obj, {
        val: to,
        duration: 0.6,
        ease: "power2.out",
        onUpdate: () => {
            el.textContent = prefix + Math.round(obj.val).toLocaleString("en-IN") + suffix;
        },
    });
}

// ── Pulsing urgency badge ──────────────────────────────────────
export function animatePulseUrgency(selector: string) {
    gsap.to(selector, {
        boxShadow: "0 0 0 6px rgba(224, 43, 43, 0.25)",
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
    });
}

// ── Tab switch slide ───────────────────────────────────────────
export function animateTabSwitch(outgoing: HTMLElement, incoming: HTMLElement, direction: "left" | "right") {
    const xOut = direction === "left" ? -30 : 30;
    const xIn = direction === "left" ? 30 : -30;

    gsap.to(outgoing, {
        opacity: 0, x: xOut, duration: 0.25, ease: "power2.in",
        onComplete: () => {
            outgoing.style.display = "none";
            incoming.style.display = "block";
            gsap.fromTo(incoming,
                { opacity: 0, x: xIn },
                { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }
            );
        },
    });
}

// ── Home Page Animations ───────────────────────────────────────
export function animateWhyCards() {
    const whyCards = gsap.utils.toArray(".gsap-why-card");
    if (whyCards.length) {
        gsap.fromTo(whyCards,
            { opacity: 0, y: 30, rotationX: -10 },
            {
                scrollTrigger: { trigger: ".why-section", start: "top 85%" },
                opacity: 1, y: 0, rotationX: 0, duration: 0.6, stagger: 0.15, ease: "back.out(1.2)"
            }
        );

        whyCards.forEach(card => {
            const icon = (card as HTMLElement).querySelector("svg");
            const glow = (card as HTMLElement).querySelector(".icon-glow");
            if (icon && glow) {
                gsap.to(icon, { y: -3, duration: 1.5, yoyo: true, repeat: -1, ease: "sine.inOut" });
                gsap.to(glow, { scale: 1.6, opacity: 0, duration: 2, repeat: -1, ease: "power2.out", delay: Math.random() });
            }
        });
    }
}

export function animatePromoBanner() {
    const promoBanner = document.querySelector(".gsap-promo-banner");
    if (promoBanner) {
        gsap.fromTo(promoBanner,
            { opacity: 0, scale: 0.95 },
            { scrollTrigger: { trigger: promoBanner, start: "top 85%" }, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" }
        );

        gsap.fromTo(promoBanner.querySelector(".promo-title"),
            { opacity: 0, y: 20 },
            { scrollTrigger: { trigger: promoBanner, start: "top 85%" }, opacity: 1, y: 0, duration: 0.5, delay: 0.2 }
        );

        gsap.fromTo(promoBanner.querySelector(".promo-text"),
            { opacity: 0, y: 20 },
            { scrollTrigger: { trigger: promoBanner, start: "top 85%" }, opacity: 1, y: 0, duration: 0.5, delay: 0.3 }
        );

        gsap.fromTo(promoBanner.querySelector(".promo-cta"),
            { opacity: 0, scale: 0.8 },
            { scrollTrigger: { trigger: promoBanner, start: "top 85%" }, opacity: 1, scale: 1, duration: 0.5, delay: 0.4, ease: "back.out(1.5)" }
        );

        // Continuous gentle rotation for the background vector shape
        gsap.to(".promo-anim-shape", {
            rotation: 360,
            duration: 25,
            repeat: -1,
            ease: "none",
            transformOrigin: "center center"
        });
    }
}

// ── Shake animation (invalid action) ──────────────────────────
export function animateShake(el: HTMLElement) {
    gsap.fromTo(el,
        { x: -6 },
        { x: 6, duration: 0.08, repeat: 3, yoyo: true, ease: "power2.inOut", clearProps: "x" }
    );
}

// ── Trust badges stagger reveal ────────────────────────────────
export function animateTrustBadges() {
    gsap.fromTo(".trust-badge",
        { opacity: 0, y: 20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.12, ease: "back.out(1.5)" }
    );
}



// ── Testimonial cards ──────────────────────────────────────────
export function animateTestimonials() {
    gsap.fromTo(".testimonial-card",
        { opacity: 0, x: 40 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
    );
}

// ═══════════════════════════════════════════════════════════════
// ★★★  HERO CAROUSEL — AUTO-SCROLLING WITH GSAP  ★★★
// ═══════════════════════════════════════════════════════════════

let heroInterval: ReturnType<typeof setInterval> | null = null;
let currentSlide = 0;
const SLIDE_COUNT = 3;
const SLIDE_DURATION = 4000; // ms between auto-advance

export function initHeroCarousel() {
    const slides = document.querySelectorAll<HTMLElement>(".hero-slide");
    const dots = document.querySelectorAll<HTMLElement>(".hero-dot");
    if (!slides.length) return;

    // Animate first slide entrance
    const firstSlide = slides[0];
    const firstImg = firstSlide.querySelector("img");
    const firstContent = firstSlide.querySelectorAll(".hero-eyebrow, .hero-headline, .hero-subline, .hero-btn");

    if (firstImg) {
        gsap.fromTo(firstImg,
            { scale: 1.15, filter: "brightness(0.5)" },
            { scale: 1, filter: "brightness(1)", duration: 2, ease: "power2.out" }
        );
    }
    gsap.fromTo(firstContent,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power3.out", delay: 0.4 }
    );

    // Dot click handlers
    dots.forEach(dot => {
        dot.addEventListener("click", () => {
            const target = parseInt(dot.dataset.dot || "0");
            if (target !== currentSlide) {
                goToSlide(target, slides, dots);
            }
        });
    });

    // Start auto-advance
    heroInterval = setInterval(() => {
        const next = (currentSlide + 1) % SLIDE_COUNT;
        goToSlide(next, slides, dots);
    }, SLIDE_DURATION);
}

function goToSlide(
    index: number,
    slides: NodeListOf<HTMLElement>,
    dots: NodeListOf<HTMLElement>
) {
    const outgoing = slides[currentSlide];
    const incoming = slides[index];

    // Crossfade: outgoing fades out with slight scale-up
    gsap.to(outgoing, {
        opacity: 0,
        scale: 1.05,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
            outgoing.classList.remove("active");
            gsap.set(outgoing, { scale: 1 });
        }
    });

    // Incoming: fade in with Ken Burns zoom
    incoming.classList.add("active");
    const inImg = incoming.querySelector("img");
    const inContent = incoming.querySelectorAll(".hero-eyebrow, .hero-headline, .hero-subline, .hero-btn");

    gsap.fromTo(incoming,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power2.inOut" }
    );

    if (inImg) {
        gsap.fromTo(inImg,
            { scale: 1.12 },
            { scale: 1, duration: 6, ease: "power1.out" }
        );
    }

    // Content staggers in
    gsap.fromTo(inContent,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out", delay: 0.3 }
    );

    // Update dots
    dots.forEach(d => d.classList.remove("active"));
    dots[index]?.classList.add("active");

    currentSlide = index;

    // Reset interval timer
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(() => {
        const next = (currentSlide + 1) % SLIDE_COUNT;
        goToSlide(next, slides, dots);
    }, SLIDE_DURATION);
}

export function killHeroCarousel() {
    if (heroInterval) {
        clearInterval(heroInterval);
        heroInterval = null;
    }
}

// ═══════════════════════════════════════════════════════════════
// ★★★  AMBIENT FLOATING SVG SHAPES  ★★★
// ═══════════════════════════════════════════════════════════════

export function animateAmbientShapes() {
    // Shape 1: Large circle — slow drift right and pulsing scale
    gsap.to(".hero-shape.shape-1", {
        x: 40, y: -20, scale: 1.15, rotation: 15,
        duration: 8, repeat: -1, yoyo: true,
        ease: "sine.inOut"
    });

    // Shape 2: Morphic blob — slow counter-rotate and drift
    gsap.to(".hero-shape.shape-2", {
        x: -30, y: 25, rotation: -360,
        duration: 20, repeat: -1,
        ease: "none"
    });
    gsap.to(".hero-shape.shape-2", {
        scale: 1.2, opacity: 0.8,
        duration: 4, repeat: -1, yoyo: true,
        ease: "sine.inOut"
    });

    // Shape 3: Hexagon — gentle bob and rotate
    gsap.to(".hero-shape.shape-3", {
        x: 25, y: -35, rotation: 45,
        duration: 12, repeat: -1, yoyo: true,
        ease: "sine.inOut"
    });
    gsap.to(".hero-shape.shape-3", {
        scale: 0.85,
        duration: 6, repeat: -1, yoyo: true,
        ease: "power1.inOut"
    });
}