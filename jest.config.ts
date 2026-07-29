import type { Config } from "jest";

const config: Config = {
    testEnvironment: "jsdom",
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.json",
            },
        ],
    },
    moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
    roots: ["<rootDir>/src"],
    testMatch: ["**/*.test.{ts,tsx}"],
    setupFiles: ["<rootDir>/src/tests/setup.ts"],
    moduleNameMapper: {
        "\\.css$": "<rootDir>/src/tests/__mocks__/styleMock.ts",
    },
};

export default config;
