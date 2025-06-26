// src/utils/api.js

const API_BASE_URL = 'http://127.0.0.1:5001'; // ✅ Explicitly use IPv4 loopback

const fetchApi = async (url, options = {}) => {
    const { token } = options;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Ensure the URL is correctly formed by joining base with relative path
    const fullUrl = `${API_BASE_URL}${url}`;

    const response = await fetch(fullUrl, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    // Handle empty responses (like 204 No Content) gracefully
    if (response.status === 204 || response.headers.get('content-length') === '0') return null;

    return response.json();
};

export default fetchApi;