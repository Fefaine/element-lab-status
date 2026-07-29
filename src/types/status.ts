/**
 * MSC4426 User Status type.
 * Matches the shape used by Element's @element-hq/web-shared-components UserStatus.
 * The protocol stores { emoji: string, text: string } on the extended profile
 * at the key "org.matrix.msc4426.status".
 */
export interface UserStatus {
    /** A single emoji grapheme */
    emoji: string;
    /** Status text, max 256 bytes UTF-8 */
    text: string;
}

/**
 * Extended status with client-side duration metadata.
 * This is our enhancement over Element's base implementation — we add
 * duration/expiry so statuses can auto-clear. The duration is stored
 * locally (not sent to the server) since MSC4426 doesn't define it.
 */
export interface UserStatusWithDuration extends UserStatus {
    /** When the status should be displayed (client-side only) */
    duration: StatusDuration;
    /** Timestamp when the status was set (client-side only) */
    setAt: Date;
}

/**
 * Represents the duration mode for a user status (client-side enhancement).
 */
export type StatusDuration =
    | { type: "always" }
    | { type: "until"; endTime: Date }
    | { type: "range"; startTime: Date; endTime: Date };

/**
 * A preset emoji option for quick status selection.
 */
export interface StatusEmoji {
    /** The emoji character (single grapheme) */
    emoji: string;
    /** i18n key for the accessible label */
    labelKey: string;
    /** Accessible label fallback (English) */
    label: string;
    /** Default status text suggestion */
    defaultText: string;
}

/**
 * MSC4426 defines the maximum length of a status to be 256 bytes of UTF-8.
 * Matches Element's implementation.
 */
export const MAX_STATUS_TEXT_BYTES = 256;

/**
 * Character-based limit for the UI input field.
 * This is a practical approximation — the real constraint is 256 UTF-8 bytes.
 */
export const MAX_STATUS_TEXT_LENGTH = 256;

/**
 * The MSC4426 extended profile key for user status.
 */
export const MSC4426_STATUS_KEY = "org.matrix.msc4426.status";

/**
 * The MSC4426 extended profile key for call status.
 */
export const MSC4426_CALL_KEY = "org.matrix.msc4426.call";

/**
 * Preset emoji options similar to M365 Teams.
 * Labels use i18n keys for localization.
 */
export const STATUS_EMOJI_PRESETS: StatusEmoji[] = [
    { emoji: "✅", labelKey: "emoji.available", label: "Available", defaultText: "Available" },
    { emoji: "🔴", labelKey: "emoji.busy", label: "Busy", defaultText: "Busy" },
    { emoji: "⛔", labelKey: "emoji.doNotDisturb", label: "Do not disturb", defaultText: "Do not disturb" },
    { emoji: "🕐", labelKey: "emoji.beRightBack", label: "Be right back", defaultText: "Be right back" },
    { emoji: "🏖️", labelKey: "emoji.outOfOffice", label: "Out of office", defaultText: "Out of office" },
    { emoji: "📅", labelKey: "emoji.inMeeting", label: "In a meeting", defaultText: "In a meeting" },
    { emoji: "🍽️", labelKey: "emoji.outToLunch", label: "Out to lunch", defaultText: "Out to lunch" },
    { emoji: "🏠", labelKey: "emoji.workingFromHome", label: "Working from home", defaultText: "Working from home" },
    { emoji: "🚗", labelKey: "emoji.commuting", label: "Commuting", defaultText: "Commuting" },
    { emoji: "🤒", labelKey: "emoji.offSick", label: "Off sick", defaultText: "Off sick" },
    { emoji: "📵", labelKey: "emoji.away", label: "Away", defaultText: "Away" },
    { emoji: "💻", labelKey: "emoji.focusing", label: "Focusing", defaultText: "Focusing" },
];
