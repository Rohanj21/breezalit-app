// Breezalit splash — fan spins up and settles, brand reveals, then a soft exit.
// Full sequence on the first launch of a session, a quick one afterwards.
import gsap from "gsap";

const SEEN_KEY = "breezalit_splash_seen";

function hasSeenSplash(): boolean {
    try {
        return sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
        return false;
    }
}

function markSplashSeen() {
    try {
        sessionStorage.setItem(SEEN_KEY, "1");
    } catch { /* storage unavailable — harmless */ }
}

export function runSplash(onDone?: () => void) {
    const splash = document.getElementById("splash-screen");
    if (!splash) {
        onDone?.();
        return;
    }

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const quick = reduceMotion || hasSeenSplash();
    markSplashSeen();

    const fan = splash.querySelector<HTMLElement>("#splash-fan");
    const fanSvg = splash.querySelector<SVGElement>("#splash-fan svg");
    const letters = splash.querySelectorAll<HTMLElement>("#splash-brand span");
    const tagline = splash.querySelector<HTMLElement>("#splash-tagline");
    const line = splash.querySelector<HTMLElement>("#splash-line");
    const particleBox = splash.querySelector<HTMLElement>("#splash-particles");

    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;
        gsap.killTweensOf([splash, fan, fanSvg, letters, tagline, line]);
        gsap.killTweensOf(splash.querySelectorAll(".splash-particle"));
        splash.remove(); // also stops every tween still running inside it
        onDone?.();
    };

    // ── Initial state ──
    gsap.set(fan, { scale: 0.6, opacity: 0, transformOrigin: "50% 50%" });
    gsap.set(fanSvg, { transformOrigin: "50% 50%" });
    gsap.set(letters, { opacity: 0, y: 28 });
    gsap.set(tagline, { opacity: 0, y: 10 });
    gsap.set(line, { scaleX: 0 });

    // ── Soft floating particles (fewer, slower) ──
    if (particleBox && !quick) {
        const count = 12;
        for (let i = 0; i < count; i++) {
            const dot = document.createElement("div");
            dot.className = "splash-particle";
            const size = 3 + Math.random() * 5;
            dot.style.cssText = `left:${Math.random() * 100}%;top:${40 + Math.random() * 60}%;width:${size}px;height:${size}px;`;
            particleBox.appendChild(dot);
            gsap.fromTo(dot,
                { opacity: 0, y: 0 },
                {
                    opacity: 0.35 + Math.random() * 0.25,
                    y: -(80 + Math.random() * 140),
                    duration: 1.6 + Math.random() * 0.8,
                    delay: Math.random() * 0.6,
                    ease: "sine.out",
                    yoyo: true,
                    repeat: 1,
                    repeatDelay: 0,
                }
            );
        }
    }

    const tl = gsap.timeline({ onComplete: finish });

    if (quick) {
        // Returning launch: ~1s, no fuss
        tl.to(fan, { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out" }, 0)
            .to(fanSvg, { rotation: 360, duration: 0.8, ease: "power2.out" }, 0)
            .to(letters, { opacity: 1, y: 0, duration: 0.3, stagger: 0.025, ease: "power2.out" }, 0.1)
            .to(tagline, { opacity: 1, y: 0, duration: 0.25 }, 0.3)
            .to(splash, { opacity: 0, duration: 0.3, ease: "power1.in" }, 0.85);
    } else {
        // 1. Fan appears and spins up, decelerating into its resting angle
        tl.to(fan, { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.6)" }, 0)
            .fromTo(fanSvg, { rotation: -540 }, { rotation: 0, duration: 1.5, ease: "power3.out" }, 0)

            // 2. Brand letters rise in, one by one
            .to(letters, { opacity: 1, y: 0, duration: 0.55, stagger: 0.05, ease: "power3.out" }, 0.45)

            // 3. Tagline + accent line
            .to(tagline, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 1.0)
            .to(line, { scaleX: 1, duration: 0.5, ease: "power3.out" }, 1.1)

            // 4. Short hold, then a soft exit: content lifts, splash dissolves
            .to([fan, ".splash-brand", tagline, line], { y: -12, duration: 0.5, ease: "power2.in" }, 2.0)
            .to(splash, { opacity: 0, duration: 0.5, ease: "power1.inOut" }, 2.05);
    }

    // Tap to skip
    splash.addEventListener("click", () => {
        if (finished) return;
        tl.timeScale(3);
    }, { once: true });
}
