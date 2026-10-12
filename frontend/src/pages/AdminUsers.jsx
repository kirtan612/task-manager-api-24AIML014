import { useState, useEffect, useCallback } from 'react';
import { getAdminUsers } from '../api';

export default function AdminUsers({ addToast }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminUsers();
            setUsers(res.data);
        } catch (err) {
            if (addToast) addToast(err.message || 'Failed to fetch users', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return (
        <div>
            <div className="slate-banner-card">
                <div>
                    <h2 className="headline-md">Enterprise User Directory</h2>
                    <p className="body-md">
                        All registered workspace accounts and Role-Based Access Control assignments.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="lazy-chunk-indicator">📦 Dynamic Chunk: AdminUsers.chunk.js</span>
                    <button className="btn btn-secondary btn-sm" onClick={fetchUsers} disabled={loading}>
                        {loading ? 'Refreshing...' : '↻ Refresh Directory'}
                    </button>
                </div>
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
                            {users.map((u) => (
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
    );
}
