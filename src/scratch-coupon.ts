// Breezalit — Scratch-to-Reveal Coupon
// Gamified scratch card with HTML5 Canvas + confetti animation
import gsap from "gsap";

const STORAGE_KEY = "breezalit_scratch_used";
const COUPON_CODE = "BREEZA10";
const DISCOUNT_TEXT = "10% OFF";
const SCRATCH_THRESHOLD = 0.55; // 55% scratched to auto-reveal

export function showScratchCoupon() {
    if (localStorage.getItem(STORAGE_KEY)) return; // Already shown

    const overlay = document.createElement("div");
    overlay.id = "scratch-overlay";
    overlay.innerHTML = `
    <div class="scratch-backdrop" id="scratch-backdrop"></div>
    <div class="scratch-modal" id="scratch-modal">
      <button class="scratch-close" id="scratch-dismiss" aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="scratch-header">
        <span class="scratch-emoji">🎁</span>
        <h2>You've Got a Surprise!</h2>
        <p>Scratch below to reveal your reward</p>
      </div>

      <div class="scratch-card-wrap" id="scratch-card-wrap">
        <!-- Hidden coupon layer (below canvas) -->
        <div class="scratch-coupon-layer" id="scratch-coupon-layer">
          <div class="scratch-confetti-container" id="scratch-confetti"></div>
          <div class="scratch-reward">
            <span class="scratch-discount">${DISCOUNT_TEXT}</span>
            <span class="scratch-on">on your first order</span>
            <div class="scratch-code-box">
              <span class="scratch-code" id="scratch-code-text">${COUPON_CODE}</span>
              <button class="scratch-copy" id="scratch-copy">Copy</button>
            </div>
          </div>
        </div>
        <!-- Canvas scratch layer on top -->
        <canvas id="scratch-canvas" width="300" height="200"></canvas>
      </div>

      <p class="scratch-hint" id="scratch-hint">👆 Use your finger to scratch</p>
    </div>
  `;
    document.body.appendChild(overlay);

    const canvas = document.getElementById("scratch-canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    const modal = document.getElementById("scratch-modal")!;
    const backdrop = document.getElementById("scratch-backdrop")!;
    const cardWrap = document.getElementById("scratch-card-wrap")!;
    let revealed = false;

    // Draw the scratch coating
    function drawCoating() {
        const w = canvas.width;
        const h = canvas.height;

        // Metallic gradient
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, "#c0b283");
        grad.addColorStop(0.3, "#dcd0a8");
        grad.addColorStop(0.5, "#f0e6c0");
        grad.addColorStop(0.7, "#dcd0a8");
        grad.addColorStop(1, "#b8a87a");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Shimmer pattern
        ctx.globalAlpha = 0.08;
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 30 + 10, 0, Math.PI * 2);
            ctx.fillStyle = "#fff";
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Text on coating
        ctx.font = "bold 18px -apple-system, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✦ SCRATCH HERE ✦", w / 2, h / 2);
    }

    drawCoating();

    // Scratch mechanic
    ctx.globalCompositeOperation = "destination-out";

    let isScratching = false;
    let lastX = 0;
    let lastY = 0;

    function getPos(e: TouchEvent | MouseEvent) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if ("touches" in e) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY,
            };
        }
        return {
            x: ((e as MouseEvent).clientX - rect.left) * scaleX,
            y: ((e as MouseEvent).clientY - rect.top) * scaleY,
        };
    }

    function scratch(x: number, y: number) {
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.lineWidth = 36;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        lastX = x;
        lastY = y;
        checkScratchProgress();
    }

    let lastCheck = 0;
    function checkScratchProgress() {
        if (revealed) return;
        const now = performance.now();
        if (now - lastCheck < 120) return; // getImageData is expensive; throttle
        lastCheck = now;
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparent = 0;
        for (let i = 3; i < imgData.data.length; i += 4) {
            if (imgData.data[i] === 0) transparent++;
        }
        const ratio = transparent / (imgData.data.length / 4);
        if (ratio >= SCRATCH_THRESHOLD) {
            revealCoupon();
        }
    }

    function revealCoupon() {
        if (revealed) return;
        revealed = true;
        localStorage.setItem(STORAGE_KEY, "1");

        // Fade out canvas
        gsap.to(canvas, {
            opacity: 0, duration: 0.4,
            onComplete: () => { canvas.style.display = "none"; }
        });

        // Hide hint
        const hint = document.getElementById("scratch-hint");
        if (hint) hint.style.display = "none";

        // Confetti burst
        const confettiContainer = document.getElementById("scratch-confetti")!;
        const colors = ["#f26522", "#f2c94c", "#71b1d9", "#a768d9", "#38a169", "#e53e3e"];
        for (let i = 0; i < 40; i++) {
            const particle = document.createElement("div");
            particle.className = "scratch-confetti-piece";
            particle.style.background = colors[i % colors.length];
            particle.style.left = `${50 + (Math.random() - 0.5) * 20}%`;
            particle.style.top = `50%`;
            confettiContainer.appendChild(particle);

            gsap.to(particle, {
                x: (Math.random() - 0.5) * 300,
                y: (Math.random() - 0.5) * 300,
                rotation: Math.random() * 720 - 360,
                opacity: 0,
                duration: 1 + Math.random() * 0.5,
                ease: "power2.out",
            });
        }

        // Pop the coupon
        gsap.fromTo(".scratch-reward", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" });
    }

    // Touch events
    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        isScratching = true;
        const pos = getPos(e);
        lastX = pos.x;
        lastY = pos.y;
    }, { passive: false });

    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        if (!isScratching) return;
        const pos = getPos(e);
        scratch(pos.x, pos.y);
    }, { passive: false });

    canvas.addEventListener("touchend", () => { isScratching = false; });

    // Mouse events (for desktop testing)
    canvas.addEventListener("mousedown", (e) => {
        isScratching = true;
        const pos = getPos(e);
        lastX = pos.x;
        lastY = pos.y;
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!isScratching) return;
        const pos = getPos(e);
        scratch(pos.x, pos.y);
    });

    canvas.addEventListener("mouseup", () => { isScratching = false; });
    canvas.addEventListener("mouseleave", () => { isScratching = false; });

    // Copy code
    document.getElementById("scratch-copy")?.addEventListener("click", () => {
        if (!navigator.clipboard) return;
        navigator.clipboard.writeText(COUPON_CODE).then(() => {
            const btn = document.getElementById("scratch-copy")!;
            btn.textContent = "Copied!";
            btn.style.background = "#38a169";
            setTimeout(() => {
                btn.textContent = "Copy";
                btn.style.background = "";
            }, 2000);
        }).catch(() => { /* clipboard unavailable */ });
    });

    // Close handler
    function closeScratch() {
        localStorage.setItem(STORAGE_KEY, "1");
        gsap.to(modal, { y: 40, opacity: 0, duration: 0.3, ease: "power2.in" });
        gsap.to(backdrop, {
            opacity: 0, duration: 0.25,
            onComplete: () => overlay.remove(),
        });
    }

    document.getElementById("scratch-dismiss")?.addEventListener("click", closeScratch);
    backdrop.addEventListener("click", closeScratch);

    // Entrance animation
    gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(modal,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" },
    );

    // Subtle shimmer on the card
    gsap.fromTo(cardWrap,
        { boxShadow: "0 0 0 rgba(240,230,192,0)" },
        {
            boxShadow: "0 0 30px rgba(240,230,192,0.4)",
            duration: 1.2,
            yoyo: true,
            repeat: 3,
            ease: "sine.inOut",
        }
    );
}
