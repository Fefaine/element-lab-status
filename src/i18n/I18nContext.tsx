import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Locale, TranslationKeys } from "./types";
import { translations } from "./locales";

interface I18nContextValue {
    /** Current locale */
    locale: Locale;
    /** Change the active locale */
    setLocale: (locale: Locale) => void;
    /**
     * Translate a key, with optional interpolation.
     * Interpolation uses {{key}} syntax in translation strings.
     * Accepts typed keys for autocompletion and string for dynamic keys.
     */
    t: (key: keyof TranslationKeys | (string & {}), params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Detects the user's preferred locale from browser settings.
 * Falls back to "en" if no supported locale matches.
 */
function detectLocale(): Locale {
    const supported: Locale[] = ["en", "de", "fr", "es", "ja"];
    const browserLangs = navigator.languages ?? [navigator.language];

    for (const lang of browserLangs) {
        const code = lang.split("-")[0].toLowerCase() as Locale;
        if (supported.includes(code)) {
            return code;
        }
    }
    return "en";
}

interface I18nProviderProps {
    /** Override the auto-detected locale */
    locale?: Locale;
    children: React.ReactNode;
}

/**
 * Provides i18n context to the component tree.
 * Automatically detects locale from browser if not explicitly set.
 */
export function I18nProvider({ locale: initialLocale, children }: I18nProviderProps) {
    const [locale, setLocale] = useState<Locale>(initialLocale ?? detectLocale());

    const t = useCallback(
        (key: keyof TranslationKeys | (string & {}), params?: Record<string, string>): string => {
            const dict = translations[locale] ?? translations.en;
            let value = (dict as Record<string, string>)[key] ?? (translations.en as Record<string, string>)[key] ?? key;

            // Interpolate {{param}} placeholders
            if (params) {
                for (const [paramKey, paramValue] of Object.entries(params)) {
                    value = value.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"), paramValue);
                }
            }

            return value;
        },
        [locale]
    );

    const contextValue = useMemo<I18nContextValue>(
        () => ({ locale, setLocale, t }),
        [locale, t]
    );

    return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

/**
 * Hook to access translation function and locale state.
 * Must be used within an I18nProvider.
 */
export function useTranslation(): I18nContextValue {
    const ctx = useContext(I18nContext);
    if (!ctx) {
        throw new Error("useTranslation must be used within an I18nProvider");
    }
    return ctx;
}
