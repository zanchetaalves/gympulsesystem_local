
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Payment, PlanType } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Adapter functions para converter entre os formatos do banco e da aplicação
export const dbToAppPayment = (dbPayment: any): Payment => ({
  id: dbPayment.id,
  subscriptionId: dbPayment.subscription_id,
  paymentDate: new Date(dbPayment.payment_date),
  amount: dbPayment.amount,
  paymentMethod: dbPayment.payment_method,
  confirmed: dbPayment.confirmed ?? false,
});

export const appToDbPayment = (payment: Partial<Payment>) => ({
  subscription_id: payment.subscriptionId,
  payment_date: payment.paymentDate instanceof Date
    ? payment.paymentDate.toISOString().split('T')[0]
    : payment.paymentDate,
  amount: payment.amount,
  payment_method: payment.paymentMethod,
  confirmed: payment.confirmed
});

export const usePayments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar pagamentos
  const {
    data: payments = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          subscriptions:subscription_id (
            *,
            clients:client_id (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar pagamentos: " + error.message,
          variant: "destructive",
        });
        throw error;
      }

      return (data || []).map((dbPayment) => {
        const payment = dbToAppPayment(dbPayment);

        // Adicionar dados do cliente e matrícula para exibição
        if (dbPayment.subscriptions) {
          const subscription = dbPayment.subscriptions;
          payment.subscription = {
            id: subscription.id,
            clientId: subscription.client_id,
            plan: subscription.plan as PlanType, // Fixing the type here
            startDate: new Date(subscription.start_date),
            endDate: new Date(subscription.end_date),
            active: subscription.active
          };

          if (subscription.clients) {
            payment.client = {
              id: subscription.clients.id,
              name: subscription.clients.name,
              cpf: subscription.clients.cpf,
              email: subscription.clients.email,
              phone: subscription.clients.phone,
              address: subscription.clients.address,
              birthDate: new Date(subscription.clients.birth_date),
              createdAt: new Date(subscription.clients.created_at)
            };
          }
        }

        return payment;
      });
    },
  });

  // Mutation para criar pagamento
  const createPayment = useMutation({
    mutationFn: async (data: Partial<Payment>) => {
      console.log("Dados enviados para criação:", data);
      console.log("Dados formatados para DB:", appToDbPayment(data));
      
      const dbData = appToDbPayment(data);

      const { data: newPayment, error } = await supabase
        .from('payments')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar pagamento:", error);
        throw error;
      }
      return dbToAppPayment(newPayment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: "Sucesso",
        description: "Pagamento cadastrado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar pagamento: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar pagamento
  const updatePayment = useMutation({
    mutationFn: async (data: Partial<Payment>) => {
      const dbData = {
        ...appToDbPayment(data),
        id: data.id
      };

      const { data: updatedPayment, error } = await supabase
        .from('payments')
        .update(dbData)
        .eq('id', dbData.id)
        .select()
        .single();

      if (error) throw error;
      return dbToAppPayment(updatedPayment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: "Sucesso",
        description: "Pagamento atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar pagamento: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    payments,
    isLoading,
    error,
    createPayment,
    updatePayment
  };
};
