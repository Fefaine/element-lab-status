import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmojiGrid } from "../components/StatusPicker/EmojiGrid";
import { STATUS_EMOJI_PRESETS } from "../types/status";
import { renderWithI18n } from "./helpers/renderWithI18n";

describe("EmojiGrid", () => {
    const defaultProps = {
        presets: STATUS_EMOJI_PRESETS,
        selectedEmoji: "",
        onSelect: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders all emoji presets as buttons", () => {
        renderWithI18n(<EmojiGrid {...defaultProps} />);
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBe(STATUS_EMOJI_PRESETS.length);
    });

    it("has correct grid ARIA structure", () => {
        renderWithI18n(<EmojiGrid {...defaultProps} />);
        expect(screen.getByRole("grid")).toBeInTheDocument();
        expect(screen.getByRole("row")).toBeInTheDocument();
        expect(screen.getAllByRole("gridcell").length).toBe(STATUS_EMOJI_PRESETS.length);
    });

    it("marks selected emoji with aria-pressed", () => {
        renderWithI18n(<EmojiGrid {...defaultProps} selectedEmoji="✅" />);
        const selectedBtn = screen.getByRole("button", { name: /Available/ });
        expect(selectedBtn).toHaveAttribute("aria-pressed", "true");
    });

    it("marks non-selected emoji with aria-pressed=false", () => {
        renderWithI18n(<EmojiGrid {...defaultProps} selectedEmoji="✅" />);
        const otherBtn = screen.getByRole("button", { name: /Busy/ });
        expect(otherBtn).toHaveAttribute("aria-pressed", "false");
    });

    it("calls onSelect when an emoji is clicked", async () => {
        const onSelect = jest.fn();
        renderWithI18n(<EmojiGrid {...defaultProps} onSelect={onSelect} />);

        await userEvent.click(screen.getByRole("button", { name: /Busy/ }));
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect.mock.calls[0][0].emoji).toBe("🔴");
    });

    it("navigates right with ArrowRight key", () => {
        const onSelect = jest.fn();
        renderWithI18n(<EmojiGrid {...defaultProps} onSelect={onSelect} />);

        const row = screen.getByRole("row");
        fireEvent.keyDown(row, { key: "ArrowRight" });

        const buttons = screen.getAllByRole("button");
        expect(buttons[1]).toHaveFocus();
    });

    it("navigates left with ArrowLeft key", () => {
        renderWithI18n(<EmojiGrid {...defaultProps} />);

        const row = screen.getByRole("row");
        fireEvent.keyDown(row, { key: "ArrowRight" });
        fireEvent.keyDown(row, { key: "ArrowLeft" });

        const buttons = screen.getAllByRole("button");
        expect(buttons[0]).toHaveFocus();
    });

    it("navigates down with ArrowDown key", () => {
        renderWithI18n(<EmojiGrid {...defaultProps} />);

        const row = screen.getByRole("row");
        fireEvent.keyDown(row, { key: "ArrowDown" });

        const buttons = screen.getAllByRole("button");
        expect(buttons[6]).toHaveFocus();
    });

    it("selects emoji with Enter key", () => {
        const onSelect = jest.fn();
        renderWithI18n(<EmojiGrid {...defaultProps} onSelect={onSelect} />);

        const row = screen.getByRole("row");
        fireEvent.keyDown(row, { key: "Enter" });

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect.mock.calls[0][0].emoji).toBe("✅");
    });

    it("selects emoji with Space key", () => {
        const onSelect = jest.fn();
        renderWithI18n(<EmojiGrid {...defaultProps} onSelect={onSelect} />);

        const row = screen.getByRole("row");
        fireEvent.keyDown(row, { key: " " });

        expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("does not navigate past the first item with ArrowLeft", () => {
        renderWithI18n(<EmojiGrid {...defaultProps} />);

        const row = screen.getByRole("row");
        fireEvent.keyDown(row, { key: "ArrowLeft" });

        const buttons = screen.getAllByRole("button");
        expect(buttons[0]).toHaveFocus();
    });

    it("does not navigate past the last item with ArrowRight", () => {
        renderWithI18n(<EmojiGrid {...defaultProps} />);

        const row = screen.getByRole("row");
        for (let i = 0; i < STATUS_EMOJI_PRESETS.length + 5; i++) {
            fireEvent.keyDown(row, { key: "ArrowRight" });
        }

        const buttons = screen.getAllByRole("button");
        expect(buttons[STATUS_EMOJI_PRESETS.length - 1]).toHaveFocus();
    });

    it("uses only one tab stop (roving tabindex)", () => {
        renderWithI18n(<EmojiGrid {...defaultProps} />);

        const buttons = screen.getAllByRole("button");
        const tabbable = buttons.filter((btn) => btn.getAttribute("tabindex") === "0");
        expect(tabbable.length).toBe(1);
    });
});
