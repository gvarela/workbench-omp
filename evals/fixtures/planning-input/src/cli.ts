import { CommandCatalog } from "./catalog";

export function runCli(argv: string[], catalog: CommandCatalog): string {
  const [name, ...args] = argv;
  if (!name) throw new Error("command name required");
  return catalog.execute(name, args);
}
