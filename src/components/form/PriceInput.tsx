import { forwardRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface PriceInputProps {
    label?: string;
    placeholder?: string;
    value?: string | number;
    onChange?: (value: number) => void;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    className?: string;
}

/**
 * Componente unificado para entrada de valores monetários
 * Aceita tanto strings com vírgula quanto números
 * Converte automaticamente para number
 */
// Formata o valor para exibição (número para string com vírgula)
const formatValueForDisplay = (val: string | number | undefined): string => {
    if (val === undefined || val === null || val === '') return '';

    const numVal = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
    if (isNaN(numVal) || numVal === 0) return '';

    // Formatar com vírgula como separador decimal (padrão brasileiro)
    return numVal.toString().replace('.', ',');
};

export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
    ({ label = "Valor (R$)", placeholder = "0,00", value, onChange, disabled, required, error, className }, ref) => {

        // Estado interno para controlar o que o usuário está digitando
        const [inputValue, setInputValue] = useState(() => formatValueForDisplay(value));
        const [isFocused, setIsFocused] = useState(false);

        // Sincronizar com o valor externo quando não estiver em foco
        useEffect(() => {
            if (!isFocused) {
                setInputValue(formatValueForDisplay(value));
            }
        }, [value, isFocused]);

        // Converte valor de entrada para número
        const parseValueToNumber = (inputValue: string): number => {
            if (!inputValue || inputValue.trim() === '') return 0;

            // Remove espaços e caracteres especiais, mantendo apenas dígitos, vírgula e ponto
            let cleanValue = inputValue.replace(/[^\d.,-]/g, '');

            // Se tiver vírgula, usar como separador decimal brasileiro
            if (cleanValue.includes(',')) {
                // Se tiver ponto e vírgula, considerar ponto como separador de milhares
                if (cleanValue.includes('.') && cleanValue.includes(',')) {
                    // Exemplo: 1.250,50 -> 1250.50
                    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
                } else {
                    // Apenas vírgula: 150,50 -> 150.50
                    cleanValue = cleanValue.replace(',', '.');
                }
            }
            // Se só tiver ponto, usar como separador decimal internacional

            const parsed = parseFloat(cleanValue);
            return !isNaN(parsed) && isFinite(parsed) ? parsed : 0;
        };

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;

            // Permite apenas números, vírgula, ponto e backspace
            const validInput = /^[\d.,]*$/.test(newValue);

            if (validInput || newValue === '') {
                setInputValue(newValue);
                const numericValue = parseValueToNumber(newValue);
                onChange?.(numericValue);
            }
        };

        const handleFocus = () => {
            setIsFocused(true);
            // Quando focar, mostrar o valor atual ou vazio se for zero
            const currentValue = formatValueForDisplay(value);
            setInputValue(currentValue === '0' ? '' : currentValue);
        };

        const handleBlur = () => {
            setIsFocused(false);
            // Quando perder foco, formatar o valor final
            const numericValue = parseValueToNumber(inputValue);
            const formattedValue = formatValueForDisplay(numericValue);
            setInputValue(formattedValue);
            onChange?.(numericValue);
        };

        return (
            <FormItem className={className}>
                <FormLabel>
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                            R$
                        </span>
                        <Input
                            ref={ref}
                            type="text"
                            placeholder={placeholder}
                            value={inputValue}
                            onChange={handleInputChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            disabled={disabled}
                            className="text-right pl-10"
                        />
                    </div>
                </FormControl>
                {error && <FormMessage>{error}</FormMessage>}
            </FormItem>
        );
    }
);

PriceInput.displayName = "PriceInput";

/**
 * Hook para uso em formulários com react-hook-form
 */
export const usePriceField = () => {
    return {
        // Validação para campos de preço
        validation: {
            required: "Valor é obrigatório",
            min: {
                value: 0,
                message: "Valor deve ser maior que zero"
            },
            validate: (value: any) => {
                const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
                if (isNaN(num)) return "Valor deve ser um número válido";
                if (num < 0) return "Valor deve ser maior que zero";
                return true;
            }
        },

        // Transformação para o schema zod
        zodTransform: (val: string | number) => {
            if (typeof val === 'number') return val;
            const num = parseFloat(String(val).replace(',', '.'));
            if (isNaN(num)) throw new Error("Valor deve ser um número válido");
            return num;
        }
    };
};
