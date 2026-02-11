/**
 * Generates or retrieves a unique visitor ID stored in localStorage.
 * This is a basic fingerprinting method suitable for simple tracking.
 */
export function getOrCreateVisitorId(): string {
    if (typeof window === 'undefined') {
        return 'server-side-visitor';
    }

    const STORAGE_KEY = 'visitor_fingerprint_id';
    let visitorId = localStorage.getItem(STORAGE_KEY);

    if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, visitorId);
    }

    return visitorId;
}
