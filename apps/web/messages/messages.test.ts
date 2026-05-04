import bg from "./bg.json";
import en from "./en.json";

function collectKeys(value: unknown, prefix = ""): string[] {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return collectKeys(child, nextPrefix);
  });
}

describe("i18n messages", () => {
  it("keeps Bulgarian and English message keys in sync", () => {
    const bgKeys = collectKeys(bg).sort();
    const enKeys = collectKeys(en).sort();

    expect(bgKeys).toEqual(enKeys);
  });
});
