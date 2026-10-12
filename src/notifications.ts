// Breezalit — Smart Local Push Notifications
import { LocalNotifications } from '@capacitor/local-notifications';

// Helper to determine if cart has items
function hasItemsInCart(): boolean {
    const cartJson = localStorage.getItem("breezalit_cart");
    if (!cartJson) return false;
    try {
        const arr = JSON.parse(cartJson);
        return Array.isArray(arr) && arr.length > 0;
    } catch {
        return false;
    }
}

export async function initNotifications() {
    try {
        // 1. Request Permission
        let permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== 'granted') {
            permStatus = await LocalNotifications.requestPermissions();
        }

        // If not granted, exit gracefully
        if (permStatus.display !== 'granted') {
            console.log('User denied local notifications');
            return;
        }

        // 2. Clear all pending notifications right right now (they opened the app!)
        // We don't want to spam users actively using the app.
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel(pending);
        }

        // 3. Reschedule fresh notifications relative to NOW
        const notificationsToSchedule = [];

        // --- A. Abandoned Cart Alert (2 hours from now) ---
        if (hasItemsInCart()) {
            notificationsToSchedule.push({
                title: "Did you forget something? 🥶",
                body: "Your ceiling fan is waiting in your cart. Complete your purchase before it sells out!",
                id: 101, // unique ID
                schedule: { at: new Date(Date.now() + 1000 * 60 * 60 * 2) } // 2 hours
            });
        }

        // --- B. The "Miss You" Alert (24 hours from now) ---
        notificationsToSchedule.push({
            title: "Hey stranger... 👀",
            body: "Your ceiling is looking a bit naked. Come check out our new arrivals!",
            id: 102,
            schedule: { at: new Date(Date.now() + 1000 * 60 * 60 * 24) } // 24 hours
        });

        // --- C. Random Flash Deals (Between 48 and 72 hours from now) ---
        // Make sure it hits around 6-8 PM their local time if possible
        const flashDate = new Date(Date.now() + 1000 * 60 * 60 * 48);
        flashDate.setHours(19, 0, 0, 0); // 7:00 PM in 2 days

        notificationsToSchedule.push({
            title: "🔥 Midnight Madness Starts NOW!",
            body: "Claim your special 20% OFF coupon before everything vanishes. Stock is limited!",
            id: 103,
            schedule: { at: flashDate }
        });

        // Schedule them all
        await LocalNotifications.schedule({
            notifications: notificationsToSchedule
        });

        console.log("Smart notifications successfully scheduled", notificationsToSchedule);
    } catch (error) {
        console.warn("Failed to initialize smart notifications", error);
    }
}
