import { parseJoinCode } from "./join-code";

describe("parseJoinCode", () => {
  test("extracts the code from a full join URL", () => {
    expect(parseJoinCode("https://meloman-web.vercel.app/play/MELO42")).toBe(
      "MELO42"
    );
    expect(parseJoinCode("https://x/en/play/melo42")).toBe("MELO42");
    expect(parseJoinCode("https://x/play/ABCD1234?ref=qr")).toBe(
      "ABCD1234"
    );
    expect(parseJoinCode("https://x/play/MELO42/")).toBe("MELO42");
  });

  test("accepts a raw pasted code (any case)", () => {
    expect(parseJoinCode("melo42")).toBe("MELO42");
    expect(parseJoinCode("  ABCD  ")).toBe("ABCD");
  });

  test("rejects anything that isn't a 4–8 char alnum code", () => {
    expect(parseJoinCode("")).toBeNull();
    expect(parseJoinCode(null)).toBeNull();
    expect(parseJoinCode(undefined)).toBeNull();
    expect(parseJoinCode("ab")).toBeNull(); // too short
    expect(parseJoinCode("TOOLONGCODE")).toBeNull(); // > 8
    expect(parseJoinCode("https://x/about")).toBeNull();
    expect(parseJoinCode("MELO 42")).toBeNull(); // space
  });
});
