import { MAX_STATUS_TEXT_LENGTH, StatusDuration, UserStatus } from "../types/status";

/**
 * Checks whether a status is currently active based on its duration settings.
 */
export function isStatusActive(status: UserStatus): boolean {
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
function sanitizeText(text: string): string {
    // Remove control characters (except common whitespace)
    // This prevents bidi override attacks and invisible character injection
    const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200F\u2028-\u202E\uFEFF]/g, "");
    return cleaned.trim().slice(0, MAX_STATUS_TEXT_LENGTH);
}

/**
 * Validates a parsed object has the shape of a UserStatus.
 * Guards against tampered localStorage or malicious status_msg payloads.
 */
export function isValidUserStatus(obj: unknown): obj is UserStatus {
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

/**
 * Translation function signature used by formatDuration.
 * Matches the `t` function from useTranslation().
 */
type TranslateFn = (key: string, params?: Record<string, string>) => string;

/**
 * Formats the duration into a human-readable string for display.
 * Accepts an optional translation function for i18n support.
 * Falls back to English if no translation function is provided.
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

/**
 * Fallback translate function when no i18n context is available.
 */
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

/**
 * Formats a date into a short, readable string.
 * Uses locale-aware date/time formatting via Intl APIs.
 */
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

/**
 * Serializes a UserStatus to the m.presence status_msg format.
 * Uses JSON encoding to avoid delimiter collision issues with user-provided text.
 * The JSON is compact and safe for the status_msg field.
 */
export function serializeStatus(status: UserStatus): string {
    const payload = {
        e: status.emoji,
        t: sanitizeText(status.text),
        d: serializeDuration(status.duration),
    };
    return JSON.stringify(payload);
}

/**
 * Deserializes a status_msg string back into a UserStatus object.
 * Validates all fields from the untrusted input.
 */
export function deserializeStatus(statusMsg: string): UserStatus | null {
    if (!statusMsg || statusMsg.length > 1024) return null; // Reject oversized payloads

    let payload: unknown;
    try {
        payload = JSON.parse(statusMsg);
    } catch {
        return null; // Malformed JSON
    }

    if (!payload || typeof payload !== "object") return null;

    const obj = payload as Record<string, unknown>;

    // Validate emoji field
    if (typeof obj.e !== "string" || obj.e.length === 0 || obj.e.length > 10) return null;

    // Validate text field
    if (typeof obj.t !== "string") return null;
    const text = sanitizeText(obj.t);

    // Validate duration
    const duration = deserializeDuration(obj.d);
    if (!duration) return null;

    return {
        emoji: obj.e,
        text,
        duration,
        setAt: new Date(),
    };
}

function serializeDuration(duration: StatusDuration): unknown {
    switch (duration.type) {
        case "always":
            return { type: "always" };
        case "until":
            return { type: "until", end: duration.endTime.toISOString() };
        case "range":
            return {
                type: "range",
                start: duration.startTime.toISOString(),
                end: duration.endTime.toISOString(),
            };
    }
}

function deserializeDuration(raw: unknown): StatusDuration | null {
    if (!raw || typeof raw !== "object") return null;

    const obj = raw as Record<string, unknown>;

    switch (obj.type) {
        case "always":
            return { type: "always" };
        case "until": {
            if (typeof obj.end !== "string") return null;
            const endTime = new Date(obj.end);
            if (!isValidDate(endTime)) return null;
            return { type: "until", endTime };
        }
        case "range": {
            if (typeof obj.start !== "string" || typeof obj.end !== "string") return null;
            const startTime = new Date(obj.start);
            const endTime = new Date(obj.end);
            if (!isValidDate(startTime) || !isValidDate(endTime)) return null;
            if (endTime <= startTime) return null; // End must be after start
            return { type: "range", startTime, endTime };
        }
        default:
            return null;
    }
}
