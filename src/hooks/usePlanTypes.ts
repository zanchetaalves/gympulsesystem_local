import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface PlanType {
    id: string;
    name: string;
    description: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export const usePlanTypes = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // API helper function
    const apiCall = async (endpoint: string, options: RequestInit = {}) => {
        const token = localStorage.getItem('access_token');

        const response = await fetch(`http://localhost:3000/api${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }

        return response.json();
    };

    // Transform database format to app format
    const dbToAppPlanType = (dbPlanType: any): PlanType => ({
        id: dbPlanType.id,
        name: dbPlanType.name,
        description: dbPlanType.description || '',
        active: dbPlanType.active,
        createdAt: dbPlanType.created_at,
        updatedAt: dbPlanType.updated_at,
    });

    // Transform app format to database format
    const appToDbPlanType = (planType: Partial<PlanType>) => ({
        name: planType.name,
        description: planType.description,
        active: planType.active,
    });

    // Query for fetching plan types
    const {
        data: planTypes = [],
        isLoading,
        error
    } = useQuery({
        queryKey: ['plan-types'],
        queryFn: async () => {
            try {
                const result = await apiCall('/plan_types?orderBy=name&ascending=true');
                return (result.data || []).map(dbToAppPlanType);
            } catch (error) {
                console.error('Error fetching plan types:', error);
                toast({
                    title: "Erro",
                    description: "Erro ao carregar tipos de planos: " + (error as Error).message,
                    variant: "destructive",
                });
                return [];
            }
        },
    });

    // Mutation for creating plan types
    const createPlanType = useMutation({
        mutationFn: async (data: Partial<PlanType>) => {
            const dbData = appToDbPlanType(data);
            const result = await apiCall('/plan_types', {
                method: 'POST',
                body: JSON.stringify(dbData),
            });
            return dbToAppPlanType(result.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plan-types'] });
            toast({
                title: "Sucesso",
                description: "Tipo de plano criado com sucesso!",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro",
                description: "Erro ao criar tipo de plano: " + error.message,
                variant: "destructive",
            });
        },
    });

    // Mutation for updating plan types
    const updatePlanType = useMutation({
        mutationFn: async (data: Partial<PlanType> & { id: string }) => {
            const { id, ...updateData } = data;
            const dbData = appToDbPlanType(updateData);
            const result = await apiCall(`/plan_types/${id}`, {
                method: 'PUT',
                body: JSON.stringify(dbData),
            });
            return dbToAppPlanType(result.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plan-types'] });
            toast({
                title: "Sucesso",
                description: "Tipo de plano atualizado com sucesso!",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro",
                description: "Erro ao atualizar tipo de plano: " + error.message,
                variant: "destructive",
            });
        },
    });

    // Mutation for deleting plan types
    const deletePlanType = useMutation({
        mutationFn: async (id: string) => {
            const result = await apiCall(`/plan_types/${id}`, {
                method: 'DELETE',
            });
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plan-types'] });
            toast({
                title: "Sucesso",
                description: "Tipo de plano excluído com sucesso!",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro",
                description: "Erro ao excluir tipo de plano: " + error.message,
                variant: "destructive",
            });
        },
    });

    return {
        planTypes,
        isLoading,
        error,
        createPlanType,
        updatePlanType,
        deletePlanType,
    };
}; 