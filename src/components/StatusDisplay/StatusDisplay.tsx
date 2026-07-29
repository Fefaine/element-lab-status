import { useCallback, useRef, useState } from "react";
import { UserStatus } from "../../types/status";
import { formatDuration } from "../../utils/statusUtils";
import { useTranslation } from "../../i18n";
import "./StatusDisplay.css";

interface StatusDisplayProps {
    /** The user's current status */
    status: UserStatus;
    /** Size variant for the display */
    size?: "small" | "medium" | "large";
    /** Whether to show the tooltip on hover */
    showTooltip?: boolean;
}

/**
 * Displays a user's status emoji next to their profile picture.
 * Shows full status details in a tooltip on hover/focus.
 */
export function StatusDisplay({ status, size = "medium", showTooltip = true }: StatusDisplayProps) {
    const { t } = useTranslation();
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    const showTip = useCallback(() => {
        if (!showTooltip) return;
        clearTimeout(tooltipTimeoutRef.current);
        setTooltipVisible(true);
    }, [showTooltip]);

    const hideTip = useCallback(() => {
        tooltipTimeoutRef.current = setTimeout(() => {
            setTooltipVisible(false);
        }, 150);
    }, []);

    const sizeClass = `status-display--${size}`;

    return (
        <span
            className={`status-display ${sizeClass}`}
            onMouseEnter={showTip}
            onMouseLeave={hideTip}
            onFocus={showTip}
            onBlur={hideTip}
        >
            <span
                className="status-display__emoji"
                role="img"
                aria-label={t("statusDisplay.label", { status: status.text || status.emoji })}
                tabIndex={0}
            >
                {status.emoji}
            </span>

            {tooltipVisible && (
                <span className="status-display__tooltip" role="tooltip">
                    <span className="status-display__tooltip-emoji">{status.emoji}</span>
                    <span className="status-display__tooltip-text">
                        {status.text || t("statusDisplay.noMessage")}
                    </span>
                    <span className="status-display__tooltip-duration">
                        {formatDuration(status.duration, t)}
                    </span>
                </span>
            )}
        </span>
    );
}
