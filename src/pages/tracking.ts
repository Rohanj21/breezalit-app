import gsap from "gsap";

export function renderTracking(): string {
    return `
    <div class="tracking-page slide-in-right">
      <div class="global-header glass-header">
        <a href="#/" class="header-icon-btn" aria-label="Go Back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </a>
        <h1 class="header-title">Track Order</h1>
        <div style="width:40px;"></div>
      </div>

      <div class="tracking-content">
        <!-- Order Header -->
        <div class="tracking-order-card">
          <div class="trk-order-top">
            <span class="trk-order-no">Order #BRZ-9240</span>
            <span class="trk-date">Arriving 15 Oct</span>
          </div>
          <div class="trk-product-row">
            <div class="trk-prod-img">
              <img src="https://boundless-night.localsite.io/wp-content/uploads/2024/09/ventx__A.webp" alt="Vent Air" />
            </div>
            <div class="trk-prod-info">
              <h4>Vent Air Metallic Finish - 150mm</h4>
              <p>Color: Golden Oak</p>
              <p class="trk-qty">Qty: 1</p>
            </div>
          </div>
        </div>

        <!-- Tracking Timeline -->
        <div class="tracking-timeline-container">
          <div class="trk-line-bg"></div>
          <div class="trk-line-fill" id="trk-line-fill"></div>
          
          <div class="trk-nodes">
            
            <div class="trk-node completed">
              <div class="trk-dot">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="trk-info">
                <h3>Order Placed</h3>
                <p>12 Oct, 10:30 AM</p>
              </div>
            </div>

            <div class="trk-node completed">
              <div class="trk-dot">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div class="trk-info">
                <h3>Packed & Ready</h3>
                <p>13 Oct, 02:15 PM</p>
              </div>
            </div>

            <div class="trk-node active" id="trk-current-node">
              <div class="trk-dot pulse-dot"></div>
              <div class="trk-info">
                <h3>Out for Delivery</h3>
                <p>14 Oct, 08:00 AM</p>
              </div>
            </div>

            <div class="trk-node pending">
              <div class="trk-dot"></div>
              <div class="trk-info">
                <h3>Delivered</h3>
                <p>Estimated by tomorrow</p>
              </div>
            </div>
            
          </div>

          <!-- The animated delivery truck -->
          <div class="trk-truck-icon" id="trk-truck">
            <svg viewBox="0 0 24 24" fill="var(--primary)" stroke="var(--bg-color)" stroke-width="1.5" stroke-linejoin="round">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
        </div>

        <div class="trk-support-card">
          <p>Need help with your order?</p>
          <a href="https://wa.me/919999999999" target="_blank" class="btn-trk-whatsapp">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 0c-6.626 0-12.031 5.405-12.031 12.031 0 2.115.548 4.182 1.587 6.002l-1.587 5.967 6.103-1.6c1.802.973 3.829 1.488 5.928 1.488 6.625 0 12.031-5.405 12.031-12.031s-5.406-12.031-12.031-12.031zm0 21.847c-1.815 0-3.593-.487-5.148-1.409l-.369-.219-3.82.1.282-3.725-.24-.382c-.991-1.579-1.516-3.411-1.516-5.281 0-5.503 4.478-9.981 9.981-9.981 5.504 0 9.981 4.478 9.981 9.981s-4.477 9.981-9.981 9.981z"/></svg>
            Contact Support
          </a>
        </div>
      </div>
    </div>
  `;
}

export function onTrackingMount() {
    // GSAP Animation Sequence for the tracking timeline

    // 1. Entrance animation for the layout
    gsap.fromTo(".tracking-order-card",
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
    );

    gsap.fromTo(".trk-node",
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.15, ease: "back.out(1)", delay: 0.2 }
    );

    // 2. Animate the line fill progressing downwards
    // For out for delivery, that's node index 2 (0-indexed). So line fills up to about 70%.
    gsap.fromTo("#trk-line-fill",
        { height: "0%" },
        { height: "66%", duration: 2, ease: "power2.inOut", delay: 0.5 }
    );

    // 3. Animate the Truck driving down the line!
    // The line is about 300px tall. We drive the truck from top=0 to top=66%.
    gsap.fromTo("#trk-truck",
        { top: "0%", opacity: 0, scale: 0.5 },
        { top: "66%", opacity: 1, scale: 1, duration: 2, ease: "power2.inOut", delay: 0.5 }
    );

    // Simple rocking motion for the truck while driving
    gsap.to("#trk-truck svg", {
        rotation: 5,
        yoyo: true,
        repeat: 10,
        duration: 0.2,
        ease: "sine.inOut",
        delay: 0.5
    });
}
