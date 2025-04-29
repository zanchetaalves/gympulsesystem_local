
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar planos: " + error.message,
          variant: "destructive",
        });
        throw error;
      }

      return (data || []).map(dbToAppPlan);
    },
  });

  // Mutation para criar plano
  const createPlan = useMutation({
    mutationFn: async (data: Partial<Plan>) => {
      const dbData = appToDbPlan(data);
      
      const { data: newPlan, error } = await supabase
        .from('plans')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;
      return dbToAppPlan(newPlan);
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
      
      const { data: updatedPlan, error } = await supabase
        .from('plans')
        .update(dbData)
        .eq('id', dbData.id)
        .select()
        .single();

      if (error) throw error;
      return dbToAppPlan(updatedPlan);
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
