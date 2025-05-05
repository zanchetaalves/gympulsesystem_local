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
  birthDate: dbClient.birth_date ? new Date(dbClient.birth_date) : new Date(),
  createdAt: new Date(dbClient.created_at),
  photoUrl: dbClient.photo_url || null,
});

export const appToDbClient = (client: Partial<Client>) => {
  // Simplify date handling by just sending the date string directly
  // This preserves the exact date without timezone adjustments
  let birthDateStr = null;
  if (client.birthDate) {
    if (client.birthDate instanceof Date) {
      // Format the date as YYYY-MM-DD
      const year = client.birthDate.getFullYear();
      const month = String(client.birthDate.getMonth() + 1).padStart(2, '0');
      const day = String(client.birthDate.getDate()).padStart(2, '0');
      birthDateStr = `${year}-${month}-${day}`;
    } else {
      birthDateStr = client.birthDate;
    }
  }

  return {
    name: client.name,
    cpf: client.cpf,
    email: client.email,
    phone: client.phone,
    address: client.address,
    birth_date: birthDateStr,
    photo_url: client.photoUrl,
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
      // Handle photo data if it exists (data URL format)
      let photoUrl = null;
      
      if (data.photoUrl && data.photoUrl.startsWith('data:image')) {
        try {
          // Convert base64 to blob
          const res = await fetch(data.photoUrl);
          const blob = await res.blob();
          
          // Generate a unique filename
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
          const filePath = `${fileName}.jpg`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('client-photos')
            .upload(filePath, blob, {
              contentType: 'image/jpeg',
            });
          
          if (uploadError) throw uploadError;
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('client-photos')
            .getPublicUrl(filePath);
            
          photoUrl = urlData.publicUrl;
        } catch (error: any) {
          console.error("Error uploading photo:", error);
          // Continue without the photo if there's an error
        }
      } else if (data.photoUrl) {
        // If it's already a URL, keep it
        photoUrl = data.photoUrl;
      }
      
      const dbData = appToDbClient({
        ...data,
        photoUrl
      });

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
      // Handle photo data if it exists and has changed (data URL format)
      let photoUrl = data.photoUrl;
      
      if (data.photoUrl && data.photoUrl.startsWith('data:image')) {
        try {
          // Convert base64 to blob
          const res = await fetch(data.photoUrl);
          const blob = await res.blob();
          
          // Generate a unique filename
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
          const filePath = `${fileName}.jpg`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('client-photos')
            .upload(filePath, blob, {
              contentType: 'image/jpeg',
            });
          
          if (uploadError) throw uploadError;
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('client-photos')
            .getPublicUrl(filePath);
            
          photoUrl = urlData.publicUrl;
        } catch (error: any) {
          console.error("Error uploading photo:", error);
          // Continue with the old photo if there's an error
        }
      }
      
      const dbData = {
        ...appToDbClient({
          ...data,
          photoUrl
        }),
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
