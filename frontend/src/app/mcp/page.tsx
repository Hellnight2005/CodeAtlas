"use client";

import React, { useState, useEffect } from "react";
import { Cpu, CheckCircle2, RefreshCw, Terminal, Activity, Zap } from "lucide-react";

export default function McpPage() {
    const [activity, setActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const tools = [
        { name: "codeatlas_get_context", desc: "Natural language Graph-RAG context compiler" },
        { name: "codeatlas_find_symbol", desc: "AST symbol definition locator" },
        { name: "codeatlas_get_callers", desc: "Caller invocation graph traversal" },
        { name: "codeatlas_get_callees", desc: "Callee execution graph traversal" },
        { name: "codeatlas_get_dependencies", desc: "Module dependency inspector" },
        { name: "codeatlas_analyze_impact", desc: "Blast radius change impact analysis" },
        { name: "codeatlas_trace_execution", desc: "Route-to-database execution path tracer" }
    ];

    const fetchActivity = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:5001/api/mcp/activity");
            if (res.ok) {
                const data = await res.json();
                setActivity(data);
            }
        } catch (err) {
            console.warn("Failed to fetch MCP activity:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity();
        const interval = setInterval(fetchActivity, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center">
                        <Cpu className="w-5 h-5 mr-2 text-indigo-400" />
                        MCP Graph Engineering & Graph-RAG Telemetry
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Operational activity log of autonomous AI agent queries (Antigravity, Cursor, Claude Desktop).
                    </p>
                </div>
                <button
                    onClick={fetchActivity}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    <span>Refresh Logs</span>
                </button>
            </div>

            {/* Server Status Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                <div>
                    <div className="font-bold text-slate-200 text-sm">CodeAtlas MCP Server</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Transport: <span className="text-slate-200">stdio</span> | Config: <span className="text-slate-200">~/.gemini/config/mcp_config.json</span></div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] rounded font-bold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    ACTIVE & LISTENING
                </span>
            </div>

            {/* Live Operational Telemetry Timeline */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-200 uppercase flex items-center">
                        <Activity className="w-4 h-4 mr-1.5 text-blue-400" />
                        Live Agent Request Telemetry ({activity.length})
                    </span>
                    <span className="text-[10px] text-slate-500">Auto-refreshing</span>
                </div>

                {activity.length > 0 ? (
                    <div className="divide-y divide-slate-800">
                        {activity.map((item) => (
                            <div key={item.requestId} className="py-3 flex items-start justify-between hover:bg-slate-850/50 px-2 rounded transition-colors">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-blue-400">{item.toolName}</span>
                                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] rounded">
                                            {item.status}
                                        </span>
                                        <span className="text-slate-500 text-[10px]">{item.durationMs}ms</span>
                                    </div>
                                    <div className="text-xs text-slate-300 mt-1">"{item.query}"</div>
                                </div>
                                <div className="text-[10px] text-slate-500 text-right">
                                    <div>{new Date(item.timestamp).toLocaleTimeString()}</div>
                                    <div className="text-slate-400 mt-0.5">{item.nodeCount} nodes retrieved</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500 text-xs">
                        No agent queries recorded yet. Ask your AI agent an engineering question (e.g. "How does authentication work?") to trigger Graph-RAG context retrieval.
                    </div>
                )}
            </div>

            {/* Tool Registry */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
                <div className="text-xs font-bold text-slate-200 uppercase">Available MCP Tools ({tools.length})</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tools.map((t) => (
                        <div key={t.name} className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
                            <div className="font-bold text-blue-400">{t.name}</div>
                            <div className="text-[10px] text-slate-400">{t.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
