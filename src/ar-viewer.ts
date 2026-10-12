// Breezalit — AR Visualizer
import gsap from "gsap";
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

let stream: MediaStream | null = null;
let currentScale = 1;
let currentX = 0;
let currentY = 0;
let baseScale = 1;

export async function openArViewer(fanImageUrl: string) {
    // Inject CSS dynamically for portability if needed, or rely on style.css
    let overlay = document.getElementById("ar-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "ar-overlay";
        overlay.className = "ar-overlay";
        overlay.innerHTML = `
      <div id="ar-flash" class="ar-flash"></div>
      <video id="ar-video" autoplay playsinline></video>
      <div id="ar-fan-container">
          <img id="ar-fan-image" src="${fanImageUrl}" crossorigin="anonymous" />
      </div>
      <div class="ar-controls-top">
          <button class="ar-btn-glass" id="ar-close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
      </div>
      <div id="ar-hints">
         <span class="ar-hint-icon">👆</span> Drag to move &nbsp;&nbsp;&nbsp; <span class="ar-hint-icon">🤏</span> Pinch to resize
      </div>
      <div class="ar-controls-bottom">
          <button class="ar-btn-capture" id="ar-capture">
             <div class="ar-capture-inner"></div>
          </button>
      </div>
    `;
        document.body.appendChild(overlay);

        // Wire listeners once, when the overlay is created
        document.getElementById("ar-close")?.addEventListener("click", closeArViewer);
        document.getElementById("ar-capture")?.addEventListener("click", capturePhoto);
        setupTouchGestures();
    } else {
        // Replace the image element (instead of mutating src) so it is picked up
        // by the authenticated image loader and carries no stale transform.
        const old = document.getElementById("ar-fan-image");
        if (old) {
            const fresh = document.createElement("img");
            fresh.id = "ar-fan-image";
            fresh.crossOrigin = "anonymous";
            fresh.src = fanImageUrl;
            old.replaceWith(fresh);
        }
    }

    // Reset transform state
    currentScale = 1;
    currentX = 0;
    currentY = 0;
    const fanImg = document.getElementById("ar-fan-image");
    if (fanImg) {
        fanImg.style.transform = `translate(0px, 0px) scale(1)`;
    }

    overlay.style.display = "block";
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.4 });

    const video = document.getElementById("ar-video") as HTMLVideoElement;
    try {
        // ── Native Permission Request ──
        // Only request the camera permission initially to avoid triggering
        // strict Photo Library / Storage permission crashes.
        if (Capacitor.isNativePlatform()) {
            const permission = await Camera.requestPermissions({ permissions: ['camera'] });
            if (permission.camera !== 'granted' && permission.camera !== 'limited') {
                throw new Error('Native camera access denied');
            }
        }

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
        } catch (constraintErr) {
            console.warn("Strict environment camera denied, falling back:", constraintErr);
            stream = await navigator.mediaDevices.getUserMedia({
                video: true
            });
        }

        video.srcObject = stream;

        // Add event listeners
        document.getElementById("ar-close")?.addEventListener("click", closeArViewer);
        document.getElementById("ar-capture")?.addEventListener("click", capturePhoto);
        setupTouchGestures();

    } catch (error: any) {
        console.error("Camera access denied or unavailable", error);

        let details = `Unknown Error`;
        if (error instanceof Error) {
            details = `${error.name}: ${error.message}`;
        } else if (typeof error === 'string') {
            details = error;
        } else if (error && error.message) {
            details = error.message;
        }

        const mdExists = typeof navigator !== 'undefined' && !!navigator.mediaDevices;
        alert(`Camera Error: ${details}\n\nMediaDevices API Configured: ${mdExists}\nOrigin: ${window.location.origin}`);

        closeArViewer();
    }
}

function closeArViewer() {
    const overlay = document.getElementById("ar-overlay");
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    if (overlay) {
        gsap.to(overlay, {
            opacity: 0, duration: 0.3, onComplete: () => {
                overlay.style.display = "none";
            }
        });
    }
}

// Multi-touch logic for pinch & drag
function setupTouchGestures() {
    const container = document.getElementById("ar-fan-container");
    const img = document.getElementById("ar-fan-image");
    if (!container || !img) return;

    let initialDistance = 0;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    function getDistance(touches: TouchList) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    container.addEventListener("touchstart", (e) => {
        e.preventDefault(); // Prevent default mobile scroll
        if (e.touches.length === 2) {
            initialDistance = getDistance(e.touches);
            baseScale = currentScale;
        } else if (e.touches.length === 1) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            initialX = currentX;
            initialY = currentY;
        }
    }, { passive: false });

    container.addEventListener("touchmove", (e) => {
        e.preventDefault();
        if (e.touches.length === 2) {
            // Pinch to zoom
            const distance = getDistance(e.touches);
            const scaleChange = distance / initialDistance;
            currentScale = Math.min(Math.max(baseScale * scaleChange, 0.3), 3); // clamp scale
        } else if (e.touches.length === 1) {
            // Drag to pan
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            currentX = initialX + dx;
            currentY = initialY + dy;
        }
        img.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale})`;
    }, { passive: false });
}

async function capturePhoto() {
    const video = document.getElementById("ar-video") as HTMLVideoElement;
    const img = document.getElementById("ar-fan-image") as HTMLImageElement;
    if (!video || !img || !video.videoWidth) return; // camera not ready yet

    // Visual Shutter GSAP Effect
    const flash = document.getElementById("ar-flash");
    if (flash) {
        gsap.fromTo(flash, { opacity: 1 }, { opacity: 0, duration: 0.6, ease: "power2.out" });
    }

    // Use a canvas to fuse the video frame and the fan image
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate object-fit: cover metrics for video -> screen
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const screenRatio = screenW / screenH;
    const videoRatio = video.videoWidth / video.videoHeight;

    let offsetW = 0;
    let offsetH = 0;

    // We need to map the screen coordinates of the fan Image to the Canvas coordinates
    // based on the way the video is cropped using object-fit: cover
    let scaleRatio = 1;
    if (screenRatio > videoRatio) {
        scaleRatio = canvas.width / screenW;
        offsetH = (canvas.height - (screenH * scaleRatio)) / 2;
    } else {
        scaleRatio = canvas.height / screenH;
        offsetW = (canvas.width - (screenW * scaleRatio)) / 2;
    }

    // 1. Draw Camera Feed
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 2. Map fan image coordinates
    // The img is inside ar-fan-container which is 100vw/100vh absolute. 
    const imgRect = img.getBoundingClientRect();
    const scaledImgW = imgRect.width * scaleRatio;
    const scaledImgH = imgRect.height * scaleRatio;

    const drawImgX = (imgRect.left * scaleRatio) + offsetW;
    const drawImgY = (imgRect.top * scaleRatio) + offsetH;

    // 3. Draw Fan Image
    // Using native pixel drawing
    ctx.drawImage(img, drawImgX, drawImgY, scaledImgW, scaledImgH);

    // 4. Trigger Download
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `breezalit_room_view_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show a cute GSAP toast
    showToast("Photo saved to gallery 📸");
}

function showToast(msg: string) {
    let toast = document.getElementById("ar-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "ar-toast";
        toast.className = "ar-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    gsap.fromTo(toast,
        { opacity: 0, y: 30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(2)" }
    );
    setTimeout(() => {
        gsap.to(toast, { opacity: 0, y: -20, duration: 0.3 });
    }, 2500);
}
