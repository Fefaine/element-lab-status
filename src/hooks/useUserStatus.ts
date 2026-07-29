import { useCallback, useEffect, useState } from "react";
import {
    MAX_STATUS_TEXT_LENGTH,
    MSC4426_CALL_KEY,
    MSC4426_STATUS_KEY,
    StatusDuration,
    UserStatus,
    UserStatusWithDuration,
} from "../types/status";
import { IMatrixClient } from "../types/matrixClient";
import {
    clearUserStatusOnServer,
    extractFirstGrapheme,
    fetchUserStatus,
    isStatusActive,
    isValidUserStatusWithDuration,
    sanitizeText,
    setUserStatusOnServer,
    userStatusFromProfile,
} from "../utils/statusUtils";

const DURATION_STORAGE_KEY = "element_status_duration";
const MAX_STORAGE_SIZE = 2048;

/**
 * Hook to manage the current user's status via MSC4426 extended profiles.
 *
 * This hooks into Element's architecture:
 * - Uses the Matrix client to read/write `org.matrix.msc4426.status`
 * - Listens for `ClientEvent.UserProfileUpdate` to react to real-time changes
 * - Adds client-side duration/expiry as an enhancement (stored locally)
 *
 * @param client The Matrix client instance (real or mock)
 */
export function useUserStatus(client: IMatrixClient) {
    const [status, setStatusState] = useState<UserStatusWithDuration | null>(null);
    const [loading, setLoading] = useState(true);

    const userId = client.getUserId();

    // Fetch initial status from server
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const serverStatus = await fetchUserStatus(client, userId);

                if (serverStatus) {
                    // Restore local duration metadata if available
                    const duration = loadDuration();
                    const statusWithDuration: UserStatusWithDuration = {
                        ...serverStatus,
                        duration: duration ?? { type: "always" },
                        setAt: new Date(),
                    };

                    // Check if duration expired while we were away
                    if (isStatusActive(statusWithDuration)) {
                        setStatusState(statusWithDuration);
                    } else {
                        // Expired — clear on server too
                        await clearUserStatusOnServer(client);
                        clearDurationStorage();
                        setStatusState(null);
                    }
                } else {
                    clearDurationStorage();
                    setStatusState(null);
                }
            } catch {
                setStatusState(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [client, userId]);

    // Listen for real-time profile updates (from other devices or server)
    useEffect(() => {
        const unsubscribe = client.onUserProfileUpdate((updatedUserId, profile) => {
            if (updatedUserId !== userId) return;

            const newStatus = userStatusFromProfile(
                profile[MSC4426_STATUS_KEY],
                profile[MSC4426_CALL_KEY]
            );

            if (newStatus) {
                const duration = loadDuration();
                setStatusState({
                    ...newStatus,
                    duration: duration ?? { type: "always" },
                    setAt: new Date(),
                });
            } else {
                setStatusState(null);
                clearDurationStorage();
            }
        });

        return unsubscribe;
    }, [client, userId]);

    // Periodically check if duration-based status has expired
    useEffect(() => {
        if (!status || status.duration.type === "always") return;

        const interval = setInterval(async () => {
            if (status && !isStatusActive(status)) {
                try {
                    await clearUserStatusOnServer(client);
                } catch {
                    // Best effort
                }
                clearDurationStorage();
                setStatusState(null);
            }
        }, 30_000);

        return () => clearInterval(interval);
    }, [status, client]);

    const setStatus = useCallback(
        async (newStatus: UserStatusWithDuration) => {
            // Validate and sanitize
            const emoji = extractFirstGrapheme(newStatus.emoji);
            if (!emoji) return;

            const text = sanitizeText(newStatus.text).slice(0, MAX_STATUS_TEXT_LENGTH);

            const serverStatus: UserStatus = { emoji, text };

            // Write to server (MSC4426)
            await setUserStatusOnServer(client, serverStatus);

            // Store duration locally (our enhancement)
            saveDuration(newStatus.duration);

            const fullStatus: UserStatusWithDuration = {
                ...serverStatus,
                duration: newStatus.duration,
                setAt: new Date(),
            };
            setStatusState(fullStatus);
        },
        [client]
    );

    const clearStatus = useCallback(async () => {
        await clearUserStatusOnServer(client);
        clearDurationStorage();
        setStatusState(null);
    }, [client]);

    return { status, setStatus, clearStatus, loading };
}

// ─── Duration localStorage helpers ──────────────────────────────────────────

function saveDuration(duration: StatusDuration): void {
    localStorage.setItem(DURATION_STORAGE_KEY, JSON.stringify(duration));
}

function loadDuration(): StatusDuration | null {
    const raw = localStorage.getItem(DURATION_STORAGE_KEY);
    if (!raw || raw.length > MAX_STORAGE_SIZE) return null;

    try {
        const parsed = JSON.parse(raw, (key, value) => {
            if (key === "endTime" || key === "startTime") {
                return new Date(value);
            }
            return value;
        });

        if (parsed && typeof parsed === "object" && "type" in parsed) {
            return parsed as StatusDuration;
        }
    } catch {
        // Invalid data
    }
    return null;
}

function clearDurationStorage(): void {
    localStorage.removeItem(DURATION_STORAGE_KEY);
}

// ─── Hook for viewing another user's status (read-only) ─────────────────────

/**
 * Hook to get another user's MSC4426 status (read-only).
 * Mirrors Element's useUserStatus(userId) pattern.
 *
 * @param client The Matrix client
 * @param userId The user ID to fetch status for
 */
export function useOtherUserStatus(
    client: IMatrixClient,
    userId: string | undefined
): UserStatus | undefined {
    const [userStatus, setUserStatus] = useState<UserStatus | undefined>();

    useEffect(() => {
        if (!userId) {
            setUserStatus(undefined);
            return;
        }

        (async () => {
            try {
                const result = await fetchUserStatus(client, userId);
                setUserStatus(result);
            } catch {
                setUserStatus(undefined);
            }
        })();
    }, [client, userId]);

    // Listen for real-time updates
    useEffect(() => {
        const unsubscribe = client.onUserProfileUpdate((updatedUserId, profile) => {
            if (updatedUserId !== userId) return;

            const newStatus = userStatusFromProfile(
                profile[MSC4426_STATUS_KEY],
                profile[MSC4426_CALL_KEY]
            );
            setUserStatus(newStatus);
        });

        return unsubscribe;
    }, [client, userId]);

    return userStatus;
}
