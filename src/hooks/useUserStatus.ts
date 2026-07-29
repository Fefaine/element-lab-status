import { useCallback, useEffect, useState } from "react";
import { MAX_STATUS_TEXT_LENGTH, UserStatus } from "../types/status";
import { isStatusActive, isValidUserStatus } from "../utils/statusUtils";

const STORAGE_KEY = "element_user_status";
/** Reject localStorage values larger than this to prevent memory abuse */
const MAX_STORAGE_SIZE = 2048;

/**
 * Hook for managing user status state.
 * Persists to localStorage and checks expiry periodically.
 *
 * In a real Element integration, this would use the Matrix SDK
 * to set/get the status_msg field of the m.presence event.
 */
export function useUserStatus() {
    const [status, setStatusState] = useState<UserStatus | null>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored || stored.length > MAX_STORAGE_SIZE) {
            if (stored) localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        try {
            const parsed = JSON.parse(stored, (key, value) => {
                // Revive date strings
                if (key === "endTime" || key === "startTime" || key === "setAt") {
                    return new Date(value);
                }
                return value;
            });

            // Validate the shape matches UserStatus before trusting it
            if (!isValidUserStatus(parsed)) {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }

            // Check if still active
            if (isStatusActive(parsed)) {
                return parsed;
            }
            // Expired, remove it
            localStorage.removeItem(STORAGE_KEY);
            return null;
        } catch {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    });

    // Periodically check if status has expired
    useEffect(() => {
        if (!status || status.duration.type === "always") return;

        const interval = setInterval(() => {
            if (status && !isStatusActive(status)) {
                setStatusState(null);
                localStorage.removeItem(STORAGE_KEY);
            }
        }, 30_000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [status]);

    const setStatus = useCallback((newStatus: UserStatus) => {
        // Enforce text length limit before persisting
        const sanitized: UserStatus = {
            ...newStatus,
            text: newStatus.text.trim().slice(0, MAX_STATUS_TEXT_LENGTH),
        };
        setStatusState(sanitized);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));

        // In a real integration, this would call:
        // matrixClient.setPresence({ presence: "online", status_msg: serializeStatus(sanitized) });
    }, []);

    const clearStatus = useCallback(() => {
        setStatusState(null);
        localStorage.removeItem(STORAGE_KEY);

        // In a real integration:
        // matrixClient.setPresence({ presence: "online", status_msg: "" });
    }, []);

    return { status, setStatus, clearStatus };
}
