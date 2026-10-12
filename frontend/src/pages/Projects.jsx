import { useState } from 'react';

const INITIAL_PROJECTS = [
    {
        id: 'proj-1',
        name: 'Enterprise Cloud Core Migration',
        code: 'ENG-2026-01',
        category: 'Backend & Infrastructure',
        progress: 78,
        status: 'Active',
        lead: 'Kirtan Jogani',
        dueDate: '2026-11-15',
        tasksTotal: 18,
        tasksDone: 14,
        description: 'Scalable multi-tenant task processing cluster deployment with distributed cache and audit journaling.',
        tags: ['AWS', 'Docker', 'MongoDB', 'JWT Auth']
    },
    {
        id: 'proj-2',
        name: 'Slate Minimalist UI Modernization',
        code: 'UI-2026-04',
        category: 'Frontend Engineering',
        progress: 92,
        status: 'Review',
        lead: 'Frontend Guild',
        dueDate: '2026-10-20',
        tasksTotal: 25,
        tasksDone: 23,
        description: 'Implementation of route-based code splitting, lazy loading, and DevTools Network optimization.',
        tags: ['React 19', 'Vite', 'Code Splitting', 'Suspense']
    },
    {
        id: 'proj-3',
        name: 'Automated SMTP Telemetry Dispatcher',
        code: 'NOTIF-2026-09',
        category: 'Integrations & DevOps',
        progress: 60,
        status: 'Active',
        lead: 'Security Ops',
        dueDate: '2026-12-05',
        tasksTotal: 10,
        tasksDone: 6,
        description: 'Automated executive email delivery via Nodemailer with Gmail App Passwords and SSL handshake.',
        tags: ['Nodemailer', 'SMTP', 'HTML Reports', 'CRON']
    },
];

export default function Projects() {
    const [projects, setProjects] = useState(INITIAL_PROJECTS);
    const [filterCategory, setFilterCategory] = useState('all');
    const [newProjModal, setNewProjModal] = useState(false);
    const [form, setForm] = useState({
        name: '',
        code: '',
        category: 'Backend & Infrastructure',
        lead: '',
        dueDate: '',
        description: '',
        tags: ''
    });

    const handleCreateProject = (e) => {
        e.preventDefault();
        const newProj = {
            id: `proj-${Date.now()}`,
            name: form.name,
            code: form.code || `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
            category: form.category,
            progress: 0,
            status: 'Active',
            lead: form.lead || 'Team Member',
            dueDate: form.dueDate || '2026-12-31',
            tasksTotal: 1,
            tasksDone: 0,
            description: form.description || 'No description provided.',
            tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : ['General']
        };
        setProjects([newProj, ...projects]);
        setNewProjModal(false);
        setForm({ name: '', code: '', category: 'Backend & Infrastructure', lead: '', dueDate: '', description: '', tags: '' });
    };

    const filtered = filterCategory === 'all'
        ? projects
        : projects.filter((p) => p.category === filterCategory);

    return (
        <div>
            {newProjModal && (
                <div className="slate-modal-backdrop">
                    <div className="slate-modal-box" style={{ maxWidth: '520px' }}>
                        <h3 className="headline-md" style={{ fontSize: '18px', marginBottom: '8px' }}>Create New Project</h3>
                        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '14px' }}>
                            Initialize a new project container with milestones and tracking.
                        </p>
                        <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input
                                placeholder="Project Name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    placeholder="Project Code (e.g. ENG-01)"
                                    style={{ flex: 1 }}
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                />
                                <input
                                    placeholder="Lead"
                                    style={{ flex: 1 }}
                                    value={form.lead}
                                    onChange={(e) => setForm({ ...form, lead: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select
                                    style={{ flex: 1 }}
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                >
                                    <option value="Backend & Infrastructure">Backend &amp; Infrastructure</option>
                                    <option value="Frontend Engineering">Frontend Engineering</option>
                                    <option value="Integrations & DevOps">Integrations &amp; DevOps</option>
                                    <option value="Product Strategy">Product Strategy</option>
                                </select>
                                <input
                                    type="date"
                                    style={{ flex: 1 }}
                                    value={form.dueDate}
                                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                />
                            </div>
                            <textarea
                                placeholder="Project Scope and Objectives..."
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                            <input
                                placeholder="Comma separated tags (e.g. React, Node, Cloud)"
                                value={form.tags}
                                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                            />
                            <div className="slate-modal-actions" style={{ marginTop: '8px' }}>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setNewProjModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary btn-sm">
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="slate-banner-card">
                <div>
                    <h2 className="headline-md">Enterprise Projects Portfolio</h2>
                    <p className="body-md">
                        Organize high-level organizational initiatives, track multi-member velocity, and link deliverables.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="lazy-chunk-indicator">📦 Dynamic Chunk: Projects.chunk.js</span>
                    <button className="btn btn-primary btn-sm" onClick={() => setNewProjModal(true)}>
                        + New Project
                    </button>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="filter-tab-bar">
                <div className="filter-pills">
                    <button
                        className={`filter-pill-btn ${filterCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterCategory('all')}
                    >
                        All Categories ({projects.length})
                    </button>
                    <button
                        className={`filter-pill-btn ${filterCategory === 'Frontend Engineering' ? 'active' : ''}`}
                        onClick={() => setFilterCategory('Frontend Engineering')}
                    >
                        Frontend
                    </button>
                    <button
                        className={`filter-pill-btn ${filterCategory === 'Backend & Infrastructure' ? 'active' : ''}`}
                        onClick={() => setFilterCategory('Backend & Infrastructure')}
                    >
                        Backend &amp; Infra
                    </button>
                    <button
                        className={`filter-pill-btn ${filterCategory === 'Integrations & DevOps' ? 'active' : ''}`}
                        onClick={() => setFilterCategory('Integrations & DevOps')}
                    >
                        DevOps &amp; Email
                    </button>
                </div>
            </div>

            {/* Project Cards Grid */}
            <div className="projects-grid">
                {filtered.map((proj) => (
                    <div key={proj.id} className="project-card">
                        <div className="project-card-header">
                            <div>
                                <span className="project-code-tag">{proj.code}</span>
                                <h3 className="project-title">{proj.name}</h3>
                                <span className="project-category-text">{proj.category}</span>
                            </div>
                            <span className={`project-status-pill ${proj.status.toLowerCase()}`}>
                                {proj.status}
                            </span>
                        </div>

                        <p className="project-desc">{proj.description}</p>

                        {/* Progress Bar */}
                        <div className="project-progress-block">
                            <div className="progress-labels">
                                <span>Completion Velocity</span>
                                <strong>{proj.progress}%</strong>
                            </div>
                            <div className="progress-track">
                                <div className="progress-bar-fill" style={{ width: `${proj.progress}%` }}></div>
                            </div>
                        </div>

                        {/* Meta Info */}
                        <div className="project-meta-row">
                            <div>
                                <span className="meta-label">Lead:</span>
                                <span className="meta-val">{proj.lead}</span>
                            </div>
                            <div>
                                <span className="meta-label">Deadline:</span>
                                <span className="meta-val">{proj.dueDate}</span>
                            </div>
                            <div>
                                <span className="meta-label">Tasks:</span>
                                <span className="meta-val">{proj.tasksDone} / {proj.tasksTotal}</span>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="project-tags-row">
                            {proj.tags.map((tag, idx) => (
                                <span key={idx} className="project-tag-chip">#{tag}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
