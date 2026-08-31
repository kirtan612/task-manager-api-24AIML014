const BASE_URL = 'http://localhost:5000';

const handle = async (res) => {
    if (res.status === 401) {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('unauthorized'));
        throw new Error('Session expired. Please log in again.');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
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
