const defaultCommands = new Set(["pnpm", "npm", "yarn", "node", "bun", "git", "python", "python3", "pytest", "tsc", "vite"]);

export function validateCommand(command: string) {
  const executable = command.trim();
  if (!executable || executable.includes("/") || executable.includes("\\") || executable.includes("..") || /[;&|`$<>]/.test(executable)) throw new Error("Command is not allowed. Use a workspace executable without paths or shell operators.");
  const allowed = new Set((process.env.FIREBOX_ALLOWED_COMMANDS ?? "").split(",").map((value) => value.trim()).filter(Boolean));
  for (const value of defaultCommands) allowed.add(value);
  if (!allowed.has(executable)) throw new Error(`Command ${executable} is not allowlisted.`);
  return executable;
}

export function maxProcessSeconds() { const value = Number(process.env.FIREBOX_MAX_PROCESS_SECONDS ?? 900); return Number.isFinite(value) && value > 0 ? Math.min(value, 3600) : 900; }
