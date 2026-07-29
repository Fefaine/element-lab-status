import { renderHook, act } from "@testing-library/react";
import { useUserStatus } from "../hooks/useUserStatus";
import { UserStatus } from "../types/status";

const STORAGE_KEY = "element_user_status";

describe("useUserStatus", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("returns null status initially when localStorage is empty", () => {
        const { result } = renderHook(() => useUserStatus());
        expect(result.current.status).toBeNull();
    });

    it("sets a status and persists to localStorage", () => {
        const { result } = renderHook(() => useUserStatus());

        const newStatus: UserStatus = {
            emoji: "✅",
            text: "Available",
            duration: { type: "always" },
            setAt: new Date(),
        };

        act(() => {
            result.current.setStatus(newStatus);
        });

        expect(result.current.status).not.toBeNull();
        expect(result.current.status!.emoji).toBe("✅");
        expect(result.current.status!.text).toBe("Available");

        // Check localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.emoji).toBe("✅");
    });

    it("clears the status and removes from localStorage", () => {
        const { result } = renderHook(() => useUserStatus());

        act(() => {
            result.current.setStatus({
                emoji: "🔴",
                text: "Busy",
                duration: { type: "always" },
                setAt: new Date(),
            });
        });

        expect(result.current.status).not.toBeNull();

        act(() => {
            result.current.clearStatus();
        });

        expect(result.current.status).toBeNull();
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("trims status text and enforces max length", () => {
        const { result } = renderHook(() => useUserStatus());

        act(() => {
            result.current.setStatus({
                emoji: "✅",
                text: "  " + "x".repeat(300) + "  ",
                duration: { type: "always" },
                setAt: new Date(),
            });
        });

        expect(result.current.status!.text.length).toBeLessThanOrEqual(280);
        expect(result.current.status!.text.startsWith("x")).toBe(true);
    });

    it("restores an active status from localStorage on init", () => {
        const status: UserStatus = {
            emoji: "🏠",
            text: "Working from home",
            duration: { type: "always" },
            setAt: new Date(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(status));

        const { result } = renderHook(() => useUserStatus());
        expect(result.current.status).not.toBeNull();
        expect(result.current.status!.emoji).toBe("🏠");
        expect(result.current.status!.text).toBe("Working from home");
    });

    it("discards expired status from localStorage on init", () => {
        const past = new Date();
        past.setHours(past.getHours() - 2);
        const status: UserStatus = {
            emoji: "🔴",
            text: "Was busy",
            duration: { type: "until", endTime: past },
            setAt: new Date(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(status));

        const { result } = renderHook(() => useUserStatus());
        expect(result.current.status).toBeNull();
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("rejects malformed localStorage data", () => {
        localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");

        const { result } = renderHook(() => useUserStatus());
        expect(result.current.status).toBeNull();
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("rejects localStorage data with invalid shape", () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }));

        const { result } = renderHook(() => useUserStatus());
        expect(result.current.status).toBeNull();
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("rejects oversized localStorage data", () => {
        const huge = JSON.stringify({
            emoji: "✅",
            text: "x".repeat(3000),
            duration: { type: "always" },
            setAt: new Date().toISOString(),
        });
        localStorage.setItem(STORAGE_KEY, huge);

        const { result } = renderHook(() => useUserStatus());
        expect(result.current.status).toBeNull();
    });
});
