import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { DurationPicker } from "../components/StatusPicker/DurationPicker";
import { StatusDuration } from "../types/status";
import { renderWithI18n } from "./helpers/renderWithI18n";

describe("DurationPicker", () => {
    it("renders with 'always' duration selected by default", () => {
        const onChange = jest.fn();
        const duration: StatusDuration = { type: "always" };
        renderWithI18n(<DurationPicker duration={duration} onChange={onChange} />);

        const select = screen.getByRole("combobox") as HTMLSelectElement;
        expect(select.value).toBe("always");
    });

    it("renders legend text", () => {
        renderWithI18n(<DurationPicker duration={{ type: "always" }} onChange={jest.fn()} />);
        expect(screen.getByText("Duration")).toBeInTheDocument();
    });

    it("does not show time inputs for 'always' type", () => {
        renderWithI18n(<DurationPicker duration={{ type: "always" }} onChange={jest.fn()} />);
        expect(screen.queryByLabelText("Clear at")).not.toBeInTheDocument();
        expect(screen.queryByLabelText("From")).not.toBeInTheDocument();
    });

    it("shows end time input for 'until' type", () => {
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + 1);
        renderWithI18n(
            <DurationPicker duration={{ type: "until", endTime }} onChange={jest.fn()} />
        );
        expect(screen.getByLabelText("Clear at")).toBeInTheDocument();
    });

    it("shows start and end time inputs for 'range' type", () => {
        const startTime = new Date();
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + 4);
        renderWithI18n(
            <DurationPicker duration={{ type: "range", startTime, endTime }} onChange={jest.fn()} />
        );
        expect(screen.getByLabelText("From")).toBeInTheDocument();
        expect(screen.getByLabelText("To")).toBeInTheDocument();
    });

    it("calls onChange with 'always' duration when switching to always", () => {
        const onChange = jest.fn();
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + 1);
        renderWithI18n(
            <DurationPicker duration={{ type: "until", endTime }} onChange={onChange} />
        );

        fireEvent.change(screen.getByRole("combobox"), { target: { value: "always" } });
        expect(onChange).toHaveBeenCalledWith({ type: "always" });
    });

    it("calls onChange with 'until' duration when switching to until", () => {
        const onChange = jest.fn();
        renderWithI18n(
            <DurationPicker duration={{ type: "always" }} onChange={onChange} />
        );

        fireEvent.change(screen.getByRole("combobox"), { target: { value: "until" } });
        expect(onChange).toHaveBeenCalledTimes(1);
        const result = onChange.mock.calls[0][0];
        expect(result.type).toBe("until");
        expect(result.endTime).toBeInstanceOf(Date);
    });

    it("calls onChange with 'range' duration when switching to range", () => {
        const onChange = jest.fn();
        renderWithI18n(
            <DurationPicker duration={{ type: "always" }} onChange={onChange} />
        );

        fireEvent.change(screen.getByRole("combobox"), { target: { value: "range" } });
        expect(onChange).toHaveBeenCalledTimes(1);
        const result = onChange.mock.calls[0][0];
        expect(result.type).toBe("range");
        expect(result.startTime).toBeInstanceOf(Date);
        expect(result.endTime).toBeInstanceOf(Date);
    });

    it("renders in French when locale is 'fr'", () => {
        renderWithI18n(
            <DurationPicker duration={{ type: "always" }} onChange={jest.fn()} />,
            { locale: "fr" }
        );
        expect(screen.getByText("Durée")).toBeInTheDocument();
    });
});
