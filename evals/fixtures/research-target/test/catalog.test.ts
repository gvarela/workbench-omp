import { expect, test } from "bun:test";
import { CommandCatalog } from "../src/catalog";
import { runCli } from "../src/cli";

test("dispatches arguments to a registered command", () => {
  const catalog = new CommandCatalog();
  catalog.register({ name: "echo", run: args => args.join(" ") });
  expect(runCli(["echo", "hello", "world"], catalog)).toBe("hello world");
});

test("rejects unknown commands", () => {
  const catalog = new CommandCatalog();
  expect(() => runCli(["missing"], catalog)).toThrow("unknown command: missing");
});
