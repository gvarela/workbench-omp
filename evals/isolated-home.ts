// Isolated OMP home for eval processes. A fresh HOME hides the user's plugin
// registries, settings, and sessions so the extension is loaded exactly once
// (`-e`) and skills come only from this checkout. The checkout is staged as
// `<home>/plugins/<name>` because `--plugin-dir` names commands after the
// directory basename; `<name>` is the marketplace catalog name so commands
// resolve as `<name>:<command>` exactly like a marketplace install.
import { Database } from "bun:sqlite";
import { mkdir, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";

export const root = resolve(import.meta.dir, "..");

export interface IsolatedHome {
  home: string;
  pluginName: string;
  pluginDir: string;
  dispose(): Promise<void>;
}

export async function marketplacePluginName(): Promise<string> {
  const catalog = JSON.parse(await readFile(resolve(root, ".omp-plugin", "marketplace.json"), "utf8")) as {
    plugins?: Array<{ name?: string; source?: string }>;
  };
  const entry = catalog.plugins?.find(plugin => plugin.source === "./");
  if (!entry?.name) throw new Error(".omp-plugin/marketplace.json: no plugin entry with source ./");
  return entry.name;
}

/**
 * Consistent copy of a live SQLite database (WAL contents included) without
 * touching the source. OMP 18.x keeps credentials and settings in
 * `~/.omp/agent/agent.db` and the model cache in `models.db`; there is no
 * `auth.json`.
 */
function snapshotDatabase(source: string, destination: string): void {
  const db = new Database(source, { readonly: true });
  try {
    db.run(`VACUUM INTO '${destination.replaceAll("'", "''")}'`);
  } finally {
    db.close();
  }
}

export async function createIsolatedHome(options: { seedCredentials: boolean }): Promise<IsolatedHome> {
  const home = await mkdtemp(join(tmpdir(), "wb-eval-home-"));
  const agentDir = join(home, ".omp", "agent");
  await mkdir(agentDir, { recursive: true });
  const pluginName = await marketplacePluginName();
  const pluginDir = join(home, "plugins", pluginName);
  await mkdir(join(home, "plugins"), { recursive: true });
  await symlink(root, pluginDir, "dir");
  if (options.seedCredentials) {
    for (const name of ["agent.db", "models.db"]) {
      const source = join(homedir(), ".omp", "agent", name);
      if (await Bun.file(source).exists()) snapshotDatabase(source, join(agentDir, name));
    }
  }
  return {
    home,
    pluginName,
    pluginDir,
    dispose: () => rm(home, { recursive: true, force: true }),
  };
}

/** Child environment: isolated HOME, no inherited profile or agent-dir override. */
export function isolatedEnv(home: string): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env, HOME: home };
  delete env.PI_CODING_AGENT_DIR;
  delete env.PI_PROFILE;
  delete env.OMP_PROFILE;
  delete env.PI_CONFIG_DIR;
  return env;
}
