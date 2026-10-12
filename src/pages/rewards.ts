import gsap from "gsap";

// ── Mock User Data ──
const USER_REWARDS = {
    name: "Aditya",
    tier: "Silver",
    points: 1850,
    nextTier: "Gold",
    nextTierAt: 3000,
    totalEarned: 2400,
    history: [
        { action: "Purchase — Vent Air 48″", pts: 500, date: "Sep 05" },
        { action: "Wrote a Review", pts: 150, date: "Sep 02" },
        { action: "Referral — Vikram S.", pts: 400, date: "Aug 28" },
        { action: "Completed Fan Finder Quiz", pts: 100, date: "Aug 20" },
    ],
};

const TIERS: Record<string, { color: string; icon: string; min: number }> = {
    Bronze: { color: "#cd7f32", icon: "🥉", min: 0 },
    Silver: { color: "#c0c0c0", icon: "🥈", min: 1000 },
    Gold: { color: "#ffd700", icon: "🥇", min: 3000 },
    Platinum: { color: "#e5e4e2", icon: "💎", min: 7000 },
};

const EARN_WAYS = [
    { icon: "🛒", title: "Make a Purchase", desc: "Earn 10 pts per ₹100 spent", pts: "10×" },
    { icon: "👥", title: "Refer a Friend", desc: "Both earn 400 bonus points", pts: "+400" },
    { icon: "⭐", title: "Write a Review", desc: "Share your experience", pts: "+150" },
    { icon: "🎯", title: "Take the Quiz", desc: "Complete the Fan Finder", pts: "+100" },
];

const REWARDS_STORE = [
    { title: "₹200 Off Next Order", cost: 1000, icon: "🏷️" },
    { title: "Free Installation", cost: 1500, icon: "🔧" },
    { title: "Exclusive Fan Color", cost: 2500, icon: "🎨" },
    { title: "Priority Support", cost: 500, icon: "⚡" },
];

export function renderRewards(): string {
    const u = USER_REWARDS;
    const tierInfo = TIERS[u.tier];
    const circumference = 2 * Math.PI * 54; // radius 54

    return `
    <div class="rewards-page slide-in-right">
      <div class="global-header glass-header">
        <a href="#/" class="header-icon-btn" aria-label="Go Back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </a>
        <h1 class="header-title">My Rewards</h1>
        <div style="width:40px;"></div>
      </div>

      <div class="rewards-content">
        <!-- Tier Ring Card -->
        <div class="rw-tier-card">
          <div class="rw-ring-wrap">
            <svg class="rw-ring-svg" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border-light)" stroke-width="8" opacity="0.3"/>
              <circle class="rw-ring-progress" cx="60" cy="60" r="54" fill="none"
                stroke="${tierInfo.color}" stroke-width="8" stroke-linecap="round"
                stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"
                transform="rotate(-90 60 60)"/>
            </svg>
            <div class="rw-ring-center">
              <span class="rw-tier-icon">${tierInfo.icon}</span>
              <span class="rw-tier-label">${u.tier}</span>
            </div>
          </div>
          <div class="rw-tier-info">
            <h2>Hey, ${u.name}!</h2>
            <p class="rw-pts-display"><span class="rw-pts-num" id="rw-pts-count">0</span> pts</p>
            <div class="rw-tier-bar-wrap">
              <div class="rw-tier-bar">
                <div class="rw-tier-bar-fill" id="rw-tier-bar-fill" style="width:0%"></div>
              </div>
              <span class="rw-next-tier">${u.nextTier} at ${u.nextTierAt.toLocaleString()} pts</span>
            </div>
          </div>
        </div>

        <!-- Earn Points Section -->
        <h3 class="rw-section-title">Ways to Earn</h3>
        <div class="rw-earn-grid">
          ${EARN_WAYS.map(w => `
            <div class="rw-earn-card">
              <span class="rw-earn-icon">${w.icon}</span>
              <div class="rw-earn-text">
                <h4>${w.title}</h4>
                <p>${w.desc}</p>
              </div>
              <span class="rw-earn-badge">${w.pts}</span>
            </div>
          `).join("")}
        </div>

        <!-- Rewards Store -->
        <h3 class="rw-section-title">Redeem Rewards</h3>
        <div class="rw-store-grid">
          ${REWARDS_STORE.map(r => `
            <div class="rw-store-card">
              <span class="rw-store-icon">${r.icon}</span>
              <h4>${r.title}</h4>
              <span class="rw-store-cost">${r.cost} pts</span>
              <button class="rw-redeem-btn" ${u.points < r.cost ? "disabled" : ""}>${u.points >= r.cost ? "Redeem" : "Locked"}</button>
            </div>
          `).join("")}
        </div>

        <!-- Recent Activity -->
        <h3 class="rw-section-title">Recent Activity</h3>
        <div class="rw-history">
          ${u.history.map(h => `
            <div class="rw-history-row">
              <div class="rw-hist-info">
                <span class="rw-hist-action">${h.action}</span>
                <span class="rw-hist-date">${h.date}</span>
              </div>
              <span class="rw-hist-pts">+${h.pts}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

export function onRewardsMount() {
    const u = USER_REWARDS;
    const circumference = 2 * Math.PI * 54;
    const progress = ((u.points - TIERS[u.tier].min) / (u.nextTierAt - TIERS[u.tier].min));
    const targetOffset = circumference * (1 - progress);

    // ── SVG Ring Animation ──
    gsap.to(".rw-ring-progress", {
        strokeDashoffset: targetOffset,
        duration: 2,
        ease: "power3.out",
        delay: 0.3,
    });

    // ── CountUp Points ──
    const ptsEl = document.getElementById("rw-pts-count");
    if (ptsEl) {
        gsap.to({ val: 0 }, {
            val: u.points,
            duration: 2,
            ease: "power2.out",
            delay: 0.3,
            snap: { val: 1 },
            onUpdate() {
                ptsEl.textContent = Math.round(this.targets()[0].val).toLocaleString();
            },
        });
    }

    // ── XP Bar Fill ──
    gsap.to("#rw-tier-bar-fill", {
        width: `${progress * 100}%`,
        duration: 1.5,
        ease: "power2.out",
        delay: 0.5,
    });

    // ── Tier Card Entrance ──
    gsap.fromTo(".rw-tier-card",
        { y: 40, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.4)" }
    );

    // ── Earn Cards Stagger ──
    gsap.fromTo(".rw-earn-card",
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power3.out", delay: 0.4 }
    );

    // ── Store Cards Stagger with 3D ──
    gsap.fromTo(".rw-store-card",
        { y: 30, opacity: 0, rotateX: 15 },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.6, stagger: 0.12, ease: "back.out(1.2)", delay: 0.6 }
    );

    // ── History Rows ──
    gsap.fromTo(".rw-history-row",
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: "power2.out", delay: 0.8 }
    );

    // ── Redeem button click ──
    document.querySelectorAll(".rw-redeem-btn:not([disabled])").forEach(btn => {
        btn.addEventListener("click", () => {
            const card = btn.closest(".rw-store-card") as HTMLElement;
            // Flip animation
            gsap.timeline()
                .to(card, { rotateY: 90, duration: 0.25, ease: "power2.in" })
                .set(card, { innerHTML: `<span class="rw-store-icon">✅</span><h4>Redeemed!</h4><span class="rw-store-cost">Check your email</span>` })
                .to(card, { rotateY: 0, duration: 0.35, ease: "back.out(1.4)" });

            // Confetti burst
            spawnConfetti(card);
        });
    });
}

function spawnConfetti(anchor: HTMLElement) {
    const rect = anchor.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ["#f26522", "#ffd700", "#25D366", "#e02b2b", "#5a9bc0"];

    for (let i = 0; i < 20; i++) {
        const dot = document.createElement("div");
        dot.className = "confetti-dot";
        dot.style.left = `${cx}px`;
        dot.style.top = `${cy}px`;
        dot.style.background = colors[i % colors.length];
        document.body.appendChild(dot);

        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 80;

        gsap.to(dot, {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist - 40,
            opacity: 0,
            scale: 0,
            duration: 0.8 + Math.random() * 0.4,
            ease: "power2.out",
            onComplete: () => dot.remove(),
        });
    }
}
