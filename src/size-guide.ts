import gsap from "gsap";

const SIZE_TABLE: { maxSqft: number; label: string; size: string; searchCat: string }[] = [
    { maxSqft: 80, label: "Small Room (up to 80 sq ft)", size: '24"', searchCat: "exhaust-fans" },
    { maxSqft: 120, label: "Medium Room (80–120 sq ft)", size: '36"', searchCat: "ceiling-fans" },
    { maxSqft: 200, label: "Large Room (120–200 sq ft)", size: '48"', searchCat: "ceiling-fans" },
    { maxSqft: 400, label: "Extra Large Room (200+ sq ft)", size: '56"', searchCat: "ceiling-fans" },
];

export function openSizeGuide() {
    // Prevent duplicates
    if (document.getElementById("size-guide-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "size-guide-overlay";
    overlay.innerHTML = `
    <div class="sg-backdrop"></div>
    <div class="sg-sheet">
      <div class="sg-handle"></div>
      <div class="sg-header">
        <h2 class="sg-title">📐 Room Size Guide</h2>
        <p class="sg-subtitle">Slide to match your room size and we'll recommend the ideal fan.</p>
      </div>

      <!-- Room Visualization -->
      <div class="sg-visual" id="sg-visual">
        <svg class="sg-room-svg" id="sg-room-svg" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
          <!-- Room outline -->
          <rect class="sg-room-rect" id="sg-room-rect" x="50" y="30" width="200" height="140"
            rx="6" fill="none" stroke="var(--text-main)" stroke-width="2" stroke-dasharray="6 3" opacity="0.3"/>
          <!-- Floor fill -->
          <rect class="sg-floor" id="sg-floor" x="52" y="32" width="196" height="136"
            rx="5" fill="var(--primary-light)" opacity="0.5"/>
          <!-- Fan (centered in room) -->
          <g id="sg-fan-group" transform="translate(150, 100)">
            <circle r="5" fill="var(--primary)" opacity="0.9"/>
            <!-- 4 blades -->
            <path d="M0 -5 C-10 -25, 10 -35, 5 -5" fill="var(--primary)" opacity="0.7"/>
            <path d="M5 0 C25 -10, 35 10, 5 5" fill="var(--primary)" opacity="0.6"/>
            <path d="M0 5 C10 25, -10 35, -5 5" fill="var(--primary)" opacity="0.7"/>
            <path d="M-5 0 C-25 10, -35 -10, -5 -5" fill="var(--primary)" opacity="0.6"/>
          </g>
        </svg>
        <div class="sg-room-label" id="sg-room-label">150 sq ft</div>
      </div>

      <!-- Slider -->
      <div class="sg-slider-section">
        <label class="sg-label">Room Size (sq ft)</label>
        <div class="sg-slider-row">
          <span class="sg-min">50</span>
          <input type="range" class="sg-range" id="sg-range" min="50" max="350" value="150" step="5"/>
          <span class="sg-max">350</span>
        </div>
      </div>

      <!-- Recommendation -->
      <div class="sg-result" id="sg-result">
        <div class="sg-rec-icon" id="sg-rec-icon">✅</div>
        <div class="sg-rec-text">
          <h3 id="sg-rec-size">48" Fan</h3>
          <p id="sg-rec-desc">Large Room (120–200 sq ft)</p>
        </div>
        <a id="sg-rec-link" href="#/shop" class="sg-shop-btn">Shop This Size →</a>
      </div>

      <button class="sg-close-btn" id="sg-close">Close</button>
    </div>
  `;

    document.body.appendChild(overlay);

    // Animate entrance
    gsap.fromTo(".sg-backdrop", { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(".sg-sheet", { y: "100%" }, { y: "0%", duration: 0.5, ease: "power4.out" });

    // Start fan spinning
    gsap.to("#sg-fan-group", { rotation: 360, duration: 3, repeat: -1, ease: "none", transformOrigin: "center center" });

    // Wire slider
    const slider = document.getElementById("sg-range") as HTMLInputElement;
    slider?.addEventListener("input", () => updateGuide(parseInt(slider.value)));

    // Initialize
    updateGuide(150);

    // Close handlers
    document.getElementById("sg-close")?.addEventListener("click", closeSizeGuide);
    document.querySelector(".sg-backdrop")?.addEventListener("click", closeSizeGuide);
    document.getElementById("sg-rec-link")?.addEventListener("click", closeSizeGuide);
}

function updateGuide(sqft: number) {
    // Update label
    const label = document.getElementById("sg-room-label");
    if (label) label.textContent = `${sqft} sq ft`;

    // Morph room SVG proportionally
    const minSize = 80;
    const maxSize = 260;
    const ratio = (sqft - 50) / 300; // normalize 50–350 to 0–1
    const rectW = minSize + ratio * (maxSize - minSize);
    const rectH = minSize * 0.7 + ratio * ((maxSize * 0.7) - (minSize * 0.7));
    const x = (300 - rectW) / 2;
    const y = (200 - rectH) / 2;

    gsap.to("#sg-room-rect", { attr: { x, y, width: rectW, height: rectH }, duration: 0.4, ease: "power2.out" });
    gsap.to("#sg-floor", { attr: { x: x + 2, y: y + 2, width: rectW - 4, height: rectH - 4 }, duration: 0.4, ease: "power2.out" });

    // Scale fan proportionally
    const fanScale = 0.6 + ratio * 1.0;
    gsap.to("#sg-fan-group", { scale: fanScale, duration: 0.4, ease: "power2.out" });

    // Find the recommendation
    const rec = SIZE_TABLE.find(s => sqft <= s.maxSqft) || SIZE_TABLE[SIZE_TABLE.length - 1];

    const sizeEl = document.getElementById("sg-rec-size");
    const descEl = document.getElementById("sg-rec-desc");
    const linkEl = document.getElementById("sg-rec-link");

    if (sizeEl) sizeEl.textContent = `${rec.size} Fan`;
    if (descEl) descEl.textContent = rec.label;
    if (linkEl) linkEl.setAttribute("href", `#/shop?cat=${rec.searchCat}`);

    // Pulse the result
    gsap.fromTo("#sg-rec-icon", { scale: 0.8 }, { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1, ease: "power1.inOut" });
}

function closeSizeGuide() {
    gsap.to(".sg-backdrop", { opacity: 0, duration: 0.2 });
    gsap.to(".sg-sheet", {
        y: "100%", duration: 0.35, ease: "power2.in",
        onComplete: () => document.getElementById("size-guide-overlay")?.remove(),
    });
}
