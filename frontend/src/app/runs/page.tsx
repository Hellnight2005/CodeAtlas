"use client";

import React from "react";
import { Activity, CheckCircle2, Clock, Terminal } from "lucide-react";

export default function RunsPage() {
    const mockRuns = [
        { id: "run_2f5e3905", action: "REPOSITORY_INDEX", status: "COMPLETED", files: 188, duration: "7.2s", timestamp: "Just now" },
        { id: "run_358f8e52", action: "AST_PARSING", status: "COMPLETED", files: 171, duration: "8.2s", timestamp: "25 mins ago" },
        { id: "run_8f29ab12", action: "GRAPH_SYNC", status: "COMPLETED", files: 171, duration: "1.2s", timestamp: "1 hour ago" }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 font-mono text-xs">
            <div className="border-b border-slate-800 pb-4">
                <h1 className="text-xl font-bold text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-emerald-400" />
                    Execution Runs History (Run IDs)
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                    Trace indexing runs, parsing tasks, and system operations by Run ID.
                </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase text-[10px]">
                            <th className="p-3">Run ID</th>
                            <th className="p-3">Action</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Files</th>
                            <th className="p-3">Duration</th>
                            <th className="p-3">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                        {mockRuns.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-850 transition-colors">
                                <td className="p-3 font-bold text-blue-400">{r.id}</td>
                                <td className="p-3 font-bold">{r.action}</td>
                                <td className="p-3">
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] rounded">
                                        {r.status}
                                    </span>
                                </td>
                                <td className="p-3">{r.files}</td>
                                <td className="p-3">{r.duration}</td>
                                <td className="p-3 text-slate-500">{r.timestamp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
