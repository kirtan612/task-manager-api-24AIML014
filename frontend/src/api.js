const BASE_URL = 'http://localhost:5000';

const handle = async (res) => {
    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('unauthorized'));
        throw new Error('Session expired. Please log in again.');
    }
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || data.message || 'Request failed');
    }
    return data;
};

const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const register = (email, password) =>
    fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    }).then(handle);

export const login = (email, password) =>
    fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    }).then(handle);

export const getMe = () =>
    fetch(`${BASE_URL}/auth/me`, { headers: authHeaders() }).then(handle);

export const getTasks = () =>
    fetch(`${BASE_URL}/tasks`, { headers: authHeaders() }).then(handle);

export const createTask = (body) =>
    fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
    }).then(handle);

export const updateTask = (id, body) =>
    fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body),
    }).then(handle);

export const deleteTask = (id) =>
    fetch(`${BASE_URL}/tasks/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle);

// Admin-only API calls
export const getAdminDashboard = () =>
    fetch(`${BASE_URL}/admin/dashboard`, { headers: authHeaders() }).then(handle);

export const getAdminUsers = () =>
    fetch(`${BASE_URL}/admin/users`, { headers: authHeaders() }).then(handle);

export const getAdminReports = (startDate = '', endDate = '') => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetch(`${BASE_URL}/admin/reports${query}`, { headers: authHeaders() }).then(handle);
};

export const sendAdminReportEmail = (recipientEmail = 'kirtanjogani612@gmail.com', startDate = '', endDate = '') =>
    fetch(`${BASE_URL}/admin/reports/email`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ recipientEmail, startDate, endDate }),
    }).then(handle);

// Password Recovery API calls
export const forgotPassword = (email) =>
    fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    }).then(handle);

export const resetPassword = (token, password, confirmPassword) =>
    fetch(`${BASE_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword }),
    }).then(handle);

