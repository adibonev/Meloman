const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./apps/web",
});

/** @type {import('jest').Config} */
const config = {
  clearMocks: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  rootDir: "./apps/web",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["<rootDir>/e2e/"],
};

module.exports = createJestConfig(config);
