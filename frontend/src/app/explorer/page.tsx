"use client";

import React, { useState, useEffect } from "react";
import { FolderTree, FileCode, Search, Code, ArrowRight } from "lucide-react";
import { useProject } from "../../context/ProjectContext";

export default function ExplorerPage() {
    const { activeProject } = useProject();
    const [searchQuery, setSearchQuery] = useState("");
    const [matchedFiles, setMatchedFiles] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<any | null>(null);

    useEffect(() => {
        // Fetch files from local API
        const fetchFiles = async () => {
            try {
                const res = await fetch(`http://localhost:5001/api/graph/filter?path=${searchQuery}`);
                if (res.ok) {
                    const data = await res.json();
                    const files = (data.nodes || []).filter((n: any) => n.label === "File");
                    setMatchedFiles(files);
                    if (files.length > 0 && !selectedFile) setSelectedFile(files[0]);
                }
            } catch (err) {
                console.warn("Explorer fetch failed:", err);
            }
        };
        fetchFiles();
    }, [searchQuery]);

    return (
        <div className="flex h-full font-mono text-xs overflow-hidden">
            {/* Left Sidebar: File Tree & Search */}
            <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
                <div className="p-3 border-b border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold mb-2 uppercase">Repository Explorer</div>
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Filter files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700/80 rounded pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {matchedFiles.map((file) => (
                        <div
                            key={file.id}
                            onClick={() => setSelectedFile(file)}
                            className={`flex items-center space-x-2 px-2.5 py-1.5 rounded cursor-pointer transition-colors ${selectedFile?.id === file.id
                                    ? "bg-blue-600 text-white font-bold"
                                    : "text-slate-300 hover:bg-slate-800"
                                }`}
                        >
                            <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{file.data?.path || file.data?.name || file.id}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Center Panel: File & Symbol Details */}
            <div className="flex-1 flex flex-col bg-slate-950">
                <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Code className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-slate-200">{selectedFile ? selectedFile.data?.path || selectedFile.data?.name : "Select a file"}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{activeProject?.name}</span>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    {selectedFile ? (
                        <div className="space-y-6">
                            <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-2">
                                <div className="text-[10px] text-slate-500 font-bold uppercase">Node Properties</div>
                                <pre className="text-xs text-slate-300 bg-slate-950 p-3 rounded overflow-x-auto">
                                    {JSON.stringify(selectedFile.data, null, 2)}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-500 flex items-center justify-center h-full">
                            Select a file from the repository tree to inspect symbol details.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
