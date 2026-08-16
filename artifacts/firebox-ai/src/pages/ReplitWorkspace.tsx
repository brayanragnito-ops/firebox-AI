import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  Bot, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Code2, FileCode2,
  Folder, GitBranch, Maximize2, MessageSquare, MoreHorizontal, Play, Plus,
  Search, Send, Settings2, Sparkles, SquareTerminal, Terminal, Upload, Wrench, X, Zap
} from "lucide-react";

type Project = { id: string; name: string; status?: string; framework?: string | null };
type FileEntry = { path: string; type: "file" | "directory" };
type Activity = { id: string; label: string; detail?: string | null; status: string; timestamp?: string };
type Run = { id: string; status: string; error?: string | null; agent?: string; tokensUsed?: number };

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

export default function ReplitWorkspace() {
  const params = useParams<{ projectId?: string }>();
  const [, navigate] = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(params.projectId ?? "");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [activeFile, setActiveFile] = useState("");
  const [content, setContent] = useState("");
  const [prompt, setPrompt] = useState("");
  const [agent, setAgent] = useState("spark");
  const [run, setRun] = useState<Run | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [command, setCommand] = useState("npm");
  const [args, setArgs] = useState("run dev");
  const [terminalOutput, setTerminalOutput] = useState("");
  const [processId, setProcessId] = useState("");
  const [error, setError] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const project = useMemo(() => projects.find((item) => item.id === projectId), [projects, projectId]);

  useEffect(() => {
    fetch("/api/projects", { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then((items: Project[]) => {
        setProjects(items);
        if (!projectId && items[0]) setProjectId(items[0].id);
      })
      .catch(() => setError("Could not load projects."));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    if (params.projectId !== projectId) navigate(`/workspace/${projectId}`);
    const refreshFiles = () => fetch(`/api/projects/${projectId}/files`, { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then((items: FileEntry[]) => setFiles(items))
      .catch(() => setError("Could not load workspace files."));
    refreshFiles();
    const timer = window.setInterval(refreshFiles, 5000);
    return () => window.clearInterval(timer);
  }, [projectId, params.projectId, navigate]);

  useEffect(() => {
    if (!projectId) return;
    const refresh = () => fetch(`/api/projects/${projectId}/activity`, { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then((items: Activity[]) => setActivities(items));
    refresh();
    const timer = window.setInterval(refresh, 1800);
    return () => window.clearInterval(timer);
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !run?.id || run.status !== "running") return;
    const refresh = () => fetch(`/api/projects/${projectId}/agent-runs/${run.id}`, { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((nextRun) => nextRun && setRun(nextRun));
    refresh();
    const timer = window.setInterval(refresh, 1600);
    return () => window.clearInterval(timer);
  }, [projectId, run?.id, run?.status]);

  useEffect(() => {
    if (!projectId || !processId) return;
    const refresh = () => fetch(`/api/projects/${projectId}/processes/${processId}/output`, { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((body) => {
        if (!body) return;
        const output = body.output ?? "";
        setTerminalOutput(output);
        const match = output.match(/https?:\/\/[^\s)]+/);
        if (match) setPreviewUrl(match[0]);
      });
    refresh();
    const timer = window.setInterval(refresh, 1200);
    return () => window.clearInterval(timer);
  }, [projectId, processId]);

  const openFile = async (path: string) => {
    setActiveFile(path);
    const response = await fetch(`/api/projects/${projectId}/files/content?path=${encodeURIComponent(path)}`, { credentials: "include" });
    const body = await response.json().catch(() => ({}));
    if (response.ok) setContent(body.content ?? "");
    else setError(body.error ?? "Could not open file.");
  };

  const runAgent = async () => {
    if (!projectId || !prompt.trim() || run?.status === "running") return;
    setError("");
    const response = await fetch(`/api/projects/${projectId}/agent-runs`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt.trim(), agent })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return setError(body.error ?? "Could not start Agent.");
    setRun(body);
    setPrompt("");
  };

  const runProject = async () => {
    if (!projectId || !command.trim()) return;
    setError("");
    const response = await fetch(`/api/projects/${projectId}/processes`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: command.trim(), args: args.trim() ? args.trim().split(/\s+/) : [] })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return setError(body.error ?? "Could not start project.");
    setProcessId(body.id);
    setTerminalOutput("");
    setTerminalOpen(true);
  };

  const stopProject = async () => {
    if (!projectId || !processId) return;
    await fetch(`/api/projects/${projectId}/processes/${processId}`, { method: "DELETE", credentials: "include" });
    setProcessId("");
  };

  return <main className="flex h-[calc(100dvh-66px)] min-h-[680px] flex-col overflow-hidden bg-[#1f1f1f] text-[#e8e8e8]">
    <header className="flex h-12 shrink-0 items-center border-b border-black/60 bg-[#1d1d1d] px-3 shadow-[0_1px_0_rgba(255,255,255,.04)]">
      <div className="flex items-center gap-2 border-r border-white/10 pr-4"><div className="grid size-7 place-items-center rounded-md bg-[#f04e3e] text-white"><Zap size={15} fill="currentColor" /></div><button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm font-semibold text-white/90">{project?.name ?? "firebox-AI"}<ChevronDown size={14} className="text-white/45" /></button></div>
      <div className="ml-4 flex items-center gap-2"><button className="rounded p-2 text-white/55 hover:bg-white/10"><Code2 size={16} /></button><button className="rounded p-2 text-white/55 hover:bg-white/10"><Terminal size={16} /></button><button onClick={() => void runProject()} className="rounded p-2 text-emerald-400 hover:bg-emerald-400/10"><Play size={16} fill="currentColor" /></button><div className="ml-2 h-1.5 w-16 rounded-full bg-sky-500/80" /><span className="text-[11px] text-white/45">100%</span><span className="text-[11px] text-amber-300">△</span></div>
      <div className="ml-6 flex items-center gap-1"><button onClick={() => setToolsOpen((value) => !value)} className="flex items-center gap-2 rounded px-3 py-2 text-xs text-white/65 hover:bg-white/10"><Wrench size={14} />Tools</button><button onClick={() => setPreviewUrl("")} className="flex items-center gap-2 rounded px-3 py-2 text-xs text-white/65 hover:bg-white/10"><MonitorIcon />Preview</button><button className="rounded px-2 py-2 text-white/50 hover:bg-white/10"><Plus size={15} /></button></div>
      <div className="ml-auto flex items-center gap-3"><button className="rounded p-2 text-white/55 hover:bg-white/10"><Search size={16} /></button><button className="rounded px-2 py-1.5 text-xs text-white/70 hover:bg-white/10">Invite</button><button onClick={() => navigate("/deploy")} className="rounded-md bg-[#1683e8] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#2d96f3]">Publish</button><button className="rounded p-2 text-white/50 hover:bg-white/10"><Settings2 size={16} /></button></div>
    </header>
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-12 shrink-0 flex-col items-center gap-2 border-r border-black/70 bg-[#202020] py-3"><button className="rounded-md bg-white/10 p-2 text-white"><Sparkles size={17} /></button><button onClick={() => setToolsOpen(true)} className="rounded-md p-2 text-white/45 hover:bg-white/10"><Code2 size={17} /></button><button className="rounded-md p-2 text-white/45 hover:bg-white/10"><GitBranch size={17} /></button><button className="mt-auto rounded-md p-2 text-white/45 hover:bg-white/10"><Settings2 size={17} /></button></aside>
      <aside className="flex w-[390px] shrink-0 flex-col border-r border-black/70 bg-[#202020]"><div className="flex h-12 items-center justify-between border-b border-white/[.06] px-4"><div className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-md bg-violet-500/20 text-violet-300"><Sparkles size={14} /></span><div><p className="text-[11px] font-semibold text-white/85">Active task</p><p className="text-[10px] text-white/45">{run?.status === "running" ? "Agent is working" : "Set up the imported project"}</p></div></div><div className="flex items-center gap-1 text-white/35"><button className="rounded p-1 hover:bg-white/10"><FileCode2 size={14} /></button><button className="rounded p-1 hover:bg-white/10"><MoreHorizontal size={14} /></button></div></div><div className="min-h-0 flex-1 overflow-auto px-5 py-4"><div className="mb-5 flex items-start gap-2 text-[11px] text-white/75"><span className="mt-1 size-1.5 rounded-full bg-white/70" />Monorepo: managed with pnpm workspaces</div><div className="mb-5 rounded-lg border border-white/[.08] bg-[#262626] p-3"><p className="text-[11px] font-semibold text-white/85">What’s your goal?</p><p className="mt-1 text-[11px] text-white/40">Make specific changes or add features</p></div>{activities.length ? activities.slice(-12).map((item) => <div key={item.id} className="mb-4 flex gap-3"><div className={cx("mt-1.5 size-2 shrink-0 rounded-full", item.status === "failed" ? "bg-red-400" : item.status === "active" ? "bg-amber-300" : "bg-emerald-400")} /><div><p className="text-[11px] text-white/75">{item.label}</p>{item.detail && <p className="mt-1 text-[10px] leading-4 text-white/38">{item.detail}</p>}</div></div>) : <div className="space-y-4 text-[11px] text-white/45"><div className="flex gap-3"><span className="mt-1 size-2 rounded-full border border-white/30" />Preparing your workspace</div><div className="flex gap-3"><span className="mt-1 size-2 rounded-full border border-white/30" />Waiting for your first task</div></div>}{run?.error && <div className="mt-5 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-[10px] leading-4 text-red-200"><CircleAlert size={13} className="mb-1" />{run.error}</div>}</div><div className="border-t border-white/[.08] p-4"><div className="mb-3 flex items-center gap-2 text-[11px] text-white/45"><Bot size={14} className="text-violet-300" />Agent · <select value={agent} onChange={(event) => setAgent(event.target.value)} className="bg-transparent text-white/70 outline-none"><option className="bg-[#242424]" value="spark">Spark</option><option className="bg-[#242424]" value="forge">Forge</option><option className="bg-[#242424]" value="nexus">Nexus</option><option className="bg-[#242424]" value="titan">Titan</option></select></div><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void runAgent(); }} className="h-24 w-full resize-none rounded-lg border border-white/[.09] bg-[#181818] p-3 text-[12px] leading-5 text-white outline-none placeholder:text-white/35 focus:border-violet-400/60" placeholder="Message Agent…" /><div className="mt-2 flex items-center justify-between"><div className="flex items-center gap-2 text-white/35"><button className="rounded p-1 hover:bg-white/10"><Plus size={15} /></button><button className="rounded p-1 hover:bg-white/10"><MessageSquare size={15} /></button><span className="text-[10px]">{run?.status === "running" ? "Working…" : "Ready"}</span></div><button onClick={() => void runAgent()} disabled={!prompt.trim() || run?.status === "running"} className="rounded-md bg-[#f0f0f0] p-2 text-[#1b1b1b] disabled:opacity-35"><Send size={15} /></button></div></div></aside>
      <section className="relative flex min-w-0 flex-1 flex-col bg-[#242424]">{toolsOpen && <div className="absolute left-4 top-4 z-30 flex max-h-[calc(100%-32px)] w-[340px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1d1d1d] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><span className="text-xs font-semibold">Files & editor</span><button onClick={() => setToolsOpen(false)} className="text-white/40"><X size={15} /></button></div><div className="max-h-44 overflow-auto border-b border-white/10 py-2">{files.map((file) => <button key={file.path} onClick={() => file.type === "file" && void openFile(file.path)} className={cx("flex w-full items-center gap-2 px-4 py-1.5 text-left text-[11px]", activeFile === file.path ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5")}>{file.type === "directory" ? <Folder size={13} /> : <FileCode2 size={13} />}{file.path}</button>)}{!files.length && <p className="px-4 py-3 text-[10px] text-white/35">No files found yet.</p>}</div>{activeFile && <textarea value={content} onChange={(event) => setContent(event.target.value)} spellCheck={false} className="min-h-64 flex-1 resize-none bg-[#151515] p-4 font-mono text-[11px] leading-5 text-slate-200 outline-none" />}</div>}{previewUrl ? <iframe title="Live application preview" src={previewUrl} className="h-full w-full border-0 bg-white" /> : <div className="grid h-full place-items-center"><div className="text-center"><div className="mx-auto mb-4 grid size-16 place-items-center rounded-full border border-white/15 text-white/65"><SquareTerminal size={28} /></div><h1 className="text-xl font-medium text-white/85">Your app is not running</h1><p className="mt-3 text-sm text-white/45"><button onClick={() => void runProject()} className="mr-1 inline-flex items-center gap-1 rounded-md bg-[#25a35a] px-3 py-1.5 text-xs font-semibold text-white"><Play size={12} fill="currentColor" />Run</button>to preview your app.</p></div></div>}{terminalOpen && <div className="absolute bottom-4 left-4 right-4 z-20 rounded-xl border border-white/10 bg-[#161616] shadow-2xl"><div className="flex items-center gap-3 border-b border-white/10 px-4 py-2"><Terminal size={14} className="text-emerald-300" /><span className="text-[11px] font-semibold">Console</span><span className="text-[10px] text-white/35">{processId ? "Process active" : "Ready"}</span><button onClick={() => setTerminalOpen(false)} className="ml-auto text-white/35"><ChevronDownIcon /></button></div><div className="flex gap-2 p-3"><input value={command} onChange={(event) => setCommand(event.target.value)} className="w-20 rounded border border-white/10 bg-[#0e0e0e] px-2 py-1.5 font-mono text-[11px] text-white outline-none" /><input value={args} onChange={(event) => setArgs(event.target.value)} className="min-w-0 flex-1 rounded border border-white/10 bg-[#0e0e0e] px-2 py-1.5 font-mono text-[11px] text-white outline-none" /><button onClick={() => void runProject()} className="rounded bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-[#0b1b10]">Run</button>{processId && <button onClick={() => void stopProject()} className="rounded border border-red-400/30 px-3 py-1.5 text-[11px] text-red-200">Stop</button>}</div><pre className="max-h-28 overflow-auto px-3 pb-3 font-mono text-[10px] leading-5 text-emerald-200/75">{terminalOutput || "$ Console ready"}</pre></div>}</section>
    </div>
    {error && <div className="absolute bottom-4 right-4 z-40 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-[11px] text-red-200">{error}</div>}
  </main>;
}

function MonitorIcon() { return <span className="inline-block size-3.5 rounded border border-current" />; }
function ChevronDownIcon() { return <ChevronDown size={14} />; }

export { ReplitWorkspace };
