import { expect, test } from "bun:test";
import { formatHelp } from "../src/help";

test("lists command names", () => {
  expect(formatHelp([{ name: "open", description: "Open a file" }])).toBe("open");
});
