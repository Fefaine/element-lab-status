import {
    MAX_STATUS_TEXT_BYTES,
    MAX_STATUS_TEXT_LENGTH,
    MSC4426_CALL_KEY,
    MSC4426_STATUS_KEY,
    StatusDuration,
    UserStatus,
    UserStatusWithDuration,
} from "../types/status";
import { IMatrixClient } from "../types/matrixClient";

// Static Intl.Segmenter for grabbing the first grapheme of a user status emoji.
// Matches Element's implementation for single-grapheme enforcement.
const intlSegmenter = new Intl.Segmenter();

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Checks if a given text is within the MSC4426 maximum allowed length (256 bytes UTF-8).
 * Matches Element's `userStatusTextWithinMaxLength`.
 */
export function userStatusTextWithinMaxLength(text: string): boolean {
    const textEncoder = new TextEncoder();
    return textEncoder.encode(text).length <= MAX_STATUS_TEXT_BYTES;
}

/**
 * Extracts the first grapheme from a string using Intl.Segmenter.
 * Ensures emoji is exactly one grapheme cluster (matches Element's validation).
 */
export function extractFirstGrapheme(str: string): string | undefined {
    const segments = [...intlSegmenter.segment(str)];
    return segments[0]?.segment;
}

/**
 * Validates a raw object from the server profile into a UserStatus.
 * Mirrors Element's `validateUserStatus` from utils/userStatus.ts.
 */
export function validateUserStatus(rawUserStatus: unknown): UserStatus | undefined {
    if (typeof rawUserStatus !== "object" || rawUserStatus === null) {
        return undefined;
    }

    const obj = rawUserStatus as Record<string, unknown>;

    if (typeof obj.emoji !== "string" || !obj.emoji) {
        return undefined;
    }
    if (typeof obj.text !== "string" || !obj.text) {
        return undefined;
    }

    // Enforce single grapheme for emoji
    const emoji = extractFirstGrapheme(obj.emoji);
    if (!emoji) return undefined;

    // Truncate text if it exceeds max bytes
    const text = userStatusTextWithinMaxLength(obj.text)
        ? obj.text
        : `${obj.text.slice(0, MAX_STATUS_TEXT_BYTES)}…`;

    return { emoji, text };
}

/**
 * Validates a raw m.call status from the server.
 * Returns a UserStatus representing "On a call" if the user is currently in a call.
 * Mirrors Element's `validateMCallStatus`.
 */
export function validateMCallStatus(rawCallStatus: unknown): UserStatus | undefined {
    if (!rawCallStatus || typeof rawCallStatus !== "object") return undefined;

    const obj = rawCallStatus as Record<string, unknown>;
    if (typeof obj.call_joined_ts !== "number") return undefined;
    if (obj.call_joined_ts > 0) {
        return { emoji: "📞", text: "On a call" };
    }
    return undefined;
}

/**
 * Takes both MSC4426 user status fields and returns a unified UserStatus.
 * Custom status takes precedence over call status.
 * Mirrors Element's `userStatusFromProfile`.
 */
export function userStatusFromProfile(
    userStatus: unknown,
    callStatus: unknown
): UserStatus | undefined {
    const validatedUserStatus = validateUserStatus(userStatus);
    if (validatedUserStatus) return validatedUserStatus;

    const validatedCallStatus = validateMCallStatus(callStatus);
    if (validatedCallStatus) return validatedCallStatus;

    return undefined;
}

// ─── Server Operations (MSC4426) ────────────────────────────────────────────

/**
 * Fetch the MSC4426 user status of a given user.
 * Checks both org.matrix.msc4426.status and org.matrix.msc4426.call.
 * Mirrors Element's `fetchUserStatus`.
 */
export async function fetchUserStatus(
    client: IMatrixClient,
    userId: string
): Promise<UserStatus | undefined> {
    if ((await client.doesServerSupportExtendedProfiles()) === false) {
        return undefined;
    }

    let rawUserStatus: unknown;
    let rawCallStatus: unknown;

    try {
        rawUserStatus = await client.getExtendedProfileProperty(userId, MSC4426_STATUS_KEY);
    } catch {
        // User may not have a status set (M_NOT_FOUND)
    }

    try {
        rawCallStatus = await client.getExtendedProfileProperty(userId, MSC4426_CALL_KEY);
    } catch {
        // User may not have call status
    }

    return userStatusFromProfile(rawUserStatus, rawCallStatus);
}

/**
 * Sets the MSC4426 user status on the server.
 * Mirrors Element's `setUserStatus`.
 */
export async function setUserStatusOnServer(
    client: IMatrixClient,
    userStatus: UserStatus
): Promise<void> {
    // Enforce single grapheme emoji
    const emoji = extractFirstGrapheme(userStatus.emoji);
    if (!emoji) throw new Error("Invalid emoji: must be a single grapheme");

    // Enforce text length
    if (!userStatusTextWithinMaxLength(userStatus.text)) {
        throw new Error("Status text exceeds maximum 256 UTF-8 bytes");
    }

    await client.setExtendedProfileProperty(MSC4426_STATUS_KEY, {
        emoji,
        text: userStatus.text,
    });
}

/**
 * Clears the MSC4426 user status on the server.
 * Mirrors Element's `clearUserStatus`.
 */
export async function clearUserStatusOnServer(client: IMatrixClient): Promise<void> {
    await client.setExtendedProfileProperty(MSC4426_STATUS_KEY, null);
}

/**
 * Sets or clears the user's call status.
 * Mirrors Element's `setUserOnCall`.
 */
export async function setUserOnCall(client: IMatrixClient, onCall: boolean): Promise<void> {
    await client.setExtendedProfileProperty(
        MSC4426_CALL_KEY,
        onCall ? { call_joined_ts: Date.now() } : null
    );
}

// ─── Duration Helpers (our enhancement, client-side only) ───────────────────

/**
 * Checks whether a status with duration is currently active.
 */
export function isStatusActive(status: UserStatusWithDuration): boolean {
    const now = new Date();

    switch (status.duration.type) {
        case "always":
            return true;
        case "until":
            return now < status.duration.endTime;
        case "range":
            return now >= status.duration.startTime && now < status.duration.endTime;
    }
}

/**
 * Validates that a Date object is actually a valid date.
 */
function isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Sanitizes a status text string: trims, enforces max length,
 * and strips control characters that could be used for spoofing.
 */
export function sanitizeText(text: string): string {
    const cleaned = text.replace(
        /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200F\u2028-\u202E\uFEFF]/g,
        ""
    );
    return cleaned.trim().slice(0, MAX_STATUS_TEXT_LENGTH);
}

/**
 * Validates a parsed object has the shape of a UserStatusWithDuration.
 * Used for validating localStorage data.
 */
export function isValidUserStatusWithDuration(obj: unknown): obj is UserStatusWithDuration {
    if (!obj || typeof obj !== "object") return false;

    const candidate = obj as Record<string, unknown>;

    if (typeof candidate.emoji !== "string" || candidate.emoji.length === 0 || candidate.emoji.length > 10) {
        return false;
    }
    if (typeof candidate.text !== "string" || candidate.text.length > MAX_STATUS_TEXT_LENGTH) {
        return false;
    }
    if (!candidate.duration || typeof candidate.duration !== "object") return false;
    if (!candidate.setAt || !(candidate.setAt instanceof Date) || !isValidDate(candidate.setAt)) {
        return false;
    }

    const dur = candidate.duration as Record<string, unknown>;
    if (dur.type === "always") return true;
    if (dur.type === "until") {
        return dur.endTime instanceof Date && isValidDate(dur.endTime);
    }
    if (dur.type === "range") {
        return (
            dur.startTime instanceof Date &&
            isValidDate(dur.startTime) &&
            dur.endTime instanceof Date &&
            isValidDate(dur.endTime)
        );
    }
    return false;
}

// ─── Duration Formatting ────────────────────────────────────────────────────

type TranslateFn = (key: string, params?: Record<string, string>) => string;

/**
 * Formats the duration into a human-readable string for display.
 */
export function formatDuration(duration: StatusDuration, t?: TranslateFn): string {
    const translate = t ?? defaultTranslate;

    switch (duration.type) {
        case "always":
            return translate("duration.display.always");
        case "until":
            return translate("duration.display.until", {
                time: formatDateTime(duration.endTime, translate),
            });
        case "range":
            return translate("duration.display.range", {
                start: formatDateTime(duration.startTime, translate),
                end: formatDateTime(duration.endTime, translate),
            });
    }
}

function defaultTranslate(key: string, params?: Record<string, string>): string {
    const defaults: Record<string, string> = {
        "duration.display.always": "Until you clear it",
        "duration.display.until": "Until {{time}}",
        "duration.display.range": "{{start}} – {{end}}",
        "duration.display.today": "today at {{time}}",
    };

    let value = defaults[key] ?? key;
    if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
            value = value.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"), paramValue);
        }
    }
    return value;
}

function formatDateTime(date: Date, translate: TranslateFn): string {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });

    if (isToday) {
        return translate("duration.display.today", { time: timeStr });
    }

    const dateStr = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });

    return `${dateStr} ${timeStr}`;
}
