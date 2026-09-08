import { expect, test } from "bun:test";
import { increment } from "../src/counter";

test("increments by one", () => {
  expect(increment(4)).toBe(5);
});
