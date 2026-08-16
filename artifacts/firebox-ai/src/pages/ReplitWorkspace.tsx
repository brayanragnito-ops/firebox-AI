import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  Bot, ChevronDown, ChevronRight, Code2, Command, ExternalLink, FileCode2,
  Folder, FolderOpen, GitBranch, LayoutDashboard, Maximize2, MessageSquare,
  Play, Plus, RefreshCw, Search, Settings2, Sparkles, SquareTerminal, X, Zap
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
  const [rightOpen, setRightOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);

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
      .then((body) => body && setTerminalOutput(body.output ?? ""));
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

  const runTerminal = async () => {
    if (!projectId || !command.trim()) return;
    const response = await fetch(`/api/projects/${projectId}/processes`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: command.trim(), args: args.trim() ? args.trim().split(/\s+/) : [] })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return setError(body.error ?? "Could not start terminal process.");
    setProcessId(body.id);
    setTerminalOutput("");
  };

  return <main className="flex h-[calc(100dvh-66px)] min-h-[680px] flex-col overflow-hidden bg-[#0b0f14] text-white">
    <header className="flex h-12 shrink-0 items-center border-b border-white/10 bg-[#10151c] px-3">
      <div className="flex items-center gap-2 border-r border-white/10 pr-4"><div className="grid size-7 place-items-center rounded-md bg-emerald-400 text-[#08100b]"><Zap size={15} fill="currentColor" /></div><span className="text-sm font-bold tracking-tight">firebox</span><span className="text-sm font-semibold text-emerald-400">AI</span></div>
      <div className="ml-4 flex items-center gap-2 text-xs text-white/70"><span className="text-white/35">Workspace</span><button className="flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-white/5"><span>{project?.name ?? "Select project"}</span><ChevronDown size={13} /></button></div>
      <div className="ml-auto flex items-center gap-2"><span className={cx("size-2 rounded-full", run?.status === "running" ? "bg-amber-400" : "bg-emerald-400")} /><span className="text-[11px] text-white/55">{run?.status === "running" ? "Agent working" : "Workspace ready"}</span><button className="rounded-md p-2 text-white/45 hover:bg-white/5" aria-label="Settings"><Settings2 size={15} /></button></div>
    </header>
    <div className="flex min-h-0 flex-1">
      <aside className="flex w-12 shrink-0 flex-col items-center gap-2 border-r border-white/10 bg-[#0d1218] py-3"><button className="rounded-md bg-emerald-400/15 p-2 text-emerald-300"><Code2 size={17} /></button><button className="rounded-md p-2 text-white/35 hover:bg-white/5 hover:text-white"><Search size={17} /></button><button className="rounded-md p-2 text-white/35 hover:bg-white/5 hover:text-white"><GitBranch size={17} /></button><button className="mt-auto rounded-md p-2 text-white/35 hover:bg-white/5 hover:text-white"><Command size={17} /></button></aside>
      <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-[#11171f]"><div className="flex h-11 items-center justify-between border-b border-white/10 px-3"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-white/45">Explorer</span><button className="rounded p-1 text-white/35 hover:bg-white/5"><Plus size={14} /></button></div><div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-[11px] text-white/70"><FolderOpen size={14} className="text-emerald-300" />{project?.name ?? "No project"}</div><div className="min-h-0 flex-1 overflow-auto py-2">{files.length ? files.map((file) => <button key={file.path} onClick={() => file.type === "file" && void openFile(file.path)} className={cx("flex w-full items-center gap-2 px-4 py-1.5 text-left text-[11px]", activeFile === file.path ? "bg-emerald-400/10 text-emerald-200" : "text-white/55 hover:bg-white/5 hover:text-white")}>{file.type === "directory" ? <Folder size={14} className="text-amber-300/70" /> : <FileCode2 size={14} className="text-sky-300/70" />}<span className="truncate">{file.path}</span></button>) : <div className="px-4 py-6 text-[11px] leading-5 text-white/30">Your project files will appear here.</div>}</div><div className="border-t border-white/10 p-3"><button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-[11px] text-white/45 hover:bg-white/5 hover:text-white"><LayoutDashboard size={14} />Project overview</button></div></aside>
      <section className="flex min-w-0 flex-1 flex-col bg-[#0b1016]"><div className="flex h-10 shrink-0 items-center border-b border-white/10 bg-[#0f151d]"><div className="flex h-full items-center gap-2 border-r border-white/10 bg-[#0b1016] px-3 text-[11px] text-white/75">{activeFile ? <FileCode2 size={13} className="text-sky-300" /> : <Code2 size={13} />}<span>{activeFile || "Welcome"}</span>{activeFile && <button onClick={() => { setActiveFile(""); setContent(""); }} className="ml-2 text-white/30 hover:text-white"><X size={12} /></button>}</div><div className="ml-auto flex items-center gap-1 px-2"><button onClick={() => setPreviewOpen((value) => !value)} className="rounded p-1.5 text-white/40 hover:bg-white/5"><Maximize2 size={14} /></button><button className="rounded p-1.5 text-white/40 hover:bg-white/5"><ExternalLink size={14} /></button></div></div><div className="min-h-0 flex-1 overflow-auto">{activeFile ? <textarea value={content} onChange={(event) => setContent(event.target.value)} spellCheck={false} className="h-full min-h-[420px] w-full resize-none border-0 bg-[#0b1016] p-5 font-mono text-[12px] leading-6 text-slate-200 outline-none" /> : <div className="grid h-full place-items-center p-8"><div className="max-w-md text-center"><div className="mx-auto grid size-16 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300"><Sparkles size={28} /></div><h1 className="mt-5 text-xl font-semibold">Build in the cloud</h1><p className="mt-2 text-sm leading-6 text-white/40">Choose a file from Explorer or ask an Agent to inspect and improve your project.</p></div></div>}</div>{terminalOpen && <div className="h-44 shrink-0 border-t border-white/10 bg-[#080c11]"><div className="flex h-9 items-center gap-4 border-b border-white/10 px-3"><button className="flex items-center gap-2 text-[11px] font-semibold text-white/75"><SquareTerminal size={14} className="text-emerald-300" />Console</button><span className="text-[10px] text-white/25">{processId ? "Process running" : "Ready"}</span><button onClick={() => setTerminalOutput("")} className="ml-auto rounded p-1 text-white/35 hover:bg-white/5"><RefreshCw size={13} /></button></div><div className="flex gap-2 p-3"><input value={command} onChange={(event) => setCommand(event.target.value)} className="w-20 rounded border border-white/10 bg-[#111820] px-2 py-1.5 font-mono text-[11px] text-white outline-none" placeholder="npm" /><input value={args} onChange={(event) => setArgs(event.target.value)} className="min-w-0 flex-1 rounded border border-white/10 bg-[#111820] px-2 py-1.5 font-mono text-[11px] text-white outline-none" placeholder="run dev" /><button onClick={() => void runTerminal()} className="rounded bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-[#07100b]"><Play size={13} /></button></div><pre className="max-h-20 overflow-auto px-3 pb-3 font-mono text-[10px] leading-5 text-emerald-200/75">{terminalOutput || "$ Console ready"}</pre></div>}</section>
      {previewOpen && <section className="hidden w-[31%] min-w-[270px] border-l border-white/10 bg-[#0f151d] xl:flex xl:flex-col"><div className="flex h-10 items-center justify-between border-b border-white/10 px-3"><span className="flex items-center gap-2 text-[11px] font-semibold text-white/70"><LayoutDashboard size={14} className="text-violet-300" />Preview</span><span className="rounded bg-white/5 px-2 py-1 text-[10px] text-white/30">Live</span></div><div className="min-h-0 flex-1 bg-[#f8fafc]"><div className="grid h-full place-items-center p-8 text-center text-slate-500"><div><div className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-100"><Play size={20} /></div><p className="mt-3 text-xs font-semibold">Run your project to preview it here</p><p className="mt-1 text-[11px]">The live URL will appear when the process reports one.</p></div></div></div></section>}
      {rightOpen && <aside className="hidden w-[320px] shrink-0 border-l border-white/10 bg-[#11171f] lg:flex lg:flex-col"><div className="flex h-11 items-center justify-between border-b border-white/10 px-3"><span className="flex items-center gap-2 text-[11px] font-semibold text-white/75"><Bot size={15} className="text-emerald-300" />Agent</span><span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] font-bold text-emerald-300">{agent}</span></div><div className="min-h-0 flex-1 overflow-auto p-3">{activities.length ? activities.slice(-12).map((item) => <div key={item.id} className="mb-3 flex gap-2"><div className={cx("mt-1 size-1.5 shrink-0 rounded-full", item.status === "failed" ? "bg-red-400" : item.status === "active" ? "bg-amber-300" : "bg-emerald-300")} /><div><p className="text-[11px] text-white/70">{item.label}</p><p className="mt-0.5 text-[10px] leading-4 text-white/30">{item.detail}</p></div></div>) : <div className="py-8 text-center text-[11px] text-white/30">Agent activity will stream here.</div>}</div><div className="border-t border-white/10 p-3"><div className="mb-2 flex items-center gap-2"><MessageSquare size={14} className="text-violet-300" /><span className="text-[10px] font-bold uppercase tracking-[.14em] text-white/40">Build request</span></div><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void runAgent(); }} className="h-24 w-full resize-none rounded-lg border border-white/10 bg-[#0b1016] p-3 text-[11px] leading-5 text-white outline-none placeholder:text-white/25 focus:border-emerald-300/50" placeholder="Ask Firebox to build, fix, test, or explain…" /><div className="mt-2 flex items-center gap-2"><select value={agent} onChange={(event) => setAgent(event.target.value)} className="min-w-0 flex-1 rounded border border-white/10 bg-[#0b1016] px-2 py-2 text-[10px] text-white/60 outline-none"><option value="spark">Spark · Fast</option><option value="forge">Forge · Full-stack</option><option value="nexus">Nexus · Advanced</option><option value="titan">Titan · Autonomous</option></select><button onClick={() => void runAgent()} disabled={!prompt.trim() || run?.status === "running"} className="rounded bg-emerald-500 px-3 py-2 text-[10px] font-bold text-[#07100b] disabled:opacity-40">{run?.status === "running" ? "Working" : "Run"}</button></div>{run?.error && <p className="mt-2 text-[10px] text-red-300">{run.error}</p>}{error && <p className="mt-2 text-[10px] text-amber-300">{error}</p>}</div></aside>}
    </div>
  </main>;
}

export { ReplitWorkspace };
