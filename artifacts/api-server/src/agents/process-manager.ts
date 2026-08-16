import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { maxProcessSeconds } from "./security";

export type ManagedProcess = { id: string; pid: number | undefined; command: string; args: string[]; status: "running" | "exited" | "failed"; output: string; stderr: string; startedAt: string; exitCode: number | null };
const processes = new Map<string, { child: ChildProcessWithoutNullStreams; record: ManagedProcess }>();

export function startManagedProcess(command: string, args: string[], cwd: string): ManagedProcess {
  const child = spawn(command, args, { cwd, shell: false, env: process.env });
  const record: ManagedProcess = { id: crypto.randomUUID(), pid: child.pid, command, args, status: "running", output: "", stderr: "", startedAt: new Date().toISOString(), exitCode: null };
  const append = (chunk: Buffer) => { record.output = `${record.output}${chunk.toString()}`.slice(-200_000); };
  const appendError = (chunk: Buffer) => { record.stderr = `${record.stderr}${chunk.toString()}`.slice(-100_000); record.output = `${record.output}${chunk.toString()}`.slice(-200_000); };
  child.stdout.on("data", append);
  child.stderr.on("data", appendError);
  child.once("error", (error) => { record.status = "failed"; appendError(Buffer.from(error.message)); });
  const timeout = setTimeout(() => { if (record.status === "running") { record.status = "failed"; record.stderr = `${record.stderr}\\nProcess stopped after the configured execution limit.`.slice(-100_000); record.output = `${record.output}\\nProcess stopped after the configured execution limit.`.slice(-200_000); child.kill("SIGTERM"); } }, maxProcessSeconds() * 1000);
  child.once("exit", (code) => { clearTimeout(timeout); record.status = code === 0 ? "exited" : "failed"; record.exitCode = code; });
  processes.set(record.id, { child, record });
  return record;
}

export function getManagedProcess(id: string): ManagedProcess | null { return processes.get(id)?.record ?? null; }
export function getManagedProcessOutput(id: string): string { const process = processes.get(id); if (!process) throw new Error("Process not found"); return process.record.output; }
export function stopManagedProcess(id: string): ManagedProcess { const process = processes.get(id); if (!process) throw new Error("Process not found"); if (process.record.status === "running") process.child.kill("SIGTERM"); return process.record; }
