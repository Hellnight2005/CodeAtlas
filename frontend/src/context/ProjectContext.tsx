"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface Project {
    id: string;
    name: string;
    path: string;
    status: string;
    isCurrent?: boolean;
    last_indexed_at?: string;
}

interface ProjectContextType {
    projects: Project[];
    activeProject: Project | null;
    setActiveProject: (project: Project) => void;
    refreshProjects: () => Promise<void>;
    isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType>({
    projects: [],
    activeProject: null,
    setActiveProject: () => { },
    refreshProjects: async () => { },
    isLoading: true,
});

export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSetActiveProject = (project: Project) => {
        setActiveProject(project);
        if (typeof window !== 'undefined') {
            localStorage.setItem('codeatlas_active_proj_id', project.id);
        }
    };

    const refreshProjects = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("http://localhost:5001/api/projects");
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
                if (data.length > 0) {
                    const savedId = typeof window !== 'undefined' ? localStorage.getItem('codeatlas_active_proj_id') : null;
                    const current = (savedId && data.find((p: any) => p.id === savedId)) || data.find((p: any) => p.isCurrent) || data[0];
                    setActiveProject(current);
                }
            }
        } catch (err) {
            console.warn("Failed to fetch registered projects:", err);
            // Default fallback active project
            const fallback: Project = {
                id: "proj_default",
                name: "CodeAtlas Core",
                path: process.cwd(),
                status: "Ready",
                last_indexed_at: new Date().toISOString(),
            };
            setProjects([fallback]);
            if (!activeProject) setActiveProject(fallback);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshProjects();
    }, []);

    return (
        <ProjectContext.Provider
            value={{ projects, activeProject, setActiveProject: handleSetActiveProject, refreshProjects, isLoading }}
        >
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => useContext(ProjectContext);
