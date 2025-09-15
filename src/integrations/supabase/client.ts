
import type { Database } from './types';

// API base URL for the backend server
const API_BASE_URL = 'http://localhost:3001/api';

// HTTP client helper functions
const httpClient = {
    getAuthHeaders() {
        const token = localStorage.getItem('access_token');
        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
        };
    },

    async get(url: string) {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers: this.getAuthHeaders(),
        });
        return response.json();
    },

    async post(url: string, data: any) {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return response.json();
    },

    async put(url: string, data: any) {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return response.json();
    },

    async delete(url: string) {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
        });
        return response.json();
    }
};

// Mock Supabase-like interface for PostgreSQL via HTTP API
export const supabase = {
    // Authentication mock (for local development)
    auth: {
        getSession: async () => ({
            data: {
                session: {
                    user: { id: 'local-user', email: 'local@example.com' },
                    access_token: 'local-token'
                }
            },
            error: null
        }),
        signIn: async (credentials: any) => ({ data: { user: { id: 'local-user' } }, error: null }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: (callback: any) => ({
            data: { subscription: { unsubscribe: () => { } } }
        })
    },

    // Database operations
    from: (table: string) => ({
        select: (columns = '*') => ({
            order: (column: string, options: { ascending?: boolean } = {}) => ({
                async then(resolve: any) {
                    try {
                        const ascending = options.ascending ? 'true' : 'false';
                        const result = await httpClient.get(`/${table}?orderBy=${column}&ascending=${ascending}`);
                        resolve({ data: result.data, error: result.error || null });
                    } catch (error) {
                        resolve({ data: null, error });
                    }
                }
            })
        }),
        insert: (data: any) => ({
            select: () => ({
                single: async () => {
                    try {
                        const dataArray = Array.isArray(data) ? data : [data];
                        const insertData = dataArray[0];
                        const result = await httpClient.post(`/${table}`, insertData);
                        return { data: result.data, error: result.error || null };
                    } catch (error) {
                        return { data: null, error };
                    }
                }
            })
        }),
        update: (data: any) => ({
            eq: (column: string, value: any) => ({
                select: () => ({
                    single: async () => {
                        try {
                            const result = await httpClient.put(`/${table}/${value}`, data);
                            return { data: result.data, error: result.error || null };
                        } catch (error) {
                            return { data: null, error };
                        }
                    }
                })
            })
        }),
        delete: () => ({
            eq: (column: string, value: any) => ({
                execute: async () => {
                    try {
                        const result = await httpClient.delete(`/${table}/${value}`);
                        return { data: result.data, error: result.error || null };
                    } catch (error) {
                        return { data: null, error };
                    }
                }
            })
        })
    }),

    // RPC mock for stored procedures
    rpc: async (functionName: string, params: any = {}) => {
        try {
            const result = await httpClient.post(`/rpc/${functionName}`, params);
            return { data: result.data, error: result.error || null };
        } catch (error) {
            return { data: null, error };
        }
    }
};
