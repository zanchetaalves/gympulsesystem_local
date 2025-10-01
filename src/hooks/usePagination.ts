import { useState, useEffect, useMemo } from 'react';

interface UsePaginationProps<T> {
    data: T[];
    itemsPerPage?: number;
    dependencies?: any[]; // Para resetar paginação quando filtros mudam
}

interface UsePaginationReturn<T> {
    currentPage: number;
    totalPages: number;
    paginatedData: T[];
    startIndex: number;
    endIndex: number;
    setCurrentPage: (page: number) => void;
    goToNextPage: () => void;
    goToPreviousPage: () => void;
    canGoNext: boolean;
    canGoPrevious: boolean;
}

export function usePagination<T>({
    data,
    itemsPerPage = 6,
    dependencies = []
}: UsePaginationProps<T>): UsePaginationReturn<T> {
    const [currentPage, setCurrentPage] = useState(1);

    // Calcular valores derivados
    const totalPages = useMemo(() => Math.ceil(data.length / itemsPerPage), [data.length, itemsPerPage]);
    const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage]);
    const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex, itemsPerPage]);
    const paginatedData = useMemo(() => data.slice(startIndex, endIndex), [data, startIndex, endIndex]);

    // Controles de navegação
    const canGoNext = currentPage < totalPages;
    const canGoPrevious = currentPage > 1;

    const goToNextPage = () => {
        if (canGoNext) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const goToPreviousPage = () => {
        if (canGoPrevious) {
            setCurrentPage(prev => prev - 1);
        }
    };

    // Reset da paginação quando dependências mudam (filtros, busca, etc)
    useEffect(() => {
        setCurrentPage(1);
    }, dependencies);

    // Ajustar página atual se estiver fora do range válido
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    return {
        currentPage,
        totalPages,
        paginatedData,
        startIndex,
        endIndex,
        setCurrentPage,
        goToNextPage,
        goToPreviousPage,
        canGoNext,
        canGoPrevious,
    };
}
