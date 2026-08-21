"use client";

import React from "react";
import { HardDrive, Folder, Database, Trash2 } from "lucide-react";

export default function StoragePage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 font-mono text-xs">
            <div className="border-b border-slate-800 pb-4">
                <h1 className="text-xl font-bold text-white flex items-center">
                    <HardDrive className="w-5 h-5 mr-2 text-blue-400" />
                    Local Storage Manager (~/.codeatlas/)
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                    Manage multi-project local databases, global registry, and isolated log directories.
                </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                        <div className="font-bold text-slate-200">Global CodeAtlas Directory</div>
                        <div className="text-[10px] text-slate-500">C:\Users\Abhijeet\.codeatlas\</div>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] rounded">
                        Active Storage
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-950 p-4 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-500 font-bold">GLOBAL REGISTRY DB</div>
                        <div className="text-sm font-bold text-slate-200 mt-1">global.db</div>
                    </div>
                    <div className="bg-slate-950 p-4 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-500 font-bold">ISOLATED PROJECTS</div>
                        <div className="text-sm font-bold text-emerald-400 mt-1">projects/</div>
                    </div>
                    <div className="bg-slate-950 p-4 rounded border border-slate-800">
                        <div className="text-[10px] text-slate-500 font-bold">LOG DIRECTORY</div>
                        <div className="text-sm font-bold text-yellow-400 mt-1">logs/</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
