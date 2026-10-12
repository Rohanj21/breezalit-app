// Breezalit — Social Proof Toast Notifications
import gsap from "gsap";

// ── Social proof message pool ──
const PROOF_MESSAGES = [
    { city: "Mumbai", product: "Aeroquiet 5-Star BLDC Fan", mins: 3 },
    { city: "Delhi", product: "Breezalit Premium 1200mm", mins: 7 },
    { city: "Bangalore", product: "Aeroquiet Ivory Gold", mins: 12 },
    { city: "Hyderabad", product: "Breezalit BLDC Smart Fan", mins: 5 },
    { city: "Chennai", product: "Aeroquiet Antique Copper", mins: 18 },
    { city: "Pune", product: "Breezalit Rosewood Edition", mins: 2 },
    { city: "Kolkata", product: "Aeroquiet Matt Black", mins: 9 },
    { city: "Ahmedabad", product: "Breezalit Energy Saver 48\"", mins: 15 },
    { city: "Jaipur", product: "Aeroquiet Pearl White BLDC", mins: 6 },
    { city: "Lucknow", product: "Breezalit Premium Brown", mins: 22 },
];

const AVATARS = ["👤", "👩", "👨", "🧑", "👩‍💼", "👨‍💼"];

let toastContainer: HTMLElement | null = null;
let proofTimer: ReturnType<typeof setInterval> | null = null;
let usedIndices: number[] = [];

export function initSocialProof() {
    // Inject toast container
    if (!document.getElementById("social-proof-container")) {
        const container = document.createElement("div");
        container.id = "social-proof-container";
        container.className = "social-proof-container";
        document.body.appendChild(container);
        toastContainer = container;
    }

    // Start showing toasts after initial delay
    const initialDelay = 8000 + Math.random() * 5000;
    setTimeout(() => {
        showRandomToast();
        proofTimer = setInterval(() => {
            showRandomToast();
        }, 15000 + Math.random() * 10000);
    }, initialDelay);
}

function showRandomToast() {
    // Don't show on product/checkout pages (avoid distraction)
    const hash = window.location.hash;
    if (hash.includes("/product/") || hash.includes("/checkout")) return;

    // Pick unused message
    if (usedIndices.length >= PROOF_MESSAGES.length) usedIndices = [];
    let idx: number;
    do {
        idx = Math.floor(Math.random() * PROOF_MESSAGES.length);
    } while (usedIndices.includes(idx));
    usedIndices.push(idx);

    const msg = PROOF_MESSAGES[idx];
    const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const minsAgo = Math.floor(1 + Math.random() * 25);

    const toast = document.createElement("div");
    toast.className = "social-proof-toast";
    toast.innerHTML = `
    <div class="sp-avatar">${avatar}</div>
    <div class="sp-body">
      <p class="sp-text">Someone in <strong>${msg.city}</strong> just purchased</p>
      <p class="sp-product">${msg.product}</p>
      <span class="sp-time">${minsAgo} min ago</span>
    </div>
    <button class="sp-close" aria-label="Dismiss">✕</button>
  `;

    // Dismiss on click
    toast.querySelector(".sp-close")?.addEventListener("click", () => {
        dismissToast(toast);
    });

    toastContainer?.appendChild(toast);

    // GSAP entrance — slide up + fade + scale
    gsap.fromTo(toast,
        { opacity: 0, y: 60, scale: 0.85 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.4)" }
    );

    // Auto dismiss after 4s
    setTimeout(() => dismissToast(toast), 4000);
}

function dismissToast(toast: HTMLElement) {
    gsap.to(toast, {
        opacity: 0, y: 30, scale: 0.9,
        duration: 0.3, ease: "power2.in",
        onComplete: () => toast.remove()
    });
}

export function destroySocialProof() {
    if (proofTimer) {
        clearInterval(proofTimer);
        proofTimer = null;
    }
}
