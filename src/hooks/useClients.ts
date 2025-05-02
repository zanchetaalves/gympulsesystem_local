import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Adapter functions para converter entre os formatos do banco e da aplicação
export const dbToAppClient = (dbClient: any): Client => ({
  id: dbClient.id,
  name: dbClient.name,
  cpf: dbClient.cpf,
  email: dbClient.email,
  phone: dbClient.phone,
  address: dbClient.address,
  birthDate: new Date(dbClient.birth_date),
  createdAt: new Date(dbClient.created_at),
});

export const appToDbClient = (client: Partial<Client>) => {
  // Ajusta o fuso horário para UTC-4 para evitar problemas de data
  let birthDateIso = null;
  if (client.birthDate) {
    if (client.birthDate instanceof Date) {
      const year = client.birthDate.getFullYear();
      const month = client.birthDate.getMonth();
      const day = client.birthDate.getDate();
      birthDateIso = new Date(Date.UTC(year, month, day, 4, 0, 0)).toISOString().split('T')[0];
    } else {
      birthDateIso = client.birthDate;
    }
  }

  return {
    name: client.name,
    cpf: client.cpf,
    email: client.email,
    phone: client.phone,
    address: client.address,
    birth_date: birthDateIso,
    created_at: client.createdAt instanceof Date
      ? client.createdAt.toISOString()
      : client.createdAt,
  };
};

export const useClients = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar clientes
  const {
    data: clients = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar clientes: " + error.message,
          variant: "destructive",
        });
        throw error;
      }

      return (data || []).map(dbToAppClient);
    },
  });

  // Mutation para criar cliente
  const createClient = useMutation({
    mutationFn: async (data: Partial<Client>) => {
      const dbData = appToDbClient(data);

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;
      return dbToAppClient(newClient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Sucesso",
        description: "Cliente cadastrado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar cliente: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar cliente
  const updateClient = useMutation({
    mutationFn: async (data: Partial<Client>) => {
      const dbData = {
        ...appToDbClient(data),
        id: data.id
      };

      const { data: updatedClient, error } = await supabase
        .from('clients')
        .update(dbData)
        .eq('id', dbData.id)
        .select()
        .single();

      if (error) throw error;
      return dbToAppClient(updatedClient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar cliente: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir cliente
  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao excluir cliente: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    clients,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient
  };
};
