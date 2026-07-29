import {
    isStatusActive,
    isValidUserStatusWithDuration,
    validateUserStatus,
    validateMCallStatus,
    userStatusFromProfile,
    userStatusTextWithinMaxLength,
    extractFirstGrapheme,
    sanitizeText,
    formatDuration,
    setUserStatusOnServer,
    clearUserStatusOnServer,
    fetchUserStatus,
} from "../utils/statusUtils";
import { UserStatusWithDuration, StatusDuration } from "../types/status";
import { IMatrixClient } from "../types/matrixClient";

// ─── validateUserStatus (MSC4426 server data validation) ────────────────────

describe("validateUserStatus", () => {
    it("accepts a valid status with emoji and text", () => {
        const result = validateUserStatus({ emoji: "✅", text: "Available" });
        expect(result).toEqual({ emoji: "✅", text: "Available" });
    });

    it("extracts first grapheme from multi-character emoji field", () => {
        const result = validateUserStatus({ emoji: "🔴🔵", text: "Busy" });
        expect(result).toEqual({ emoji: "🔴", text: "Busy" });
    });

    it("returns undefined for null", () => {
        expect(validateUserStatus(null)).toBeUndefined();
    });

    it("returns undefined for non-object", () => {
        expect(validateUserStatus("string")).toBeUndefined();
        expect(validateUserStatus(42)).toBeUndefined();
    });

    it("returns undefined when emoji is missing", () => {
        expect(validateUserStatus({ text: "Hello" })).toBeUndefined();
    });

    it("returns undefined when emoji is empty string", () => {
        expect(validateUserStatus({ emoji: "", text: "Hello" })).toBeUndefined();
    });

    it("returns undefined when text is missing", () => {
        expect(validateUserStatus({ emoji: "✅" })).toBeUndefined();
    });

    it("returns undefined when text is empty string", () => {
        expect(validateUserStatus({ emoji: "✅", text: "" })).toBeUndefined();
    });

    it("returns undefined when emoji is not a string", () => {
        expect(validateUserStatus({ emoji: 123, text: "Hello" })).toBeUndefined();
    });

    it("returns undefined when text is not a string", () => {
        expect(validateUserStatus({ emoji: "✅", text: 123 })).toBeUndefined();
    });

    it("truncates text exceeding 256 UTF-8 bytes", () => {
        const longText = "a".repeat(300);
        const result = validateUserStatus({ emoji: "✅", text: longText });
        expect(result).not.toBeUndefined();
        expect(result!.text.length).toBeLessThanOrEqual(257); // 256 + ellipsis
    });
});

// ─── validateMCallStatus ────────────────────────────────────────────────────

describe("validateMCallStatus", () => {
    it("returns call status when call_joined_ts is positive", () => {
        const result = validateMCallStatus({ call_joined_ts: Date.now() });
        expect(result).toEqual({ emoji: "📞", text: "On a call" });
    });

    it("returns undefined when call_joined_ts is 0", () => {
        expect(validateMCallStatus({ call_joined_ts: 0 })).toBeUndefined();
    });

    it("returns undefined when call_joined_ts is negative", () => {
        expect(validateMCallStatus({ call_joined_ts: -1 })).toBeUndefined();
    });

    it("returns undefined for null", () => {
        expect(validateMCallStatus(null)).toBeUndefined();
    });

    it("returns undefined for non-object", () => {
        expect(validateMCallStatus("string")).toBeUndefined();
    });

    it("returns undefined when call_joined_ts is not a number", () => {
        expect(validateMCallStatus({ call_joined_ts: "123" })).toBeUndefined();
    });

    it("returns undefined when call_joined_ts is missing", () => {
        expect(validateMCallStatus({})).toBeUndefined();
    });
});

// ─── userStatusFromProfile ──────────────────────────────────────────────────

describe("userStatusFromProfile", () => {
    it("returns custom status when both status and call are set", () => {
        const result = userStatusFromProfile(
            { emoji: "🔴", text: "Busy" },
            { call_joined_ts: Date.now() }
        );
        expect(result).toEqual({ emoji: "🔴", text: "Busy" });
    });

    it("falls back to call status when custom status is invalid", () => {
        const result = userStatusFromProfile(null, { call_joined_ts: Date.now() });
        expect(result).toEqual({ emoji: "📞", text: "On a call" });
    });

    it("returns undefined when both are invalid", () => {
        expect(userStatusFromProfile(null, null)).toBeUndefined();
    });

    it("returns undefined when both are empty objects", () => {
        expect(userStatusFromProfile({}, {})).toBeUndefined();
    });
});

// ─── userStatusTextWithinMaxLength ──────────────────────────────────────────

describe("userStatusTextWithinMaxLength", () => {
    it("returns true for short ASCII text", () => {
        expect(userStatusTextWithinMaxLength("Hello")).toBe(true);
    });

    it("returns true for exactly 256 bytes", () => {
        const text = "a".repeat(256);
        expect(userStatusTextWithinMaxLength(text)).toBe(true);
    });

    it("returns false for text exceeding 256 bytes", () => {
        const text = "a".repeat(257);
        expect(userStatusTextWithinMaxLength(text)).toBe(false);
    });

    it("counts multi-byte characters correctly", () => {
        // Each emoji is 4 bytes in UTF-8
        const text = "😀".repeat(64); // 64 * 4 = 256 bytes
        expect(userStatusTextWithinMaxLength(text)).toBe(true);

        const tooLong = "😀".repeat(65); // 65 * 4 = 260 bytes
        expect(userStatusTextWithinMaxLength(tooLong)).toBe(false);
    });
});

// ─── extractFirstGrapheme ───────────────────────────────────────────────────

describe("extractFirstGrapheme", () => {
    it("extracts a simple emoji", () => {
        expect(extractFirstGrapheme("✅")).toBe("✅");
    });

    it("extracts first grapheme from multiple emojis", () => {
        expect(extractFirstGrapheme("🔴🔵")).toBe("🔴");
    });

    it("handles emoji with variation selector", () => {
        expect(extractFirstGrapheme("🏖️")).toBe("🏖️");
    });

    it("handles flag emoji (multi-codepoint single grapheme)", () => {
        expect(extractFirstGrapheme("🇫🇷")).toBe("🇫🇷");
    });

    it("returns undefined for empty string", () => {
        expect(extractFirstGrapheme("")).toBeUndefined();
    });

    it("extracts single letter from text", () => {
        expect(extractFirstGrapheme("A")).toBe("A");
    });
});

// ─── sanitizeText ───────────────────────────────────────────────────────────

describe("sanitizeText", () => {
    it("trims whitespace", () => {
        expect(sanitizeText("  hello  ")).toBe("hello");
    });

    it("strips bidi override characters", () => {
        expect(sanitizeText("Normal\u202Etext")).toBe("Normaltext");
    });

    it("strips zero-width characters", () => {
        expect(sanitizeText("Hello\u200BWorld")).toBe("HelloWorld");
    });

    it("strips control characters", () => {
        expect(sanitizeText("Hello\x00World\x1F")).toBe("HelloWorld");
    });

    it("preserves normal text", () => {
        expect(sanitizeText("Working from home 🏠")).toBe("Working from home 🏠");
    });

    it("enforces max length", () => {
        const result = sanitizeText("x".repeat(500));
        expect(result.length).toBeLessThanOrEqual(256);
    });
});

// ─── isStatusActive (duration logic) ────────────────────────────────────────

describe("isStatusActive", () => {
    it("returns true for 'always' duration", () => {
        const status: UserStatusWithDuration = {
            emoji: "✅",
            text: "Available",
            duration: { type: "always" },
            setAt: new Date(),
        };
        expect(isStatusActive(status)).toBe(true);
    });

    it("returns true for 'until' duration in the future", () => {
        const future = new Date();
        future.setHours(future.getHours() + 1);
        const status: UserStatusWithDuration = {
            emoji: "🔴",
            text: "Busy",
            duration: { type: "until", endTime: future },
            setAt: new Date(),
        };
        expect(isStatusActive(status)).toBe(true);
    });

    it("returns false for 'until' duration in the past", () => {
        const past = new Date();
        past.setHours(past.getHours() - 1);
        const status: UserStatusWithDuration = {
            emoji: "🔴",
            text: "Busy",
            duration: { type: "until", endTime: past },
            setAt: new Date(),
        };
        expect(isStatusActive(status)).toBe(false);
    });

    it("returns true for 'range' when now is within range", () => {
        const start = new Date();
        start.setHours(start.getHours() - 1);
        const end = new Date();
        end.setHours(end.getHours() + 1);
        const status: UserStatusWithDuration = {
            emoji: "📅",
            text: "In a meeting",
            duration: { type: "range", startTime: start, endTime: end },
            setAt: new Date(),
        };
        expect(isStatusActive(status)).toBe(true);
    });

    it("returns false for 'range' when now is before start", () => {
        const start = new Date();
        start.setHours(start.getHours() + 1);
        const end = new Date();
        end.setHours(end.getHours() + 2);
        const status: UserStatusWithDuration = {
            emoji: "📅",
            text: "In a meeting",
            duration: { type: "range", startTime: start, endTime: end },
            setAt: new Date(),
        };
        expect(isStatusActive(status)).toBe(false);
    });

    it("returns false for 'range' when now is after end", () => {
        const start = new Date();
        start.setHours(start.getHours() - 3);
        const end = new Date();
        end.setHours(end.getHours() - 1);
        const status: UserStatusWithDuration = {
            emoji: "📅",
            text: "In a meeting",
            duration: { type: "range", startTime: start, endTime: end },
            setAt: new Date(),
        };
        expect(isStatusActive(status)).toBe(false);
    });
});

// ─── isValidUserStatusWithDuration ──────────────────────────────────────────

describe("isValidUserStatusWithDuration", () => {
    it("accepts a valid status with 'always' duration", () => {
        const status = {
            emoji: "✅",
            text: "Available",
            duration: { type: "always" },
            setAt: new Date(),
        };
        expect(isValidUserStatusWithDuration(status)).toBe(true);
    });

    it("accepts a valid status with 'until' duration", () => {
        const status = {
            emoji: "🔴",
            text: "Busy",
            duration: { type: "until", endTime: new Date() },
            setAt: new Date(),
        };
        expect(isValidUserStatusWithDuration(status)).toBe(true);
    });

    it("rejects null", () => {
        expect(isValidUserStatusWithDuration(null)).toBe(false);
    });

    it("rejects object with missing emoji", () => {
        expect(isValidUserStatusWithDuration({
            text: "Available",
            duration: { type: "always" },
            setAt: new Date(),
        })).toBe(false);
    });

    it("rejects object with invalid setAt date", () => {
        expect(isValidUserStatusWithDuration({
            emoji: "✅",
            text: "Available",
            duration: { type: "always" },
            setAt: new Date("invalid"),
        })).toBe(false);
    });
});

// ─── formatDuration ─────────────────────────────────────────────────────────

describe("formatDuration", () => {
    it("formats 'always' duration", () => {
        const duration: StatusDuration = { type: "always" };
        expect(formatDuration(duration)).toBe("Until you clear it");
    });

    it("formats 'until' duration with a future date", () => {
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + 2);
        const duration: StatusDuration = { type: "until", endTime };
        const result = formatDuration(duration);
        expect(result).toContain("Until");
        expect(result).toContain("today at");
    });

    it("uses custom translation function", () => {
        const mockT = (key: string, params?: Record<string, string>) => {
            if (key === "duration.display.always") return "Bis du ihn löschst";
            return key;
        };
        const duration: StatusDuration = { type: "always" };
        expect(formatDuration(duration, mockT)).toBe("Bis du ihn löschst");
    });
});

// ─── Server operations ──────────────────────────────────────────────────────

describe("setUserStatusOnServer", () => {
    const mockClient: IMatrixClient = {
        doesServerSupportExtendedProfiles: jest.fn().mockResolvedValue(true),
        getExtendedProfileProperty: jest.fn(),
        setExtendedProfileProperty: jest.fn().mockResolvedValue(undefined),
        getUserId: jest.fn().mockReturnValue("@user:example.org"),
        onUserProfileUpdate: jest.fn().mockReturnValue(() => {}),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("calls setExtendedProfileProperty with correct payload", async () => {
        await setUserStatusOnServer(mockClient, { emoji: "✅", text: "Available" });
        expect(mockClient.setExtendedProfileProperty).toHaveBeenCalledWith(
            "org.matrix.msc4426.status",
            { emoji: "✅", text: "Available" }
        );
    });

    it("throws when emoji is not a single grapheme", async () => {
        await expect(
            setUserStatusOnServer(mockClient, { emoji: "", text: "No emoji" })
        ).rejects.toThrow("Invalid emoji");
    });

    it("throws when text exceeds 256 UTF-8 bytes", async () => {
        await expect(
            setUserStatusOnServer(mockClient, { emoji: "✅", text: "a".repeat(257) })
        ).rejects.toThrow("Status text exceeds");
    });
});

describe("clearUserStatusOnServer", () => {
    const mockClient: IMatrixClient = {
        doesServerSupportExtendedProfiles: jest.fn().mockResolvedValue(true),
        getExtendedProfileProperty: jest.fn(),
        setExtendedProfileProperty: jest.fn().mockResolvedValue(undefined),
        getUserId: jest.fn().mockReturnValue("@user:example.org"),
        onUserProfileUpdate: jest.fn().mockReturnValue(() => {}),
    };

    it("calls setExtendedProfileProperty with null", async () => {
        await clearUserStatusOnServer(mockClient);
        expect(mockClient.setExtendedProfileProperty).toHaveBeenCalledWith(
            "org.matrix.msc4426.status",
            null
        );
    });
});

describe("fetchUserStatus", () => {
    it("returns undefined when server does not support extended profiles", async () => {
        const mockClient: IMatrixClient = {
            doesServerSupportExtendedProfiles: jest.fn().mockResolvedValue(false),
            getExtendedProfileProperty: jest.fn(),
            setExtendedProfileProperty: jest.fn(),
            getUserId: jest.fn().mockReturnValue("@user:example.org"),
            onUserProfileUpdate: jest.fn().mockReturnValue(() => {}),
        };

        const result = await fetchUserStatus(mockClient, "@user:example.org");
        expect(result).toBeUndefined();
    });

    it("returns validated status from server", async () => {
        const mockClient: IMatrixClient = {
            doesServerSupportExtendedProfiles: jest.fn().mockResolvedValue(true),
            getExtendedProfileProperty: jest.fn().mockImplementation((_userId, key) => {
                if (key === "org.matrix.msc4426.status") return { emoji: "🔴", text: "Busy" };
                throw new Error("M_NOT_FOUND");
            }),
            setExtendedProfileProperty: jest.fn(),
            getUserId: jest.fn().mockReturnValue("@user:example.org"),
            onUserProfileUpdate: jest.fn().mockReturnValue(() => {}),
        };

        const result = await fetchUserStatus(mockClient, "@user:example.org");
        expect(result).toEqual({ emoji: "🔴", text: "Busy" });
    });

    it("returns call status when no custom status but user is on a call", async () => {
        const mockClient: IMatrixClient = {
            doesServerSupportExtendedProfiles: jest.fn().mockResolvedValue(true),
            getExtendedProfileProperty: jest.fn().mockImplementation((_userId, key) => {
                if (key === "org.matrix.msc4426.call") return { call_joined_ts: Date.now() };
                throw new Error("M_NOT_FOUND");
            }),
            setExtendedProfileProperty: jest.fn(),
            getUserId: jest.fn().mockReturnValue("@user:example.org"),
            onUserProfileUpdate: jest.fn().mockReturnValue(() => {}),
        };

        const result = await fetchUserStatus(mockClient, "@user:example.org");
        expect(result).toEqual({ emoji: "📞", text: "On a call" });
    });
});
