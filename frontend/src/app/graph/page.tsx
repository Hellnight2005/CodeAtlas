"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import GraphCanvas from "../../components/dashboard/GraphCanvas";
import DetailPanel from "../../components/dashboard/DetailPanel";
import { FolderGit2, Search, Filter, Layers, FolderTree, RefreshCw, Maximize2, Minimize2, ChevronLeft, ChevronRight, Activity, HelpCircle, CheckCircle2 } from "lucide-react";
import { useProject } from "../../context/ProjectContext";

export default function GraphPage() {
    const { activeProject, projects, setActiveProject } = useProject();
    const [initialData, setInitialData] = useState<any>(null);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tree, setTree] = useState<any[]>([]);

    // Sidebar & Viewport Controls
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [showRightPanel, setShowRightPanel] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeLeftTab, setActiveLeftTab] = useState<"tree" | "filters">("tree");
    const [searchQuery, setSearchQuery] = useState("");
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Fetch Graph & Tree
    const fetchGraphData = useCallback(async () => {
        setLoading(true);
        try {
            const repoId = activeProject?.id || 'local-repo';
            const res = await fetch(`http://localhost:5001/api/graph/filter?repo=${repoId}&limit=150`);
            if (res.ok) {
                const data = await res.json();
                setInitialData(data);
            }
            const treeRes = await fetch(`http://localhost:5001/api/projects/${repoId}/tree`);
            if (treeRes.ok) {
                const treeData = await treeRes.json();
                setTree(treeData.files || []);
            }
        } catch (err) {
            console.warn("Failed to fetch graph data:", err);
        } finally {
            setLoading(false);
        }
    }, [activeProject]);

    useEffect(() => {
        fetchGraphData();
    }, [fetchGraphData]);

    // Keyboard Shortcut Handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
                return;
            }

            if (e.key === '/') {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'Escape') {
                setSelectedNode(null);
                setShowShortcutsHelp(false);
            } else if (e.key === 'f' || e.key === 'F') {
                if (selectedNode) {
                    console.log("Focus shortcut triggered for node:", selectedNode.id);
                }
            } else if (e.key === 'r' || e.key === 'R') {
                fetchGraphData();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNode, fetchGraphData]);

    const handleTreeFileClick = (file: any) => {
        if (!initialData?.nodes) return;
        const matchingNode = initialData.nodes.find((n: any) => n.data?.path === file.path || n.name === file.path);
        if (matchingNode) {
            setSelectedNode(matchingNode);
        }
    };

    return (
        <div className={`w-full h-full flex flex-col bg-slate-950 font-mono text-xs select-none overflow-hidden ${isFullscreen ? "fixed inset-0 z-50" : "relative flex-1"}`}>
            {/* Top Workspace Header */}
            <div className="h-12 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between text-slate-200 z-20">
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 font-bold text-white">
                        <Layers className="w-4 h-4 text-blue-400" />
                        <span className="hidden sm:inline">CodeAtlas Graph Workspace</span>
                    </div>

                    {/* Active Repository Badge */}
                    <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded">
                        <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-200">{activeProject?.name || "Repository"}</span>
                    </div>
                </div>

                {/* Global Search Bar (Key: /) */}
                <div className="relative w-72">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search symbols, files... (/)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-8 py-1 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                    />
                    <kbd className="absolute right-2 top-1.5 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] text-slate-400 font-bold">
                        /
                    </kbd>
                </div>

                {/* Top Controls */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded text-slate-300"
                        title="Keyboard Shortcuts"
                    >
                        <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded text-slate-300"
                        title="Toggle Fullscreen Workspace"
                    >
                        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* Shortcuts Help Overlay */}
            {showShortcutsHelp && (
                <div className="absolute top-14 right-4 z-40 bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-2xl space-y-2 w-64">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Keyboard Shortcuts</div>
                    <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between"><kbd className="bg-slate-800 px-1.5 rounded">/</kbd> <span>Focus Search</span></div>
                        <div className="flex justify-between"><kbd className="bg-slate-800 px-1.5 rounded">Esc</kbd> <span>Clear Selection</span></div>
                        <div className="flex justify-between"><kbd className="bg-slate-800 px-1.5 rounded">F</kbd> <span>Focus Node</span></div>
                        <div className="flex justify-between"><kbd className="bg-slate-800 px-1.5 rounded">E</kbd> <span>Expand Node</span></div>
                        <div className="flex justify-between"><kbd className="bg-slate-800 px-1.5 rounded">R</kbd> <span>Reset Layout</span></div>
                        <div className="flex justify-between"><kbd className="bg-slate-800 px-1.5 rounded">0</kbd> <span>Fit to Screen</span></div>
                    </div>
                </div>
            )}

            {/* Main Graph Workspace Grid */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Collapsible Panel: Repository Tree & Filters */}
                {showLeftPanel && (
                    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden z-10">
                        <div className="flex border-b border-slate-800 bg-slate-950 text-[10px] font-bold">
                            <button
                                onClick={() => setActiveLeftTab("tree")}
                                className={`flex-1 py-2 flex items-center justify-center space-x-1 uppercase ${activeLeftTab === "tree" ? "bg-slate-900 text-white border-b-2 border-blue-500" : "text-slate-500"}`}
                            >
                                <FolderTree className="w-3 h-3" />
                                <span>Tree</span>
                            </button>
                            <button
                                onClick={() => setActiveLeftTab("filters")}
                                className={`flex-1 py-2 flex items-center justify-center space-x-1 uppercase ${activeLeftTab === "filters" ? "bg-slate-900 text-white border-b-2 border-blue-500" : "text-slate-500"}`}
                            >
                                <Filter className="w-3 h-3" />
                                <span>Filters</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3">
                            {activeLeftTab === "tree" ? (
                                <div className="space-y-1">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Repository Files</div>
                                    {tree.map((f, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => handleTreeFileClick(f)}
                                            className="px-2 py-1 hover:bg-slate-800 rounded cursor-pointer truncate text-slate-300 text-[11px] hover:text-white"
                                        >
                                            {f.path}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase">Node Filter Toggles</div>
                                    {["File", "Function", "Class", "Interface", "Module"].map(t => (
                                        <label key={t} className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                                            <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-950" />
                                            <span>{t}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Left Panel Toggle Handle */}
                <button
                    onClick={() => setShowLeftPanel(!showLeftPanel)}
                    className="absolute top-1/2 left-0 -translate-y-1/2 z-30 p-1 bg-slate-900 border border-slate-800 text-slate-400 rounded-r hover:bg-slate-800"
                >
                    {showLeftPanel ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {/* Center Full-Screen Canvas */}
                <div className="flex-1 relative h-full w-full overflow-hidden bg-slate-950">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-slate-400 font-mono text-xs space-x-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                            <span>Building Interactive Knowledge Graph...</span>
                        </div>
                    ) : (
                        <GraphCanvas
                            initialData={initialData}
                            onNodeClick={(node: any) => setSelectedNode(node)}
                        />
                    )}
                </div>

                {/* Right Collapsible Node Inspector Panel */}
                {showRightPanel && (
                    <div className="w-80 h-full z-10">
                        <DetailPanel
                            node={selectedNode}
                            onClose={() => setSelectedNode(null)}
                            onFocusNode={(id) => console.log("Focus node:", id)}
                            onExpandNode={(id) => console.log("Expand node:", id)}
                        />
                    </div>
                )}
            </div>

            {/* Bottom Diagnostic Status Bar */}
            <div className="h-7 border-t border-slate-800 bg-slate-950 px-4 flex items-center justify-between text-[10px] text-slate-400 font-mono z-20">
                <div className="flex items-center space-x-4">
                    <span className="flex items-center text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        GRAPH READY
                    </span>
                    <span>Nodes: <strong className="text-slate-200">{initialData?.nodes?.length || 0}</strong></span>
                    <span>Relationships: <strong className="text-slate-200">{initialData?.edges?.length || 0}</strong></span>
                    <span>Depth: <strong className="text-slate-200">2</strong></span>
                </div>

                <div className="flex items-center space-x-3">
                    <span>Limit: <strong className="text-slate-200">150</strong></span>
                    <span>Local Storage: <strong className="text-slate-200">SQLite + Neo4j</strong></span>
                </div>
            </div>
        </div>
    );
}
