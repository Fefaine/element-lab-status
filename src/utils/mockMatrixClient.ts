import { IMatrixClient, ProfileUpdateCallback } from "../types/matrixClient";
import { MSC4426_CALL_KEY, MSC4426_STATUS_KEY } from "../types/status";

/**
 * A localStorage-backed mock of the Matrix client for standalone demo use.
 * In a real Element integration, this is replaced by the actual MatrixClient
 * from matrix-js-sdk, injected via MatrixClientContext.
 */
export class MockMatrixClient implements IMatrixClient {
    private listeners: ProfileUpdateCallback[] = [];
    private userId = "@jane:example.org";

    getUserId(): string {
        return this.userId;
    }

    async doesServerSupportExtendedProfiles(): Promise<boolean> {
        return true;
    }

    async getExtendedProfileProperty(userId: string, key: string): Promise<unknown> {
        const storageKey = `msc4426_${userId}_${key}`;
        const raw = localStorage.getItem(storageKey);
        if (!raw) throw new Error("M_NOT_FOUND");
        return JSON.parse(raw);
    }

    async setExtendedProfileProperty(key: string, value: unknown): Promise<void> {
        const storageKey = `msc4426_${this.userId}_${key}`;

        if (value === null) {
            localStorage.removeItem(storageKey);
        } else {
            localStorage.setItem(storageKey, JSON.stringify(value));
        }

        // Simulate the server broadcasting a profile update event
        const profile: Record<string, unknown> = {};
        const statusRaw = localStorage.getItem(`msc4426_${this.userId}_${MSC4426_STATUS_KEY}`);
        const callRaw = localStorage.getItem(`msc4426_${this.userId}_${MSC4426_CALL_KEY}`);

        if (statusRaw) profile[MSC4426_STATUS_KEY] = JSON.parse(statusRaw);
        if (callRaw) profile[MSC4426_CALL_KEY] = JSON.parse(callRaw);

        // Notify listeners
        for (const cb of this.listeners) {
            cb(this.userId, profile);
        }
    }

    onUserProfileUpdate(callback: ProfileUpdateCallback): () => void {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter((cb) => cb !== callback);
        };
    }
}
