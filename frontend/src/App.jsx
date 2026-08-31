import { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, updateTask, deleteTask, login, register } from './api';
import './App.css';

const EMPTY_FORM = { title: '', description: '', priority: 'medium' };

function Toast({ toasts }) {
    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
            ))}
        </div>
    );
}

function ConfirmDialog({ msg, onConfirm, onCancel }) {
    return (
        <div className="overlay">
            <div className="dialog">
                <p>{msg}</p>
                <div className="dialog-actions">
                    <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
                    <button className="btn" onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

function AuthForm({ onAuth }) {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = mode === 'login' ? await login(email, password) : await register(email, password);
            if (mode === 'login') {
                onAuth(res.token);
            } else {
                setMode('login');
                setError(null);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h1>Task Manager</h1>
                <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
                {error && <p className="error">{error}</p>}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                />
                <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? '...' : mode === 'login' ? 'Login' : 'Register'}
                </button>
                <p className="auth-switch">
                    {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button type="button" className="link-btn" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}>
                        {mode === 'login' ? 'Register' : 'Login'}
                    </button>
                </p>
            </form>
        </div>
    );
}

export default function App() {
    const [token, setToken] = useState(() => localStorage.getItem('token'));

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [form, setForm] = useState(EMPTY_FORM);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);

    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState(null);

    const [confirmId, setConfirmId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);

    const [toasts, setToasts] = useState([]);

    const handleAuth = (t) => {
        localStorage.setItem('token', t);
        setToken(t);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setTasks([]);
    };

    // Listen for 401 events dispatched by api.js
    useEffect(() => {
        const handler = () => handleLogout();
        window.addEventListener('unauthorized', handler);
        return () => window.removeEventListener('unauthorized', handler);
    }, []);

    const addToast = useCallback((msg, type = 'success') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
    }, []);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getTasks();
            setTasks(res.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (token) fetchTasks();
    }, [token, fetchTasks]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setFormError(null);
        setFormLoading(true);

        const tempId = `temp-${Date.now()}`;
        const optimistic = { _id: tempId, ...form, completed: false, createdAt: new Date() };
        setTasks((prev) => [optimistic, ...prev]);
        setForm(EMPTY_FORM);

        try {
            const res = await createTask(form);
            setTasks((prev) => prev.map((t) => (t._id === tempId ? res.data : t)));
            addToast('Task created successfully');
        } catch (err) {
            setTasks((prev) => prev.filter((t) => t._id !== tempId));
            setForm(form);
            setFormError(err.message);
            addToast(err.message, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const startEdit = (task) => {
        setEditId(task._id);
        setEditForm({ title: task.title, description: task.description || '', priority: task.priority });
        setEditError(null);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setEditError(null);
        setEditLoading(true);
        try {
            const res = await updateTask(editId, editForm);
            setTasks((prev) => prev.map((t) => (t._id === editId ? res.data : t)));
            setEditId(null);
            addToast('Task updated successfully');
        } catch (err) {
            setEditError(err.message);
            addToast(err.message, 'error');
        } finally {
            setEditLoading(false);
        }
    };

    const handleToggle = async (task) => {
        try {
            const res = await updateTask(task._id, { completed: !task.completed });
            setTasks((prev) => prev.map((t) => (t._id === task._id ? res.data : t)));
            addToast(`Task marked ${res.data.completed ? 'completed' : 'incomplete'}`);
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    const handleDelete = async () => {
        const id = confirmId;
        setConfirmId(null);
        setDeleteLoading(id);
        try {
            await deleteTask(id);
            setTasks((prev) => prev.filter((t) => t._id !== id));
            addToast('Task deleted');
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setDeleteLoading(null);
        }
    };

    if (!token) return <AuthForm onAuth={handleAuth} />;

    return (
        <div className="app">
            <Toast toasts={toasts} />
            {confirmId && (
                <ConfirmDialog
                    msg="Are you sure you want to delete this task?"
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmId(null)}
                />
            )}

            <div className="app-header">
                <h1>Task Manager</h1>
                <button className="btn btn-logout" onClick={handleLogout}>Logout</button>
            </div>

            {/* Create Form */}
            <form className="task-form" onSubmit={handleCreate}>
                <h2>New Task</h2>
                {formError && <p className="error">{formError}</p>}
                <input
                    placeholder="Title (min 3 chars)"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    minLength={3}
                />
                <textarea
                    placeholder="Description (optional)"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
                <button className="btn btn-primary" type="submit" disabled={formLoading}>
                    {formLoading ? 'Adding...' : 'Add Task'}
                </button>
            </form>

            {/* Task List */}
            <div className="task-list">
                {loading && <p className="status">Loading tasks...</p>}
                {error && (
                    <div className="error-box">
                        <p>{error}</p>
                        <button className="btn" onClick={fetchTasks}>Retry</button>
                    </div>
                )}
                {!loading && !error && tasks.length === 0 && (
                    <p className="status">No tasks yet. Create one above!</p>
                )}
                {tasks.map((task) => (
                    <div key={task._id} className={`task-card priority-${task.priority} ${task.completed ? 'completed' : ''}`}>
                        {editId === task._id ? (
                            <form className="edit-form" onSubmit={handleUpdate}>
                                {editError && <p className="error">{editError}</p>}
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
                                <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                                <div className="card-actions">
                                    <button className="btn btn-primary" type="submit" disabled={editLoading}>
                                        {editLoading ? 'Saving...' : 'Save'}
                                    </button>
                                    <button className="btn" type="button" onClick={() => setEditId(null)}>Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="task-header">
                                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                                    {task._id.toString().startsWith('temp-') && <span className="badge badge-saving">saving…</span>}
                                </div>
                                <h3>{task.title}</h3>
                                {task.description && <p>{task.description}</p>}
                                <div className="card-actions">
                                    <button className="btn btn-sm" onClick={() => handleToggle(task)}>
                                        {task.completed ? 'Undo' : 'Complete'}
                                    </button>
                                    <button className="btn btn-sm" onClick={() => startEdit(task)}>Edit</button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => setConfirmId(task._id)}
                                        disabled={deleteLoading === task._id}
                                    >
                                        {deleteLoading === task._id ? 'Deleting...' : 'Delete'}
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
