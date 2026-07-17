export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Thin wrapper around fetch() that prefixes the API base URL and attaches
// the logged-in user's JWT (from localStorage) as a Bearer token, since
// admin resource routes require it. Returns the raw Response, same as fetch.
export const apiFetch = (path, options = {}) => {
    const token = localStorage.getItem('token');
    // FormData needs the browser to set its own multipart boundary — a
    // forced 'application/json' header here would break file uploads.
    const isFormData = options.body instanceof FormData;

    return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    });
};

// Every controller in this app responds with JSON on error, but an upload
// route can still fail before it ever reaches a controller (a network drop
// mid-upload, a proxy/gateway error page in production) — `res.json()` on a
// non-JSON body throws, and an unhandled throw here would otherwise leave
// the caller's "submitting" state stuck with no error shown. Callers should
// use this instead of a bare `await res.json()` on an error response.
export const parseErrorMessage = async (res, fallback) => {
    try {
        const data = await res.json();
        return data.message || fallback;
    } catch {
        return fallback;
    }
};
