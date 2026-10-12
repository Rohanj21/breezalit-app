// About Page — Premium with GSAP animations
import { animateStats, animateFeatures, animateSection } from "../animations";
import gsap from "gsap";

export async function renderAbout(): Promise<string> {
  return `
    <div class="about-page">
      <!-- Hero -->
      <section class="about-hero">
        <div class="about-badge">ABOUT US</div>
        <h1 class="about-title">We Make Homes<br><span class="accent">Breezy & Beautiful</span></h1>
        <p class="about-intro">Breezalit is a trusted name in premium ceiling fans, exhaust fans, and BLDC technology fans. We blend cutting-edge engineering with stunning design to bring comfort and elegance to over 10,000+ modern homes across India.</p>
      </section>

      <!-- Stats -->
      <section class="about-stats-section">
        <div class="stat-card">
          <div class="stat-icon">🏠</div>
          <span class="stat-number">10K+</span>
          <span class="stat-label">Happy Homes</span>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🌀</div>
          <span class="stat-number">50+</span>
          <span class="stat-label">Fan Models</span>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <span class="stat-number">4.8</span>
          <span class="stat-label">Avg Rating</span>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🛡️</div>
          <span class="stat-number">5 Yr</span>
          <span class="stat-label">Warranty</span>
        </div>
      </section>

      <!-- Why Choose -->
      <section class="about-why section">
        <h2 class="section-title">Why Choose Breezalit?</h2>
        <div class="feature-list">
          <div class="feature-item">
            <div class="feature-icon-wrap"><span>⚡</span></div>
            <div class="feature-body">
              <h3>BLDC Technology</h3>
              <p>Energy-efficient motors saving up to 65% electricity vs conventional fans.</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon-wrap"><span>🎨</span></div>
            <div class="feature-body">
              <h3>Premium Finishes</h3>
              <p>Metallic, matte, and wood-grain finishes crafted for any interior style.</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon-wrap"><span>🔇</span></div>
            <div class="feature-body">
              <h3>Silent Operation</h3>
              <p>Whisper-quiet motors for peaceful living and undisturbed sleep.</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon-wrap"><span>📱</span></div>
            <div class="feature-body">
              <h3>Smart Controls</h3>
              <p>Remote, IoT and app-based controls for effortless comfort.</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon-wrap"><span>🛡️</span></div>
            <div class="feature-body">
              <h3>5 Year Warranty</h3>
              <p>Complete peace of mind with comprehensive support.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact -->
      <section class="about-contact section">
        <h2 class="section-title">Get in Touch</h2>
        <div class="contact-grid">
          <a href="mailto:support@breezalit.com" class="contact-card">
            <div class="contact-icon">📧</div>
            <div class="contact-text">
              <span class="contact-label">Email</span>
              <span class="contact-value">support@breezalit.com</span>
            </div>
          </a>
          <a href="tel:+919876543210" class="contact-card">
            <div class="contact-icon">📞</div>
            <div class="contact-text">
              <span class="contact-label">Phone</span>
              <span class="contact-value">+91 98765 43210</span>
            </div>
          </a>
          <div class="contact-card">
            <div class="contact-icon">📍</div>
            <div class="contact-text">
              <span class="contact-label">Location</span>
              <span class="contact-value">Mumbai, Maharashtra</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Brand Footer -->
      <section class="about-brand-footer">
        <div class="brand-logo-lg">
          <span class="brand-gro">Gro</span><span class="brand-store">store</span>
        </div>
        <p>Crafting premium comfort since 2019</p>
      </section>
    </div>
  `;
}

export function onAboutMount() {
  gsap.timeline({ defaults: { ease: "power3.out" } })
    .fromTo(".about-badge", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4 })
    .fromTo(".about-title", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.2")
    .fromTo(".about-intro", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, "-=0.2");

  setTimeout(() => {
    animateStats();
    animateFeatures();
    animateSection(".about-contact");
  }, 300);
}
