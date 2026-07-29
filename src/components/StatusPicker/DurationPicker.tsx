import { useCallback } from "react";
import { StatusDuration } from "../../types/status";
import { useTranslation } from "../../i18n";

interface DurationPickerProps {
    duration: StatusDuration;
    onChange: (duration: StatusDuration) => void;
}

/**
 * Allows the user to choose how long their status will be displayed.
 * Options: Always, Until a specific time, or a From-To range.
 */
export function DurationPicker({ duration, onChange }: DurationPickerProps) {
    const { t } = useTranslation();

    const handleTypeChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            const type = e.target.value as StatusDuration["type"];
            switch (type) {
                case "always":
                    onChange({ type: "always" });
                    break;
                case "until": {
                    // Default to 1 hour from now
                    const endTime = new Date();
                    endTime.setHours(endTime.getHours() + 1);
                    onChange({ type: "until", endTime });
                    break;
                }
                case "range": {
                    const startTime = new Date();
                    const endTime = new Date();
                    endTime.setHours(endTime.getHours() + 4);
                    onChange({ type: "range", startTime, endTime });
                    break;
                }
            }
        },
        [onChange]
    );

    const handleEndTimeChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const endTime = new Date(e.target.value);
            if (duration.type === "until") {
                onChange({ type: "until", endTime });
            } else if (duration.type === "range") {
                onChange({ ...duration, endTime });
            }
        },
        [duration, onChange]
    );

    const handleStartTimeChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (duration.type === "range") {
                const startTime = new Date(e.target.value);
                onChange({ ...duration, startTime });
            }
        },
        [duration, onChange]
    );

    // Format date for datetime-local input
    const toLocalDateTimeString = (date: Date): string => {
        const offset = date.getTimezoneOffset();
        const local = new Date(date.getTime() - offset * 60 * 1000);
        return local.toISOString().slice(0, 16);
    };

    return (
        <fieldset className="duration-picker">
            <legend className="duration-picker__legend">{t("duration.legend")}</legend>

            <div className="duration-picker__type">
                <label htmlFor="duration-type" className="sr-only">
                    {t("duration.typeLabel")}
                </label>
                <select
                    id="duration-type"
                    className="duration-picker__select"
                    value={duration.type}
                    onChange={handleTypeChange}
                    aria-label={t("duration.typeLabel")}
                >
                    <option value="always">{t("duration.always")}</option>
                    <option value="until">{t("duration.until")}</option>
                    <option value="range">{t("duration.range")}</option>
                </select>
            </div>

            {duration.type === "until" && (
                <div className="duration-picker__time-field">
                    <label htmlFor="duration-end" className="duration-picker__label">
                        {t("duration.clearAt")}
                    </label>
                    <input
                        id="duration-end"
                        type="datetime-local"
                        className="duration-picker__datetime"
                        value={toLocalDateTimeString(duration.endTime)}
                        onChange={handleEndTimeChange}
                        min={toLocalDateTimeString(new Date())}
                    />
                </div>
            )}

            {duration.type === "range" && (
                <div className="duration-picker__range-fields">
                    <div className="duration-picker__time-field">
                        <label htmlFor="duration-start" className="duration-picker__label">
                            {t("duration.from")}
                        </label>
                        <input
                            id="duration-start"
                            type="datetime-local"
                            className="duration-picker__datetime"
                            value={toLocalDateTimeString(duration.startTime)}
                            onChange={handleStartTimeChange}
                        />
                    </div>
                    <div className="duration-picker__time-field">
                        <label htmlFor="duration-range-end" className="duration-picker__label">
                            {t("duration.to")}
                        </label>
                        <input
                            id="duration-range-end"
                            type="datetime-local"
                            className="duration-picker__datetime"
                            value={toLocalDateTimeString(duration.endTime)}
                            onChange={handleEndTimeChange}
                            min={
                                duration.type === "range"
                                    ? toLocalDateTimeString(duration.startTime)
                                    : undefined
                            }
                        />
                    </div>
                </div>
            )}
        </fieldset>
    );
}
