// GSAP-powered hash-based SPA router
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { killHeroCarousel } from "./animations";

export interface Route {
    path: string;
    render: (params: Record<string, string>) => Promise<string> | string;
    onMounted?: () => void;
}

let routes: Route[] = [];
let container: HTMLElement | null = null;

export function registerRoutes(routeList: Route[], mountEl: HTMLElement) {
    routes = routeList;
    container = mountEl;
    window.addEventListener("hashchange", handleRoute);
    handleRoute();
}

export function navigate(path: string) {
    window.location.hash = `#${path}`;
}

let navToken = 0;

async function handleRoute() {
    if (!container) return;
    const token = ++navToken;

    const hash = window.location.hash.slice(1) || "/";
    let matched: Route | undefined;
    let params: Record<string, string> = {};

    for (const route of routes) {
        const result = matchRoute(route.path, hash);
        if (result) {
            matched = route;
            params = result;
            break;
        }
    }

    if (!matched) {
        matched = routes[0];
        params = {};
    }

    // GSAP exit animation
    await gsap.to(container, {
        opacity: 0,
        y: -20,
        duration: 0.2,
        ease: "power2.in",
    });
    if (token !== navToken) return; // a newer navigation superseded this one

    // Kill scroll triggers / looping tweens bound to the outgoing page
    killHeroCarousel();
    ScrollTrigger.getAll().forEach((t) => t.kill());
    gsap.killTweensOf(container.querySelectorAll("*"));

    let html: string;
    try {
        html = await matched.render(params);
    } catch (err) {
        console.error("[Router] render failed:", err);
        html = `<div class="error-state"><p>⚠️ Something went wrong loading this page.</p><a href="#/" class="btn-primary-pill">Go Home</a></div>`;
    }
    if (token !== navToken) return;
    container.innerHTML = html;

    // GSAP entrance animation
    gsap.fromTo(
        container,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", clearProps: "all" }
    );

    container.scrollTop = 0;
    window.scrollTo(0, 0);

    updateActiveNav(hash);

    // Call onMounted after DOM is updated
    if (matched.onMounted) {
        requestAnimationFrame(() => {
            if (token !== navToken) return;
            try {
                matched!.onMounted!();
            } catch (err) {
                console.error("[Router] onMounted failed:", err);
            }
        });
    }

    window.dispatchEvent(
        new CustomEvent("route-rendered", { detail: { path: hash, params } })
    );
}

function matchRoute(
    pattern: string,
    path: string
): Record<string, string> | null {
    // Handle query strings
    const cleanPath = path.split("?")[0];
    const patternParts = pattern.split("/").filter(Boolean);
    const pathParts = cleanPath.split("/").filter(Boolean);

    if (patternParts.length !== pathParts.length) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(":")) {
            params[patternParts[i].slice(1)] = pathParts[i];
        } else if (patternParts[i] !== pathParts[i]) {
            return null;
        }
    }
    return params;
}

function updateActiveNav(hash: string) {
    const cleanHash = hash.split("?")[0];
    document.querySelectorAll(".bottom-nav a").forEach((a) => {
        a.classList.remove("active");
        const href = a.getAttribute("href") || "";
        const navPath = href.slice(1);
        if (
            cleanHash === navPath ||
            (navPath === "/" && (cleanHash === "/" || cleanHash === "")) ||
            (navPath !== "/" && cleanHash.startsWith(navPath))
        ) {
            a.classList.add("active");
        }
    });
}
