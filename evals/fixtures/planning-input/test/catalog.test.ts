import { expect, test } from "bun:test";
import { CommandCatalog } from "../src/catalog";
import { runCli } from "../src/cli";

test("dispatches registered commands", () => {
  const catalog = new CommandCatalog();
  catalog.register({ name: "echo", run: args => args.join(" ") });
  expect(runCli(["echo", "hello"], catalog)).toBe("hello");
});

test("reports unknown commands", () => {
  const catalog = new CommandCatalog();
  expect(() => runCli(["missing"], catalog)).toThrow("unknown command: missing");
});
