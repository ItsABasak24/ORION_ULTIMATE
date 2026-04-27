import { getAccessToken, getCurrentAuth } from './UserService';

const DOMAIN = import.meta.env.VITE_DOMAIN;
const API_BASE = `${DOMAIN}/orion/api/v1`;

export async function sendSearchQuery(query) {
    const token = getAccessToken();
    const auth = getCurrentAuth();
    const sessionId = localStorage.getItem('sessionId');

    const response = await fetch(`${API_BASE}/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            userid: auth?.id,
            sessionid: sessionId,
            query
        })
    });

    if (response.status === 429) {
        return { status: 'limit_reached' };
    }

    if (response.status === 401) {
        return { status: 'unauthorized' };
    }

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return { status: 'ok', result: data.response.result };
}