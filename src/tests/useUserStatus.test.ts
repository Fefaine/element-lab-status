import { renderHook, act, waitFor } from "@testing-library/react";
import { useUserStatus } from "../hooks/useUserStatus";
import { UserStatusWithDuration } from "../types/status";
import { IMatrixClient, ProfileUpdateCallback } from "../types/matrixClient";

function createMockClient(overrides?: Partial<IMatrixClient>): IMatrixClient {
    let listeners: ProfileUpdateCallback[] = [];
    return {
        doesServerSupportExtendedProfiles: jest.fn().mockResolvedValue(true),
        getExtendedProfileProperty: jest.fn().mockRejectedValue(new Error("M_NOT_FOUND")),
        setExtendedProfileProperty: jest.fn().mockResolvedValue(undefined),
        getUserId: jest.fn().mockReturnValue("@jane:example.org"),
        onUserProfileUpdate: jest.fn((cb: ProfileUpdateCallback) => {
            listeners.push(cb);
            return () => {
                listeners = listeners.filter((l) => l !== cb);
            };
        }),
        // Helper to simulate a profile update event
        _emit: (userId: string, profile: Record<string, unknown>) => {
            listeners.forEach((cb) => cb(userId, profile));
        },
        ...overrides,
    } as IMatrixClient & { _emit: (userId: string, profile: Record<string, unknown>) => void };
}

describe("useUserStatus", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("returns null status initially when server has no status", async () => {
        const client = createMockClient();
        const { result } = renderHook(() => useUserStatus(client));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.status).toBeNull();
    });

    it("fetches and displays status from server on mount", async () => {
        const client = createMockClient({
            getExtendedProfileProperty: jest.fn().mockImplementation((_userId, key) => {
                if (key === "org.matrix.msc4426.status") {
                    return Promise.resolve({ emoji: "🔴", text: "Busy" });
                }
                return Promise.reject(new Error("M_NOT_FOUND"));
            }),
        });

        const { result } = renderHook(() => useUserStatus(client));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.status).not.toBeNull();
        expect(result.current.status!.emoji).toBe("🔴");
        expect(result.current.status!.text).toBe("Busy");
    });

    it("sets status on the server via setExtendedProfileProperty", async () => {
        const client = createMockClient();
        const { result } = renderHook(() => useUserStatus(client));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        const newStatus: UserStatusWithDuration = {
            emoji: "✅",
            text: "Available",
            duration: { type: "always" },
            setAt: new Date(),
        };

        await act(async () => {
            await result.current.setStatus(newStatus);
        });

        expect(client.setExtendedProfileProperty).toHaveBeenCalledWith(
            "org.matrix.msc4426.status",
            { emoji: "✅", text: "Available" }
        );
        expect(result.current.status).not.toBeNull();
        expect(result.current.status!.emoji).toBe("✅");
    });

    it("clears status on the server", async () => {
        const client = createMockClient({
            getExtendedProfileProperty: jest.fn().mockImplementation((_userId, key) => {
                if (key === "org.matrix.msc4426.status") {
                    return Promise.resolve({ emoji: "✅", text: "Available" });
                }
                return Promise.reject(new Error("M_NOT_FOUND"));
            }),
        });

        const { result } = renderHook(() => useUserStatus(client));

        await waitFor(() => {
            expect(result.current.status).not.toBeNull();
        });

        await act(async () => {
            await result.current.clearStatus();
        });

        expect(client.setExtendedProfileProperty).toHaveBeenCalledWith(
            "org.matrix.msc4426.status",
            null
        );
        expect(result.current.status).toBeNull();
    });

    it("sanitizes text before saving (trims and enforces length)", async () => {
        const client = createMockClient();
        const { result } = renderHook(() => useUserStatus(client));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.setStatus({
                emoji: "✅",
                text: "  " + "x".repeat(300) + "  ",
                duration: { type: "always" },
                setAt: new Date(),
            });
        });

        const call = (client.setExtendedProfileProperty as jest.Mock).mock.calls[0];
        const savedText = call[1].text;
        expect(savedText.length).toBeLessThanOrEqual(256);
        expect(savedText.startsWith("x")).toBe(true);
    });

    it("rejects invalid emoji (empty string)", async () => {
        const client = createMockClient();
        const { result } = renderHook(() => useUserStatus(client));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.setStatus({
                emoji: "",
                text: "No emoji",
                duration: { type: "always" },
                setAt: new Date(),
            });
        });

        // Should not have called the server
        expect(client.setExtendedProfileProperty).not.toHaveBeenCalled();
        expect(result.current.status).toBeNull();
    });

    it("stores duration metadata in localStorage", async () => {
        const client = createMockClient();
        const { result } = renderHook(() => useUserStatus(client));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        const future = new Date();
        future.setHours(future.getHours() + 2);

        await act(async () => {
            await result.current.setStatus({
                emoji: "🔴",
                text: "Busy",
                duration: { type: "until", endTime: future },
                setAt: new Date(),
            });
        });

        const stored = localStorage.getItem("element_status_duration");
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.type).toBe("until");
    });

    it("clears duration from localStorage when status is cleared", async () => {
        const client = createMockClient({
            getExtendedProfileProperty: jest.fn().mockImplementation((_userId, key) => {
                if (key === "org.matrix.msc4426.status") {
                    return Promise.resolve({ emoji: "✅", text: "Available" });
                }
                return Promise.reject(new Error("M_NOT_FOUND"));
            }),
        });

        localStorage.setItem("element_status_duration", JSON.stringify({ type: "always" }));

        const { result } = renderHook(() => useUserStatus(client));

        await waitFor(() => {
            expect(result.current.status).not.toBeNull();
        });

        await act(async () => {
            await result.current.clearStatus();
        });

        expect(localStorage.getItem("element_status_duration")).toBeNull();
    });

    it("handles server errors gracefully on initial fetch", async () => {
        const client = createMockClient({
            doesServerSupportExtendedProfiles: jest.fn().mockRejectedValue(new Error("Network error")),
        });

        const { result } = renderHook(() => useUserStatus(client));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.status).toBeNull();
    });
});
