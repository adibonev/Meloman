import nextJest from "next/jest.js";
import type { Config } from "jest";

const createJestConfig = nextJest({
  dir: "./",
});

// `satisfies` (not `: Config`) keeps the precise literal type so
// next/jest's createJestConfig — which expects Jest's stricter
// InitialProjectOptions (testMatch: string[]) — accepts it, while still
// validating the shape against Jest's Config.
const config = {
  clearMocks: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["<rootDir>/e2e/"],
} satisfies Config;

export default createJestConfig(config);
