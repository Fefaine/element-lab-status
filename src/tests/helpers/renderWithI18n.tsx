import { render, RenderOptions } from "@testing-library/react";
import React, { ReactElement } from "react";
import { I18nProvider } from "../../i18n";
import { Locale } from "../../i18n/types";

interface I18nRenderOptions extends Omit<RenderOptions, "wrapper"> {
    locale?: Locale;
}

/**
 * Custom render function that wraps components in I18nProvider.
 */
export function renderWithI18n(ui: ReactElement, options: I18nRenderOptions = {}) {
    const { locale = "en", ...renderOptions } = options;

    function Wrapper({ children }: { children: React.ReactNode }) {
        return <I18nProvider locale={locale}>{children}</I18nProvider>;
    }

    return render(ui, { wrapper: Wrapper, ...renderOptions });
}
