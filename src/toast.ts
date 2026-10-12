// Lightweight, non-blocking toast used for add-to-cart style feedback
import gsap from "gsap";

let hideTimer: ReturnType<typeof setTimeout> | undefined;

export function showToast(message: string, kind: "success" | "error" = "success") {
    let toast = document.getElementById("app-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "app-toast";
        toast.className = "app-toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        document.body.appendChild(toast);
    }

    toast.className = `app-toast ${kind}`;
    toast.textContent = message;

    clearTimeout(hideTimer);
    gsap.killTweensOf(toast);
    gsap.fromTo(toast, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" });
    hideTimer = setTimeout(() => {
        gsap.to(toast, { opacity: 0, y: 10, duration: 0.25, ease: "power2.in" });
    }, 2200);
}
