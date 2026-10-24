import { describe, expect, it } from "vitest";
import { resolveCorsOrigin } from "src/core/config/env";

describe("resolveCorsOrigin", () => {
  it("accepts one valid origin and normalizes a trailing slash", () => {
    expect(resolveCorsOrigin("http://localhost:3001/")).toBe(
      "http://localhost:3001",
    );
  });

  it("rejects missing, multiple, or path-based origins", () => {
    expect(() => resolveCorsOrigin(undefined)).toThrow(
      "CORS_ORIGIN deve ser configurada",
    );
    expect(() =>
      resolveCorsOrigin("http://localhost:3001,http://localhost:3002"),
    ).toThrow("CORS_ORIGIN deve conter uma origem única");
    expect(() => resolveCorsOrigin("http://localhost:3001/api")).toThrow(
      "CORS_ORIGIN deve conter uma origem única",
    );
    expect(() => resolveCorsOrigin("ftp://localhost:3001")).toThrow(
      "CORS_ORIGIN deve conter uma origem única",
    );
  });
});
