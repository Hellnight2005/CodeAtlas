"use client";

import React, { useState } from "react";
import { Layers, GitCommit, GitBranch, ArrowRight, ShieldAlert } from "lucide-react";

export default function AnalysisPage() {
    const [target, setTarget] = useState("");
    const [mode, setMode] = useState<"impact" | "callers" | "trace">("impact");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleRunAnalysis = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!target.trim()) return;

        setLoading(true);
        try {
            const endpoint = mode === "impact" ? "/api/impact" : mode === "callers" ? "/api/callers" : "/api/trace";
            const paramKey = mode === "impact" || mode === "trace" ? "target" : "symbol";
            const res = await fetch(`http://localhost:5001${endpoint}?${paramKey}=${encodeURIComponent(target)}`);
            if (res.ok) {
                const data = await res.json();
                setResult(data);
            }
        } catch (err) {
            console.error("Analysis failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 font-mono text-xs">
            <div className="border-b border-slate-800 pb-4">
                <h1 className="text-xl font-bold text-white flex items-center">
                    <Layers className="w-5 h-5 mr-2 text-indigo-400" />
                    Structural Code Analysis Workspace
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                    Analyze change impact (blast radius), call trees, and execution path sequences.
                </p>
            </div>

            {/* Controls */}
            <form onSubmit={handleRunAnalysis} className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
                <div className="flex space-x-2">
                    {(["impact", "callers", "trace"] as const).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setMode(m)}
                            className={`px-4 py-2 rounded text-xs font-bold uppercase transition-colors ${mode === m ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-750"
                                }`}
                        >
                            {m === "impact" ? "Impact Analysis" : m === "callers" ? "Find Callers" : "Trace Execution Flow"}
                        </button>
                    ))}
                </div>

                <div className="flex space-x-2">
                    <input
                        type="text"
                        placeholder="Enter target symbol or route (e.g. Indexer, indexRepository, SqliteAdapter)..."
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold transition-colors"
                    >
                        {loading ? "Running..." : "Execute Analysis"}
                    </button>
                </div>
            </form>

            {/* Results Display */}
            {result && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <span className="font-bold text-sm text-slate-200 uppercase">Analysis Results</span>
                        <span className="text-[10px] text-slate-400 font-bold">Target: {target}</span>
                    </div>

                    <pre className="bg-slate-950 p-4 rounded text-xs text-slate-300 overflow-x-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
