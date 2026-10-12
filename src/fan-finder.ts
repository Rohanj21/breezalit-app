// Breezalit — Fan Finder Quiz (5-Step Animated Wizard)
import gsap from "gsap";
import { getProducts, formatPrice, getPriceNumber, proxyImageUrl } from "./api";
import type { Product } from "./api";

// ── Quiz Data ──
interface QuizStep {
    question: string;
    hint: string;
    options: { icon: string; label: string; desc: string; value: string }[];
}

const STEPS: QuizStep[] = [
    {
        question: "What room is this fan for?",
        hint: "Different rooms need different airflow patterns",
        options: [
            { icon: "🛏️", label: "Bedroom", desc: "Quiet & breezy", value: "bedroom" },
            { icon: "🛋️", label: "Living Room", desc: "Powerful airflow", value: "living" },
            { icon: "🍳", label: "Kitchen", desc: "Moisture resistant", value: "kitchen" },
            { icon: "💼", label: "Office", desc: "Silent operation", value: "office" },
        ],
    },
    {
        question: "How big is your room?",
        hint: "Blade sweep varies by room size",
        options: [
            { icon: "📐", label: "Small", desc: "Up to 100 sq ft", value: "small" },
            { icon: "📏", label: "Medium", desc: "100-200 sq ft", value: "medium" },
            { icon: "🏠", label: "Large", desc: "200-350 sq ft", value: "large" },
            { icon: "🏢", label: "Extra Large", desc: "350+ sq ft", value: "xlarge" },
        ],
    },
    {
        question: "What's your budget?",
        hint: "We have options for every budget",
        options: [
            { icon: "💰", label: "Under ₹3,000", desc: "Great value", value: "low" },
            { icon: "💎", label: "₹3K – ₹6K", desc: "Best sellers", value: "mid" },
            { icon: "👑", label: "₹6K – ₹10K", desc: "Premium range", value: "high" },
            { icon: "✨", label: "₹10K+", desc: "Ultra premium", value: "ultra" },
        ],
    },
    {
        question: "What matters most to you?",
        hint: "We'll match your top priority",
        options: [
            { icon: "⚡", label: "Energy Saving", desc: "Low power BLDC", value: "energy" },
            { icon: "🤫", label: "Silent", desc: "Whisper-quiet", value: "silent" },
            { icon: "🎨", label: "Stylish", desc: "Designer looks", value: "style" },
            { icon: "📱", label: "Smart Features", desc: "Remote & IoT", value: "smart" },
        ],
    },
];

let currentStep = 0;
let answers: string[] = [];
let quizOverlay: HTMLElement | null = null;

export function initFanFinder() {
    // Inject quiz overlay (hidden)
    if (document.getElementById("quiz-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "quiz-overlay";
    overlay.className = "quiz-overlay";
    overlay.innerHTML = `
    <div class="quiz-sheet" id="quiz-sheet">
      <div class="quiz-header">
        <h2>🔍 Find Your Perfect Fan</h2>
        <button class="quiz-close" id="quiz-close" aria-label="Close">✕</button>
      </div>
      <div class="quiz-progress">
        <div class="quiz-progress-bar" id="quiz-progress-bar" style="width: 0%"></div>
      </div>
      <div class="quiz-body" id="quiz-body"></div>
    </div>
  `;
    document.body.appendChild(overlay);
    quizOverlay = overlay;

    // Close handler
    document.getElementById("quiz-close")?.addEventListener("click", closeQuiz);
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeQuiz();
    });

    // Listen for CTA clicks from home page
    document.addEventListener("click", (e) => {
        const target = (e.target as HTMLElement).closest("#open-fan-finder");
        if (target) openQuiz();
    });
}

function openQuiz() {
    if (!quizOverlay) return;
    currentStep = 0;
    answers = [];
    quizOverlay.classList.add("open");

    gsap.fromTo(quizOverlay,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
    );
    gsap.fromTo("#quiz-sheet",
        { y: "100%" },
        { y: "0%", duration: 0.45, ease: "power3.out", delay: 0.1 }
    );

    renderStep(0);
}

function closeQuiz() {
    gsap.to("#quiz-sheet", {
        y: "100%", duration: 0.3, ease: "power2.in",
    });
    gsap.to(quizOverlay, {
        opacity: 0, duration: 0.25, delay: 0.15,
        onComplete: () => quizOverlay?.classList.remove("open"),
    });
}

function renderStep(stepIdx: number) {
    const body = document.getElementById("quiz-body");
    if (!body) return;

    // Update progress
    const progressBar = document.getElementById("quiz-progress-bar");
    if (progressBar) {
        progressBar.style.width = `${((stepIdx + 1) / (STEPS.length + 1)) * 100}%`;
    }

    const step = STEPS[stepIdx];
    const hasBack = stepIdx > 0;

    body.innerHTML = `
    <div class="quiz-step active" id="quiz-step-${stepIdx}">
      ${hasBack ? `<button class="quiz-back" id="quiz-back">← Back</button>` : ""}
      <h3 class="quiz-question">${step.question}</h3>
      <p class="quiz-hint">${step.hint}</p>
      <div class="quiz-options">
        ${step.options.map((opt, i) => `
          <div class="quiz-option" data-value="${opt.value}" data-idx="${i}">
            <span class="quiz-option-icon">${opt.icon}</span>
            <span class="quiz-option-label">${opt.label}</span>
            <span class="quiz-option-desc">${opt.desc}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;

    // GSAP animate options in
    gsap.fromTo(".quiz-option",
        { opacity: 0, y: 20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.08, ease: "back.out(1.2)", delay: 0.1 }
    );

    gsap.fromTo(".quiz-question, .quiz-hint",
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: "power3.out" }
    );

    // Option click
    let advancing = false;
    body.querySelectorAll(".quiz-option").forEach(opt => {
        opt.addEventListener("click", () => {
            if (advancing) return; // ignore double-taps so we never skip a step
            advancing = true;
            // Visual select
            body.querySelectorAll(".quiz-option").forEach(o => o.classList.remove("selected"));
            opt.classList.add("selected");

            gsap.fromTo(opt, { scale: 0.95 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });

            const value = (opt as HTMLElement).dataset.value || "";
            answers[stepIdx] = value;

            // Auto-advance after brief pause
            setTimeout(() => {
                if (stepIdx < STEPS.length - 1) {
                    // Slide out current, slide in next
                    gsap.to(`#quiz-step-${stepIdx}`, {
                        opacity: 0, x: -30, duration: 0.25, ease: "power2.in",
                        onComplete: () => {
                            currentStep = stepIdx + 1;
                            renderStep(currentStep);
                        }
                    });
                } else {
                    // Final step — show result
                    gsap.to(`#quiz-step-${stepIdx}`, {
                        opacity: 0, x: -30, duration: 0.25, ease: "power2.in",
                        onComplete: () => showResult()
                    });
                }
            }, 350);
        });
    });

    // Back button
    document.getElementById("quiz-back")?.addEventListener("click", () => {
        gsap.to(`#quiz-step-${stepIdx}`, {
            opacity: 0, x: 30, duration: 0.25, ease: "power2.in",
            onComplete: () => {
                currentStep = stepIdx - 1;
                renderStep(currentStep);
            }
        });
    });
}

async function showResult() {
    const body = document.getElementById("quiz-body");
    const progressBar = document.getElementById("quiz-progress-bar");
    if (!body) return;
    if (progressBar) progressBar.style.width = "100%";

    body.innerHTML = `
    <div class="quiz-step active quiz-result" id="quiz-result">
      <div class="quiz-result-badge">🎉 YOUR PERFECT MATCH</div>
      <div style="padding:32px 0;text-align:center;color:var(--text-muted);">Finding your ideal fan...</div>
    </div>
  `;

    gsap.fromTo(".quiz-result-badge",
        { opacity: 0, scale: 0.5, rotation: -10 },
        { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2)" }
    );

    try {
        // Fetch products and pick best match
        const products = await getProducts(undefined, 1, 20, "popularity");
        const recommended = pickBestMatch(products, answers);
        if (!recommended) throw new Error("No products available");
        const matchScore = 85 + Math.floor(Math.random() * 13); // 85-97%

        const resultEl = document.getElementById("quiz-result");
        if (!resultEl) return;

        const imgSrc = recommended.images.length > 0
            ? proxyImageUrl(recommended.images[0].src)
            : "";

        resultEl.innerHTML = `
      <div class="quiz-result-badge">🎉 YOUR PERFECT MATCH</div>
      <img class="quiz-result-img" src="${imgSrc}" alt="${recommended.name}" />
      <h3 class="quiz-result-name">${recommended.name}</h3>
      <p class="quiz-result-price">${formatPrice(recommended.prices)}</p>
      <div class="quiz-result-match">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        ${matchScore}% Match Score
      </div>
      <a href="#/product/${recommended.id}" class="quiz-result-cta" id="quiz-result-shop">
        Shop This Fan
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </a>
    `;

        // Stagger reveal result elements
        gsap.fromTo("#quiz-result > *",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "back.out(1.2)", delay: 0.2 }
        );

        // Pulsing glow on CTA
        gsap.to(".quiz-result-cta", {
            boxShadow: "0 0 24px rgba(242,101,34,0.5), 0 6px 20px rgba(242,101,34,0.3)",
            duration: 1, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1
        });

        // Close quiz when clicking "Shop This Fan"
        document.getElementById("quiz-result-shop")?.addEventListener("click", () => {
            setTimeout(() => closeQuiz(), 200);
        });
    } catch {
        const resultEl = document.getElementById("quiz-result");
        if (resultEl) {
            resultEl.innerHTML = `
        <div class="quiz-result-badge">😕 OOPS</div>
        <p style="color:var(--text-muted);margin:24px 0;">Couldn't load recommendations. Try again later!</p>
        <button class="quiz-back" id="quiz-retry">← Start Over</button>
      `;
            document.getElementById("quiz-retry")?.addEventListener("click", () => {
                currentStep = 0;
                answers = [];
                renderStep(0);
            });
        }
    }
}

const BUDGETS: Record<string, [number, number]> = {
    low: [0, 3000],
    mid: [3000, 6000],
    high: [6000, 10000],
    ultra: [10000, Infinity],
};

function pickBestMatch(products: Product[], answers: string[]): Product | null {
    const inStock = products.filter(p => p.is_in_stock);
    const pool = inStock.length > 0 ? inStock : products;
    if (pool.length === 0) return null;

    // Step 3 (index 2) is the budget — rank by distance from the chosen price band.
    // Products arrive sorted by popularity, so ties keep the more popular fan first.
    const band = BUDGETS[answers[2]];
    if (!band) return pool[0];
    const distance = (p: Product) => {
        const price = getPriceNumber(p.prices);
        if (price < band[0]) return band[0] - price;
        if (price > band[1]) return price - band[1];
        return 0;
    };
    return [...pool].sort((a, b) => distance(a) - distance(b))[0];
}
