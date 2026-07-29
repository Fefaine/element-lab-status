/**
 * Represents the duration mode for a user status.
 */
export type StatusDuration =
    | { type: "always" }
    | { type: "until"; endTime: Date }
    | { type: "range"; startTime: Date; endTime: Date };

/**
 * A preset emoji option for quick status selection.
 */
export interface StatusEmoji {
    /** The emoji character */
    emoji: string;
    /** i18n key for the accessible label */
    labelKey: string;
    /** Accessible label fallback (English) */
    label: string;
    /** Default status text suggestion (uses label as default) */
    defaultText: string;
}

/**
 * The user's current status state.
 */
export interface UserStatus {
    /** Selected emoji icon */
    emoji: string;
    /** Custom status text (same max length as emoji count constraint) */
    text: string;
    /** When the status should be displayed */
    duration: StatusDuration;
    /** Timestamp when the status was set */
    setAt: Date;
}

/**
 * Maximum length for the custom status text.
 * Matches M365 Teams behavior.
 */
export const MAX_STATUS_TEXT_LENGTH = 280;

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
