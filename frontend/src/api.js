/**
 * Centralized API Service for Task Manager
 * Communicates with backend configured via Vite environment variable VITE_API_BASE_URL
 */
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Strip any accidental trailing slashes (e.g., https://api.render.com/ -> https://api.render.com)
export const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

const handle = async (res) => {
    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('unauthorized'));
        throw new Error('Session expired. Please log in again.');
    }

    let data = {};
    try {
        data = await res.json();
    } catch {
        data = {};
    }

    if (!res.ok) {
        throw new Error(data.error || data.message || `Request failed (${res.status})`);
    }

    return data;
};

const request = async (url, options = {}) => {
    try {
        const res = await fetch(url, options);
        return await handle(res);
    } catch (err) {
        if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
            throw new Error('Unable to connect to the backend API. Please check your network connection or server status.');
        }
        throw err;
    }
};

// -----------------------------------------------------------------------------
// Authentication Endpoints
// -----------------------------------------------------------------------------
export const register = (email, password) =>
    request(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

export const login = (email, password) =>
    request(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

export const getMe = () =>
    request(`${BASE_URL}/auth/me`, { headers: authHeaders() });

// -----------------------------------------------------------------------------
// Task Endpoints
// -----------------------------------------------------------------------------
export const getTasks = () =>
    request(`${BASE_URL}/tasks`, { headers: authHeaders() });

export const createTask = (body) =>
    request(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
    });

export const updateTask = (id, body) =>
    request(`${BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body),
    });

export const deleteTask = (id) =>
    request(`${BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });

// -----------------------------------------------------------------------------
// Admin Endpoints
// -----------------------------------------------------------------------------
export const getAdminDashboard = () =>
    request(`${BASE_URL}/admin/dashboard`, { headers: authHeaders() });

export const getAdminUsers = () =>
    request(`${BASE_URL}/admin/users`, { headers: authHeaders() });

export const getAdminReports = (startDate = '', endDate = '') => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`${BASE_URL}/admin/reports${query}`, { headers: authHeaders() });
};

export const sendAdminReportEmail = (recipientEmail = 'kirtanjogani612@gmail.com', startDate = '', endDate = '') =>
    request(`${BASE_URL}/admin/reports/email`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ recipientEmail, startDate, endDate }),
    });

// -----------------------------------------------------------------------------
// Password Recovery Endpoints
// -----------------------------------------------------------------------------
export const forgotPassword = (email) =>
    request(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

export const resetPassword = (token, password, confirmPassword) =>
    request(`${BASE_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword }),
    });
