/**
 * Utilitários para manipulação segura de valores monetários
 */

/**
 * Converte um valor para número, garantindo que seja um valor monetário válido
 * @param value - Valor a ser convertido (number, string, ou qualquer tipo)
 * @returns Número válido ou 0 se inválido
 */
export const toSafeNumber = (value: any): number => {
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        // Remove caracteres não numéricos, exceto ponto e vírgula
        const cleanValue = value.replace(/[^\d.,-]/g, '');

        // Trata vírgula como separador decimal (padrão brasileiro)
        const normalizedValue = cleanValue.replace(',', '.');

        const parsed = parseFloat(normalizedValue);
        return !isNaN(parsed) && isFinite(parsed) ? parsed : 0;
    }

    return 0;
};

/**
 * Soma segura de valores monetários
 * @param values - Array de valores a serem somados
 * @returns Soma total dos valores válidos
 */
export const safeSumMoney = (values: any[]): number => {
    return values.reduce((total, value) => {
        return total + toSafeNumber(value);
    }, 0);
};

/**
 * Calcula a soma de uma propriedade específica de um array de objetos
 * @param items - Array de objetos
 * @param property - Nome da propriedade que contém o valor monetário
 * @returns Soma total dos valores válidos
 */
export const sumProperty = <T>(items: T[], property: keyof T): number => {
    return items.reduce((total, item) => {
        return total + toSafeNumber(item[property]);
    }, 0);
};

/**
 * Filtra e soma valores de pagamentos confirmados
 * @param payments - Array de pagamentos
 * @returns Soma total dos pagamentos confirmados
 */
export const sumConfirmedPayments = (payments: any[]): number => {
    return payments
        .filter(payment => payment.confirmed)
        .reduce((total, payment) => total + toSafeNumber(payment.amount), 0);
};
