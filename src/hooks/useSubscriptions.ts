import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = 'http://localhost:3000/api';

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
export const dbToAppSubscription = (dbSubscription: any): Subscription => {
  console.log('🔍 [DEBUG] dbToAppSubscription - dados do banco:', {
    id: dbSubscription.id,
    plan_id: dbSubscription.plan_id,
    plan_type: dbSubscription.plan_type,
    plan_name: dbSubscription.plan_name
  });

  return {
    id: dbSubscription.id,
    clientId: dbSubscription.client_id,
    plan: dbSubscription.plan_type || "Plano não definido", // ✅ Usar plan_type do JOIN (Mensal, Anual, etc)
    planId: dbSubscription.plan_id, // ✅ Adicionar planId para referência
    startDate: new Date(dbSubscription.start_date),
    endDate: new Date(dbSubscription.end_date),
    active: dbSubscription.active ?? true,
    locked: dbSubscription.locked ?? false,
    lockDays: dbSubscription.lock_days || undefined,
  };
};

export const appToDbSubscription = (subscription: Partial<Subscription>) => {
  const result: any = {};

  if (subscription.clientId !== undefined) result.client_id = subscription.clientId;
  if (subscription.planId !== undefined) result.plan_id = subscription.planId;
  if (subscription.startDate !== undefined) {
    result.start_date = subscription.startDate instanceof Date
      ? subscription.startDate.toISOString().split('T')[0]
      : subscription.startDate;
  }
  if (subscription.endDate !== undefined) {
    result.end_date = subscription.endDate instanceof Date
      ? subscription.endDate.toISOString().split('T')[0]
      : subscription.endDate;
  }
  if (subscription.active !== undefined) result.active = subscription.active;
  if (subscription.locked !== undefined) result.locked = subscription.locked;
  if (subscription.lockDays !== undefined) result.lock_days = subscription.lockDays;

  return result;
};

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
      // 🔧 CORREÇÃO: API pode retornar {data: Array} em vez de Array direto
      const subscriptionsArray = Array.isArray(response) ? response : response?.data || [];
      return subscriptionsArray.map(dbToAppSubscription);
    },
  });

  // Mutation para criar matrícula
  const createSubscription = useMutation({
    mutationFn: async (data: any) => {
      // 🔧 CORREÇÃO: SubscriptionForm já envia no formato correto do banco
      console.log('🔍 [DEBUG] useSubscriptions - dados recebidos:', data);
      const response = await apiCall('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return dbToAppSubscription(response);
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
      return dbToAppSubscription(response);
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
