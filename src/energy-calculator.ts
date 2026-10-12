// Breezalit — Smart Energy Calculator
// Interactive bottom-sheet showing monthly electricity savings of BLDC vs normal fan
import gsap from "gsap";

const NORMAL_FAN_WATTS = 75;
const DEFAULT_RATE = 8; // ₹ per kWh
const DEFAULT_HOURS = 8;

let isOpen = false;

function calcMonthlyCost(watts: number, hours: number, rate: number): number {
    return (watts / 1000) * hours * 30 * rate;
}

export function openEnergyCalculator(bldcWatts: number) {
    if (isOpen) return;
    isOpen = true;

    const overlay = document.createElement("div");
    overlay.id = "energy-calc-overlay";
    overlay.innerHTML = `
    <div class="ec-backdrop" id="ec-backdrop"></div>
    <div class="ec-sheet" id="ec-sheet">
      <div class="ec-handle"></div>
      <h2 class="ec-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        Energy Savings Calculator
      </h2>
      <p class="ec-subtitle">See how much you save with BLDC technology</p>

      <div class="ec-slider-section">
        <label class="ec-label">Daily Usage</label>
        <div class="ec-slider-row">
          <input type="range" id="ec-hours" min="1" max="24" value="${DEFAULT_HOURS}" class="ec-range" />
          <span class="ec-hours-val" id="ec-hours-val">${DEFAULT_HOURS} hrs</span>
        </div>
      </div>

      <div class="ec-slider-section">
        <label class="ec-label">Electricity Rate</label>
        <div class="ec-slider-row">
          <input type="range" id="ec-rate" min="3" max="15" value="${DEFAULT_RATE}" step="0.5" class="ec-range" />
          <span class="ec-hours-val" id="ec-rate-val">₹${DEFAULT_RATE}/kWh</span>
        </div>
      </div>

      <div class="ec-comparison">
        <div class="ec-card ec-card-normal">
          <div class="ec-card-label">Normal Fan</div>
          <div class="ec-card-watts">${NORMAL_FAN_WATTS}W</div>
          <div class="ec-card-cost" id="ec-cost-normal">₹0</div>
          <div class="ec-card-period">per month</div>
        </div>
        <div class="ec-vs">VS</div>
        <div class="ec-card ec-card-bldc">
          <div class="ec-card-label">This BLDC Fan</div>
          <div class="ec-card-watts">${bldcWatts}W</div>
          <div class="ec-card-cost" id="ec-cost-bldc">₹0</div>
          <div class="ec-card-period">per month</div>
        </div>
      </div>

      <div class="ec-savings-box" id="ec-savings-box">
        <div class="ec-savings-label">You Save</div>
        <div class="ec-savings-amount" id="ec-savings-month">₹0/month</div>
        <div class="ec-savings-year" id="ec-savings-year">₹0 per year</div>
      </div>

      <button class="ec-close-btn" id="ec-close">Got It!</button>
    </div>
  `;
    document.body.appendChild(overlay);

    // Elements
    const sheet = document.getElementById("ec-sheet")!;
    const backdrop = document.getElementById("ec-backdrop")!;
    const hoursSlider = document.getElementById("ec-hours") as HTMLInputElement;
    const rateSlider = document.getElementById("ec-rate") as HTMLInputElement;
    const hoursVal = document.getElementById("ec-hours-val")!;
    const rateVal = document.getElementById("ec-rate-val")!;
    const costNormal = document.getElementById("ec-cost-normal")!;
    const costBldc = document.getElementById("ec-cost-bldc")!;
    const savingsMonth = document.getElementById("ec-savings-month")!;
    const savingsYear = document.getElementById("ec-savings-year")!;
    const savingsBox = document.getElementById("ec-savings-box")!;

    function update() {
        const hrs = parseFloat(hoursSlider.value);
        const rate = parseFloat(rateSlider.value);
        hoursVal.textContent = `${hrs} hrs`;
        rateVal.textContent = `₹${rate}/kWh`;

        const normalCost = calcMonthlyCost(NORMAL_FAN_WATTS, hrs, rate);
        const bldcCost = calcMonthlyCost(bldcWatts, hrs, rate);
        const monthlySavings = normalCost - bldcCost;
        const yearlySavings = monthlySavings * 12;

        // Animate counters
        gsap.to({ val: parseFloat(costNormal.textContent?.replace(/[₹,]/g, "") || "0") }, {
            val: normalCost, duration: 0.5, ease: "power2.out",
            onUpdate: function () { costNormal.textContent = `₹${Math.round(this.targets()[0].val).toLocaleString("en-IN")}`; }
        });
        gsap.to({ val: parseFloat(costBldc.textContent?.replace(/[₹,]/g, "") || "0") }, {
            val: bldcCost, duration: 0.5, ease: "power2.out",
            onUpdate: function () { costBldc.textContent = `₹${Math.round(this.targets()[0].val).toLocaleString("en-IN")}`; }
        });
        gsap.to({ val: 0 }, {
            val: monthlySavings, duration: 0.6, ease: "power2.out",
            onUpdate: function () { savingsMonth.textContent = `₹${Math.round(this.targets()[0].val).toLocaleString("en-IN")}/month`; }
        });
        gsap.to({ val: 0 }, {
            val: yearlySavings, duration: 0.6, ease: "power2.out",
            onUpdate: function () { savingsYear.textContent = `₹${Math.round(this.targets()[0].val).toLocaleString("en-IN")} per year`; }
        });

        // Pulse the savings box
        gsap.fromTo(savingsBox, { scale: 0.97 }, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.5)" });
    }

    hoursSlider.addEventListener("input", update);
    rateSlider.addEventListener("input", update);

    // Close handlers
    const close = () => closeEnergyCalculator();
    document.getElementById("ec-close")!.addEventListener("click", close);
    backdrop.addEventListener("click", close);

    // Entrance animation
    gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(sheet, { y: "100%" }, { y: "0%", duration: 0.5, ease: "power3.out", onComplete: update });
}

export function closeEnergyCalculator() {
    if (!isOpen) return;
    const sheet = document.getElementById("ec-sheet");
    const backdrop = document.getElementById("ec-backdrop");
    const overlay = document.getElementById("energy-calc-overlay");

    gsap.to(sheet, { y: "100%", duration: 0.35, ease: "power3.in" });
    gsap.to(backdrop, {
        opacity: 0, duration: 0.3, delay: 0.1,
        onComplete: () => {
            overlay?.remove();
            isOpen = false;
        }
    });
}
