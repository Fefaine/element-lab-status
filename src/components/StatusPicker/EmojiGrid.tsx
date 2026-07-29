import { useCallback, useRef, useState } from "react";
import { StatusEmoji } from "../../types/status";
import { useTranslation } from "../../i18n";

interface EmojiGridProps {
    presets: StatusEmoji[];
    selectedEmoji: string;
    onSelect: (preset: StatusEmoji) => void;
}

/**
 * Accessible grid of emoji presets for status selection.
 * Supports keyboard navigation (arrow keys, Enter/Space to select).
 */
export function EmojiGrid({ presets, selectedEmoji, onSelect }: EmojiGridProps) {
    const { t } = useTranslation();
    const [focusedIndex, setFocusedIndex] = useState(0);
    const gridRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            const columns = 6; // Grid columns
            let newIndex = focusedIndex;

            switch (e.key) {
                case "ArrowRight":
                    newIndex = Math.min(focusedIndex + 1, presets.length - 1);
                    e.preventDefault();
                    break;
                case "ArrowLeft":
                    newIndex = Math.max(focusedIndex - 1, 0);
                    e.preventDefault();
                    break;
                case "ArrowDown":
                    newIndex = Math.min(focusedIndex + columns, presets.length - 1);
                    e.preventDefault();
                    break;
                case "ArrowUp":
                    newIndex = Math.max(focusedIndex - columns, 0);
                    e.preventDefault();
                    break;
                case "Enter":
                case " ":
                    onSelect(presets[focusedIndex]);
                    e.preventDefault();
                    return;
                default:
                    return;
            }

            setFocusedIndex(newIndex);
            // Focus the new button
            const buttons = gridRef.current?.querySelectorAll<HTMLButtonElement>(
                '[role="gridcell"] button'
            );
            buttons?.[newIndex]?.focus();
        },
        [focusedIndex, presets, onSelect]
    );

    return (
        <div className="emoji-grid" role="grid" aria-label={t("emojiGrid.label")}>
            <div
                ref={gridRef}
                className="emoji-grid__container"
                role="row"
                onKeyDown={handleKeyDown}
            >
                {presets.map((preset, index) => {
                    // Use the i18n key if available, fall back to static label
                    const localizedLabel = t(preset.labelKey as never) || preset.label;
                    return (
                        <div key={preset.emoji} role="gridcell">
                            <button
                                className={`emoji-grid__item ${
                                    selectedEmoji === preset.emoji ? "emoji-grid__item--selected" : ""
                                }`}
                                onClick={() => {
                                    setFocusedIndex(index);
                                    onSelect({ ...preset, defaultText: localizedLabel });
                                }}
                                tabIndex={index === focusedIndex ? 0 : -1}
                                aria-label={`${localizedLabel} ${preset.emoji}`}
                                aria-pressed={selectedEmoji === preset.emoji}
                                title={localizedLabel}
                                type="button"
                            >
                                <span aria-hidden="true">{preset.emoji}</span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
