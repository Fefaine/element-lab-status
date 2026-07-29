import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { StatusDisplay } from "../components/StatusDisplay";
import { UserStatus } from "../types/status";
import { renderWithI18n } from "./helpers/renderWithI18n";

describe("StatusDisplay", () => {
    const baseStatus: UserStatus = {
        emoji: "✅",
        text: "Available",
        duration: { type: "always" },
        setAt: new Date(),
    };

    it("renders the status emoji", () => {
        renderWithI18n(<StatusDisplay status={baseStatus} />);
        expect(screen.getByText("✅")).toBeInTheDocument();
    });

    it("has correct aria-label with status text", () => {
        renderWithI18n(<StatusDisplay status={baseStatus} />);
        expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Status: Available");
    });

    it("uses emoji as aria-label fallback when text is empty", () => {
        const status = { ...baseStatus, text: "" };
        renderWithI18n(<StatusDisplay status={status} />);
        expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Status: ✅");
    });

    it("does not show tooltip by default", () => {
        renderWithI18n(<StatusDisplay status={baseStatus} />);
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("shows tooltip on mouse enter", () => {
        renderWithI18n(<StatusDisplay status={baseStatus} />);

        const emojiEl = screen.getByRole("img");
        fireEvent.mouseEnter(emojiEl.parentElement!);

        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        expect(screen.getByText("Available")).toBeInTheDocument();
    });

    it("shows tooltip on focus", () => {
        renderWithI18n(<StatusDisplay status={baseStatus} />);

        const emojiEl = screen.getByRole("img");
        fireEvent.focus(emojiEl.parentElement!);

        expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    it("tooltip shows duration info", () => {
        renderWithI18n(<StatusDisplay status={baseStatus} />);

        fireEvent.mouseEnter(screen.getByRole("img").parentElement!);

        expect(screen.getByText("Until you clear it")).toBeInTheDocument();
    });

    it("tooltip shows 'No message' when text is empty", () => {
        const status = { ...baseStatus, text: "" };
        renderWithI18n(<StatusDisplay status={status} />);

        fireEvent.mouseEnter(screen.getByRole("img").parentElement!);
        expect(screen.getByText("No message")).toBeInTheDocument();
    });

    it("does not show tooltip when showTooltip is false", () => {
        renderWithI18n(<StatusDisplay status={baseStatus} showTooltip={false} />);

        fireEvent.mouseEnter(screen.getByRole("img").parentElement!);
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("applies size class correctly", () => {
        const { container } = renderWithI18n(<StatusDisplay status={baseStatus} size="large" />);
        expect(container.querySelector(".status-display--large")).toBeInTheDocument();
    });

    it("renders in Spanish locale", () => {
        const status = { ...baseStatus, text: "" };
        renderWithI18n(<StatusDisplay status={status} />, { locale: "es" });

        fireEvent.mouseEnter(screen.getByRole("img").parentElement!);
        expect(screen.getByText("Sin mensaje")).toBeInTheDocument();
    });

    it("emoji element is focusable with tabIndex 0", () => {
        renderWithI18n(<StatusDisplay status={baseStatus} />);
        expect(screen.getByRole("img")).toHaveAttribute("tabindex", "0");
    });
});
