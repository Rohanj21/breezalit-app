// Breezalit Assistant — Premium Chatbot with GSAP animations
import gsap from "gsap";

// ── FAQ Knowledge Base ──
const FAQ: { q: string; a: string }[] = [
    {
        q: "I need help choosing a fan",
        a: "Great choice! For rooms up to 120 sq ft, we recommend our 48\" BLDC fans. For larger spaces, our 56\" models are ideal. All our fans feature energy-efficient BLDC motors that save up to 65% on electricity. Would you like to explore our <a href='#/shop'>collection</a>?"
    },
    {
        q: "What is the warranty?",
        a: "All Breezalit ceiling fans come with a <strong>5-Year Comprehensive Warranty</strong> covering the motor, electrical components, and manufacturing defects. Our BLDC motors are designed to last 15+ years with minimal maintenance."
    },
    {
        q: "Are these fans energy efficient?",
        a: "Absolutely! Our BLDC fans consume only <strong>28-35 watts</strong> compared to 70-80 watts for regular fans — saving up to ₹1,500/year per fan on your electricity bill. They're BEE 5-star rated for maximum efficiency."
    },
    {
        q: "How do I clean my fan?",
        a: "For best results: 1) Turn off the fan and let blades stop completely. 2) Use a soft, damp microfiber cloth to wipe each blade. 3) For stubborn dust, use a mild soap solution. 4) Never use abrasive cleaners or submerge the motor in water. Clean every 2-3 months for optimal performance."
    },
    {
        q: "Do you offer installation?",
        a: "Yes! We provide <strong>free professional installation</strong> across major cities in India. After your purchase, our installation team will contact you within 48 hours to schedule a convenient time. For remote locations, we provide detailed video installation guides."
    },
    {
        q: "What colors are available?",
        a: "Our fans come in a variety of premium finishes including Antique Copper with Rosewood, Antique Brass with Walnut, Brushed Steel, Pearl White, and Matt Black. Browse our <a href='#/shop'>full catalog</a> to see all options!"
    },
    {
        q: "What's the return policy?",
        a: "We offer a <strong>7-day easy return policy</strong> from the date of delivery. The product must be unused and in original packaging. Refunds are processed within 5-7 business days. For any quality issues, our warranty covers free replacement."
    },
    {
        q: "Do fans come with remote?",
        a: "Yes! All our BLDC ceiling fans come with a <strong>premium IR remote control</strong> included. Features include speed control (1-5), timer (1/2/4/8 hours), sleep mode, boost mode, and LED light toggle (for applicable models)."
    },
];

const WHATSAPP_NUMBER = "919315603663";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20Breezalit%2C%20I%20need%20help%20with%20your%20products.`;

// ── Inject Chatbot HTML ──
export function initChatbot() {
    const chatbotHTML = `
    <!-- Floating Action Button -->
    <button class="chat-fab" id="chat-fab" aria-label="Open Breezalit Assistant">
      <div class="fab-icon-wrap">
        <svg class="fab-icon-chat" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <svg class="fab-icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </div>
      <span class="fab-pulse"></span>
    </button>

    <!-- Chat Panel -->
    <div class="chat-panel" id="chat-panel">
      <!-- Header -->
      <div class="chat-header">
        <div class="chat-header-info">
          <div class="chat-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <h3 class="chat-brand">Breeza<span>lit</span> Assistant</h3>
            <span class="chat-status"><span class="status-dot"></span>Online</span>
          </div>
        </div>
        <button class="chat-close-btn" id="chat-close" aria-label="Close chat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- WhatsApp Banner -->
      <a href="${WHATSAPP_URL}" target="_blank" rel="noopener" class="chat-wa-banner" id="chat-wa-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span>Contact on WhatsApp</span>
      </a>

      <!-- Messages Area -->
      <div class="chat-messages" id="chat-messages">
        <div class="chat-bubble bot-bubble" id="welcome-bubble">
          <p>Hello! Welcome to Breezalit. How can I help you with our luxury fans today?</p>
        </div>
      </div>

      <!-- Quick Replies -->
      <div class="chat-quick-replies" id="chat-quick-replies">
        ${FAQ.slice(0, 4).map((item, i) => `
          <button class="quick-reply-btn" data-faq-idx="${i}">${item.q}</button>
        `).join("")}
      </div>

      <!-- Input Area -->
      <div class="chat-input-area">
        <div class="chat-input-wrap">
          <input type="text" class="chat-input" id="chat-input" placeholder="Type a message..." autocomplete="off" />
          <button class="chat-send-btn" id="chat-send" aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;

    document.body.insertAdjacentHTML("beforeend", chatbotHTML);

    // ── Element Refs ──
    const fab = document.getElementById("chat-fab")!;
    const panel = document.getElementById("chat-panel")!;
    const closeBtn = document.getElementById("chat-close")!;
    const messagesArea = document.getElementById("chat-messages")!;
    const quickReplies = document.getElementById("chat-quick-replies")!;
    const chatInput = document.getElementById("chat-input") as HTMLInputElement;
    const sendBtn = document.getElementById("chat-send")!;
    let isOpen = false;

    // ── GSAP Setup ──
    gsap.set(panel, { autoAlpha: 0, y: 40, scale: 0.92, transformOrigin: "bottom right" });
    gsap.set(".fab-icon-close", { scale: 0, rotation: -90, opacity: 0 });

    // FAB pulse animation
    gsap.to(".fab-pulse", {
        scale: 2.5, opacity: 0, duration: 1.8, repeat: -1, ease: "power2.out"
    });

    // ── Open / Close Logic ──
    function openChat() {
        isOpen = true;
        const tl = gsap.timeline();
        // Morph FAB icon
        tl.to(".fab-icon-chat", { scale: 0, rotation: 90, opacity: 0, duration: 0.25, ease: "power2.in" }, 0);
        tl.to(".fab-icon-close", { scale: 1, rotation: 0, opacity: 1, duration: 0.3, ease: "back.out(2)" }, 0.15);
        tl.to(".fab-pulse", { scale: 0, opacity: 0, duration: 0.2 }, 0);
        // Panel entrance
        tl.to(panel, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.4)" }, 0.1);
        // Stagger in WhatsApp banner + welcome bubble + quick replies
        tl.fromTo("#chat-wa-banner", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, 0.3);
        tl.fromTo("#welcome-bubble", { y: 20, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, 0.4);
        tl.fromTo(".quick-reply-btn", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.06, ease: "power3.out" }, 0.55);
    }

    function closeChat() {
        isOpen = false;
        const tl = gsap.timeline();
        tl.to(panel, { autoAlpha: 0, y: 40, scale: 0.92, duration: 0.3, ease: "power2.in" }, 0);
        tl.to(".fab-icon-close", { scale: 0, rotation: -90, opacity: 0, duration: 0.2 }, 0);
        tl.to(".fab-icon-chat", { scale: 1, rotation: 0, opacity: 1, duration: 0.3, ease: "back.out(2)" }, 0.15);
        tl.to(".fab-pulse", { scale: 1, opacity: 0.6, duration: 0.3 }, 0.2);
    }

    fab.addEventListener("click", () => isOpen ? closeChat() : openChat());
    closeBtn.addEventListener("click", closeChat);

    // ── Add Message Helpers ──
    function addBotMessage(html: string) {
        const bubble = document.createElement("div");
        bubble.className = "chat-bubble bot-bubble";
        bubble.innerHTML = `<p>${html}</p>`;
        messagesArea.appendChild(bubble);

        // Typing indicator first
        const typing = document.createElement("div");
        typing.className = "chat-typing";
        typing.innerHTML = `<span></span><span></span><span></span>`;
        messagesArea.appendChild(typing);
        messagesArea.scrollTop = messagesArea.scrollHeight;

        gsap.fromTo(typing, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25 });

        setTimeout(() => {
            typing.remove();
            bubble.style.display = "block";
            gsap.fromTo(bubble,
                { y: 20, opacity: 0, scale: 0.9 },
                { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }
            );
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }, 800 + Math.random() * 600);

        // Initially hide the actual bubble
        bubble.style.display = "none";
    }

    function escapeHtml(s: string) {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function addUserMessage(text: string) {
        const bubble = document.createElement("div");
        bubble.className = "chat-bubble user-bubble";
        bubble.innerHTML = `<p>${escapeHtml(text)}</p>`;
        messagesArea.appendChild(bubble);
        gsap.fromTo(bubble,
            { y: 15, opacity: 0, scale: 0.9 },
            { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.5)" }
        );
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // ── Quick Reply Handling ──
    quickReplies.addEventListener("click", (e) => {
        const btn = (e.target as HTMLElement).closest(".quick-reply-btn") as HTMLElement;
        if (!btn) return;
        const idx = parseInt(btn.dataset.faqIdx || "0");
        const faq = FAQ[idx];
        if (!faq) return;

        // Animate button press
        gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.4)" });

        addUserMessage(faq.q);

        // Show new set of quick replies after answering
        setTimeout(() => {
            addBotMessage(faq.a);
            // Replace quick replies with remaining ones
            showNewQuickReplies(idx);
        }, 200);
    });

    function showNewQuickReplies(excludeIdx: number) {
        const remaining = FAQ.filter((_, i) => i !== excludeIdx).slice(0, 4);
        setTimeout(() => {
            quickReplies.innerHTML = remaining.map((item) => {
                const origIdx = FAQ.indexOf(item);
                return `<button class="quick-reply-btn" data-faq-idx="${origIdx}">${item.q}</button>`;
            }).join("");
            gsap.fromTo(".quick-reply-btn", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: "power3.out" });
        }, 1600);
    }

    // ── Free-text Input ──
    function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;
        chatInput.value = "";

        addUserMessage(text);

        // Simple keyword matching
        const lower = text.toLowerCase();
        let answer = "";

        if (lower.includes("warranty") || lower.includes("guarantee")) {
            answer = FAQ[1].a;
        } else if (lower.includes("energy") || lower.includes("watt") || lower.includes("electricity") || lower.includes("power")) {
            answer = FAQ[2].a;
        } else if (lower.includes("clean") || lower.includes("maintain") || lower.includes("wash")) {
            answer = FAQ[3].a;
        } else if (lower.includes("install") || lower.includes("setup") || /\bfit(ting|ted)?\b/.test(lower)) {
            answer = FAQ[4].a;
        } else if (lower.includes("color") || lower.includes("colour") || lower.includes("finish")) {
            answer = FAQ[5].a;
        } else if (lower.includes("return") || lower.includes("refund") || lower.includes("exchange")) {
            answer = FAQ[6].a;
        } else if (lower.includes("remote") || lower.includes("control") || lower.includes("speed")) {
            answer = FAQ[7].a;
        } else if (lower.includes("price") || lower.includes("cost") || lower.includes("how much") || lower.includes("discount")) {
            answer = "Our premium BLDC fans range from ₹2,500 to ₹12,000 depending on the model and features. Check our <a href='#/shop'>shop page</a> for current prices and exclusive discounts up to 25% off!";
        } else if (/\b(hi|hello|hey)\b/.test(lower)) {
            answer = "Hello! 👋 Welcome to Breezalit. I'm here to help you find the perfect fan. Feel free to ask me anything!";
        } else if (lower.includes("thank") || lower.includes("thanks")) {
            answer = "You're welcome! 😊 If you need further assistance, feel free to ask anytime. You can also reach us on <a href='" + WHATSAPP_URL + "' target='_blank'>WhatsApp</a> for instant support.";
        } else {
            answer = "I'd love to help with that! For detailed assistance, please contact our team directly on <a href='" + WHATSAPP_URL + "' target='_blank'>WhatsApp</a> or call us at <strong>+91 93156 03663</strong>. They'll be happy to assist you!";
        }

        setTimeout(() => addBotMessage(answer), 300);
    }

    sendBtn.addEventListener("click", handleSend);
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleSend();
    });

    // ── Entrance animation for FAB ──
    gsap.fromTo(fab,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.6, delay: 2, ease: "back.out(2)" }
    );
}