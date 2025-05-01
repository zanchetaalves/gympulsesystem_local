import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          clients:client_id (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar matrículas: " + error.message,
          variant: "destructive",
        });
        throw error;
      }

      return (data || []).map(dbSubscription => {
        const subscription = dbToAppSubscription(dbSubscription);
        
        // Add client data if available
        if (dbSubscription.clients) {
          subscription.client = {
            id: dbSubscription.clients.id,
            name: dbSubscription.clients.name,
            cpf: dbSubscription.clients.cpf,
            email: dbSubscription.clients.email,
            phone: dbSubscription.clients.phone,
            address: dbSubscription.clients.address,
            birthDate: new Date(dbSubscription.clients.birth_date),
            createdAt: new Date(dbSubscription.clients.created_at)
          };
        }
        
        return subscription;
      });
    },
  });

  // Mutation para criar matrícula
  const createSubscription = useMutation({
    mutationFn: async (data: Partial<Subscription>) => {
      const dbData = appToDbSubscription(data);

      const { data: newSubscription, error } = await supabase
        .from('subscriptions')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;
      return dbToAppSubscription(newSubscription);
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

      const { data: updatedSubscription, error } = await supabase
        .from('subscriptions')
        .update(dbData)
        .eq('id', dbData.id)
        .select()
        .single();

      if (error) throw error;
      return dbToAppSubscription(updatedSubscription);
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
