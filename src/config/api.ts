// Configuração da API para produção
const isDevelopment = import.meta.env.DEV;
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Sempre usa porta 3000 (desenvolvimento e produção)
export const API_BASE_URL = isDevelopment && isLocalhost
    ? 'http://localhost:3000/api'  // Desenvolvimento
    : `${window.location.origin}/api`;  // Produção (mesma porta)

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('access_token');

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            let errorMessage = 'Erro na requisição';

            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`;
            } catch {
                errorMessage = `Erro ${response.status}: ${response.statusText}`;
            }

            throw new Error(errorMessage);
        }

        return response.json();
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Erro de conexão com o servidor');
    }
};
