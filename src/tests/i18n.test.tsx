import React from "react";
import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider, useTranslation } from "../i18n";
import { Locale } from "../i18n/types";

/** Helper component that displays a translated string */
function TranslatedText({ translationKey, params }: { translationKey: string; params?: Record<string, string> }) {
    const { t } = useTranslation();
    return <span data-testid="translated">{t(translationKey, params)}</span>;
}

/** Helper component that shows current locale and lets you change it */
function LocaleSwitcher() {
    const { locale, setLocale } = useTranslation();
    return (
        <div>
            <span data-testid="current-locale">{locale}</span>
            <button onClick={() => setLocale("de")}>Switch to DE</button>
            <button onClick={() => setLocale("fr")}>Switch to FR</button>
        </div>
    );
}

describe("I18nProvider and useTranslation", () => {
    it("provides English translations by default", () => {
        render(
            <I18nProvider locale="en">
                <TranslatedText translationKey="statusPicker.title" />
            </I18nProvider>
        );
        expect(screen.getByTestId("translated")).toHaveTextContent("Set a status");
    });

    it("provides German translations when locale is 'de'", () => {
        render(
            <I18nProvider locale="de">
                <TranslatedText translationKey="statusPicker.title" />
            </I18nProvider>
        );
        expect(screen.getByTestId("translated")).toHaveTextContent("Status festlegen");
    });

    it("provides French translations when locale is 'fr'", () => {
        render(
            <I18nProvider locale="fr">
                <TranslatedText translationKey="statusPicker.title" />
            </I18nProvider>
        );
        expect(screen.getByTestId("translated")).toHaveTextContent("Définir un statut");
    });

    it("provides Spanish translations when locale is 'es'", () => {
        render(
            <I18nProvider locale="es">
                <TranslatedText translationKey="statusPicker.title" />
            </I18nProvider>
        );
        expect(screen.getByTestId("translated")).toHaveTextContent("Establecer un estado");
    });

    it("provides Japanese translations when locale is 'ja'", () => {
        render(
            <I18nProvider locale="ja">
                <TranslatedText translationKey="statusPicker.title" />
            </I18nProvider>
        );
        expect(screen.getByTestId("translated")).toHaveTextContent("ステータスを設定");
    });

    it("interpolates parameters using {{key}} syntax", () => {
        render(
            <I18nProvider locale="en">
                <TranslatedText translationKey="statusDisplay.label" params={{ status: "Busy" }} />
            </I18nProvider>
        );
        expect(screen.getByTestId("translated")).toHaveTextContent("Status: Busy");
    });

    it("interpolates parameters in German", () => {
        render(
            <I18nProvider locale="de">
                <TranslatedText translationKey="statusDisplay.label" params={{ status: "Beschäftigt" }} />
            </I18nProvider>
        );
        expect(screen.getByTestId("translated")).toHaveTextContent("Status: Beschäftigt");
    });

    it("falls back to key when translation is not found", () => {
        render(
            <I18nProvider locale="en">
                <TranslatedText translationKey="nonexistent.key" />
            </I18nProvider>
        );
        expect(screen.getByTestId("translated")).toHaveTextContent("nonexistent.key");
    });

    it("allows changing locale dynamically", async () => {
        render(
            <I18nProvider locale="en">
                <LocaleSwitcher />
                <TranslatedText translationKey="statusPicker.title" />
            </I18nProvider>
        );

        expect(screen.getByTestId("translated")).toHaveTextContent("Set a status");
        expect(screen.getByTestId("current-locale")).toHaveTextContent("en");

        await userEvent.click(screen.getByText("Switch to DE"));

        expect(screen.getByTestId("translated")).toHaveTextContent("Status festlegen");
        expect(screen.getByTestId("current-locale")).toHaveTextContent("de");
    });

    it("switches from DE to FR correctly", async () => {
        render(
            <I18nProvider locale="de">
                <LocaleSwitcher />
                <TranslatedText translationKey="duration.legend" />
            </I18nProvider>
        );

        expect(screen.getByTestId("translated")).toHaveTextContent("Dauer");

        await userEvent.click(screen.getByText("Switch to FR"));

        expect(screen.getByTestId("translated")).toHaveTextContent("Durée");
    });

    it("throws when useTranslation is used outside provider", () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        expect(() => {
            render(<TranslatedText translationKey="statusPicker.title" />);
        }).toThrow("useTranslation must be used within an I18nProvider");

        consoleSpy.mockRestore();
    });

    it("translates all emoji preset keys", () => {
        const emojiKeys = [
            "emoji.available",
            "emoji.busy",
            "emoji.doNotDisturb",
            "emoji.beRightBack",
            "emoji.outOfOffice",
            "emoji.inMeeting",
            "emoji.outToLunch",
            "emoji.workingFromHome",
            "emoji.commuting",
            "emoji.offSick",
            "emoji.away",
            "emoji.focusing",
        ];

        const locales: Locale[] = ["en", "de", "fr", "es", "ja"];

        for (const locale of locales) {
            for (const key of emojiKeys) {
                const { unmount } = render(
                    <I18nProvider locale={locale}>
                        <TranslatedText translationKey={key} />
                    </I18nProvider>
                );

                const el = screen.getByTestId("translated");
                // Should not fall back to key name
                expect(el.textContent).not.toBe(key);
                expect(el.textContent!.length).toBeGreaterThan(0);

                unmount();
            }
        }
    });
});
