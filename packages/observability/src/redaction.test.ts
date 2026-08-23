import { describe, expect, it } from "vitest";
import { redact } from "./index";

describe("redact", () => {
  it("redacts secret keys and common credential values", () => {
    expect(
      redact({
        accessToken: "sensitive",
        message: "Authorization: Bearer abcdefghijklmnopqrstuvwxyz",
        nested: { password: "also-sensitive", safe: "visible" },
      }),
    ).toEqual({
      accessToken: "[REDACTED]",
      message: "Authorization: [REDACTED]",
      nested: { password: "[REDACTED]", safe: "visible" },
    });
  });
});

