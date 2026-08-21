"use client";

import React, { useState } from "react";
import { Zap, Code, FileText, CheckCircle2, BarChart } from "lucide-react";

export default function QueryPage() {
    const [query, setQuery] = useState("");
    const [contextPackage, setContextPackage] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleCompile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const res = await fetch("http://localhost:5001/api/context", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query })
            });
            if (res.ok) {
                const data = await res.json();
                setContextPackage(data);
            }
        } catch (err) {
            console.error("Context compilation failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 font-mono text-xs">
            <div className="border-b border-slate-800 pb-4">
                <h1 className="text-xl font-bold text-white flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                    Context Compiler & Query Inspector
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                    Assemble compact, graph-driven markdown context packages with Selection Ratio context metrics.
                </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleCompile} className="flex space-x-2">
                <input
                    type="text"
                    placeholder="Enter feature task or question (e.g. How does repository indexing work?)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg transition-colors"
                >
                    {loading ? "Compiling..." : "Compile Context"}
                </button>
            </form>

            {/* Context Package Results */}
            {contextPackage && (
                <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-center">
                            <div className="text-[10px] text-slate-500 font-bold">CANDIDATE TOKENS</div>
                            <div className="text-lg font-bold text-slate-200 mt-1">~{contextPackage.candidateTokens}</div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-center">
                            <div className="text-[10px] text-slate-500 font-bold">SELECTED TOKENS</div>
                            <div className="text-lg font-bold text-emerald-400 mt-1">~{contextPackage.selectedTokens}</div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-center">
                            <div className="text-[10px] text-slate-500 font-bold">SELECTED FILES</div>
                            <div className="text-lg font-bold text-blue-400 mt-1">{contextPackage.selectedFilesCount}</div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-center">
                            <div className="text-[10px] text-slate-500 font-bold">SELECTION RATIO</div>
                            <div className="text-lg font-bold text-yellow-400 mt-1">
                                {contextPackage.candidateTokens > 0 ? ((contextPackage.selectedTokens / contextPackage.candidateTokens) * 100).toFixed(1) : 100}%
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
                        <div className="text-xs font-bold text-slate-200 uppercase">Formatted Code Context Package</div>
                        <pre className="bg-slate-950 p-4 rounded text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-96">
                            {contextPackage.formattedContext}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
