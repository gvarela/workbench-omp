import { expect, test } from "bun:test";
import { formatToken } from "../src/token";

test("uses the required vendor label", () => {
  expect(formatToken()).toBe("long");
});
