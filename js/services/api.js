const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://path2profession.onrender.com/api';

/**
 * Robust Fetch Helper: Ensures JSON responses and handles Render cold starts/errors.
 */
async function fetchJSON(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    
    // Default headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Support for FormData (e.g., file uploads)
    if (options.body instanceof FormData) {
        delete headers['Content-Type']; // Browser will set it correctly with boundary
    }

    try {
        const res = await fetch(url, { ...options, headers });
        
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || `Request failed with status ${res.status}`);
            return data;
        } else {
            const text = await res.text();
            console.error('[API ERROR] Non-JSON Response:', text);
            
            if (res.status === 404) throw new Error('API Route not found. The backend server might be misconfigured.');
            if (res.status === 503 || text.includes('starting up')) throw new Error('Server is warming up (Cold Start). Please try again in 30 seconds.');
            
            throw new Error(`Server Error (${res.status}): The backend returned a non-JSON response.`);
        }
    } catch (err) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
            console.error('[API ERROR] Network/CORS Error:', err);
            throw new Error('Could not connect to the backend server. Check your internet or if the Render backend is live.');
        }
        throw err;
    }
}

const api = {
    // Auth Services
    auth: {
        login: async (email, password) => {
            return fetchJSON('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
        },

        register: async (email, password, displayName) => {
            return fetchJSON('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password, displayName })
            });
        },

        verifyOTP: async (email, otp) => {
            return fetchJSON('/auth/verify-otp', {
                method: 'POST',
                body: JSON.stringify({ email, otp })
            });
        },

        getUser: async () => {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No token found');
            return fetchJSON('/auth/user', {
                headers: { 'x-auth-token': token }
            });
        },

        googleLogin: async (idToken) => {
            return fetchJSON('/auth/google', {
                method: 'POST',
                body: JSON.stringify({ idToken })
            });
        },

        getConfig: async () => {
            return fetchJSON('/auth/config');
        }
    },

    // Resume Services
    resume: {
        get: async () => {
            const token = localStorage.getItem('token');
            return fetchJSON('/resume', {
                headers: { 'x-auth-token': token }
            });
        },

        save: async (resumeData) => {
            const token = localStorage.getItem('token');
            return fetchJSON('/resume', {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: JSON.stringify(resumeData)
            });
        },

        generate: async (formData) => {
            const token = localStorage.getItem('token');
            return fetchJSON('/resume/generate', {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: JSON.stringify(formData)
            });
        },

        upload: async (file) => {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('resume', file);
            return fetchJSON('/resume/upload', {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: formData
            });
        },

        delete: async (id) => {
            const token = localStorage.getItem('token');
            return fetchJSON(`/resume/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
        },

        getSelfIntro: async (resumeData) => {
            const token = localStorage.getItem('token');
            return fetchJSON('/resume/self-intro', {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: JSON.stringify({ resumeData })
            });
        },

        getLinkedInOptimization: async (resumeData) => {
            const token = localStorage.getItem('token');
            return fetchJSON('/resume/linkedin-optimization', {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: JSON.stringify({ resumeData })
            });
        },

        getColdEmailTemplates: async (resumeData) => {
            const token = localStorage.getItem('token');
            return fetchJSON('/resume/cold-email', {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: JSON.stringify({ resumeData })
            });
        },

        getATSHeatmap: async (resumeData) => {
            const token = localStorage.getItem('token');
            return fetchJSON('/resume/ats-heatmap', {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: JSON.stringify({ resumeData })
            });
        }
    },

    // Jobs Services
    jobs: {
        getAll: async () => {
            const token = localStorage.getItem('token');
            return fetchJSON('/jobs', {
                headers: { 'x-auth-token': token }
            });
        },

        create: async (jobData) => {
            const token = localStorage.getItem('token');
            return fetchJSON('/jobs', {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: JSON.stringify(jobData)
            });
        },

        update: async (id, jobData) => {
            const token = localStorage.getItem('token');
            return fetchJSON(`/jobs/${id}`, {
                method: 'PUT',
                headers: { 'x-auth-token': token },
                body: JSON.stringify(jobData)
            });
        },

        delete: async (id) => {
            const token = localStorage.getItem('token');
            return fetchJSON(`/jobs/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
        }
    },

    // Chat Services
    chat: {
        send: async (message, context = 'general') => {
            const token = localStorage.getItem('token');
            const options = {
                method: 'POST',
                body: JSON.stringify({ message, context })
            };
            if (token) options.headers = { 'x-auth-token': token };
            return fetchJSON('/chat', options);
        }
    },

    // Job Search Services (Real-time API)
    jobSearch: {
        search: async (keywords, location, page = 1) => {
            const params = new URLSearchParams({ keywords, location, page });
            return fetchJSON(`/jobsearch?${params.toString()}`);
        }
    }
};

export default api;
