"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    FolderGit2,
    Network,
    Search,
    Layers,
    Terminal,
    Activity,
    Cpu,
    HardDrive,
    Stethoscope,
    Zap,
    BookOpen,
    BarChart3,
    FileText,
    ChevronDown,
    FolderTree
} from "lucide-react";
import { useProject } from "../../context/ProjectContext";

export default function Sidebar() {
    const pathname = usePathname();
    const { projects, activeProject, setActiveProject } = useProject();
    const [projectDropdown, setProjectDropdown] = React.useState(false);

    const isActive = (path: string) => pathname === path;

    const navSections = [
        {
            title: "PROJECTS",
            items: [
                { name: "Projects Registry", path: "/projects", icon: FolderGit2 },
                { name: "Repository Explorer", path: "/explorer", icon: FolderTree },
            ],
        },
        {
            title: "INTELLIGENCE",
            items: [
                { name: "Code Graph", path: "/graph", icon: Network },
                { name: "Symbol Search", path: "/symbols", icon: Search },
                { name: "Structural Analysis", path: "/analysis", icon: Layers },
                { name: "Query & Context", path: "/query", icon: Zap },
            ],
        },
        {
            title: "OBSERVABILITY",
            items: [
                { name: "Execution Runs", path: "/runs", icon: Activity },
                { name: "Structured Logs", path: "/logs", icon: FileText },
            ],
        },
        {
            title: "INTEGRATIONS",
            items: [
                { name: "MCP Server", path: "/mcp", icon: Cpu },
            ],
        },
        {
            title: "SYSTEM",
            items: [
                { name: "Local Storage", path: "/storage", icon: HardDrive },
                { name: "System Doctor", path: "/system", icon: Stethoscope },
            ],
        },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col h-screen select-none font-sans text-xs">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                    CA
                </div>
                <div>
                    <h1 className="font-mono font-bold text-sm text-white tracking-tight">CodeAtlas</h1>
                    <p className="text-[10px] text-slate-400 font-mono">Control Center v1.0</p>
                </div>
            </div>

            {/* Active Project Switcher */}
            <div className="p-3 border-b border-slate-800/80 relative">
                <div className="text-[10px] font-mono text-slate-400 mb-1 uppercase tracking-wider">Active Repository</div>
                <button
                    onClick={() => setProjectDropdown(!projectDropdown)}
                    className="w-full bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded px-3 py-2 flex items-center justify-between transition-colors text-left"
                    suppressHydrationWarning
                >
                    <div className="truncate" suppressHydrationWarning>
                        <div className="font-bold text-slate-100 truncate text-xs" suppressHydrationWarning>{activeProject ? activeProject.name : "Select Project"}</div>
                        <div className="text-[10px] text-emerald-400 font-mono flex items-center mt-0.5" suppressHydrationWarning>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                            {activeProject?.status || "Ready"}
                        </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </button>

                {projectDropdown && (
                    <div className="absolute top-full left-3 right-3 mt-1 bg-slate-800 border border-slate-700 rounded shadow-xl py-1 z-50 max-h-48 overflow-y-auto">
                        {projects.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => {
                                    setActiveProject(p);
                                    setProjectDropdown(false);
                                }}
                                className={`px-3 py-2 hover:bg-slate-700 cursor-pointer flex flex-col ${activeProject?.id === p.id ? "bg-slate-700/60" : ""}`}
                            >
                                <span className="font-bold text-slate-200 truncate">{p.name}</span>
                                <span className="text-[10px] text-slate-400 truncate">{p.path}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {navSections.map((sec) => (
                    <div key={sec.title}>
                        <div className="text-[10px] font-mono font-bold text-slate-500 mb-1 px-2 tracking-wider">
                            {sec.title}
                        </div>
                        <div className="space-y-0.5">
                            {sec.items.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`flex items-center space-x-2.5 px-2.5 py-1.5 rounded transition-colors ${active
                                                ? "bg-blue-600/90 text-white font-medium shadow-sm"
                                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                                            }`}
                                    >
                                        <Icon className="w-4 h-4 flex-shrink-0" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                <span>Local-First Engine</span>
                <span className="text-emerald-400">Offline Ready</span>
            </div>
        </aside>
    );
}
