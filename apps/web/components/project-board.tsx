"use client";

import { useEffect, useState } from "react";
import { createProject, deleteProject, getProjects, updateProject, type Project } from "../lib/api";

export function ProjectBoard({ accessToken }: { accessToken: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getProjects(accessToken)
      .then(setProjects)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load projects"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [accessToken]);

  async function addProject() {
    if (!name.trim()) return;
    try {
      const project = await createProject({ name: name.trim() }, accessToken);
      setProjects((current) => [project, ...current]);
      setName("");
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create project");
    }
  }

  async function archiveProject(id: string) {
    try {
      await updateProject(id, { archived: true }, accessToken);
      setProjects((current) => current.filter((project) => project.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to archive project");
    }
  }

  async function removeProject(id: string) {
    try {
      await deleteProject(id, accessToken);
      setProjects((current) => current.filter((project) => project.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete project");
    }
  }

  return (
    <section className="panel" aria-labelledby="projects-heading">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Phase 4</p>
          <h2 id="projects-heading">Projects</h2>
        </div>
      </div>

      <div className="task-create-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void addProject();
          }}
          placeholder="Жаңа жоба..."
          aria-label="Project name"
        />
        <button type="button" onClick={() => void addProject()} disabled={!name.trim()}>
          Қосу
        </button>
      </div>

      {error ? <p role="alert">{error}</p> : null}
      {loading ? <p>Жүктелуде...</p> : null}

      {!loading && projects.length === 0 ? <p>Әзірге жоба жоқ.</p> : null}

      <div className="task-list">
        {projects.map((project) => (
          <article className="task-row" key={project.id}>
            <div>
              <strong>{project.name}</strong>
              <span>{project._count?.tasks ?? 0} тапсырма</span>
            </div>
            <div className="task-actions">
              <button type="button" onClick={() => void archiveProject(project.id)}>
                Архив
              </button>
              <button type="button" onClick={() => void removeProject(project.id)}>
                Өшіру
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
