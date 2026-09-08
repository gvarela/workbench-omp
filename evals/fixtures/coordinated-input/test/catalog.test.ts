import { expect, test } from "bun:test";
import { CommandCatalog } from "../src/catalog";

test("resolves a canonical command", () => {
  const catalog = new CommandCatalog();
  const handler = () => "opened";
  catalog.register("open", handler);
  expect(catalog.resolve("open")).toBe(handler);
});
