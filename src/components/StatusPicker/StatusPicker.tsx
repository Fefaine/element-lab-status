import { useCallback, useRef, useState } from "react";
import {
    MAX_STATUS_TEXT_LENGTH,
    STATUS_EMOJI_PRESETS,
    StatusDuration,
    StatusEmoji,
    UserStatusWithDuration,
} from "../../types/status";
import { useTranslation } from "../../i18n";
import { EmojiGrid } from "./EmojiGrid";
import { DurationPicker } from "./DurationPicker";
import "./StatusPicker.css";

interface StatusPickerProps {
    /** Current status, if any */
    currentStatus: UserStatusWithDuration | null;
    /** Called when user saves a new status */
    onSave: (status: UserStatusWithDuration) => void;
    /** Called when user clears their status */
    onClear: () => void;
    /** Called when picker is dismissed */
    onClose: () => void;
}

/**
 * Flyout panel for setting user status.
 * Includes emoji selection, custom text input, and duration picker.
 * Sets status via MSC4426 extended profiles with client-side duration.
 */
export function StatusPicker({ currentStatus, onSave, onClear, onClose }: StatusPickerProps) {
    const { t } = useTranslation();
    const [selectedEmoji, setSelectedEmoji] = useState(currentStatus?.emoji ?? "");
    const [statusText, setStatusText] = useState(currentStatus?.text ?? "");
    const [duration, setDuration] = useState<StatusDuration>(
        currentStatus?.duration ?? { type: "always" }
    );
    const textInputRef = useRef<HTMLInputElement>(null);

    const handleEmojiSelect = useCallback((preset: StatusEmoji) => {
        setSelectedEmoji(preset.emoji);
        setStatusText(preset.defaultText);
        // Focus the text input so user can customize
        textInputRef.current?.focus();
        textInputRef.current?.select();
    }, []);

    const handleSave = useCallback(() => {
        if (!selectedEmoji) return;

        const newStatus: UserStatusWithDuration = {
            emoji: selectedEmoji,
            text: statusText.trim(),
            duration,
            setAt: new Date(),
        };
        onSave(newStatus);
        onClose();
    }, [selectedEmoji, statusText, duration, onSave, onClose]);

    const handleClear = useCallback(() => {
        onClear();
        onClose();
    }, [onClear, onClose]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "Enter" && selectedEmoji) {
                handleSave();
            }
        },
        [onClose, handleSave, selectedEmoji]
    );

    const charsRemaining = MAX_STATUS_TEXT_LENGTH - statusText.length;

    return (
        <div
            className="status-picker"
            role="dialog"
            aria-label={t("statusPicker.title")}
            aria-modal="true"
            onKeyDown={handleKeyDown}
        >
            <div className="status-picker__header">
                <h2 className="status-picker__title">{t("statusPicker.title")}</h2>
                <button
                    className="status-picker__close-btn"
                    onClick={onClose}
                    aria-label={t("statusPicker.close")}
                    type="button"
                >
                    ✕
                </button>
            </div>

            <div className="status-picker__preview" aria-live="polite">
                {selectedEmoji ? (
                    <span className="status-picker__preview-content">
                        <span className="status-picker__preview-emoji" aria-hidden="true">
                            {selectedEmoji}
                        </span>
                        <span className="status-picker__preview-text">
                            {statusText || t("statusPicker.preview.noMessage")}
                        </span>
                    </span>
                ) : (
                    <span className="status-picker__preview-placeholder">
                        {t("statusPicker.preview.placeholder")}
                    </span>
                )}
            </div>

            <EmojiGrid
                presets={STATUS_EMOJI_PRESETS}
                selectedEmoji={selectedEmoji}
                onSelect={handleEmojiSelect}
            />

            <div className="status-picker__text-field">
                <label htmlFor="status-text-input" className="status-picker__label">
                    {t("statusPicker.textField.label")}
                </label>
                <div className="status-picker__input-wrapper">
                    <input
                        ref={textInputRef}
                        id="status-text-input"
                        type="text"
                        className="status-picker__input"
                        value={statusText}
                        onChange={(e) => setStatusText(e.target.value.slice(0, MAX_STATUS_TEXT_LENGTH))}
                        placeholder={t("statusPicker.textField.placeholder")}
                        maxLength={MAX_STATUS_TEXT_LENGTH}
                        aria-describedby="status-char-count"
                    />
                    <span
                        id="status-char-count"
                        className={`status-picker__char-count ${charsRemaining < 20 ? "status-picker__char-count--warning" : ""}`}
                        aria-live="polite"
                    >
                        {charsRemaining}
                    </span>
                </div>
            </div>

            <DurationPicker duration={duration} onChange={setDuration} />

            <div className="status-picker__actions">
                {currentStatus && (
                    <button
                        className="status-picker__btn status-picker__btn--clear"
                        onClick={handleClear}
                        type="button"
                    >
                        {t("statusPicker.clear")}
                    </button>
                )}
                <button
                    className="status-picker__btn status-picker__btn--save"
                    onClick={handleSave}
                    disabled={!selectedEmoji}
                    type="button"
                    aria-label={selectedEmoji ? t("statusPicker.save") : t("statusPicker.saveDisabled")}
                >
                    {t("statusPicker.save")}
                </button>
            </div>
        </div>
    );
}
