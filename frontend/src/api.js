const BASE_URL = 'http://localhost:5000';

const handle = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
    return data;
};

export const getTasks = () => fetch(`${BASE_URL}/tasks`).then(handle);

export const createTask = (body) =>
    fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }).then(handle);

export const updateTask = (id, body) =>
    fetch(`${BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }).then(handle);

export const deleteTask = (id) =>
    fetch(`${BASE_URL}/tasks/${id}`, { method: 'DELETE' }).then(handle);
