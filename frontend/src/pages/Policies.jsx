export default function Policies() {
    return (
        <div>
            <div className="slate-banner-card">
                <div>
                    <h2 className="headline-md">Workspace Policies &amp; Governance</h2>
                    <p className="body-md">System rules, non-reversibility protocols, and data security standards.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="lazy-chunk-indicator">📦 Dynamic Chunk: Policies.chunk.js</span>
                </div>
            </div>

            <div className="slate-card">
                <h3 className="headline-md" style={{ fontSize: '18px', marginBottom: '10px' }}>
                    Non-Reversible Task Completion (Protocol 5)
                </h3>
                <p className="body-md" style={{ marginBottom: '12px' }}>
                    In accordance with enterprise audit standards, once a task is flagged as <strong>Completed</strong>, it is permanently locked and cannot be transitioned back to an ongoing state.
                </p>
                <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
                    If additional work is required on a finalized task, please create a new follow-up task to ensure an uncompromised audit trail.
                </p>
            </div>

            <div className="slate-card">
                <h3 className="headline-md" style={{ fontSize: '18px', marginBottom: '10px' }}>
                    Role-Based Access Control (RBAC Architecture)
                </h3>
                <p className="body-md" style={{ marginBottom: '12px' }}>
                    Standard users retain complete autonomy over their personal task boards. Administrative modules, date range audit generation, executive email dispatching, and user directory management are strictly restricted to verified administrative tokens.
                </p>
                <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
                    All privilege changes and administrative queries are logged with timestamped IP telemetry for regulatory compliance.
                </p>
            </div>

            <div className="slate-card">
                <h3 className="headline-md" style={{ fontSize: '18px', marginBottom: '10px' }}>
                    Frontend Performance &amp; Code Splitting Standard
                </h3>
                <p className="body-md">
                    To comply with CO1 / PO3 performance objectives, all major feature routes (Projects, Contact, Reports, User Directory, Policies) and heavy analytics packages (Recharts) are delivered via dynamic chunks using <code>React.lazy()</code> and <code>Suspense</code>. This guarantees sub-second initial load speeds on mobile and low-bandwidth connections.
                </p>
            </div>
        </div>
    );
}
