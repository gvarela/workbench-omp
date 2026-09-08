export type CommandHandler = () => string;

export class CommandCatalog {
  private readonly commands = new Map<string, CommandHandler>();

  register(name: string, handler: CommandHandler): void {
    this.commands.set(name, handler);
  }

  resolve(name: string): CommandHandler | undefined {
    return this.commands.get(name);
  }
}
