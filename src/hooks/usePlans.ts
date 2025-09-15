
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
const API_BASE_URL = 'http://localhost:3001/api';

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');
  
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
      errorMessage = errorData.error || errorData.message || `Erro ${response.status}`;
    } catch {
      errorMessage = `Erro ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};
import { Plan } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Adapter functions para converter entre os formatos do banco e da aplicação
export const dbToAppPlan = (dbPlan: any): Plan => ({
  id: dbPlan.id,
  name: dbPlan.name,
  type: dbPlan.type,
  priceBrl: dbPlan.price_brl,
  description: dbPlan.description,
  durationMonths: dbPlan.duration_months,
  active: dbPlan.active ?? true,
  color: getColorForPlanType(dbPlan.type),
});

export const appToDbPlan = (plan: Partial<Plan>) => ({
  name: plan.name,
  type: plan.type,
  price_brl: plan.priceBrl,
  description: plan.description,
  duration_months: plan.durationMonths,
  active: plan.active
});

// Helper function to get color based on plan type
const getColorForPlanType = (type: string): string => {
  switch (type) {
    case 'Mensal':
      return 'bg-blue-100 text-blue-800';
    case 'Trimestral':
      return 'bg-green-100 text-green-800';
    case 'Anual':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const usePlans = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar planos
  const {
    data: plans = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await apiCall('/plans');
      return response.data.map(dbToAppPlan);
    },
  });

  // Mutation para criar plano
  const createPlan = useMutation({
    mutationFn: async (data: Partial<Plan>) => {
      const dbData = appToDbPlan(data);

      const response = await apiCall('/plans', {
        method: 'POST',
        body: JSON.stringify(dbData),
      });
      return dbToAppPlan(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast({
        title: "Sucesso",
        description: "Plano cadastrado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar plano: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar plano
  const updatePlan = useMutation({
    mutationFn: async (data: Partial<Plan>) => {
      // Para atualizações, precisamos manter o ID
      const dbData = {
        ...appToDbPlan(data),
        id: data.id
      };

      const response = await apiCall(`/plans/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(dbData),
      });
      return dbToAppPlan(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast({
        title: "Sucesso",
        description: "Plano atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    plans,
    isLoading,
    error,
    createPlan,
    updatePlan
  };
};
