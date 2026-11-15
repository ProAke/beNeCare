import { readFile, writeFile, mkdir, access, constants } from "node:fs/promises";
import { join } from "node:path";

const CONFIG_DIR = join(process.cwd(), "data");
const CONFIG_FILE = join(CONFIG_DIR, "install-config.json");

export interface InstallConfig {
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  admin: {
    email: string;
    password: string;
    fullName: string;
  };
  company: {
    name: string;
    taxId?: string;
    contactEmail: string;
    contactPhone?: string;
  };
  lineOa?: {
    channelId?: string;
    channelSecret?: string;
    channelAccessToken?: string;
  };
  version: string;
  installedAt: string;
}

export async function getInstallConfig(): Promise<InstallConfig | null> {
  try {
    await access(CONFIG_FILE, constants.R_OK);
    const content = await readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function saveInstallConfig(config: InstallConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

export async function isInstalled(): Promise<boolean> {
  const config = await getInstallConfig();
  return config !== null;
}
