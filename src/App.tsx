import { useCallback, useState } from "react";
import { StatusPicker } from "./components/StatusPicker";
import { StatusDisplay } from "./components/StatusDisplay";
import { useUserStatus } from "./hooks/useUserStatus";
import { I18nProvider, useTranslation } from "./i18n";
import { Locale } from "./i18n/types";
import "./App.css";

/**
 * Inner app content that uses i18n context.
 */
function AppContent() {
    const { t, locale, setLocale } = useTranslation();
    const { status, setStatus, clearStatus } = useUserStatus();
    const [pickerOpen, setPickerOpen] = useState(false);

    const togglePicker = useCallback(() => {
        setPickerOpen((prev) => !prev);
    }, []);

    const handleLocaleChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            setLocale(e.target.value as Locale);
        },
        [setLocale]
    );

    return (
        <div className="app">
            <header className="app__header">
                <h1 className="app__title">{t("app.title")}</h1>
                <p className="app__subtitle">
                    {t("app.subtitle")}{" "}
                    <a
                        href="https://github.com/element-hq/element-meta/issues/2457"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        element-meta#2457
                    </a>
                </p>
                <div className="app__locale-switcher">
                    <label htmlFor="locale-select" className="sr-only">
                        Language
                    </label>
                    <select
                        id="locale-select"
                        value={locale}
                        onChange={handleLocaleChange}
                        className="app__locale-select"
                        aria-label="Select language"
                    >
                        <option value="en">English</option>
                        <option value="de">Deutsch</option>
                        <option value="fr">Français</option>
                        <option value="es">Español</option>
                        <option value="ja">日本語</option>
                    </select>
                </div>
            </header>

            <main className="app__main">
                {/* Simulated user profile area */}
                <section className="profile-area" aria-label={t("profile.ariaLabel")}>
                    <div className="profile-area__avatar-container">
                        <button
                            className="profile-area__avatar"
                            onClick={togglePicker}
                            aria-label={t("profile.setStatus")}
                            aria-expanded={pickerOpen}
                            aria-haspopup="dialog"
                            type="button"
                        >
                            <span className="profile-area__avatar-initials">JD</span>
                        </button>
                        {status && (
                            <StatusDisplay status={status} size="medium" />
                        )}
                    </div>
                    <div className="profile-area__info">
                        <span className="profile-area__name">Jane Doe</span>
                        {status && (
                            <span className="profile-area__status-text">
                                {status.emoji} {status.text}
                            </span>
                        )}
                        {!status && (
                            <button
                                className="profile-area__set-status-btn"
                                onClick={togglePicker}
                                type="button"
                            >
                                {t("profile.setStatus")}
                            </button>
                        )}
                    </div>

                    {pickerOpen && (
                        <StatusPicker
                            currentStatus={status}
                            onSave={setStatus}
                            onClear={clearStatus}
                            onClose={() => setPickerOpen(false)}
                        />
                    )}
                </section>

                {/* Simulated chat member list showing statuses */}
                <section className="member-list" aria-label={t("memberList.title")}>
                    <h2 className="member-list__title">{t("memberList.title")}</h2>
                    <ul className="member-list__list">
                        <li className="member-list__item">
                            <span className="member-list__avatar">JD</span>
                            <span className="member-list__name">Jane Doe</span>
                            {status && <StatusDisplay status={status} size="small" />}
                        </li>
                        <li className="member-list__item">
                            <span className="member-list__avatar">AS</span>
                            <span className="member-list__name">Alex Smith</span>
                            <StatusDisplay
                                status={{
                                    emoji: "📅",
                                    text: "In a meeting until 3pm",
                                    duration: { type: "always" },
                                    setAt: new Date(),
                                }}
                                size="small"
                            />
                        </li>
                        <li className="member-list__item">
                            <span className="member-list__avatar">MJ</span>
                            <span className="member-list__name">Morgan Jones</span>
                            <StatusDisplay
                                status={{
                                    emoji: "🏖️",
                                    text: "Out of office - back Monday",
                                    duration: { type: "always" },
                                    setAt: new Date(),
                                }}
                                size="small"
                            />
                        </li>
                        <li className="member-list__item">
                            <span className="member-list__avatar">CP</span>
                            <span className="member-list__name">Chris Park</span>
                        </li>
                    </ul>
                </section>
            </main>
        </div>
    );
}

/**
 * Root app component with I18nProvider wrapper.
 */
export function App() {
    return (
        <I18nProvider>
            <AppContent />
        </I18nProvider>
    );
}
