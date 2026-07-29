import {
    isStatusActive,
    isValidUserStatus,
    serializeStatus,
    deserializeStatus,
    formatDuration,
} from "../utils/statusUtils";
import { UserStatus, StatusDuration } from "../types/status";

describe("isStatusActive", () => {
    it("returns true for 'always' duration", () => {
        const status: UserStatus = {
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
        const status: UserStatus = {
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
        const status: UserStatus = {
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
        const status: UserStatus = {
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
        const status: UserStatus = {
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
        const status: UserStatus = {
            emoji: "📅",
            text: "In a meeting",
            duration: { type: "range", startTime: start, endTime: end },
            setAt: new Date(),
        };
        expect(isStatusActive(status)).toBe(false);
    });
});

describe("isValidUserStatus", () => {
    it("accepts a valid status with 'always' duration", () => {
        const status = {
            emoji: "✅",
            text: "Available",
            duration: { type: "always" },
            setAt: new Date(),
        };
        expect(isValidUserStatus(status)).toBe(true);
    });

    it("accepts a valid status with 'until' duration", () => {
        const status = {
            emoji: "🔴",
            text: "Busy",
            duration: { type: "until", endTime: new Date() },
            setAt: new Date(),
        };
        expect(isValidUserStatus(status)).toBe(true);
    });

    it("accepts a valid status with 'range' duration", () => {
        const status = {
            emoji: "📅",
            text: "Meeting",
            duration: { type: "range", startTime: new Date(), endTime: new Date() },
            setAt: new Date(),
        };
        expect(isValidUserStatus(status)).toBe(true);
    });

    it("rejects null", () => {
        expect(isValidUserStatus(null)).toBe(false);
    });

    it("rejects undefined", () => {
        expect(isValidUserStatus(undefined)).toBe(false);
    });

    it("rejects object with missing emoji", () => {
        const status = {
            text: "Available",
            duration: { type: "always" },
            setAt: new Date(),
        };
        expect(isValidUserStatus(status)).toBe(false);
    });

    it("rejects object with empty emoji", () => {
        const status = {
            emoji: "",
            text: "Available",
            duration: { type: "always" },
            setAt: new Date(),
        };
        expect(isValidUserStatus(status)).toBe(false);
    });

    it("rejects object with emoji too long", () => {
        const status = {
            emoji: "x".repeat(11),
            text: "Available",
            duration: { type: "always" },
            setAt: new Date(),
        };
        expect(isValidUserStatus(status)).toBe(false);
    });

    it("rejects object with text exceeding max length", () => {
        const status = {
            emoji: "✅",
            text: "x".repeat(281),
            duration: { type: "always" },
            setAt: new Date(),
        };
        expect(isValidUserStatus(status)).toBe(false);
    });

    it("rejects object with invalid setAt date", () => {
        const status = {
            emoji: "✅",
            text: "Available",
            duration: { type: "always" },
            setAt: new Date("invalid"),
        };
        expect(isValidUserStatus(status)).toBe(false);
    });

    it("rejects object with invalid duration type", () => {
        const status = {
            emoji: "✅",
            text: "Available",
            duration: { type: "unknown" },
            setAt: new Date(),
        };
        expect(isValidUserStatus(status)).toBe(false);
    });

    it("rejects object with invalid endTime in 'until' duration", () => {
        const status = {
            emoji: "✅",
            text: "Available",
            duration: { type: "until", endTime: new Date("invalid") },
            setAt: new Date(),
        };
        expect(isValidUserStatus(status)).toBe(false);
    });
});

describe("serializeStatus / deserializeStatus", () => {
    it("round-trips a status with 'always' duration", () => {
        const status: UserStatus = {
            emoji: "✅",
            text: "Available",
            duration: { type: "always" },
            setAt: new Date(),
        };
        const serialized = serializeStatus(status);
        const deserialized = deserializeStatus(serialized);

        expect(deserialized).not.toBeNull();
        expect(deserialized!.emoji).toBe("✅");
        expect(deserialized!.text).toBe("Available");
        expect(deserialized!.duration.type).toBe("always");
    });

    it("round-trips a status with 'until' duration", () => {
        const endTime = new Date("2026-08-01T15:00:00.000Z");
        const status: UserStatus = {
            emoji: "🔴",
            text: "Busy",
            duration: { type: "until", endTime },
            setAt: new Date(),
        };
        const serialized = serializeStatus(status);
        const deserialized = deserializeStatus(serialized);

        expect(deserialized).not.toBeNull();
        expect(deserialized!.duration.type).toBe("until");
        if (deserialized!.duration.type === "until") {
            expect(deserialized!.duration.endTime.toISOString()).toBe(endTime.toISOString());
        }
    });

    it("round-trips a status with 'range' duration", () => {
        const startTime = new Date("2026-08-01T09:00:00.000Z");
        const endTime = new Date("2026-08-01T17:00:00.000Z");
        const status: UserStatus = {
            emoji: "📅",
            text: "In a meeting",
            duration: { type: "range", startTime, endTime },
            setAt: new Date(),
        };
        const serialized = serializeStatus(status);
        const deserialized = deserializeStatus(serialized);

        expect(deserialized).not.toBeNull();
        expect(deserialized!.duration.type).toBe("range");
        if (deserialized!.duration.type === "range") {
            expect(deserialized!.duration.startTime.toISOString()).toBe(startTime.toISOString());
            expect(deserialized!.duration.endTime.toISOString()).toBe(endTime.toISOString());
        }
    });

    it("handles text with special characters (pipe, quotes, etc.)", () => {
        const status: UserStatus = {
            emoji: "💻",
            text: 'Working on "feature|branch" & stuff <script>',
            duration: { type: "always" },
            setAt: new Date(),
        };
        const serialized = serializeStatus(status);
        const deserialized = deserializeStatus(serialized);

        expect(deserialized).not.toBeNull();
        expect(deserialized!.text).toBe('Working on "feature|branch" & stuff <script>');
    });

    it("strips control characters from text during deserialization", () => {
        const malicious = JSON.stringify({
            e: "✅",
            t: "Normal\u202Etext\u200B",
            d: { type: "always" },
        });
        const deserialized = deserializeStatus(malicious);

        expect(deserialized).not.toBeNull();
        expect(deserialized!.text).toBe("Normaltext");
    });

    it("returns null for empty string", () => {
        expect(deserializeStatus("")).toBeNull();
    });

    it("returns null for malformed JSON", () => {
        expect(deserializeStatus("{not json")).toBeNull();
    });

    it("returns null for oversized payload", () => {
        const huge = JSON.stringify({ e: "✅", t: "x".repeat(2000), d: { type: "always" } });
        expect(deserializeStatus(huge)).toBeNull();
    });

    it("returns null for missing emoji", () => {
        const payload = JSON.stringify({ t: "text", d: { type: "always" } });
        expect(deserializeStatus(payload)).toBeNull();
    });

    it("returns null for invalid duration in deserialization", () => {
        const payload = JSON.stringify({ e: "✅", t: "text", d: { type: "until", end: "not-a-date" } });
        expect(deserializeStatus(payload)).toBeNull();
    });

    it("returns null when range end is before start", () => {
        const payload = JSON.stringify({
            e: "✅",
            t: "text",
            d: {
                type: "range",
                start: "2026-08-01T17:00:00.000Z",
                end: "2026-08-01T09:00:00.000Z",
            },
        });
        expect(deserializeStatus(payload)).toBeNull();
    });
});

describe("formatDuration", () => {
    it("formats 'always' duration", () => {
        const duration: StatusDuration = { type: "always" };
        const result = formatDuration(duration);
        expect(result).toBe("Until you clear it");
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
            if (key === "duration.display.today" && params) return `heute um ${params.time}`;
            if (key === "duration.display.until" && params) return `Bis ${params.time}`;
            return key;
        };
        const duration: StatusDuration = { type: "always" };
        const result = formatDuration(duration, mockT);
        expect(result).toBe("Bis du ihn löschst");
    });
});
