import { expect, test } from "bun:test";
import { CommandCatalog } from "../src/catalog";

test("resolves canonical commands", () => {
  const catalog = new CommandCatalog();
  const handler = () => "opened";
  catalog.register("open", handler);
  expect(catalog.resolve("open")).toBe(handler);
});

test("resolves aliases to the canonical handler by identity", () => {
  const catalog = new CommandCatalog();
  const handler = () => "opened";
  catalog.register("open", handler);
  catalog.registerAlias("o", "open");
  expect(catalog.resolve("o")).toBe(handler);
});
