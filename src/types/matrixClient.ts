import { UserStatus } from "./status";

/**
 * Abstraction of the Matrix client interface needed for user status.
 * In Element, this maps to the actual MatrixClient from matrix-js-sdk.
 * For our standalone demo, we provide a localStorage-backed mock.
 *
 * This interface matches the API surface used in Element's:
 * - client.doesServerSupportExtendedProfiles()
 * - client.getExtendedProfileProperty(userId, key)
 * - client.setExtendedProfileProperty(key, value)
 */
export interface IMatrixClient {
    /** Check if the homeserver supports MSC4426 extended profiles */
    doesServerSupportExtendedProfiles(): Promise<boolean>;

    /** Get an extended profile property for a user */
    getExtendedProfileProperty(userId: string, key: string): Promise<unknown>;

    /** Set an extended profile property for the current user */
    setExtendedProfileProperty(key: string, value: unknown): Promise<void>;

    /** The current user's ID */
    getUserId(): string | null;

    /**
     * Register a callback for user profile update events.
     * In the real SDK this is ClientEvent.UserProfileUpdate.
     */
    onUserProfileUpdate(
        callback: (userId: string, profile: Record<string, unknown>) => void
    ): () => void;
}

/**
 * Callback type for profile update events.
 */
export type ProfileUpdateCallback = (userId: string, profile: Record<string, unknown>) => void;

/**
 * Result from fetching a user's status.
 * Includes the call status flag from org.matrix.msc4426.call.
 */
export interface FetchedUserStatus {
    /** The user's custom status, if set */
    status: UserStatus | undefined;
    /** Whether the user is currently on a call */
    onCall: boolean;
}
