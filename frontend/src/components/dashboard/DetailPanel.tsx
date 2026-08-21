"use client";

import React, { useState } from "react";
import { X, FileText, Target, Maximize2, ShieldAlert, Cpu, GitFork, ArrowDownRight, ArrowUpRight, Layers } from "lucide-react";

export default function DetailPanel({
    node,
    details,
    onClose,
    onFocusNode,
    onExpandNode,
    onAnalyzeImpact,
    onTracePath,
    owner,
    repo
}: {
    node: any;
    details?: any;
    onClose: () => void;
    onFocusNode?: (id: string) => void;
    onExpandNode?: (id: string) => void;
    onAnalyzeImpact?: (target: string) => void;
    onTracePath?: (entry: string) => void;
    owner?: string;
    repo?: string;
}) {
    const [activeTab, setActiveTab] = useState<"overview" | "callers" | "callees" | "dependencies" | "impact" | "trace">("overview");

    if (!node) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-900 border-l border-slate-800 text-slate-500 font-mono text-xs select-none">
                <Target className="w-8 h-8 mb-2 text-slate-600" />
                <p className="font-bold">Repository Knowledge Graph</p>
                <p className="text-[10px] text-slate-600 mt-1 text-center">Select any node on the graph canvas to inspect its architecture, callers, callees, and dependencies.</p>
            </div>
        );
    }

    const nodeData = node.data || node;
    const name = nodeData.name || nodeData.label || node.id || "Symbol";
    const label = node.label || nodeData.type || "Symbol";
    const path = nodeData.path || nodeData.filePath || "src/";
    const startLine = nodeData.startLine || 1;
    const endLine = nodeData.endLine || 45;

    return (
        <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 font-mono text-xs text-slate-200 select-none overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="p-2 bg-blue-600/10 border border-blue-500/30 rounded text-blue-400">
                        <FileText className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                        <h3 className="font-bold text-sm text-white truncate">{name}</h3>
                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{label}</span>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Inspector Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950 text-[10px] font-bold overflow-x-auto">
                {(["overview", "callers", "callees", "dependencies", "impact", "trace"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-2 uppercase transition-colors whitespace-nowrap ${activeTab === tab ? "border-b-2 border-blue-500 text-white bg-slate-900" : "text-slate-500 hover:text-slate-300"}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeTab === "overview" && (
                    <div className="space-y-4">
                        <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
                            <div>
                                <span className="text-[10px] text-slate-500 font-bold block uppercase">File Location</span>
                                <span className="text-xs text-slate-300 break-all">{path}</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-slate-800 text-[10px]">
                                <div><span className="text-slate-500">Lines:</span> <span className="text-slate-200">{startLine} - {endLine}</span></div>
                                <div><span className="text-slate-500">Language:</span> <span className="text-slate-200">TypeScript</span></div>
                            </div>
                        </div>

                        {/* Quick Graph Actions */}
                        <div className="space-y-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Graph Actions</span>
                            <div className="grid grid-cols-2 gap-2">
                                {onFocusNode && (
                                    <button
                                        onClick={() => onFocusNode(node.id)}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center justify-center space-x-1"
                                    >
                                        <Target className="w-3.5 h-3.5" />
                                        <span>Focus Graph</span>
                                    </button>
                                )}
                                {onExpandNode && (
                                    <button
                                        onClick={() => onExpandNode(node.id)}
                                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold rounded flex items-center justify-center space-x-1"
                                    >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                        <span>Expand Node</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "callers" && (
                    <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center">
                            <ArrowDownRight className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                            Incoming Callers
                        </span>
                        <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1.5">
                            <div className="text-xs font-bold text-slate-200">AuthController.login</div>
                            <div className="text-[10px] text-slate-500">src/controllers/AuthController.ts:42</div>
                        </div>
                    </div>
                )}

                {activeTab === "callees" && (
                    <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center">
                            <ArrowUpRight className="w-3.5 h-3.5 mr-1 text-blue-400" />
                            Outgoing Callees
                        </span>
                        <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1.5">
                            <div className="text-xs font-bold text-slate-200">UserRepository.findByEmail</div>
                            <div className="text-[10px] text-slate-500">src/repositories/UserRepository.ts:18</div>
                        </div>
                    </div>
                )}

                {activeTab === "impact" && (
                    <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center">
                            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-400" />
                            Blast Radius & Impact Analysis
                        </span>
                        <p className="text-[10px] text-slate-400">Evaluate affected callers and downstream modules if this symbol is modified.</p>
                        {onAnalyzeImpact && (
                            <button
                                onClick={() => onAnalyzeImpact(name)}
                                className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-bold"
                            >
                                Execute Blast Radius Analysis
                            </button>
                        )}
                    </div>
                )}

                {activeTab === "trace" && (
                    <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center">
                            <GitFork className="w-3.5 h-3.5 mr-1 text-purple-400" />
                            Execution Tracer
                        </span>
                        <p className="text-[10px] text-slate-400">Trace step-by-step execution path from HTTP route to database.</p>
                        {onTracePath && (
                            <button
                                onClick={() => onTracePath(name)}
                                className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded font-bold"
                            >
                                Highlight Execution Path
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
