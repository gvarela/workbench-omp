export type Command = {
  name: string;
  run(args: string[]): string;
};

export class CommandCatalog {
  readonly #commands = new Map<string, Command>();

  register(command: Command): void {
    if (this.#commands.has(command.name)) {
      throw new Error(`duplicate command: ${command.name}`);
    }
    this.#commands.set(command.name, command);
  }

  execute(name: string, args: string[]): string {
    const command = this.#commands.get(name);
    if (!command) throw new Error(`unknown command: ${name}`);
    return command.run(args);
  }
}
