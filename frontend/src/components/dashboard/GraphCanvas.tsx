"use client";

import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Node,
    BackgroundVariant,
    useReactFlow,
    ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { RotateCcw, Info, Search, Filter, ZoomIn, ZoomOut, Maximize2, Layers, ShieldAlert, Target } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
    'Repository': '#3B82F6', // Blue
    'File': '#EC4899',       // Pink
    'Module': '#F59E0B',     // Amber/Yellow
    'Function': '#10B981',   // Emerald/Green
    'Class': '#EF4444',      // Red
    'Interface': '#8B5CF6',  // Purple
    'Variable': '#6366F1',   // Indigo
};

const DEFAULT_COLOR = '#94A3B8';

const NEO_NODE_STYLE = {
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    border: 'none',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
    fontFamily: 'monospace',
    fontSize: '10px',
    fontWeight: 'bold',
    textAlign: 'center' as const
};

const getNodeColor = (label?: string) => {
    if (!label) return DEFAULT_COLOR;
    return TYPE_COLORS[label] || DEFAULT_COLOR;
};

function GraphCanvasInner({ onNodeClick, initialData, onReset }: { onNodeClick?: (node: any) => void, initialData?: any, onReset?: () => void }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const reactFlowInstance = useReactFlow();

    // Graph Controls State
    const [depth, setDepth] = useState<number>(2);
    const [nodeLimit, setNodeLimit] = useState<number>(250);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showLegend, setShowLegend] = useState(false);
    const [showControlsPanel, setShowControlsPanel] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

    // Filter toggles
    const [selectedNodeTypes, setSelectedNodeTypes] = useState<Record<string, boolean>>({
        'File': true,
        'Function': true,
        'Class': true,
        'Interface': true,
        'Module': true
    });

    const [selectedRelTypes, setSelectedRelTypes] = useState<Record<string, boolean>>({
        'CALLS': true,
        'IMPORTS': true,
        'DEPENDS_ON': true,
        'EXTENDS': true,
        'REFERENCES': true
    });

    const generateGraph = useCallback(() => {
        if (!initialData || !initialData.nodes) return;

        const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const rawNodes = [...initialData.nodes.slice(0, nodeLimit)];
        setIsTruncated(initialData.nodes.length > nodeLimit);

        // Identify or create Root Directory Folder node
        let repoNode = rawNodes.find((n: any) => n.label === 'Repository');
        if (!repoNode) {
            repoNode = {
                id: 'root-directory-folder',
                label: 'Repository',
                name: 'Project Root Folder',
                data: { name: 'Project Root Folder', path: '.' }
            };
            rawNodes.unshift(repoNode);
        }

        // Collect all connected node IDs
        const connectedNodeIds = new Set<string>();
        (initialData.edges || []).forEach((e: any) => {
            connectedNodeIds.add(e.source);
            connectedNodeIds.add(e.target);
        });

        // Generate synthetic CONTAINS edges for unconnected files (.md, Docker, configs)
        const allEdges = [...(initialData.edges || [])];
        rawNodes.forEach((n: any) => {
            if (n.id !== repoNode.id && !connectedNodeIds.has(n.id)) {
                allEdges.push({
                    id: `folder-contains->${n.id}`,
                    source: repoNode.id,
                    target: n.id,
                    type: 'CONTAINS'
                });
            }
        });

        const mappedNodes = rawNodes.map((n: any, index: number) => {
            const isRepo = n.label === 'Repository';
            let label = n.data?.name || n.name || n.id;
            if (label.length > 15) label = label.substring(0, 12) + '...';

            const ringIndex = Math.floor(index / 12);
            const posInRing = index % 12;
            const itemsInRing = Math.min(12, rawNodes.length - ringIndex * 12);
            const radius = isRepo ? 0 : 180 + ringIndex * 150;
            const angle = (posInRing / Math.max(itemsInRing, 1)) * 2 * Math.PI + (ringIndex * 0.3);

            const position = n.position || {
                x: isRepo ? center.x : center.x + radius * Math.cos(angle),
                y: isRepo ? center.y : center.y + radius * Math.sin(angle)
            };

            return {
                id: n.id,
                position,
                data: { ...n.data, label, fullNode: n },
                style: {
                    ...NEO_NODE_STYLE,
                    width: isRepo ? 95 : 65,
                    height: isRepo ? 95 : 65,
                    backgroundColor: getNodeColor(n.label),
                    fontSize: isRepo ? '11px' : '9px',
                    opacity: focusNodeId && focusNodeId !== n.id ? 0.4 : 1,
                    border: focusNodeId === n.id ? '3px solid #3B82F6' : (isRepo ? '2px solid #FFFFFF' : 'none')
                }
            };
        });

        const mappedEdges = allEdges.map((e: any) => {
            const relType = e.type || 'CALLS';
            let strokeColor = '#64748B'; // slate-500
            if (relType === 'IMPORTS') strokeColor = '#3B82F6';   // blue
            if (relType === 'CALLS') strokeColor = '#10B981';     // emerald
            if (relType === 'DEFINES') strokeColor = '#EC4899';   // pink
            if (relType === 'EXTENDS') strokeColor = '#8B5CF6';   // purple
            if (relType === 'CONTAINS') strokeColor = '#FFFFFF';  // WHITE LINE for Folder/Directory connection!

            return {
                id: e.id,
                source: e.source,
                target: e.target,
                label: relType,
                type: 'default',
                style: {
                    stroke: strokeColor,
                    strokeWidth: relType === 'CONTAINS' ? 1.5 : 2,
                    strokeDasharray: relType === 'CONTAINS' ? '4 4' : undefined // white dashed line!
                },
                animated: relType === 'CALLS' || relType === 'IMPORTS'
            };
        });

        setNodes(mappedNodes);
        setEdges(mappedEdges);
    }, [initialData, nodeLimit, focusNodeId, setNodes, setEdges]);

    useEffect(() => {
        generateGraph();
    }, [generateGraph]);

    const handleNodeClick = (event: React.MouseEvent, node: Node) => {
        if (onNodeClick) onNodeClick(node.data?.fullNode || node);
    };

    const handleFocusMode = (nodeId: string) => {
        setFocusNodeId(focusNodeId === nodeId ? null : nodeId);
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.5, duration: 800 });
        }
    };

    return (
        <div className="w-full h-full bg-slate-950 relative select-none font-mono text-xs overflow-hidden">
            {/* Control Toolbar */}
            <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-slate-900/90 border border-slate-800 backdrop-blur px-3 py-2 rounded-lg shadow-xl text-slate-200">
                <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search symbols..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-950 border border-slate-700/80 rounded pl-8 pr-3 py-1 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs w-48"
                    />
                </div>

                <div className="h-4 w-px bg-slate-800"></div>

                <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-slate-500 font-bold">DEPTH:</span>
                    {[1, 2, 3].map(d => (
                        <button
                            key={d}
                            onClick={() => setDepth(d)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${depth === d ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-750"}`}
                        >
                            {d}
                        </button>
                    ))}
                </div>

                <div className="h-4 w-px bg-slate-800"></div>

                <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-slate-500 font-bold">LIMIT:</span>
                    {[100, 250, 500].map(l => (
                        <button
                            key={l}
                            onClick={() => setNodeLimit(l)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${nodeLimit === l ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-750"}`}
                        >
                            {l}
                        </button>
                    ))}
                </div>

                <div className="h-4 w-px bg-slate-800"></div>

                <button
                    onClick={() => setShowControlsPanel(!showControlsPanel)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded border border-slate-700"
                    title="Toggle Filter Controls"
                >
                    <Filter className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Truncation Alert */}
            {isTruncated && (
                <div className="absolute top-4 right-4 z-20 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg text-[10px] flex items-center shadow-lg">
                    <ShieldAlert className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    Graph truncated to max limit ({nodeLimit} nodes)
                </div>
            )}

            {/* Filter Controls Panel Dropdown */}
            {showControlsPanel && (
                <div className="absolute top-16 left-4 z-30 bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-2xl space-y-3 w-64">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Node Types</div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        {Object.keys(selectedNodeTypes).map(t => (
                            <label key={t} className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedNodeTypes[t]}
                                    onChange={() => setSelectedNodeTypes(prev => ({ ...prev, [t]: !prev[t] }))}
                                    className="rounded border-slate-700 bg-slate-950"
                                />
                                <span>{t}</span>
                            </label>
                        ))}
                    </div>

                    <div className="text-[10px] text-slate-400 font-bold uppercase pt-2 border-t border-slate-800">Relationships</div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        {Object.keys(selectedRelTypes).map(r => (
                            <label key={r} className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedRelTypes[r]}
                                    onChange={() => setSelectedRelTypes(prev => ({ ...prev, [r]: !prev[r] }))}
                                    className="rounded border-slate-700 bg-slate-950"
                                />
                                <span>{r}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Canvas ReactFlow Controls */}
            <div className="absolute bottom-4 left-4 z-20 flex space-x-2">
                <button
                    onClick={() => reactFlowInstance.fitView()}
                    className="p-2 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 text-slate-300 shadow-md"
                    title="Fit to Screen"
                >
                    <Maximize2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setShowLegend(!showLegend)}
                    className="p-2 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 text-slate-300 shadow-md"
                    title="Toggle Legend"
                >
                    <Info className="w-4 h-4" />
                </button>
            </div>

            {/* Legend Overlay */}
            {showLegend && (
                <div className="absolute bottom-14 left-4 z-30 bg-slate-900/95 border border-slate-800 p-3 rounded-lg shadow-xl space-y-2">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Graph Legend</div>
                    {Object.entries(TYPE_COLORS).map(([t, color]) => (
                        <div key={t} className="flex items-center space-x-2 text-[10px]">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                            <span className="text-slate-300">{t}</span>
                        </div>
                    ))}
                </div>
            )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                fitView
                className="bg-slate-950"
            >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#334155" />
            </ReactFlow>
        </div>
    );
}

export default function GraphCanvas(props: any) {
    return (
        <ReactFlowProvider>
            <GraphCanvasInner {...props} />
        </ReactFlowProvider>
    );
}
