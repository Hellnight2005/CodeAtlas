"use client";

import React, { useState, useEffect } from "react";
import { FolderGit2, Play, RefreshCw, Layers, FileCode, CheckCircle2, Clock, Database, Cpu, Activity, AlertCircle, FolderTree } from "lucide-react";
import { useProject } from "../../context/ProjectContext";

export default function ProjectsPage() {
    const { projects, activeProject, setActiveProject, refreshProjects, isLoading } = useProject();
    const [indexingId, setIndexingId] = useState<string | null>(null);
    const [indexingStep, setIndexingStep] = useState<string>("Idle");
    const [stats, setStats] = useState<any>(null);
    const [tree, setTree] = useState<any[]>([]);

    const [showAllProjects, setShowAllProjects] = useState<boolean>(false);

    useEffect(() => {
        if (!activeProject) return;
        const fetchProjectStats = async () => {
            try {
                const res = await fetch(`http://localhost:5001/api/projects/${activeProject.id}/stats`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
                const treeRes = await fetch(`http://localhost:5001/api/projects/${activeProject.id}/tree`);
                if (treeRes.ok) {
                    const treeData = await treeRes.json();
                    setTree(treeData.files || []);
                }
            } catch (err) {
                console.warn("Failed to fetch project stats:", err);
            }
        };
        fetchProjectStats();
    }, [activeProject]);

    const handleReindex = async (repoPath: string, projId: string) => {
        setIndexingId(projId);
        setIndexingStep("Scanning Repository...");
        try {
            setTimeout(() => setIndexingStep("Parsing File ASTs..."), 1000);
            setTimeout(() => setIndexingStep("Extracting Symbols & Signatures..."), 2500);
            setTimeout(() => setIndexingStep("Building Relationships & Calls..."), 4000);
            setTimeout(() => setIndexingStep("Updating Graph Storage..."), 5500);

            await fetch("http://localhost:5001/api/index", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repoPath, repoId: projId })
            });

            setIndexingStep("Completed");
            await refreshProjects();
        } catch (err) {
            console.error("Indexing failed:", err);
            setIndexingStep("Failed");
        } finally {
            setTimeout(() => {
                setIndexingId(null);
                setIndexingStep("Idle");
            }, 2000);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 font-mono text-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center">
                        <FolderGit2 className="w-5 h-5 mr-2 text-blue-400" />
                        Repository Intelligence Dashboard
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Local-first code intelligence, incremental AST indexing, and structural code graph.
                    </p>
                </div>
                <button
                    onClick={refreshProjects}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    <span>Refresh Data</span>
                </button>
            </div>

            {/* Active Project Overview Card */}
            {activeProject && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">PROJECT OVERVIEW</span>
                            <h2 className="text-lg font-bold text-white mt-0.5">{activeProject.name}</h2>
                            <span className="text-[10px] text-slate-400 font-mono">{activeProject.path}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] rounded font-bold flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                {activeProject.status || "Ready"}
                            </span>
                            <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] rounded font-bold flex items-center">
                                <Database className="w-3 h-3 mr-1" />
                                Graph DB: Connected
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 pt-3 border-t border-slate-800/80">
                        <div className="bg-slate-950 p-3 rounded text-center">
                            <div className="text-[10px] text-slate-500 font-bold">TOTAL FILES</div>
                            <div className="text-base font-bold text-slate-200 mt-1">{stats?.files || 0}</div>
                        </div>
                        <div className="bg-slate-950 p-3 rounded text-center">
                            <div className="text-[10px] text-slate-500 font-bold">SYMBOLS EXTRACTED</div>
                            <div className="text-base font-bold text-emerald-400 mt-1">{stats?.totalNodes || 0}</div>
                        </div>
                        <div className="bg-slate-950 p-3 rounded text-center">
                            <div className="text-[10px] text-slate-500 font-bold">RELATIONSHIPS</div>
                            <div className="text-base font-bold text-blue-400 mt-1">{stats?.totalRelationships || 0}</div>
                        </div>
                        <div className="bg-slate-950 p-3 rounded text-center">
                            <div className="text-[10px] text-slate-500 font-bold">LAST INDEXED</div>
                            <div className="text-[10px] font-bold text-slate-300 mt-1.5 truncate">
                                {activeProject.last_indexed_at ? new Date(activeProject.last_indexed_at).toLocaleTimeString() : "Recent"}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Indexing Status Stepper */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 uppercase flex items-center">
                        <Activity className="w-4 h-4 mr-1.5 text-blue-400" />
                        Indexing Status Engine
                    </span>
                    <span className={`text-[10px] font-bold ${indexingId ? "text-amber-400 animate-pulse" : "text-emerald-400"}`}>
                        {indexingStep}
                    </span>
                </div>

                <div className="grid grid-cols-5 gap-2 pt-2">
                    {["Scanning Repo", "Parsing AST", "Extracting Symbols", "Building Edges", "Updating Graph"].map((step, idx) => (
                        <div key={step} className={`p-2 rounded text-center border text-[10px] ${indexingId ? "bg-amber-500/10 border-amber-500/30 text-amber-300" : "bg-slate-950 border-slate-800 text-slate-400"}`}>
                            <div className="font-bold">{step}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Registered Projects Grid */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-400 uppercase">
                        {showAllProjects ? `Registered Projects (${projects.length})` : "Project Details"}
                    </div>
                    <button
                        onClick={() => setShowAllProjects(!showAllProjects)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs transition-colors"
                    >
                        {showAllProjects ? "Show Active Only" : "Show All Registered"}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(showAllProjects ? projects : projects.filter(p => p.id === activeProject?.id || p.isCurrent)).map((p) => {
                        const isIndexing = indexingId === p.id;
                        return (
                            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-sm text-white">{p.name}</h3>
                                        <span className="text-[10px] text-slate-500 block truncate max-w-xs">{p.path}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-400">{p.status || "Ready"}</span>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        onClick={() => handleReindex(p.path, p.id)}
                                        disabled={isIndexing}
                                        className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors"
                                    >
                                        <Play className={`w-3.5 h-3.5 ${isIndexing ? "animate-spin" : ""}`} />
                                        <span>{isIndexing ? "Indexing..." : "Re-Index"}</span>
                                    </button>

                                    <a
                                        href="/graph"
                                        onClick={() => setActiveProject(p)}
                                        className="flex items-center space-x-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors"
                                    >
                                        <Layers className="w-3.5 h-3.5" />
                                        <span>Explore Graph</span>
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
