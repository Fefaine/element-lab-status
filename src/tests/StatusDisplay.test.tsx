import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { StatusDisplay } from "../components/StatusDisplay";
import { UserStatus, UserStatusWithDuration } from "../types/status";
import { renderWithI18n } from "./helpers/renderWithI18n";

describe("StatusDisplay", () => {
    // Base status without duration (simulates another user's status from MSC4426)
    const baseServerStatus: UserStatus = {
        emoji: "✅",
        text: "Available",
    };

    // Status with duration (simulates own status with client-side metadata)
    const baseOwnStatus: UserStatusWithDuration = {
        emoji: "✅",
        text: "Available",
        duration: { type: "always" },
        setAt: new Date(),
    };

    it("renders the status emoji", () => {
        renderWithI18n(<StatusDisplay status={baseServerStatus} />);
        expect(screen.getByText("✅")).toBeInTheDocument();
    });

    it("has correct aria-label with status text", () => {
        renderWithI18n(<StatusDisplay status={baseServerStatus} />);
        expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Status: Available");
    });

    it("uses emoji as aria-label fallback when text is empty", () => {
        const status: UserStatus = { emoji: "✅", text: "" };
        renderWithI18n(<StatusDisplay status={status} />);
        expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Status: ✅");
    });

    it("does not show tooltip by default", () => {
        renderWithI18n(<StatusDisplay status={baseServerStatus} />);
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("shows tooltip on mouse enter", () => {
        renderWithI18n(<StatusDisplay status={baseServerStatus} />);

        const emojiEl = screen.getByRole("img");
        fireEvent.mouseEnter(emojiEl.parentElement!);

        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        expect(screen.getByText("Available")).toBeInTheDocument();
    });

    it("shows tooltip on focus", () => {
        renderWithI18n(<StatusDisplay status={baseServerStatus} />);

        const emojiEl = screen.getByRole("img");
        fireEvent.focus(emojiEl.parentElement!);

        expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    it("tooltip shows duration info when status has duration", () => {
        renderWithI18n(<StatusDisplay status={baseOwnStatus} />);

        fireEvent.mouseEnter(screen.getByRole("img").parentElement!);

        expect(screen.getByText("Until you clear it")).toBeInTheDocument();
    });

    it("tooltip does NOT show duration for plain UserStatus (other users)", () => {
        renderWithI18n(<StatusDisplay status={baseServerStatus} />);

        fireEvent.mouseEnter(screen.getByRole("img").parentElement!);

        // Duration line should not be present for server-only statuses
        expect(screen.queryByText("Until you clear it")).not.toBeInTheDocument();
    });

    it("tooltip shows 'No message' when text is empty", () => {
        const status: UserStatus = { emoji: "✅", text: "" };
        renderWithI18n(<StatusDisplay status={status} />);

        fireEvent.mouseEnter(screen.getByRole("img").parentElement!);
        expect(screen.getByText("No message")).toBeInTheDocument();
    });

    it("does not show tooltip when showTooltip is false", () => {
        renderWithI18n(<StatusDisplay status={baseServerStatus} showTooltip={false} />);

        fireEvent.mouseEnter(screen.getByRole("img").parentElement!);
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("applies size class correctly", () => {
        const { container } = renderWithI18n(<StatusDisplay status={baseServerStatus} size="large" />);
        expect(container.querySelector(".status-display--large")).toBeInTheDocument();
    });

    it("renders in Spanish locale", () => {
        const status: UserStatus = { emoji: "✅", text: "" };
        renderWithI18n(<StatusDisplay status={status} />, { locale: "es" });

        fireEvent.mouseEnter(screen.getByRole("img").parentElement!);
        expect(screen.getByText("Sin mensaje")).toBeInTheDocument();
    });

    it("emoji element is focusable with tabIndex 0", () => {
        renderWithI18n(<StatusDisplay status={baseServerStatus} />);
        expect(screen.getByRole("img")).toHaveAttribute("tabindex", "0");
    });

    it("displays call status correctly", () => {
        const callStatus: UserStatus = { emoji: "📞", text: "On a call" };
        renderWithI18n(<StatusDisplay status={callStatus} />);

        expect(screen.getByText("📞")).toBeInTheDocument();
        expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Status: On a call");
    });
});
