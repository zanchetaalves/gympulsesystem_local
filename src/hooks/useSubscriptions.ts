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
import { Subscription } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Adapter functions para converter entre os formatos do banco e da aplicação
export const dbToAppSubscription = (dbSubscription: any): Subscription => ({
  id: dbSubscription.id,
  clientId: dbSubscription.client_id,
  plan: dbSubscription.plan,
  startDate: new Date(dbSubscription.start_date),
  endDate: new Date(dbSubscription.end_date),
  active: dbSubscription.active ?? true,
});

export const appToDbSubscription = (subscription: Partial<Subscription>) => ({
  client_id: subscription.clientId,
  plan: subscription.plan,
  start_date: subscription.startDate instanceof Date
    ? subscription.startDate.toISOString().split('T')[0]
    : subscription.startDate,
  end_date: subscription.endDate instanceof Date
    ? subscription.endDate.toISOString().split('T')[0]
    : subscription.endDate,
  active: subscription.active
});

export const useSubscriptions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar matrículas
  const {
    data: subscriptions = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const response = await apiCall('/subscriptions');
      return response.data.map(dbToAppSubscription);
    },
  });

  // Mutation para criar matrícula
  const createSubscription = useMutation({
    mutationFn: async (data: Partial<Subscription>) => {
      const dbData = appToDbSubscription(data);
      const response = await apiCall('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(dbData),
      });
      return dbToAppSubscription(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: "Sucesso",
        description: "Matrícula cadastrada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar matrícula: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar matrícula
  const updateSubscription = useMutation({
    mutationFn: async (data: Partial<Subscription>) => {
      const dbData = {
        ...appToDbSubscription(data),
        id: data.id
      };

      const response = await apiCall(`/subscriptions/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(dbData),
      });
      return dbToAppSubscription(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: "Sucesso",
        description: "Matrícula atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar matrícula: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    subscriptions,
    isLoading,
    error,
    createSubscription,
    updateSubscription
  };
};
