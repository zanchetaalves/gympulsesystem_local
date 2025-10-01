
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Client } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { createErrorHandler, formatDatabaseError } from "@/lib/error-utils";

const API_BASE_URL = 'http://localhost:3000/api';

// HTTP client helper
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

// Adapter functions para converter entre os formatos do banco e da aplicação
export const dbToAppClient = (dbClient: any): Client => ({
  id: dbClient.id,
  name: dbClient.name,
  cpf: dbClient.cpf,
  email: dbClient.email,
  phone: dbClient.phone,
  address: dbClient.address,
  // Usar a data exata sem ajustes de timezone
  birthDate: dbClient.birth_date ? new Date(dbClient.birth_date) : new Date(),
  createdAt: new Date(dbClient.created_at),
  photoUrl: dbClient.photo_url || null,
  observations: dbClient.observations || null,
});

export const appToDbClient = (client: Partial<Client>) => {
  // Simplificamos o tratamento de datas para evitar problemas de timezone
  let birthDateStr = null;
  if (client.birthDate) {
    if (client.birthDate instanceof Date) {
      // Formato YYYY-MM-DD sem ajustes de timezone
      const year = client.birthDate.getFullYear();
      const month = String(client.birthDate.getMonth() + 1).padStart(2, '0');
      const day = String(client.birthDate.getDate()).padStart(2, '0');
      birthDateStr = `${year}-${month}-${day}`;
    } else {
      birthDateStr = client.birthDate;
    }
  }

  // Filtra campos undefined para evitar problemas no banco
  const result: any = {};

  if (client.name !== undefined) result.name = client.name;
  if (client.cpf !== undefined) result.cpf = client.cpf || null;
  if (client.email !== undefined) result.email = client.email || null;
  if (client.phone !== undefined) result.phone = client.phone;
  if (client.address !== undefined) result.address = client.address || null;
  if (birthDateStr !== null) result.birth_date = birthDateStr;
  if (client.photoUrl !== undefined) result.photo_url = client.photoUrl;
  if (client.observations !== undefined) result.observations = client.observations || null;
  if (client.createdAt !== undefined) {
    result.created_at = client.createdAt instanceof Date
      ? client.createdAt.toISOString()
      : client.createdAt;
  }

  return result;
};

export const useClients = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const handleError = createErrorHandler('Gestão de Clientes');

  // Query para buscar clientes
  const {
    data: clients = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        console.log('🔍 [DEBUG] Fazendo chamada para /clients...');
        const response = await apiCall('/clients');
        console.log('🔍 [DEBUG] Resposta da API /clients:', {
          response,
          responseType: typeof response,
          isArray: Array.isArray(response),
          length: response?.length,
          hasDataProperty: response?.data !== undefined,
          dataIsArray: Array.isArray(response?.data)
        });

        // 🔧 CORREÇÃO: API retorna {data: Array} em vez de Array direto
        let clientsArray;
        if (Array.isArray(response)) {
          clientsArray = response;
        } else if (response?.data && Array.isArray(response.data)) {
          console.log('🔍 [DEBUG] Usando response.data (formato {data: Array})');
          clientsArray = response.data;
        } else {
          console.warn('🔍 [DEBUG] Formato inesperado da API:', response);
          return [];
        }

        const mappedClients = clientsArray.map(dbToAppClient);
        console.log('🔍 [DEBUG] Clientes mapeados:', {
          mappedClients,
          mappedLength: mappedClients?.length,
          firstMapped: mappedClients[0]
        });

        return mappedClients;
      } catch (error) {
        console.error('🔍 [DEBUG] Erro na API /clients:', error);
        throw error;
      }
    },
  });

  // Mutation para criar cliente
  const createClient = useMutation({
    mutationFn: async (data: Partial<Client>) => {
      const dbData = appToDbClient(data);
      const response = await apiCall('/clients', {
        method: 'POST',
        body: JSON.stringify(dbData),
      });
      return dbToAppClient(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Sucesso",
        description: "Cliente cadastrado com sucesso!",
      });
    },
    onError: (error: any) => {
      const errorMessage = handleError(error);
      toast({
        title: "Erro ao Cadastrar Cliente",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar cliente
  const updateClient = useMutation({
    mutationFn: async (data: Partial<Client>) => {
      const dbData = appToDbClient(data);
      const response = await apiCall(`/clients/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(dbData),
      });
      return dbToAppClient(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      const errorMessage = handleError(error);
      toast({
        title: "Erro ao Atualizar Cliente",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir cliente
  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      console.log('Tentando excluir cliente com ID via API:', id);

      const response = await apiCall(`/clients/${id}`, {
        method: 'DELETE',
      });

      console.log('Cliente excluído com sucesso via API:', response);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove o cliente da cache local imediatamente
      queryClient.setQueryData(['clients'], (oldData: Client[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter(client => client.id !== deletedId);
      });

      // Invalida as queries para garantir sincronização
      queryClient.invalidateQueries({ queryKey: ['clients'] });

      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      const errorMessage = handleError(error);
      toast({
        title: "Erro ao Excluir Cliente",
        description: errorMessage,
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
