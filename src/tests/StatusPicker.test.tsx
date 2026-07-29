import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusPicker } from "../components/StatusPicker";
import { UserStatus } from "../types/status";
import { renderWithI18n } from "./helpers/renderWithI18n";

describe("StatusPicker", () => {
    const defaultProps = {
        currentStatus: null,
        onSave: jest.fn(),
        onClear: jest.fn(),
        onClose: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the dialog with correct title", () => {
        renderWithI18n(<StatusPicker {...defaultProps} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Set a status")).toBeInTheDocument();
    });

    it("shows placeholder text when no emoji is selected", () => {
        renderWithI18n(<StatusPicker {...defaultProps} />);
        expect(screen.getByText("Select an emoji to get started")).toBeInTheDocument();
    });

    it("selects an emoji and updates preview", async () => {
        renderWithI18n(<StatusPicker {...defaultProps} />);

        const availableBtn = screen.getByRole("button", { name: /Available/ });
        await userEvent.click(availableBtn);

        expect(screen.getByText("✅")).toBeInTheDocument();
    });

    it("fills the text input with default text when emoji is selected", async () => {
        renderWithI18n(<StatusPicker {...defaultProps} />);

        const busyBtn = screen.getByRole("button", { name: /Busy/ });
        await userEvent.click(busyBtn);

        const input = screen.getByLabelText("Status message") as HTMLInputElement;
        expect(input.value).toBe("Busy");
    });

    it("allows typing custom status text", async () => {
        renderWithI18n(<StatusPicker {...defaultProps} />);

        const input = screen.getByLabelText("Status message") as HTMLInputElement;
        await userEvent.clear(input);
        await userEvent.type(input, "Working on feature X");

        expect(input.value).toBe("Working on feature X");
    });

    it("shows character count", () => {
        renderWithI18n(<StatusPicker {...defaultProps} />);
        expect(screen.getByText("280")).toBeInTheDocument();
    });

    it("calls onSave with correct data when Save is clicked", async () => {
        const onSave = jest.fn();
        renderWithI18n(<StatusPicker {...defaultProps} onSave={onSave} />);

        const emojiBtn = screen.getByRole("button", { name: /Available/ });
        await userEvent.click(emojiBtn);

        const saveBtn = screen.getByRole("button", { name: "Save" });
        await userEvent.click(saveBtn);

        expect(onSave).toHaveBeenCalledTimes(1);
        const savedStatus: UserStatus = onSave.mock.calls[0][0];
        expect(savedStatus.emoji).toBe("✅");
        expect(savedStatus.text).toBe("Available");
        expect(savedStatus.duration.type).toBe("always");
    });

    it("disables Save button when no emoji is selected", () => {
        renderWithI18n(<StatusPicker {...defaultProps} />);
        const saveBtn = screen.getByRole("button", { name: /Select an emoji first/ });
        expect(saveBtn).toBeDisabled();
    });

    it("shows Clear button when there is a current status", () => {
        const currentStatus: UserStatus = {
            emoji: "✅",
            text: "Available",
            duration: { type: "always" },
            setAt: new Date(),
        };
        renderWithI18n(<StatusPicker {...defaultProps} currentStatus={currentStatus} />);
        expect(screen.getByRole("button", { name: /Clear status/ })).toBeInTheDocument();
    });

    it("does not show Clear button when there is no current status", () => {
        renderWithI18n(<StatusPicker {...defaultProps} />);
        expect(screen.queryByText("Clear status")).not.toBeInTheDocument();
    });

    it("calls onClear and onClose when Clear is clicked", async () => {
        const onClear = jest.fn();
        const onClose = jest.fn();
        const currentStatus: UserStatus = {
            emoji: "✅",
            text: "Available",
            duration: { type: "always" },
            setAt: new Date(),
        };
        renderWithI18n(
            <StatusPicker {...defaultProps} currentStatus={currentStatus} onClear={onClear} onClose={onClose} />
        );

        await userEvent.click(screen.getByText("Clear status"));

        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when Escape key is pressed", () => {
        const onClose = jest.fn();
        renderWithI18n(<StatusPicker {...defaultProps} onClose={onClose} />);

        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when close button is clicked", async () => {
        const onClose = jest.fn();
        renderWithI18n(<StatusPicker {...defaultProps} onClose={onClose} />);

        await userEvent.click(screen.getByLabelText("Close status picker"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("renders in German when locale is 'de'", () => {
        renderWithI18n(<StatusPicker {...defaultProps} />, { locale: "de" });
        expect(screen.getByText("Status festlegen")).toBeInTheDocument();
        expect(screen.getByText("Wähle ein Emoji aus")).toBeInTheDocument();
    });
});
