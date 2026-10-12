import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    login,
    register,
    getMe,
    forgotPassword,
    resetPassword,
} from './api';
import './App.css';
import LoadingFallback from './components/LoadingFallback';

/* --------------------------------------------------------------------------
   Step 3: Route-Based Code Splitting via React.lazy() & dynamic import()
   Each route below is compiled into an isolated chunk (e.g. Projects.chunk.js)
   -------------------------------------------------------------------------- */
const Home = lazy(() => import('./pages/Home'));
const Projects = lazy(() => import('./pages/Projects'));
const Contact = lazy(() => import('./pages/Contact'));
const AdminReports = lazy(() => import('./pages/AdminReports'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const Policies = lazy(() => import('./pages/Policies'));

const getTokenFromUrl = () => {
    const path = window.location.pathname;
    const match = path.match(/\/reset-password\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || '';
};

/* --------------------------------------------------------------------------
   Toast Notifications
   -------------------------------------------------------------------------- */
function Toast({ toasts }) {
    return (
        <div className="toast-stack">
            {toasts.map((t) => (
                <div key={t.id} className={`slate-toast ${t.type === 'error' ? 'slate-toast-error' : ''}`}>
                    {t.msg}
                </div>
            ))}
        </div>
    );
}

/* --------------------------------------------------------------------------
   Authentication Form (Slate Minimalist Aesthetic)
   -------------------------------------------------------------------------- */
function AuthForm({ onAuth }) {
    const initialToken = getTokenFromUrl();
    const [mode, setMode] = useState(initialToken ? 'reset-password' : 'login');
    const [resetToken, setResetToken] = useState(initialToken);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const switchMode = (newMode) => {
        setMode(newMode);
        setError(null);
        setSuccessMsg(null);
        setPassword('');
        setConfirmPassword('');
    };

    const fillAdminJogani = () => {
        setEmail('kirtanjogani612@gmail.com');
        setPassword('Admin@123');
        setError(null);
    };

    const fillAdminDefault = () => {
        setEmail('admin@example.com');
        setPassword('Admin@123');
        setError(null);
    };

    const fillDemoUser = () => {
        setEmail('user@example.com');
        setPassword('User@123');
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setLoading(true);

        try {
            if (mode === 'login') {
                const res = await login(email, password);
                onAuth(res.token, res.user);
            } else if (mode === 'register') {
                await register(email, password);
                switchMode('login');
                setSuccessMsg('Account registered successfully! Please log in.');
            } else if (mode === 'forgot-password') {
                const res = await forgotPassword(email);
                setSuccessMsg(res.message || 'If an account exists with this email, a password reset link has been sent.');
            } else if (mode === 'reset-password') {
                if (!resetToken) throw new Error('Reset token is required.');
                if (password !== confirmPassword) throw new Error('Passwords do not match.');
                if (password.length < 8) throw new Error('Password must be at least 8 characters long.');
                const res = await resetPassword(resetToken, password, confirmPassword);
                setSuccessMsg(res.message || 'Password reset successfully. You can now login.');
                setPassword('');
                setConfirmPassword('');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">✓</div>
                    <h1 className="headline-md" style={{ marginBottom: '4px' }}>Slate Workspace</h1>
                    <p className="body-sm">Enterprise Task Management &amp; Analytics</p>
                </div>

                {mode === 'login' && (
                    <div className="demo-account-trays">
                        <div className="demo-trays-label">Quick-Fill Enterprise Credentials</div>
                        <div className="demo-buttons-flex">
                            <button type="button" className="btn-demo-fill" onClick={fillAdminJogani}>
                                <span className="fill-role">👑 Admin (Primary)</span>
                                <span className="fill-email">kirtanjogani612@gmail.com</span>
                            </button>
                            <button type="button" className="btn-demo-fill" onClick={fillAdminDefault}>
                                <span className="fill-role">👑 Admin (Default)</span>
                                <span className="fill-email">admin@example.com</span>
                            </button>
                            <button type="button" className="btn-demo-fill" onClick={fillDemoUser}>
                                <span className="fill-role">👤 Standard User</span>
                                <span className="fill-email">user@example.com</span>
                            </button>
                        </div>
                    </div>
                )}

                {error && <div className="alert-error" style={{ marginBottom: '14px' }}>{error}</div>}

                {successMsg && (
                    <div className="alert-success" style={{ marginBottom: '14px' }}>
                        <p>{successMsg}</p>
                        {(mode === 'forgot-password' || mode === 'reset-password') && (
                            <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                style={{ marginTop: '10px' }}
                                onClick={() => {
                                    switchMode('login');
                                    window.history.pushState({}, '', '/');
                                }}
                            >
                                Return to Login
                            </button>
                        )}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    {(mode === 'login' || mode === 'register') && (
                        <>
                            <input
                                type="email"
                                placeholder="name@company.com"
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
                            {mode === 'login' && (
                                <div style={{ textAlign: 'right' }}>
                                    <button
                                        type="button"
                                        className="link-btn"
                                        onClick={() => switchMode('forgot-password')}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            )}
                            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                                {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Workspace' : 'Create Account'}
                            </button>

                            <div className="auth-footer-links">
                                <span className="body-sm">
                                    {mode === 'login' ? 'New to Slate?' : 'Existing account?'}
                                </span>
                                <button
                                    type="button"
                                    className="link-btn"
                                    onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                                >
                                    {mode === 'login' ? 'Register Account' : 'Sign In'}
                                </button>
                            </div>
                        </>
                    )}

                    {mode === 'forgot-password' && !successMsg && (
                        <>
                            <p className="body-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                                Enter your verified email address. We will dispatch a secure reset link with a 30-minute validity window.
                            </p>
                            <input
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                                {loading ? 'Transmitting...' : 'Send Recovery Email'}
                            </button>
                            <div style={{ textAlign: 'center', marginTop: '6px' }}>
                                <button type="button" className="link-btn" onClick={() => switchMode('login')}>
                                    ← Back to Sign In
                                </button>
                            </div>
                        </>
                    )}

                    {mode === 'reset-password' && !successMsg && (
                        <>
                            {!initialToken && (
                                <input
                                    type="text"
                                    placeholder="Reset Token"
                                    value={resetToken}
                                    onChange={(e) => setResetToken(e.target.value)}
                                    required
                                />
                            )}
                            <input
                                type="password"
                                placeholder="New Password (min 8 characters)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                                {loading ? 'Updating Credentials...' : 'Save New Password'}
                            </button>
                            <div style={{ textAlign: 'center', marginTop: '6px' }}>
                                <button
                                    type="button"
                                    className="link-btn"
                                    onClick={() => {
                                        switchMode('login');
                                        window.history.pushState({}, '', '/');
                                    }}
                                >
                                    ← Back to Sign In
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}

/* --------------------------------------------------------------------------
   Main Application Shell
   -------------------------------------------------------------------------- */
export default function App() {
    const navigate = useNavigate();
    const location = useLocation();

    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((msg, type = 'success') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    }, []);

    const handleAuth = (t, u) => {
        localStorage.setItem('token', t);
        setToken(t);
        if (u) {
            localStorage.setItem('user', JSON.stringify(u));
            setUser(u);
        }
        navigate('/');
    };

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setTasks([]);
        navigate('/');
    }, [navigate]);

    useEffect(() => {
        const handler = () => handleLogout();
        window.addEventListener('unauthorized', handler);
        return () => window.removeEventListener('unauthorized', handler);
    }, [handleLogout]);

    useEffect(() => {
        if (token && !user) {
            getMe()
                .then((res) => {
                    setUser(res.data);
                    localStorage.setItem('user', JSON.stringify(res.data));
                })
                .catch(() => handleLogout());
        }
    }, [token, user, handleLogout]);

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
        if (token) {
            fetchTasks();
        }
    }, [token, fetchTasks]);

    const handleCreateTask = async (formBody) => {
        const tempId = `temp-${Date.now()}`;
        const optimistic = { _id: tempId, ...formBody, completed: false, createdAt: new Date() };
        setTasks((prev) => [optimistic, ...prev]);

        try {
            const res = await createTask(formBody);
            setTasks((prev) => prev.map((t) => (t._id === tempId ? res.data : t)));
            addToast('Task created successfully');
            return res.data;
        } catch (err) {
            setTasks((prev) => prev.filter((t) => t._id !== tempId));
            addToast(err.message, 'error');
            throw err;
        }
    };

    const handleCompleteTask = async (task) => {
        if (task.completed) {
            addToast('Completed tasks cannot be reverted back to ongoing.', 'error');
            return;
        }
        try {
            const res = await updateTask(task._id, { completed: true });
            setTasks((prev) => prev.map((t) => (t._id === task._id ? res.data : t)));
            addToast('Task finalized! Non-reversible rule applied.');
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    const handleUpdateTask = async (id, updatedBody) => {
        try {
            const res = await updateTask(id, updatedBody);
            setTasks((prev) => prev.map((t) => (t._id === id ? res.data : t)));
            addToast('Task details updated');
            return res.data;
        } catch (err) {
            addToast(err.message, 'error');
            throw err;
        }
    };

    const handleDeleteTask = async (id) => {
        try {
            await deleteTask(id);
            setTasks((prev) => prev.filter((t) => t._id !== id));
            addToast('Task permanently deleted');
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    if (!token) return <AuthForm onAuth={handleAuth} />;

    return (
        <div className="slate-app">
            <Toast toasts={toasts} />

            {/* Topbar */}
            <header className="slate-topbar">
                <div className="topbar-brand" onClick={() => navigate('/')}>
                    <div className="brand-icon-box">✓</div>
                    <span className="brand-name">Slate Workspace</span>
                    <span className="brand-subtag">v2.1 (Lazy Loaded)</span>
                </div>

                <div className="topbar-actions">
                    <div className="smtp-status-chip">
                        <span className="status-dot-active"></span>
                        <span>SMTP: avenixfintech13@gmail.com</span>
                    </div>

                    <div className="user-badge-wrap">
                        <span className="user-email-text">{user?.email}</span>
                        <span className={`role-pill ${user?.role === 'admin' ? 'role-pill-admin' : 'role-pill-user'}`}>
                            {user?.role === 'admin' ? '👑 ADMIN' : '👤 USER'}
                        </span>
                    </div>

                    <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Layout: Sidebar + Canvas */}
            <div className="slate-body-layout">
                {/* 260px Sidebar */}
                <aside className="slate-sidebar">
                    <div className="sidebar-nav-group">
                        <div className="nav-section-title">Navigation (Code-Split)</div>

                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) => `nav-item-btn ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-item-icon">📋</span>
                            <span>{user?.role === 'admin' ? 'Task Board' : 'My Tasks'} ({tasks.length})</span>
                        </NavLink>

                        <NavLink
                            to="/projects"
                            className={({ isActive }) => `nav-item-btn ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-item-icon">🚀</span>
                            <span>Projects Portfolio</span>
                        </NavLink>

                        <NavLink
                            to="/contact"
                            className={({ isActive }) => `nav-item-btn ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-item-icon">✉️</span>
                            <span>Support &amp; Contact</span>
                        </NavLink>

                        {user?.role === 'admin' && (
                            <>
                                <div className="nav-section-title" style={{ marginTop: '14px' }}>Administrative</div>
                                <NavLink
                                    to="/admin/reports"
                                    className={({ isActive }) => `nav-item-btn ${isActive ? 'active' : ''}`}
                                >
                                    <span className="nav-item-icon">📊</span>
                                    <span>Audit Reports</span>
                                </NavLink>
                                <NavLink
                                    to="/admin/users"
                                    className={({ isActive }) => `nav-item-btn ${isActive ? 'active' : ''}`}
                                >
                                    <span className="nav-item-icon">👥</span>
                                    <span>User Directory</span>
                                </NavLink>
                            </>
                        )}

                        <div className="nav-section-title" style={{ marginTop: '14px' }}>System</div>
                        <NavLink
                            to="/policies"
                            className={({ isActive }) => `nav-item-btn ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-item-icon">ℹ️</span>
                            <span>Workspace Policies</span>
                        </NavLink>
                    </div>

                    <div className="sidebar-footer-card">
                        <div className="sidebar-footer-label">Admin Email Target</div>
                        <div className="sidebar-footer-val">kirtanjogani612@gmail.com</div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="slate-main-canvas">
                    {/* --------------------------------------------------------------
                       Step 4: Suspense wrapping only the Routes block with a
                       meaningful fallback UI
                       -------------------------------------------------------------- */}
                    <Suspense fallback={<LoadingFallback message="Loading requested module..." />}>
                        <Routes>
                            <Route
                                path="/"
                                element={
                                    <Home
                                        tasks={tasks}
                                        loading={loading}
                                        error={error}
                                        user={user}
                                        onCreate={handleCreateTask}
                                        onUpdate={handleUpdateTask}
                                        onDelete={handleDeleteTask}
                                        onComplete={handleCompleteTask}
                                        onRefresh={fetchTasks}
                                    />
                                }
                            />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/contact" element={<Contact addToast={addToast} />} />
                            <Route path="/policies" element={<Policies />} />
                            <Route path="/admin/reports" element={<AdminReports addToast={addToast} />} />
                            <Route path="/admin/users" element={<AdminUsers addToast={addToast} />} />
                            {/* Fallback alias route */}
                            <Route
                                path="*"
                                element={
                                    <Home
                                        tasks={tasks}
                                        loading={loading}
                                        error={error}
                                        user={user}
                                        onCreate={handleCreateTask}
                                        onUpdate={handleUpdateTask}
                                        onDelete={handleDeleteTask}
                                        onComplete={handleCompleteTask}
                                        onRefresh={fetchTasks}
                                    />
                                }
                            />
                        </Routes>
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
