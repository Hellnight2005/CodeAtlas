"use client";

import React, { useState } from "react";
import { Search, Code, FileCode, Layers, ArrowRight } from "lucide-react";

export default function SymbolsPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5001/api/find?symbol=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            }
        } catch (err) {
            console.error("Symbol search failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 font-mono">
            <div className="border-b border-slate-800 pb-4">
                <h1 className="text-xl font-bold text-white flex items-center">
                    <Search className="w-5 h-5 mr-2 text-blue-400" />
                    Symbol Search & Resolution
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                    Fast lookup for function, class, file, and variable definitions across indexed repositories.
                </p>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex space-x-2">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Type symbol name (e.g. Indexer, compileContext, SqliteAdapter)..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                >
                    {loading ? "Searching..." : "Search Symbol"}
                </button>
            </form>

            {/* Results Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase flex items-center justify-between">
                    <span>Matched Symbols ({results.length})</span>
                </div>
                {results.length > 0 ? (
                    <div className="divide-y divide-slate-800">
                        {results.map((r, i) => (
                            <div key={i} className="p-4 hover:bg-slate-850 transition-colors flex items-center justify-between">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-sm text-blue-400">{r.name}</span>
                                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded border border-slate-700">
                                            {r.label}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">{r.filePath || "Global"}</div>
                                </div>
                                <div className="text-[10px] text-slate-500 truncate max-w-xs">{r.id}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-xs text-slate-500">
                        Enter a symbol name above to search the repository code graph.
                    </div>
                )}
            </div>
        </div>
    );
}
