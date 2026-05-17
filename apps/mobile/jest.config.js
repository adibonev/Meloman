/**
 * Minimal jest for the mobile app's pure logic only. We deliberately do
 * NOT pull the heavy jest-expo / React Native renderer: component and
 * navigation tests need a device/emulator (Detox/Maestro) and are a
 * documented owner-side follow-up. ts-jest with isolatedModules keeps
 * this fast and dependency-light; tests must only import pure modules
 * (no expo-* / react-native imports).
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      { isolatedModules: true, tsconfig: { strict: true } },
    ],
  },
};
