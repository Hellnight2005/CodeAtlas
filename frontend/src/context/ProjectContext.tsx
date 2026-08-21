"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface Project {
    id: string;
    name: string;
    path: string;
    status: string;
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

    const refreshProjects = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("http://localhost:5001/api/projects");
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
                if (data.length > 0) {
                    const current = data.find((p: any) => p.isCurrent) || data[0];
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
            value={{ projects, activeProject, setActiveProject, refreshProjects, isLoading }}
        >
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => useContext(ProjectContext);
