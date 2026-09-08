import { expect, test } from "bun:test";
import { CommandCatalog } from "../src/catalog";
import { runCli } from "../src/cli";

test("dispatches arguments to a registered command", () => {
  const catalog = new CommandCatalog();
  catalog.register({ name: "echo", run: args => args.join(" ") });
  expect(runCli(["echo", "hello"], catalog)).toBe("hello");
});

test("rejects unknown commands", () => {
  expect(() => runCli(["missing"], new CommandCatalog())).toThrow("unknown command: missing");
});
