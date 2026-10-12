import { useState } from 'react';

const EMPTY_FORM = { title: '', description: '', priority: 'medium' };

export default function Home({
    tasks = [],
    loading = false,
    error = null,
    user,
    onCreate,
    onUpdate,
    onDelete,
    onComplete,
    onRefresh
}) {
    const [userFilter, setUserFilter] = useState('all');
    const [userPriorityFilter, setUserPriorityFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [form, setForm] = useState(EMPTY_FORM);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);

    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [editLoading, setEditLoading] = useState(false);

    const [confirmId, setConfirmId] = useState(null);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        setFormLoading(true);
        try {
            await onCreate(form);
            setForm(EMPTY_FORM);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            await onUpdate(editId, editForm);
            setEditId(null);
        } catch {
            // Toast is handled in parent
        } finally {
            setEditLoading(false);
        }
    };

    const ongoingCount = tasks.filter((t) => !t.completed).length;
    const completedCount = tasks.filter((t) => t.completed).length;

    const filteredTasks = tasks.filter((t) => {
        if (userFilter === 'ongoing' && t.completed) return false;
        if (userFilter === 'completed' && !t.completed) return false;
        if (userPriorityFilter !== 'all' && t.priority !== userPriorityFilter) return false;
        if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <div>
            {confirmId && (
                <div className="slate-modal-backdrop">
                    <div className="slate-modal-box">
                        <h3 className="headline-md" style={{ fontSize: '18px', marginBottom: '8px' }}>Confirm Action</h3>
                        <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
                            Are you sure you want to permanently delete this task? This action cannot be reversed.
                        </p>
                        <div className="slate-modal-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => setConfirmId(null)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                    onDelete(confirmId);
                                    setConfirmId(null);
                                }}
                            >
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Banner Card */}
            <div className="slate-banner-card">
                <div>
                    <h2 className="headline-md">
                        {user?.role === 'admin' ? 'System Task Manager' : 'Personal Workspace'}
                    </h2>
                    <p className="body-md">
                        {user?.role === 'admin'
                            ? 'Full administrative control over all organization tasks and workflows.'
                            : 'Plan, execute, and finalize your daily deliverables.'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="slate-chip chip-ongoing">Ongoing: {ongoingCount}</span>
                    <span className="slate-chip chip-completed">Done: {completedCount}</span>
                    {onRefresh && (
                        <button className="btn btn-secondary btn-sm" onClick={onRefresh} title="Reload Tasks">
                            ↻ Refresh
                        </button>
                    )}
                </div>
            </div>

            {/* Task Create Card */}
            <div className="slate-card">
                <div className="slate-card-title" style={{ marginBottom: '12px' }}>
                    + Create New Task
                </div>
                {formError && <div className="alert-error" style={{ marginBottom: '12px' }}>{formError}</div>}
                <form onSubmit={handleFormSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input
                            placeholder="Task title (min 3 chars)"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            required
                            minLength={3}
                        />
                        <textarea
                            placeholder="Additional instructions or notes (optional)"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                        <div className="form-grid-row">
                            <select
                                value={form.priority}
                                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                            >
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                            </select>
                            <button className="btn btn-primary" type="submit" disabled={formLoading}>
                                {formLoading ? 'Adding...' : 'Add Task to Board'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Task Filter Toolbar */}
            <div className="filter-tab-bar">
                <div className="filter-pills">
                    <button
                        className={`filter-pill-btn ${userFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setUserFilter('all')}
                    >
                        All ({tasks.length})
                    </button>
                    <button
                        className={`filter-pill-btn ${userFilter === 'ongoing' ? 'active' : ''}`}
                        onClick={() => setUserFilter('ongoing')}
                    >
                        Ongoing ({ongoingCount})
                    </button>
                    <button
                        className={`filter-pill-btn ${userFilter === 'completed' ? 'active' : ''}`}
                        onClick={() => setUserFilter('completed')}
                    >
                        Completed ({completedCount})
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        style={{ width: '200px' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <select
                        style={{ width: '140px' }}
                        value={userPriorityFilter}
                        onChange={(e) => setUserPriorityFilter(e.target.value)}
                    >
                        <option value="all">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
            </div>

            {/* Task Feed */}
            <div className="task-grid-feed">
                {loading && <p className="body-md">Loading tasks...</p>}
                {error && <div className="alert-error">{error}</div>}
                {!loading && !error && filteredTasks.length === 0 && (
                    <div className="slate-card" style={{ textAlign: 'center', color: 'var(--color-outline)' }}>
                        No tasks found matching your filter criteria.
                    </div>
                )}

                {filteredTasks.map((task) => (
                    <div
                        key={task._id}
                        className={`task-item-card ${task.completed ? 'completed' : ''}`}
                    >
                        {editId === task._id ? (
                            <form onSubmit={handleEditSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <input
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    required
                                    minLength={3}
                                />
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select
                                        value={editForm.priority}
                                        onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                                    >
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                    </select>
                                    <button className="btn btn-primary btn-sm" type="submit" disabled={editLoading}>
                                        {editLoading ? 'Saving...' : 'Save'}
                                    </button>
                                    <button className="btn btn-secondary btn-sm" type="button" onClick={() => setEditId(null)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="task-main-col">
                                    <div className="task-header-line">
                                        <span className={`slate-chip chip-${task.priority}`}>
                                            {task.priority}
                                        </span>
                                        {task.completed ? (
                                            <span className="slate-chip chip-locked">
                                                🔒 Finalized (Non-Reversible)
                                            </span>
                                        ) : (
                                            <span className="slate-chip chip-ongoing">
                                                ⏳ In Progress
                                            </span>
                                        )}
                                    </div>
                                    <div className="task-title-text">{task.title}</div>
                                    {task.description && (
                                        <div className="task-desc-text">{task.description}</div>
                                    )}
                                    <div style={{ fontSize: '11px', color: 'var(--color-secondary)' }}>
                                        Created: {new Date(task.createdAt).toLocaleString()}
                                    </div>
                                </div>

                                <div className="task-actions-col">
                                    {!task.completed ? (
                                        <>
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => onComplete(task)}
                                            >
                                                Complete ✓
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => {
                                                    setEditId(task._id);
                                                    setEditForm({
                                                        title: task.title,
                                                        description: task.description || '',
                                                        priority: task.priority,
                                                    });
                                                }}
                                            >
                                                Edit
                                            </button>
                                        </>
                                    ) : (
                                        <span className="slate-chip chip-locked" title="Completed tasks cannot be moved back to ongoing">
                                            ✓ Locked
                                        </span>
                                    )}
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => setConfirmId(task._id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
