export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Thin wrapper around fetch() that prefixes the API base URL and attaches
// the logged-in user's JWT (from localStorage) as a Bearer token, since
// admin resource routes require it. Returns the raw Response, same as fetch.
export const apiFetch = (path, options = {}) => {
    const token = localStorage.getItem('token');

    return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    });
};
