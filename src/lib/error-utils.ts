// Utilitários para tratamento de erros

export interface ApiError {
    message: string;
    code?: string;
    details?: any;
}

export const getErrorMessage = (error: unknown): string => {
    if (!error) {
        return 'Erro desconhecido';
    }

    // Se é um erro do tipo Error
    if (error instanceof Error) {
        return error.message || 'Erro desconhecido';
    }

    // Se é um objeto com propriedade message
    if (typeof error === 'object' && error !== null) {
        const errorObj = error as any;

        // Verificar diferentes formatos de erro
        if (errorObj.message) {
            return String(errorObj.message);
        }

        if (errorObj.error) {
            return String(errorObj.error);
        }

        if (errorObj.msg) {
            return String(errorObj.msg);
        }

        // Erro do Supabase
        if (errorObj.code && errorObj.hint) {
            return `${errorObj.message || 'Erro de banco de dados'} (${errorObj.code})`;
        }

        // Se tem toString, usar
        if (errorObj.toString && typeof errorObj.toString === 'function') {
            const stringified = errorObj.toString();
            if (stringified !== '[object Object]') {
                return stringified;
            }
        }
    }

    // Se é string
    if (typeof error === 'string') {
        return error;
    }

    return 'Erro desconhecido';
};

export const createErrorHandler = (context: string) => {
    return (error: unknown): string => {
        const baseMessage = getErrorMessage(error);

        // Melhorar mensagens específicas
        const specificMessages: Record<string, string> = {
            'Network Error': 'Erro de conexão. Verifique sua internet.',
            'Failed to fetch': 'Erro de conexão com o servidor.',
            'Unauthorized': 'Acesso não autorizado. Faça login novamente.',
            'Forbidden': 'Você não tem permissão para esta ação.',
            'Not Found': 'Recurso não encontrado.',
            'Internal Server Error': 'Erro interno do servidor.',
            'duplicate key value': 'Este registro já existe.',
            'unique constraint': 'Este registro já existe.',
            'foreign key constraint': 'Não é possível excluir este registro pois está sendo usado em outro lugar.',
            'undefined': 'Dados inválidos. Verifique os campos preenchidos.'
        };

        // Verificar se a mensagem contém alguma das chaves
        for (const [key, specificMessage] of Object.entries(specificMessages)) {
            if (baseMessage.toLowerCase().includes(key.toLowerCase())) {
                return `${context}: ${specificMessage}`;
            }
        }

        return `${context}: ${baseMessage}`;
    };
};

export const formatDatabaseError = (error: any): string => {
    if (!error) return 'Erro de banco de dados desconhecido';

    // Erros comuns do PostgreSQL/Supabase
    if (error.code) {
        switch (error.code) {
            case '23505': // unique_violation
                return 'Este registro já existe. Verifique os dados duplicados.';
            case '23503': // foreign_key_violation
                return 'Não é possível excluir este registro pois está sendo usado em outro lugar.';
            case '23502': // not_null_violation
                return `Campo obrigatório não preenchido: ${error.column || 'campo desconhecido'}`;
            case '42P01': // undefined_table
                return 'Tabela não encontrada no banco de dados.';
            case '42703': // undefined_column
                return 'Campo não encontrado na tabela.';
            case 'PGRST116': // No rows found
                return 'Registro não encontrado.';
            default:
                return `Erro de banco de dados (${error.code}): ${error.message || 'erro desconhecido'}`;
        }
    }

    return getErrorMessage(error);
};


