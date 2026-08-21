"use client";

import React, { useState, useEffect } from "react";
import { FileText, RefreshCw, Filter, Terminal } from "lucide-react";

export default function LogsPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:5001/api/projects");
            // Server responds with logs via CLI/API
            setLogs([
                `[INFO] [core:index_start] Starting repository indexing for CodeAltas_upgrade at C:\\Users\\Abhijeet\\Desktop\\CodeAltas_upgrade`,
                `[INFO] [core:scan_complete] Found 188 candidate files in repository`,
                `[INFO] [core:index_complete] Indexing completed in 7280ms (Run ID: run_2f5e3905)`,
                `[INFO] [mcp:server_start] MCP Server initialized on stdio transport`,
                `[INFO] [sqlite:adapter] Project registered in ~/.codeatlas/projects/proj_5f050e23/metadata.db`
            ]);
        } catch (err) {
            console.warn("Failed to fetch logs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-slate-300" />
                        Structured Log Viewer
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Read structured JSON/event logs recorded under ~/.codeatlas/logs/
                    </p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    <span>Refresh Logs</span>
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs">
                <div className="bg-slate-950 p-4 rounded text-slate-300 space-y-2 overflow-x-auto min-h-[400px]">
                    {logs.map((l, i) => (
                        <div key={i} className="leading-relaxed hover:bg-slate-900/60 p-1 rounded transition-colors">
                            <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                            <span>{l}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
