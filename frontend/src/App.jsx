import { useState, useEffect, useCallback } from 'react';
import {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    login,
    register,
    getMe,
    getAdminDashboard,
    getAdminUsers,
    getAdminReports,
    sendAdminReportEmail,
    forgotPassword,
    resetPassword,
} from './api';
import './App.css';

const EMPTY_FORM = { title: '', description: '', priority: 'medium' };

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
   Confirmation Dialog
   -------------------------------------------------------------------------- */
function ConfirmDialog({ msg, onConfirm, onCancel }) {
    return (
        <div className="slate-modal-backdrop">
            <div className="slate-modal-box">
                <h3 className="headline-md" style={{ fontSize: '18px', marginBottom: '8px' }}>Confirm Action</h3>
                <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>{msg}</p>
                <div className="slate-modal-actions">
                    <button className="btn btn-secondary btn-sm" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={onConfirm}>
                        Delete Permanently
                    </button>
                </div>
            </div>
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
   Main Application Component
   -------------------------------------------------------------------------- */
export default function App() {
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

    // Active Sidebar View:
    // Admin: 'overview' | 'reports' | 'users' | 'tasks'
    // User: 'my-tasks' | 'create-task' | 'policies'
    const [activeTab, setActiveTab] = useState('overview');

    // Admin State
    const [adminStats, setAdminStats] = useState(null);
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminUsers, setAdminUsers] = useState([]);
    const [adminUsersLoading, setAdminUsersLoading] = useState(false);

    // Admin Reports State
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [reportResult, setReportResult] = useState(null);
    const [presetActive, setPresetActive] = useState('all');

    // Admin Dispatch Email to kirtanjogani612@gmail.com
    const [adminReportRecipient, setAdminReportRecipient] = useState('kirtanjogani612@gmail.com');
    const [dispatchEmailLoading, setDispatchEmailLoading] = useState(false);

    // User Filter State
    const [userFilter, setUserFilter] = useState('all'); // 'all' | 'ongoing' | 'completed'
    const [userPriorityFilter, setUserPriorityFilter] = useState('all'); // 'all' | 'low' | 'medium' | 'high'
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [form, setForm] = useState(EMPTY_FORM);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);

    // Edit State
    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [editLoading, setEditLoading] = useState(false);

    const [confirmId, setConfirmId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [toasts, setToasts] = useState([]);

    const handleAuth = (t, u) => {
        localStorage.setItem('token', t);
        setToken(t);
        if (u) {
            localStorage.setItem('user', JSON.stringify(u));
            setUser(u);
            setActiveTab(u.role === 'admin' ? 'overview' : 'my-tasks');
        }
    };

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setTasks([]);
        setAdminStats(null);
        setReportResult(null);
        setAdminUsers([]);
    }, []);

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
                    setActiveTab(res.data.role === 'admin' ? 'overview' : 'my-tasks');
                })
                .catch(() => handleLogout());
        }
    }, [token, user, handleLogout]);

    const addToast = useCallback((msg, type = 'success') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, msg, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
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

    const fetchAdminStats = useCallback(async () => {
        if (user?.role !== 'admin') return;
        setAdminLoading(true);
        try {
            const res = await getAdminDashboard();
            setAdminStats(res.data);
        } catch (err) {
            addToast('Could not load executive statistics', 'error');
        } finally {
            setAdminLoading(false);
        }
    }, [user?.role, addToast]);

    const fetchAdminUsersList = useCallback(async () => {
        if (user?.role !== 'admin') return;
        setAdminUsersLoading(true);
        try {
            const res = await getAdminUsers();
            setAdminUsers(res.data);
        } catch (err) {
            addToast('Could not load user directory', 'error');
        } finally {
            setAdminUsersLoading(false);
        }
    }, [user?.role, addToast]);

    const handleGenerateReport = useCallback(async (start = reportStartDate, end = reportEndDate) => {
        setReportLoading(true);
        try {
            const res = await getAdminReports(start, end);
            setReportResult(res);
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setReportLoading(false);
        }
    }, [reportStartDate, reportEndDate, addToast]);

    useEffect(() => {
        if (token) {
            fetchTasks();
            if (user?.role === 'admin') {
                fetchAdminStats();
                handleGenerateReport('', '');
                fetchAdminUsersList();
            }
        }
    }, [token, user?.role, fetchTasks, fetchAdminStats, handleGenerateReport, fetchAdminUsersList]);

    // Send Report to kirtanjogani612@gmail.com
    const handleSendAdminEmail = async () => {
        if (!adminReportRecipient) {
            addToast('Please enter a recipient email address', 'error');
            return;
        }
        setDispatchEmailLoading(true);
        try {
            const res = await sendAdminReportEmail(adminReportRecipient, reportStartDate, reportEndDate);
            addToast(`Report successfully dispatched to ${adminReportRecipient}`);
        } catch (err) {
            addToast(err.message || 'Failed to dispatch report email', 'error');
        } finally {
            setDispatchEmailLoading(false);
        }
    };

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
            if (user?.role === 'admin') {
                fetchAdminStats();
                handleGenerateReport(reportStartDate, reportEndDate);
            }
        } catch (err) {
            setTasks((prev) => prev.filter((t) => t._id !== tempId));
            setForm(form);
            setFormError(err.message);
            addToast(err.message, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    // Requirement 5: Non-reversible task completion
    const handleCompleteTask = async (task) => {
        if (task.completed) {
            addToast('Completed tasks cannot be reverted back to ongoing.', 'error');
            return;
        }

        try {
            const res = await updateTask(task._id, { completed: true });
            setTasks((prev) => prev.map((t) => (t._id === task._id ? res.data : t)));
            addToast('Task finalized! Non-reversible rule applied.');
            if (user?.role === 'admin') {
                fetchAdminStats();
                handleGenerateReport(reportStartDate, reportEndDate);
            }
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            const res = await updateTask(editId, editForm);
            setTasks((prev) => prev.map((t) => (t._id === editId ? res.data : t)));
            setEditId(null);
            addToast('Task details updated');
            if (user?.role === 'admin') {
                fetchAdminStats();
                handleGenerateReport(reportStartDate, reportEndDate);
            }
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async () => {
        const id = confirmId;
        setConfirmId(null);
        setDeleteLoading(id);
        try {
            await deleteTask(id);
            setTasks((prev) => prev.filter((t) => t._id !== id));
            addToast('Task permanently deleted');
            if (user?.role === 'admin') {
                fetchAdminStats();
                handleGenerateReport(reportStartDate, reportEndDate);
            }
        } catch (err) {
            addToast(err.message, 'error');
        } finally {
            setDeleteLoading(null);
        }
    };

    const setDatePreset = (preset) => {
        setPresetActive(preset);
        const now = new Date();
        let start = '';
        let end = now.toISOString().split('T')[0];

        if (preset === 'today') {
            start = end;
        } else if (preset === '7days') {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            start = d.toISOString().split('T')[0];
        } else if (preset === '30days') {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            start = d.toISOString().split('T')[0];
        } else if (preset === 'all') {
            start = '';
            end = '';
        }

        setReportStartDate(start);
        setReportEndDate(end);
        handleGenerateReport(start, end);
    };

    const exportReportCsv = () => {
        if (!reportResult?.data || reportResult.data.length === 0) {
            addToast('No tasks to export in the selected range', 'error');
            return;
        }
        const headers = ['Title', 'Description', 'Priority', 'Status', 'Created At'];
        const rows = reportResult.data.map((t) => [
            `"${(t.title || '').replace(/"/g, '""')}"`,
            `"${(t.description || '').replace(/"/g, '""')}"`,
            t.priority,
            t.completed ? 'Completed' : 'Ongoing',
            new Date(t.createdAt).toLocaleString(),
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `slate_report_${reportStartDate || 'all'}_to_${reportEndDate || 'all'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('CSV export generated successfully');
    };

    if (!token) return <AuthForm onAuth={handleAuth} />;

    // User filtered tasks
    const userFilteredTasks = tasks.filter((t) => {
        if (userFilter === 'ongoing' && t.completed) return false;
        if (userFilter === 'completed' && !t.completed) return false;
        if (userPriorityFilter !== 'all' && t.priority !== userPriorityFilter) return false;
        if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const ongoingCount = tasks.filter((t) => !t.completed).length;
    const completedCount = tasks.filter((t) => t.completed).length;

    return (
        <div className="slate-app">
            <Toast toasts={toasts} />
            {confirmId && (
                <ConfirmDialog
                    msg="Are you sure you want to permanently delete this task? This action cannot be reversed."
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmId(null)}
                />
            )}

            {/* Topbar */}
            <header className="slate-topbar">
                <div className="topbar-brand">
                    <div className="brand-icon-box">✓</div>
                    <span className="brand-name">Slate Workspace</span>
                    <span className="brand-subtag">v2.0</span>
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

            {/* App Layout: Fixed 260px Sidebar + Main Canvas */}
            <div className="slate-body-layout">
                {/* 260px Sidebar */}
                <aside className="slate-sidebar">
                    <div className="sidebar-nav-group">
                        <div className="nav-section-title">Navigation</div>

                        {user?.role === 'admin' ? (
                            <>
                                <button
                                    className={`nav-item-btn ${activeTab === 'overview' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('overview')}
                                >
                                    <span className="nav-item-icon">📈</span>
                                    <span>Executive Overview</span>
                                </button>
                                <button
                                    className={`nav-item-btn ${activeTab === 'reports' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('reports')}
                                >
                                    <span className="nav-item-icon">📊</span>
                                    <span>Audit &amp; Date Reports</span>
                                </button>
                                <button
                                    className={`nav-item-btn ${activeTab === 'users' ? 'active' : ''}`}
                                    onClick={() => { setActiveTab('users'); fetchAdminUsersList(); }}
                                >
                                    <span className="nav-item-icon">👥</span>
                                    <span>User Directory ({adminUsers.length})</span>
                                </button>
                                <button
                                    className={`nav-item-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('tasks')}
                                >
                                    <span className="nav-item-icon">📋</span>
                                    <span>System Tasks ({tasks.length})</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className={`nav-item-btn ${activeTab === 'my-tasks' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('my-tasks')}
                                >
                                    <span className="nav-item-icon">📝</span>
                                    <span>My Tasks ({tasks.length})</span>
                                </button>
                                <button
                                    className={`nav-item-btn ${activeTab === 'create-task' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('create-task')}
                                >
                                    <span className="nav-item-icon">➕</span>
                                    <span>Create New Task</span>
                                </button>
                                <button
                                    className={`nav-item-btn ${activeTab === 'policies' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('policies')}
                                >
                                    <span className="nav-item-icon">ℹ️</span>
                                    <span>Workflow Policies</span>
                                </button>
                            </>
                        )}
                    </div>

                    <div className="sidebar-footer-card">
                        <div className="sidebar-footer-label">Admin Email Target</div>
                        <div className="sidebar-footer-val">kirtanjogani612@gmail.com</div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="slate-main-canvas">
                    {/* ================================================================= */}
                    {/* ADMIN VIEW 1: EXECUTIVE OVERVIEW                                  */}
                    {/* ================================================================= */}
                    {user?.role === 'admin' && activeTab === 'overview' && (
                        <div>
                            <div className="slate-banner-card">
                                <div>
                                    <h2 className="headline-md">Executive Control Center</h2>
                                    <p className="body-md">Real-time workspace telemetry, user distribution, and task metrics.</p>
                                </div>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => { fetchAdminStats(); fetchTasks(); }}
                                    disabled={adminLoading}
                                >
                                    {adminLoading ? 'Refreshing...' : '↻ Sync Data'}
                                </button>
                            </div>

                            {adminStats && (
                                <div className="kpi-grid">
                                    <div className="kpi-box">
                                        <div className="kpi-icon-wrap">👥</div>
                                        <div>
                                            <div className="kpi-val">{adminStats.totalUsers}</div>
                                            <div className="kpi-lbl">Total Users</div>
                                        </div>
                                    </div>
                                    <div className="kpi-box">
                                        <div className="kpi-icon-wrap">📋</div>
                                        <div>
                                            <div className="kpi-val">{adminStats.totalTasks}</div>
                                            <div className="kpi-lbl">Total Tasks</div>
                                        </div>
                                    </div>
                                    <div className="kpi-box">
                                        <div className="kpi-icon-wrap" style={{ color: 'var(--color-success)' }}>✓</div>
                                        <div>
                                            <div className="kpi-val" style={{ color: 'var(--color-success)' }}>{adminStats.completedTasks}</div>
                                            <div className="kpi-lbl">Completed</div>
                                        </div>
                                    </div>
                                    <div className="kpi-box">
                                        <div className="kpi-icon-wrap" style={{ color: 'var(--color-warning)' }}>⏳</div>
                                        <div>
                                            <div className="kpi-val" style={{ color: 'var(--color-warning)' }}>{adminStats.pendingTasks}</div>
                                            <div className="kpi-lbl">In Progress</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quick Report Dispatch Box */}
                            <div className="email-dispatch-box">
                                <div className="email-dispatch-info">
                                    <div className="email-icon-circle">✉</div>
                                    <div>
                                        <div className="email-title-text">Executive Audit Email Service</div>
                                        <div className="email-desc-text">
                                            Send complete task summary to <strong>kirtanjogani612@gmail.com</strong>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={handleSendAdminEmail}
                                    disabled={dispatchEmailLoading}
                                >
                                    {dispatchEmailLoading ? 'Transmitting Email...' : '📧 Send Report to kirtanjogani612@gmail.com'}
                                </button>
                            </div>

                            {/* Recent Activity Snapshot */}
                            <div className="slate-card">
                                <div className="slate-card-header">
                                    <div>
                                        <div className="slate-card-title">Recent System Tasks</div>
                                        <div className="slate-card-subtitle">Showing latest 5 recorded tasks across all users</div>
                                    </div>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('tasks')}>
                                        View All
                                    </button>
                                </div>

                                <div className="table-container">
                                    <table className="slate-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Priority</th>
                                                <th>Status</th>
                                                <th>Recorded Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.slice(0, 5).map((t) => (
                                                <tr key={t._id}>
                                                    <td style={{ fontWeight: 600 }}>{t.title}</td>
                                                    <td>
                                                        <span className={`slate-chip chip-${t.priority}`}>{t.priority}</span>
                                                    </td>
                                                    <td>
                                                        {t.completed ? (
                                                            <span className="slate-chip chip-completed">✓ Completed</span>
                                                        ) : (
                                                            <span className="slate-chip chip-ongoing">⏳ Ongoing</span>
                                                        )}
                                                    </td>
                                                    <td style={{ color: 'var(--color-secondary)' }}>
                                                        {new Date(t.createdAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================================================================= */}
                    {/* ADMIN VIEW 2: AUDIT & DATE RANGE REPORTS                          */}
                    {/* ================================================================= */}
                    {user?.role === 'admin' && activeTab === 'reports' && (
                        <div>
                            <div className="slate-banner-card">
                                <div>
                                    <h2 className="headline-md">Audit &amp; Date Range Reports</h2>
                                    <p className="body-md">Query, analyze, and export task telemetry for any custom calendar window.</p>
                                </div>
                                {reportResult?.data?.length > 0 && (
                                    <button className="btn btn-secondary btn-sm" onClick={exportReportCsv}>
                                        📥 Export CSV
                                    </button>
                                )}
                            </div>

                            {/* Quick Action: Send to kirtanjogani612@gmail.com */}
                            <div className="email-dispatch-box">
                                <div className="email-dispatch-info">
                                    <div className="email-icon-circle">✉</div>
                                    <div>
                                        <div className="email-title-text">Send Report via Nodemailer</div>
                                        <div className="email-desc-text">
                                            Recipient: <strong>{adminReportRecipient}</strong>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="email"
                                        style={{ width: '240px', padding: '6px 10px', fontSize: '13px' }}
                                        value={adminReportRecipient}
                                        onChange={(e) => setAdminReportRecipient(e.target.value)}
                                        placeholder="admin@company.com"
                                    />
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleSendAdminEmail}
                                        disabled={dispatchEmailLoading}
                                    >
                                        {dispatchEmailLoading ? 'Dispatching...' : '📧 Send Email'}
                                    </button>
                                </div>
                            </div>

                            <div className="slate-card">
                                <div className="slate-card-header">
                                    <div className="slate-card-title">Filter by Date Range</div>
                                </div>

                                <form
                                    className="report-action-panel"
                                    onSubmit={(e) => { e.preventDefault(); handleGenerateReport(); }}
                                >
                                    <div className="report-date-field">
                                        <label htmlFor="start-date-input">Start Date</label>
                                        <input
                                            id="start-date-input"
                                            type="date"
                                            value={reportStartDate}
                                            onChange={(e) => setReportStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="report-date-field">
                                        <label htmlFor="end-date-input">End Date</label>
                                        <input
                                            id="end-date-input"
                                            type="date"
                                            value={reportEndDate}
                                            onChange={(e) => setReportEndDate(e.target.value)}
                                        />
                                    </div>
                                    <button className="btn btn-primary" type="submit" disabled={reportLoading}>
                                        {reportLoading ? 'Filtering...' : 'Apply Date Filter'}
                                    </button>
                                </form>

                                <div className="presets-wrap">
                                    <span className="label-sm">Presets:</span>
                                    <button
                                        type="button"
                                        className={`btn-preset-pill ${presetActive === 'today' ? 'active' : ''}`}
                                        onClick={() => setDatePreset('today')}
                                    >
                                        Today
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn-preset-pill ${presetActive === '7days' ? 'active' : ''}`}
                                        onClick={() => setDatePreset('7days')}
                                    >
                                        Last 7 Days
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn-preset-pill ${presetActive === '30days' ? 'active' : ''}`}
                                        onClick={() => setDatePreset('30days')}
                                    >
                                        Last 30 Days
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn-preset-pill ${presetActive === 'all' ? 'active' : ''}`}
                                        onClick={() => setDatePreset('all')}
                                    >
                                        All Time
                                    </button>
                                </div>

                                {reportResult && (
                                    <>
                                        <div className="kpi-grid" style={{ marginTop: '16px' }}>
                                            <div className="kpi-box">
                                                <div>
                                                    <div className="kpi-val">{reportResult.summary.totalTasks}</div>
                                                    <div className="kpi-lbl">Tasks in Range</div>
                                                </div>
                                            </div>
                                            <div className="kpi-box">
                                                <div>
                                                    <div className="kpi-val" style={{ color: 'var(--color-success)' }}>
                                                        {reportResult.summary.completedTasks}
                                                    </div>
                                                    <div className="kpi-lbl">Completed</div>
                                                </div>
                                            </div>
                                            <div className="kpi-box">
                                                <div>
                                                    <div className="kpi-val" style={{ color: 'var(--color-warning)' }}>
                                                        {reportResult.summary.pendingTasks}
                                                    </div>
                                                    <div className="kpi-lbl">Ongoing</div>
                                                </div>
                                            </div>
                                            <div className="kpi-box">
                                                <div>
                                                    <div className="kpi-val">{reportResult.summary.completionRate}%</div>
                                                    <div className="kpi-lbl">Completion Rate</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="table-container">
                                            <table className="slate-table">
                                                <thead>
                                                    <tr>
                                                        <th>Task Title</th>
                                                        <th>Priority</th>
                                                        <th>Status</th>
                                                        <th>Creation Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportResult.data.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-outline)' }}>
                                                                No tasks found for the selected date range.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        reportResult.data.map((task) => (
                                                            <tr key={task._id}>
                                                                <td style={{ fontWeight: 600 }}>{task.title}</td>
                                                                <td>
                                                                    <span className={`slate-chip chip-${task.priority}`}>
                                                                        {task.priority}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {task.completed ? (
                                                                        <span className="slate-chip chip-completed">✓ Completed</span>
                                                                    ) : (
                                                                        <span className="slate-chip chip-ongoing">⏳ Ongoing</span>
                                                                    )}
                                                                </td>
                                                                <td style={{ color: 'var(--color-secondary)' }}>
                                                                    {new Date(task.createdAt).toLocaleDateString()}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ================================================================= */}
                    {/* ADMIN VIEW 3: USER DIRECTORY                                      */}
                    {/* ================================================================= */}
                    {user?.role === 'admin' && activeTab === 'users' && (
                        <div>
                            <div className="slate-banner-card">
                                <div>
                                    <h2 className="headline-md">User Directory</h2>
                                    <p className="body-md">All registered workspace accounts and Role-Based Access Control assignments.</p>
                                </div>
                                <button className="btn btn-secondary btn-sm" onClick={fetchAdminUsersList} disabled={adminUsersLoading}>
                                    {adminUsersLoading ? 'Refreshing...' : '↻ Refresh'}
                                </button>
                            </div>

                            <div className="slate-card">
                                <div className="table-container">
                                    <table className="slate-table">
                                        <thead>
                                            <tr>
                                                <th>Email Address</th>
                                                <th>System Role</th>
                                                <th>User ID</th>
                                                <th>Date Enrolled</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adminUsers.map((u) => (
                                                <tr key={u._id}>
                                                    <td style={{ fontWeight: 600 }}>{u.email}</td>
                                                    <td>
                                                        <span className={`role-pill ${u.role === 'admin' ? 'role-pill-admin' : 'role-pill-user'}`}>
                                                            {u.role === 'admin' ? '👑 ADMIN' : '👤 USER'}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-secondary)' }}>
                                                        {u._id}
                                                    </td>
                                                    <td style={{ color: 'var(--color-secondary)' }}>
                                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================================================================= */}
                    {/* ADMIN VIEW 4 / USER VIEW: TASKS MANAGEMENT                        */}
                    {/* ================================================================= */}
                    {(user?.role === 'user' || activeTab === 'tasks' || activeTab === 'my-tasks') && (
                        <div>
                            <div className="slate-banner-card">
                                <div>
                                    <h2 className="headline-md">
                                        {user?.role === 'admin' ? 'System Task Manager' : 'Personal Workspace'}
                                    </h2>
                                    <p className="body-md">
                                        {user?.role === 'admin'
                                            ? 'Full administrative control over all organization tasks.'
                                            : 'Plan, execute, and finalize your work items.'}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span className="slate-chip chip-ongoing">Ongoing: {ongoingCount}</span>
                                    <span className="slate-chip chip-completed">Done: {completedCount}</span>
                                </div>
                            </div>

                            {/* Task Create Card */}
                            <div className="slate-card">
                                <div className="slate-card-title" style={{ marginBottom: '12px' }}>
                                    + Create New Task
                                </div>
                                {formError && <div className="alert-error" style={{ marginBottom: '12px' }}>{formError}</div>}
                                <form onSubmit={handleCreate}>
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
                                {!loading && !error && userFilteredTasks.length === 0 && (
                                    <div className="slate-card" style={{ textAlign: 'center', color: 'var(--color-outline)' }}>
                                        No tasks found matching your filter criteria.
                                    </div>
                                )}

                                {userFilteredTasks.map((task) => (
                                    <div
                                        key={task._id}
                                        className={`task-item-card ${task.completed ? 'completed' : ''}`}
                                    >
                                        {editId === task._id ? (
                                            <form onSubmit={handleUpdate} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                                                    {/* Requirement 5: Non-reversible task completion */}
                                                    {!task.completed ? (
                                                        <>
                                                            <button
                                                                className="btn btn-success btn-sm"
                                                                onClick={() => handleCompleteTask(task)}
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
                    )}

                    {/* ================================================================= */}
                    {/* USER VIEW: CREATE TASK DEDICATED VIEW                             */}
                    {/* ================================================================= */}
                    {user?.role === 'user' && activeTab === 'create-task' && (
                        <div>
                            <div className="slate-banner-card">
                                <div>
                                    <h2 className="headline-md">Create New Task</h2>
                                    <p className="body-md">Draft a new item for your personal productivity board.</p>
                                </div>
                            </div>

                            <div className="slate-card">
                                {formError && <div className="alert-error" style={{ marginBottom: '12px' }}>{formError}</div>}
                                <form onSubmit={handleCreate}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <div>
                                            <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Task Title</label>
                                            <input
                                                placeholder="What needs to be done? (min 3 chars)"
                                                value={form.title}
                                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                                required
                                                minLength={3}
                                            />
                                        </div>

                                        <div>
                                            <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Description</label>
                                            <textarea
                                                placeholder="Additional context, links, or notes"
                                                value={form.description}
                                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>Priority Level</label>
                                            <select
                                                value={form.priority}
                                                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                            >
                                                <option value="low">Low Priority</option>
                                                <option value="medium">Medium Priority</option>
                                                <option value="high">High Priority</option>
                                            </select>
                                        </div>

                                        <button className="btn btn-primary" type="submit" disabled={formLoading}>
                                            {formLoading ? 'Publishing...' : 'Publish Task'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* ================================================================= */}
                    {/* USER VIEW: POLICIES                                               */}
                    {/* ================================================================= */}
                    {user?.role === 'user' && activeTab === 'policies' && (
                        <div>
                            <div className="slate-banner-card">
                                <div>
                                    <h2 className="headline-md">Workspace Policies &amp; Guidelines</h2>
                                    <p className="body-md">System rules, non-reversibility protocols, and data security.</p>
                                </div>
                            </div>

                            <div className="slate-card">
                                <h3 className="headline-md" style={{ fontSize: '18px', marginBottom: '10px' }}>
                                    Non-Reversible Task Completion (Rule 5)
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
                                    Role-Based Access Control (RBAC)
                                </h3>
                                <p className="body-md">
                                    Your current session is operating under the <strong>Standard User</strong> role. Administrative modules, date range audit generation, executive email dispatching, and user directory management are restricted to users with the <strong>Admin</strong> role.
                                </p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
