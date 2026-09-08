export interface CommandHelp {
  name: string;
  description: string;
}

export function formatHelp(commands: readonly CommandHelp[]): string {
  return commands.map(command => command.name).join("\n");
}
