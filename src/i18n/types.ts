/**
 * Supported locales. Add new locale codes here when adding translations.
 */
export type Locale = "en" | "de" | "fr" | "es" | "ja";

/**
 * All translatable string keys used in the application.
 * Flat key structure with dot-delimited namespaces for clarity.
 */
export interface TranslationKeys {
    // Status Picker
    "statusPicker.title": string;
    "statusPicker.close": string;
    "statusPicker.preview.placeholder": string;
    "statusPicker.preview.noMessage": string;
    "statusPicker.textField.label": string;
    "statusPicker.textField.placeholder": string;
    "statusPicker.save": string;
    "statusPicker.saveDisabled": string;
    "statusPicker.clear": string;
    "statusPicker.privacyNotice": string;

    // Emoji Grid
    "emojiGrid.label": string;
    "emoji.available": string;
    "emoji.busy": string;
    "emoji.doNotDisturb": string;
    "emoji.beRightBack": string;
    "emoji.outOfOffice": string;
    "emoji.inMeeting": string;
    "emoji.outToLunch": string;
    "emoji.workingFromHome": string;
    "emoji.commuting": string;
    "emoji.offSick": string;
    "emoji.away": string;
    "emoji.focusing": string;

    // Duration Picker
    "duration.legend": string;
    "duration.typeLabel": string;
    "duration.always": string;
    "duration.until": string;
    "duration.range": string;
    "duration.clearAt": string;
    "duration.from": string;
    "duration.to": string;

    // Duration Display
    "duration.display.always": string;
    "duration.display.until": string;
    "duration.display.range": string;
    "duration.display.today": string;

    // Status Display
    "statusDisplay.label": string;
    "statusDisplay.noMessage": string;

    // App / Profile Area
    "app.title": string;
    "app.subtitle": string;
    "profile.setStatus": string;
    "profile.ariaLabel": string;
    "memberList.title": string;
}
