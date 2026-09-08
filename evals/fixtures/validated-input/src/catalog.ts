export type CommandHandler = () => string;

export class CommandCatalog {
  private readonly commands = new Map<string, CommandHandler>();
  private readonly aliases = new Map<string, string>();

  register(name: string, handler: CommandHandler): void {
    this.commands.set(name, handler);
  }

  registerAlias(alias: string, target: string): void {
    this.aliases.set(alias, target);
  }

  resolve(name: string): CommandHandler | undefined {
    return this.commands.get(this.aliases.get(name) ?? name);
  }
}
